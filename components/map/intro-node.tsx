"use client";

import { memo, useMemo, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_WIDTH } from "@/lib/map/constants";
import { linkLabel, safeHref } from "@/lib/map/format";
import { parseStatement } from "@/lib/map/intro";
import { cn } from "@/lib/utils";
import { useMapVisual } from "./map-context";
import type { FlowNode } from "./nodes";

/**
 * The intro: the map's one statement, set straight on the grid in big type (no card), the way cluster labels sit
 * on the ground. The sentence is two-tone like the /hi headline; its topic words are live: hover one to trace its
 * entries, click to filter to it. Only the ◆ reference point: the intro is in no series.
 */
export const IntroNode = memo(function IntroNode({ data }: NodeProps<FlowNode>) {
  const { topicById, topicFilter, litTopics, traceTopic, pickTopic } = useMapVisual();
  const n = data.node;
  const parts = useMemo(() => parseStatement(n.summary, topicById), [n.summary, topicById]);
  const links = n.links.flatMap((l) => {
    const href = safeHref(l.url);
    return href ? [{ href, label: linkLabel(l) }] : [];
  });

  return (
    <div className="mm-intro" style={{ width: NODE_WIDTH.intro }}>
      <Handle id="reference" type="source" position={Position.Bottom} isConnectable={false} className="mm-port p-ref" />
      {n.title && <div className="mm-intro-eyebrow">{n.title}</div>}
      <p className="mm-intro-text">
        {parts.map((p, i) => {
          if (p.kind === "text") return p.strong ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>;
          const picked = topicFilter.has(p.id);
          return (
            <button
              key={i}
              type="button"
              className={cn("mm-intro-topic nodrag nopan", (litTopics.size === 0 || litTopics.has(p.id)) && "on", picked && "picked")}
              style={{ "--tc": topicById.get(p.id)?.color } as CSSProperties}
              aria-pressed={picked}
              onPointerEnter={(e) => e.pointerType === "mouse" && traceTopic(p.id)}
              onPointerLeave={() => traceTopic(null)}
              onFocus={() => traceTopic(p.id)}
              onBlur={() => traceTopic(null)}
              onClick={(e) => {
                e.stopPropagation();
                pickTopic(p.id);
              }}
            >
              {p.label}
            </button>
          );
        })}
      </p>
      <div className="mm-intro-foot">
        <div className="mm-intro-legend">
          <span>
            <i className="cont" />
            Next in a series
          </span>
          <span>
            <i className="ref" />
            What it draws on
          </span>
        </div>
        {links.map((l) => (
          <a key={l.href} className="mm-intro-link nodrag nopan" href={l.href}>
            {l.label} <span aria-hidden>→</span>
          </a>
        ))}
      </div>
      <div className="mm-intro-hint">
        <span className="mouse">Hover a topic to trace it, click to filter</span>
        <span className="touch">Tap a topic to filter</span>
      </div>
    </div>
  );
});
