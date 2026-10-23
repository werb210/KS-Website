import { describe, expect, it } from "vitest";
import { contrastRatio, darkenForWhiteText } from "./contrast";
import { FALLBACK_CATALOG } from "./plans";
import { EMPTY_FORM, codeFormatError, formatNaPhone, suggestCode, validNaPhone, validateStep, type SignupForm } from "./validation";

const c = FALLBACK_CATALOG;
const good: SignupForm = {
  ...EMPTY_FORM,
  company_name: "Prairie Capital",
  legal_name: "Prairie Capital Inc.",
  country: "CA",
  province_state: "AB",
  mailing_address: "100 Main St, Calgary AB T2P 1A1",
  company_code: "prairie-capital",
  contact_name: "Pat Lee",
  contact_email: "pat@prairie.example",
  contact_phone: "(403) 555-0100",
  plan: "growth",
  seats: 3,
  accept_terms: true,
  accept_privacy: true,
};

describe("validateStep", () => {
  it("passes a complete form on every step", () => {
    for (const s of ["company", "code", "contact", "plan", "branding", "review"] as const) {
      expect(validateStep(s, good, c, "available")).toEqual({});
    }
  });

  it("requires company details and a province from the chosen country", () => {
    const e = validateStep("company", { ...EMPTY_FORM, country: "US", province_state: "AB" }, c, "idle");
    expect(Object.keys(e).sort()).toEqual(["company_name", "legal_name", "mailing_address", "province_state"]);
    expect(e.province_state).toMatch(/state/);
  });

  it("checks the website loosely", () => {
    expect(validateStep("company", { ...good, website: "prairie.example" }, c, "idle")).toEqual({});
    expect(validateStep("company", { ...good, website: "not a site" }, c, "idle").website).toBeTruthy();
  });

  it("blocks a taken code and one still being checked", () => {
    expect(validateStep("code", good, c, "taken").company_code).toMatch(/taken/);
    expect(validateStep("code", good, c, "checking").company_code).toMatch(/checking/);
    // A failed check doesn't block: the server checks again on submit.
    expect(validateStep("code", good, c, "error")).toEqual({});
  });

  it("validates email and phone", () => {
    const e = validateStep("contact", { ...good, contact_email: "pat@", contact_phone: "555" }, c, "idle");
    expect(e.contact_email).toBeTruthy();
    expect(e.contact_phone).toBeTruthy();
  });

  it("enforces the pro 2-seat minimum", () => {
    expect(validateStep("plan", { ...good, plan: "pro", seats: 1 }, c, "idle").seats).toMatch(/at least 2/);
    expect(validateStep("plan", { ...good, plan: "pro", seats: 2 }, c, "idle")).toEqual({});
    expect(validateStep("plan", { ...good, seats: 0 }, c, "idle").seats).toBeTruthy();
    expect(validateStep("plan", { ...good, seats: 2.5 }, c, "idle").seats).toBeTruthy();
  });

  it("needs https logos and hex colours", () => {
    const e = validateStep("branding", { ...good, logo_url: "http://x.example/logo.png", primary_color: "blue" }, c, "idle");
    expect(e.logo_url).toBeTruthy();
    expect(e.primary_color).toBeTruthy();
  });

  it("requires both acceptances on review", () => {
    const e = validateStep("review", { ...good, accept_terms: false, accept_privacy: false }, c, "idle");
    expect(Object.keys(e).sort()).toEqual(["accept_privacy", "accept_terms"]);
  });
});

describe("company code helpers", () => {
  it("formats", () => {
    expect(codeFormatError("ab")).toBeTruthy();
    expect(codeFormatError("Has Caps")).toBeTruthy();
    expect(codeFormatError("a".repeat(33))).toBeTruthy();
    expect(codeFormatError("keystone-demo")).toBeNull();
  });
  it("suggests from the company name", () => {
    expect(suggestCode("Prairie Capital Inc.")).toBe("prairie-capital");
    expect(suggestCode("Côte & Fils Ltd")).toBe("cote-fils");
  });
});

describe("contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
  });
  it("darkens a light colour until white text passes", () => {
    const d = darkenForWhiteText("#7fc8ff")!;
    expect(contrastRatio(d, "#ffffff")!).toBeGreaterThanOrEqual(4.5);
  });
  it("site palette text pairs meet 4.5:1", () => {
    const pairs: [string, string][] = [
      ["#16263a", "#f4f6f7"], // ink on paper
      ["#556373", "#f4f6f7"], // stone on paper
      ["#556373", "#ffffff"], // stone on surface
      ["#ffffff", "#0e6655"], // button text
      ["#0e6655", "#f4f6f7"], // links on paper
      ["#0a4d40", "#dcede8"], // accent-ink on accent-soft
      ["#a32222", "#fbeaea"], // error on error background
      ["#a32222", "#ffffff"], // error on surface
      ["#17663a", "#ffffff"], // ok text
      ["#dbe3ea", "#16263a"], // footer text
      ["#b9c5d0", "#16263a"], // footer small print
      ["#16263a", "#f4e6c8"], // ink on ochre-soft
    ];
    for (const [fg, bg] of pairs) expect(contrastRatio(fg, bg)!, `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });
});

describe("validNaPhone (demo sign-up)", () => {
  it("accepts Canadian/US numbers typed the usual ways and rejects the rest", () => {
    for (const ok of ["(403) 555-0199", "403.555.0199", "1 403 555 0199", "+1 403-555-0199", "4035550199"]) expect(validNaPhone(ok)).toBe(true);
    for (const bad of ["", "555-0199", "+44 20 7946 0958", "403 555 019x", "(103) 555-0199"]) expect(validNaPhone(bad)).toBe(false);
  });
});

describe("formatNaPhone", () => {
  it("formats as the person types and drops a leading 1", () => {
    expect(formatNaPhone("")).toBe("");
    expect(formatNaPhone("4")).toBe("(4");
    expect(formatNaPhone("4035")).toBe("(403) 5");
    expect(formatNaPhone("4035550")).toBe("(403) 555-0");
    expect(formatNaPhone("4035550199")).toBe("(403) 555-0199");
    expect(formatNaPhone("+1 403 555 0199")).toBe("(403) 555-0199");
    expect(formatNaPhone("403555019999")).toBe("(403) 555-0199");
  });
});
