import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import SignupCancelled from "./SignupCancelled";
import SignupSuccess, { POLL_INTERVAL_MS, SETUP_POLL_MS } from "./SignupSuccess";

vi.mock("../lib/navigate", () => ({ goTo: vi.fn() }));
import { goTo } from "../lib/navigate";

function renderSuccess(path = "/signup/success?l=lic-1&t=tok-1") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/signup/success" element={<SignupSuccess />} />
        <Route path="/signup/cancelled" element={<SignupCancelled />} />
      </Routes>
    </MemoryRouter>,
  );
}

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });

describe("Sign-up success", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("polls every 5 seconds until the payment is confirmed", async () => {
    let n = 0;
    const f = mockFetch({
      "/status": () => ({ body: { status: ++n >= 3 ? "provisioning" : "pending_payment", company_name: "Prairie Capital" } }),
    });
    renderSuccess();
    await flush();
    expect(callsTo(f, "/status")).toHaveLength(1);
    expect(String(f.mock.calls[0][0])).toBe("https://ops.test/api/public/signup/lic-1/status?token=tok-1");
    expect(screen.getByTestId("signup-status")).toHaveTextContent(/Confirming your payment for Prairie Capital/);
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS); });
    expect(callsTo(f, "/status")).toHaveLength(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS); });
    expect(callsTo(f, "/status")).toHaveLength(3);
    expect(screen.getByTestId("signup-status")).toHaveTextContent(/Payment received for Prairie Capital/);
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 4); });
    expect(callsTo(f, "/status")).toHaveLength(3);
    expect(screen.getByText(/within one business day/)).toBeInTheDocument();
  });

  it("stops after 2 minutes and explains we'll email", async () => {
    const f = mockFetch({ "/status": () => ({ body: { status: "pending_payment", company_name: "" } }) });
    renderSuccess();
    await act(async () => { await vi.advanceTimersByTimeAsync(130_000); });
    const count = callsTo(f, "/status").length;
    expect(count).toBeGreaterThanOrEqual(24);
    expect(count).toBeLessThanOrEqual(25);
    expect(screen.getByTestId("signup-status")).toHaveTextContent(/still waiting/);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(callsTo(f, "/status")).toHaveLength(count);
  });

  it("keeps polling through network errors", async () => {
    let n = 0;
    mockFetch({ "/status": () => (++n < 2 ? { status: 500 } : { body: { status: "trial", company_name: "X" } }) });
    renderSuccess();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS); });
    expect(screen.getByTestId("signup-status")).toHaveTextContent(/Payment received/);
  });

  it("explains when the link has no sign-up details", async () => {
    const f = mockFetch({});
    renderSuccess("/signup/success");
    await flush();
    expect(f).not.toHaveBeenCalled();
    expect(screen.getByTestId("signup-status")).toHaveTextContent(/couldn't find your sign-up details/);
  });
});

