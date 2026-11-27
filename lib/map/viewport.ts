import type { TimelineBackground } from "./layouts";
import type { Rect } from "./types";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** The part of the canvas the map can use, in screen px relative to the stage (the inspector already taken off). */
export interface Area {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Readable zoom range for "Today": lanes fit the height when they can, cards never shrink past legible. */
export const TODAY_MIN_ZOOM = 0.8;
export const TODAY_MAX_ZOOM = 1;
/** Where the Today line lands across the visible width: most of the room goes to the past, the rest to what's next. */
export const TODAY_AT = 0.62;

// The timeline's own margins (see layoutBounds): lane labels start at x −60, date ticks at y −40.
const LEFT = -60;
const TOP = -40;

/**
 * The Timeline's opening viewport: a comfortable zoom with the Today line in view, instead of fitting a long
 * history into an unreadable strip. Never scrolls past either end of the timeline, and centres content that fits.
 */
export function todayViewport(bg: TimelineBackground, area: Area, pad: number, bottomRoom: number): Viewport {
  const aw = area.right - area.left - pad * 2,
    ah = area.bottom - area.top - pad * 2 - bottomRoom;
  const w = bg.w - LEFT,
    h = bg.h - TOP;
  const zoom = clamp(ah / h, TODAY_MIN_ZOOM, TODAY_MAX_ZOOM);

  let x: number;
  if (w * zoom <= aw) x = area.left + pad + (aw - w * zoom) / 2 - LEFT * zoom;
  else {
    const want = area.left + pad + aw * TODAY_AT - bg.today * zoom;
    // Clamp so the first lane label stays at the left edge and the backlog column at the right edge at most.
    x = clamp(want, area.left + pad + aw - bg.w * zoom, area.left + pad - LEFT * zoom);
  }
  const y = h * zoom <= ah ? area.top + pad + (ah - h * zoom) / 2 - TOP * zoom : area.top + pad - TOP * zoom;
  return { x, y, zoom };
}

/** Fits a box into the area, centred, within the zoom range (the F key and view switches). */
export function fitViewport(b: Rect, area: Area, pad: number, bottomRoom: number, minZoom: number, maxZoom: number): Viewport {
  const aw = area.right - area.left - pad * 2,
    ah = area.bottom - area.top - pad * 2 - bottomRoom;
  const zoom = clamp(Math.min(aw / b.w, ah / b.h), minZoom, maxZoom);
  return {
    zoom,
    x: area.left + pad + (aw - b.w * zoom) / 2 - b.x * zoom,
    y: area.top + pad + (ah - b.h * zoom) / 2 - b.y * zoom,
  };
}

/** Below this, a first visit doesn't fit the whole Freeform map: the cards would be too small to read. */
export const OPEN_MIN_ZOOM = 0.7;

/**
 * Freeform's opening viewport. The whole map when it fits at a readable zoom; otherwise a readable zoom with the
 * intro at the left edge, so the statement is read first and the entries carry on to the right. On a phone the
 * zoom drops until the intro's full width fits.
 */
export function openingViewport(
  bounds: Rect,
  intro: Rect | null,
  area: Area,
  pad: number,
  bottomRoom: number,
  minZoom: number,
  maxZoom: number,
): Viewport {
  const fit = fitViewport(bounds, area, pad, bottomRoom, minZoom, maxZoom);
  if (!intro || fit.zoom >= OPEN_MIN_ZOOM) return fit;
  const aw = area.right - area.left - pad * 2,
    ah = area.bottom - area.top - pad * 2 - bottomRoom;
  const zoom = clamp(Math.min(OPEN_MIN_ZOOM, aw / intro.w), minZoom, maxZoom);
  const x = area.left + pad - intro.x * zoom;
  const y = intro.h * zoom <= ah ? area.top + pad + (ah - intro.h * zoom) / 2 - intro.y * zoom : area.top + pad - intro.y * zoom;
  return { x, y, zoom };
}
