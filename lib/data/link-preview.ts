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
import { parseYouTubeVideo } from "@/lib/map/youtube";

const TIMEOUT_MS = 5000;
const HEADERS = {
  "User-Agent": "mind-map link preview (+https://andraspop.com)",
  Accept: "text/html,application/json;q=0.9",
  "Accept-Language": "en",
};

async function fetchText(url: string, headers: Record<string, string> = HEADERS): Promise<string | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * Title, thumbnail, date (and for YouTube, duration and views) for a video link. Runs on the server (at build and on
 * revalidation), never in the browser. YouTube: the Data API when YOUTUBE_API_KEY is set, otherwise the public
 * oEmbed endpoint (title only). Instagram: the post's Open Graph tags. Anything missing comes back empty and the card
 * falls back to its defaults. Cached for a day when it worked, so stats refresh daily; an hour when it didn't.
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
  if (yt) return (await fromYouTubeApi(yt)) ?? (await fromYouTubeOEmbed(yt));
  const ig = canonicalInstagramUrl(url);
  if (ig) {
    const html = await fetchText(ig);
    return html ? instagramPreview(parseOpenGraph(html)) : EMPTY_PREVIEW;
  }
  return EMPTY_PREVIEW;
}

async function fromYouTubeApi(id: string): Promise<LinkPreview | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const api = new URL("https://www.googleapis.com/youtube/v3/videos");
  api.search = new URLSearchParams({ part: "snippet,contentDetails,statistics", id }).toString();
  // The key goes in a header, not the URL, so it can't end up in fetch logs or cache keys.
  const body = await fetchText(api.href, { Accept: "application/json", "X-Goog-Api-Key": key });
  if (!body) return null;
  try {
    const v = parseYouTubeVideo(JSON.parse(body));
    if (!v) return null;
    return { title: v.title, thumbnail: v.thumbnail || youtubeThumbnail(id), date: v.date, duration: v.duration, views: v.views };
  } catch {
    return null;
  }
}

async function fromYouTubeOEmbed(id: string): Promise<LinkPreview> {
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const body = await fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`);
  let title = "";
  try {
    title = body ? youtubeOEmbedTitle(JSON.parse(body)) : "";
  } catch {}
  // The thumbnail URL follows from the id, so it works even when oEmbed doesn't answer.
  return { title, thumbnail: youtubeThumbnail(id), date: "" };
}
