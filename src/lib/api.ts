import { opsUrl } from "../config";
import type { BillingInterval, PaymentMethod, PlanKey } from "./plans";

/**
 * Only Stripe's own Checkout pages are followed. Anything else coming back as a payment link (a misconfigured or
 * compromised service) is treated as "no link", so the page falls back to "we'll contact you" instead of sending the
 * person somewhere unexpected.
 */
export function isStripeCheckoutUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.startsWith("https://checkout.stripe.com/")) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "checkout.stripe.com" && !u.username && !u.password;
  } catch {
    return false;
  }
}

const checkoutUrlOf = (v: unknown): string | null => (isStripeCheckoutUrl(v) ? v : null);

export type CodeAvailability = { available: boolean; reason?: string };

export async function checkCompanyCode(code: string, signal?: AbortSignal): Promise<CodeAvailability> {
  const res = await fetch(opsUrl(`/api/public/company-code-available?code=${encodeURIComponent(code)}`), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`code check ${res.status}`);
  const body = (await res.json()) as Partial<CodeAvailability>;
  return { available: body.available === true, reason: typeof body.reason === "string" ? body.reason : undefined };
}

export type SignupPayload = {
  company_name: string;
  legal_name: string;
  company_code: string;
  country: "CA" | "US";
  province_state: string;
  /** The address in parts (KS-Ops v13). mailing_address is the same address on one line, for older KS-Ops. */
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  mailing_address: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  seats: number;
  plan: PlanKey;
  billing_interval: BillingInterval;
  support_level: string;
  /** Extra 50 GB storage blocks, 0 to the catalog's max_blocks. */
  extra_storage_blocks: number;
  /** "acss_debit" (Canadian pre-authorized debit, the default) or "card". */
  payment_method: PaymentMethod;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  font_family?: string;
  logo_url?: string;
  /** An uploaded logo (PNG, JPG or SVG, base64), stored by KS-Ops. */
  logo_file?: { content_type: string; data_base64: string; filename?: string };
  assistant_name?: string;
  accept_terms: true;
  accept_privacy: true;
  turnstile_token?: string;
  /** Honeypot. People never see it; it must stay empty. */
  website_url: string;
};

export type SignupCreated = {
  licensee_id: string;
  signup_token: string;
  checkout_url: string | null;
  message?: string;
};

export type SignupResult =
  | { ok: true; data: SignupCreated }
  | { ok: false; status: number; errors: Record<string, string>; message: string };

