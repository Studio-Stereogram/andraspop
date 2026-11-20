// inset.andraspop.com serves the pages that live under /inset in this app.
// The proxy rewrites the subdomain's paths onto /inset, and links drop the prefix there,
// so visitors see inset.andraspop.com/design-cycle while andraspop.com/inset/design-cycle
// (and preview deployments) keep working.

export const INSET_PREFIX = "/inset";

export function isInsetHost(host: string): boolean {
  return host.split(":")[0].startsWith("inset.");
}

/** Where a request to the inset host is served from, or null when it is already in place. */
export function insetRewritePath(pathname: string): string | null {
  if (pathname === INSET_PREFIX || pathname.startsWith(`${INSET_PREFIX}/`)) return null;
  return pathname === "/" ? INSET_PREFIX : `${INSET_PREFIX}${pathname}`;
}

/** An inset path as a visitor should see it on the current host. */
export function visibleInsetPath(path: string, onInsetHost: boolean): string {
  if (!onInsetHost) return path;
  const stripped = path.slice(INSET_PREFIX.length);
  return stripped === "" ? "/" : stripped;
}

export function insetPath(slug?: string): string {
  return slug ? `${INSET_PREFIX}/${slug}` : INSET_PREFIX;
}
