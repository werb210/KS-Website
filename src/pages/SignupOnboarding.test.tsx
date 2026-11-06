// KS_WEBSITE_TEAM_ROSTER / KS_WEBSITE_LICENCE_AGREEMENT - the "Your team" step, the licence agreement before payment,
// and the two pages the owner's emails link to. KS-Ops is faked through fetch.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import { e164NaPhone, teamErrors, validateStep, EMPTY_FORM } from "../lib/validation";
import Signup from "./Signup";
import SignupAgreement from "./SignupAgreement";
import SignupTeam from "./SignupTeam";

vi.mock("../lib/navigate", () => ({ goTo: vi.fn() }));
import { goTo } from "../lib/navigate";

const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));

const AGREEMENT = {
  company_name: "Prairie Capital",
  legal_name: "Prairie Capital Inc.",
  contact_name: "Pat Lee",
  contact_title: "Owner",
  version: "2026-11-06.template-1",
  title: "Keystone Software Licence Agreement",
  html: "<h2>Keystone Software Licence Agreement</h2><h3>4. What you bought and what it costs</h3><ul><li>Plan: Growth</li></ul><script>alert(1)</script>",
  sha256: "a".repeat(64),
  signed: null,
};

async function toTeam() {
  type("Company name", "Prairie Capital");
  type("Legal name", "Prairie Capital Inc.");
  type("Business number", "123456789");
  type("Kind of business", "corporation");
  type("Province or territory", "AB");
  type("Street address", "100 Main St");
  type("City", "Calgary");
  type("Postal code", "T2P 1A1");
  next();
  await screen.findByText("prairie-capital is available.");
  next();
  await screen.findByRole("heading", { name: "Contact" });
  type("Your name", "Pat Lee");
  type("Your job title", "Owner");
  type("Email", "pat@prairie.example");
  type("Mobile phone", "403 555 0100");
  next();
  await screen.findByRole("heading", { name: "Plan" });
  next();
  await screen.findByRole("heading", { name: "Your team" });
}

async function teamToReview() {
  next();
  await screen.findByRole("heading", { name: "Branding" });
  next();
  await screen.findByRole("heading", { name: "Review" });
  fireEvent.click(screen.getByLabelText(/terms of service/));
  fireEvent.click(screen.getByLabelText(/privacy policy/));
}

