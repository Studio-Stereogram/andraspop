"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { avatarColor, initials } from "@/lib/map/format";
import { thumbSVG } from "@/lib/map/thumbnail";
import type { MapNode, Topic } from "@/lib/map/types";

/** Generated sequencer thumbnail; ideas and drafts show an empty bracketed grid instead. */
export function Thumb({
  node,
  topicById,
  large = false,
}: {
  node: MapNode;
  topicById: ReadonlyMap<string, Topic>;
  large?: boolean;
}) {
  if (node.status === "idea" || node.status === "draft") {
    return (
      <div className={cn("mm-thumb empty", large && "lg")}>
        <span>
          <b>Not published</b>
        </span>
      </div>
    );
  }
  // thumbSVG only interpolates numbers and hex colours (normalizeMap rejects anything else).
  const svg = thumbSVG(node, (id) => topicById.get(id));
  return (
    <div className={cn("mm-thumb", large && "lg")}>
      <div className="h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      {node.duration && <span className="mm-dur">{node.duration}</span>}
    </div>
  );
}

export function Avatar({ node, large = false }: { node: MapNode; large?: boolean }) {
  return (
    <span className={cn("mm-avatar", large && "lg")} style={{ "--av": avatarColor(node) } as CSSProperties} aria-hidden>
      {initials(node.title)}
    </span>
  );
}

export function TopicTags({ topics }: { topics: Topic[] }) {
  if (!topics.length) return null;
  return (
    <div className="mm-tags">
      {topics.map((t) => (
        <span key={t.id} className="mm-tag" style={{ "--tc": t.color } as CSSProperties}>
          {t.name}
        </span>
      ))}
    </div>
  );
}

/** The ● and ◆ glyphs used for connection types in headings and legends. */
export function PortGlyph({ type }: { type: "continuity" | "reference" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "box-border inline-block flex-none border-[1.5px] border-ink-2",
        type === "continuity" ? "size-[9px] rounded-full" : "size-2 rotate-45",
      )}
    />
  );
}
