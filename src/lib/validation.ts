import type { BillingInterval, Catalog, PlanKey } from "./plans";
import { findPlan } from "./plans";
import { regionsFor } from "./regions";

export type SignupForm = {
  company_name: string;
  legal_name: string;
  country: "CA" | "US";
  province_state: string;
  mailing_address: string;
  website: string;
  company_code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  plan: PlanKey;
  seats: number;
  billing_interval: BillingInterval;
  support_level: string;
  logo_url: string;
  primary_color: string;
  assistant_name: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  website_url: string;
};

export const EMPTY_FORM: SignupForm = {
  company_name: "",
  legal_name: "",
  country: "CA",
  province_state: "",
  mailing_address: "",
  website: "",
  company_code: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  plan: "growth",
  seats: 3,
  billing_interval: "annual",
  support_level: "email",
  logo_url: "",
  primary_color: "#1f4e79",
  assistant_name: "",
  accept_terms: false,
  accept_privacy: false,
  website_url: "",
};

export type Errors = Partial<Record<keyof SignupForm | string, string>>;

export const STEPS = ["company", "code", "contact", "plan", "branding", "review"] as const;
export type StepKey = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepKey, string> = {
  company: "Company",
  code: "Company code",
  contact: "Contact",
  plan: "Plan",
  branding: "Branding",
  review: "Review",
};

/** Which step owns each field, so an API error can send the person back to the right place. */
export const FIELD_STEP: Record<string, StepKey> = {
  company_name: "company",
  legal_name: "company",
  country: "company",
  province_state: "company",
  mailing_address: "company",
  website: "company",
  company_code: "code",
  contact_name: "contact",
  contact_email: "contact",
  contact_phone: "contact",
  plan: "plan",
  seats: "plan",
  billing_interval: "plan",
  support_level: "plan",
  logo_url: "branding",
  primary_color: "branding",
  assistant_name: "branding",
  accept_terms: "review",
  accept_privacy: "review",
  turnstile_token: "review",
};

export const CODE_PATTERN = /^[a-z0-9-]{3,32}$/;

export function codeFormatError(code: string): string | null {
  if (!code) return "Choose a company code.";
  if (code.length < 3) return "Use at least 3 characters.";
  if (code.length > 32) return "Use 32 characters or fewer.";
  if (!CODE_PATTERN.test(code)) return "Use lowercase letters, numbers and hyphens only.";
  return null;
}

/** Turn a company name into a code suggestion: "Prairie Capital Inc." -> "prairie-capital". */
export function suggestCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(inc|ltd|llc|corp|corporation|limited|co)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/g, "");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEX = /^#[0-9a-f]{6}$/i;

export function isHttpUrl(v: string, requireHttps = false): boolean {
  try {
    const u = new URL(v);
    return requireHttps ? u.protocol === "https:" : u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Accepts "example.com" as well as full URLs. */
export function normaliseWebsite(v: string): string {
  const t = v.trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export function phoneDigits(v: string): string {
  return v.replace(/\D/g, "");
}

export type CodeState = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

export function validateStep(step: StepKey, f: SignupForm, catalog: Catalog, codeState: CodeState): Errors {
  const e: Errors = {};
  const req = (k: keyof SignupForm, msg: string) => {
    if (!String(f[k] ?? "").trim()) e[k] = msg;
  };
  switch (step) {
    case "company": {
      req("company_name", "Enter your company name.");
      req("legal_name", "Enter your company's legal name.");
      if (f.country !== "CA" && f.country !== "US") e.country = "Choose Canada or the United States.";
      if (!regionsFor(f.country).some((r) => r.code === f.province_state)) {
        e.province_state = f.country === "US" ? "Choose a state." : "Choose a province or territory.";
      }
      req("mailing_address", "Enter your mailing address.");
      if (f.website.trim() && !isHttpUrl(normaliseWebsite(f.website))) e.website = "Enter a web address like example.com.";
      break;
    }
    case "code": {
      const fmt = codeFormatError(f.company_code);
      if (fmt) e.company_code = fmt;
      else if (codeState === "taken") e.company_code = "That code is taken. Try another.";
      else if (codeState === "checking") e.company_code = "Still checking this code. One moment.";
      break;
    }
    case "contact": {
      req("contact_name", "Enter your name.");
      if (!EMAIL.test(f.contact_email.trim())) e.contact_email = "Enter an email address like name@company.com.";
      const d = phoneDigits(f.contact_phone);
      if (d.length < 10 || d.length > 15) e.contact_phone = "Enter a phone number with area code.";
      break;
    }
    case "plan": {
      const plan = findPlan(catalog, f.plan);
      if (!plan) e.plan = "Choose a plan.";
      const seats = Number(f.seats);
      if (!Number.isInteger(seats) || seats < 1) e.seats = "Enter a whole number of seats.";
      else if (seats > 500) e.seats = "For more than 500 seats, contact us.";
      else if (plan && seats < plan.min_seats) e.seats = `${plan.name} needs at least ${plan.min_seats} seats.`;
      if (f.billing_interval !== "annual" && f.billing_interval !== "monthly") e.billing_interval = "Choose billing.";
      if (!catalog.support_levels.some((s) => s.key === f.support_level)) e.support_level = "Choose a support level.";
      break;
    }
    case "branding": {
      if (f.logo_url.trim() && !isHttpUrl(f.logo_url.trim(), true)) e.logo_url = "Use a full https:// link to your logo.";
      if (f.primary_color && !HEX.test(f.primary_color)) e.primary_color = "Use a colour like #1f4e79.";
      if (f.assistant_name.length > 40) e.assistant_name = "Keep the assistant's name to 40 characters.";
      break;
    }
    case "review": {
      if (!f.accept_terms) e.accept_terms = "Accept the terms of service to continue.";
      if (!f.accept_privacy) e.accept_privacy = "Accept the privacy policy to continue.";
      break;
    }
  }
  return e;
}

/** Canadian/US number: 10 digits, or 11 starting with 1, typed with the usual spaces, dots, dashes and brackets. */
export function validNaPhone(raw: string): boolean {
  if (/[^\d\s()+.-]/.test(raw.trim())) return false;
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 && !/^[01]/.test(d) && !/^[01]/.test(d.slice(3));
}

/** Formats a North American number as it is typed: "4035550199" -> "(403) 555-0199". A leading 1 or +1 is dropped. */
export function formatNaPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
