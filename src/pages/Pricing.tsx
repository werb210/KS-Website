import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { FeatureRequest } from "../components/FeatureRequest";
import { PRODUCT_NAME } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { usePageMeta } from "../hooks/usePageMeta";
import type { BillingInterval, Catalog, Plan } from "../lib/plans";
import { findSupport, hasLiveHelp, marketingAddonOf, marketingOf, signingsOf, trialPlanNames } from "../lib/plans";
import { formatMoney, formatNumber, quote } from "../lib/pricing";

export function BillingToggle({ value, onChange }: { value: BillingInterval; onChange: (b: BillingInterval) => void }) {
  return (
    <div className="toggle" role="group" aria-label="Billing">
      <button type="button" aria-pressed={value === "annual"} onClick={() => onChange("annual")}>
        Billed annually
      </button>
      <button type="button" aria-pressed={value === "monthly"} onClick={() => onChange("monthly")}>
        Billed monthly
      </button>
    </div>
  );
}

function newFeatures(c: Catalog, plan: Plan) {
  const idx = c.plans.findIndex((p) => p.key === plan.key);
  if (idx <= 0) return { previous: null as Plan | null, list: plan.features };
  const prev = c.plans[idx - 1];
  const prevKeys = new Set(prev.features.map((f) => f.key));
  return { previous: prev, list: plan.features.filter((f) => !prevKeys.has(f.key)) };
}

function PlanColumn({ c, plan, seats, billing, supportKey, withMarketing }: {
  c: Catalog; plan: Plan; seats: number; billing: BillingInterval; supportKey: string; withMarketing: boolean;
}) {
  const addon = marketingAddonOf(c);
  const q = quote(plan, seats, billing, findSupport(c, supportKey), undefined, withMarketing ? addon.price : 0);
  const mk = marketingOf(plan);
  const signings = signingsOf(c);
  const money = (n: number) => formatMoney(n, c.currency);
  const a = plan.allowances;
  const { previous, list } = newFeatures(c, plan);
  return (
    <section className={`plan-col plan-col--${plan.key}`} aria-labelledby={`plan-${plan.key}`} data-testid={`plan-${plan.key}`}>
      <h3 id={`plan-${plan.key}`}>{plan.name}</h3>
      <p className="plan-price">
        {money(q.seatPrice)} <small>per seat / month</small>
      </p>
      <p className="small muted" style={{ margin: 0 }}>
        {billing === "annual" ? "Billed annually" : "Billed monthly"}
        {plan.min_seats > 1 ? `, ${plan.min_seats}-seat minimum` : ""}
      </p>
      <div className="plan-total" aria-live="polite">
        <strong>{money(q.monthlyTotal)}</strong> a month for {q.seats} {q.seats === 1 ? "seat" : "seats"}
        {q.supportMonthly > 0 && <> including {money(q.supportMonthly)} support</>}
        {q.marketingMonthly > 0 && <>{q.supportMonthly > 0 ? " and" : " including"} the {money(q.marketingMonthly)} Marketing add-on</>}
        {q.seatsAdjusted && <> ({plan.name} starts at {plan.min_seats} seats)</>}
        <br />
        {plan.onboarding_fee > 0 ? `One-time onboarding ${money(plan.onboarding_fee)}` : "No onboarding fee"}
      </div>
      <dl>
        <dt>Call minutes</dt>
        <dd>{formatNumber(a.minutes_per_seat)} per seat</dd>
        <dt>Texts</dt>
        <dd>{formatNumber(a.texts_per_seat)} per seat</dd>
        <dt>Assistant chats</dt>
        <dd>{a.assistant_chats == null ? "Unlimited" : `${formatNumber(a.assistant_chats)} a month`}</dd>
        <dt>Storage</dt>
        <dd>{a.storage_gb_per_seat} GB per seat</dd>
        <dt>Campaign emails</dt>
        <dd>
          {formatNumber(mk.campaign_emails + (withMarketing ? addon.extra_campaign_emails : 0))} a month
        </dd>
        <dt>E-signings</dt>
        <dd>{formatNumber(signings.included)} a month</dd>
      </dl>
      <div className="plan-col__features">
        <p className="small" style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
          {previous ? `Everything in ${previous.name}, plus` : "Includes"}
        </p>
        <ul className="tick-list">
          {list.map((f) => (
            <li key={f.key}>{f.label}</li>
          ))}
        </ul>
      </div>
      <Link className={plan.key === "growth" ? "btn" : "btn btn--ghost"} to={`/signup?plan=${plan.key}&seats=${q.seats}&billing=${billing}${withMarketing ? "&addon=marketing" : ""}`}>
        Choose {plan.name}
      </Link>
    </section>
  );
}

