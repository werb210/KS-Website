// KS_WEBSITE_OVERHAUL - "what a 5-person brokerage pays": Keystone Growth + the Marketing add-on from the live catalogue
// (or the bundled copy), and each general CRM's matching stack from src/data/compare.ts. Shared by /compare, /why-keystone
// and the home page so every figure on the site is the same number. Nothing here is estimated.
import { COMPETITORS, KEYSTONE_MATCH, priceTotals, type Competitor, type PriceTotals } from "../data/compare";
import type { Catalog, Plan } from "./plans";
import { quote } from "./pricing";

export const MATCH_SEATS = 5;
export const MATCH_PLAN = "growth";

export type KeystoneMatch = {
  plan: Plan;
  seats: number;
  /** Seats a month, billed annually. */
  seatsMonthly: number;
  addon: number;
  /** Seats + add-on a month, billed annually. */
  monthly: number;
  /** Seats + add-on a month, billed monthly. */
  monthlyBilledMonthly: number;
  onboarding: number;
  firstYear: number;
  minutes: number;
  texts: number;
};

export function keystoneMatch(catalog: Catalog): KeystoneMatch {
  const plan = catalog.plans.find((p) => p.key === MATCH_PLAN) ?? catalog.plans[0];
  const annual = quote(plan, MATCH_SEATS, "annual", undefined);
  const monthly = quote(plan, MATCH_SEATS, "monthly", undefined);
  // The add-on price from the live catalogue once it sends one, else KS-Ops' bundled figure.
  const addon = (catalog as { marketing_addon?: { price?: number } }).marketing_addon?.price ?? KEYSTONE_MATCH.addonPrice;
  const total = annual.monthlyTotal + addon;
  return {
    plan,
    seats: annual.seats,
    seatsMonthly: annual.monthlyTotal,
    addon,
    monthly: total,
    monthlyBilledMonthly: monthly.monthlyTotal + addon,
    onboarding: plan.onboarding_fee,
    firstYear: total * 12 + plan.onboarding_fee,
    minutes: plan.allowances.minutes_per_seat * annual.seats,
    texts: plan.allowances.texts_per_seat * annual.seats,
  };
}

/** "CAD $595", "USD $500": the currency code first, so prices in different currencies can't be mistaken. */
export const money = (n: number, currency: string) =>
  `${currency} $${new Intl.NumberFormat("en-CA", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n)}`;

/** "CAD $1,819" or "CAD $182 + USD $49", for one field of the per-currency totals. */
export const sumText = (totals: PriceTotals, field: "monthly" | "firstYear" | "oneTime") =>
  totals.byCurrency
    .filter((t) => t[field] > 0)
    .map((t) => money(t[field], t.currency))
    .join(" + ");

/** The general CRMs, most used first, each with its price totals. */
export function stacks(): Array<{ c: Competitor; totals: PriceTotals }> {
  return COMPETITORS.filter((c) => c.kind === "general")
    .sort((a, b) => a.rank - b.rank)
    .map((c) => ({ c, totals: priceTotals(c.price) }));
}
