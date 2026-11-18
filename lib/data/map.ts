import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import { withDerived, type Derived, type MapData, type MapNode } from "@/lib/map/types";
import { toPublicMap } from "@/lib/map/visibility";
import { persistCover } from "./covers";
import { getLinkPreview } from "./link-preview";
import { fileStore, hasFileMap, readSupabase } from "./store";
import { supabaseConfig } from "./supabase";

/** Cache tag of everything visitors see; editor saves expire it (updateTag in app/edit/actions.ts). */
export const MAP_TAG = "map";

/**
 * The map visitors see, cached until an editor saves. Read from Supabase with the publishable key, so row-level
 * security already hides drafts and private entries; the public rule runs again here on the whole graph (it also hides
 * attachments whose every connection is hidden). Until the database has entries (or if it can't be read), visitors
 * get data/seed.json, so the site never goes blank.
 */
export async function getPublicMap(): Promise<MapData> {
  "use cache";
  cacheTag(MAP_TAG);
  const { map, fallback } = await readPublicSource();
  if (fallback) cacheLife("minutes"); // try the database again soon
  const pub = toPublicMap(map);
  return { ...pub, nodes: await Promise.all(pub.nodes.map(withLinkPreview)) };
}

async function readPublicSource(): Promise<{ map: MapData; fallback: boolean }> {
  if (supabaseConfig("public")) {
    try {
      const map = await readSupabase("public");
      if (map.nodes.length) return { map, fallback: false };
      return { map: normalizeMap(seed), fallback: true };
    } catch (err) {
      console.error("Public map: Supabase read failed, showing the seed file.", err);
      return { map: normalizeMap(seed), fallback: true };
    }
  }
  if (process.env.NODE_ENV !== "production" && (await hasFileMap())) return { map: await fileStore().read(), fallback: false };
  return { map: normalizeMap(seed), fallback: false };
}

export async function derivedFields(n: MapNode): Promise<Derived> {
  if (n.type !== "video" || !n.url) return {};
  const p = await getLinkPreview(n.url);
  const d: Derived = {};
  if (!n.title && p.title) d.title = p.title;
  if (!n.thumbnail) {
    const thumb = n.platform === "instagram" ? await persistCover(n.id, p.thumbnail) : p.thumbnail;
    if (thumb) d.thumbnail = thumb;
  }
  if (!n.date && p.date) d.date = p.date;
  if (!n.duration && p.duration) d.duration = p.duration;
  if (typeof p.views === "number") d.views = p.views;
  return d;
}

/**
 * Fills a video's title, thumbnail, date, duration and views from its link. Values written in the data always win.
 * Instagram covers are copied to Vercel Blob, because Instagram's own image links expire.
 */
async function withLinkPreview(n: MapNode): Promise<MapNode> {
  return withDerived(n, await derivedFields(n));
}
