import { describe, expect, it } from "vitest";
import { apcaLc } from "./apca";
import { FAMILIES, ROLES } from "./roles";

const PAPER = "#f6f4ef";
const TOOLTIP_BG = "#17171a";

describe("APCA", () => {
  it("matches the reference values for black and white", () => {
    expect(apcaLc("#000000", "#ffffff")).toBeCloseTo(106.04, 1);
    expect(apcaLc("#ffffff", "#000000")).toBeCloseTo(-107.88, 1);
  });
});

describe("role tag colours", () => {
  for (const [family, c] of Object.entries(FAMILIES)) {
    it(`${family}: supporting and lead tags reach Lc 75`, () => {
      expect(Math.abs(apcaLc(c.ink, c.tint))).toBeGreaterThanOrEqual(75);
      expect(Math.abs(apcaLc(c.onSolid, c.solid))).toBeGreaterThanOrEqual(75);
    });
  }

  it("the tooltip's text reads on its dark ground", () => {
    expect(Math.abs(apcaLc(PAPER, TOOLTIP_BG))).toBeGreaterThanOrEqual(90);
    expect(Math.abs(apcaLc("#d9d6ce", TOOLTIP_BG))).toBeGreaterThanOrEqual(75);
  });

  it("every role has a family and a short definition", () => {
    for (const role of Object.values(ROLES)) {
      expect(FAMILIES[role.family]).toBeDefined();
      expect(role.definition.length).toBeLessThanOrEqual(80);
    }
  });
});
