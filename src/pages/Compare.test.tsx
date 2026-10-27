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
  it("renders Keystone, Salesforce and HubSpot by default, with a 5-seat price row", () => {
    renderAt(<Compare />, "/compare");
    const table = screen.getByTestId("compare-table");
    const heads = Array.from(table.querySelectorAll("thead th")).map((h) => h.textContent);
    expect(heads).toEqual(["Feature", "Keystone", "Salesforce Sales Cloud", "HubSpot Sales Hub"]);
    expect(screen.getByTestId("compare-price-salesforce")).toHaveTextContent("USD $500");
    expect(screen.getByTestId("compare-price-hubspot")).toHaveTextContent("CAD $585");
    // Growth, 5 seats, billed annually: 5 x $119.
    expect(within(table).getByText("CAD $595")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`as of ${CHECKED_LABEL}; check their sites for current details`))).toBeInTheDocument();
  });

  it("swaps a column from the dropdown", async () => {
    const user = userEvent.setup();
    renderAt(<Compare />, "/compare");
    await user.selectOptions(screen.getByLabelText("And with"), "pipedrive");
    expect(screen.getByTestId("compare-head-3")).toHaveTextContent("Pipedrive");
    expect(screen.getByTestId("compare-price-pipedrive")).toHaveTextContent("CAD $395");
    await user.selectOptions(screen.getByLabelText("Compare with"), "centrex");
    expect(screen.getByTestId("compare-head-2")).toHaveTextContent("Centrex");
    expect(screen.getByTestId("compare-price-centrex")).toHaveTextContent("Quote only");
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
