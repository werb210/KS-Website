import { Fragment, useId, useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatNumber, quote } from "../lib/pricing";
import {
  CHECKED_LABEL,
  COMPETITORS,
  DEFAULT_COMPARE,
  KEYSTONE_MATCH,
  LEFT_OUT,
  OURS,
  ROWS,
  competitor,
  priceTotals,
  sourceOf,
  type Competitor,
  type CompetitorCell,
  type Mark,
  type OurCell,
  type PriceTotals,
} from "../data/compare";

const SEATS = 5;
const OUR_PLAN = "growth";

const MARK_TEXT: Record<Mark, { symbol: string; text: string }> = {
  yes: { symbol: "✓", text: "Yes" },
  addon: { symbol: "", text: "Add-on" },
  limited: { symbol: "", text: "Limited" },
  no: { symbol: "✗", text: "No" },
  unknown: { symbol: "", text: "Not stated" },
};

/** "CAD $595", "USD $500": the currency code first, so prices in different currencies can't be mistaken. */
const money = (n: number, currency: string) =>
  `${currency} $${new Intl.NumberFormat("en-CA", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n)}`;

/** Footnote numbers for the sources of the competitors on screen, in the order they are first used. */
function numberSources(shown: Competitor[]) {
  const order: Array<{ key: string; c: Competitor; id: string }> = [];
  const index = new Map<string, number>();
  const add = (c: Competitor, id: string) => {
    const key = `${c.id}:${id}`;
    if (!index.has(key)) {
      order.push({ key, c, id });
      index.set(key, order.length);
    }
  };
  for (const c of shown) for (const l of c.price.lines) add(c, l.src);
  for (const r of ROWS) for (const c of shown) add(c, c.cells[r.id].src);
  return { order, num: (c: Competitor, id: string) => index.get(`${c.id}:${id}`) ?? 0 };
}

function SourceRef({ n, label }: { n: number; label: string }) {
  return (
    <sup className="compare-ref">
      <a href={`#compare-src-${n}`} aria-label={`Source ${n}: ${label}`}>
        {n}
      </a>
    </sup>
  );
}

/** "CAD $1,819" or "CAD $182 + USD $49", for one field of the per-currency totals. */
const sumText = (totals: PriceTotals, field: "monthly" | "firstYear" | "oneTime") =>
  totals.byCurrency
    .filter((t) => t[field] > 0)
    .map((t) => money(t[field], t.currency))
    .join(" + ");

function CompetitorPrice({ c, num, col }: { c: Competitor; num: (c: Competitor, id: string) => number; col: number }) {
  const p = c.price;
  const totals = priceTotals(p);
  const from = totals.from ? "From " : "";
  const oneTime = sumText(totals, "oneTime");
  return (
    <td className={`compare-cell compare-col--${col}`} data-testid={`compare-price-${c.id}`}>
      <strong>{totals.onRequest ? "Price on request" : `${from}${sumText(totals, "monthly")}`}</strong>
      {!totals.onRequest && <span className="compare-per"> a month{p.billing ? `, ${p.billing}` : ""}</span>}
      <ul className="compare-lines">
        {p.lines.map((l) => (
          <li key={l.item}>
            {l.item}:{" "}
            <span className="compare-line-price">
              {l.monthly == null ? "price not published" : `${l.from ? "from " : ""}${money(l.monthly, l.currency)} a month`}
              {l.oneTime != null && ` + ${money(l.oneTime, l.currency)} one-time`}
            </span>
            <SourceRef n={num(c, l.src)} label={sourceOf(c, l.src)?.title ?? c.name} />
          </li>
        ))}
      </ul>
      {!totals.onRequest && (
        <span className="compare-first-year" data-testid={`compare-first-year-${c.id}`}>
          First year: {from}
          {sumText(totals, "firstYear")}
          {oneTime ? ` (12 months + ${oneTime} one-time)` : " (12 months)"}
        </span>
      )}
      {p.note && <span className="compare-note">{p.note}.</span>}
    </td>
  );
}

function OurCellView({ cell }: { cell: OurCell }) {
  return (
    <td className={`compare-cell compare-cell--${cell.v}`} data-mark={cell.v}>
      {cell.v === "yes" ? (
        <>
          <span aria-hidden="true">✓</span>
          <span className="visually-hidden">Yes</span>
        </>
      ) : (
        <span className="compare-soon">Coming soon</span>
      )}
      {cell.note && <span className="compare-note">{cell.note}</span>}
    </td>
  );
}

