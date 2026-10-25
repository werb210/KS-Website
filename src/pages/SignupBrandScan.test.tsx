// "Use my website" on the sign-up branding step (KS-Ops POST /api/public/brand-scan) and the font choice.
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch, type Handler } from "../test/fetch";
import { renderAt } from "../test/render";
import { buildCsp } from "../../build/site-files";
import Signup from "./Signup";

vi.mock("../lib/navigate", () => ({ goTo: vi.fn() }));

const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));

const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const SCAN = {
  ok: true,
  url: "https://prairie.example/",
  site_name: "Prairie Capital",
  logo: { source_url: "https://prairie.example/logo.png", content_type: "image/png", data_base64: PNG_B64, filename: "prairie-logo.png" },
  favicon_url: "https://prairie.example/favicon.ico",
  colors: { theme_color: "#7A1F3D", palette: ["#7A1F3D", "#D4A017"], body_background: "#FFFAF0" },
  fonts: { body: "Lato", headings: null, google: ["Lato"], font_faces: [] },
  suggestions: { primary_color: "#7A1F3D", accent_color: "#D4A017", background_color: "#FFFAF0", font: { family: "Lato", source: "google" } },
};

async function toBranding(scan: Handler) {
  window.history.replaceState(null, "", "/signup");
  const f = mockFetch({
    "/api/public/plans": () => ({ status: 500 }),
    "company-code-available": () => ({ body: { available: true } }),
    "/api/public/brand-scan": scan,
    "/api/public/signup": () => ({ status: 201, body: { licensee_id: "lic-1", signup_token: "tok-1", checkout_url: null } }),
  });
  renderAt(<Signup />, "/signup");
  type("Company name", "Prairie Capital");
  type("Legal name", "Prairie Capital Inc.");
  type("Street address", "100 Main St");
  type("City", "Calgary");
  type("Province or territory", "AB");
  type("Postal code", "T2P 1A1");
  type(/Website/, "prairie.example");
  next();
  await screen.findByText("prairie-capital is available.");
  next();
  type("Your name", "Pat Lee");
  type("Email", "pat@prairie.example");
  type("Mobile phone", "403 555 0100");
  next();
  await screen.findByRole("heading", { name: "Plan" });
  next();
  await screen.findByRole("heading", { name: "Branding" });
  return f;
}

describe("Use my website", () => {
  beforeEach(() => window.localStorage.clear());

  it("pre-fills the logo, colours and font, all still editable, and sends them with the sign-up", async () => {
    const f = await toBranding(() => ({ body: SCAN }));
    expect(screen.getByLabelText("Your website address")).toHaveValue("prairie.example");
    fireEvent.click(screen.getByRole("button", { name: "Use my website" }));
    expect(await screen.findByTestId("brand-scan-result")).toHaveTextContent(
      "Filled in from Prairie Capital: logo, main colour, accent colour, background colour, font (Lato).",
    );
    expect(JSON.parse(String(callsTo(f, "/api/public/brand-scan")[0][1]?.body))).toEqual({ url: "prairie.example" });
    expect(screen.getByLabelText("Main brand colour")).toHaveValue("#7a1f3d");
    expect(screen.getByLabelText("Background colour (optional)")).toHaveValue("#fffaf0");
    expect(screen.getByLabelText("Font (optional)")).toHaveValue("Lato");
    expect(screen.getByRole("img", { name: "Your logo (prairie-logo.png)" })).toBeInTheDocument();
    // The accent is too light for white text: the usual contrast check offers a fix.
    expect(screen.getByText(/Contrast with white text: .* Too light for white text\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Use #[0-9a-f]{6} instead$/ }));
    // Still editable.
    fireEvent.change(screen.getByLabelText("Font (optional)"), { target: { value: "Georgia" } });

    next();
    await screen.findByRole("heading", { name: "Review" });
    expect(screen.getByTestId("review-branding")).toHaveTextContent("font Georgia");
    fireEvent.click(screen.getByLabelText(/terms of service/));
    fireEvent.click(screen.getByLabelText(/privacy policy/));
    fireEvent.click(screen.getByRole("button", { name: "Continue to payment" }));
    await waitFor(() => expect(callsTo(f, "/api/public/signup").length).toBe(1));
    const body = JSON.parse(String(callsTo(f, "/api/public/signup")[0][1]?.body));
    expect(body).toMatchObject({
      primary_color: "#7a1f3d",
      background_color: "#fffaf0",
      font_family: "Georgia",
      logo_file: { content_type: "image/png", data_base64: PNG_B64, filename: "prairie-logo.png" },
    });
    expect(body.accent_color).not.toBe("#d4a017");
  });

  it("keeps a logo the person uploaded, offers the website's, and can undo", async () => {
    await toBranding(() => ({ body: SCAN }));
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])], "mine.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Logo (optional)"), { target: { files: [png] } });
    await screen.findByRole("img", { name: "Your logo (mine.png)" });
    fireEvent.click(screen.getByRole("button", { name: "Use my website" }));
    await screen.findByTestId("brand-scan-result");
    expect(screen.getByRole("img", { name: "Your logo (mine.png)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use the logo from my website instead" }));
    expect(screen.getByRole("img", { name: "Your logo (prairie-logo.png)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByLabelText("Main brand colour")).toHaveValue("#1f4e79");
    expect(screen.getByLabelText("Font (optional)")).toHaveValue("");
  });

  it("explains when the website can't be read", async () => {
    await toBranding(() => ({ status: 400, body: { ok: false, error: "blocked", message: "We can only read public websites." } }));
    fireEvent.click(screen.getByRole("button", { name: "Use my website" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We can only read public websites.");
    expect(screen.getByLabelText("Main brand colour")).toHaveValue("#1f4e79");
  });

  it("offers the website's own font when it isn't in the list", async () => {
    await toBranding(() => ({ body: { ...SCAN, suggestions: { ...SCAN.suggestions, font: { family: "Acme Grotesk", source: "self_hosted" } } } }));
    fireEvent.click(screen.getByRole("button", { name: "Use my website" }));
    await screen.findByTestId("brand-scan-result");
    expect(screen.getByLabelText("Font (optional)")).toHaveValue("Acme Grotesk");
    expect(screen.getByRole("option", { name: "Use my website's font (Acme Grotesk)" })).toBeInTheDocument();
    expect(screen.getByText(/Devices that don't have it show a similar standard font/)).toBeInTheDocument();
  });

  it("the page may load Google Fonts for the font preview", () => {
    const csp = buildCsp({ opsUrl: "https://ops.example", turnstile: false });
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
  });
});
