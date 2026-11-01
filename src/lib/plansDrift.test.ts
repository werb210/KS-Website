// KS_WEBSITE_PLAN_FIXES - the bundled fallback catalogue must list exactly the features KS-server and KS-Ops do: same
// keys, labels, plan levels and order. The two source files are read from GitHub (the repositories are public), or from
// local checkouts when KS_SERVER_DIR / KS_OPS_DIR are set. KS_PLANS_DRIFT_REF picks the branch (default main).
// When GitHub cannot be reached the comparison is skipped with a warning; a real difference always fails.
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { FALLBACK_CATALOG, FALLBACK_FEATURES } from "./plans";
import { KEYSTONE_MATCH } from "../data/compare";

type Def = { key: string; label: string; plan: string };

/** `{ key: "x", label: "y", plan: "starter" }` lines, in order. */
export function parseFeatureDefs(source: string): Def[] {
  const out: Def[] = [];
  const re = /\{\s*key:\s*"([^"]+)",\s*label:\s*"((?:[^"\\]|\\.)*)",\s*plan:\s*"(starter|growth|pro)"\s*\}/g;
  for (const m of source.matchAll(re)) out.push({ key: m[1], label: m[2].replace(/\\"/g, '"'), plan: m[3] });
  return out;
}

/** KS-Ops `starter: { campaign_emails: 500, text_to_many: 50, sequences: 2, visitor_history_days: 30, lead_forms: 1 },` */
export function parseMarketingLimits(source: string): Record<string, Record<string, number | null>> {
  const block = /MARKETING_LIMITS[^=]*=\s*\{([\s\S]*?)\n\};/.exec(source)?.[1] ?? "";
  const out: Record<string, Record<string, number | null>> = {};
  for (const m of block.matchAll(/(starter|growth|pro): \{([^}]*)\}/g)) {
    out[m[1]] = Object.fromEntries(m[2].split(",").map((kv) => kv.split(":").map((x) => x.trim())).filter((kv) => kv[0])
      .map(([k, v]) => [k, v === "null" ? null : Number(v.replace(/_/g, ""))]));
  }
  return out;
}

const REF = process.env.KS_PLANS_DRIFT_REF || "main";
const SOURCES = [
  { name: "KS-server", dir: process.env.KS_SERVER_DIR, path: "src/plans/catalogue.ts", url: `https://raw.githubusercontent.com/werb210/KS-server/${REF}/src/plans/catalogue.ts` },
  { name: "KS-Ops", dir: process.env.KS_OPS_DIR, path: "src/pricing.ts", url: `https://raw.githubusercontent.com/werb210/KS-Ops/${REF}/src/pricing.ts` },
];

async function load(src: (typeof SOURCES)[number]): Promise<string | null> {
  if (src.dir) return readFile(`${src.dir}/${src.path}`, "utf8");
  try {
    const res = await fetch(src.url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.warn(`[plans drift] ${src.name}: ${src.url} answered ${res.status}; comparison skipped`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[plans drift] ${src.name} not reachable (${err instanceof Error ? err.message : String(err)}); comparison skipped`);
    return null;
  }
}

const mine = FALLBACK_FEATURES.map(({ key, label, plan }) => ({ key, label, plan }));

describe("fallback plan catalogue", () => {
  it("has PGI referrals and the 15 fraud checks at their plan levels", () => {
    const level = Object.fromEntries(mine.map((f) => [f.key, f.plan]));
    expect(level.pgi_referrals).toBe("starter");
    const fraud = mine.filter((f) => /^fraud_\d+$/.test(f.key));
    expect(fraud).toHaveLength(15);
    expect(fraud.some((f) => f.key === "fraud_3")).toBe(false);
    expect(fraud.filter((f) => f.plan === "starter").map((f) => f.key)).toEqual(["fraud_1", "fraud_2", "fraud_4", "fraud_5"]);
    expect(fraud.filter((f) => f.plan === "growth").map((f) => f.key)).toEqual(["fraud_6", "fraud_7", "fraud_8"]);
  });

  it("each plan includes the ones before it, in the same order", () => {
    const keys = (k: string) => FALLBACK_CATALOG.plans.find((p) => p.key === k)!.features.map((f) => f.key);
    expect(keys("pro")).toEqual(mine.map((f) => f.key));
    expect(keys("growth")).toEqual(mine.filter((f) => f.plan !== "pro").map((f) => f.key));
    expect(keys("starter")).toEqual(mine.filter((f) => f.plan === "starter").map((f) => f.key));
  });

  it("states the wording Todd set (Oct 26)", () => {
    const label = (k: string) => mine.find((f) => f.key === k)?.label ?? "";
    expect(label("call_recording")).toBe("Call recording on every plan (playback on Growth and Pro)");
    expect(label("office_sync")).toMatch(/Outlook \(Microsoft 365\) inbox sync; Gmail sends only/);
    expect(label("lender_portal")).not.toMatch(/review|files you send/i);
    expect(mine.find((f) => f.key === "ipad_app")?.plan).toBe("starter");
    expect(mine.find((f) => f.key === "watch_app")?.plan).toBe("growth");
    for (const k of ["templates", "automations", "call_recording_playback"]) expect(mine.find((f) => f.key === k)?.plan).toBe("growth");
    expect(mine.find((f) => f.key === "sso")?.plan).toBe("pro");
    expect(mine.find((f) => f.key === "api_access")?.plan).toBe("pro");
  });

  // KS_WEBSITE_MARKETING_ADDON - the Marketing add-on, each plan's marketing limits and the signing allowance must
  // match KS-Ops src/pricing.ts too (the numbers the pricing page and sign-up show).
  it("matches KS-Ops's marketing limits, Marketing add-on and signings", async (ctx) => {
    const ops = SOURCES[1];
    const text = await load(ops);
    if (text === null) return ctx.skip();
    const limits = parseMarketingLimits(text);
    expect(Object.keys(limits), "KS-Ops: no marketing limits parsed").toEqual(["starter", "growth", "pro"]);
    for (const p of FALLBACK_CATALOG.plans) expect(p.marketing, p.key).toEqual(limits[p.key]);
    const num = (re: RegExp) => Number((re.exec(text)?.[1] ?? "NaN").replace(/_/g, ""));
    const addon = FALLBACK_CATALOG.marketing_addon!;
    expect(addon.price * 100).toBe(num(/MARKETING_ADDON = \{[\s\S]*?price_cents: ([\d_]+)/));
    expect(KEYSTONE_MATCH.addonPrice, "the /compare page's add-on price").toBe(addon.price);
    expect(addon.extra_campaign_emails).toBe(num(/MARKETING_ADDON = \{[\s\S]*?extra_campaign_emails: ([\d_]+)/));
    expect(addon.bonus_marketing_texts).toBe(num(/MARKETING_ADDON = \{[\s\S]*?bonus_marketing_texts: ([\d_]+)/));
    expect(addon.text_to_many).toBe(num(/MARKETING_ADDON = \{[\s\S]*?text_to_many: ([\d_]+)/));
    expect(addon.marketing_seats).toBe(num(/MARKETING_ADDON = \{[\s\S]*?marketing_seats: ([\d_]+)/));
    expect(FALLBACK_CATALOG.signings!.included).toBe(num(/SIGNINGS = \{ included: (\d+)/));
    expect(FALLBACK_CATALOG.signings!.price * 100).toBe(num(/SIGNINGS = \{[^}]*overage_cents: (\d+)/));
    expect(FALLBACK_CATALOG.overage.signing! * 100).toBe(num(/OVERAGE_CENTS = \{[^}]*signing: (\d+)/));
    expect(FALLBACK_CATALOG.overage.campaign_email_block! * 100).toBe(num(/OVERAGE_CENTS = \{[^}]*campaign_email_block: (\d+)/));
  }, 20_000);

  for (const src of SOURCES) {
    it(`matches ${src.name} exactly (keys, labels, plan levels, order)`, async (ctx) => {
      const text = await load(src);
      if (text === null) return ctx.skip();
      const theirs = parseFeatureDefs(text);
      expect(theirs.length, `${src.name}: no features parsed`).toBeGreaterThan(20);
      expect(mine).toEqual(theirs);
    }, 20_000);
  }
});
