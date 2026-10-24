import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Field } from "../components/Field";
import { NumberStepper } from "../components/NumberStepper";
import { Turnstile } from "../components/Turnstile";
import { PRODUCT_NAME, TURNSTILE_SITE_KEY } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { useCodeAvailability } from "../hooks/useCodeAvailability";
import { usePageMeta } from "../hooks/usePageMeta";
import { submitSignup, type SignupPayload } from "../lib/api";
import { contrastRatio, darkenForWhiteText } from "../lib/contrast";
import { goTo } from "../lib/navigate";
import type { BillingInterval, Catalog, PlanKey, SupportLevel } from "../lib/plans";
import { MAX_SEATS, PAYMENT_METHODS, findPlan, findSupport, hasLiveHelp, isPaymentMethod } from "../lib/plans";
import { clampInt, formatMoney, formatNumber, seatRange, signupQuote, supportMonthly } from "../lib/pricing";
import { regionsFor } from "../lib/regions";
import { DRAFT_KEY, LAST_SIGNUP_KEY, load, remove, save } from "../lib/storage";
import {
  EMPTY_FORM,
  FIELD_STEP,
  STEP_LABELS,
  STEPS,
  normaliseWebsite,
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
  return {
    company_name: f.company_name.trim(),
    legal_name: f.legal_name.trim(),
    company_code: f.company_code.trim(),
    country: f.country,
    province_state: f.province_state,
    mailing_address: f.mailing_address.trim(),
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
    logo_url: opt(f.logo_url),
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

  const contrast = useMemo(() => contrastRatio(f.primary_color, "#ffffff"), [f.primary_color]);
  const darker = contrast !== null && contrast < 4.5 ? darkenForWhiteText(f.primary_color) : null;
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
            <strong>{f.contact_email}</strong> within one business day to set up payment.
          </p>
          {done.message && <p>{done.message}</p>}
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
              <div className="row-2">
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
              <Field id="mailing_address" label="Mailing address" hint="Street, city and postal or ZIP code." error={errorFor("mailing_address")}>
                {(a) => <textarea {...a} rows={3} autoComplete="street-address" value={f.mailing_address} onChange={(e) => update("mailing_address", e.target.value)} />}
              </Field>
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
                they use your brokerage's own branded app or your web client portal.
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
                unit={`× ${m(planQuote.seatPrice)} = ${m(planQuote.seatsMonthly)} a month`}
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
                <span className="hint">The price for your {seatsText(planQuote.seats)} is shown on each option.</span>
                <div className="radio-cards radio-cards--wide">
                  {c.support_levels.map((s) => {
                    const cost = supportMonthly(s, planQuote.seats);
                    return (
                      <RadioCard key={s.key} name="support_level" value={s.key} checked={f.support_level === s.key} onChange={() => update("support_level", s.key)}>
                        <strong>{s.name}</strong>
                        <small className="radio-card__price">{cost ? `${m(cost)} a month for your team` : "Included"}</small>
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
                unit={
                  planQuote.storageBlocks > 0
                    ? `= ${formatNumber(planQuote.storageBlocks * c.extra_storage.block_gb)} GB, ${m(planQuote.storageMonthly)} a month`
                    : "None added"
                }
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
              <Field id="logo_url" label="Logo link (optional)" hint="A https:// link to your logo image (PNG or SVG). Or email it to us later." error={errorFor("logo_url")}>
                {(a) => <input {...a} type="url" inputMode="url" placeholder="https://" value={f.logo_url} onChange={(e) => update("logo_url", e.target.value)} />}
              </Field>
              <div className="field">
                <label htmlFor="primary_color">Main brand colour</label>
                <span className="hint" id="primary_color-hint">
                  Used for buttons and headers. White text needs a contrast of at least 4.5 to 1 to be easy to read.
                </span>
                <div className="swatch-row">
                  <input
                    type="color"
                    aria-label="Pick a colour"
                    value={/^#[0-9a-f]{6}$/i.test(f.primary_color) ? f.primary_color : "#1f4e79"}
                    onChange={(e) => update("primary_color", e.target.value)}
                  />
                  <input
                    id="primary_color"
                    type="text"
                    style={{ maxWidth: "9rem" }}
                    aria-describedby={`primary_color-hint primary_color-check${errorFor("primary_color") ? " primary_color-error" : ""}`}
                    aria-invalid={Boolean(errorFor("primary_color"))}
                    value={f.primary_color}
                    onChange={(e) => update("primary_color", e.target.value.trim())}
                  />
                  {contrast !== null && (
                    <span className="swatch-preview" style={{ background: f.primary_color }} aria-hidden="true">
                      Apply now
                    </span>
                  )}
                </div>
                <span id="primary_color-check" aria-live="polite">
                  {contrast !== null &&
                    (contrast >= 4.5 ? (
                      <span className="field-ok">Contrast with white text: {contrast.toFixed(1)} to 1. Easy to read.</span>
                    ) : (
                      <span className="field-error">
                        Contrast with white text: {contrast.toFixed(1)} to 1. Too light for white text.{" "}
                        {darker && (
                          <button type="button" className="btn btn--quiet" style={{ minHeight: 36, padding: "0.25rem 0.6rem", marginTop: "0.4rem" }} onClick={() => update("primary_color", darker)}>
                            Use {darker} instead
                          </button>
                        )}
                      </span>
                    ))}
                </span>
                {errorFor("primary_color") && (
                  <span className="field-error" id="primary_color-error">
                    {errorFor("primary_color")}
                  </span>
                )}
              </div>
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
                <dt>Location</dt>
                <dd>
                  {f.mailing_address}, {f.province_state}, {f.country === "US" ? "United States" : "Canada"}
                </dd>
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
                <dd data-testid="review-seats">
                  {seatsText(planQuote.seats)} × {m(planQuote.seatPrice)} = {m(planQuote.seatsMonthly)} a month
                </dd>
                <dt>Support</dt>
                <dd data-testid="review-support">
                  {findSupport(c, f.support_level)?.name}, {planQuote.supportMonthly ? `${m(planQuote.supportMonthly)} a month` : "included"}
                </dd>
                <dt>Extra storage</dt>
                <dd data-testid="review-storage">
                  {planQuote.storageBlocks > 0
                    ? `${formatNumber(planQuote.storageBlocks * c.extra_storage.block_gb)} GB, ${m(planQuote.storageMonthly)} a month`
                    : "None"}
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
                <dd>
                  {f.primary_color || "Default colour"}
                  {f.assistant_name ? `, assistant named ${f.assistant_name}` : ""}
                  {f.logo_url ? ", logo provided" : ""}
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
