import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FALLBACK_CATALOG } from "../lib/plans";
import { mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import Pricing from "./Pricing";

const live = structuredClone(FALLBACK_CATALOG);
live.plans[0].seat_price_annual = 45;
live.plans[0].name = "Starter Live";

describe("Pricing page", () => {
  it("renders plans from the API", async () => {
    const f = mockFetch({ "/api/public/plans": () => ({ body: live }) });
    renderAt(<Pricing />, "/pricing");
    expect(await screen.findByRole("heading", { name: "Starter Live" })).toBeInTheDocument();
    expect(within(screen.getByTestId("plan-starter")).getByText(/\$45/)).toBeInTheDocument();
    expect(String(f.mock.calls[0][0])).toBe("https://ops.test/api/public/plans");
    expect(screen.queryByText(/standard price list/)).not.toBeInTheDocument();
  });

  it("falls back to the bundled plans when the API fails", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 500, body: {} }) });
    renderAt(<Pricing />, "/pricing");
    expect(await screen.findByText(/standard price list/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Starter" })).toBeInTheDocument();
    expect(within(screen.getByTestId("plan-pro")).getByText("$199")).toBeInTheDocument();
  });

  it("falls back when the API returns an unexpected shape", async () => {
    mockFetch({ "/api/public/plans": () => ({ body: { plans: "nope" } }) });
    renderAt(<Pricing />, "/pricing");
    expect(await screen.findByText(/standard price list/)).toBeInTheDocument();
  });

  it("switches between annual and monthly and recalculates seat totals", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 503 }) });
    renderAt(<Pricing />, "/pricing");
    await screen.findByText(/standard price list/);
    const growth = screen.getByTestId("plan-growth");
    expect(within(growth).getByText("$119")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Billed monthly" }));
    expect(within(growth).getByText("$139")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Seats"), { target: { value: "1" } });
    // Pro bills its 2-seat minimum.
    expect(within(screen.getByTestId("plan-pro")).getByText(/\$458/)).toBeInTheDocument();
    expect(within(screen.getByTestId("plan-pro")).getByText(/starts at 2 seats/)).toBeInTheDocument();
  });

  it("shows the trial, support levels, overage and storage", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 500 }) });
    renderAt(<Pricing />, "/pricing");
    await screen.findByText(/standard price list/);
    expect(screen.getByRole("heading", { name: /Try every Pro feature free for 14 days on Starter/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Dedicated/ })).toHaveTextContent("$1,200");
    expect(screen.getByText(/\$0.04 a minute/)).toBeInTheDocument();
    expect(screen.getByText(/\$10 a month for each 50 GB/)).toBeInTheDocument();
  });
  // KS_WEBSITE_MARKETING_ADDON
  it("shows each plan's marketing limits, the add-on and the signing allowance; the add-on adds $49 to every total", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 503 }) });
    renderAt(<Pricing />, "/pricing");
    await screen.findByText(/standard price list/);
    const table = screen.getByTestId("marketing-section");
    expect(within(table).getByRole("row", { name: /Campaign emails a month/ })).toHaveTextContent(/500.*1,000.*2,500.*10,000 more, then \$10 per 10,000/);
    expect(within(table).getByRole("row", { name: /Send one text to many/ })).toHaveTextContent(/50 per send.*250 per send.*500 per send.*1,000 per send/);
    expect(within(table).getByRole("row", { name: /Visitor history/ })).toHaveTextContent(/30 days.*90 days.*12 months.*Full history/);
    expect(screen.getByText(/Each signing\s+after that is \$2.50/)).toBeInTheDocument();
    const starter = screen.getByTestId("plan-starter");
    expect(within(starter).getByText("4 a month")).toBeInTheDocument();
    const before = within(starter).getByText(/a month for/).textContent ?? "";
    fireEvent.click(screen.getByLabelText(/Add the Marketing add-on/));
    const after = within(starter).getByText(/a month for/).textContent ?? "";
    const amount = (t: string) => Number((/\$([\d,.]+)/.exec(t)?.[1] ?? "0").replace(/,/g, ""));
    expect(amount(after) - amount(before)).toBe(49);
    expect(within(starter).getByText("10,500 a month")).toBeInTheDocument();
    expect(within(starter).getByRole("link", { name: /Choose/ }).getAttribute("href")).toContain("addon=marketing");
  });
});
