import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { requestDemo } from "../lib/api";
import { rememberDemoContact } from "../lib/prefill";
import { formatNaPhone, validNaPhone } from "../lib/validation";

const WHAT_YOU_DO = [
  "See it as your client: walk through the client app the way your borrowers do. Every answer is already filled in - you just click Next.",
  "See it as the broker: the application lands in your pipeline. Accept the documents, check the financials and the bank summary, and approve the credit summary.",
  "Catch the fraud: one bank statement was doctored, and the fraud report flags it before it reaches a lender.",
  "Take the call: your client rings on an iPhone and Apple Watch with their file on screen, and the AI writes the call note for you.",
  "Pick the lender and send it. The lender package lands in your inbox, so you see exactly what a lender would receive.",
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


type Form = { name: string; email: string; phone: string; company: string; website_url: string };

export default function TryDemo() {
  usePageMeta(
    "Try it yourself",
    `Try ${PRODUCT_NAME} yourself: see a deal from the client app and from the broker portal, with sample data. It takes about ten minutes.`,
    "/try",
  );
  const [f, setF] = useState<Form>({ name: "", email: "", phone: "", company: "", website_url: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setPhone = (e: { target: { value: string } }) => setF((p) => ({ ...p, phone: formatNaPhone(e.target.value) }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Enter your name.";
    if (!EMAIL_RE.test(f.email.trim())) errs.email = "Enter an email address like name@company.com.";
    if (!validNaPhone(f.phone)) errs.phone = "Enter your mobile number, like (403) 555-0199.";
    if (!f.company.trim()) errs.company = "Enter your brokerage's name.";
    if (TURNSTILE_SITE_KEY && !token) errs.turnstile_token = "Complete the security check.";
    setErrors(errs);
    setFailure("");
    if (Object.keys(errs).length) return;
    setState("sending");
    const res = await requestDemo({
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      company: f.company.trim(),
      website_url: f.website_url,
      turnstile_token: token || undefined,
    });
    if (res.ok) {
      // Kept in this browser so Sign up and Contact can be filled in for them later.
      rememberDemoContact({ name: f.name.trim(), email: f.email.trim(), company: f.company.trim(), phone: f.phone.trim() });
      setMessage(res.message);
      setState("sent");
      if (res.openUrl) window.location.assign(res.openUrl);
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
        <h1>Try it yourself</h1>
        <p className="lede">
          It takes about ten minutes: you'll see a real deal from both sides, first the client app your borrowers use,
          then your portal. Nothing to download, nothing to type - just click Next. Your own private demo, with sample
          data.
        </p>
      </div>
      <div className="wrap wrap--narrow">
        <ol className="try-steps">
          {WHAT_YOU_DO.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {state === "sent" ? (
          <div className="alert alert--info" role="status" data-testid="demo-sent">
            <p>
              <strong>{message}</strong>
            </p>
            <p>
              Open the link on a computer or tablet and keep your phone nearby. The email copy went to {f.email.trim()} - if it
              isn't in your inbox, check your junk folder.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="signup__panel" aria-label="Start your demo">
            {failure && (
              <div className="alert alert--error" role="alert">
                {failure}
              </div>
            )}
            <div className="row-2">
              <div className="field">
                <label htmlFor="d-name">Your name</label>
                <input id="d-name" type="text" autoComplete="name" maxLength={120} value={f.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "d-name-e" : undefined} />
                {errors.name && <span className="field-error" id="d-name-e">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="d-email">Work email</label>
                <input id="d-email" type="email" autoComplete="email" maxLength={200} value={f.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "d-email-e" : "d-email-h"} />
                <span className="hint" id="d-email-h">The lender package from the demo is emailed here.</span>
                {errors.email && <span className="field-error" id="d-email-e">{errors.email}</span>}
              </div>
            </div>
            <div className="row-2">
              <div className="field">
                <label htmlFor="d-phone">Mobile phone</label>
                <input id="d-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={f.phone} onChange={setPhone} placeholder="(403) 555-0199" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "d-phone-e" : "d-phone-h"} />
                <span className="hint" id="d-phone-h">So we can reach you. Canadian or US number.</span>
                {errors.phone && <span className="field-error" id="d-phone-e">{errors.phone}</span>}
              </div>
              <div className="field">
                <label htmlFor="d-company">Brokerage</label>
                <input id="d-company" type="text" autoComplete="organization" maxLength={160} value={f.company} onChange={set("company")} aria-invalid={!!errors.company} aria-describedby={errors.company ? "d-company-e" : undefined} />
                {errors.company && <span className="field-error" id="d-company-e">{errors.company}</span>}
              </div>
            </div>
            <Turnstile onToken={setToken} resetKey={resetKey} />
            {errors.turnstile_token && <span className="field-error">{errors.turnstile_token}</span>}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="d-website-url">Leave this empty</label>
              <input id="d-website-url" type="text" tabIndex={-1} autoComplete="off" value={f.website_url} onChange={set("website_url")} />
            </div>
            <button className="btn" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Starting your demo…" : "Start my demo"}
            </button>
            <p className="small muted" style={{ marginTop: "0.75rem" }}>
              We use these details to email your demo link and to follow up about {PRODUCT_NAME}. See our{" "}
              <Link to="/privacy">privacy policy</Link>. Everything in the demo is sample data - nothing you do in it reaches a
              real borrower or lender.
            </p>
          </form>
        )}
      </div>
    </>
  );
}
