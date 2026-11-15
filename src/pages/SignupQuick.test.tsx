// KS_WEBSITE_QUICK_SIGNUP - one short page, then payment.
import { describe, expect, it } from "vitest";
import { EMPTY_FORM } from "../lib/validation";
import { quickErrors, quickPayload } from "./SignupQuick";

const good = { ...EMPTY_FORM, company_name: "Northwind Capital", contact_name: "Nora North", contact_email: "nora@northwind.example", contact_phone: "(403) 555-0199", country: "CA" as const, province_state: "AB" };

describe("the short sign-up", () => {
  it("asks only for the company, the person, where they are and agreement", () => {
    expect(quickErrors(good, true, {})).toEqual({});
    const e = quickErrors({ ...EMPTY_FORM }, false, {});
    expect(Object.keys(e).sort()).toEqual(["agree", "company_name", "contact_email", "contact_name", "contact_phone", "province_state"]);
  });
  it("never asks for a company code, legal name, address, business number, job title, team or branding", () => {
    const p = quickPayload(good, "") as unknown as Record<string, unknown>;
    for (const k of ["company_code", "legal_name", "address_line1", "city", "postal_code", "business_number", "business_type", "contact_title", "logo_file", "primary_color"]) {
      expect(k in p).toBe(false);
    }
    expect(p).toMatchObject({ company_name: "Northwind Capital", accept_terms: true, accept_privacy: true, accept_agreement: true, plan: "growth", seats: 3 });
    expect(p.team).toEqual([{ full_name: "Nora North", email: "nora@northwind.example", phone: "+14035550199", role: "Admin" }]);
  });
});
