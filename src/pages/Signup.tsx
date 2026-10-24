import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandFromWebsite, type BrandPatch } from "../components/BrandFromWebsite";
import { ColourField } from "../components/ColourField";
import { FontField } from "../components/FontField";
import { Field } from "../components/Field";
import { LogoUpload } from "../components/LogoUpload";
import { NumberStepper } from "../components/NumberStepper";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { useCodeAvailability } from "../hooks/useCodeAvailability";
import { usePageMeta } from "../hooks/usePageMeta";
import { submitSignup, type BrandScanResult, type SignupPayload } from "../lib/api";
import { useDemoContact } from "../lib/prefill";
import { goTo } from "../lib/navigate";
import type { BillingInterval, Catalog, PlanKey, SupportLevel } from "../lib/plans";
import { MAX_SEATS, PAYMENT_METHODS, findPlan, findSupport, hasLiveHelp, isPaymentMethod } from "../lib/plans";
import { clampInt, formatMoney, formatNumber, seatRange, signupQuote } from "../lib/pricing";
import { regionsFor } from "../lib/regions";
import { DRAFT_KEY, LAST_SIGNUP_KEY, load, remove, save } from "../lib/storage";
import {
  EMPTY_FORM,
  FIELD_STEP,
  STEP_LABELS,
  STEPS,
  normalisePostalOrSelf,
  normaliseWebsite,
  oneLineAddress,
  suggestCode,
  validateStep,
  type CodeState,
  type Errors,
  type SignupForm,
  type StepKey,
} from "../lib/validation";

function initialForm(params: URLSearchParams): SignupForm {
  const draft = load<Partial<SignupForm>>(DRAFT_KEY);
  const f: SignupForm = { ...EMPTY_FORM, ...(draft ?? {}), website_url: "" };
  if (f.logo_file && (typeof f.logo_file !== "object" || typeof f.logo_file.data_url !== "string")) f.logo_file = null;
  const plan = params.get("plan");
  if (plan === "starter" || plan === "growth" || plan === "pro") f.plan = plan;
  const seats = Number(params.get("seats"));
  if (Number.isInteger(seats) && seats > 0 && seats <= MAX_SEATS) f.seats = seats;
  if (!Number.isInteger(f.extra_storage_blocks) || f.extra_storage_blocks < 0) f.extra_storage_blocks = 0;
  if (!isPaymentMethod(f.payment_method)) f.payment_method = EMPTY_FORM.payment_method;
  const billing = params.get("billing");
  if (billing === "annual" || billing === "monthly") f.billing_interval = billing;
  return f;
}

export function buildPayload(f: SignupForm, turnstileToken: string): SignupPayload {
  const opt = (v: string) => (v.trim() ? v.trim() : undefined);
  const logo = f.logo_file ? /^data:([^;,]+);base64,(.*)$/.exec(f.logo_file.data_url) : null;
  return {
    company_name: f.company_name.trim(),
    legal_name: f.legal_name.trim(),
    company_code: f.company_code.trim(),
    country: f.country,
    province_state: f.province_state,
    address_line1: f.address_line1.trim(),
    address_line2: opt(f.address_line2),
    city: f.city.trim(),
    postal_code: normalisePostalOrSelf(f.country, f.postal_code),
    mailing_address: oneLineAddress(f),
    website: f.website.trim() ? normaliseWebsite(f.website) : undefined,
    contact_name: f.contact_name.trim(),
    contact_email: f.contact_email.trim(),
    contact_phone: f.contact_phone.trim(),
    seats: Number(f.seats),
    plan: f.plan,
    billing_interval: f.billing_interval,
    support_level: f.support_level,
    extra_storage_blocks: Number(f.extra_storage_blocks) || 0,
    payment_method: f.payment_method,
    primary_color: opt(f.primary_color),
    accent_color: opt(f.accent_color),
    background_color: opt(f.background_color),
    font_family: opt(f.font_family),
    logo_file: logo && f.logo_file ? { content_type: logo[1], data_base64: logo[2], filename: f.logo_file.name } : undefined,
    assistant_name: opt(f.assistant_name),
    accept_terms: true,
    accept_privacy: true,
    turnstile_token: turnstileToken || undefined,
    website_url: f.website_url,
  };
}

