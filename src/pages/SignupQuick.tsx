// KS_WEBSITE_QUICK_SIGNUP - one short page, then payment, then straight in.
// The old sign-up had seven steps (company, company code, contact, plan, team, branding, review) and a separate page to
// sign the licence agreement before anyone could pay. Everything that is not needed to take a payment and open the
// brokerage now happens inside the portal's set-up list: branding, the team, the mailing address and the business
// number (asked for when texting is switched on). The company code is made automatically from the company name.
// The licence agreement is accepted with one tick; KS-Ops records it and emails a copy.
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Field } from "../components/Field";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { usePageMeta } from "../hooks/usePageMeta";
import { previewAgreement, submitSignup, type SignupPayload } from "../lib/api";
import { cleanArticleHtml } from "../lib/safeHtml";
import { useDemoContact } from "../lib/prefill";
import { goTo } from "../lib/navigate";
import type { PlanKey } from "../lib/plans";
import { MAX_SEATS, PAYMENT_METHODS, findPlan, isPaymentMethod } from "../lib/plans";
import { clampInt, seatRange } from "../lib/pricing";
import { regionsFor } from "../lib/regions";
import { LAST_SIGNUP_KEY, save } from "../lib/storage";
import { EMPTY_FORM, MOBILE_ERROR, e164NaPhone, formatNaPhone, validNaPhone, validateStep, type Errors, type SignupForm } from "../lib/validation";
import { PriceSummary, RadioCard, type Adjust } from "./Signup";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function quickErrors(f: SignupForm, agreed: boolean, planErrors: Errors): Errors {
  const e: Errors = { ...planErrors };
  if (f.company_name.trim().length < 2) e.company_name = "Enter your company name.";
  if (f.contact_name.trim().length < 2) e.contact_name = "Enter your name.";
  if (!EMAIL.test(f.contact_email.trim())) e.contact_email = "Enter an email address like name@company.com.";
  if (!validNaPhone(f.contact_phone)) e.contact_phone = MOBILE_ERROR;
  if (f.country !== "CA" && f.country !== "US") e.country = "Choose Canada or the United States.";
  if (!regionsFor(f.country).some((r) => r.code === f.province_state)) e.province_state = f.country === "US" ? "Choose a state." : "Choose a province or territory.";
  if (!agreed) e.agree = "Tick the box to agree and continue.";
  return e;
}

export function quickPayload(f: SignupForm, turnstileToken: string): SignupPayload {
  const phone = e164NaPhone(f.contact_phone) || f.contact_phone.trim();
  return {
    company_name: f.company_name.trim(),
    country: f.country,
    province_state: f.province_state,
    contact_name: f.contact_name.trim(),
    contact_email: f.contact_email.trim(),
    contact_phone: f.contact_phone.trim(),
    seats: Number(f.seats),
    plan: f.plan,
    billing_interval: f.billing_interval,
    support_level: f.support_level,
    extra_storage_blocks: Number(f.extra_storage_blocks) || 0,
    marketing_addon: f.marketing_addon === true,
    payment_method: f.payment_method,
    accept_terms: true,
    accept_privacy: true,
    accept_agreement: true,
    turnstile_token: turnstileToken || undefined,
    website_url: f.website_url,
    team: [{ full_name: f.contact_name.trim(), email: f.contact_email.trim(), phone, role: "Admin" }],
  } as unknown as SignupPayload;
}

function initialForm(params: URLSearchParams): SignupForm {
  const f: SignupForm = { ...EMPTY_FORM, website_url: "" };
  const plan = params.get("plan");
  if (plan === "starter" || plan === "growth" || plan === "pro") f.plan = plan;
  const seats = Number(params.get("seats"));
  if (Number.isInteger(seats) && seats > 0 && seats <= MAX_SEATS) f.seats = seats;
  const billing = params.get("billing");
  if (billing === "annual" || billing === "monthly") f.billing_interval = billing;
  f.marketing_addon = params.get("addon") === "marketing";
  return f;
}

