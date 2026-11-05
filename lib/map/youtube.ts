// Pure parsing for the YouTube Data API v3 `videos.list` response (part=snippet,contentDetails,statistics).
// The fetch lives in lib/data/link-preview.ts; this file is unit-tested with sample responses.

export interface YouTubeVideo {
  title: string;
  /** ISO date (YYYY-MM-DD) or "". */
  date: string;
  /** "12:40" or "1:02:03"; "" for live streams and unknown lengths. */
  duration: string;
  /** Largest 16:9 thumbnail: maxres (1280×720) when the video has one, else medium (320×180). "" if none. */
  thumbnail: string;
  /** null when the channel hides view counts. */
  views: number | null;
}

/** ISO 8601 duration (PT1H2M3S, P1DT2H) as a clock: "1:02:03", "12:40", "0:45". */
export function formatIsoDuration(iso: string): string {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso);
  if (!m) return "";
  const h = Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0);
  const min = Number(m[3] ?? 0);
  const s = Math.floor(Number(m[4] ?? 0));
  if (h + min + s === 0) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

type Thumbs = Record<string, { url?: unknown } | undefined>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** The first video in a `videos.list` response, or null if there is none (deleted, private, wrong id). */
export function parseYouTubeVideo(json: unknown): YouTubeVideo | null {
  const item = (json as { items?: unknown[] } | null)?.items?.[0] as
    | {
        snippet?: { title?: unknown; publishedAt?: unknown; thumbnails?: Thumbs };
        contentDetails?: { duration?: unknown };
        statistics?: { viewCount?: unknown };
      }
    | undefined;
  if (!item) return null;
  const published = Date.parse(str(item.snippet?.publishedAt));
  const thumbs = item.snippet?.thumbnails ?? {};
  // maxres and medium are true 16:9; high/standard are 4:3 with black bars, so they are skipped.
  const thumbnail = str(thumbs.maxres?.url) || str(thumbs.medium?.url);
  const views = Number(str(item.statistics?.viewCount));
  return {
    title: str(item.snippet?.title).trim(),
    date: Number.isNaN(published) ? "" : new Date(published).toISOString().slice(0, 10),
    duration: formatIsoDuration(str(item.contentDetails?.duration)),
    thumbnail: thumbnail.startsWith("https://") ? thumbnail : "",
    views: str(item.statistics?.viewCount) && Number.isFinite(views) ? views : null,
  };
}

/** "1,234 views", "12.3K views", "1.2M views" (en, compact above 10,000). */
export function formatViews(n: number): string {
  const text =
    n < 10_000
      ? n.toLocaleString("en")
      : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  return `${text} ${n === 1 ? "view" : "views"}`;
}
