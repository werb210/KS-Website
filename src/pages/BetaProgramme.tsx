// KS_WEBSITE_BETA_v1 - the beta programme: what it is, and a sign-up form that goes to KS-Ops (which records it and
// passes it to the CRM). Customers already on the product join individual betas from their portal's Labs page.
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { joinBetaProgramme } from "../lib/api";

/** The interests offered on the form (keys must match KS-Ops BETA_INTERESTS). */
export const BETA_INTERESTS: Array<[string, string]> = [
  ["ai_assistant", "AI assistant"],
  ["lender_matching", "Lender matching"],
  ["mobile_apps", "Mobile apps"],
  ["fraud_protection", "Fraud protection"],
  ["integrations", "Integrations"],
  ["reporting", "Reporting"],
  ["other", "Something else"],
];

const POINTS: Array<[string, string]> = [
  ["Early access", "Use new features before they are released to everyone."],
  ["Shape the product", "Your feedback goes straight to the team building it, and it changes what we ship."],
  ["Switch it off any time", "A beta is opt-in. Your administrator can leave it whenever they like, and everything else keeps working."],
  ["Things may change", "Betas are still being finished. They can change, move or be withdrawn before they are released."],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Form = { name: string; email: string; brokerage: string; message: string; website_url: string };

export default function BetaProgramme() {
  usePageMeta(
    "Beta programme",
    `Join the ${PRODUCT_NAME} beta programme: try new features early, help shape them, and switch them off any time.`,
    "/beta",
  );
  const [f, setF] = useState<Form>({ name: "", email: "", brokerage: "", message: "", website_url: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (key: string) => setInterests((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Enter your name.";
    if (!EMAIL_RE.test(f.email.trim())) errs.email = "Enter an email address like name@company.com.";
    if (!f.brokerage.trim()) errs.brokerage = "Enter your brokerage's name.";
    if (TURNSTILE_SITE_KEY && !token) errs.turnstile_token = "Complete the security check.";
    setErrors(errs);
    setFailure("");
    if (Object.keys(errs).length) return;
    setState("sending");
    const res = await joinBetaProgramme({
      name: f.name.trim(),
      email: f.email.trim(),
      brokerage: f.brokerage.trim(),
      interests,
      ...(f.message.trim() ? { message: f.message.trim() } : {}),
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

  return (
    <>
      <div className="wrap wrap--narrow page-head">
        <h1>Beta programme</h1>
        <p className="lede">
          We build {PRODUCT_NAME} with the brokers who use it. Join the beta programme to try new features first and tell
          us what would make them better.
        </p>
      </div>
      <div className="wrap wrap--narrow">
        <ul className="try-steps" aria-label="How the beta programme works">
          {POINTS.map(([title, text]) => (
            <li key={title}>
              <strong>{title}.</strong> {text}
            </li>
          ))}
        </ul>
        <p>
          Already a customer? Your administrator can join open betas from <strong>Settings &gt; Labs</strong> in your
          portal. Sign up below to hear when new betas open, or to tell us what you would like to try.
        </p>
        {state === "sent" ? (
          <div className="alert alert--info" role="status" data-testid="beta-sent">
            <p>
              <strong>{message}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="signup__panel" aria-label="Join the beta programme">
            {failure && (
              <div className="alert alert--error" role="alert">
                {failure}
              </div>
            )}
            <div className="row-2">
              <div className="field">
                <label htmlFor="b-name">Your name</label>
                <input id="b-name" type="text" autoComplete="name" maxLength={120} value={f.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "b-name-e" : undefined} />
                {errors.name && <span className="field-error" id="b-name-e">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="b-email">Work email</label>
                <input id="b-email" type="email" autoComplete="email" maxLength={200} value={f.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "b-email-e" : undefined} />
                {errors.email && <span className="field-error" id="b-email-e">{errors.email}</span>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="b-brokerage">Brokerage</label>
              <input id="b-brokerage" type="text" autoComplete="organization" maxLength={160} value={f.brokerage} onChange={set("brokerage")} aria-invalid={!!errors.brokerage} aria-describedby={errors.brokerage ? "b-brokerage-e" : undefined} />
              {errors.brokerage && <span className="field-error" id="b-brokerage-e">{errors.brokerage}</span>}
            </div>
            <fieldset className="field">
              <legend>What would you like to try? (optional)</legend>
              {BETA_INTERESTS.map(([key, label]) => (
                <label className="check" key={key}>
                  <input type="checkbox" checked={interests.includes(key)} onChange={() => toggle(key)} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <div className="field">
              <label htmlFor="b-message">Anything else? (optional)</label>
              <textarea id="b-message" rows={3} maxLength={2000} value={f.message} onChange={set("message")} />
            </div>
            <Turnstile onToken={setToken} resetKey={resetKey} />
            {errors.turnstile_token && <span className="field-error">{errors.turnstile_token}</span>}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="b-website-url">Leave this empty</label>
              <input id="b-website-url" type="text" tabIndex={-1} autoComplete="off" value={f.website_url} onChange={set("website_url")} />
            </div>
            <button className="btn" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : "Join the beta programme"}
            </button>
            <p className="small muted" style={{ marginTop: "0.75rem" }}>
              We use these details to tell you about betas and to follow up about {PRODUCT_NAME}. See our{" "}
              <Link to="/privacy">privacy policy</Link>.
            </p>
          </form>
        )}
      </div>
    </>
  );
}
