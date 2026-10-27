// KS_WEBSITE_KB_v1 - Maya, the website's assistant for prospects (served by KS-Ops: src/assistant/sales.ts there).
// A button in the corner opens a panel (full screen on phones). Maya answers from the live plan catalogue, the public
// help articles and this page, links the articles it used, and offers next steps: try the demo, sign up, see pricing,
// book a live demo or talk to a person. The last two open a short form (name, email, brokerage, team size, optional
// phone, a consent box) that sends the lead to the team. No cookies: the conversation stays in this tab only, and the
// panel sits above any cookie banner (it moves up by --cookie-banner-height when one is shown).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { CHAT_KEY, CONSENT_TEXT, sendChat, sendLead, TEAM_SIZES, type Action, type Citation, type Turn } from "../lib/assistant";
import { rememberDemoContact } from "../lib/prefill";
import { load, save } from "../lib/storage";

type Shown = Turn & { citations?: Citation[]; actions?: Action[] };
type Wants = "live_demo" | "person";

/** **bold** and [text](/path) only; everything else is plain text. */
function Rich({ text }: { text: string }) {
  const out: Array<string | JSX.Element> = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/[A-Za-z0-9/_-]*|https:\/\/[^\s)]+)\)/g;
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[3]?.startsWith("/")) out.push(<Link key={k++} to={m[3]}>{m[2]}</Link>);
    else out.push(<a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function LeadForm({ wants, transcript, onDone, onCancel }: { wants: Wants; transcript: Turn[]; onDone: (msg: string) => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: "", email: "", brokerage: "", team_size: "", phone: "", message: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errs.email = "Enter a valid email address";
    if (!f.brokerage.trim()) errs.brokerage = "Enter your brokerage's name";
    if (!f.team_size) errs.team_size = "Choose your team size";
    if (!f.consent) errs.consent = "Tick the box so we can contact you";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const r = await sendLead({ ...f, wants, transcript });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    rememberDemoContact({ name: f.name.trim(), email: f.email.trim(), company: f.brokerage.trim(), phone: f.phone.trim() });
    onDone(r.message);
  };
  const err = (k: string) => (errors[k] ? <span className="field-error" id={`ka-${k}-err`}>{errors[k]}</span> : null);
  const inv = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `ka-${k}-err` } : {});

  return (
    <form className="ka-lead" onSubmit={(e) => void submit(e)} noValidate aria-label={wants === "live_demo" ? "Book a live demo" : "Talk to a person"}>
      <p className="ka-lead__intro">{wants === "live_demo" ? "Tell us where to reach you and we'll set up a live demo." : "Tell us where to reach you and someone from the team will get back to you."}</p>
      <div className="field"><label htmlFor="ka-name">Your name</label><input id="ka-name" type="text" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} {...inv("name")} />{err("name")}</div>
      <div className="field"><label htmlFor="ka-email">Work email</label><input id="ka-email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} {...inv("email")} />{err("email")}</div>
      <div className="field"><label htmlFor="ka-brokerage">Brokerage</label><input id="ka-brokerage" type="text" autoComplete="organization" value={f.brokerage} onChange={(e) => set("brokerage", e.target.value)} {...inv("brokerage")} />{err("brokerage")}</div>
      <div className="field">
        <label htmlFor="ka-size">Team size</label>
        <select id="ka-size" value={f.team_size} onChange={(e) => set("team_size", e.target.value)} {...inv("team_size")}>
          <option value="">Choose</option>
          {TEAM_SIZES.map((s) => <option key={s} value={s}>{s === "1" ? "Just me" : `${s} people`}</option>)}
        </select>
        {err("team_size")}
      </div>
      <div className="field"><label htmlFor="ka-phone">Phone (optional)</label><input id="ka-phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} {...inv("phone")} />{err("phone")}</div>
      <div className="field"><label htmlFor="ka-msg">Anything we should know? (optional)</label><textarea id="ka-msg" value={f.message} maxLength={2000} onChange={(e) => set("message", e.target.value)} /></div>
      <div className="field ka-consent">
        <label><input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} {...inv("consent")} /> {CONSENT_TEXT}</label>
        {err("consent")}
      </div>
      {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
      <div className="ka-row">
        <button type="submit" className="btn" disabled={busy}>{busy ? "Sending…" : "Send"}</button>
        <button type="button" className="btn btn--quiet" onClick={onCancel}>Back to chat</button>
      </div>
    </form>
  );
}

