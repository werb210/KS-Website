import { opsUrl } from "../config";

export type PlanKey = "starter" | "growth" | "pro";
export type BillingInterval = "annual" | "monthly";

/** How the licensee pays (KS-Ops payment_method). Bank debit is the default. */
export type PaymentMethod = "acss_debit" | "card";
export const PAYMENT_METHODS: ReadonlyArray<{ key: PaymentMethod; name: string; detail: string }> = [
  {
    key: "acss_debit",
    name: "Bank debit",
    detail: "Pre-authorized debit from a Canadian business bank account. You agree to the debit agreement on the payment page.",
  },
  { key: "card", name: "Credit card", detail: "Visa, Mastercard or American Express, charged automatically." },
];
export const isPaymentMethod = (v: unknown): v is PaymentMethod => v === "acss_debit" || v === "card";

export type PlanAllowances = {
  minutes_per_seat: number;
  texts_per_seat: number;
  /** null = unlimited */
  assistant_chats: number | null;
  storage_gb_per_seat: number;
};

export type PlanFeature = { key: string; label: string };

export type Plan = {
  key: PlanKey;
  name: string;
  seat_price_annual: number;
  seat_price_monthly: number;
  onboarding_fee: number;
  min_seats: number;
  /** Most seats the sign-up accepts (KS-Ops MAX_SEATS). */
  max_seats: number;
  allowances: PlanAllowances;
  /** Cumulative: every feature the plan includes. */
  features: PlanFeature[];
};

export type SupportLevel = {
  key: string;
  name: string;
  price: number;
  /** Seats the monthly price covers. null = every seat. */
  covered_seats: number | null;
  extra_seat_price: number;
  channels: string[];
  first_reply: string;
  /** What live help comes with the level, e.g. "2 hours of voice or screen-share sessions a month", or "None". */
  live_help: string;
};

export type Catalog = {
  plans: Plan[];
  support_levels: SupportLevel[];
  /** Extra storage sold in blocks, per month. max_blocks = most the sign-up accepts. */
  extra_storage: { block_gb: number; price: number; max_blocks: number };
  overage: { minute: number; text: number };
  trial: {
    days: number;
    plan: PlanKey;
    /** The plans offered the in-app trial: Starter and Growth (older catalogues send one key). */
    for: PlanKey | PlanKey[];
    bonus_minutes_per_seat: number;
    bonus_texts_per_seat: number;
  };
  currency: string;
};

