// The editor gate's pure checks, shared by proxy.ts (every request on the edit host) and lib/auth.ts (every server
// action re-checks, because a proxy is a convenience layer, not the only lock). See docs/hosting.md.

/** The edit host: EDIT_HOST in production; `edit.localhost` in development; any `edit.` host if EDIT_HOST is unset. */
export function isEditHost(host: string, editHost = process.env.EDIT_HOST ?? ""): boolean {
  const h = host.split(":")[0].toLowerCase();
  if (editHost) return h === editHost.toLowerCase() || (process.env.NODE_ENV !== "production" && h === "edit.localhost");
  return h.startsWith("edit.");
}

/** The password from an HTTP Basic `Authorization` header (the user name is ignored). "" if absent or malformed. */
export function passwordFromAuthorization(header: string | null | undefined): string {
  if (!header?.startsWith("Basic ")) return "";
  try {
    const bin = atob(header.slice(6).trim());
    const decoded = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const colon = decoded.indexOf(":");
    return colon < 0 ? "" : decoded.slice(colon + 1);
  } catch {
    return "";
  }
}

/** Compares without stopping at the first difference. Empty never matches, so an unset password locks everyone out. */
export function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function isEditorRequest(
  host: string,
  authorization: string | null | undefined,
  password = process.env.EDIT_PASSWORD ?? "",
): boolean {
  return isEditHost(host) && safeEqual(passwordFromAuthorization(authorization), password);
}
