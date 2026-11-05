import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import type { MapData, MapNode } from "@/lib/map/types";
import { toPublicMap } from "@/lib/map/visibility";
import { persistCover } from "./covers";
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

/**
 * Fills a video's title, thumbnail, date, duration and views from its link. Values written in the data always win.
 * Instagram covers are copied to Vercel Blob, because Instagram's own image links expire.
 */
async function withLinkPreview(n: MapNode): Promise<MapNode> {
  if (n.type !== "video" || !n.url) return n;
  const p = await getLinkPreview(n.url);
  let thumbnail = n.thumbnail || p.thumbnail;
  if (!n.thumbnail && n.platform === "instagram") thumbnail = await persistCover(n.id, thumbnail);
  return {
    ...n,
    title: n.title || p.title,
    thumbnail,
    date: n.date || p.date,
    duration: n.duration || p.duration || "",
    views: p.views ?? null,
  };
}
