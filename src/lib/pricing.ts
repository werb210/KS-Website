import type { BillingInterval, Catalog, Plan, SupportLevel } from "./plans";

/** Seats actually billed: whole number, at least 1 and at least the plan minimum (pro = 2). */
export function billableSeats(plan: Pick<Plan, "min_seats">, seats: number): number {
  const n = Math.floor(Number(seats));
  const whole = Number.isFinite(n) ? n : 1;
  return Math.max(1, plan.min_seats || 1, whole);
}

/** A whole number within [min, max]; anything unreadable becomes min. */
export function clampInt(n: number, min: number, max: number): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/** Seats someone can choose on a plan: the plan minimum up to the most the sign-up accepts. */
export function seatRange(plan: Pick<Plan, "min_seats" | "max_seats">): { min: number; max: number } {
  const min = Math.max(1, plan.min_seats || 1);
  return { min, max: Math.max(min, plan.max_seats || min) };
}

export function seatPrice(plan: Plan, billing: BillingInterval): number {
  return billing === "annual" ? plan.seat_price_annual : plan.seat_price_monthly;
}

/** Monthly support charge: base price plus a per-seat charge for seats beyond those covered. */
export function supportMonthly(level: SupportLevel | undefined, seats: number): number {
  if (!level) return 0;
  const extraSeats = level.covered_seats == null ? 0 : Math.max(0, seats - level.covered_seats);
  return round2(level.price + extraSeats * level.extra_seat_price);
}

export type Quote = {
  seats: number;
  seatsAdjusted: boolean;
  seatPrice: number;
  seatsMonthly: number;
  supportMonthly: number;
  supportExtraSeats: number;
  storageBlocks: number;
  storageMonthly: number;
  /** Storage the plan includes for the billed seats, in GB (extra blocks not counted). */
  includedStorageGb: number;
  monthlyTotal: number;
  onboardingFee: number;
  /** Months charged up front: 12 on annual billing, 1 on monthly. */
  monthsUpFront: number;
  recurringCharge: number;
  firstPayment: number;
  /** What the same setup would cost per month on the other billing interval. */
  annualSavingsPerYear: number;
};

export function quote(
  plan: Plan,
  seatsRequested: number,
  billing: BillingInterval,
  support: SupportLevel | undefined,
  storage?: { blocks: number; block_price: number },
): Quote {
  const seats = billableSeats(plan, seatsRequested);
  const price = seatPrice(plan, billing);
  const seatsMonthly = round2(seats * price);
  const sup = supportMonthly(support, seats);
  const storageBlocks = storage ? clampInt(storage.blocks, 0, Number.MAX_SAFE_INTEGER) : 0;
  const storageMonthly = storage ? round2(storageBlocks * storage.block_price) : 0;
  const monthlyTotal = round2(seatsMonthly + sup + storageMonthly);
  const monthsUpFront = billing === "annual" ? 12 : 1;
  const recurringCharge = round2(monthlyTotal * monthsUpFront);
  const supportExtraSeats = support && support.covered_seats != null ? Math.max(0, seats - support.covered_seats) : 0;
  const annualSavingsPerYear = round2(seats * (plan.seat_price_monthly - plan.seat_price_annual) * 12);
  return {
    seats,
    seatsAdjusted: Number.isFinite(Math.floor(Number(seatsRequested))) && seats !== Math.floor(Number(seatsRequested)),
    seatPrice: price,
    seatsMonthly,
    supportMonthly: sup,
    supportExtraSeats,
    storageBlocks,
    storageMonthly,
    includedStorageGb: seats * (plan.allowances?.storage_gb_per_seat ?? 0),
    monthlyTotal,
    onboardingFee: plan.onboarding_fee,
    monthsUpFront,
    recurringCharge,
    firstPayment: round2(recurringCharge + plan.onboarding_fee),
    annualSavingsPerYear,
  };
}

/** The sign-up quote: plan, seats, billing, support and extra storage, priced as KS-Ops prices them. */
export function signupQuote(
  c: Catalog,
  plan: Plan,
  f: { seats: number; billing_interval: BillingInterval; support_level: string; extra_storage_blocks: number },
): Quote {
  const support = c.support_levels.find((s) => s.key === f.support_level);
  return quote(plan, f.seats, f.billing_interval, support, { blocks: f.extra_storage_blocks, block_price: c.extra_storage.price });
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(n: number, currency = "CAD"): string {
  const whole = Number.isInteger(n);
  const s = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
  return s;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-CA").format(n);
}