// KS_WEBSITE_PLAN_FIXES - the same keys, labels, plan levels and order as KS-server src/plans/catalogue.ts and KS-Ops
// src/pricing.ts (pgi_referrals and the 15 fraud checks included); each plan includes the ones before it.
// src/lib/plansDrift.test.ts compares them.
export const FALLBACK_FEATURES: ReadonlyArray<PlanFeature & { plan: PlanKey }> = [
  { key: "contacts", label: "Contacts", plan: "starter" },
  { key: "pipeline", label: "Pipeline", plan: "starter" },
  { key: "client_portal", label: "Branded client portal and application wizard", plan: "starter" },
  { key: "iphone_dialler", label: "iPhone dialler", plan: "starter" },
  { key: "ipad_app", label: "iPad staff portal app", plan: "starter" },
  { key: "office_sync", label: "Email sync: Outlook (Microsoft 365) inbox sync; Gmail sends only for now", plan: "starter" },
  { key: "ai_assistant", label: "AI assistant", plan: "starter" },
  { key: "lender_portal", label: "Lender portal (lenders keep their details and products current and send you deals they can't place)", plan: "starter" },
  { key: "pgi_referrals", label: "Personal Guarantee Insurance referrals (20% referral fee)", plan: "starter" },
  { key: "custom_fields", label: "Custom fields", plan: "starter" },
  { key: "call_recording", label: "Call recording on every plan (playback on Growth and Pro)", plan: "starter" },
  { key: "call_recording_playback", label: "Call recording playback", plan: "growth" },
  { key: "teams", label: "Teams and record visibility", plan: "growth" },
  { key: "call_summaries", label: "AI call summaries", plan: "growth" },
  { key: "voicemail_transcription", label: "Voicemail transcription", plan: "growth" },
  { key: "watch_app", label: "Apple Watch app", plan: "growth" },
  { key: "templates", label: "Message templates and snippets", plan: "growth" },
  { key: "automations", label: "Automations (workflows)", plan: "growth" },
  { key: "referrer_portal", label: "Referrer portal", plan: "growth" },
  { key: "broker_portal", label: "Broker portal", plan: "growth" },
  { key: "full_reports", label: "Reports", plan: "growth" },
  { key: "visitor_tracking", label: "Website visitor tracking", plan: "growth" },
  { key: "toll_free_number", label: "Toll-free number", plan: "growth" },
  { key: "nps_survey", label: "Post-funding survey and review requests", plan: "growth" },
  { key: "multiple_lines", label: "Multiple business lines and a direct line for each person", plan: "pro" },
  { key: "ad_attribution", label: "Ad attribution", plan: "pro" },
  { key: "api_access", label: "API access", plan: "pro" },
  { key: "sso", label: "Single sign-on", plan: "pro" },
  { key: "webhooks", label: "Webhooks and Zapier", plan: "pro" },
  { key: "fraud_1", label: "Document tamper scan", plan: "starter" },
  { key: "fraud_2", label: "Bank statement math check", plan: "starter" },
  { key: "fraud_4", label: "Duplicate document check", plan: "starter" },
  { key: "fraud_5", label: "Revenue vs bank deposits", plan: "starter" },
  { key: "fraud_6", label: "Business reality check", plan: "growth" },
  { key: "fraud_7", label: "Phone and email risk", plan: "growth" },
  { key: "fraud_8", label: "ID checks", plan: "growth" },
  { key: "fraud_9", label: "Device and location check", plan: "pro" },
  { key: "fraud_10", label: "Application behaviour signals", plan: "pro" },
  { key: "fraud_11", label: "Loan stacking detector", plan: "pro" },
  { key: "fraud_12", label: "Fraud network map", plan: "pro" },
  { key: "fraud_13", label: "Shared fraud watchlist", plan: "pro" },
  { key: "fraud_14", label: "Inside-job alerts", plan: "pro" },
  { key: "fraud_15", label: "Call voice check", plan: "pro" },
  { key: "fraud_16", label: "Fraud score and lender pre-screen", plan: "pro" },
];
const PLAN_RANK: Record<PlanKey, number> = { starter: 0, growth: 1, pro: 2 };
const featuresUpTo = (plan: PlanKey): PlanFeature[] =>
  FALLBACK_FEATURES.filter((f) => PLAN_RANK[f.plan] <= PLAN_RANK[plan]).map(({ key, label }) => ({ key, label }));

/** KS-Ops' limits (MAX_SEATS, MAX_STORAGE_BLOCKS), used when an older catalog does not send them. */
export const MAX_SEATS = 1000;
export const MAX_STORAGE_BLOCKS = 1000;

/**
 * Bundled copy of GET /api/public/plans. Used when the live call fails so the pricing page and sign-up
 * always work. Keep in step with KS-Ops (and KS-server src/plans/catalogue.ts).
 */
