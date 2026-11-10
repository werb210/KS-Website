// KS_WEBSITE_OVERHAUL (Todd's Oct 27 review): a simpler nav, the "why switch" story with real prices, the compliance and
// automation copy, real screenshots only, the FAQ broker questions and the public roadmap.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Layout } from "../components/Layout";
import { resetCatalogCache } from "../hooks/useCatalog";
import { callsTo, mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import Faq from "./Faq";
import Features from "./Features";
import Home from "./Home";
import MobileApps from "./MobileApps";
import Roadmap, { IDEA_CONSENT } from "./Roadmap";
import Security from "./Security";
import WhyKeystone from "./WhyKeystone";

beforeEach(() => {
  resetCatalogCache();
  try {
    window.localStorage.clear();
  } catch {
    /* not available */
  }
});

describe("navigation", () => {
  it("has four links and two actions in the bar, and every other page in the menu", () => {
    mockFetch({});
    renderAt(<Layout>x</Layout>);
    const main = screen.getByRole("navigation", { name: "Main" });
    const lists = within(main).getAllByRole("list");
    expect(within(lists[0]).getAllByRole("link").map((a) => a.textContent)).toEqual(["Why Keystone", "Features", "Pricing", "Security"]);
    expect(within(lists[1]).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/try", "/compare", "/fraud-protection", "/mobile-apps", "/roadmap", "/faq", "/contact"]);
    expect(screen.getByRole("link", { name: "Try it" })).toHaveAttribute("href", "/try");
    expect(screen.getAllByRole("link", { name: "Sign up" })[0]).toHaveAttribute("href", "/signup");
    const menu = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("the footer links every page", () => {
    mockFetch({});
    renderAt(<Layout>x</Layout>);
    const footer = screen.getByRole("contentinfo");
    for (const href of ["/why-keystone", "/compare", "/pricing", "/security", "/roadmap", "/faq", "/help", "/contact", "/beta", "/terms", "/privacy"]) {
      expect(within(footer).getAllByRole("link").some((a) => a.getAttribute("href") === href), href).toBe(true);
    }
  });
});

describe("why switch", () => {
  it("prices Keystone Growth + the Marketing add-on from the catalogue next to each CRM's stack, in its own currency", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 500 }) });
    renderAt(<WhyKeystone />, "/why-keystone");
    expect(screen.getByRole("heading", { level: 1, name: "One system, instead of a CRM and five add-ons" })).toBeInTheDocument();
    // Fallback catalogue: Growth $119 x 5 + $49 add-on.
    expect(screen.getByTestId("stack-total-keystone")).toHaveTextContent("CAD $644 a month");
    expect(screen.getByTestId("stack-hubspot")).toHaveTextContent("CAD $1,819 a month");
    expect(screen.getByTestId("stack-hubspot")).toHaveTextContent("CAD $5,650 one-time");
    expect(screen.getByTestId("stack-salesforce")).toHaveTextContent("From USD $1,775 a month");
    expect(screen.getByTestId("stack-zoho")).toHaveTextContent("From CAD $182 + USD $49 a month");
    expect(screen.getByRole("link", { name: "Every line, feature and source" })).toHaveAttribute("href", "/compare");
    expect(document.body.textContent).toMatch(/never converted/);
  });

  it("the home page tells the story and links to it", () => {
    mockFetch({});
    renderAt(<Home />);
    expect(screen.getByRole("heading", { name: "Why switch: one system instead of a stack" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Why brokers switch" })[0]).toHaveAttribute("href", "/why-keystone");
    expect(screen.getByRole("heading", { name: "Compliance built in, not bolted on" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Automations" })).toBeInTheDocument();
  });
});

describe("compliance, automations and accuracy", () => {
  it("Security lists the texting, calling and privacy rules the system enforces", () => {
    renderAt(<Security />);
    for (const h of ["Texting consent (CASL)", "STOP means stop", "Quiet hours in your time zone", "Registered US texting", "Call-recording notice", "Privacy requests (PIPEDA and Law 25)", "Quebec consent", "Required two-step sign-in", "Teams and record visibility"]) {
      expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
    }
    expect(document.body.textContent).toMatch(/A2P 10DLC/);
  });

  it("Features has an automations area and no longer promises lender API submission", () => {
    renderAt(<Features />);
    expect(screen.getByRole("heading", { name: "Automations and tasks" })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/When a deal changes stage, a document is rejected/);
    expect(document.body.textContent).not.toMatch(/by email or API/);
    expect(document.body.textContent).toMatch(/Microsoft or Google work account/);
  });

  it("Mobile apps shows real iPad screens and no drawn phone or watch", () => {
    const { container } = renderAt(<MobileApps />);
    expect(screen.getByRole("list", { name: "iPad screenshots" })).toBeInTheDocument();
    expect(screen.getAllByRole("img").some((i) => /iPad: the sales pipeline/.test(i.getAttribute("alt") ?? ""))).toBe(true);
    expect(container.querySelector(".device")).toBeNull();
    expect(screen.getByRole("heading", { name: "iPhone dialler" })).toBeInTheDocument();
  });

  it("FAQ answers the questions brokers ask before switching", () => {
    mockFetch({});
    renderAt(<Faq />);
    for (const q of ["How do we move our data over?", "Who owns our data?", "Is there a contract? Can we cancel?", "How long does set-up take?", "Is there training?", "What support is included?", "How do deals get to lenders? Is there a lender API?", "Can we keep our phone numbers?", "What happens if we go over an allowance?", "Can we try it before we buy?", "Does it handle CASL, quiet hours and US texting rules?"]) {
      expect(screen.getByText(q)).toBeInTheDocument();
    }
  });
});

describe("roadmap", () => {
  const ITEMS = [
    { id: "a1", title: "Hold queue for callers", summary: "Wait for the next free person.", area: "Phones", status: "planned", votes: 3, shipped_at: null },
    { id: "a2", title: "Lender API submission", summary: "", area: "Lenders", status: "requested", votes: 7, shipped_at: null },
    { id: "a3", title: "Help articles", summary: "", area: "", status: "shipped", votes: 0, shipped_at: "2026-10-27T00:00:00Z" },
  ];

  it("groups items by status, and a +1 is sent with only a random browser id", async () => {
    const f = mockFetch({
      "/api/public/roadmap/items/a2/vote": () => ({ body: { votes: 8, voted: true } }),
      "/api/public/roadmap": () => ({ body: { items: ITEMS } }),
    });
    renderAt(<Roadmap />, "/roadmap");
    await screen.findByText("Lender API submission");
    expect(within(screen.getByRole("region", { name: /Planned/ })).getByText("Hold queue for callers")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: /Shipped/ })).queryByRole("button")).toBeNull();
    const vote = screen.getByRole("button", { name: /\+1 Lender API submission \(7 votes\)/ });
    fireEvent.click(vote);
    await screen.findByRole("button", { name: /Remove your \+1 for Lender API submission \(8 votes\)/ });
    const body = JSON.parse(String(callsTo(f, "/items/a2/vote")[0][1]?.body));
    expect(Object.keys(body)).toEqual(["voter_id"]);
    expect(body.voter_id).toMatch(/^v-[0-9a-f]{32}$/);
  });

  it("needs consent before an idea is sent, then sends it with the honeypot", async () => {
    const f = mockFetch({
      "/api/public/roadmap/ideas": () => ({ status: 201, body: { ok: true, message: "Thanks - we read every idea." } }),
      "/api/public/roadmap": () => ({ body: { items: [] } }),
    });
    renderAt(<Roadmap />, "/roadmap");
    const form = screen.getByRole("form", { name: "Suggest a feature" });
    fireEvent.change(within(form).getByLabelText("Your idea"), { target: { value: "Hold music" } });
    fireEvent.change(within(form).getByLabelText("Your name"), { target: { value: "Dana" } });
    fireEvent.change(within(form).getByLabelText("Work email"), { target: { value: "dana@brokerco.example" } });
    fireEvent.click(within(form).getByRole("button", { name: "Send my idea" }));
    expect(await screen.findByText(/Tick the box so we can store your idea/)).toBeInTheDocument();
    expect(callsTo(f, "/roadmap/ideas")).toHaveLength(0);
    fireEvent.click(within(form).getByLabelText(IDEA_CONSENT));
    fireEvent.click(within(form).getByRole("button", { name: "Send my idea" }));
    await screen.findByTestId("idea-sent");
    const sent = JSON.parse(String(callsTo(f, "/roadmap/ideas")[0][1]?.body));
    expect(sent).toMatchObject({ title: "Hold music", name: "Dana", email: "dana@brokerco.example", consent: true, website_url: "" });
  });

  it("says so when the roadmap can't load, and still offers the form", async () => {
    mockFetch({ "/api/public/roadmap": () => ({ status: 500 }) });
    renderAt(<Roadmap />, "/roadmap");
    await waitFor(() => expect(screen.getByText(/can't be loaded right now/)).toBeInTheDocument());
    expect(screen.getByRole("form", { name: "Suggest a feature" })).toBeInTheDocument();
  });
});
