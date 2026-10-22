import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
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

async function fillToReview(opts: { plan?: "Starter" | "Growth" | "Pro"; seats?: string } = {}) {
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
});
