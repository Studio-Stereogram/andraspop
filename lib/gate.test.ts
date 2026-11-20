import { describe, expect, it } from "vitest";
import { basicAuthPassword, isEditorRequest } from "./gate";

const basic = (s: string) => `Basic ${Buffer.from(s).toString("base64")}`;

describe("basicAuthPassword", () => {
  it("reads the password and ignores the username", () => {
    expect(basicAuthPassword(basic("anyone:pa:ss"))).toBe("pa:ss");
    expect(basicAuthPassword(basic(":secret"))).toBe("secret");
  });

  it("returns nothing for other schemes or malformed values", () => {
    expect(basicAuthPassword(null)).toBe("");
    expect(basicAuthPassword("Bearer secret")).toBe("");
    expect(basicAuthPassword(basic("no-colon"))).toBe("");
  });
});

describe("isEditorRequest", () => {
  it("accepts only the exact password", () => {
    expect(isEditorRequest(basic("x:long-secret"), "long-secret")).toBe(true);
    expect(isEditorRequest(basic("x:long-secreT"), "long-secret")).toBe(false);
    expect(isEditorRequest(basic("x:long-secret "), "long-secret")).toBe(false);
  });

  it("refuses everything when no password is configured", () => {
    expect(isEditorRequest(basic("x:"), "")).toBe(false);
    expect(isEditorRequest(basic("x:undefined"), undefined)).toBe(false);
  });
});
