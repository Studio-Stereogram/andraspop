import { timingSafeEqual } from "node:crypto";

/** The password from an HTTP Basic Auth header (`Basic base64(user:password)`). The username is ignored. */
export function basicAuthPassword(authorization: string | null): string {
  if (!authorization?.startsWith("Basic ")) return "";
  let decoded: string;
  try {
    decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  } catch {
    return "";
  }
  const colon = decoded.indexOf(":");
  return colon === -1 ? "" : decoded.slice(colon + 1);
}

/**
 * True only when the Basic Auth password equals the configured one. A missing password means nothing is
 * authorised, so an unconfigured gate stays shut.
 */
export function isEditorRequest(authorization: string | null, password: string | undefined): boolean {
  if (!password) return false;
  const given = Buffer.from(basicAuthPassword(authorization));
  const expected = Buffer.from(password);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
