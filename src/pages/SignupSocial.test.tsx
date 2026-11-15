// KS_WEBSITE_SOCIAL_SIGNUP - "Continue with Google / Microsoft / Apple" on the sign-up page.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SignupQuick from "./SignupQuick";

const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body }) as Response;
let calls: string[] = [];
function serve(providers: string[], prefill: unknown) {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const u = String(url); calls.push(u);
    if (u.endsWith("/api/public/signup/social")) return json({ providers });
    if (u.endsWith("/api/public/signup/social/prefill")) return prefill ? json(prefill) : json({ error: "expired" }, false);
    return json({}, false);
  }));
}
const show = () => render(<MemoryRouter><SignupQuick /></MemoryRouter>);

beforeEach(() => { window.location.hash = ""; });
afterEach(() => { vi.unstubAllGlobals(); window.location.hash = ""; });

describe("sign up with Google, Microsoft or Apple", () => {
  it("shows a button for each provider the service offers, and none otherwise", async () => {
    serve(["google", "microsoft"], null);
    show();
    const google = await screen.findByRole("link", { name: "Continue with Google" });
    expect(google.getAttribute("href")).toMatch(/\/api\/public\/signup\/social\/google\/start$/);
    expect(screen.getByRole("link", { name: "Continue with Microsoft" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Continue with Apple" })).toBeNull();
  });

  it("fills in the name and email when the person comes back from choosing their account", async () => {
    window.location.hash = "#social=abc.def";
    serve(["google"], { provider: "google", name: "Nora North", email: "nora@northwind.example" });
    show();
    await waitFor(() => expect((screen.getByLabelText(/^Email/) as HTMLInputElement).value).toBe("nora@northwind.example"));
    expect((screen.getByLabelText(/^Your name/) as HTMLInputElement).value).toBe("Nora North");
    expect(screen.getByRole("status").textContent).toMatch(/Signed in as nora@northwind.example/);
    expect(window.location.hash).toBe("");
  });

  it("says so plainly when the sign-in has expired; the form still works", async () => {
    window.location.hash = "#social=old.token";
    serve([], null);
    show();
    expect(await screen.findByText(/That sign-in has expired/)).toBeTruthy();
    expect(screen.queryByTestId("social-signup")).toBeNull();
  });
});
