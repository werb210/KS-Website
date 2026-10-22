import { opsUrl } from "../config";
import type { BillingInterval, PlanKey } from "./plans";

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
  mailing_address: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  seats: number;
  plan: PlanKey;
  billing_interval: BillingInterval;
  support_level: string;
  primary_color?: string;
  logo_url?: string;
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
        checkout_url: typeof body.checkout_url === "string" && body.checkout_url ? body.checkout_url : null,
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
 * Ask KS-Ops for a fresh payment link for a sign-up whose checkout was cancelled.
 * Returns null when the service can't give one (the page then offers email instead).
 */
export async function resumeCheckout(id: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(
      opsUrl(`/api/public/signup/${encodeURIComponent(id)}/checkout?token=${encodeURIComponent(token)}`),
      { method: "POST", headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { checkout_url?: unknown };
    return typeof body.checkout_url === "string" && body.checkout_url ? body.checkout_url : null;
  } catch {
    return null;
  }
}
