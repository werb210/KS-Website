import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { requestDemo } from "../lib/api";
import { validNaPhone } from "../lib/validation";

const WHAT_YOU_DO = [
  "Scan a QR code and become the borrower: upload sample documents from your own phone and ask the assistant a question.",
  "Watch the file land in your portal live, then accept or reject each document. One bank statement was doctored - the fraud check catches it.",
  "Your client calls: the dialler rings on an iPhone and Apple Watch with their file on screen, and the AI writes the call note for you.",
  "Review the financials, build the credit summary in one click, pick lenders from the match list and submit.",
  "The lender package lands in your inbox, so you see exactly what a lender would receive.",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


type Form = { name: string; email: string; phone: string; company: string; website_url: string };

export default function TryDemo() {
  usePageMeta(
    "Try it yourself",
    `Try ${PRODUCT_NAME} yourself: play the borrower on your phone and the broker on your computer, with sample data, in about ten minutes.`,
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
        <h1>Try it yourself</h1>
        <p className="lede">
          Play both sides of a real file in about ten minutes: the borrower on your phone, the broker on your computer. Your
          own private demo, with sample data, for seven days.
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
              Open the link on a computer or tablet and keep your phone nearby. We also emailed it to {f.email.trim()} - if it
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
                <span className="hint" id="d-email-h">We email you a copy of the link.</span>
                {errors.email && <span className="field-error" id="d-email-e">{errors.email}</span>}
              </div>
            </div>
            <div className="row-2">
              <div className="field">
                <label htmlFor="d-phone">Mobile phone</label>
                <input id="d-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={f.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "d-phone-e" : "d-phone-h"} />
                <span className="hint" id="d-phone-h">We text your private demo link here. Canadian or US number.</span>
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
              {state === "sending" ? "Sending your link…" : "Text me my demo link"}
            </button>
            <p className="small muted" style={{ marginTop: "0.75rem" }}>
              We use these details to text and email your demo link and to follow up about {PRODUCT_NAME}. See our{" "}
              <Link to="/privacy">privacy policy</Link>. Everything in the demo is sample data - nothing you do in it reaches a
              real borrower or lender.
            </p>
          </form>
        )}
      </div>
    </>
  );
}
