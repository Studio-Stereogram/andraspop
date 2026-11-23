import { describe, expect, it } from "vitest";
import type { TimelineBackground } from "./layouts";
import { OPEN_MIN_ZOOM, openingViewport, TODAY_AT, TODAY_MAX_ZOOM, TODAY_MIN_ZOOM, todayViewport } from "./viewport";

const bg = (w: number, h: number, today: number): TimelineBackground => ({
  type: "timeline",
  lanes: [],
  ticks: [],
  today,
  backlogX: w - 400,
  w,
  h,
});
const area = { left: 0, top: 0, right: 1440, bottom: 840 };
const screenX = (v: { x: number; zoom: number }, worldX: number) => v.x + worldX * v.zoom;

describe("todayViewport", () => {
  it("keeps a long timeline readable and puts Today in view", () => {
    const v = todayViewport(bg(13000, 500, 12400), area, 50, 60);
    expect(v.zoom).toBeGreaterThanOrEqual(TODAY_MIN_ZOOM);
    expect(v.zoom).toBeLessThanOrEqual(TODAY_MAX_ZOOM);
    const sx = screenX(v, 12400);
    expect(sx).toBeGreaterThan(50);
    expect(sx).toBeLessThan(1390);
  });

  it("places Today towards the right when there's room on both sides", () => {
    const v = todayViewport(bg(13000, 500, 6000), area, 50, 60);
    expect(screenX(v, 6000)).toBeCloseTo(50 + (1440 - 100) * TODAY_AT);
  });

  it("never scrolls past the backlog at the end", () => {
    const v = todayViewport(bg(13000, 500, 12900), area, 50, 60);
    expect(screenX(v, 13000)).toBeCloseTo(1390);
  });

  it("never scrolls before the first lane label", () => {
    const v = todayViewport(bg(13000, 500, 100), area, 50, 60);
    expect(screenX(v, -60)).toBeCloseTo(50);
  });

  it("centres a timeline that fits", () => {
    const v = todayViewport(bg(600, 300, 300), area, 50, 60);
    expect(v.zoom).toBe(TODAY_MAX_ZOOM);
    expect(screenX(v, -60) + screenX(v, 600)).toBeCloseTo(1440);
  });

  it("top-aligns lanes taller than the screen at the smallest readable zoom", () => {
    const v = todayViewport(bg(13000, 3000, 6000), area, 50, 60);
    expect(v.zoom).toBe(TODAY_MIN_ZOOM);
    expect(v.y + -40 * v.zoom).toBeCloseTo(50);
  });
});

describe("openingViewport", () => {
  const intro = { x: -720, y: -160, w: 624, h: 520 };

  it("fits the whole map when it stays readable", () => {
    const v = openingViewport({ x: -720, y: -160, w: 1200, h: 600 }, intro, area, 50, 60, 0.15, 1.1);
    expect(v.zoom).toBeGreaterThanOrEqual(OPEN_MIN_ZOOM);
  });

  it("otherwise opens on the intro at a readable zoom, against the left edge", () => {
    const v = openingViewport({ x: -720, y: -160, w: 3000, h: 900 }, intro, area, 50, 60, 0.15, 1.1);
    expect(v.zoom).toBe(OPEN_MIN_ZOOM);
    expect(screenX(v, intro.x)).toBeCloseTo(50);
  });

  it("shows the intro's full width on a phone", () => {
    const phone = { left: 0, top: 0, right: 390, bottom: 760 };
    const v = openingViewport({ x: -720, y: -160, w: 3000, h: 900 }, intro, phone, 16, 60, 0.15, 1.1);
    expect(screenX(v, intro.x + intro.w)).toBeLessThanOrEqual(390 - 16 + 0.001);
  });
});