describe("Sign-up cancelled", () => {
  it("resumes payment with a fresh checkout link", async () => {
    mockFetch({ "/checkout": () => ({ body: { checkout_url: "https://checkout.stripe.com/c/pay/cs_2" } }) });
    renderSuccess("/signup/cancelled?l=lic-1&t=tok-1");
    fireEvent.click(screen.getByRole("button", { name: "Resume payment" }));
    await vi.waitFor(() => expect(goTo).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_2"));
  });

  it("offers email when a payment link can't be made", async () => {
    mockFetch({ "/checkout": () => ({ status: 404 }) });
    renderSuccess("/signup/cancelled?l=lic-1&t=tok-1");
    fireEvent.click(screen.getByRole("button", { name: "Resume payment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/hello@example.com/);
  });

  it("posts to the resume route with the sign-up's id and token", async () => {
    const f = mockFetch({ "/checkout": () => ({ body: { checkout_url: "https://checkout.stripe.com/c/pay/cs_3" } }) });
    renderSuccess("/signup/cancelled?l=lic-9&t=tok-9");
    fireEvent.click(screen.getByRole("button", { name: "Resume payment" }));
    await vi.waitFor(() => expect(goTo).toHaveBeenCalled());
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toContain("/api/public/signup/lic-9/checkout?token=tok-9");
    expect(init?.method).toBe("POST");
  });

  it("offers email instead of following a link that isn't Stripe Checkout", async () => {
    mockFetch({ "/checkout": () => ({ body: { checkout_url: "https://evil.example/pay" } }) });
    renderSuccess("/signup/cancelled?l=lic-1&t=tok-1");
    fireEvent.click(screen.getByRole("button", { name: "Resume payment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/payment link/);
    expect(goTo).not.toHaveBeenCalledWith("https://evil.example/pay");
  });
});

// KS_OPS_AUTO_PROVISION_v1 - "We're setting up your system" with live progress, then the sign-in button.
describe("Sign-up success: setup progress", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const P = "A".repeat(22) + "b".repeat(21);

  it("shows live progress from the opaque token, then the sign-in button and the email note", async () => {
    let n = 0;
    const f = mockFetch({
      "/status": () => ({ body: { status: "provisioning", company_name: "Prairie Capital" } }),
      "/api/public/provisioning/": () =>
        ++n < 3
          ? { body: { state: "setting_up", company_name: "Prairie Capital", steps: [{ label: "Creating your servers and database", status: n === 1 ? "in_progress" : "done" }, { label: "Installing Keystone", status: "pending" }] } }
          : { body: { state: "ready", company_name: "Prairie Capital", portal_url: "https://ks-prairie-portal.azurestaticapps.net", steps: [] } },
    });
    renderSuccess(`/signup/success?l=lic-1&t=tok-1&p=${P}`);
    await flush();
    await flush();
    expect(String(callsTo(f, "/api/public/provisioning/")[0][0])).toBe(`https://ops.test/api/public/provisioning/${P}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("We're setting up your system");
    expect(screen.getByTestId("setup-progress")).toHaveTextContent(/Creating your servers and database: in progress/);
    expect(screen.getByTestId("setup-progress")).toHaveTextContent(/Installing Keystone: waiting/);
    await act(async () => { await vi.advanceTimersByTimeAsync(SETUP_POLL_MS); });
    expect(screen.getByTestId("setup-progress")).toHaveTextContent(/Creating your servers and database: done/);
    await act(async () => { await vi.advanceTimersByTimeAsync(SETUP_POLL_MS); });
    const button = screen.getByRole("link", { name: "Sign in to your staff portal" });
    expect(button).toHaveAttribute("href", "https://ks-prairie-portal.azurestaticapps.net/");
    expect(screen.getByTestId("setup-progress")).toHaveTextContent(/email with your sign-in link and company code is on its way/);
    await act(async () => { await vi.advanceTimersByTimeAsync(SETUP_POLL_MS * 3); });
    expect(callsTo(f, "/api/public/provisioning/")).toHaveLength(3);
  });

  it("says it is taking longer when the team has to step in", async () => {
    mockFetch({
      "/status": () => ({ body: { status: "provisioning", company_name: "X" } }),
      "/api/public/provisioning/": () => ({ body: { state: "needs_attention", company_name: "X", steps: [] } }),
    });
    renderSuccess(`/signup/success?l=lic-1&t=tok-1&p=${P}`);
    await flush();
    await flush();
    expect(screen.getByTestId("setup-progress")).toHaveTextContent(/taking longer than usual/);
  });

  it("never offers a sign-in button that is not https", async () => {
    mockFetch({
      "/status": () => ({ body: { status: "active", company_name: "X" } }),
      "/api/public/provisioning/": () => ({ body: { state: "ready", company_name: "X", portal_url: "javascript:alert(1)" } }),
    });
    renderSuccess(`/signup/success?l=lic-1&t=tok-1&p=${P}`);
    await flush();
    await flush();
    expect(screen.queryByRole("link", { name: /Sign in/ })).toBeNull();
  });

  it("without a token keeps the old message", async () => {
    const f = mockFetch({ "/status": () => ({ body: { status: "provisioning", company_name: "X" } }) });
    renderSuccess("/signup/success?l=lic-1&t=tok-1&p=short");
    await flush();
    expect(callsTo(f, "/api/public/provisioning/")).toHaveLength(0);
    expect(screen.getByTestId("signup-status")).toHaveTextContent(/We're setting up your copy now/);
  });
});
