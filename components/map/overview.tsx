"use client";

import { useRef, type PointerEvent } from "react";
import { useStore, useViewport } from "@xyflow/react";
import type { Sized, TimelineBackground } from "@/lib/map/layouts";
import type { Rect, XY } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { useMapVisual } from "./map-context";

const W = 232;
const MIN_H = 56;
const MAX_H = 132;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Picture-in-picture overview of a long Timeline: lanes, month ticks, Today and every card as a blip, with the
 * part on screen outlined. Press or drag anywhere on it to move there. Pointer-only; the zoom panel's Fit and
 * Today buttons do the same from the keyboard.
 */
export function Overview({
  bounds,
  background,
  sized,
  positions,
  viewCenter,
  centerAt,
}: {
  bounds: Rect;
  background: TimelineBackground;
  sized: Sized[];
  positions: ReadonlyMap<string, XY>;
  /** The world point at the centre of the visible area (the inspector taken off). */
  viewCenter: () => XY;
  centerAt: (p: XY) => void;
}) {
  const { x, y, zoom } = useViewport();
  const paneW = useStore((s) => s.width),
    paneH = useStore((s) => s.height);
  const { selectedId, dim } = useMapVisual();
  const grab = useRef<XY | null>(null);

  // Stretched to fill the panel (a long timeline would otherwise be a thin strip): each axis has its own scale.
  const H = clamp((W * bounds.h) / bounds.w, MIN_H, MAX_H);
  const sx = W / bounds.w,
    sy = H / bounds.h;
  const mx = (wx: number) => (wx - bounds.x) * sx,
    my = (wy: number) => (wy - bounds.y) * sy;
  const toWorld = (e: PointerEvent<SVGSVGElement>): XY => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: bounds.x + (e.clientX - r.left) / sx, y: bounds.y + (e.clientY - r.top) / sy };
  };

  // What's on screen, in world coordinates, clipped to the overview so the outline never leaves it.
  const vx0 = clamp(mx(-x / zoom), 0, W),
    vy0 = clamp(my(-y / zoom), 0, H),
    vx1 = clamp(mx((paneW - x) / zoom), 0, W),
    vy1 = clamp(my((paneH - y) / zoom), 0, H);

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toWorld(e),
      c = viewCenter();
    const px = mx(p.x),
      py = my(p.y);
    // Grabbing the outline drags it from where it was taken; pressing elsewhere jumps there.
    const inside = px >= vx0 && px <= vx1 && py >= vy0 && py <= vy1;
    grab.current = inside ? { x: p.x - c.x, y: p.y - c.y } : { x: 0, y: 0 };
    centerAt({ x: p.x - grab.current.x, y: p.y - grab.current.y });
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!grab.current) return;
    const p = toWorld(e);
    centerAt({ x: p.x - grab.current.x, y: p.y - grab.current.y });
  };
  const onUp = () => {
    grab.current = null;
  };

  return (
    <div className="mm-overview absolute bottom-[62px] left-3 z-[3] rounded-[var(--r-panel)] border border-line bg-surface p-1 shadow-[var(--shadow)] max-sm:hidden">
      <svg
        width={W}
        height={H}
        role="img"
        aria-label="Timeline overview"
        className="block cursor-pointer touch-none rounded-[var(--r-sm)]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <rect className="mm-ov-bg" width={W} height={H} />
        {background.lanes.slice(1).map((l) => (
          <line key={l.label} className="mm-ov-lane" x1={0} x2={W} y1={my(l.y)} y2={my(l.y)} />
        ))}
        {background.ticks
          .filter((t) => t.month)
          .map((t) => (
            <line key={t.x} className="mm-ov-tick" x1={mx(t.x)} x2={mx(t.x)} y1={0} y2={H} />
          ))}
        <line className="mm-ov-backlog" x1={mx(background.backlogX)} x2={mx(background.backlogX)} y1={0} y2={H} />
        {sized.map(({ node, w, h }) => {
          const p = positions.get(node.id);
          if (!p) return null;
          return (
            <rect
              key={node.id}
              className={cn("mm-ov-node", node.id === selectedId && "sel", dim.has(node.id) && "dim")}
              x={mx(p.x)}
              y={my(p.y)}
              width={Math.max(2, w * sx)}
              height={Math.max(2, h * sy)}
            />
          );
        })}
        <line className="mm-ov-today" x1={mx(background.today)} x2={mx(background.today)} y1={0} y2={H} />
        <rect className="mm-ov-view" x={vx0} y={vy0} width={Math.max(2, vx1 - vx0)} height={Math.max(2, vy1 - vy0)} rx={2} />
      </svg>
    </div>
  );
}
