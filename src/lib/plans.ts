import { opsUrl } from "../config";

export type PlanKey = "starter" | "growth" | "pro";
export type BillingInterval = "annual" | "monthly";

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
  live_help: boolean;
};

export type Catalog = {
  plans: Plan[];
  support_levels: SupportLevel[];
  extra_storage: { block_gb: number; price: number };
  overage: { minute: number; text: number };
  trial: {
    days: number;
    plan: PlanKey;
    for: PlanKey;
    bonus_minutes_per_seat: number;
    bonus_texts_per_seat: number;
  };
  currency: string;
};

const STARTER_FEATURES: PlanFeature[] = [
  { key: "contacts", label: "Contacts" },
  { key: "pipeline", label: "Pipeline" },
  { key: "client_portal", label: "Branded client portal and application wizard" },
  { key: "iphone_dialler", label: "iPhone dialler" },
  { key: "office_sync", label: "Office 365 / Google sync" },
  { key: "ai_assistant", label: "AI assistant" },
  { key: "lender_portal", label: "Lender portal (lenders can send you deals they can't place)" },
];
const GROWTH_FEATURES: PlanFeature[] = [
  { key: "call_recording", label: "Call recording" },
  { key: "call_summaries", label: "AI call summaries" },
  { key: "voicemail_transcription", label: "Voicemail transcription" },
  { key: "watch_ipad_apps", label: "Apple Watch and iPad apps" },
  { key: "templates", label: "Message templates" },
  { key: "referrer_portal", label: "Referrer portal" },
  { key: "broker_portal", label: "Broker portal" },
  { key: "full_reports", label: "Reports" },
  { key: "visitor_tracking", label: "Website visitor tracking" },
  { key: "toll_free_number", label: "Toll-free number" },
];
const PRO_FEATURES: PlanFeature[] = [
  { key: "multiple_lines", label: "Multiple business lines" },
  { key: "bank_connect", label: "Bank connect" },
  { key: "ad_attribution", label: "Ad attribution" },
  { key: "api_access", label: "API access" },
  { key: "sso", label: "Single sign-on" },
];

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
      allowances: { minutes_per_seat: 50, texts_per_seat: 100, assistant_chats: 200, storage_gb_per_seat: 10 },
      features: [...STARTER_FEATURES],
    },
    {
      key: "growth",
      name: "Growth",
      seat_price_annual: 119,
      seat_price_monthly: 139,
      onboarding_fee: 750,
      min_seats: 1,
      allowances: { minutes_per_seat: 500, texts_per_seat: 500, assistant_chats: 1000, storage_gb_per_seat: 25 },
      features: [...STARTER_FEATURES, ...GROWTH_FEATURES],
    },
    {
      key: "pro",
      name: "Pro",
      seat_price_annual: 199,
      seat_price_monthly: 229,
      onboarding_fee: 2000,
      min_seats: 2,
      allowances: { minutes_per_seat: 1500, texts_per_seat: 1500, assistant_chats: null, storage_gb_per_seat: 50 },
      features: [...STARTER_FEATURES, ...GROWTH_FEATURES, ...PRO_FEATURES],
    },
  ],
  support_levels: [
    {
      key: "email",
      name: "Email",
      price: 0,
      covered_seats: null,
      extra_seat_price: 0,
      channels: ["Email"],
      first_reply: "2 business days",
      live_help: false,
    },
    {
      key: "priority",
      name: "Priority",
      price: 199,
      covered_seats: 10,
      extra_seat_price: 15,
      channels: ["Email", "In-app tickets"],
      first_reply: "1 business day",
      live_help: false,
    },
    {
      key: "premium",
      name: "Premium",
      price: 499,
      covered_seats: 10,
      extra_seat_price: 30,
      channels: ["Email", "In-app tickets", "Phone"],
      first_reply: "4 business hours",
      live_help: true,
    },
    {
      key: "dedicated",
      name: "Dedicated",
      price: 1200,
      covered_seats: 25,
      extra_seat_price: 40,
      channels: ["Email", "In-app tickets", "Phone", "Named account manager"],
      first_reply: "2 business hours",
      live_help: true,
    },
  ],
  extra_storage: { block_gb: 50, price: 10 },
  overage: { minute: 0.04, text: 0.03 },
  trial: { days: 14, plan: "pro", for: "starter", bonus_minutes_per_seat: 100, bonus_texts_per_seat: 100 },
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

function normalise(c: Catalog): Catalog {
  return {
    ...c,
    currency: c.currency || "CAD",
    plans: c.plans.map((p) => ({ ...p, min_seats: Math.max(1, Number(p.min_seats) || 1) })),
    support_levels: c.support_levels.map((s) => ({
      ...s,
      covered_seats: s.covered_seats ?? null,
      extra_seat_price: Number(s.extra_seat_price) || 0,
      channels: Array.isArray(s.channels) ? s.channels : [],
      first_reply: s.first_reply ?? "",
      live_help: Boolean(s.live_help),
    })),
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

export function findPlan(c: Catalog, key: string): Plan | undefined {
  return c.plans.find((p) => p.key === key);
}

export function findSupport(c: Catalog, key: string): SupportLevel | undefined {
  return c.support_levels.find((s) => s.key === key);
}
