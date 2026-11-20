import { describe, expect, it } from "vitest";
import { INSETS, directionBetween, getInset } from "./insets";

describe("insets", () => {
  it("have unique, URL-safe slugs", () => {
    const slugs = INSETS.map((inset) => inset.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("finds an inset by slug", () => {
    expect(getInset("design-cycle")?.title).toBe("Design cycle");
    expect(getInset("nope")).toBeUndefined();
  });

  it("slides forward to later insets and back to earlier ones", () => {
    expect(directionBetween("design-cycle", "shape-of-information")).toBe("nav-forward");
    expect(directionBetween("shape-of-information", "design-cycle")).toBe("nav-back");
  });
});
