import { BEING_BUILT, CHECKED, COMPETITORS, DEFAULT_COMPARE, OURS, ROWS, competitor, priceTotals, sourceOf } from "./compare";

describe("comparison data", () => {
  it("never shows a feature we lack: our column is only ever yes, or coming soon for something being built", () => {
    for (const r of ROWS) {
      const cell = OURS[r.id];
      expect(cell, r.id).toBeDefined();
      expect(["yes", "soon"], r.id).toContain(cell.v);
      if (cell.v === "soon") expect(BEING_BUILT, r.id).toContain(cell.building);
    }
    expect(Object.keys(OURS).sort()).toEqual(ROWS.map((r) => r.id).sort());
  });

  it("has 25 to 35 rows, with unique ids", () => {
    expect(ROWS.length).toBeGreaterThanOrEqual(25);
    expect(ROWS.length).toBeLessThanOrEqual(35);
    expect(new Set(ROWS.map((r) => r.id)).size).toBe(ROWS.length);
  });

  it("every line of every competitor price has a source URL and a checked date", () => {
    for (const c of COMPETITORS) {
      expect(c.price.lines.length, c.id).toBeGreaterThan(0);
      for (const id of [c.price.src, ...c.price.lines.map((l) => l.src)]) {
        const src = sourceOf(c, id);
        expect(src, `${c.id} price source ${id}`).toBeDefined();
        expect(src!.url, c.id).toMatch(/^https:\/\//);
        expect(src!.checked, c.id).toBe(CHECKED);
      }
    }
  });

  it("totals add up per currency; an unpublished line makes the total a from figure", () => {
    const hubspot = priceTotals(competitor("hubspot")!.price);
    expect(hubspot.from).toBe(false);
    expect(hubspot.byCurrency).toEqual([{ currency: "CAD", monthly: 1819, oneTime: 5650, firstYear: 1819 * 12 + 5650 }]);

    const zoho = priceTotals(competitor("zoho")!.price);
    expect(zoho.byCurrency.map((t) => [t.currency, t.monthly])).toEqual([["CAD", 182], ["USD", 49]]);
    expect(zoho.from).toBe(true);

    const salesforce = priceTotals(competitor("salesforce")!.price);
    expect(salesforce.byCurrency[0]).toMatchObject({ currency: "USD", monthly: 1775, firstYear: 21300 });
    expect(salesforce.from).toBe(true);

    const centrex = priceTotals(competitor("centrex")!.price);
    expect(centrex.onRequest).toBe(true);
    expect(centrex.byCurrency).toEqual([]);
  });

  it("prices in CAD wherever the vendor shows CAD", () => {
    for (const id of ["hubspot", "pipedrive"]) for (const l of competitor(id)!.price.lines) expect(l.currency, id).toBe("CAD");
  });

  it("every competitor value names a source with a URL and a checked date", () => {
    for (const c of COMPETITORS) {
      for (const s of c.sources) {
        expect(s.url, `${c.id}/${s.id}`).toMatch(/^https:\/\/[^\s]+$/);
        expect(s.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      for (const r of ROWS) {
        const cell = c.cells[r.id];
        expect(cell, `${c.id}/${r.id}`).toBeDefined();
        expect(sourceOf(c, cell.src), `${c.id}/${r.id} -> ${cell.src}`).toBeDefined();
        if (cell.v === "addon" || cell.v === "limited") expect(cell.note, `${c.id}/${r.id} needs a note`).toBeTruthy();
      }
    }
  });

  it("has about 8 competitors with unique ids and ranks, and the default pair exists", () => {
    expect(COMPETITORS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(COMPETITORS.map((c) => c.id)).size).toBe(COMPETITORS.length);
    expect(new Set(COMPETITORS.map((c) => c.rank)).size).toBe(COMPETITORS.length);
    for (const id of DEFAULT_COMPARE) expect(competitor(id)).toBeDefined();
  });
});