export const FALLBACK_CATALOG: Catalog = {
  plans: [
    {
      key: "starter",
      name: "Starter",
      seat_price_annual: 49,
      seat_price_monthly: 59,
      onboarding_fee: 0,
      min_seats: 1,
      max_seats: MAX_SEATS,
      allowances: { minutes_per_seat: 50, texts_per_seat: 100, assistant_chats: 200, storage_gb_per_seat: 10 },
      features: featuresUpTo("starter"),
    },
    {
      key: "growth",
      name: "Growth",
      seat_price_annual: 119,
      seat_price_monthly: 139,
      onboarding_fee: 750,
      min_seats: 1,
      max_seats: MAX_SEATS,
      allowances: { minutes_per_seat: 500, texts_per_seat: 500, assistant_chats: 1000, storage_gb_per_seat: 25 },
      features: featuresUpTo("growth"),
    },
    {
      key: "pro",
      name: "Pro",
      seat_price_annual: 199,
      seat_price_monthly: 229,
      onboarding_fee: 2000,
      min_seats: 2,
      max_seats: MAX_SEATS,
      allowances: { minutes_per_seat: 1500, texts_per_seat: 1500, assistant_chats: null, storage_gb_per_seat: 50 },
      features: featuresUpTo("pro"),
    },
  ],
  support_levels: [
    {
      key: "email",
      name: "Email",
      price: 0,
      covered_seats: null,
      extra_seat_price: 0,
      channels: ["Email", "Help articles"],
      first_reply: "1 business day",
      live_help: "None",
    },
    {
      key: "priority",
      name: "Priority",
      price: 199,
      covered_seats: 10,
      extra_seat_price: 15,
      channels: ["Email", "Live chat"],
      first_reply: "4 business hours",
      live_help: "2 hours of voice or screen-share sessions a month",
    },
    {
      key: "premium",
      name: "Premium",
      price: 499,
      covered_seats: 10,
      extra_seat_price: 30,
      channels: ["Email", "Chat", "Phone", "Screen sharing"],
      first_reply: "1 business hour",
      live_help: "6 hours of sessions a month and a quarterly training call",
    },
    {
      key: "dedicated",
      name: "Dedicated",
      price: 1200,
      covered_seats: 25,
      extra_seat_price: 40,
      channels: ["All channels, 7 am to 9 pm Mountain", "Named contact"],
      first_reply: "30 minutes",
      live_help: "15 hours of sessions a month and new-staff training",
    },
  ],
  extra_storage: { block_gb: 50, price: 10, max_blocks: MAX_STORAGE_BLOCKS },
  overage: { minute: 0.04, text: 0.03 },
  trial: { days: 14, plan: "pro", for: ["starter", "growth"], bonus_minutes_per_seat: 100, bonus_texts_per_seat: 100 },
  currency: "CAD",
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Light shape check so a malformed response falls back instead of breaking the page. */
export function isCatalog(v: unknown): v is Catalog {
  if (!isObj(v) || !Array.isArray(v.plans) || v.plans.length === 0 || !Array.isArray(v.support_levels)) return false;
  const plansOk = v.plans.every(
    (p) =>
      isObj(p) &&
      typeof p.key === "string" &&
      typeof p.name === "string" &&
      typeof p.seat_price_annual === "number" &&
      typeof p.seat_price_monthly === "number" &&
      typeof p.onboarding_fee === "number" &&
      isObj(p.allowances) &&
      Array.isArray(p.features),
  );
  const supportOk = v.support_levels.every(
    (s) => isObj(s) && typeof s.key === "string" && typeof s.price === "number",
  );
  return plansOk && supportOk && isObj(v.extra_storage) && isObj(v.overage) && isObj(v.trial);
}

/** Older catalogs sent live_help as true/false; now it is a description. */
function liveHelpText(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return v === true ? "Yes" : "None";
}

/** True when a support level includes some live help. */
export function hasLiveHelp(s: Pick<SupportLevel, "live_help">): boolean {
  return Boolean(s.live_help) && !/^(none|no)$/i.test(s.live_help.trim());
}

function normalise(c: Catalog): Catalog {
  return {
    ...c,
    currency: c.currency || "CAD",
    plans: c.plans.map((p) => {
      const min = Math.max(1, Number(p.min_seats) || 1);
      return { ...p, min_seats: min, max_seats: Math.max(min, Math.floor(Number(p.max_seats)) || MAX_SEATS) };
    }),
    support_levels: c.support_levels.map((s) => ({
      ...s,
      covered_seats: s.covered_seats ?? null,
      extra_seat_price: Number(s.extra_seat_price) || 0,
      channels: Array.isArray(s.channels) ? s.channels : [],
      first_reply: s.first_reply ?? "",
      live_help: liveHelpText(s.live_help),
    })),
    extra_storage: {
      block_gb: Number(c.extra_storage.block_gb) || 50,
      price: Number(c.extra_storage.price) || 0,
      max_blocks: Math.max(0, Math.floor(Number(c.extra_storage.max_blocks))) || MAX_STORAGE_BLOCKS,
    },
  };
}

export type CatalogResult = { catalog: Catalog; source: "live" | "fallback" };

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogResult> {
  try {
    const res = await fetch(opsUrl("/api/public/plans"), { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`plans ${res.status}`);
    const body: unknown = await res.json();
    if (!isCatalog(body)) throw new Error("plans: unexpected shape");
    return { catalog: normalise(body), source: "live" };
  } catch (err) {
    if (signal?.aborted) throw err;
    return { catalog: FALLBACK_CATALOG, source: "fallback" };
  }
}

/** The plans the in-app trial is offered on (Starter and Growth). */
export function trialPlans(c: Catalog): string[] {
  const f = c.trial.for as unknown;
  return Array.isArray(f) ? f.map(String) : [String(f)];
}

/** "Starter or Growth" */
export function trialPlanNames(c: Catalog): string {
  const names = trialPlans(c).map((k) => findPlan(c, k)?.name ?? k);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0] ?? "Starter";
}

export function findPlan(c: Catalog, key: string): Plan | undefined {
  return c.plans.find((p) => p.key === key);
}

export function findSupport(c: Catalog, key: string): SupportLevel | undefined {
  return c.support_levels.find((s) => s.key === key);
}
