"use client";

import { memo } from "react";
import { useInternalNode, type Edge, type EdgeProps, type InternalNode } from "@xyflow/react";
import { EDGE_KIND_LABEL } from "@/lib/map/constants";
import { link } from "@/lib/map/geometry";
import type { EdgeKind, EdgeType, Rect } from "@/lib/map/types";
import { cn } from "@/lib/utils";

export type FlowEdgeData = { type: EdgeType; kind: EdgeKind; hl: boolean; dim: boolean };
export type FlowEdge = Edge<FlowEdgeData, "floating">;

function boxOf(n: InternalNode): Rect | null {
  const w = n.measured.width,
    h = n.measured.height;
  if (!w || !h) return null;
  return { x: n.internals.positionAbsolute.x, y: n.internals.positionAbsolute.y, w, h };
}

/**
 * Continuity: solid, heavier, arrow. Reference: thinner, dashed by kind, arrow except attachment/related.
 * Lines float: each end attaches to the side facing the other node. Highlighted lines carry their kind label.
 */
export const FloatingEdge = memo(function FloatingEdge({ source, target, data }: EdgeProps<FlowEdge>) {
  const s = useInternalNode(source),
    t = useInternalNode(target);
  const a = s && boxOf(s),
    b = t && boxOf(t);
  if (!a || !b || !data) return null;

  const g = link(a, b);
  const cont = data.type === "continuity";
  const arrow = cont || (data.kind !== "attachment" && data.kind !== "related");
  const marker = data.hl ? "mm-arrow-hl" : cont ? "mm-arrow-c" : "mm-arrow";
  return (
    <>
      <path
        className={cn("mm-edge", cont ? "cont" : `ref k-${data.kind}`, data.hl && "hl", data.dim && "dim")}
        d={g.d}
        markerEnd={arrow ? `url(#${marker})` : undefined}
      />
      {data.hl && (
        <text className="mm-elabel" x={+g.mx.toFixed(2)} y={+(g.my - 7).toFixed(2)}>
          {EDGE_KIND_LABEL[data.kind]}
        </text>
      )}
    </>
  );
});

export const edgeTypes = { floating: FloatingEdge };

/** Arrowheads, coloured per state through CSS (canvas.css). */
export function EdgeMarkers() {
  const marker = (id: string) => (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" />
    </marker>
  );
  return (
    <svg className="mm-markers" aria-hidden>
      <defs>
        {marker("mm-arrow")}
        {marker("mm-arrow-c")}
        {marker("mm-arrow-hl")}
      </defs>
    </svg>
  );
}
