import { KIND_LABEL, PLATFORMS, TOPIC_PALETTE } from "./constants";
import { h32 } from "./thumbnail";
import type { MapNode } from "./types";

/** "16 Sept 2026" (en-GB, UTC so server and browser agree). */
export function formatDate(d: string): string {
  if (!d) return "";
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const X_PROFILE = /(?:x|twitter)\.com\/([A-Za-z0-9_]+)/;

export function isXUrl(url: string): boolean {
  return /(?:^|\/\/)(?:www\.)?(?:x|twitter)\.com\//.test(url);
}

/** X handle without "@", from the handle field or an x.com URL. */
export function handleOf(n: Pick<MapNode, "handle" | "url">): string {
  const raw = n.handle.trim();
  const m = raw.match(X_PROFILE) ?? n.url.match(X_PROFILE);
  return m ? m[1] : raw.replace(/^@/, "");
}

export function personMeta(n: MapNode): string {
  const parts: string[] = [];
  const handle = handleOf(n);
  if (handle) parts.push(`@${handle}`);
  if (n.url && !isXUrl(n.url)) parts.push(hostOf(n.url));
  return parts.join(" · ") || "No link yet";
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}

/** Topic-palette colour picked by a hash of the name, so a person keeps their colour. */
export function avatarColor(n: Pick<MapNode, "title" | "id">): string {
  return TOPIC_PALETTE[h32(n.title || n.id) % TOPIC_PALETTE.length];
}

/** Only http(s) links are rendered as hrefs; anything else is treated as missing. */
export function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

/** What to call an entry: its title, or a readable stand-in ("YouTube video", "Instagram reel", "Untitled link"). */
export function displayTitle(n: Pick<MapNode, "title" | "type" | "platform">): string {
  if (n.title) return n.title;
  if (n.type === "person") return "Unnamed person";
  if (n.type === "video" && n.platform) return n.platform === "instagram" ? "Instagram reel" : `${PLATFORMS[n.platform].label} video`;
  return `Untitled ${KIND_LABEL[n.type].toLowerCase()}`;
}
