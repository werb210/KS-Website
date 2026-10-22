import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import { Turnstile } from "../components/Turnstile";
import Signup from "./Signup";

vi.mock("../config", async (orig) => ({ ...(await orig<typeof import("../config")>()), TURNSTILE_SITE_KEY: "site-key" }));
vi.mock("../lib/navigate", () => ({ goTo: vi.fn() }));

type Opts = { callback: (t: string) => void };

/** A stand-in for Cloudflare's script: each render/reset hands out the next token through the callback. */
function fakeTurnstile() {
  let n = 0;
  const widgets = new Map<string, Opts>();
  const api = {
    render: vi.fn((_el: HTMLElement, opts: Record<string, unknown>) => {
      const id = `w${widgets.size + 1}`;
      widgets.set(id, opts as unknown as Opts);
      queueMicrotask(() => (opts as unknown as Opts).callback(`token-${++n}`));
      return id;
    }),
    reset: vi.fn((id: string) => {
      const o = widgets.get(id);
      queueMicrotask(() => o?.callback(`token-${++n}`));
    }),
    remove: vi.fn(),
  };
  window.turnstile = api;
  return api;
}

beforeEach(() => {
  fakeTurnstile();
});
afterEach(() => {
  delete window.turnstile;
  cleanup();
});

describe("Turnstile widget", () => {
  it("clears the token and resets the widget when resetKey changes", async () => {
    const onToken = vi.fn();
    const { rerender } = render(<Turnstile onToken={onToken} resetKey={0} />);
    await waitFor(() => expect(onToken).toHaveBeenLastCalledWith("token-1"));
    rerender(<Turnstile onToken={onToken} resetKey={1} />);
    expect(onToken).toHaveBeenCalledWith("");
    expect(window.turnstile!.reset).toHaveBeenCalledWith("w1");
    await waitFor(() => expect(onToken).toHaveBeenLastCalledWith("token-2"));
  });
});

const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));

async function fillToReview() {
  type("Company name", "Prairie Capital");
  type("Legal name", "Prairie Capital Inc.");
  type("Province or territory", "AB");
  type("Mailing address", "100 Main St, Calgary AB");
  next();
  await screen.findByText("prairie-capital is available.");
  next();
  await screen.findByRole("heading", { name: "Contact" });
  type("Your name", "Pat Lee");
  type("Email", "pat@prairie.example");
  type("Mobile phone", "403 555 0100");
  next();
  await screen.findByRole("heading", { name: "Plan" });
  next();
  await screen.findByRole("heading", { name: "Branding" });
  next();
  await screen.findByRole("heading", { name: "Review" });
  fireEvent.click(screen.getByLabelText(/terms of service/));
  fireEvent.click(screen.getByLabelText(/privacy policy/));
}

describe("Sign-up with Turnstile", () => {
  it("gets a fresh token after a failed submit, so the retry doesn't reuse a spent one", async () => {
    let attempt = 0;
    const f = mockFetch({
      "/api/public/plans": () => ({ status: 500 }),
      "company-code-available": () => ({ body: { available: true } }),
      "/api/public/signup": () =>
        ++attempt === 1
          ? { status: 400, body: { errors: { turnstile_token: "Please confirm you are not a robot and try again." } } }
          : { status: 201, body: { licensee_id: "lic-1", signup_token: "tok-1", checkout_url: null } },
    });
    renderAt(<Signup />, "/signup");
    await fillToReview();
    await waitFor(() => expect(window.turnstile!.render).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    expect(await screen.findByText("Please confirm you are not a robot and try again.")).toBeInTheDocument();
    expect(window.turnstile!.reset).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue to payment" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    await screen.findByRole("heading", { name: /Thanks — we'll contact you/ });
    const tokens = callsTo(f, "/api/public/signup").map(([, init]) => JSON.parse(String(init?.body)).turnstile_token);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toBeTruthy();
    expect(tokens[1]).toBeTruthy();
    expect(tokens[1]).not.toBe(tokens[0]);
  });
});
