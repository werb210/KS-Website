import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import Signup from "./Signup";

vi.mock("../lib/navigate", () => ({ goTo: vi.fn() }));
import { goTo } from "../lib/navigate";

type Routes = Parameters<typeof mockFetch>[0];

function setup(extra: Routes = {}, path = "/signup") {
  const f = mockFetch({
    "/api/public/plans": () => ({ status: 500 }),
    "company-code-available": () => ({ body: { available: true } }),
    ...extra,
  });
  renderAt(<Signup />, path);
  return f;
}

const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));

async function fillToPlan() {
  type("Company name", "Prairie Capital");
  type("Legal name", "Prairie Capital Inc.");
  type("Province or territory", "AB");
  type("Mailing address", "100 Main St, Calgary AB");
  next();
  await screen.findByRole("heading", { name: "Company code" });
  expect(screen.getByLabelText("Company code")).toHaveValue("prairie-capital");
  await screen.findByText("prairie-capital is available.");
  next();
  await screen.findByRole("heading", { name: "Contact" });
  type("Your name", "Pat Lee");
  type("Email", "pat@prairie.example");
  type("Mobile phone", "403 555 0100");
  next();
  await screen.findByRole("heading", { name: "Plan" });
}

async function fillToReview(opts: { plan?: "Starter" | "Growth" | "Pro"; seats?: string } = {}) {
  await fillToPlan();
  if (opts.plan) fireEvent.click(screen.getByRole("radio", { name: new RegExp(`^${opts.plan}`) }));
  if (opts.seats) type("Seats", opts.seats);
  next();
  await screen.findByRole("heading", { name: "Branding" });
  next();
  await screen.findByRole("heading", { name: "Review" });
  fireEvent.click(screen.getByLabelText(/terms of service/));
  fireEvent.click(screen.getByLabelText(/privacy policy/));
}