function CompetitorCellView({ c, cell, n, col }: { c: Competitor; cell: CompetitorCell; n: number; col: number }) {
  const m = MARK_TEXT[cell.v];
  return (
    <td className={`compare-cell compare-cell--${cell.v} compare-col--${col}`} data-mark={cell.v}>
      {m.symbol ? (
        <>
          <span aria-hidden="true">{m.symbol}</span>
          <span className="visually-hidden">{m.text}</span>
        </>
      ) : (
        <span>{m.text}</span>
      )}
      <SourceRef n={n} label={sourceOf(c, cell.src)?.title ?? c.name} />
      {cell.note && <span className="compare-note">{cell.note}</span>}
    </td>
  );
}

export default function Compare() {
  usePageMeta(
    `${PRODUCT_NAME} compared with other CRMs`,
    `${PRODUCT_NAME} side by side with Salesforce, HubSpot, Zoho, Pipedrive and lending CRMs used by commercial-lending brokers: features, and what a 5-person brokerage pays each vendor to match ${PRODUCT_NAME} with marketing.`,
    "/compare",
  );
  const { catalog } = useCatalog();
  const [picked, setPicked] = useState<[string, string]>(DEFAULT_COMPARE);
  const selectIds = [useId(), useId()];

  const shown = picked.map((id) => competitor(id)).filter((c): c is Competitor => Boolean(c));
  const { order, num } = numberSources(shown);

  const plan = catalog.plans.find((p) => p.key === OUR_PLAN) ?? catalog.plans[0];
  const ours = quote(plan, SEATS, "annual", undefined);
  const oursMonthly = quote(plan, SEATS, "monthly", undefined);
  // KS_WEBSITE_COMPARE_MATCH - the add-on price from the live catalogue once it sends one, else KS-Ops' bundled figure.
  const addonPrice = (catalog as { marketing_addon?: { price?: number } }).marketing_addon?.price ?? KEYSTONE_MATCH.addonPrice;
  const oursTotal = ours.monthlyTotal + addonPrice;
  const oursMonthlyTotal = oursMonthly.monthlyTotal + addonPrice;

  function choose(slot: 0 | 1, id: string) {
    setPicked((prev) => {
      const next: [string, string] = [prev[0], prev[1]];
      const other = slot === 0 ? 1 : 0;
      // Picking the product already in the other column swaps the two.
      if (next[other] === id) next[other] = prev[slot];
      next[slot] = id;
      return next;
    });
  }

  return (
    <>
      <div className="wrap page-head">
        <h1>How {PRODUCT_NAME} compares</h1>
        <p>
          {PRODUCT_NAME} side by side with the CRMs commercial-lending, small-business-finance and equipment-finance
          brokers use most. Pick any two to compare.
        </p>
      </div>

      <div className="wrap">
        <div className="compare-controls">
          {[0, 1].map((slot) => (
            <div className={`field compare-pick compare-pick--${slot + 2}`} key={slot}>
              <label htmlFor={selectIds[slot]}>{slot === 0 ? "Compare with" : "And with"}</label>
              <select id={selectIds[slot]} value={picked[slot]} onChange={(e) => choose(slot as 0 | 1, e.target.value)}>
                {COMPETITORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="small muted compare-phone-hint">On a phone, the table shows {PRODUCT_NAME} and the first product you pick.</p>

        <div className="table-scroll compare-scroll">
          <table className="data compare-table" data-testid="compare-table">
            <caption className="visually-hidden">
              {PRODUCT_NAME} compared with {shown.map((c) => c.name).join(" and ")}
            </caption>
            <colgroup>
              <col className="compare-feature-col" />
              <col />
              {shown.map((c, i) => (
                <col key={c.id} className={`compare-col--${i + 2}`} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="compare-us">
                  {PRODUCT_NAME}
                </th>
                {shown.map((c, i) => (
                  <th scope="col" key={c.id} className={`compare-col--${i + 2}`} data-testid={`compare-head-${i + 2}`}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="compare-price">
                <th scope="row">
                  Cost for {SEATS} seats with marketing, to match {PRODUCT_NAME}
                  <span className="compare-note">
                    {PRODUCT_NAME} {plan.name} with the {KEYSTONE_MATCH.addonName}, against the fewest products each
                    vendor sells for the same jobs: marketing email at scale, sequences, bulk texting, lead scoring, email
                    A/B tests, Google Ads conversion sync, and calling and texting. List prices, in Canadian dollars
                    wherever the vendor shows them.
                  </span>
                </th>
                <td className="compare-cell" data-testid="compare-price-keystone">
                  <strong>{money(oursTotal, catalog.currency)}</strong>
                  <span className="compare-per"> a month, billed annually</span>
                  <ul className="compare-lines">
                    <li>
                      {plan.name}, {SEATS} seats: {money(ours.monthlyTotal, catalog.currency)} a month
                      {plan.onboarding_fee > 0 && ` + ${money(plan.onboarding_fee, catalog.currency)} one-time onboarding`}
                    </li>
                    <li>
                      {KEYSTONE_MATCH.addonName}: {money(addonPrice, catalog.currency)} a month
                    </li>
                  </ul>
                  <span className="compare-first-year" data-testid="compare-first-year-keystone">
                    First year: {money(oursTotal * 12 + plan.onboarding_fee, catalog.currency)}
                    {plan.onboarding_fee > 0 ? ` (12 months + ${money(plan.onboarding_fee, catalog.currency)} one-time)` : " (12 months)"}
                  </span>
                  <span className="compare-note">
                    {money(oursMonthlyTotal, catalog.currency)} a month if billed monthly. Includes{" "}
                    {formatNumber(plan.allowances.minutes_per_seat * SEATS)} call minutes and{" "}
                    {formatNumber(plan.allowances.texts_per_seat * SEATS)} texts a month. The add-on adds{" "}
                    {KEYSTONE_MATCH.addonIncludes}.
                  </span>
                </td>
                {shown.map((c, i) => (
                  <CompetitorPrice key={c.id} c={c} num={num} col={i + 2} />
                ))}
              </tr>
              {ROWS.map((r, i) => (
                <Fragment key={r.id}>
                  {(i === 0 || ROWS[i - 1].area !== r.area) && (
                    <tr className="compare-area">
                      <th scope="colgroup" colSpan={2 + shown.length}>
                        {r.area}
                      </th>
                    </tr>
                  )}
                  <tr data-row={r.id}>
                    <th scope="row">{r.label}</th>
                    <OurCellView cell={OURS[r.id]} />
                    {shown.map((c, ci) => (
                      <CompetitorCellView key={c.id} c={c} cell={c.cells[r.id]} n={num(c, c.cells[r.id].src)} col={ci + 2} />
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="compare-legend small">
          <p>
            <strong>✓</strong> included in the edition the source describes. <strong>Add-on</strong>: sold separately or through a
            marketplace app. <strong>Limited</strong>: part of it, as the note says. <strong>✗</strong>: not in that plan
            on the vendor's public site; marketplace apps or custom work may add it. <strong>Not stated</strong>: we
            couldn't confirm it either way from the vendor's public pages. <strong>Coming soon</strong>: being built now
            and not available yet.
          </p>
          <p className="source-note" role="note">
            Competitor information from their public websites as of {CHECKED_LABEL}; check their sites for current
            details. Prices are list prices before tax and aren't converted between currencies; we use Canadian dollars
            wherever the vendor shows them. "From" means a starting price, or that the vendor doesn't publish the price
            of a product in the list. {PRODUCT_NAME} prices are in Canadian dollars.{" "}
            <Link to="/pricing">See all {PRODUCT_NAME} plans</Link>.
          </p>
        </div>

        <section aria-labelledby="compare-sources-h" className="compare-sources">
          <h2 id="compare-sources-h" style={{ fontSize: "var(--step-1)" }}>
            Sources
          </h2>
          <ol>
            {order.map(({ key, c, id }, i) => {
              const src = sourceOf(c, id);
              return (
                <li key={key} id={`compare-src-${i + 1}`}>
                  {c.name}: {src ? <a href={src.url} rel="noopener noreferrer" target="_blank">{src.title}</a> : "source missing"}
                  {src && <span className="muted"> (checked {src.checked})</span>}
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="section section--surface" aria-labelledby="compare-why-h">
        <div className="wrap">
          <h2 id="compare-why-h">Which CRMs we compared, and why</h2>
          <p className="muted">
            Ordered by how often we found them named for commercial-lending, small-business-finance and
            equipment-finance brokers.
          </p>
          <ol className="compare-why">
            {[...COMPETITORS]
              .sort((x, y) => x.rank - y.rank)
              .map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> <span className="muted small">({c.kind === "general" ? "general CRM" : "built for lending"})</span>
                  <br />
                  <span>{c.why}</span>
                  {(() => {
                    const src = sourceOf(c, "usage");
                    return src ? (
                      <>
                        {" "}
                        <a href={src.url} rel="noopener noreferrer" target="_blank" className="small">
                          Source: {src.title}
                        </a>
                      </>
                    ) : null;
                  })()}
                </li>
              ))}
          </ol>
          <h3>Looked at and left out</h3>
          <ul className="plain-list">
            {LEFT_OUT.map((x) => (
              <li key={x.name}>
                <strong>{x.name}</strong>: {x.why}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "2rem" }}>
            <Link className="btn" to="/signup">
              Start sign-up
            </Link>{" "}
            <Link className="btn btn--quiet" to="/try">
              Try it yourself
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
