import { describe, expect, it } from "vitest";
import { afterEach, vi } from "vitest";
import { FALLBACK_CATALOG, fetchCatalog, findPlan, findSupport, hasLiveHelp } from "./plans";
import { billableSeats, clampInt, formatMoney, quote, seatRange, signupQuote, supportMonthly } from "./pricing";

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

describe("extra storage and the sign-up quote", () => {
  it("adds storage blocks to the monthly total and the first payment", () => {
    const q = quote(growth, 3, "annual", email, { blocks: 2, block_price: 10 });
    expect(q.storageBlocks).toBe(2);
    expect(q.storageMonthly).toBe(20);
    expect(q.monthlyTotal).toBe(3 * 119 + 20);
    expect(q.firstPayment).toBe((3 * 119 + 20) * 12 + 750);
    expect(q.includedStorageGb).toBe(75);
  });

  it("prices the whole sign-up form the way KS-Ops does", () => {
    const q = signupQuote(c, growth, { seats: 12, billing_interval: "monthly", support_level: "priority", extra_storage_blocks: 1 });
    // 12 x $139 + Priority $199 + 2 extra support seats x $15 + one 50 GB block $10
    expect(q.monthlyTotal).toBe(12 * 139 + 199 + 30 + 10);
    expect(q.firstPayment).toBe(q.monthlyTotal + 750);
  });

  it("changing support changes the price", () => {
    const base = { seats: 3, billing_interval: "annual" as const, extra_storage_blocks: 0 };
    const totals = c.support_levels.map((s) => signupQuote(c, growth, { ...base, support_level: s.key }).monthlyTotal);
    expect(totals).toEqual([357, 357 + 199, 357 + 499, 357 + 1200]);
  });
});

describe("seat limits", () => {
  it("runs from the plan minimum to the catalog maximum", () => {
    expect(seatRange(starter)).toEqual({ min: 1, max: 1000 });
    expect(seatRange(pro)).toEqual({ min: 2, max: 1000 });
  });
  it("clamps typed numbers into range", () => {
    expect(clampInt(0, 2, 1000)).toBe(2);
    expect(clampInt(5000, 1, 1000)).toBe(1000);
    expect(clampInt(7.9, 1, 1000)).toBe(7);
    expect(clampInt(NaN, 1, 1000)).toBe(1);
  });
});

describe("catalog limits from KS-Ops", () => {
  afterEach(() => vi.unstubAllGlobals());
  const live = (over: Record<string, unknown>) => ({ ...JSON.parse(JSON.stringify(FALLBACK_CATALOG)), ...over });
  const serve = (body: unknown) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

  it("reads max_seats and max_blocks when sent", async () => {
    const body = live({ extra_storage: { block_gb: 50, price: 10, max_blocks: 40 } });
    body.plans[0].max_seats = 25;
    serve(body);
    const { catalog, source } = await fetchCatalog();
    expect(source).toBe("live");
    expect(catalog.plans[0].max_seats).toBe(25);
    expect(catalog.extra_storage.max_blocks).toBe(40);
  });

  it("falls back to 1,000 when an older catalog leaves them out, and reads old true/false live help", async () => {
    const body = live({ extra_storage: { block_gb: 50, price: 10 } });
    for (const p of body.plans) delete p.max_seats;
    body.support_levels[0].live_help = false;
    body.support_levels[2].live_help = true;
    serve(body);
    const { catalog } = await fetchCatalog();
    expect(catalog.plans.map((p) => p.max_seats)).toEqual([1000, 1000, 1000]);
    expect(catalog.extra_storage.max_blocks).toBe(1000);
    expect(hasLiveHelp(catalog.support_levels[0])).toBe(false);
    expect(hasLiveHelp(catalog.support_levels[2])).toBe(true);
    expect(hasLiveHelp(FALLBACK_CATALOG.support_levels[1])).toBe(true);
  });
});
