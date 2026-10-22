import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAt } from "../test/render";
import FraudProtection, { CHECKS, includedIn } from "./FraudProtection";
import { Privacy } from "./Legal";
import { sitemap } from "../../build/site-files";

describe("Fraud protection page", () => {
  it("describes all 15 checks (there is no check 3)", () => {
    renderAt(<FraudProtection />, "/fraud-protection");
    expect(screen.getByRole("heading", { level: 1, name: "Fraud protection" })).toBeInTheDocument();
    for (let n = 1; n <= 16; n++) if (n !== 3) expect(screen.getByTestId(`fraud-check-${n}`)).toBeInTheDocument();
    expect(screen.queryByTestId("fraud-check-3")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Flinks|bank connect/i);
    expect(screen.getByText(/never an automatic decline/)).toBeInTheDocument();
  });

  it("shows what each plan includes: starter 1, 2, 4, 5; growth adds 6, 7, 8; pro all", () => {
    const on = (plan: "Starter" | "Growth" | "Pro") => CHECKS.filter((c) => includedIn(c, plan)).map((c) => c.n).sort((a, b) => a - b);
    expect(on("Starter")).toEqual([1, 2, 4, 5]);
    expect(on("Growth")).toEqual([1, 2, 4, 5, 6, 7, 8]);
    expect(on("Pro")).toEqual(Array.from({ length: 16 }, (_, i) => i + 1).filter((n) => n !== 3));
    renderAt(<FraudProtection />, "/fraud-protection");
    const table = screen.getByTestId("fraud-plan-table");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(15);
    const ticks = (col: number) => rows.filter((r) => within(r).getAllByRole("cell")[col]!.textContent === "✓").length;
    expect([ticks(0), ticks(1), ticks(2)]).toEqual([4, 7, 15]);
  });

  it("is honest about checks that need a service", () => {
    renderAt(<FraudProtection />, "/fraud-protection");
    expect(within(screen.getByTestId("fraud-check-15")).getByText(/it never guesses/)).toBeInTheDocument();
  });

  it("the privacy policy says what fraud protection collects, and the page is in the sitemap", () => {
    renderAt(<Privacy />, "/privacy");
    expect(screen.getByRole("heading", { name: /Fraud-protection data/ })).toBeInTheDocument();
    expect(screen.getByText(/Keystrokes\s+and the contents of fields are never recorded/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Flinks/);
    expect(sitemap("https://www.example.com")).toContain("<loc>https://www.example.com/fraud-protection</loc>");
  });
});
