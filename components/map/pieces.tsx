"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { avatarColor, initials, nodeWidth } from "@/lib/map/format";
import { isAllowedThumbnail, videoFrame } from "@/lib/map/links";
import { thumbSVG } from "@/lib/map/thumbnail";
import type { MapNode, Topic } from "@/lib/map/types";

/**
 * A published video's thumbnail in its platform's own frame (16:9, 4:5 or 9:16): the real image when it has one,
 * otherwise (or if it fails to load) the generated sequencer pattern, cropped to the frame either way.
 * `play` adds the ▶ shown on card hover; the inspector's Player adds a real button instead.
 */
export function Thumb({
  node,
  topicById,
  large = false,
  play = false,
  children,
}: {
  node: MapNode;
  topicById: ReadonlyMap<string, Topic>;
  large?: boolean;
  play?: boolean;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const frame = videoFrame(node);
  const cls = cn("mm-thumb", `f-${frame}`, large && "lg");
  const extras = (
    <>
      {play && <span className="mm-play" aria-hidden />}
      {node.duration && <span className="mm-dur">{node.duration}</span>}
      {children}
    </>
  );
  if (node.thumbnail && isAllowedThumbnail(node.thumbnail) && !failed) {
    return (
      <div className={cls}>
        <Image
          src={node.thumbnail}
          alt=""
          fill
          sizes={large ? "320px" : `${nodeWidth(node)}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
        {extras}
      </div>
    );
  }
  // thumbSVG only interpolates numbers and hex colours (normalizeMap rejects anything else).
  const svg = thumbSVG(node, (id) => topicById.get(id));
  return (
    <div className={cls}>
      <div className="h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      {extras}
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
