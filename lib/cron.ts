import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron calls a route with `Authorization: Bearer <CRON_SECRET>` when the project has a CRON_SECRET variable.
 * True only for that exact header. A missing secret means nothing is authorised, so an unconfigured route stays shut.
 */
export function isCronRequest(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
