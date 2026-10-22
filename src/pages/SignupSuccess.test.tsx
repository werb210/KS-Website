import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import SignupCancelled from "./SignupCancelled";
import SignupSuccess, { POLL_INTERVAL_MS } from "./SignupSuccess";

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
