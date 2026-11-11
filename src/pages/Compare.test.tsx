import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Compare from "./Compare";
import { renderAt } from "../test/render";
import { CHECKED_LABEL, COMPETITORS, ROWS } from "../data/compare";

beforeEach(() => {
  // The page reads plans from KS-Ops; fail the call so the bundled catalogue is used.
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
});

describe("/compare", () => {
  it("renders Keystone, Salesforce and HubSpot by default, priced to match Keystone with marketing", () => {
    renderAt(<Compare />, "/compare");
    const table = screen.getByTestId("compare-table");
    const heads = Array.from(table.querySelectorAll("thead th")).map((h) => h.textContent);
    expect(heads).toEqual(["Feature", "Keystone", "Salesforce Sales Cloud", "HubSpot Sales Hub"]);
    expect(within(table).getByText(/Cost for 5 seats with marketing, to match Keystone/)).toBeInTheDocument();
    // Growth, 5 seats, billed annually (5 x $119) + the $49 Marketing add-on; $695 + $49 billed monthly; $750 onboarding.
    const ours = screen.getByTestId("compare-price-keystone");
    expect(within(ours).getByText("CAD $644")).toBeInTheDocument();
    expect(ours).toHaveTextContent("CAD $744 a month if billed monthly");
    expect(ours).toHaveTextContent("2,500 call minutes and 2,500 texts a month");
    expect(screen.getByTestId("compare-first-year-keystone")).toHaveTextContent("First year: CAD $8,478 (12 months + CAD $750 one-time)");
    // HubSpot: Sales Hub Pro 585 + Marketing Hub Pro 1,034 + two SMS add-ons 200; onboarding 1,950 + 3,700.
    const hubspot = screen.getByTestId("compare-price-hubspot");
    expect(hubspot).toHaveTextContent("CAD $1,819 a month");
    expect(hubspot).toHaveTextContent("Marketing Hub Professional (2,000 marketing contacts): CAD $1,034 a month + CAD $3,700 one-time");
    expect(screen.getByTestId("compare-first-year-hubspot")).toHaveTextContent("First year: CAD $27,478 (12 months + CAD $5,650 one-time)");
    expect(screen.getByTestId("compare-price-salesforce")).toHaveTextContent("From USD $1,775 a month");
    expect(screen.getByTestId("compare-price-salesforce")).toHaveTextContent("price not published");
    expect(screen.getByText(new RegExp(`as of ${CHECKED_LABEL}; check their sites for current details`))).toBeInTheDocument();
  });

  it("swaps a column from the dropdown", async () => {
    const user = userEvent.setup();
    renderAt(<Compare />, "/compare");
    await user.selectOptions(screen.getByLabelText("And with"), "pipedrive");
    expect(screen.getByTestId("compare-head-3")).toHaveTextContent("Pipedrive");
    expect(screen.getByTestId("compare-price-pipedrive")).toHaveTextContent("From CAD $408.33 a month");
    await user.selectOptions(screen.getByLabelText("Compare with"), "centrex");
    expect(screen.getByTestId("compare-head-2")).toHaveTextContent("Centrex");
    expect(screen.getByTestId("compare-price-centrex")).toHaveTextContent("Price on request");
    expect(screen.queryByTestId("compare-first-year-centrex")).toBeNull();
    await user.selectOptions(screen.getByLabelText("Compare with"), "zoho");
    expect(screen.getByTestId("compare-price-zoho")).toHaveTextContent("From CAD $182 + USD $49 a month");
  });

  it("picking the product already in the other column swaps the two", async () => {
    const user = userEvent.setup();
    renderAt(<Compare />, "/compare");
    await user.selectOptions(screen.getByLabelText("Compare with"), "hubspot");
    expect(screen.getByTestId("compare-head-2")).toHaveTextContent("HubSpot");
    expect(screen.getByTestId("compare-head-3")).toHaveTextContent("Salesforce Sales Cloud");
  });

  it("never shows a cross in the Keystone column, for any pair", async () => {
    const user = userEvent.setup();
    renderAt(<Compare />, "/compare");
    for (const c of COMPETITORS) {
      await user.selectOptions(screen.getByLabelText("Compare with"), c.id);
      for (const r of ROWS) {
        const row = document.querySelector(`tr[data-row="${r.id}"]`)!;
        const ours = row.querySelectorAll("td")[0];
        expect(ours.getAttribute("data-mark"), `${c.id}/${r.id}`).not.toBe("no");
        expect(ours.textContent).not.toContain("✗");
      }
    }
  });

  it("lists a numbered source for every competitor cell on screen", () => {
    renderAt(<Compare />, "/compare");
    const refs = document.querySelectorAll<HTMLAnchorElement>(".compare-ref a");
    expect(refs.length).toBeGreaterThan(ROWS.length * 2);
    for (const a of refs) {
      const target = document.getElementById(a.getAttribute("href")!.slice(1));
      expect(target, a.getAttribute("href")!).not.toBeNull();
      expect(target!.querySelector("a")!.getAttribute("href")).toMatch(/^https:\/\//);
    }
  });
});

// KS_WEBSITE_ALTERNATIVES_v1
describe("/alternatives/<product>", () => {
  const at = async (path: string) => {
    const { Alternative } = await import("./Compare");
    const { Route, Routes } = await import("react-router-dom");
    return renderAt(
      <Routes>
        <Route path="/alternatives/:product" element={<Alternative />} />
        <Route path="/compare" element={<p>full comparison</p>} />
      </Routes>,
      path,
    );
  };

  it("opens the comparison on that product, priced like for like, with its own title", async () => {
    await at("/alternatives/hubspot");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("An alternative to HubSpot Sales Hub, built for finance brokers");
    expect(screen.getByTestId("alternative-intro")).toHaveTextContent("starts at CAD $49 a seat");
    const heads = Array.from(screen.getByTestId("compare-table").querySelectorAll("thead th")).map((h) => h.textContent);
    expect(heads).toEqual(["Feature", "Keystone", "HubSpot Sales Hub", "Salesforce Sales Cloud"]);
    expect(screen.getByTestId("compare-price-hubspot")).toHaveTextContent("CAD $1,819 a month");
    expect(document.title).toContain("an alternative to HubSpot Sales Hub");
  });

  it("sends an unknown product to the full comparison", async () => {
    await at("/alternatives/not-a-product");
    expect(screen.getByText("full comparison")).toBeInTheDocument();
  });

  it("has a sitemap entry and a link for every product compared", async () => {
    const { ROUTES } = await import("../../build/site-files");
    renderAt(<Compare />, "/compare");
    const links = Array.from(screen.getByTestId("alternative-links").querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(links).toEqual(COMPETITORS.map((c) => `/alternatives/${c.id}`));
    for (const l of links) expect(ROUTES).toContain(l);
  });
});
