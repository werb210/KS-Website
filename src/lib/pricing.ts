import type { BillingInterval, Plan, SupportLevel } from "./plans";

/** Seats actually billed: whole number, at least 1 and at least the plan minimum (pro = 2). */
export function billableSeats(plan: Pick<Plan, "min_seats">, seats: number): number {
  const n = Math.floor(Number(seats));
  const whole = Number.isFinite(n) ? n : 1;
  return Math.max(1, plan.min_seats || 1, whole);
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
): Quote {
  const seats = billableSeats(plan, seatsRequested);
  const price = seatPrice(plan, billing);
  const seatsMonthly = round2(seats * price);
  const sup = supportMonthly(support, seats);
  const monthlyTotal = round2(seatsMonthly + sup);
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
    monthlyTotal,
    onboardingFee: plan.onboarding_fee,
    monthsUpFront,
    recurringCharge,
    firstPayment: round2(recurringCharge + plan.onboarding_fee),
    annualSavingsPerYear,
  };
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
