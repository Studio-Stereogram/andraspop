import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import type { MapData, MapNode } from "@/lib/map/types";
import { toPublicMap } from "@/lib/map/visibility";
import { getLinkPreview } from "./link-preview";

/**
 * The map visitors see. M1 reads data/seed.json; M2 swaps this for a Supabase query
 * ('use cache' + cacheTag('map'), revalidated on publish). Either way the public rule runs here,
 * on the server, so private and draft entries never reach the browser.
 */
export async function getPublicMap(): Promise<MapData> {
  const map = toPublicMap(normalizeMap(seed));
  return { ...map, nodes: await Promise.all(map.nodes.map(withLinkPreview)) };
}

/** Fills a video's missing title, thumbnail and date from its link. Values in the data always win. */
async function withLinkPreview(n: MapNode): Promise<MapNode> {
  if (n.type !== "video" || !n.url || (n.title && n.thumbnail && n.date)) return n;
  const p = await getLinkPreview(n.url);
  return { ...n, title: n.title || p.title, thumbnail: n.thumbnail || p.thumbnail, date: n.date || p.date };
}
