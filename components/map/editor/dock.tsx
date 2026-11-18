"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIND_LABEL } from "@/lib/map/constants";
import type { NodeType } from "@/lib/map/types";

const TYPES: NodeType[] = ["video", "link", "bookmark", "person", "note"];

/** Add dock, bottom centre (editor only): Video is the region's one primary button; the rest are ghost. */
export function Dock({ onAdd }: { onAdd: (type: NodeType) => void }) {
  return (
    <div
      role="toolbar"
      aria-label="Add"
      className="absolute bottom-3.5 left-1/2 z-[3] flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-[var(--r-panel)] border border-line bg-surface p-1 shadow-[var(--shadow)] max-[640px]:bottom-[62px]"
    >
      {TYPES.map((t) => (
        <Button key={t} variant={t === "video" ? "default" : "ghost"} size="sm" onClick={() => onAdd(t)}>
          <Plus />
          {KIND_LABEL[t]}
        </Button>
      ))}
      <span className="ml-2 pr-2 font-mono text-[10.5px] font-medium tracking-[.06em] whitespace-nowrap text-ink-3 uppercase max-[900px]:hidden">
        ● series · ◆ reference
      </span>
    </div>
  );
}

/** After a thread is released on empty canvas: create a new entry already connected with that type. */
export function QuickAdd({
  at,
  type,
  onPick,
  onClose,
}: {
  at: { x: number; y: number };
  type: "continuity" | "reference";
  onPick: (t: NodeType) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="menu"
      aria-label="New connected entry"
      className="absolute z-20 grid w-[190px] gap-0.5 rounded-[var(--r-panel)] border border-line-2 bg-surface p-1 shadow-[var(--shadow-pop)]"
      style={{ left: at.x, top: at.y }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <span className="lbl px-2 pt-1.5 pb-1">New {type === "continuity" ? "next in series" : "reference"}</span>
      {TYPES.map((t, i) => (
        <Button
          key={t}
          role="menuitem"
          variant="ghost"
          className="justify-start"
          autoFocus={i === 0}
          onClick={() => onPick(t)}
        >
          <Plus />
          {KIND_LABEL[t]}
        </Button>
      ))}
    </div>
  );
}
