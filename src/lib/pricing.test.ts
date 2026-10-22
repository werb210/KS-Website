import { describe, expect, it } from "vitest";
import { FALLBACK_CATALOG, findPlan, findSupport } from "./plans";
import { billableSeats, formatMoney, quote, supportMonthly } from "./pricing";

const c = FALLBACK_CATALOG;
const starter = findPlan(c, "starter")!;
const growth = findPlan(c, "growth")!;
const pro = findPlan(c, "pro")!;
const email = findSupport(c, "email");
const priority = findSupport(c, "priority")!;
const premium = findSupport(c, "premium")!;
const dedicated = findSupport(c, "dedicated")!;

describe("billableSeats", () => {
  it("enforces the pro 2-seat minimum", () => {
    expect(billableSeats(pro, 1)).toBe(2);
    expect(billableSeats(pro, 0)).toBe(2);
    expect(billableSeats(pro, 3)).toBe(3);
  });
  it("is at least 1 and whole", () => {
    expect(billableSeats(starter, 0)).toBe(1);
    expect(billableSeats(starter, 4.7)).toBe(4);
    expect(billableSeats(starter, NaN)).toBe(1);
  });
});

describe("quote", () => {
  it("prices starter annual with no onboarding fee", () => {
    const q = quote(starter, 3, "annual", email);
    expect(q.seatPrice).toBe(49);
    expect(q.seatsMonthly).toBe(147);
    expect(q.supportMonthly).toBe(0);
    expect(q.monthlyTotal).toBe(147);
    expect(q.onboardingFee).toBe(0);
    expect(q.monthsUpFront).toBe(12);
    expect(q.firstPayment).toBe(147 * 12);
  });

  it("prices growth monthly with onboarding in the first payment", () => {
    const q = quote(growth, 4, "monthly", email);
    expect(q.seatPrice).toBe(139);
    expect(q.monthlyTotal).toBe(556);
    expect(q.monthsUpFront).toBe(1);
    expect(q.firstPayment).toBe(556 + 750);
  });

  it("annual is cheaper than monthly and reports the yearly saving", () => {
    const a = quote(growth, 5, "annual", email);
    const m = quote(growth, 5, "monthly", email);
    expect(a.monthlyTotal).toBe(595);
    expect(m.monthlyTotal).toBe(695);
    expect(a.annualSavingsPerYear).toBe(5 * 20 * 12);
  });

  it("bills pro at 2 seats when 1 is asked for, and flags the adjustment", () => {
    const q = quote(pro, 1, "monthly", email);
    expect(q.seats).toBe(2);
    expect(q.seatsAdjusted).toBe(true);
    expect(q.seatsMonthly).toBe(458);
    expect(q.firstPayment).toBe(458 + 2000);
  });

  it("does not flag seats as adjusted at or above the minimum", () => {
    expect(quote(pro, 2, "annual", email).seatsAdjusted).toBe(false);
  });

  it("adds support with charges for seats beyond those covered", () => {
    const q = quote(growth, 12, "annual", priority);
    expect(q.supportExtraSeats).toBe(2);
    expect(q.supportMonthly).toBe(199 + 2 * 15);
    expect(q.monthlyTotal).toBe(12 * 119 + 229);
    expect(q.firstPayment).toBe((12 * 119 + 229) * 12 + 750);
  });
});

describe("supportMonthly", () => {
  it("email support is free for any number of seats", () => {
    expect(supportMonthly(email, 200)).toBe(0);
  });
  it("charges nothing extra up to the covered seats", () => {
    expect(supportMonthly(priority, 10)).toBe(199);
    expect(supportMonthly(premium, 9)).toBe(499);
    expect(supportMonthly(dedicated, 25)).toBe(1200);
  });
  it("charges per extra seat beyond the covered seats", () => {
    expect(supportMonthly(premium, 11)).toBe(529);
    expect(supportMonthly(dedicated, 30)).toBe(1200 + 5 * 40);
  });
  it("is 0 with no support level", () => {
    expect(supportMonthly(undefined, 5)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("drops cents on whole amounts and keeps them otherwise", () => {
    expect(formatMoney(49)).toBe("$49");
    expect(formatMoney(0.04)).toBe("$0.04");
    expect(formatMoney(2000)).toBe("$2,000");
  });
});
