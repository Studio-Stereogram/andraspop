/**
 * Reads one item from the project's Vercel Global Config (formerly Edge Config) store over its REST endpoint,
 * so no SDK is needed. The connection string (`https://<host>/<id>?token=<read token>`) is set by Vercel when a
 * store is connected to the project. Returns undefined when the store isn't connected, the item is missing,
 * or the store doesn't answer, so callers can show an empty state instead of failing.
 */
export async function readGlobalConfigItem(key: string): Promise<unknown> {
  const conn = process.env.GLOBAL_CONFIG ?? process.env.EDGE_CONFIG;
  if (!conn) return undefined;
  let url: URL;
  try {
    url = new URL(conn);
  } catch {
    return undefined;
  }
  const token = url.searchParams.get("token");
  const id = url.pathname.split("/").filter(Boolean)[0];
  if (!token || !id) return undefined;

  try {
    const res = await fetch(`${url.origin}/${id}/item/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}
