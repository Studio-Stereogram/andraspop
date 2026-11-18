import { isCronRequest } from "@/lib/cron";

/**
 * Daily Supabase keepalive, called by Vercel Cron (vercel.json). Supabase pauses free projects after 7 days without
 * activity, and Vercel blocks every deployment while the connected database is paused. One small read through
 * Supabase's REST API counts as activity. It uses the publishable key, so it can only read what the public can.
 * Answers 401 to anything but Vercel's cron call, and 502 if Supabase doesn't answer, so failures show in cron logs.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ ok: false, error: "Supabase is not configured" }, { status: 500 });

  try {
    const res = await fetch(`${url}/rest/v1/topics?select=id&limit=1`, {
      headers: { apikey: key, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return Response.json({ ok: res.ok, supabase: res.status }, { status: res.ok ? 200 : 502 });
  } catch {
    return Response.json({ ok: false, error: "Supabase did not answer" }, { status: 502 });
  }
}
