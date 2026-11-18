import { describe, expect, it } from "vitest";
import { isCronRequest } from "./cron";

describe("isCronRequest", () => {
  it("accepts only the exact bearer header", () => {
    expect(isCronRequest("Bearer s3cret-value", "s3cret-value")).toBe(true);
    expect(isCronRequest("Bearer s3cret-valuX", "s3cret-value")).toBe(false);
    expect(isCronRequest("s3cret-value", "s3cret-value")).toBe(false);
    expect(isCronRequest("Bearer s3cret-value ", "s3cret-value")).toBe(false);
  });

  it("refuses everything when no secret is configured", () => {
    expect(isCronRequest("Bearer ", "")).toBe(false);
    expect(isCronRequest("Bearer undefined", undefined)).toBe(false);
    expect(isCronRequest(null, "s3cret-value")).toBe(false);
  });
});