type Adjust = {
  choosePlan: (k: PlanKey) => void;
  setSeats: (n: number) => void;
  setBilling: (b: BillingInterval) => void;
  setSupport: (k: string) => void;
  setStorage: (n: number) => void;
};

function seatsText(n: number) {
  return `${formatNumber(n)} ${n === 1 ? "seat" : "seats"}`;
}

/** "Priority: $199 a month, covers 10 seats, then $15 per extra seat" */
function supportPriceText(s: SupportLevel, m: (n: number) => string) {
  if (!s.price && !s.extra_seat_price) return "Included with every plan";
  const base = `${m(s.price)} a month`;
  return s.covered_seats == null ? base : `${base}, covers ${s.covered_seats} seats, then ${m(s.extra_seat_price)} per extra seat`;
}

function PriceSummary({ c, f, adjust, showControls, onDetails }: {
  c: Catalog; f: SignupForm; adjust: Adjust; showControls: boolean; onDetails: () => void;
}) {
  const plan = findPlan(c, f.plan);
  if (!plan) return null;
  const support = findSupport(c, f.support_level);
  const q = signupQuote(c, plan, f);
  const m = (n: number) => formatMoney(n, c.currency);
  const range = seatRange(plan);
  const block = c.extra_storage;
  return (
    <aside className="signup__summary" aria-labelledby="summary-h" data-testid="price-summary">
      <h2 id="summary-h" style={{ fontSize: "var(--step-1)" }}>
        Your price
      </h2>
      {showControls && (
        <div className="summary-controls" data-testid="summary-controls">
          <fieldset className="field">
            <legend>Plan</legend>
            <div className="seg seg--3">
              {c.plans.map((p) => (
                <label key={p.key} className="seg__opt">
                  <input type="radio" name="summary_plan" value={p.key} checked={f.plan === p.key} onChange={() => adjust.choosePlan(p.key)} />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="field">
            <legend>Billing</legend>
            <div className="seg seg--2">
              {(["annual", "monthly"] as BillingInterval[]).map((b) => (
                <label key={b} className="seg__opt">
                  <input type="radio" name="summary_billing" value={b} checked={f.billing_interval === b} onChange={() => adjust.setBilling(b)} />
                  <span>{b === "annual" ? "Annual" : "Monthly"}</span>
                </label>
              ))}
            </div>
            {q.annualSavingsPerYear > 0 && (
              <span className="saving">
                {f.billing_interval === "annual"
                  ? `You save ${m(q.annualSavingsPerYear)} a year with annual billing.`
                  : `Annual billing would save ${m(q.annualSavingsPerYear)} a year.`}
              </span>
            )}
          </fieldset>
          <NumberStepper
            id="summary-seats"
            label="Seats"
            compact
            value={f.seats}
            min={range.min}
            max={range.max}
            onChange={adjust.setSeats}
            decLabel="Remove a seat"
            incLabel="Add a seat"
          />
          <div className="field">
            <label htmlFor="summary-support">Support</label>
            <select id="summary-support" value={f.support_level} onChange={(e) => adjust.setSupport(e.target.value)}>
              {c.support_levels.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name} {s.price ? `(+${m(s.price)} a month)` : "(included)"}
                </option>
              ))}
            </select>
          </div>
          <NumberStepper
            id="summary-storage"
            label={`Extra storage (${block.block_gb} GB blocks)`}
            compact
            value={f.extra_storage_blocks}
            min={0}
            max={block.max_blocks}
            onChange={adjust.setStorage}
            decLabel={`Remove ${block.block_gb} GB`}
            incLabel={`Add ${block.block_gb} GB`}
          />
          <button type="button" className="btn btn--quiet summary-details" onClick={onDetails}>
            Compare plans and support levels
          </button>
        </div>
      )}
      <dl aria-live="polite">
        <dt>
          {plan.name}, {seatsText(q.seats)} × {m(q.seatPrice)}
        </dt>
        <dd>{m(q.seatsMonthly)}</dd>
        <dt>{support?.name ?? "Email"} support{q.supportExtraSeats > 0 ? ` (+${q.supportExtraSeats} seats)` : ""}</dt>
        <dd data-testid="support-monthly">{q.supportMonthly ? m(q.supportMonthly) : "Included"}</dd>
        {q.storageBlocks > 0 && (
          <>
            <dt>
              Extra storage, {formatNumber(q.storageBlocks * block.block_gb)} GB
            </dt>
            <dd data-testid="storage-monthly">{m(q.storageMonthly)}</dd>
          </>
        )}
        <dt className="total">Monthly total</dt>
        <dd className="total" data-testid="monthly-total">
          {m(q.monthlyTotal)}
        </dd>
        <dt>Onboarding fee (once)</dt>
        <dd data-testid="onboarding-fee">{q.onboardingFee ? m(q.onboardingFee) : "None"}</dd>
        <dt className="total">First payment</dt>
        <dd className="total" data-testid="first-payment">
          {m(q.firstPayment)}
        </dd>
      </dl>
      <p className="small muted" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
        {f.billing_interval === "annual"
          ? `Billed annually: the first payment covers 12 months${q.onboardingFee ? " plus onboarding" : ""}.`
          : `Billed monthly${q.onboardingFee ? ": the first payment includes onboarding" : ""}.`}{" "}
        Prices in {c.currency}, plus applicable taxes. Call minutes and texts beyond your allowance are billed after use.
      </p>
      {q.seatsAdjusted && (
        <p className="small" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
          {plan.name} starts at {plan.min_seats} seats.
        </p>
      )}
    </aside>
  );
}

