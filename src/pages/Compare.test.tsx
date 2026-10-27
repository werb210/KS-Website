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