export default function Pricing() {
  usePageMeta(
    "Pricing",
    `${PRODUCT_NAME} pricing: Starter, Growth and Pro plans per seat, with pooled call minutes and texts, support levels and a 14-day Pro trial.`,
    "/pricing",
  );
  const { catalog: c, source } = useCatalog();
  const [billing, setBilling] = useState<BillingInterval>("annual");
  const [seats, setSeats] = useState(5);
  const [supportKey, setSupportKey] = useState("email");
  const [withMarketing, setWithMarketing] = useState(false);
  const addon = marketingAddonOf(c);
  const signings = signingsOf(c);
  const limitText = (v: number | null, unit = "") => (v === null ? "Unlimited" : `${formatNumber(v)}${unit}`);
  const historyText = (d: number | null) => (d === null ? "Full history" : d >= 365 ? "12 months" : `${d} days`);
  const seatsId = useId();
  const supportId = useId();
  const money = (n: number) => formatMoney(n, c.currency);
  const trialFor = trialPlanNames(c);
  const trialPlan = c.plans.find((p) => p.key === c.trial.plan)?.name ?? "Pro";
  const maxSaving = Math.max(...c.plans.map((p) => p.seat_price_monthly - p.seat_price_annual));

  return (
    <>
      <div className="wrap page-head">
        <h1>Pricing per seat, pooled across your team</h1>
        <p>
          A seat is one person on your team who signs in. Call minutes and texts are shared by everyone, so a busy
          closer can use what a new hire doesn't. Prices are in {c.currency === "CAD" ? "Canadian dollars" : c.currency}.
        </p>
      </div>

      <div className="wrap">
        <div className="pricing-controls">
          <div>
            <span className="small" style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>
              Billing
            </span>
            <BillingToggle value={billing} onChange={setBilling} />
            <span className="small muted" style={{ display: "block", marginTop: "0.35rem" }}>
              Annual billing saves up to {money(maxSaving)} per seat each month.
            </span>
          </div>
          <div className="field" style={{ margin: 0, width: "9rem" }}>
            <label htmlFor={seatsId}>Seats</label>
            <input
              id={seatsId}
              type="number"
              inputMode="numeric"
              min={1}
              max={500}
              value={seats}
              onChange={(e) => setSeats(Math.max(1, Math.min(500, Math.floor(Number(e.target.value) || 1))))}
            />
          </div>
          <div className="field" style={{ margin: 0, minWidth: "12rem" }}>
            <label htmlFor={supportId}>Support</label>
            <select id={supportId} value={supportKey} onChange={(e) => setSupportKey(e.target.value)}>
              {c.support_levels.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name} {s.price ? `(${money(s.price)}/month)` : "(included)"}
                </option>
              ))}
            </select>
          </div>
          <label className="check" style={{ margin: 0, alignSelf: "end" }}>
            <input type="checkbox" checked={withMarketing} onChange={(e) => setWithMarketing(e.target.checked)} />
            <span>Add the Marketing add-on ({money(addon.price)}/month)</span>
          </label>
        </div>

        <div className="plan-columns">
          {c.plans.map((p) => (
            <PlanColumn key={p.key} c={c} plan={p} seats={seats} billing={billing} supportKey={supportKey} withMarketing={withMarketing} />
          ))}
        </div>
        {source === "fallback" && (
          <p className="source-note" role="note">
            Showing our standard price list. Your sign-up confirms the current prices before you pay.
          </p>
        )}

        <div className="callout" style={{ margin: "2.5rem 0" }}>
          <h2 style={{ fontSize: "var(--step-1)" }}>Try every {trialPlan} feature free for {c.trial.days} days on {trialFor}</h2>
          <p>
            On {trialFor}, switch on a {c.trial.days}-day trial from inside the app whenever you're ready. You get every{" "}
            {trialPlan} feature for the trial, and on Starter {formatNumber(c.trial.bonus_minutes_per_seat)} extra call minutes
            and {formatNumber(c.trial.bonus_texts_per_seat)} extra texts per seat as well. When it ends you stay on your plan
            unless you choose to upgrade. One trial per brokerage.
          </p>
        </div>
      </div>

      {/* KS_WEBSITE_MARKETING_ADDON */}
      <section className="section" aria-labelledby="marketing-h" data-testid="marketing-section">
        <div className="wrap">
          <h2 id="marketing-h">Marketing on every plan, more with the add-on</h2>
          <p className="muted">
            Every plan can email and text its own client list. The Marketing add-on is {money(addon.price)} a month for your
            whole brokerage, on any plan, and it never takes anything away. No charge per contact: market to as many past
            clients as you have. Both free trials include it.
          </p>
          <div className="table-scroll">
            <table className="data">
              <caption className="visually-hidden">Marketing by plan, and with the Marketing add-on</caption>
              <thead>
                <tr>
                  <th scope="col">Marketing</th>
                  {c.plans.map((p) => (
                    <th scope="col" key={p.key}>{p.name}</th>
                  ))}
                  <th scope="col">With the add-on (any plan)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Campaign emails a month</th>
                  {c.plans.map((p) => <td key={p.key}>{formatNumber(marketingOf(p).campaign_emails)}</td>)}
                  <td>
                    {formatNumber(addon.extra_campaign_emails)} more, then {money(c.overage.campaign_email_block ?? 10)} per{" "}
                    {formatNumber(c.overage.campaign_email_block_size ?? 10000)}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Text campaigns</th>
                  {c.plans.map((p) => <td key={p.key}>Plan texts</td>)}
                  <td>Plus {formatNumber(addon.bonus_marketing_texts)} bonus marketing texts a month</td>
                </tr>
                <tr>
                  <th scope="row">Send one text to many</th>
                  {c.plans.map((p) => <td key={p.key}>{formatNumber(marketingOf(p).text_to_many)} per send</td>)}
                  <td>{formatNumber(addon.text_to_many)} per send</td>
                </tr>
                <tr>
                  <th scope="row">Sequences running at once</th>
                  {c.plans.map((p) => <td key={p.key}>{limitText(marketingOf(p).sequences)}</td>)}
                  <td>{limitText(addon.sequences)}</td>
                </tr>
                <tr>
                  <th scope="row">Templates, unsubscribe handling, consent and quiet hours</th>
                  {c.plans.map((p) => <td key={p.key} className="yes">Included</td>)}
                  <td className="yes">Included</td>
                </tr>
                <tr>
                  <th scope="row">Lead form for your website</th>
                  {c.plans.map((p) => <td key={p.key}>{limitText(marketingOf(p).lead_forms)}</td>)}
                  <td>Unlimited, plus an AI chat widget and tracking script</td>
                </tr>
                <tr>
                  <th scope="row">Visitor history</th>
                  {c.plans.map((p) => <td key={p.key}>{historyText(marketingOf(p).visitor_history_days)}</td>)}
                  <td>Full history, plus session replay</td>
                </tr>
                <tr>
                  <th scope="row">Campaign report</th>
                  {c.plans.map((p) => <td key={p.key}>Sent, opened, clicked, unsubscribed</td>)}
                  <td>Plus applications and funded deals by campaign</td>
                </tr>
                <tr>
                  <th scope="row">Google Ads</th>
                  {c.plans.map((p) => (
                    <td key={p.key}>{p.features.some((f) => f.key === "ad_attribution") ? "Full attribution, ad-waste, Customer Match" : "Results"}</td>
                  ))}
                  <td>Full tools on every plan</td>
                </tr>
                <tr>
                  <th scope="row">Lead scoring, subject-line A/B test, send-time choice</th>
                  {c.plans.map((p) => <td key={p.key} className="no">—<span className="visually-hidden">Not included</span></td>)}
                  <td className="yes">Included</td>
                </tr>
                <tr>
                  <th scope="row">Who uses the advanced tools</th>
                  {c.plans.map((p) => <td key={p.key}>—</td>)}
                  <td>Admins plus up to {addon.marketing_seats} people with the Marketing role</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: "0.75rem" }}>
            Marketing users are normal paid seats switched to the Marketing role. Ad spend is paid directly to Google or
            LinkedIn.
          </p>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="support-h">
        <div className="wrap">
          <h2 id="support-h">Support levels</h2>
          <p className="muted">Email support is included with every plan. Add a higher level any time.</p>
          <div className="table-scroll">
            <table className="data">
              <caption className="visually-hidden">Support levels compared</caption>
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Price per month</th>
                  <th scope="col">Seats covered</th>
                  <th scope="col">Each extra seat</th>
                  <th scope="col">How to reach us</th>
                  <th scope="col">First reply</th>
                  <th scope="col">Live help</th>
                </tr>
              </thead>
              <tbody>
                {c.support_levels.map((s) => (
                  <tr key={s.key}>
                    <th scope="row">{s.name}</th>
                    <td>{s.price ? money(s.price) : "Included"}</td>
                    <td>{s.covered_seats == null ? "All" : s.covered_seats}</td>
                    <td>{s.covered_seats == null ? "—" : money(s.extra_seat_price)}</td>
                    <td>{s.channels.join(", ")}</td>
                    <td>{s.first_reply}</td>
                    <td className={hasLiveHelp(s) ? "yes" : "no"}>{hasLiveHelp(s) ? s.live_help : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="usage-h">
        <div className="wrap split">
          <div>
            <h2 id="usage-h">If you use more</h2>
            <p>
              Calls connect, texts send, signings go out and uploads keep uploading when your team goes past an
              allowance. Extra use is added to your next bill.
            </p>
          </div>
          <ul className="plain-list">
            <li>
              <strong>Call minutes</strong> beyond your pooled allowance: {money(c.overage.minute)} a minute
            </li>
            <li>
              <strong>Texts</strong> beyond your pooled allowance: {money(c.overage.text)} a text
            </li>
            {c.id_checks ? (
              <li>
                <strong>ID checks</strong> (ID and selfie verification, Growth and Pro): {c.id_checks.included.growth} a month
                included on Growth and {c.id_checks.included.pro} on Pro, then {money(c.id_checks.price)} a check
              </li>
            ) : null}
            <li>
              <strong>E-signings</strong>: {formatNumber(signings.included)} a month are included with every plan. Each signing
              after that is {money(signings.price)}, added to next month's bill. A signing is one signature request sent to one
              signer.
            </li>
            <li>
              <strong>Campaign emails</strong> with the Marketing add-on: {money(c.overage.campaign_email_block ?? 10)} for
              each extra {formatNumber(c.overage.campaign_email_block_size ?? 10000)}. Without the add-on, campaign emails
              pause at your plan's allowance until the 1st.
            </li>
            <li>
              <strong>Extra storage</strong>: {money(c.extra_storage.price)} a month for each {c.extra_storage.block_gb} GB
            </li>
            <li>
              <strong>Assistant chats</strong> over a monthly limit: the assistant lets you know and offers an upgrade.
              No surprise charges.
            </li>
          </ul>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <h2>Compare every feature</h2>
          <div className="table-scroll">
            <table className="data">
              <caption className="visually-hidden">Features by plan</caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {c.plans.map((p) => (
                    <th scope="col" key={p.key}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.plans[c.plans.length - 1].features.map((f) => (
                  <tr key={f.key}>
                    <th scope="row">{f.label}</th>
                    {c.plans.map((p) => {
                      const has = p.features.some((x) => x.key === f.key);
                      return (
                        <td key={p.key} className={has ? "yes" : "no"}>
                          {has ? "Included" : "—"}
                          {!has && <span className="visually-hidden">Not included</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "1.5rem" }}>
            Weighing us against Salesforce, HubSpot or a lending CRM?{" "}
            <Link to="/compare">See how {PRODUCT_NAME} compares</Link>, with the monthly cost for a 5-person brokerage.
          </p>
          <p style={{ marginTop: "2rem" }}>
            <Link className="btn" to="/signup">
              Start sign-up
            </Link>{" "}
            <Link className="btn btn--quiet" to="/contact">
              Talk to us first
            </Link>
          </p>
        </div>
      </section>
      <FeatureRequest />
    </>
  );
}