function RadioCard({ name, value, checked, onChange, children }: {
  name: string; value: string; checked: boolean; onChange: () => void; children: ReactNode;
}) {
  return (
    <label className="radio-card">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

export default function Signup() {
  usePageMeta("Sign up", `Sign up for ${PRODUCT_NAME}: choose a plan, pick your company code and pay securely.`, "/signup");
  const [params] = useSearchParams();
  const { catalog: c } = useCatalog();
  const [f, setF] = useState<SignupForm>(() => initialForm(params));
  const [step, setStep] = useState<StepKey>("company");
  const [errors, setErrors] = useState<Errors>({});
  const [apiErrors, setApiErrors] = useState<Errors>({});
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message?: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [codeTouched, setCodeTouched] = useState(Boolean(f.company_code));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const code = useCodeAvailability(f.company_code);
  const codeState: CodeState = apiErrors.company_code && code.state !== "available" ? "taken" : code.state;

  useEffect(() => {
    const { website_url: _hp, ...draft } = f;
    void _hp;
    save(DRAFT_KEY, draft);
  }, [f]);

  // From the person's demo: their name, email, phone and brokerage fill any empty field (all still editable).
  const demo = useDemoContact();
  useEffect(() => {
    if (!demo) return;
    setF((prev) => {
      const next = { ...prev };
      if (!prev.contact_name.trim() && demo.name) next.contact_name = demo.name;
      if (!prev.contact_email.trim() && demo.email) next.contact_email = demo.email;
      if (!prev.contact_phone.trim() && demo.phone) next.contact_phone = demo.phone;
      if (!prev.company_name.trim() && demo.company) {
        next.company_name = demo.company;
        if (!prev.company_code.trim()) next.company_code = suggestCode(demo.company);
      }
      return next;
    });
  }, [demo]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const plan = findPlan(c, f.plan);
  const idx = STEPS.indexOf(step);

  function update<K extends keyof SignupForm>(k: K, v: SignupForm[K]) {
    setF((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "company_name" && !codeTouched) next.company_code = suggestCode(String(v));
      return next;
    });
    if (errors[k as string] || apiErrors[k as string]) {
      setErrors((e) => ({ ...e, [k]: undefined }));
      setApiErrors((e) => ({ ...e, [k]: undefined }));
    }
  }

  // "Use my website": the suggestions go into the branding fields, where the contrast checks run as usual.
  const [websiteFont, setWebsiteFont] = useState<BrandScanResult["suggestions"]["font"]>(null);
  function applyBrand(patch: BrandPatch) {
    setF((prev) => ({ ...prev, ...patch }));
    setErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }));
    setApiErrors((e) => ({ ...e, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) }));
  }

  function choosePlan(key: PlanKey) {
    const p = findPlan(c, key);
    setF((prev) => {
      if (!p) return { ...prev, plan: key };
      const r = seatRange(p);
      return { ...prev, plan: key, seats: clampInt(Number.isFinite(prev.seats) ? prev.seats : r.min, r.min, r.max) };
    });
    setErrors((e) => ({ ...e, plan: undefined, seats: undefined }));
  }

  const adjust: Adjust = {
    choosePlan,
    setSeats: (n) => update("seats", n),
    setBilling: (b) => update("billing_interval", b),
    setSupport: (k) => update("support_level", k),
    setStorage: (n) => update("extra_storage_blocks", n),
  };

  function errorFor(k: string): string | undefined {
    return errors[k] || apiErrors[k];
  }

  function next() {
    const e = validateStep(step, f, c, codeState);
    setErrors(e);
    if (Object.keys(e).length) return;
    setAlert("");
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  }

  function goToStep(s: StepKey) {
    setErrors({});
    setStep(s);
  }

  function back() {
    setErrors({});
    setStep(STEPS[Math.max(idx - 1, 0)]);
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (step !== "review") {
      next();
      return;
    }
    for (const s of STEPS) {
      const e = validateStep(s, f, c, codeState);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrors({ turnstile_token: "Complete the security check." });
      return;
    }
    setSubmitting(true);
    setAlert("");
    const res = await submitSignup(buildPayload(f, turnstileToken));
    if (res.ok) {
      save(LAST_SIGNUP_KEY, { id: res.data.licensee_id, token: res.data.signup_token, company: f.company_name });
      remove(DRAFT_KEY);
      if (res.data.checkout_url) {
        goTo(res.data.checkout_url);
        return;
      }
      setSubmitting(false);
      setDone({ message: res.data.message });
      return;
    }
    setSubmitting(false);
    // The token was used (or refused): get a fresh one for the next try.
    setTurnstileToken("");
    setTurnstileReset((n) => n + 1);
    setApiErrors(res.errors);
    setAlert(res.message);
    const firstField = Object.keys(res.errors).find((k) => FIELD_STEP[k]);
    if (firstField) setStep(FIELD_STEP[firstField]);
  }

  const regions = regionsFor(f.country);
  const m = (n: number) => formatMoney(n, c.currency);
  const planQuote = signupQuote(c, plan ?? c.plans[0], f);

  if (done) {
    return (
      <div className="wrap wrap--narrow page-head">
        <h1>Thanks — we'll contact you to complete payment</h1>
        <div className="status-box" role="status">
          <p>
            We've received the sign-up for <strong>{f.company_name}</strong>. Someone from our team will email{" "}
            <strong>{f.contact_email}</strong> within one business day with a secure payment link.
          </p>
          <p style={{ marginBottom: 0 }}>Once payment is set up we'll prepare your copy and send your sign-in details.</p>
        </div>
        <Link to="/">Back to the home page</Link>
      </div>
    );
  }

  let codeStatus: ReactNode = null;
  if (codeState === "checking") codeStatus = <span className="field-status">Checking…</span>;
  else if (codeState === "available") codeStatus = <span className="field-ok">{f.company_code} is available.</span>;
  else if (codeState === "taken" && !errorFor("company_code"))
    codeStatus = <span className="field-error">That code is taken{code.reason ? ` (${code.reason})` : ""}. Try another.</span>;
  else if (codeState === "error")
    codeStatus = <span className="field-status">We couldn't check this code right now. We'll check it again when you submit.</span>;

  return (
    <>
      <div className="wrap page-head" style={{ paddingBottom: "1rem" }}>
        <h1>Sign up</h1>
        <p>About five minutes. You'll pay on the next screen, and we set up your copy within one business day.</p>
      </div>
      <div className="wrap signup">
        <form className="signup__panel" onSubmit={onSubmit} noValidate aria-label="Sign-up">
          <ol className="steps" aria-label="Sign-up steps">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={s === step ? "step" : undefined} data-done={i < idx}>
                {STEP_LABELS[s]}
              </li>
            ))}
          </ol>
          <h2 id="step-h" ref={headingRef} tabIndex={-1} style={{ outline: "none" }}>
            {STEP_LABELS[step]}
          </h2>

          {alert && (
            <div className="alert alert--error" role="alert">
              {alert}
            </div>
          )}

          {step === "company" && (
            <>
              <Field id="company_name" label="Company name" hint="The name your clients know you by." error={errorFor("company_name")}>
                {(a) => <input {...a} type="text" autoComplete="organization" value={f.company_name} onChange={(e) => update("company_name", e.target.value)} />}
              </Field>
              <Field id="legal_name" label="Legal name" hint="As registered, for invoices and the licence agreement." error={errorFor("legal_name")}>
                {(a) => <input {...a} type="text" value={f.legal_name} onChange={(e) => update("legal_name", e.target.value)} />}
              </Field>
              <fieldset className="field address" aria-describedby={errorFor("mailing_address") ? "mailing_address-error" : undefined}>
                <legend>Mailing address</legend>
                <Field id="address_line1" label="Street address" error={errorFor("address_line1")}>
                  {(a) => <input {...a} type="text" autoComplete="address-line1" maxLength={200} value={f.address_line1} onChange={(e) => update("address_line1", e.target.value)} />}
                </Field>
                <Field id="address_line2" label="Unit or suite (optional)" error={errorFor("address_line2")}>
                  {(a) => <input {...a} type="text" autoComplete="address-line2" maxLength={120} value={f.address_line2} onChange={(e) => update("address_line2", e.target.value)} />}
                </Field>
                <div className="row-2">
                  <Field id="city" label="City" error={errorFor("city")}>
                    {(a) => <input {...a} type="text" autoComplete="address-level2" maxLength={120} value={f.city} onChange={(e) => update("city", e.target.value)} />}
                  </Field>
                  <Field id="province_state" label={f.country === "US" ? "State" : "Province or territory"} error={errorFor("province_state")}>
                    {(a) => (
                      <select {...a} value={f.province_state} onChange={(e) => update("province_state", e.target.value)}>
                        <option value="">Choose…</option>
                        {regions.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
                <div className="row-2">
                  <Field
                    id="postal_code"
                    label={f.country === "US" ? "ZIP code" : "Postal code"}
                    error={errorFor("postal_code")}
                  >
                    {(a) => (
                      <input
                        {...a}
                        type="text"
                        autoComplete="postal-code"
                        maxLength={10}
                        placeholder={f.country === "US" ? "94105" : "T2P 1P6"}
                        value={f.postal_code}
                        onChange={(e) => update("postal_code", e.target.value)}
                        onBlur={() => update("postal_code", normalisePostalOrSelf(f.country, f.postal_code))}
                      />
                    )}
                  </Field>
                  <Field id="country" label="Country" error={errorFor("country")}>
                    {(a) => (
                      <select
                        {...a}
                        value={f.country}
                        onChange={(e) => {
                          update("country", e.target.value as "CA" | "US");
                          update("province_state", "");
                        }}
                      >
                        <option value="CA">Canada</option>
                        <option value="US">United States</option>
                      </select>
                    )}
                  </Field>
                </div>
                {errorFor("mailing_address") && (
                  <span className="field-error" id="mailing_address-error">
                    {errorFor("mailing_address")}
                  </span>
                )}
              </fieldset>
              <Field id="website" label="Website (optional)" error={errorFor("website")}>
                {(a) => <input {...a} type="url" inputMode="url" placeholder="example.com" value={f.website} onChange={(e) => update("website", e.target.value)} />}
              </Field>
            </>
          )}

          {step === "code" && (
            <>
              <p>
                Your company code is how your team finds your brokerage in the {PRODUCT_NAME} apps. Staff type it once
                when they first open the iPhone dialler or iPad app, then sign in as usual. Your clients never need it:
                they use your brokerage's own app on iPhone or Android, or your client portal as a website in any
                browser, whichever they prefer.
              </p>
              <Field
                id="company_code"
                label="Company code"
                hint="3 to 32 characters: lowercase letters, numbers and hyphens. You can't change it later."
                error={errorFor("company_code")}
                status={codeStatus}
              >
                {(a) => (
                  <input
                    {...a}
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={32}
                    value={f.company_code}
                    onChange={(e) => {
                      setCodeTouched(true);
                      update("company_code", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                    }}
                  />
                )}
              </Field>
            </>
          )}

          {step === "contact" && (
            <>
              <p className="muted">The main contact for your account. We'll send sign-in details and invoices here.</p>
              <Field id="contact_name" label="Your name" error={errorFor("contact_name")}>
                {(a) => <input {...a} type="text" autoComplete="name" value={f.contact_name} onChange={(e) => update("contact_name", e.target.value)} />}
              </Field>
              <Field id="contact_email" label="Email" error={errorFor("contact_email")}>
                {(a) => <input {...a} type="email" autoComplete="email" value={f.contact_email} onChange={(e) => update("contact_email", e.target.value)} />}
              </Field>
              <Field id="contact_phone" label="Mobile phone" hint="You'll use it to sign in with a one-time code." error={errorFor("contact_phone")}>
                {(a) => <input {...a} type="tel" autoComplete="tel" value={f.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />}
              </Field>
            </>
          )}

          {step === "plan" && plan && (
            <>
              <p className="muted">Change anything here and the price updates straight away. You can add seats or change support later too.</p>
              <fieldset className="field">
                <legend>Plan</legend>
                <div className="radio-cards">
                  {c.plans.map((p) => (
                    <RadioCard key={p.key} name="plan" value={p.key} checked={f.plan === p.key} onChange={() => choosePlan(p.key)}>
                      <strong>{p.name}</strong>
                      <small>
                        {m(f.billing_interval === "annual" ? p.seat_price_annual : p.seat_price_monthly)} per seat / month
                        {p.min_seats > 1 ? `, ${p.min_seats}-seat minimum` : ""}
                      </small>
                      <small>{p.onboarding_fee ? `${m(p.onboarding_fee)} onboarding (once)` : "No onboarding fee"}</small>
                    </RadioCard>
                  ))}
                </div>
                {errorFor("plan") && <span className="field-error">{errorFor("plan")}</span>}
              </fieldset>
              <NumberStepper
                id="seats"
                label="Seats"
                hint={`One seat per person on your team who signs in. ${plan.name}: ${formatNumber(seatRange(plan).min)} to ${formatNumber(seatRange(plan).max)} seats.`}
                error={errorFor("seats")}
                value={f.seats}
                min={seatRange(plan).min}
                max={seatRange(plan).max}
                onChange={(n) => update("seats", n)}
                decLabel="Remove a seat"
                incLabel="Add a seat"
              />
              <fieldset className="field">
                <legend>Billing</legend>
                <div className="radio-cards">
                  {(["annual", "monthly"] as BillingInterval[]).map((b) => (
                    <RadioCard key={b} name="billing_interval" value={b} checked={f.billing_interval === b} onChange={() => update("billing_interval", b)}>
                      <strong>{b === "annual" ? "Annual" : "Monthly"}</strong>
                      <small>
                        {m(b === "annual" ? plan.seat_price_annual : plan.seat_price_monthly)} per seat / month,{" "}
                        {b === "annual" ? "paid yearly" : "paid each month"}
                      </small>
                      {b === "annual" && planQuote.annualSavingsPerYear > 0 && (
                        <small className="saving">Save {m(planQuote.annualSavingsPerYear)} a year</small>
                      )}
                    </RadioCard>
                  ))}
                </div>
              </fieldset>
              <fieldset className="field">
                <legend>Support</legend>
                <span className="hint">Your total is in the price summary.</span>
                <div className="radio-cards radio-cards--wide">
                  {c.support_levels.map((s) => {
                    return (
                      <RadioCard key={s.key} name="support_level" value={s.key} checked={f.support_level === s.key} onChange={() => update("support_level", s.key)}>
                        <strong>{s.name}</strong>
                        <small>{supportPriceText(s, m)}</small>
                        {s.first_reply && <small>First reply within {s.first_reply}</small>}
                        {s.channels.length > 0 && <small>{s.channels.join(", ")}</small>}
                        {hasLiveHelp(s) && <small>Live help: {s.live_help}</small>}
                      </RadioCard>
                    );
                  })}
                </div>
                {errorFor("support_level") && <span className="field-error">{errorFor("support_level")}</span>}
              </fieldset>
              <NumberStepper
                id="extra_storage_blocks"
                label={`Extra storage (${c.extra_storage.block_gb} GB blocks, optional)`}
                hint={`${plan.name} includes ${formatNumber(planQuote.includedStorageGb)} GB for ${seatsText(planQuote.seats)} (${formatNumber(plan.allowances.storage_gb_per_seat)} GB per seat). Each extra ${c.extra_storage.block_gb} GB is ${m(c.extra_storage.price)} a month.`}
                error={errorFor("extra_storage_blocks")}
                value={f.extra_storage_blocks}
                min={0}
                max={c.extra_storage.max_blocks}
                onChange={(n) => update("extra_storage_blocks", n)}
                decLabel={`Remove ${c.extra_storage.block_gb} GB`}
                incLabel={`Add ${c.extra_storage.block_gb} GB`}
                unit={planQuote.storageBlocks > 0 ? `= ${formatNumber(planQuote.storageBlocks * c.extra_storage.block_gb)} GB` : "None added"}
              />
              <fieldset className="field">
                <legend>How you'll pay</legend>
                <span className="hint">Bank debit is the default. You enter your bank or card details on the secure Stripe payment page.</span>
                <div className="radio-cards radio-cards--wide">
                  {PAYMENT_METHODS.map((pm) => (
                    <RadioCard key={pm.key} name="payment_method" value={pm.key} checked={f.payment_method === pm.key} onChange={() => update("payment_method", pm.key)}>
                      <strong>
                        {pm.name}
                        {pm.key === "acss_debit" ? " (recommended)" : ""}
                      </strong>
                      <small>{pm.detail}</small>
                    </RadioCard>
                  ))}
                </div>
                {errorFor("payment_method") && <span className="field-error">{errorFor("payment_method")}</span>}
              </fieldset>
              {f.plan === c.trial.for && (
                <p className="callout small">
                  On {plan.name}, you can try every {findPlan(c, c.trial.plan)?.name} feature free for {c.trial.days} days
                  from inside the app.
                </p>
              )}
            </>
          )}

          {step === "branding" && (
            <>
              <p className="muted">Optional. You can change all of this later from your settings.</p>
              <BrandFromWebsite website={f.website} form={f} apply={applyBrand} onScanned={(r) => setWebsiteFont(r.suggestions.font)} />
              <LogoUpload value={f.logo_file} onChange={(v) => update("logo_file", v)} error={errorFor("logo_file")} />
              <ColourField
                id="primary_color"
                label="Main brand colour"
                hint="Used for buttons and headers, with white text on it. White text needs a contrast of at least 4.5 to 1 to be easy to read."
                value={f.primary_color}
                onChange={(v) => update("primary_color", v)}
                error={errorFor("primary_color")}
                mode="white-text"
                fallback="#1f4e79"
              />
              <ColourField
                id="accent_color"
                label="Accent colour"
                hint="A second colour for highlights, badges and secondary buttons, also with white text on it."
                value={f.accent_color}
                onChange={(v) => update("accent_color", v)}
                error={errorFor("accent_color")}
                mode="white-text"
                fallback="#0e6655"
              />
              <ColourField
                id="background_color"
                label="Background colour (optional)"
                hint="For page backgrounds and panels, with dark text on it. Leave it empty for our light grey."
                value={f.background_color}
                onChange={(v) => update("background_color", v)}
                error={errorFor("background_color")}
                mode="dark-text"
                fallback="#f4f6f7"
                optional
              />
              <FontField value={f.font_family} onChange={(v) => update("font_family", v)} websiteFont={websiteFont} error={errorFor("font_family")} />
              <Field id="assistant_name" label="Assistant's name (optional)" hint="What your AI assistant calls itself with clients, like Ava or Max." error={errorFor("assistant_name")}>
                {(a) => <input {...a} type="text" maxLength={40} value={f.assistant_name} onChange={(e) => update("assistant_name", e.target.value)} />}
              </Field>
            </>
          )}

          {step === "review" && (
            <div className="review">
              <dl>
                <dt>Company</dt>
                <dd>
                  {f.company_name} ({f.legal_name})
                </dd>
                <dt>Mailing address</dt>
                <dd data-testid="review-address">{oneLineAddress(f)}</dd>
                {f.website && (
                  <>
                    <dt>Website</dt>
                    <dd>{normaliseWebsite(f.website)}</dd>
                  </>
                )}
                <dt>Company code</dt>
                <dd>{f.company_code}</dd>
                <dt>Contact</dt>
                <dd>
                  {f.contact_name}, {f.contact_email}, {f.contact_phone}
                </dd>
                <dt>Plan</dt>
                <dd data-testid="review-plan">
                  {plan?.name}, billed {f.billing_interval === "annual" ? "annually" : "monthly"}
                </dd>
                <dt>Seats</dt>
                <dd data-testid="review-seats">{seatsText(planQuote.seats)}</dd>
                <dt>Support</dt>
                <dd data-testid="review-support">{findSupport(c, f.support_level)?.name}</dd>
                <dt>Extra storage</dt>
                <dd data-testid="review-storage">
                  {planQuote.storageBlocks > 0 ? `${formatNumber(planQuote.storageBlocks * c.extra_storage.block_gb)} GB` : "None"}
                </dd>
                <dt>Payment</dt>
                <dd data-testid="review-payment">
                  {PAYMENT_METHODS.find((pm) => pm.key === f.payment_method)?.name ?? "Bank debit"}
                </dd>
                <dt>Monthly total</dt>
                <dd data-testid="review-monthly">{m(planQuote.monthlyTotal)}</dd>
                <dt>First payment</dt>
                <dd data-testid="review-first-payment">
                  {m(planQuote.firstPayment)}
                  {planQuote.onboardingFee ? ` (includes ${m(planQuote.onboardingFee)} onboarding)` : ""}
                </dd>
                <dt>Branding</dt>
                <dd data-testid="review-branding">
                  Main {f.primary_color || "default"}, accent {f.accent_color || "default"}
                  {f.background_color ? `, background ${f.background_color}` : ""}
                  {f.font_family ? `, font ${f.font_family}` : ""}
                  {f.logo_file ? `, logo ${f.logo_file.name}` : ", no logo yet"}
                  {f.assistant_name ? `, assistant named ${f.assistant_name}` : ""}
                </dd>
              </dl>
              <p className="small">
                Need to change something?{" "}
                <button type="button" className="btn btn--quiet" style={{ minHeight: 36, padding: "0.2rem 0.6rem" }} onClick={() => setStep("plan")}>
                  Change plan, seats or support
                </button>{" "}
                <button type="button" className="btn btn--quiet" style={{ minHeight: 36, padding: "0.2rem 0.6rem" }} onClick={() => setStep("company")}>
                  Edit company details
                </button>
              </p>
              <div className="check">
                <input
                  id="accept_terms"
                  type="checkbox"
                  checked={f.accept_terms}
                  onChange={(e) => update("accept_terms", e.target.checked)}
                  aria-invalid={Boolean(errorFor("accept_terms"))}
                  aria-describedby={errorFor("accept_terms") ? "accept_terms-error" : undefined}
                />
                <label htmlFor="accept_terms">
                  I accept the{" "}
                  <a href="/terms" target="_blank" rel="noopener">
                    terms of service
                  </a>{" "}
                  on behalf of {f.company_name || "my company"}.
                </label>
              </div>
              {errorFor("accept_terms") && (
                <span className="field-error" id="accept_terms-error" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
                  {errorFor("accept_terms")}
                </span>
              )}
              <div className="check">
                <input
                  id="accept_privacy"
                  type="checkbox"
                  checked={f.accept_privacy}
                  onChange={(e) => update("accept_privacy", e.target.checked)}
                  aria-invalid={Boolean(errorFor("accept_privacy"))}
                  aria-describedby={errorFor("accept_privacy") ? "accept_privacy-error" : undefined}
                />
                <label htmlFor="accept_privacy">
                  I accept the{" "}
                  <a href="/privacy" target="_blank" rel="noopener">
                    privacy policy
                  </a>
                  .
                </label>
              </div>
              {errorFor("accept_privacy") && (
                <span className="field-error" id="accept_privacy-error" style={{ marginTop: "-0.5rem" }}>
                  {errorFor("accept_privacy")}
                </span>
              )}
              <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
              {errorFor("turnstile_token") && <span className="field-error">{errorFor("turnstile_token")}</span>}
            </div>
          )}

          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website_url">Leave this field empty</label>
            <input
              id="website_url"
              name="website_url"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={f.website_url}
              onChange={(e) => setF((p) => ({ ...p, website_url: e.target.value }))}
            />
          </div>

          <div className="form-actions">
            {idx > 0 ? (
              <button type="button" className="btn btn--quiet" onClick={back}>
                Back
              </button>
            ) : (
              <span />
            )}
            <button type="submit" className="btn" disabled={submitting}>
              {step === "review" ? (submitting ? "Submitting…" : "Continue to payment") : "Next"}
            </button>
          </div>
        </form>
        <PriceSummary c={c} f={f} adjust={adjust} showControls={step !== "plan"} onDetails={() => goToStep("plan")} />
      </div>
    </>
  );
}
