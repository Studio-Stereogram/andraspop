import "server-only";

// A small client for Supabase's REST API (PostgREST), with plain fetch: the same approach as /api/keepalive.
// Two keys: the publishable key reads what visitors may see (row-level security applies); the secret key, server-only,
// reads and writes everything and is used only after the editor gate has been checked.

export type SupabaseKey = "public" | "secret";

export class SupabaseError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    path: string,
  ) {
    super(`Supabase ${status} on ${path.split("?")[0]}: ${body.slice(0, 200)}`);
  }
}

export function supabaseConfig(kind: SupabaseKey): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = kind === "public" ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

const TIMEOUT_MS = 10_000;

/**
 * One REST call. `path` is relative to /rest/v1/ and must already be URL-safe. Returns the parsed JSON body, or null
 * for an empty response. Throws SupabaseError for any non-2xx answer.
 */
export async function rest<T>(
  kind: SupabaseKey,
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const cfg = supabaseConfig(kind);
  if (!cfg) throw new Error("Supabase is not configured");
  const headers: Record<string, string> = { apikey: cfg.key, Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.prefer) headers.Prefer = init.prefer;
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) throw new SupabaseError(res.status, text, path);
  return (text ? JSON.parse(text) : null) as T;
}

/** A PostgREST `in.(…)` list with each value quoted, for ids and slugs. */
export const inList = (values: string[]) =>
  encodeURIComponent(`in.(${values.map((v) => `"${v.replace(/["\\]/g, "")}"`).join(",")})`);
