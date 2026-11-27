"use client";

import { memo, type CSSProperties } from "react";
import { useInternalNode, ViewportPortal, type Edge, type EdgeProps, type InternalNode } from "@xyflow/react";
import { EDGE_KIND_LABEL } from "@/lib/map/constants";
import { link } from "@/lib/map/geometry";
import type { EdgeKind, EdgeType, Rect } from "@/lib/map/types";
import { cn } from "@/lib/utils";

/** `trace`: a passing line from the intro to an entry of the hovered topic (its colour); not stored data. */
export type FlowEdgeData = { type: EdgeType; kind: EdgeKind; hl: boolean; dim: boolean; trace?: string };
export type FlowEdge = Edge<FlowEdgeData, "floating">;

/** End-dot radius per type: continuity lines are heavier, so their dots are too. */
const CAP_R: Record<EdgeType, number> = { continuity: 3.6, reference: 2.8 };

function boxOf(n: InternalNode): Rect | null {
  const w = n.measured.width,
    h = n.measured.height;
  if (!w || !h) return null;
  return { x: n.internals.positionAbsolute.x, y: n.internals.positionAbsolute.y, w, h };
}

/**
 * Continuity: solid, heavier. Reference: thinner, dashed by kind. No arrows: relations are not always one-way,
 * so every line ends in a dot at both ends and the kind label says how to read it.
 * Lines float: each end attaches to the side facing the other node. Highlighted lines carry their kind label.
 */
export const FloatingEdge = memo(function FloatingEdge({ source, target, data }: EdgeProps<FlowEdge>) {
  const s = useInternalNode(source),
    t = useInternalNode(target);
  const a = s && boxOf(s),
    b = t && boxOf(t);
  if (!a || !b || !data) return null;

  const g = link(a, b);
  if (data.trace) {
    const style = { "--tc": data.trace } as CSSProperties;
    return (
      <>
        <path className="mm-edge mm-trace" style={style} d={g.d} />
        <ViewportPortal>
          <span className="mm-trace-cap" style={{ ...style, transform: `translate(${g.a.x - 3}px, ${g.a.y - 3}px)` }} />
          <span className="mm-trace-cap" style={{ ...style, transform: `translate(${g.b.x - 3}px, ${g.b.y - 3}px)` }} />
        </ViewportPortal>
      </>
    );
  }
  const cont = data.type === "continuity";
  const state = cn(data.hl && "hl", data.dim && "dim");
  const capClass = cn("mm-ecap", cont && "cont", state);
  const d = CAP_R[data.type] * 2;
  // The dots sit on the card border, centred like the connection points, so they render above the nodes.
  const cap = (x: number, y: number) => (
    <span className={capClass} style={{ width: d, height: d, transform: `translate(${x - d / 2}px, ${y - d / 2}px)` }} />
  );
  return (
    <>
      <path className={cn("mm-edge", cont ? "cont" : `ref k-${data.kind}`, state)} d={g.d} />
      <ViewportPortal>
        {cap(g.a.x, g.a.y)}
        {cap(g.b.x, g.b.y)}
      </ViewportPortal>
      {data.hl && (
        <text className="mm-elabel" x={+g.mx.toFixed(2)} y={+(g.my - 7).toFixed(2)}>
          {EDGE_KIND_LABEL[data.kind]}
        </text>
      )}
    </>
  );
});

export const edgeTypes = { floating: FloatingEdge };
