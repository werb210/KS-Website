import { BEING_BUILT, CHECKED, COMPETITORS, DEFAULT_COMPARE, OURS, ROWS, competitor, sourceOf } from "./compare";

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

  it("every competitor price has a source URL and a checked date; a missing price is Quote only", () => {
    for (const c of COMPETITORS) {
      const src = sourceOf(c, c.price.src);
      expect(src, `${c.id} price source`).toBeDefined();
      expect(src!.url, c.id).toMatch(/^https:\/\//);
      expect(src!.checked, c.id).toBe(CHECKED);
      if (c.price.fiveSeatMonthly == null) expect(c.price.tier, c.id).toBe("Quote only");
      if (c.price.perSeat != null) expect(c.price.fiveSeatMonthly, c.id).toBe(c.price.perSeat * 5);
    }
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
