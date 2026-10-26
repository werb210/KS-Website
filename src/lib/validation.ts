import type { BillingInterval, Catalog, PaymentMethod, PlanKey } from "./plans";
import { MAX_SEATS, findPlan, isPaymentMethod } from "./plans";
import { regionsFor } from "./regions";

export type SignupForm = {
  company_name: string;
  legal_name: string;
  country: "CA" | "US";
  province_state: string;
  /** Mailing address in parts (unit is optional). */
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  website: string;
  /** KS_WEBSITE_TWILIO_AUTO - for texting registration with the phone carriers: CRA business number or US EIN, the
   *  kind of business, and the contact's job title. */
  business_number: string;
  business_type: string;
  contact_title: string;
  company_code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  plan: PlanKey;
  seats: number;
  billing_interval: BillingInterval;
  support_level: string;
  /** Extra 50 GB storage blocks bought on top of the plan's allowance. */
  extra_storage_blocks: number;
  /** Bank debit (Canadian pre-authorized debit) by default, or card. */
  payment_method: PaymentMethod;
  /** An uploaded logo, read in the browser (null = none). */
  logo_file: LogoFile | null;
  primary_color: string;
  /** Accent (secondary) colour, for links and highlights. */
  accent_color: string;
  /** Optional background / surface colour ("" = the default). */
  background_color: string;
  /** The font for the client app and pages ("" = the default). A family name, e.g. "Lato". */
  font_family: string;
  assistant_name: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  website_url: string;
};

export type LogoFile = { name: string; type: string; size: number; data_url: string };

export const MAX_LOGO_BYTES = 500 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export const EMPTY_FORM: SignupForm = {
  company_name: "",
  legal_name: "",
  country: "CA",
  province_state: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  website: "",
  business_number: "",
  business_type: "",
  contact_title: "",
  company_code: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  plan: "growth",
  seats: 3,
  billing_interval: "annual",
  support_level: "email",
  extra_storage_blocks: 0,
  payment_method: "acss_debit",
  logo_file: null,
  primary_color: "#1f4e79",
  accent_color: "#0e6655",
  background_color: "",
  font_family: "",
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
  address_line1: "company",
  address_line2: "company",
  city: "company",
  postal_code: "company",
  website: "company",
  business_number: "company",
  business_type: "company",
  contact_title: "contact",
  company_code: "code",
  contact_name: "contact",
  contact_email: "contact",
  contact_phone: "contact",
  plan: "plan",
  seats: "plan",
  billing_interval: "plan",
  support_level: "plan",
  extra_storage_blocks: "plan",
  payment_method: "plan",
  logo_url: "branding",
  logo_file: "branding",
  primary_color: "branding",
  accent_color: "branding",
  background_color: "branding",
  font_family: "branding",
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

// KS_WEBSITE_TWILIO_AUTO - the same choices and checks as KS-Ops (src/licensees/validation.ts).
export const BUSINESS_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "Limited liability company (LLC)" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_proprietor", label: "Sole proprietorship" },
  { value: "non_profit", label: "Non-profit" },
  { value: "cooperative", label: "Co-operative" },
];

