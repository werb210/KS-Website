// KS_WEBSITE_OVERHAUL - "a stack of products, or one system": each general CRM's matching stack as a row of blocks (one
// block per product a 5-person brokerage would buy), next to Keystone Growth + the Marketing add-on. Prices are the
// vendor's list prices in the vendor's own currency (src/data/compare.ts) and Keystone's from the catalogue; nothing is
// converted between currencies, so the comparison is the number of products and each one's own total.
import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { CHECKED_LABEL, KEYSTONE_MATCH, type PriceLine } from "../data/compare";
import { useCatalog } from "../hooks/useCatalog";
import { keystoneMatch, MATCH_SEATS, money, stacks, sumText } from "../lib/match";

/** "Sales Cloud Pro Suite, 5 seats (USD $100 a seat)" -> "Sales Cloud Pro Suite, 5 seats". */
export function shortName(item: string): string {
  const cut = item.split(/ \(|: |, priced|, including/)[0].trim();
  return cut.length > 52 ? `${cut.slice(0, 50).replace(/\s+\S*$/, "")}…` : cut;
}

function linePrice(l: PriceLine): string {
  if (l.monthly == null) return "price not published";
  return `${l.from ? "from " : ""}${money(l.monthly, l.currency)}/mo`;
}

export function StackCompare({ limit }: { limit?: number }) {
  const { catalog } = useCatalog();
  const k = keystoneMatch(catalog);
  const rows = stacks().slice(0, limit ?? undefined);
  return (
    <div className="stack-compare" data-testid="stack-compare">
      <div className="stack-row stack-row--us">
        <div className="stack-row__who">
          <h3>{PRODUCT_NAME}</h3>
          <p className="stack-row__total" data-testid="stack-total-keystone">
            <strong>{money(k.monthly, catalog.currency)}</strong> a month
          </p>
          <p className="small">
            {k.onboarding > 0 ? `+ ${money(k.onboarding, catalog.currency)} one-time onboarding. ` : ""}
            First year {money(k.firstYear, catalog.currency)}.
          </p>
        </div>
        <ol className="stack-row__blocks" aria-label={`What you buy from ${PRODUCT_NAME}`}>
          <li className="block block--key">
            <span className="block__name">
              {k.plan.name}, {k.seats} seats
            </span>
            <span className="block__price">{money(k.seatsMonthly, catalog.currency)}/mo</span>
          </li>
          <li className="block block--key">
            <span className="block__name">{KEYSTONE_MATCH.addonName}</span>
            <span className="block__price">{money(k.addon, catalog.currency)}/mo</span>
          </li>
        </ol>
      </div>
      {rows.map(({ c, totals }) => (
        <div className="stack-row" key={c.id} data-testid={`stack-${c.id}`}>
          <div className="stack-row__who">
            <h3>{c.name}</h3>
            <p className="stack-row__total">
              <strong>
                {totals.onRequest ? "Price on request" : `${totals.from ? "From " : ""}${sumText(totals, "monthly")}`}
              </strong>
              {!totals.onRequest && " a month"}
            </p>
            {sumText(totals, "oneTime") && <p className="small">+ {sumText(totals, "oneTime")} one-time onboarding.</p>}
          </div>
          <ol className="stack-row__blocks" aria-label={`What you buy from ${c.name}`}>
            {c.price.lines.map((l) => (
              <li className="block" key={l.item}>
                <span className="block__name">{shortName(l.item)}</span>
                <span className="block__price">{linePrice(l)}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="source-note">
        What a {MATCH_SEATS}-person brokerage buys to match {PRODUCT_NAME} {k.plan.name} with the{" "}
        {KEYSTONE_MATCH.addonName}: marketing email at scale, sequences, bulk texting, lead scoring, email A/B tests, Google Ads conversion sync, and
        calling and texting. Billed annually. List prices from each vendor's public pages as of {CHECKED_LABEL}, in the
        vendor's own currency (never converted). <Link to="/compare">Every line, feature and source</Link>.
      </p>
    </div>
  );
}
