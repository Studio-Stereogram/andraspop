import { cacheLife } from "next/cache";
import {
  canonicalInstagramUrl,
  EMPTY_PREVIEW,
  instagramPreview,
  type LinkPreview,
  parseOpenGraph,
  youtubeId,
  youtubeOEmbedTitle,
  youtubeThumbnail,
} from "@/lib/map/links";

const TIMEOUT_MS = 5000;
const HEADERS = {
  "User-Agent": "mind-map link preview (+https://andraspop.com)",
  Accept: "text/html,application/json;q=0.9",
  "Accept-Language": "en",
};

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * Title, thumbnail and date for a video link, the way a link preview gets them: YouTube's public oEmbed endpoint,
 * and Instagram's Open Graph tags. Runs on the server (at build and on revalidation), never in the browser.
 * Anything it can't get comes back empty and the card falls back to its defaults. Cached for a day when it worked,
 * an hour when it didn't, so a failed fetch is retried soon. M3 replaces this with the platform APIs.
 */
export async function getLinkPreview(url: string): Promise<LinkPreview> {
  "use cache";
  const preview = await fetchPreview(url);
  if (preview.title) cacheLife("days");
  else cacheLife("hours");
  return preview;
}

async function fetchPreview(url: string): Promise<LinkPreview> {
  const yt = youtubeId(url);
  if (yt) {
    const watch = `https://www.youtube.com/watch?v=${yt}`;
    const body = await fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`);
    let title = "";
    try {
      title = body ? youtubeOEmbedTitle(JSON.parse(body)) : "";
    } catch {}
    // The thumbnail URL follows from the id, so it works even when oEmbed doesn't answer.
    return { title, thumbnail: youtubeThumbnail(yt), date: "" };
  }
  const ig = canonicalInstagramUrl(url);
  if (ig) {
    const html = await fetchText(ig);
    return html ? instagramPreview(parseOpenGraph(html)) : EMPTY_PREVIEW;
  }
  return EMPTY_PREVIEW;
}