export async function submitSignup(payload: SignupPayload): Promise<SignupResult> {
  let res: Response;
  try {
    res = await fetch(opsUrl("/api/public/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      errors: {},
      message: "We couldn't reach the sign-up service. Check your connection and try again.",
    };
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  if (res.ok) {
    return {
      ok: true,
      data: {
        licensee_id: String(body.licensee_id ?? ""),
        signup_token: String(body.signup_token ?? ""),
        checkout_url: checkoutUrlOf(body.checkout_url),
        message: typeof body.message === "string" ? body.message : undefined,
      },
    };
  }
  const errors: Record<string, string> = {};
  if (body.errors && typeof body.errors === "object") {
    for (const [k, v] of Object.entries(body.errors as Record<string, unknown>)) {
      errors[k] = typeof v === "string" ? v : "Check this field.";
    }
  }
  let message = typeof body.message === "string" ? body.message : "";
  if (!message) {
    if (res.status === 429) message = "Too many attempts. Wait a minute and try again.";
    else if (Object.keys(errors).length) message = "Some details need fixing. They're marked below.";
    else message = "Sign-up didn't go through. Try again, or contact us and we'll set you up.";
  }
  return { ok: false, status: res.status, errors, message };
}

export type SignupStatus = { status: string; company_name: string };

export async function getSignupStatus(id: string, token: string, signal?: AbortSignal): Promise<SignupStatus> {
  const res = await fetch(
    opsUrl(`/api/public/signup/${encodeURIComponent(id)}/status?token=${encodeURIComponent(token)}`),
    { signal, headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`status ${res.status}`);
  const body = (await res.json()) as Partial<SignupStatus>;
  return { status: String(body.status ?? ""), company_name: String(body.company_name ?? "") };
}

/**
 * Ask KS-Ops for a fresh payment link for a sign-up that hasn't paid yet
 * (POST /api/public/signup/:id/checkout?token=). Returns null when the service can't give one, or gives
 * something that isn't a Stripe Checkout page (the page then offers email instead).
 */
export async function resumeCheckout(id: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      opsUrl(`/api/public/signup/${encodeURIComponent(id)}/checkout?token=${encodeURIComponent(token)}`),
      { method: "POST", headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { checkout_url?: unknown };
    return checkoutUrlOf(body.checkout_url);
  } catch {
    return null;
  }
}

export type DemoSignupPayload = {
  name: string;
  email: string;
  company: string;
  /** Mobile number, so the team can reach them. The demo link itself is emailed. */
  phone: string;
  turnstile_token?: string;
  /** Honeypot. People never see it; it must stay empty. */
  website_url: string;
};

export type DemoSignupResult = { ok: true; message: string; resent: boolean; openUrl: string | null } | { ok: false; status: number; errors: Record<string, string>; message: string };

/** POST /api/public/demo/signup - KS-Ops emails a private link to the person's demo. */
export async function requestDemo(payload: DemoSignupPayload): Promise<DemoSignupResult> {
  let res: Response;
  try {
    res = await fetch(opsUrl("/api/public/demo/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 0, errors: {}, message: "We couldn't reach the demo service. Check your connection and try again." };
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const message = typeof body.message === "string" ? body.message : "";
  if (res.ok) {
    // KS_WEBSITE_v11_LIVE_DEMO - KS-Ops answers the demo's link; the page opens it straight away (https only).
    const openUrl = typeof body.open_url === "string" && /^https:\/\//.test(body.open_url) ? body.open_url : null;
    return { ok: true, resent: body.resent === true, openUrl, message: message || "Check your email - we've sent you a private link to your demo." };
  }
  const errors: Record<string, string> = {};
  if (body.errors && typeof body.errors === "object") {
    for (const [k, v] of Object.entries(body.errors as Record<string, unknown>)) errors[k] = typeof v === "string" ? v : "Check this field.";
  }
  let fallback = "The demo didn't start. Try again in a minute, or contact us for a live walkthrough.";
  if (res.status === 429) fallback = "Too many attempts. Wait a little and try again.";
  else if (Object.keys(errors).length) fallback = "Some details need fixing. They're marked below.";
  return { ok: false, status: res.status, errors, message: message || fallback };
}

export type DemoContact = { name: string; email: string; company: string; phone: string };

/**
 * POST /api/public/demo/prefill - the details someone gave for their demo, from the demo id and key that demo emails
 * and the demo's last step put in the link's #fragment. Null when it can't be had (the forms then stay empty).
 */
export async function fetchDemoContact(demoId: string, key: string): Promise<DemoContact | null> {
  try {
    const res = await fetch(opsUrl("/api/public/demo/prefill"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ demo_id: demoId, key }),
    });
    if (!res.ok) return null;
    const b = (await res.json()) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : "");
    return { name: str(b.name), email: str(b.email), company: str(b.company), phone: str(b.phone) };
  } catch {
    return null;
  }
}

// KS_WEBSITE_BETA_v1 - the beta programme sign-up (KS-Ops POST /api/public/beta-signup).
export type BetaSignupPayload = {
  name: string;
  email: string;
  brokerage: string;
  /** Keys from BETA_INTERESTS (src/pages/BetaProgramme.tsx). */
  interests: string[];
  message?: string;
  turnstile_token?: string;
  /** Honeypot. People never see it; it must stay empty. */
  website_url: string;
};

export type BetaSignupResult = { ok: true; message: string } | { ok: false; status: number; errors: Record<string, string>; message: string };

export async function joinBetaProgramme(payload: BetaSignupPayload): Promise<BetaSignupResult> {
  let res: Response;
  try {
    res = await fetch(opsUrl("/api/public/beta-signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 0, errors: {}, message: "We couldn't reach the sign-up service. Check your connection and try again." };
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const message = typeof body.message === "string" ? body.message : "";
  if (res.ok) return { ok: true, message: message || "Thanks - you're on the list. We'll email you when a beta that matches your interests opens." };
  const errors: Record<string, string> = {};
  if (body.errors && typeof body.errors === "object") {
    for (const [k, v] of Object.entries(body.errors as Record<string, unknown>)) errors[k] = typeof v === "string" ? v : "Check this field.";
  }
  let fallback = "That didn't go through. Try again in a minute, or contact us.";
  if (res.status === 429) fallback = "Too many attempts. Wait a little and try again.";
  else if (Object.keys(errors).length) fallback = "Some details need fixing. They're marked below.";
  return { ok: false, status: res.status, errors, message: message || fallback };
}

// KS-Ops v14 "Use my website": POST /api/public/brand-scan.
export type BrandScanLogo = { source_url: string | null; content_type: string; data_base64: string; filename: string };
export type BrandScanResult = {
  url: string;
  site_name: string | null;
  logo: BrandScanLogo | null;
  favicon_url: string | null;
  colors: { theme_color: string | null; palette: string[]; body_background: string | null };
  fonts: { body: string | null; headings: string | null; google: string[]; font_faces: string[] };
  suggestions: {
    primary_color: string | null;
    accent_color: string | null;
    background_color: string | null;
    font: { family: string; source: "google" | "self_hosted" | "system" } | null;
  };
};

export class BrandScanFailed extends Error {}

export async function scanWebsiteBrand(url: string, signal?: AbortSignal): Promise<BrandScanResult> {
  let res: Response;
  try {
    res = await fetch(opsUrl("/api/public/brand-scan"), {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    throw new BrandScanFailed("We couldn't reach our service. Check your connection and try again.");
  }
  const body = (await res.json().catch(() => ({}))) as Partial<BrandScanResult> & { ok?: boolean; message?: string };
  if (res.status === 429) throw new BrandScanFailed("Too many tries. Please wait a few minutes, or fill in your branding yourself.");
  if (!res.ok || body.ok !== true || !body.suggestions) {
    throw new BrandScanFailed(typeof body.message === "string" && body.message ? body.message : "We couldn't read that website. You can fill in your branding yourself.");
  }
  return body as BrandScanResult;
}