export function SalesAssistant() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Shown[]>(() => {
    const saved = load<Shown[]>(CHAT_KEY);
    return Array.isArray(saved) ? saved.slice(-30) : [];
  });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<Wants | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => save(CHAT_KEY, turns), [turns]);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [open, turns.length, lead]);
  useEffect(() => {
    if (open && !lead) inputRef.current?.focus();
  }, [open, lead]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const plain = (): Turn[] => turns.map(({ role, text: t }) => ({ role, text: t }));

  const ask = async (e?: FormEvent) => {
    e?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    const next: Shown[] = [...turns, { role: "user", text: q }];
    setTurns(next);
    setText("");
    setError(null);
    setBusy(true);
    const r = await sendChat(next.map(({ role, text: t }) => ({ role, text: t })), pathname);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setTurns([...next, { role: "assistant", text: r.reply.answer, citations: r.reply.citations, actions: r.reply.actions }]);
  };

  const act = (a: Action) => {
    if (a.kind === "book_demo") setLead("live_demo");
    else if (a.kind === "talk_to_person") setLead("person");
    else setOpen(false);
  };

  return (
    <div className="ka">
      {open && (
        <section className="ka-panel" role="dialog" aria-modal="false" aria-labelledby="ka-title">
          <header className="ka-panel__head">
            <h2 id="ka-title">Ask Maya</h2>
            <button type="button" className="btn btn--quiet ka-close" onClick={() => setOpen(false)}>Close</button>
          </header>
          <div className="ka-body" role="log" aria-live="polite">
            {turns.length === 0 && !lead && (
              <p className="ka-hello">Hi, I'm Maya. Ask me about {PRODUCT_NAME}'s features, plans and prices (in CAD), trials, security and where your data is kept.</p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`ka-msg ka-msg--${t.role}`} data-testid={t.role === "user" ? "ka-question" : "ka-answer"}>
                <p><Rich text={t.text} /></p>
                {t.citations && t.citations.length > 0 && (
                  <div className="ka-cites">
                    <span>From our help articles:</span>
                    <ul>{t.citations.map((c) => <li key={c.slug}><Link to={c.url}>{c.title}</Link></li>)}</ul>
                  </div>
                )}
                {t.actions && t.actions.length > 0 && (
                  <div className="ka-actions">
                    {t.actions.map((a) =>
                      a.href ? (
                        <Link key={a.kind} className="btn btn--ghost" to={a.href} onClick={() => act(a)}>{a.label}</Link>
                      ) : (
                        <button key={a.kind} type="button" className="btn btn--ghost" onClick={() => act(a)}>{a.label}</button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && <p className="ka-msg ka-msg--assistant">Maya is typing…</p>}
            {error && <p className="field-error" role="alert">{error}</p>}
            {thanks && <p className="ka-thanks" role="status">{thanks}</p>}
            {lead && (
              <LeadForm wants={lead} transcript={plain()} onCancel={() => setLead(null)} onDone={(m) => { setThanks(m); setLead(null); }} />
            )}
            <div ref={endRef} />
          </div>
          {!lead && (
            <>
              <form className="ka-ask" onSubmit={(e) => void ask(e)}>
                <label htmlFor="ka-input" className="visually-hidden">Your question</label>
                <input id="ka-input" ref={inputRef} type="text" value={text} maxLength={1000} placeholder="Ask a question" onChange={(e) => setText(e.target.value)} />
                <button type="submit" className="btn" disabled={busy || !text.trim()}>Send</button>
              </form>
              <div className="ka-quick">
                <button type="button" className="btn btn--quiet" onClick={() => setLead("live_demo")}>Book a live demo</button>
                <button type="button" className="btn btn--quiet" onClick={() => setLead("person")}>Talk to a person</button>
              </div>
            </>
          )}
        </section>
      )}
      {!open && (
        <button type="button" className="btn ka-launch" onClick={() => setOpen(true)} aria-haspopup="dialog">
          Questions? Ask Maya
        </button>
      )}
    </div>
  );
}
