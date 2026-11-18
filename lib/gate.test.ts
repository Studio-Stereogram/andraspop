import { describe, expect, it } from "vitest";
import { isEditHost, isEditorRequest, passwordFromAuthorization, safeEqual } from "./gate";

const basic = (user: string, pw: string) =>
  `Basic ${btoa(String.fromCharCode(...new TextEncoder().encode(`${user}:${pw}`)))}`;

describe("editor gate", () => {
  it("knows the edit host", () => {
    expect(isEditHost("edit.andraspop.com", "edit.andraspop.com")).toBe(true);
    expect(isEditHost("EDIT.andraspop.com:443", "edit.andraspop.com")).toBe(true);
    expect(isEditHost("andraspop.com", "edit.andraspop.com")).toBe(false);
    expect(isEditHost("edit.evil.example", "edit.andraspop.com")).toBe(false);
    expect(isEditHost("edit.example.com", "")).toBe(true);
  });

  it("reads the password from Basic auth, including a colon and non-ASCII", () => {
    expect(passwordFromAuthorization(basic("anyone", "a:b:ő"))).toBe("a:b:ő");
    expect(passwordFromAuthorization("Bearer x")).toBe("");
    expect(passwordFromAuthorization("Basic !!!")).toBe("");
    expect(passwordFromAuthorization(null)).toBe("");
  });

  it("never matches an empty password", () => {
    expect(safeEqual("", "")).toBe(false);
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });

  it("needs both the edit host and the password", () => {
    const pw = "correct horse battery staple";
    process.env.EDIT_HOST = "edit.andraspop.com";
    expect(isEditorRequest("edit.andraspop.com", basic("", pw), pw)).toBe(true);
    expect(isEditorRequest("andraspop.com", basic("", pw), pw)).toBe(false);
    expect(isEditorRequest("edit.andraspop.com", basic("", "nope"), pw)).toBe(false);
    expect(isEditorRequest("edit.andraspop.com", basic("", ""), "")).toBe(false);
    delete process.env.EDIT_HOST;
  });
});
