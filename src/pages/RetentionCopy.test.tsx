// KS-Website: the enforced 7-year retention and legal holds (KS-server v14), and the in-app trial on Starter and Growth.
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockFetch } from "../test/fetch";
import { renderAt } from "../test/render";
import { FALLBACK_CATALOG, trialPlanNames, trialPlans } from "../lib/plans";
import Faq from "./Faq";
import Pricing from "./Pricing";
import Security from "./Security";

describe("record retention copy", () => {
  it("the Security page states the 7-year lock, legal holds and that nothing is deleted automatically", () => {
    renderAt(<Security />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/locked for 7 years from the later of the upload and the file closing \(funded, declined or withdrawn\)/);
    expect(text).toMatch(/Nothing under a hold can be deleted or purged until an Admin releases it/);
    expect(text).toMatch(/only deleted when an Admin chooses to/);
    expect(text).toMatch(/Records still inside their 7 years, or under a legal hold, are not destroyed/);
    expect(text).not.toMatch(/Nothing is deleted on a timer/);
  });

  it("the FAQ answers how long records are kept", () => {
    renderAt(<Faq />);
    expect(screen.getByText("How long are records kept?")).toBeInTheDocument();
  });
});

describe("in-app trial on Starter and Growth", () => {
  it("reads both the new list and an older single-plan catalogue", () => {
    expect(trialPlans(FALLBACK_CATALOG)).toEqual(["starter", "growth"]);
    expect(trialPlanNames(FALLBACK_CATALOG)).toBe("Starter or Growth");
    expect(trialPlans({ ...FALLBACK_CATALOG, trial: { ...FALLBACK_CATALOG.trial, for: "starter" } })).toEqual(["starter"]);
  });

  it("Pricing offers the trial on Starter or Growth", async () => {
    mockFetch({ "/api/public/plans": () => ({ status: 500 }) });
    renderAt(<Pricing />, "/pricing");
    await screen.findByText(/standard price list/);
    expect(screen.getByRole("heading", { name: "Try every Pro feature free for 14 days on Starter or Growth" })).toBeInTheDocument();
  });
});
