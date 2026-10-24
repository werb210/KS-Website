// Todd's Oct 24 walkthrough: wording, PGI, the demo -> sign-up hand-off, address, logo, colours, single price summary.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import Contact from "./Contact";
import Faq from "./Faq";
import Features from "./Features";
import Home from "./Home";
import MobileApps from "./MobileApps";
import Security from "./Security";
import Signup from "./Signup";
import TryDemo from "./TryDemo";

vi.mock("../lib/navigate", () => ({ goTo: vi.fn() }));

const DEMO_ID = "66666666-6666-4666-8666-666666666666";
const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));

describe("Home", () => {
  it("no longer says it isn't a prototype", () => {
    renderAt(<Home />);
    expect(document.body.textContent).not.toMatch(/prototype/i);
    expect(document.body.textContent).not.toMatch(/working Canadian brokerage runs on/i);
  });

  it("offers PGI with the approved copy and an accessible 'What is PGI?' tip without a percentage", async () => {
    renderAt(<Home />);
    expect(screen.getByText(/Offer PGI to your clients to close more deals and earn extra commission\. All you need to do is\.\.\. nothing\. One checkbox, and Keystone pays you\./)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: "What is PGI?" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(btn);
    const dialog = await screen.findByRole("dialog", { name: "What is PGI?" });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(dialog).toHaveTextContent("protects the business owner's personal assets");
    expect(dialog).toHaveTextContent("ticks one box");
    expect(dialog).toHaveTextContent("referral commission");
    expect(dialog.textContent).not.toMatch(/%|percent/);
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(btn).toHaveFocus();
  });

  it("says clients can use the app or a website, their choice", () => {
    renderAt(<Home />);
    expect(document.body.textContent).toMatch(/As an app on iPhone or Android, or as a website in any browser: their choice\./);
  });
});

describe("client app wording", () => {
  it("Mobile apps, Features and FAQ offer the app or a website in any browser", () => {
    renderAt(<MobileApps />);
    expect(screen.getByRole("heading", { name: "Client app for iPhone and Android, or any browser" })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/as a website in any browser/);
  });
  it("Features lists PGI with its tip", () => {
    renderAt(<Features />);
    expect(screen.getByText("Personal Guarantee Insurance (PGI)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "What is PGI?" })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/as an app on iPhone or Android, or as a website in any browser: their choice/);
  });
  it("FAQ", () => {
    renderAt(<Faq />);
    expect(document.body.textContent).toMatch(/or use the same client portal as a website in any browser/);
  });
});

describe("Security page", () => {
  it("lists the compliance features the system has", () => {
    renderAt(<Security />);
    for (const h of ["Documents stay on file", "SIN and SSN removed after signing", "Audit log", "Consent records", "Export your data any time", "Cancelling: 6 months, then deleted", "Roles", "Fraud checks"]) {
      expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
    }
    expect(document.body.textContent).toMatch(/kept for 180 days/);
  });
});

describe("Try it yourself", () => {
  it("keeps the mobile field without promising a text, and says the demo takes about ten minutes", () => {
    mockFetch({});
    renderAt(<TryDemo />);
    expect(screen.getByLabelText("Mobile phone")).toBeInTheDocument();
    expect(screen.getByText(/So we can reach you\./)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/we text/i);
    expect(document.body.textContent).not.toMatch(/text and email/i);
    expect(document.body.textContent).toMatch(/It takes about ten minutes: you'll see a real deal from both sides/);
  });

  it("remembers what was typed so Sign up and Contact can be filled in later", async () => {
    mockFetch({ "/api/public/demo/signup": () => ({ status: 201, body: { ok: true, message: "Check your email." } }) });
    renderAt(<TryDemo />);
    type("Your name", "Dana Prospect");
    type("Work email", "dana@brokerco.example");
    type("Mobile phone", "4035550199");
    type("Brokerage", "BrokerCo");
    fireEvent.click(screen.getByRole("button", { name: "Start my demo" }));
    await screen.findByTestId("demo-sent");
    expect(JSON.parse(localStorage.getItem("ks-demo-contact")!)).toEqual({
      name: "Dana Prospect", email: "dana@brokerco.example", company: "BrokerCo", phone: "(403) 555-0199",
    });
  });
});

describe("demo details pre-fill Sign up and Contact", () => {
  it("Sign up: from the demo link's #fragment (KS-Ops resolves it), all fields still editable, and the hash is dropped", async () => {
    window.history.replaceState(null, "", `/signup#demo=${DEMO_ID}&k=key_ABCDEFGH12345678`);
    const f = mockFetch({
      "/api/public/plans": () => ({ status: 500 }),
      "company-code-available": () => ({ body: { available: true } }),
      "/api/public/demo/prefill": () => ({ body: { name: "Dana Prospect", email: "dana@brokerco.example", company: "BrokerCo Capital", phone: "(403) 555-0199" } }),
    });
    renderAt(<Signup />, "/signup");
    await waitFor(() => expect(screen.getByLabelText("Company name")).toHaveValue("BrokerCo Capital"));
    const [, init] = callsTo(f, "/api/public/demo/prefill")[0];
    expect(JSON.parse(String(init?.body))).toEqual({ demo_id: DEMO_ID, key: "key_ABCDEFGH12345678" });
    expect(callsTo(f, "/api/public/demo/prefill")[0][0]).not.toContain("dana");
    expect(window.location.hash).toBe("");
    type("Company name", "BrokerCo Capital Inc");
    expect(screen.getByLabelText("Company name")).toHaveValue("BrokerCo Capital Inc");
    type("Legal name", "BrokerCo Capital Inc.");
    type("Street address", "1 Main St");
    type("City", "Calgary");
    type("Province or territory", "AB");
    type("Postal code", "T2P 1A1");
    next();
    await screen.findByRole("heading", { name: "Company code" });
    await screen.findByText(/is available\./);
    next();
    await screen.findByRole("heading", { name: "Contact" });
    expect(screen.getByLabelText("Your name")).toHaveValue("Dana Prospect");
    expect(screen.getByLabelText("Email")).toHaveValue("dana@brokerco.example");
    expect(screen.getByLabelText("Mobile phone")).toHaveValue("(403) 555-0199");
  });

  it("Sign up: falls back to what was typed on this website's demo form", async () => {
    window.history.replaceState(null, "", "/signup");
    localStorage.setItem("ks-demo-contact", JSON.stringify({ name: "Lee Local", email: "lee@local.example", company: "Local Co", phone: "(403) 555-0100" }));
    mockFetch({ "/api/public/plans": () => ({ status: 500 }), "company-code-available": () => ({ body: { available: true } }) });
    renderAt(<Signup />, "/signup");
    await waitFor(() => expect(screen.getByLabelText("Company name")).toHaveValue("Local Co"));
  });

  it("Contact: fills name, email and brokerage", async () => {
    window.history.replaceState(null, "", "/contact");
    localStorage.setItem("ks-demo-contact", JSON.stringify({ name: "Lee Local", email: "lee@local.example", company: "Local Co", phone: "" }));
    renderAt(<Contact />, "/contact");
    await waitFor(() => expect(screen.getByLabelText("Your name")).toHaveValue("Lee Local"));
    expect(screen.getByLabelText("Email")).toHaveValue("lee@local.example");
    expect(screen.getByLabelText("Brokerage (optional)")).toHaveValue("Local Co");
  });
});

describe("Sign up: address, single price summary, logo and colours", () => {
  async function toPlan() {
    window.history.replaceState(null, "", "/signup");
    const f = mockFetch({
      "/api/public/plans": () => ({ status: 500 }),
      "company-code-available": () => ({ body: { available: true } }),
      "/api/public/signup": () => ({ status: 201, body: { licensee_id: "lic-1", signup_token: "tok-1", checkout_url: null } }),
    });
    renderAt(<Signup />, "/signup");
    type("Company name", "Prairie Capital");
    type("Legal name", "Prairie Capital Inc.");
    type("Street address", "100 Main St");
    type("Unit or suite (optional)", "Suite 4");
    type("City", "Calgary");
    type("Province or territory", "AB");
    type("Postal code", "12345");
    next();
    expect(await screen.findByText("Enter a postal code like T2P 1P6.")).toBeInTheDocument();
    type("Postal code", "t2p1a1");
    next();
    await screen.findByText("prairie-capital is available.");
    next();
    type("Your name", "Pat Lee");
    type("Email", "pat@prairie.example");
    type("Mobile phone", "403 555 0100");
    next();
    await screen.findByRole("heading", { name: "Plan" });
    return f;
  }

  it("asks for a ZIP code in the United States", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 500 }) });
    renderAt(<Signup />, "/signup");
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "US" } });
    expect(screen.getByLabelText("ZIP code")).toBeInTheDocument();
    expect(screen.getByLabelText("State")).toBeInTheDocument();
  });

  it("shows prices once: the plan step has no totals of its own, the summary has them", async () => {
    await toPlan();
    const form = screen.getByRole("form", { name: "Sign-up" });
    expect(form.textContent).not.toMatch(/a month for your team/);
    expect(form.textContent).not.toMatch(/× \$\d+ = \$/);
    expect(screen.getByTestId("monthly-total")).toBeInTheDocument();
  });

  it("uploads a logo with a preview, checks every colour, and sends them with the address parts", async () => {
    const f = await toPlan();
    next();
    await screen.findByRole("heading", { name: "Branding" });
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])], "logo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Logo (optional)"), { target: { files: [png] } });
    expect(await screen.findByRole("img", { name: "Your logo (logo.png)" })).toBeInTheDocument();
    const big = new File([new Uint8Array(600 * 1024)], "big.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Logo (optional)"), { target: { files: [big] } });
    expect(await screen.findByText(/Use a logo under 500 KB/)).toBeInTheDocument();

    type("Accent colour", "#99ccff");
    expect(screen.getByText(/Contrast with white text: .* Too light for white text\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Use #[0-9a-f]{6} instead$/ }));
    expect(screen.getAllByText(/Easy to read\./).length).toBeGreaterThanOrEqual(2);
    type("Background colour (optional)", "#333333");
    expect(screen.getByText(/Contrast with dark text: .* Too dark for dark text\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Use #[0-9a-f]{6} instead$/ }));
    expect(screen.queryByText(/Too dark/)).not.toBeInTheDocument();

    next();
    await screen.findByRole("heading", { name: "Review" });
    expect(screen.getByTestId("review-address")).toHaveTextContent("100 Main St, Suite 4, Calgary AB T2P 1A1, Canada");
    expect(screen.getByTestId("review-branding")).toHaveTextContent("logo logo.png");
    fireEvent.click(screen.getByLabelText(/terms of service/));
    fireEvent.click(screen.getByLabelText(/privacy policy/));
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    await screen.findByRole("heading", { name: /we'll contact you/ });
    const body = JSON.parse(String(callsTo(f, "/api/public/signup")[0][1]?.body));
    expect(body).toMatchObject({
      address_line1: "100 Main St", address_line2: "Suite 4", city: "Calgary", postal_code: "T2P 1A1", province_state: "AB",
      mailing_address: "100 Main St, Suite 4, Calgary AB T2P 1A1, Canada",
      logo_file: { content_type: "image/png", filename: "logo.png" },
    });
    expect(body.logo_file.data_base64.length).toBeGreaterThan(4);
    expect(body.accent_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(body.background_color).toMatch(/^#[0-9a-f]{6}$/);
    // The thank-you page says it once (no repeated "we'll email you a payment link").
    expect(screen.getAllByText(/payment link/).length).toBe(1);
  });
});
