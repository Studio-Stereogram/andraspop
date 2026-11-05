import { head, put } from "@vercel/blob";
import { cacheLife } from "next/cache";
import { isAllowedThumbnail } from "@/lib/map/links";

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;

/**
 * Instagram's cover links are signed and stop working after a few days, so each cover is copied once to Vercel Blob
 * (covers/<key>.jpg) and served from there for good. A cover already in Blob is used even when Instagram's preview
 * failed (`src` empty). Returns the Blob URL, or `src` if Blob isn't configured (local dev) or the copy fails, in which
 * case it is retried within the hour.
 */
export async function persistCover(key: string, src: string): Promise<string> {
  "use cache";
  const url = await copyToBlob(key, src);
  if (url) cacheLife("max");
  else cacheLife("hours");
  return url ?? src;
}

async function copyToBlob(key: string, src: string): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !/^[A-Za-z0-9_-]+$/.test(key)) return null;
  const pathname = `covers/${key}.jpg`;
  try {
    return (await head(pathname)).url; // already copied
  } catch {
    // not there yet (or Blob unreachable): copy it if there is something to copy
  }
  if (!isAllowedThumbnail(src)) return null;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(type)) return null;
    const body = await res.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > MAX_BYTES) return null;
    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: type,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  } catch {
    return null;
  }
}
