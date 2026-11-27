import { describe, expect, it } from "vitest";
import { apcaLc } from "./apca";
import { DS_THEMES } from "./ds-themes";

describe("design system inset themes", () => {
  for (const t of DS_THEMES) {
    it(`${t.name}: text, labels, buttons and tags reach Lc 75`, () => {
      const c = t.colour;
      expect(Math.abs(apcaLc(c.text, c.surface))).toBeGreaterThanOrEqual(75);
      expect(Math.abs(apcaLc(c.text, c.bg))).toBeGreaterThanOrEqual(75);
      expect(Math.abs(apcaLc(c.muted, c.surface))).toBeGreaterThanOrEqual(75);
      expect(Math.abs(apcaLc(c.onAction, c.action))).toBeGreaterThanOrEqual(75);
      expect(Math.abs(apcaLc(c.onAccent, c.accent))).toBeGreaterThanOrEqual(75);
    });
  }

  it("has unique keys", () => {
    expect(new Set(DS_THEMES.map((t) => t.key)).size).toBe(DS_THEMES.length);
  });
});
