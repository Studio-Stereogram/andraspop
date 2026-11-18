"use client";

import { createContext, useContext } from "react";
import { useStore, type ConnectionLineComponentProps, type InternalNode } from "@xyflow/react";
import { EDGE_KIND_LABEL, EDGE_TYPE_LABEL } from "@/lib/map/constants";
import { kindFor } from "@/lib/map/edit";
import { link, toPoint } from "@/lib/map/geometry";
import type { EdgeType, Rect, XY } from "@/lib/map/types";
import type { FlowNode } from "../nodes";

/** How close (screen px) the pointer has to be to a card for the thread to lock on. */
export const SNAP_PX = 80;

/** Finds the card a thread from `fromId` locks on to at `pointer` (flow coordinates), or null. */
export type Snap = (fromId: string, type: EdgeType, pointer: XY) => InternalNode<FlowNode> | null;

export const SnapContext = createContext<Snap | null>(null);

export function rectOf(n: InternalNode): Rect {
  return {
    x: n.internals.positionAbsolute.x,
    y: n.internals.positionAbsolute.y,
    w: n.measured.width ?? 0,
    h: n.measured.height ?? 0,
  };
}

const f2 = (v: number) => +v.toFixed(2);

/** A point in pane pixels (React Flow's connection `pointer`) → flow coordinates. */
export function paneToFlow(p: XY, tx: number, ty: number, zoom: number): XY {
  return { x: (p.x - tx) / zoom, y: (p.y - ty) / zoom };
}

/** Corner brackets around a box, `out` px outside it (canvas.md → selection and lock-on). */
function brackets(r: Rect, out: number, arm: number) {
  const x0 = r.x - out,
    y0 = r.y - out,
    x1 = r.x + r.w + out,
    y1 = r.y + r.h + out;
  return [
    `M${f2(x0)},${f2(y0 + arm)} V${f2(y0)} H${f2(x0 + arm)}`,
    `M${f2(x1 - arm)},${f2(y0)} H${f2(x1)} V${f2(y0 + arm)}`,
    `M${f2(x1)},${f2(y1 - arm)} V${f2(y1)} H${f2(x1 - arm)}`,
    `M${f2(x0 + arm)},${f2(y1)} H${f2(x0)} V${f2(y1 - arm)}`,
  ].join(" ");
}

/**
 * The thread while connecting (canvas.md → Dragging a connection): dashed --hot from the facing side to the pointer,
 * a hollow end dot and a label. Within 80px of a card it locks on: solid, attached to that card's facing side, a
 * filled dot, --hot brackets around the target, and the label names the relation that will be created.
 */
export function ConnectionLine({ fromNode, fromHandle, pointer: screen }: ConnectionLineComponentProps<FlowNode>) {
  const snap = useContext(SnapContext);
  const [tx, ty, zoom] = useStore((s) => s.transform);
  // React Flow gives the pointer in pane pixels; everything here is in flow coordinates.
  const pointer = paneToFlow(screen, tx, ty, zoom);
  const type = (fromHandle?.id ?? "reference") as EdgeType;
  const a = rectOf(fromNode);
  const target = snap?.(fromNode.id, type, pointer) ?? null;
  const g = target ? link(a, rectOf(target)) : toPoint(a, pointer);
  const label = target
    ? `${EDGE_TYPE_LABEL[type]} · ${EDGE_KIND_LABEL[kindFor(type, fromNode.data.node, target.data.node)]}`
    : `${EDGE_TYPE_LABEL[type]} · release for a new node`;
  const k = 1 / zoom;
  return (
    <g className="mm-thread-g">
      <path className={target ? "mm-thread snapped" : "mm-thread"} d={g.d} style={{ strokeWidth: 1.6 * k }} />
      <circle
        className={target ? "mm-thread-dot on" : "mm-thread-dot"}
        cx={g.b.x}
        cy={g.b.y}
        r={f2(5 * k)}
        style={{ strokeWidth: 2 * k }}
      />
      {target && <path className="mm-lockon" d={brackets(rectOf(target), 8, 12)} />}
      <text className="mm-thread-label" x={f2(g.b.x + 12 * k)} y={f2(g.b.y - 12 * k)} fontSize={f2(10 * k)} style={{ strokeWidth: 6 * k }}>
        {label}
      </text>
    </g>
  );
}
