import { useEffect, useState, type FormEvent } from "react";
import { CONTACT_EMAIL, CONTACT_ENDPOINT, PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { useDemoContact } from "../lib/prefill";

export function buildMailto(to: string, f: { name: string; email: string; company: string; message: string }): string {
  const subject = `${PRODUCT_NAME} enquiry${f.company ? ` from ${f.company}` : ""}`;
  const body = `${f.message}\n\n${f.name}\n${f.company}\n${f.email}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function Contact() {
  usePageMeta("Contact", `Contact the ${PRODUCT_NAME} team about plans, set-up or a demo.`, "/contact");
  const [f, setF] = useState({ name: "", email: "", company: "", message: "", website_url: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  // From the person's demo (a link from it, or what they typed on "Try it yourself" here): fill empty fields only.
  const demo = useDemoContact();
  useEffect(() => {
    if (!demo) return;
    setF((p) => ({
      ...p,
      name: p.name.trim() ? p.name : demo.name,
      email: p.email.trim() ? p.email : demo.email,
      company: p.company.trim() ? p.company : demo.company,
    }));
  }, [demo]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errs.email = "Enter an email address like name@company.com.";
    if (!f.message.trim()) errs.message = "Tell us what you'd like to know.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (CONTACT_ENDPOINT) {
      setState("sending");
      try {
        const res = await fetch(CONTACT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f),
        });
        setState(res.ok ? "sent" : "failed");
      } catch {
        setState("failed");
      }
      return;
    }
    if (CONTACT_EMAIL) window.location.href = buildMailto(CONTACT_EMAIL, f);
  }

  return (
    <>
      <div className="wrap wrap--narrow page-head">
        <h1>Contact us</h1>
        <p>Questions about plans, set-up or moving from your current system? We reply within one business day.</p>
        {CONTACT_EMAIL && (
          <p>
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        )}
      </div>
      <div className="wrap wrap--narrow">
        {state === "sent" ? (
          <div className="alert alert--info" role="status">
            Message sent. We'll reply to {f.email} within one business day.
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="signup__panel">
            {state === "failed" && (
              <div className="alert alert--error" role="alert">
                Your message didn't send.{" "}
                {CONTACT_EMAIL ? (
                  <>
                    Email us at <a href={buildMailto(CONTACT_EMAIL, f)}>{CONTACT_EMAIL}</a> instead.
                  </>
                ) : (
                  "Try again in a minute."
                )}
              </div>
            )}
            {!CONTACT_ENDPOINT && !CONTACT_EMAIL && (
              <div className="alert alert--error" role="alert">
                The contact address isn't set up yet.
              </div>
            )}
            <div className="row-2">
              <div className="field">
                <label htmlFor="c-name">Your name</label>
                <input id="c-name" type="text" autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "c-name-e" : undefined} />
                {errors.name && <span className="field-error" id="c-name-e">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="c-email">Email</label>
                <input id="c-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "c-email-e" : undefined} />
                {errors.email && <span className="field-error" id="c-email-e">{errors.email}</span>}
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-company">Brokerage (optional)</label>
              <input id="c-company" type="text" autoComplete="organization" value={f.company} onChange={set("company")} />
            </div>
            <div className="field">
              <label htmlFor="c-message">Message</label>
              <textarea id="c-message" rows={5} value={f.message} onChange={set("message")} aria-invalid={!!errors.message} aria-describedby={errors.message ? "c-message-e" : undefined} />
              {errors.message && <span className="field-error" id="c-message-e">{errors.message}</span>}
            </div>
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="c-website-url">Leave this empty</label>
              <input id="c-website-url" type="text" tabIndex={-1} autoComplete="off" value={f.website_url} onChange={set("website_url")} />
            </div>
            <button className="btn" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending…" : CONTACT_ENDPOINT ? "Send message" : "Write email"}
            </button>
            {!CONTACT_ENDPOINT && CONTACT_EMAIL && (
              <p className="small muted" style={{ marginTop: "0.75rem" }}>
                This opens your email app with your message filled in.
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
}
