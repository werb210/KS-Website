// KS_WEBSITE_ROADMAP_v1 - the public roadmap: what brokers asked for, what's planned, what's being built and what
// shipped, with a +1 on each open item and a form to suggest a feature. Everything comes from KS-Ops; ideas are reviewed
// by the Keystone team before they appear, and only the idea is ever shown (never who sent or voted for it).
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { fetchRoadmap, suggestFeature, voteRoadmap, type RoadmapItem, type RoadmapStatus } from "../lib/api";
import { loadLocal, saveLocal } from "../lib/storage";

export const ROADMAP_GROUPS: Array<{ status: RoadmapStatus; title: string; intro: string }> = [
  { status: "in_progress", title: "Working on it", intro: "Being built now." },
  { status: "planned", title: "Planned", intro: "We've decided to build these." },
  { status: "requested", title: "Requested by brokers", intro: "+1 the ones you want most. Votes help decide what comes next." },
  { status: "shipped", title: "Shipped", intro: "Available now." },
];

/** Per-browser: a random id for +1s, and which items this browser has voted for. Never sent with anything personal. */
const VOTER_KEY = "ks-roadmap-voter";
const VOTED_KEY = "ks-roadmap-voted";

function voterId(): string {
  const have = loadLocal<string>(VOTER_KEY);
  if (have && /^[A-Za-z0-9_-]{16,80}$/.test(have)) return have;
  const bytes = new Uint8Array(16);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const id = `v-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  saveLocal(VOTER_KEY, id);
  return id;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Form = { title: string; details: string; name: string; email: string; brokerage: string; website_url: string };

export const IDEA_CONSENT =
  "I agree that Keystone may store these details and email me about this idea. My name and email are never shown publicly.";

function SuggestForm() {
  const [f, setF] = useState<Form>({ title: "", details: "", name: "", email: "", brokerage: "", website_url: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.title.trim()) errs.title = "Say what you'd like the system to do.";
    if (!f.name.trim()) errs.name = "Enter your name.";
    if (!EMAIL_RE.test(f.email.trim())) errs.email = "Enter an email address like name@company.com.";
    if (!consent) errs.consent = "Tick the box so we can store your idea and reply to you.";
    if (TURNSTILE_SITE_KEY && !token) errs.turnstile_token = "Complete the security check.";
    setErrors(errs);
    setFailure("");
    if (Object.keys(errs).length) return;
    setState("sending");
    const res = await suggestFeature({
      title: f.title.trim(),
      ...(f.details.trim() ? { details: f.details.trim() } : {}),
      name: f.name.trim(),
      email: f.email.trim(),
      ...(f.brokerage.trim() ? { brokerage: f.brokerage.trim() } : {}),
      consent: true,
      website_url: f.website_url,
      turnstile_token: token || undefined,
    });
    if (res.ok) {
      setMessage(res.message);
      setState("sent");
      return;
    }
    setErrors(res.errors);
    setFailure(res.message);
    setState("idle");
    setToken("");
    setResetKey((n) => n + 1);
  }

  if (state === "sent") {
    return (
      <div className="alert alert--info" role="status" data-testid="idea-sent">
        <p>
          <strong>{message}</strong>
        </p>
      </div>
    );
  }
  const err = (k: string) => (errors[k] ? <span className="field-error" id={`r-${k}-e`}>{errors[k]}</span> : null);
  const a11y = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `r-${k}-e` : undefined });
  return (
    <form onSubmit={onSubmit} noValidate className="panel" aria-label="Suggest a feature">
      {failure && (
        <div className="alert alert--error" role="alert">
          {failure}
        </div>
      )}
      <div className="field">
        <label htmlFor="r-title">Your idea</label>
        <span className="hint">One line, like "Hold music for callers waiting on the main line".</span>
        <input id="r-title" type="text" maxLength={140} value={f.title} onChange={set("title")} {...a11y("title")} />
        {err("title")}
      </div>
      <div className="field">
        <label htmlFor="r-details">How would it help your brokerage? (optional)</label>
        <textarea id="r-details" rows={3} maxLength={3000} value={f.details} onChange={set("details")} />
      </div>
      <div className="row-2">
        <div className="field">
          <label htmlFor="r-name">Your name</label>
          <input id="r-name" type="text" autoComplete="name" maxLength={120} value={f.name} onChange={set("name")} {...a11y("name")} />
          {err("name")}
        </div>
        <div className="field">
          <label htmlFor="r-email">Work email</label>
          <input id="r-email" type="email" autoComplete="email" maxLength={200} value={f.email} onChange={set("email")} {...a11y("email")} />
          {err("email")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="r-brokerage">Brokerage (optional)</label>
        <input id="r-brokerage" type="text" autoComplete="organization" maxLength={160} value={f.brokerage} onChange={set("brokerage")} />
      </div>
      <div className="field">
        <label className="check" htmlFor="r-consent" style={{ fontWeight: 400 }}>
          <input id="r-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} {...a11y("consent")} />
          <span>{IDEA_CONSENT}</span>
        </label>
        {err("consent")}
      </div>
      <Turnstile onToken={setToken} resetKey={resetKey} />
      {errors.turnstile_token && <span className="field-error">{errors.turnstile_token}</span>}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="r-website-url">Leave this empty</label>
        <input id="r-website-url" type="text" tabIndex={-1} autoComplete="off" value={f.website_url} onChange={set("website_url")} />
      </div>
      <button className="btn" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send my idea"}
      </button>
      <p className="small muted" style={{ marginTop: "0.75rem" }}>
        The {PRODUCT_NAME} team reads every idea before it appears here. See our <Link to="/privacy">privacy policy</Link>.
      </p>
    </form>
  );
}

function VoteButton({ item, voted, onVote }: { item: RoadmapItem; voted: boolean; onVote: (on: boolean) => void }) {
  return (
    <button
      type="button"
      className={`vote${voted ? " vote--on" : ""}`}
      aria-pressed={voted}
      aria-label={`${voted ? "Remove your +1 for" : "+1"} ${item.title} (${item.votes} ${item.votes === 1 ? "vote" : "votes"})`}
      onClick={() => onVote(!voted)}
    >
      <span aria-hidden="true" className="vote__plus">+1</span>
      <span aria-hidden="true" className="vote__count">{item.votes}</span>
    </button>
  );
}

export default function Roadmap() {
  usePageMeta(
    "Roadmap",
    `What brokers have asked ${PRODUCT_NAME} for, what's planned, what's being built and what shipped. +1 the ideas you want, or suggest your own.`,
    "/roadmap",
  );
  const [items, setItems] = useState<RoadmapItem[] | null | "loading">("loading");
  const [voted, setVoted] = useState<string[]>(() => loadLocal<string[]>(VOTED_KEY) ?? []);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    void fetchRoadmap(ac.signal).then((r) => {
      if (!ac.signal.aborted) setItems(r);
    });
    return () => ac.abort();
  }, []);

  async function vote(item: RoadmapItem, on: boolean) {
    setNotice("");
    const n = await voteRoadmap(item.id, voterId(), on);
    if (n === null) {
      setNotice("Your +1 didn't go through. Try again in a minute.");
      return;
    }
    setItems((prev) => (Array.isArray(prev) ? prev.map((x) => (x.id === item.id ? { ...x, votes: n } : x)) : prev));
    setVoted((prev) => {
      const next = on ? [...new Set([...prev, item.id])] : prev.filter((id) => id !== item.id);
      saveLocal(VOTED_KEY, next);
      return next;
    });
  }

  const list = Array.isArray(items) ? items : [];
  return (
    <>
      <div className="wrap page-head">
        <h1>Roadmap</h1>
        <p className="lede">
          {PRODUCT_NAME} is built with the brokers who use it. See what's being built, +1 what you want next, and tell us
          what's missing.
        </p>
        <div className="actions">
          <a className="btn" href="#suggest">
            Suggest a feature
          </a>{" "}
          <Link className="btn btn--quiet" to="/beta">
            Join the beta programme
          </Link>
        </div>
      </div>

      <div className="wrap">
        {items === "loading" && <p aria-busy="true" className="muted">Loading the roadmap…</p>}
        {items === null && (
          <div className="callout" role="status">
            <p>The roadmap can't be loaded right now. You can still suggest a feature below.</p>
          </div>
        )}
        {notice && (
          <p className="alert alert--error" role="alert">
            {notice}
          </p>
        )}
        {Array.isArray(items) && (
          <div className="roadmap" data-testid="roadmap">
            {ROADMAP_GROUPS.map((g) => {
              const group = list.filter((i) => i.status === g.status);
              return (
                <section key={g.status} className={`roadmap__col roadmap__col--${g.status}`} aria-labelledby={`rm-${g.status}`}>
                  <h2 id={`rm-${g.status}`}>
                    {g.title} <span className="roadmap__n">{group.length}</span>
                  </h2>
                  <p className="small muted">{g.intro}</p>
                  {group.length === 0 ? (
                    <p className="small muted roadmap__empty">Nothing here yet.</p>
                  ) : (
                    <ul className="roadmap__list">
                      {group.map((i) => (
                        <li key={i.id} className="roadmap__item">
                          <div>
                            <h3>{i.title}</h3>
                            {i.summary && <p>{i.summary}</p>}
                            {i.area && <span className="tag">{i.area}</span>}
                          </div>
                          {i.status !== "shipped" && <VoteButton item={i} voted={voted.includes(i.id)} onVote={(on) => void vote(i, on)} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      <section className="section" id="suggest" aria-labelledby="suggest-h">
        <div className="wrap wrap--narrow">
          <h2 id="suggest-h">Suggest a feature</h2>
          <p>
            Tell us what would make your brokerage run better. We review every idea; good ones go on the roadmap for other
            brokers to +1, and we email you when it moves.
          </p>
          <SuggestForm />
        </div>
      </section>
    </>
  );
}