/** A CRA business number (9 digits, optionally with its program account) or a US EIN (12-3456789); null if neither. */
export function normaliseBusinessNumber(country: string, raw: string): string | null {
  const v = String(raw ?? "").toUpperCase().replace(/[\s-]/g, "");
  if (country === "US") return /^\d{9}$/.test(v) ? `${v.slice(0, 2)}-${v.slice(2)}` : null;
  return /^\d{9}([A-Z]{2}\d{4})?$/.test(v) ? v : null;
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
      req("address_line1", "Enter your street address.");
      req("city", "Enter your city.");
      if (!String(f.postal_code ?? "").trim()) {
        e.postal_code = f.country === "US" ? "Enter your ZIP code." : "Enter your postal code.";
      } else if (!normalizePostal(f.country, f.postal_code)) {
        e.postal_code = f.country === "US" ? "Enter a ZIP code like 94105 or 94105-1234." : "Enter a postal code like T2P 1P6.";
      }
      if (f.website.trim() && !isHttpUrl(normaliseWebsite(f.website))) e.website = "Enter a web address like example.com.";
      if (!f.business_number.trim()) e.business_number = f.country === "US" ? "Enter your EIN." : "Enter your business number.";
      else if (!normaliseBusinessNumber(f.country, f.business_number)) {
        e.business_number = f.country === "US" ? "Enter your 9-digit EIN, like 12-3456789." : "Enter your 9-digit CRA business number, like 123456789.";
      }
      if (!BUSINESS_TYPES.some((t) => t.value === f.business_type)) e.business_type = "Choose the kind of business.";
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
      req("contact_title", "Enter your job title.");
      if (!EMAIL.test(f.contact_email.trim())) e.contact_email = "Enter an email address like name@company.com.";
      const d = phoneDigits(f.contact_phone);
      if (d.length < 10 || d.length > 15) e.contact_phone = "Enter a phone number with area code.";
      break;
    }
    case "plan": {
      const plan = findPlan(catalog, f.plan);
      if (!plan) e.plan = "Choose a plan.";
      const seats = Number(f.seats);
      const maxSeats = plan?.max_seats ?? MAX_SEATS;
      if (!Number.isInteger(seats) || seats < 1) e.seats = "Enter a whole number of seats.";
      else if (seats > maxSeats) e.seats = `For more than ${maxSeats.toLocaleString("en-CA")} seats, contact us.`;
      else if (plan && seats < plan.min_seats) e.seats = `${plan.name} needs at least ${plan.min_seats} seats.`;
      const blocks = Number(f.extra_storage_blocks ?? 0);
      const maxBlocks = catalog.extra_storage.max_blocks;
      if (!Number.isInteger(blocks) || blocks < 0) e.extra_storage_blocks = "Enter a whole number of storage blocks, or 0.";
      else if (blocks > maxBlocks) e.extra_storage_blocks = `Extra storage is limited to ${maxBlocks.toLocaleString("en-CA")} blocks.`;
      if (f.billing_interval !== "annual" && f.billing_interval !== "monthly") e.billing_interval = "Choose billing.";
      if (!catalog.support_levels.some((s) => s.key === f.support_level)) e.support_level = "Choose a support level.";
      if (!isPaymentMethod(f.payment_method)) e.payment_method = "Choose bank debit or credit card.";
      break;
    }
    case "branding": {
      if (f.logo_file) {
        if (!LOGO_TYPES.includes(f.logo_file.type)) e.logo_file = "Use a PNG, JPG or SVG file.";
        else if (f.logo_file.size > MAX_LOGO_BYTES) e.logo_file = "Use a logo file under 500 KB.";
      }
      if (f.primary_color && !HEX.test(f.primary_color)) e.primary_color = "Use a colour like #1f4e79.";
      if (f.accent_color && !HEX.test(f.accent_color)) e.accent_color = "Use a colour like #0e6655.";
      if (f.background_color && !HEX.test(f.background_color)) e.background_color = "Use a colour like #f4f6f7, or leave it empty.";
      if (f.font_family && !/^[A-Za-z0-9][A-Za-z0-9 -]{0,59}$/.test(f.font_family.trim())) e.font_family = "Choose a font from the list.";
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

/** Canadian postal code ("T2P 1P6") or US ZIP code ("94105", "94105-1234") in its usual form, or null. */
export function normalizePostal(country: string, raw: string): string | null {
  const v = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  if (country === "US") return /^\d{5}(-\d{4})?$/.test(v) ? v : null;
  const c = v.replace(/[\s-]/g, "");
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(c)) return null;
  return `${c.slice(0, 3)} ${c.slice(3)}`;
}

/** The address on one line: "100 Main St, Unit 4, Calgary AB T2P 1P6, Canada". */
export function oneLineAddress(f: Pick<SignupForm, "address_line1" | "address_line2" | "city" | "province_state" | "postal_code" | "country">): string {
  const postal = normalizePostal(f.country, f.postal_code) ?? f.postal_code.trim();
  const cityLine = [f.city.trim(), f.province_state, postal].filter(Boolean).join(" ");
  return [f.address_line1.trim(), f.address_line2.trim(), cityLine, f.country === "US" ? "United States" : "Canada"].filter(Boolean).join(", ");
}

/** The postal or ZIP code tidied when it is valid, else as typed. */
export function normalisePostalOrSelf(country: string, raw: string): string {
  return normalizePostal(country, raw) ?? raw.trim();
}
