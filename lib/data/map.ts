import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import type { MapData } from "@/lib/map/types";
import { toPublicMap } from "@/lib/map/visibility";

/**
 * The map visitors see. M1 reads data/seed.json; M2 swaps this for a Supabase query
 * ('use cache' + cacheTag('map'), revalidated on publish). Either way the public rule runs here,
 * on the server, so private and unpublished entries never reach the browser.
 */
export async function getPublicMap(): Promise<MapData> {
  return toPublicMap(normalizeMap(seed));
}
