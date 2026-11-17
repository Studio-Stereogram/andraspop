"use client";

import { LocateFixed, Minus, Plus, Scan } from "lucide-react";
import { useViewport } from "@xyflow/react";
import { Button } from "@/components/ui/button";

/** Bottom-left zoom panel: − · % · + · Fit, plus Today on the Timeline. */
export function ZoomControls({
  onZoom,
  onFit,
  onToday,
}: {
  onZoom: (factor: number) => void;
  onFit: () => void;
  onToday?: () => void;
}) {
  const { zoom } = useViewport();
  return (
    <div className="absolute bottom-3.5 left-3 z-[3] flex items-center gap-0.5 rounded-[var(--r-panel)] border border-line bg-surface p-1 shadow-[var(--shadow)]">
      <Button variant="ghost" size="icon-sm" onClick={() => onZoom(1 / 1.25)} aria-label="Zoom out">
        <Minus />
      </Button>
      <span className="w-11 text-center font-mono text-[11.5px] font-medium text-ink tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <Button variant="ghost" size="icon-sm" onClick={() => onZoom(1.25)} aria-label="Zoom in">
        <Plus />
      </Button>
      <Button variant="ghost" size="sm" onClick={onFit} title="Fit to view (F)">
        <Scan />
        Fit
      </Button>
      {onToday && (
        <Button variant="ghost" size="sm" onClick={onToday} title="Go to today">
          <LocateFixed />
          Today
        </Button>
      )}
    </div>
  );
}
