import type { Rect, XY } from "./types";

// Floating edges (canvas.md → Connection points): each end attaches to the midpoint of the side that faces
// the other node, and the Bézier tangents are normal to that side, k = max(40, distance × 0.38).

export type Side = "r" | "l" | "b" | "t";

const NORMAL: Record<Side, [number, number]> = { r: [1, 0], l: [-1, 0], b: [0, 1], t: [0, -1] };
const f2 = (v: number) => +v.toFixed(2);

export function sidePoint(n: Rect, s: Side): XY {
  const cx = n.x + n.w / 2,
    cy = n.y + n.h / 2;
  if (s === "r") return { x: n.x + n.w, y: cy };
  if (s === "l") return { x: n.x, y: cy };
  if (s === "b") return { x: cx, y: n.y + n.h };
  return { x: cx, y: n.y };
}

/** The sides of a and b that face each other. Prefers left/right unless the boxes overlap horizontally. */
export function facing(a: Rect, b: Rect): [Side, Side] {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2),
    dy = b.y + b.h / 2 - (a.y + a.h / 2);
  const gx = Math.abs(dx) - (a.w + b.w) / 2,
    gy = Math.abs(dy) - (a.h + b.h) / 2;
  if (gx >= gy || gx > 0) return dx >= 0 ? ["r", "l"] : ["l", "r"];
  return dy >= 0 ? ["b", "t"] : ["t", "b"];
}

export interface Curve {
  d: string;
  /** Midpoint of the curve, where the kind label sits. */
  mx: number;
  my: number;
}

export function curve(p1: XY, n1: [number, number], p2: XY, n2: [number, number]): Curve {
  const k = Math.max(40, Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.38);
  const c1 = { x: p1.x + n1[0] * k, y: p1.y + n1[1] * k },
    c2 = { x: p2.x + n2[0] * k, y: p2.y + n2[1] * k };
  return {
    d: `M${f2(p1.x)},${f2(p1.y)} C${f2(c1.x)},${f2(c1.y)} ${f2(c2.x)},${f2(c2.y)} ${f2(p2.x)},${f2(p2.y)}`,
    mx: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8,
    my: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8,
  };
}

export function link(a: Rect, b: Rect): Curve {
  const [sa, sb] = facing(a, b);
  return curve(sidePoint(a, sa), NORMAL[sa], sidePoint(b, sb), NORMAL[sb]);
}
