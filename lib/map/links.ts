// Pure helpers for deriving a video's title, thumbnail and date from its link. Fetching lives in
// lib/data/link-preview.ts; everything here is parsing, so it is unit-tested with sample responses.

export interface LinkPreview {
  title: string;
  thumbnail: string;
  /** ISO date (YYYY-MM-DD) or "". */
  date: string;
}

export const EMPTY_PREVIEW: LinkPreview = { title: "", thumbnail: "", date: "" };

/** Hosts real thumbnails may come from. next.config.ts allows the same list for next/image. */
export const THUMBNAIL_HOSTS = ["i.ytimg.com", "*.cdninstagram.com", "*.fbcdn.net"] as const;

export function isAllowedThumbnail(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return THUMBNAIL_HOSTS.some((h) => (h.startsWith("*.") ? u.hostname.endsWith(h.slice(1)) : u.hostname === h));
  } catch {
    return false;
  }
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** The 11-character video id from watch, youtu.be, shorts, embed and live links. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m|music)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ?? null;
    }
    return id && YT_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Instagram post/reel link without the share-tracking query (utm_source, igsh, …). */
export function canonicalInstagramUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return null;
    return `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/`;
  } catch {
    return null;
  }
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** og:* and twitter:* meta tags from an HTML page, attribute order independent. */
export function parseOpenGraph(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of html.match(/<meta\s[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const [, name, , dq, sq] of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      attrs[name.toLowerCase()] = dq ?? sq ?? "";
    }
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content !== undefined && !(key in out)) out[key] = decodeEntities(attrs.content);
  }
  return out;
}

/** A card title from a caption: its first line, without trailing hashtags or mentions, at most ~90 characters. */
export function titleFromCaption(caption: string): string {
  const line = caption.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
  const clean = line.replace(/(\s*[#@][\p{L}\p{N}_.]+)+\s*$/u, "").replace(/\s+/g, " ").trim();
  if (clean.length <= 90) return clean;
  const cut = clean.slice(0, 88);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : 88).replace(/[\s,.;:–—-]+$/, "")}…`;
}

const QUOTED = /:\s*["“]([\s\S]*)["”]\s*\.?\s*$/;
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";

/**
 * Instagram's link-preview tags: og:title is `Name on Instagram: "caption"`, og:description is
 * `N likes, N comments - handle on Month D, YYYY: "caption"`, og:image is the cover frame.
 */
export function instagramPreview(og: Record<string, string>): LinkPreview {
  const caption = og["og:title"]?.match(QUOTED)?.[1] ?? og["og:description"]?.match(QUOTED)?.[1] ?? "";
  const when = og["og:description"]?.match(new RegExp(`\\bon ((?:${MONTHS}) \\d{1,2}, \\d{4})`))?.[1];
  const ms = when ? Date.parse(`${when} 00:00:00 UTC`) : NaN;
  const image = og["og:image"] ?? "";
  return {
    title: titleFromCaption(caption),
    thumbnail: isAllowedThumbnail(image) ? image : "",
    date: Number.isNaN(ms) ? "" : new Date(ms).toISOString().slice(0, 10),
  };
}

/** YouTube's oEmbed JSON: { title, author_name, thumbnail_url, … }. */
export function youtubeOEmbedTitle(json: unknown): string {
  const t = (json as { title?: unknown } | null)?.title;
  return typeof t === "string" ? t.trim() : "";
}