describe("Sign-up", () => {
  beforeEach(() => vi.mocked(goTo).mockReset());

  it("shows inline errors and stays on the step when required fields are empty", async () => {
    setup();
    next();
    expect(await screen.findByText("Enter your company name.")).toBeInTheDocument();
    expect(screen.getByLabelText("Company name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Choose a province or territory.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Company" })).toBeInTheDocument();
  });

  it("blocks a taken company code", async () => {
    setup({ "company-code-available": () => ({ body: { available: false } }) });
    type("Company name", "Prairie Capital");
    type("Legal name", "Prairie Capital Inc.");
    type("Province or territory", "AB");
    type("Mailing address", "100 Main St");
    next();
    await screen.findByText(/That code is taken/);
    next();
    expect(await screen.findByText("That code is taken. Try another.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Company code" })).toBeInTheDocument();
  });

  it("raises pro to 2 seats and shows a live price summary", async () => {
    setup();
    type("Company name", "Acme Lending");
    type("Legal name", "A Co Ltd");
    type("Province or territory", "ON");
    type("Mailing address", "1 King St");
    next();
    await screen.findByText("acme-lending is available.");
    next();
    type("Your name", "Pat");
    type("Email", "pat@a.example");
    type("Mobile phone", "4165550100");
    next();
    await screen.findByRole("heading", { name: "Plan" });
    type("Seats", "1");
    fireEvent.click(screen.getByRole("radio", { name: /^Pro/ }));
    expect(screen.getByLabelText("Seats")).toHaveValue(2);
    // Pro annual: 2 x $199 = $398 a month; first payment 12 x 398 + 2,000 onboarding.
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$398");
    expect(screen.getByTestId("onboarding-fee")).toHaveTextContent("$2,000");
    expect(screen.getByTestId("first-payment")).toHaveTextContent("$6,776");
    fireEvent.click(screen.getByRole("radio", { name: /^Monthly/ }));
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$458");
    expect(screen.getByTestId("first-payment")).toHaveTextContent("$2,458");
    type("Seats", "1");
    next();
    expect(await screen.findByText("Pro needs at least 2 seats.")).toBeInTheDocument();
  });

  it("requires accepting terms and privacy", async () => {
    setup();
    await fillToReview();
    fireEvent.click(screen.getByLabelText(/terms of service/));
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(await screen.findByText("Accept the terms of service to continue.")).toBeInTheDocument();
  });

  it("submits the sign-up and redirects to checkout", async () => {
    const f = setup({
      "/api/public/signup": () => ({
        status: 201,
        body: { licensee_id: "lic-1", signup_token: "tok-1", checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1" },
      }),
    });
    await fillToReview({ plan: "Starter", seats: "4" });
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1"));
    const [, init] = callsTo(f, "/api/public/signup")[0];
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      company_name: "Prairie Capital",
      legal_name: "Prairie Capital Inc.",
      company_code: "prairie-capital",
      country: "CA",
      province_state: "AB",
      contact_email: "pat@prairie.example",
      plan: "starter",
      seats: 4,
      billing_interval: "annual",
      support_level: "email",
      extra_storage_blocks: 0,
      accept_terms: true,
      accept_privacy: true,
      website_url: "",
    });
    expect(body.website).toBeUndefined();
    expect(JSON.parse(sessionStorage.getItem("ks-signup-last")!)).toMatchObject({ id: "lic-1", token: "tok-1" });
  });

  it("shows the thank-you message when there's no checkout link", async () => {
    setup({
      "/api/public/signup": () => ({ status: 201, body: { licensee_id: "lic-2", signup_token: "tok-2", checkout_url: null } }),
    });
    await fillToReview();
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(await screen.findByRole("heading", { name: /Thanks — we'll contact you to complete payment/ })).toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();
  });

  it("shows API field errors inline on the step that owns the field", async () => {
    setup({
      "/api/public/signup": () => ({ status: 400, body: { errors: { contact_email: "Email domain can't receive mail" } } }),
    });
    await fillToReview();
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(await screen.findByRole("heading", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByText("Email domain can't receive mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/need fixing/);
  });

  it("sends the person back to the code step on a 409", async () => {
    setup({ "/api/public/signup": () => ({ status: 409, body: { errors: { company_code: "taken" } } }) });
    await fillToReview();
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(await screen.findByRole("heading", { name: "Company code" })).toBeInTheDocument();
    expect(screen.getByText("taken")).toBeInTheDocument();
  });

  it("has a honeypot field hidden from people", () => {
    setup();
    const hp = document.getElementById("website_url") as HTMLInputElement;
    expect(hp).toBeInTheDocument();
    expect(hp.tabIndex).toBe(-1);
    expect(hp.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("prefills plan and seats from the pricing link", async () => {
    setup({}, "/signup?plan=pro&seats=6&billing=monthly");
    expect(screen.getByTestId("monthly-total")).toHaveTextContent(`$${(6 * 229).toLocaleString("en-CA")}`);
  });

  it("does not follow a payment link that isn't a Stripe Checkout page", async () => {
    for (const checkout_url of ["https://evil.example/pay", "http://checkout.stripe.com/c/pay/cs_1", "https://checkout.stripe.com.evil.example/x"]) {
      vi.mocked(goTo).mockReset();
      setup({ "/api/public/signup": () => ({ status: 201, body: { licensee_id: "lic-3", signup_token: "tok-3", checkout_url } }) });
      await fillToReview();
      fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
      expect(await screen.findByRole("heading", { name: /Thanks — we'll contact you to complete payment/ })).toBeInTheDocument();
      expect(goTo).not.toHaveBeenCalled();
      cleanup();
    }
  });

  it("seat stepper: - and + stay inside the plan's minimum and maximum, typed numbers snap into range", async () => {
    setup();
    await fillToPlan();
    const seats = screen.getByLabelText("Seats");
    const minus = screen.getByRole("button", { name: "Remove a seat" });
    const plus = screen.getByRole("button", { name: "Add a seat" });
    expect(seats).toHaveValue(3);
    fireEvent.click(plus);
    expect(seats).toHaveValue(4);
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$476"); // 4 x $119
    fireEvent.click(minus);
    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(seats).toHaveValue(1);
    expect(minus).toBeDisabled();
    // Pro needs 2: switching raises the count and - stops at 2.
    fireEvent.click(screen.getByRole("radio", { name: /^Pro/ }));
    expect(seats).toHaveValue(2);
    expect(minus).toBeDisabled();
    // Typed entry above the maximum snaps to 1,000 when the box is left.
    fireEvent.focus(seats);
    fireEvent.change(seats, { target: { value: "5000" } });
    fireEvent.blur(seats);
    expect(seats).toHaveValue(1000);
    expect(plus).toBeDisabled();
    // An empty box goes back to the minimum.
    fireEvent.focus(seats);
    fireEvent.change(seats, { target: { value: "" } });
    fireEvent.blur(seats);
    expect(seats).toHaveValue(2);
  });

  it("choosing a support level or extra storage changes the price straight away", async () => {
    setup();
    await fillToPlan();
    // Growth, 3 seats, annual: $357 with Email support.
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$357");
    expect(screen.getByTestId("support-monthly")).toHaveTextContent("Included");
    fireEvent.click(screen.getByRole("radio", { name: /^Premium/ }));
    expect(screen.getByTestId("support-monthly")).toHaveTextContent("$499");
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$856");
    fireEvent.click(screen.getByRole("radio", { name: /^Priority/ }));
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$556");
    fireEvent.click(screen.getByRole("button", { name: "Add 50 GB" }));
    fireEvent.click(screen.getByRole("button", { name: "Add 50 GB" }));
    expect(screen.getByLabelText(/Extra storage/)).toHaveValue(2);
    expect(screen.getByTestId("storage-monthly")).toHaveTextContent("$20");
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$576");
    // Annual: 12 x $576 + $750 onboarding.
    expect(screen.getByTestId("first-payment")).toHaveTextContent("$7,662");
    fireEvent.click(screen.getByRole("radio", { name: /^Monthly/ }));
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$636"); // 3 x $139 + 199 + 20
  });

  it("the price sidebar can change plan, billing, seats, support and storage from any step", () => {
    setup();
    const side = within(screen.getByTestId("summary-controls"));
    fireEvent.click(side.getByRole("radio", { name: "Starter" }));
    fireEvent.click(side.getByRole("radio", { name: "Monthly" }));
    fireEvent.click(side.getByRole("button", { name: "Add a seat" }));
    expect(side.getByLabelText("Seats")).toHaveValue(4);
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$236"); // 4 x $59
    expect(side.getByText("Annual billing would save $480 a year.")).toBeInTheDocument();
    fireEvent.change(side.getByLabelText("Support"), { target: { value: "dedicated" } });
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$1,436");
    fireEvent.click(side.getByRole("button", { name: "Add 50 GB" }));
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("$1,446");
    // Pro raises the seats to its 2-seat minimum only when needed.
    fireEvent.click(side.getByRole("radio", { name: "Pro" }));
    expect(side.getByLabelText("Seats")).toHaveValue(4);
  });

  it("keeps the review summary and the submitted payload in step with the choices", async () => {
    const f = setup({
      "/api/public/signup": () => ({
        status: 201,
        body: { licensee_id: "lic-9", signup_token: "tok-9", checkout_url: "https://checkout.stripe.com/c/pay/cs_test_9" },
      }),
    });
    await fillToPlan();
    fireEvent.click(screen.getByRole("radio", { name: /^Pro/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add a seat" }));
    fireEvent.click(screen.getByRole("radio", { name: /^Monthly/ }));
    fireEvent.click(screen.getByRole("radio", { name: /^Priority/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add 50 GB" }));
    next();
    await screen.findByRole("heading", { name: "Branding" });
    next();
    await screen.findByRole("heading", { name: "Review" });
    expect(screen.getByTestId("review-plan")).toHaveTextContent("Pro, billed monthly");
    expect(screen.getByTestId("review-seats")).toHaveTextContent("4 seats × $229 = $916 a month");
    expect(screen.getByTestId("review-support")).toHaveTextContent("Priority, $199 a month");
    expect(screen.getByTestId("review-storage")).toHaveTextContent("50 GB, $10 a month");
    expect(screen.getByTestId("review-monthly")).toHaveTextContent("$1,125");
    expect(screen.getByTestId("review-first-payment")).toHaveTextContent("$3,125 (includes $2,000 onboarding)");
    // A change made from the sidebar on the review step shows in the summary at once.
    fireEvent.click(within(screen.getByTestId("summary-controls")).getByRole("button", { name: "Remove 50 GB" }));
    expect(screen.getByTestId("review-storage")).toHaveTextContent("None");
    fireEvent.click(within(screen.getByTestId("summary-controls")).getByRole("button", { name: "Add 50 GB" }));
    fireEvent.click(screen.getByLabelText(/terms of service/));
    fireEvent.click(screen.getByLabelText(/privacy policy/));
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    await waitFor(() => expect(goTo).toHaveBeenCalled());
    const body = JSON.parse(String(callsTo(f, "/api/public/signup")[0][1]?.body));
    expect(body).toMatchObject({ plan: "pro", seats: 4, billing_interval: "monthly", support_level: "priority", extra_storage_blocks: 1 });
    // Exactly the fields KS-Ops' sign-up schema takes; nothing it would drop or reject.
    expect(Object.keys(body).sort()).toEqual(
      [
        "accept_privacy", "accept_terms", "billing_interval", "company_code", "company_name", "contact_email", "contact_name",
        "contact_phone", "country", "extra_storage_blocks", "legal_name", "mailing_address", "plan", "province_state",
        "seats", "support_level", "website_url", "primary_color",
      ].sort(),
    );
  });

  it("does not offer the hidden bank connect add-on", async () => {
    setup();
    await fillToPlan();
    expect(screen.queryByText(/bank connect/i)).not.toBeInTheDocument();
  });
});
