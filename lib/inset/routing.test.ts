import { describe, expect, it } from "vitest";
import { insetPath, insetRewritePath, isInsetHost, visibleInsetPath } from "./routing";

describe("inset routing", () => {
  it("recognises the inset subdomain with or without a port", () => {
    expect(isInsetHost("inset.andraspop.com")).toBe(true);
    expect(isInsetHost("inset.localhost:3000")).toBe(true);
    expect(isInsetHost("andraspop.com")).toBe(false);
    expect(isInsetHost("edit.andraspop.com")).toBe(false);
  });

  it("rewrites subdomain paths onto /inset and leaves prefixed paths alone", () => {
    expect(insetRewritePath("/")).toBe("/inset");
    expect(insetRewritePath("/design-cycle")).toBe("/inset/design-cycle");
    expect(insetRewritePath("/inset")).toBeNull();
    expect(insetRewritePath("/inset/design-cycle")).toBeNull();
    expect(insetRewritePath("/insetful")).toBe("/inset/insetful");
  });

  it("drops the prefix from links only on the inset host", () => {
    expect(visibleInsetPath(insetPath(), true)).toBe("/");
    expect(visibleInsetPath(insetPath("design-cycle"), true)).toBe("/design-cycle");
    expect(visibleInsetPath(insetPath("design-cycle"), false)).toBe("/inset/design-cycle");
  });
});