export default function SignupQuick() {
  usePageMeta(`Sign up | ${PRODUCT_NAME}`, "Start your brokerage on Keystone: a few details, payment, and you are in.");
  const [params] = useSearchParams();
  const { catalog: c } = useCatalog();
  const [f, setF] = useState<SignupForm>(() => initialForm(params));
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message?: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [agreement, setAgreement] = useState<{ title: string; version: string; html: string } | "loading" | "failed" | null>(null);

  const demo = useDemoContact();
  useEffect(() => {
    if (!demo) return;
    setF((prev) => ({
      ...prev,
      contact_name: prev.contact_name.trim() ? prev.contact_name : demo.name || "",
      contact_email: prev.contact_email.trim() ? prev.contact_email : demo.email || "",
      contact_phone: prev.contact_phone.trim() ? prev.contact_phone : demo.phone || "",
      company_name: prev.company_name.trim() ? prev.company_name : demo.company || "",
    }));
  }, [demo]);

  function update<K extends keyof SignupForm>(k: K, v: SignupForm[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setApiErrors((e) => ({ ...e, [k as string]: "" }));
  }
  function choosePlan(key: PlanKey) {
    const p = findPlan(c, key);
    setF((prev) => {
      if (!p) return { ...prev, plan: key };
      const r = seatRange(p);
      return { ...prev, plan: key, seats: clampInt(Number.isFinite(prev.seats) ? prev.seats : r.min, r.min, r.max) };
    });
  }
  const adjust: Adjust = {
    choosePlan,
    setSeats: (n) => update("seats", n),
    setBilling: (b) => update("billing_interval", b),
    setSupport: (k) => update("support_level", k),
    setStorage: (n) => update("extra_storage_blocks", n),
    setMarketing: (on) => update("marketing_addon", on),
  };
  const errorFor = (k: string): string | undefined => (errors[k] as string | undefined) || apiErrors[k] || undefined;

  async function readAgreement() {
    setAgreement("loading");
    const a = await previewAgreement({
      company_name: f.company_name, plan: f.plan, seats: f.seats, billing_interval: f.billing_interval, support_level: f.support_level,
      extra_storage_blocks: f.extra_storage_blocks, marketing_addon: f.marketing_addon, payment_method: f.payment_method, country: f.country,
    });
    setAgreement(a ?? "failed");
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = quickErrors(f, agreed, validateStep("plan", f, c, "idle"));
    setErrors(e);
    if (Object.keys(e).length) {
      setAlert("Check the highlighted fields.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrors({ turnstile_token: "Complete the security check." });
      return;
    }
    setSubmitting(true);
    setAlert("");
    const res = await submitSignup(quickPayload(f, turnstileToken));
    if (res.ok) {
      save(LAST_SIGNUP_KEY, { id: res.data.licensee_id, token: res.data.signup_token, company: f.company_name });
      if (res.data.checkout_url) {
        goTo(res.data.checkout_url);
        return;
      }
      setSubmitting(false);
      setDone({ message: res.data.message });
      return;
    }
    setSubmitting(false);
    setTurnstileToken("");
    setTurnstileReset((n) => n + 1);
    setApiErrors(res.errors);
    setAlert(res.message || "Check the highlighted fields.");
  }

  if (done) {
    return (
      <section className="section">
        <div className="container signup__done">
          <h1>Thanks — we'll contact you to complete payment</h1>
          <div className="card">
            <p>
              We've received the sign-up for <strong>{f.company_name}</strong>. Someone from our team will email <strong>{f.contact_email}</strong> within
              one business day with a secure payment link.
            </p>
            <p>Once payment is set up your brokerage is prepared straight away and your sign-in details are emailed to you.</p>
          </div>
          <p><Link to="/">Back to the home page</Link></p>
        </div>
      </section>
    );
  }

  const regions = regionsFor(f.country);
  return (
    <>
      <section className="section section--tight">
        <div className="container">
          <h1>Sign up</h1>
          <p className="lede">A few details, then payment, and you're in. Your logo, your team, your lenders and your phone line are all set up inside {PRODUCT_NAME}, when you're ready.</p>
        </div>
      </section>
      <div className="container signup">
        <form className="signup__panel" onSubmit={onSubmit} noValidate aria-label="Sign-up" data-testid="quick-signup">
          {alert && <div className="alert" role="alert">{alert}</div>}
          <Field id="company_name" label="Company name" hint="The name your clients know you by." error={errorFor("company_name")}>
            {(a) => <input {...a} type="text" autoComplete="organization" maxLength={120} value={f.company_name} onChange={(e) => update("company_name", e.target.value)} />}
          </Field>
          <Field id="contact_name" label="Your name" error={errorFor("contact_name")}>
            {(a) => <input {...a} type="text" autoComplete="name" maxLength={120} value={f.contact_name} onChange={(e) => update("contact_name", e.target.value)} />}
          </Field>
          <Field id="contact_email" label="Email" error={errorFor("contact_email")}>
            {(a) => <input {...a} type="email" autoComplete="email" value={f.contact_email} onChange={(e) => update("contact_email", e.target.value)} />}
          </Field>
          <Field id="contact_phone" label="Mobile phone" hint="A Canadian or US mobile. You sign in with a code texted to it." error={errorFor("contact_phone")}>
            {(a) => <input {...a} type="tel" autoComplete="tel" value={f.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} onBlur={() => update("contact_phone", formatNaPhone(f.contact_phone))} />}
          </Field>
          <div className="grid grid--2">
            <Field id="country" label="Country" error={errorFor("country")}>
              {(a) => (
                <select {...a} value={f.country} onChange={(e) => { update("country", e.target.value as SignupForm["country"]); update("province_state", ""); }}>
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                </select>
              )}
            </Field>
            <Field id="province_state" label={f.country === "US" ? "State" : "Province or territory"} error={errorFor("province_state")}>
              {(a) => (
                <select {...a} value={f.province_state} onChange={(e) => update("province_state", e.target.value)}>
                  <option value="">Choose…</option>
                  {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              )}
            </Field>
          </div>

          <fieldset className="signup__fieldset">
            <legend>How you'll pay</legend>
            <div className="grid grid--2">
              {PAYMENT_METHODS.map((pm) => (
                <RadioCard key={pm.key} name="payment_method" value={pm.key} checked={f.payment_method === pm.key} onChange={() => isPaymentMethod(pm.key) && update("payment_method", pm.key)}>
                  <strong>{pm.name}</strong>
                  <span className="small muted" style={{ display: "block" }}>{pm.detail}</span>
                </RadioCard>
              ))}
            </div>
            {errorFor("payment_method") && <span className="field-error">{errorFor("payment_method")}</span>}
          </fieldset>

          <div className="check">
            <input id="agree" type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((x) => ({ ...x, agree: undefined })); }} aria-describedby={errorFor("agree") ? "agree-error" : undefined} />
            <label htmlFor="agree">
              I agree to the{" "}
              <button type="button" className="linklike" onClick={() => void readAgreement()} data-testid="read-agreement">Keystone Software Licence Agreement</button>, the{" "}
              <a href="/terms" target="_blank" rel="noopener">terms of service</a> and the <a href="/privacy" target="_blank" rel="noopener">privacy policy</a>
              {f.company_name.trim() ? <> on behalf of {f.company_name.trim()}</> : null}.
            </label>
          </div>
          {errorFor("agree") && <span className="field-error" id="agree-error">{errorFor("agree")}</span>}
          {agreement && (
            <div className="card" data-testid="agreement-preview" style={{ maxHeight: 360, overflow: "auto", marginTop: "0.75rem" }}>
              {agreement === "loading" && <p>Opening the agreement…</p>}
              {agreement === "failed" && <p>The agreement could not be opened just now. A copy is emailed to you as soon as you sign up.</p>}
              {typeof agreement === "object" && <div dangerouslySetInnerHTML={{ __html: cleanArticleHtml(agreement.html) }} />}
              <p><button type="button" className="linklike" onClick={() => setAgreement(null)}>Close</button></p>
            </div>
          )}

          <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
          {errorFor("turnstile_token") && <span className="field-error">{errorFor("turnstile_token")}</span>}

          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website_url">Leave this field empty</label>
            <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" value={f.website_url} onChange={(e) => update("website_url", e.target.value)} />
          </div>

          <div className="signup__actions">
            <button type="submit" className="btn btn--primary" disabled={submitting} data-testid="quick-signup-submit">
              {submitting ? "One moment…" : "Continue to payment"}
            </button>
          </div>
          <p className="small muted">After payment your brokerage is prepared automatically and your sign-in details are emailed to you. A copy of the agreement is emailed too.</p>
        </form>
        <PriceSummary c={c} f={f} adjust={adjust} showControls onDetails={() => undefined} />
      </div>
    </>
  );
}
