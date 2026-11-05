"use client";

import { useState } from "react";
import { displayTitle } from "@/lib/map/format";
import { embedUrl, videoFrame } from "@/lib/map/links";
import type { MapNode, Topic } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { Thumb } from "./pieces";

/**
 * The inspector's video: the thumbnail in its platform's frame with a Play button, swapped for the platform's own
 * player when pressed. Nothing loads from YouTube or Instagram before that. Remount with key={node.id} so it resets
 * when the selection changes.
 */
export function Player({ node, topicById }: { node: MapNode; topicById: ReadonlyMap<string, Topic> }) {
  const [playing, setPlaying] = useState(false);
  const src = embedUrl(node.url);
  const title = displayTitle(node);

  if (playing && src) {
    return (
      <div className={cn("mm-thumb lg mm-player", `f-${videoFrame(node)}`, node.platform === "instagram" && "ig")}>
        <iframe
          src={src}
          title={`${title}, video player`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }
  return (
    <Thumb node={node} topicById={topicById} large>
      {src && (
        <button type="button" className="mm-playbtn" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
          <span aria-hidden />
        </button>
      )}
    </Thumb>
  );
}