function signupRoutes(extra: Parameters<typeof mockFetch>[0] = {}) {
  return mockFetch({
    "/api/public/plans": () => ({ status: 500 }),
    "company-code-available": () => ({ body: { available: true } }),
    "/agreement": (_u, init) => (init?.method === "POST"
      ? { status: 201, body: { ok: true, signed: { version: AGREEMENT.version, signer_name: "Pat Lee", signer_title: "Owner", signed_at: "2026-11-06T18:00:00Z" } } }
      : { body: AGREEMENT }),
    "/api/public/signup": () => ({ status: 201, body: { licensee_id: "lic-1", signup_token: "tok-1", checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1" } }),
    ...extra,
  });
}

describe("Your team step", () => {
  beforeEach(() => {
    vi.mocked(goTo).mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("lists the owner first, adds people up to the seats, and checks each person", async () => {
    signupRoutes();
    renderAt(<Signup />, "/signup");
    await toTeam();
    expect(screen.getByTestId("team-owner")).toHaveTextContent("Pat Lee, pat@prairie.example, (403) 555-0100");
    expect(screen.getByTestId("team-seats")).toHaveTextContent("1 of 3 seats used.");
    fireEvent.click(screen.getByRole("button", { name: "Add a person" }));
    fireEvent.click(screen.getByRole("button", { name: "Add a person" }));
    expect(screen.getByTestId("team-seats")).toHaveTextContent("3 of 3 seats used.");
    expect(screen.getByRole("button", { name: "Add a person" })).toBeDisabled();
    expect(screen.getByText(/Every seat is taken/)).toBeInTheDocument();
    type("Person 2 full name", "Bea Broker");
    type("Person 2 email", "pat@prairie.example");
    type("Person 2 mobile", "103 555 0101");
    next();
    expect(await screen.findByText("Person 1 already uses this email.")).toBeInTheDocument();
    expect(within(screen.getByTestId("team-person-2")).getByText(/Enter a Canadian or US mobile number/)).toBeInTheDocument();
    expect(within(screen.getByTestId("team-person-3")).getByText("Enter their full name.")).toBeInTheDocument(); // person 3 is empty
    fireEvent.click(screen.getByRole("button", { name: "Remove person 3" }));
    type("Person 2 email", "bea@prairie.example");
    type("Person 2 mobile", "1 587 555 0101");
    type("Person 2 role", "Marketing");
    next();
    await screen.findByRole("heading", { name: "Branding" });
  });

  it("sends the team owner first with E.164 mobiles, shows the agreement, then goes to payment once signed", async () => {
    const f = signupRoutes();
    renderAt(<Signup />, "/signup");
    await toTeam();
    fireEvent.click(screen.getByRole("button", { name: "Add a person" }));
    type("Person 2 full name", "Bea  Broker");
    type("Person 2 email", "bea@prairie.example");
    type("Person 2 mobile", "(587) 555-0101");
    await teamToReview();
    expect(screen.getByTestId("review-team")).toHaveTextContent("Pat Lee (Admin), Bea Broker (Broker)");
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    // The agreement, before payment.
    expect(await screen.findByRole("heading", { name: "Your licence agreement" })).toBeInTheDocument();
    const body = JSON.parse(String(callsTo(f, "/api/public/signup").find(([u]) => String(u).endsWith("/api/public/signup"))![1]!.body));
    expect(body.team).toEqual([
      { full_name: "Pat Lee", email: "pat@prairie.example", phone: "+14035550100", role: "Admin" },
      { full_name: "Bea Broker", email: "bea@prairie.example", phone: "+15875550101", role: "Broker" },
    ]);
    const text = await screen.findByTestId("agreement-text");
    expect(text).toHaveTextContent("Plan: Growth");
    expect(text.innerHTML).not.toContain("<script");
    expect(goTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Your full name")).toHaveValue("Pat Lee");
    expect(screen.getByLabelText("Your title")).toHaveValue("Owner");
    fireEvent.click(screen.getByRole("button", { name: "Sign and continue to payment" }));
    expect(await screen.findByText("Tick the box to agree.")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/I agree to the Keystone Software Licence Agreement on behalf of Prairie Capital Inc\./));
    fireEvent.click(screen.getByRole("button", { name: "Sign and continue to payment" }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1"));
    const post = callsTo(f, "/agreement").find(([, init]) => init?.method === "POST")!;
    expect(String(post[0])).toContain("/api/public/signup/lic-1/agreement?token=tok-1");
    expect(JSON.parse(String(post[1]!.body))).toEqual({ signer_name: "Pat Lee", signer_title: "Owner", sha256: AGREEMENT.sha256, agree: true });
  });

  it("goes straight to payment when the agreement cannot be loaded (the link is emailed after payment)", async () => {
    signupRoutes({ "/agreement": () => ({ status: 503, body: {} }) });
    renderAt(<Signup />, "/signup");
    await toTeam();
    await teamToReview();
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1"));
  });

  it("sends the person back to the team step for a team error from KS-Ops", async () => {
    signupRoutes({ "/api/public/signup": () => ({ status: 400, body: { errors: { team: "You bought 3 seats.", "team.2.phone": "Enter a Canadian or US mobile number." } } }) });
    renderAt(<Signup />, "/signup");
    await toTeam();
    fireEvent.click(screen.getByRole("button", { name: "Add a person" }));
    type("Person 2 full name", "Bea Broker");
    type("Person 2 email", "bea@prairie.example");
    type("Person 2 mobile", "5875550101");
    await teamToReview();
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(await screen.findByRole("heading", { name: "Your team" })).toBeInTheDocument();
    expect(screen.getByText("Enter a Canadian or US mobile number.")).toBeInTheDocument();
  });
});

describe("team rules", () => {
  it("match KS-Ops: E.164, no duplicates, no more people than seats", () => {
    expect(e164NaPhone("1 (403) 555-0100")).toBe("+14035550100");
    expect(e164NaPhone("403 155 0100")).toBe("");
    const owner = { email: "pat@prairie.example", phone: "4035550100" };
    expect(teamErrors([], owner, 1)).toEqual({});
    expect(teamErrors([{ full_name: "Bea B", email: "bea@p.example", phone: "5875550101", role: "Broker" }], owner, 1).team).toMatch(/up to 0 people/);
    expect(teamErrors([{ full_name: "Bea B", email: "bea@p.example", phone: "403-555-0100", role: "Broker" }], owner, 3)).toMatchObject({ "team.2.phone": "Person 1 already uses this mobile number." });
  });

  it("the owner's own phone must be a Canadian or US mobile", () => {
    const f = { ...EMPTY_FORM, contact_name: "Pat", contact_title: "Owner", contact_email: "pat@p.example", contact_phone: "+44 20 7946 0958" };
    expect(validateStep("contact", f, {} as never, "idle").contact_phone).toMatch(/Canadian or US mobile/);
    expect(validateStep("contact", { ...f, contact_phone: "403 555 0100" }, {} as never, "idle").contact_phone).toBeUndefined();
  });
});

describe("/signup/agreement", () => {
  it("signs from the emailed link and says what happens next", async () => {
    const f = signupRoutes();
    renderAt(<SignupAgreement />, "/signup/agreement?l=lic-7&t=tok-7");
    await screen.findByTestId("agreement-text");
    fireEvent.click(screen.getByLabelText(/I agree/));
    fireEvent.click(screen.getByRole("button", { name: "Sign" }));
    expect(await screen.findByTestId("agreement-signed")).toHaveTextContent("Signed by Pat Lee (Owner)");
    expect(String(callsTo(f, "/agreement")[0][0])).toContain("/api/public/signup/lic-7/agreement?token=tok-7");
  });

  it("asks to read the new text when the agreement changed", async () => {
    let gets = 0;
    mockFetch({
      "/agreement": (_u, init) => {
        if (init?.method === "POST") return { status: 409, body: { error: "agreement_changed", message: "The agreement was updated. Please read the new version and sign again." } };
        gets += 1;
        return { body: AGREEMENT };
      },
    });
    renderAt(<SignupAgreement />, "/signup/agreement?l=lic-7&t=tok-7");
    await screen.findByTestId("agreement-text");
    fireEvent.click(screen.getByLabelText(/I agree/));
    fireEvent.click(screen.getByRole("button", { name: "Sign" }));
    expect(await screen.findByText(/The agreement was updated/)).toBeInTheDocument();
    await waitFor(() => expect(gets).toBe(2));
  });

  it("shows an already signed agreement as signed", async () => {
    mockFetch({ "/agreement": () => ({ body: { ...AGREEMENT, signed: { version: AGREEMENT.version, signer_name: "Pat Lee", signer_title: "Owner", signed_at: "2026-11-06T18:00:00Z" } } }) });
    renderAt(<SignupAgreement />, "/signup/agreement?l=lic-7&t=tok-7");
    expect(await screen.findByTestId("agreement-signed")).toBeInTheDocument();
  });
});

describe("/signup/team", () => {
  const owner = { full_name: "Pat Lee", email: "pat@prairie.example", phone: "+14035550100", role: "Admin", is_owner: true };

  it("loads the team, saves changes and confirms", async () => {
    const f = mockFetch({
      "/team": (_u, init) => (init?.method === "PUT"
        ? { body: { ok: true, seats: 2, locked: false, team: [owner, { full_name: "Bea Broker", email: "bea@prairie.example", phone: "+15875550101", role: "Broker", is_owner: false }] } }
        : { body: { company_name: "Prairie Capital", seats: 2, locked: false, team: [owner] } }),
    });
    renderAt(<SignupTeam />, "/signup/team?l=lic-7&t=tok-7");
    expect(await screen.findByRole("heading", { name: "Your team at Prairie Capital" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add a person" }));
    expect(screen.getByRole("button", { name: "Add a person" })).toBeDisabled();
    type("Person 2 full name", "Bea Broker");
    type("Person 2 email", "bea@prairie.example");
    type("Person 2 mobile", "587-555-0101");
    fireEvent.click(screen.getByRole("button", { name: "Save team" }));
    expect(await screen.findByText(/Saved\. Everyone on the list is invited/)).toBeInTheDocument();
    const put = callsTo(f, "/team").find(([, init]) => init?.method === "PUT")!;
    expect(JSON.parse(String(put[1]!.body))).toEqual({ team: [{ full_name: "Bea Broker", email: "bea@prairie.example", phone: "+15875550101", role: "Broker" }] });
  });

  it("says the team was already invited once it is locked", async () => {
    mockFetch({ "/team": () => ({ body: { seats: 2, locked: true, team: [owner] } }) });
    renderAt(<SignupTeam />, "/signup/team?l=lic-7&t=tok-7");
    expect(await screen.findByTestId("team-locked")).toHaveTextContent("already been invited");
  });
});
