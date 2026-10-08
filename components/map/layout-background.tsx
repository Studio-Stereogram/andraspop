"use client";

import type { CSSProperties } from "react";
import { ViewportPortal } from "@xyflow/react";
import type { LayoutBackground as Background } from "@/lib/map/layouts";
import { cn } from "@/lib/utils";
import { useMapVisual } from "./map-context";

const f2 = (v: number) => +v.toFixed(2);

/** What a view draws behind the nodes: topic regions and labels (Clusters) or lanes, ticks and Today (Timeline). */
export function LayoutBackground({ background }: { background: Background }) {
  const { topicFilter } = useMapVisual();
  if (!background) return null;

  if (background.type === "cluster") {
    const off = (id: string) => topicFilter.size > 0 && !topicFilter.has(id);
    return (
      <ViewportPortal>
        <div className="mm-bg" aria-hidden>
          <svg className="mm-halos">
            {background.halos.map(({ topic, rects }) => (
              <g key={topic.id} className={cn("mm-halo", off(topic.id) && "off")} style={{ "--tc": topic.color } as CSSProperties}>
                {rects.map((r, i) => (
                  <rect key={i} x={f2(r.x)} y={f2(r.y)} width={f2(r.w)} height={f2(r.h)} rx={20} />
                ))}
              </g>
            ))}
          </svg>
          {background.labels.map((l) => (
            <div
              key={l.topic.id}
              className={cn("mm-cl-label", off(l.topic.id) && "off")}
              style={{ "--tc": l.topic.color, left: f2(l.x), top: f2(l.y) } as CSSProperties}
            >
              {l.topic.name}
              <small>{String(l.count).padStart(2, "0")}</small>
            </div>
          ))}
        </div>
      </ViewportPortal>
    );
  }

  const b = background;
  return (
    <ViewportPortal>
      <div className="mm-bg" aria-hidden>
        {b.lanes.map((l) => (
          <div key={l.label} className="mm-lane" style={{ left: -60, top: l.y, width: b.w + 60, height: l.h }}>
            <h3>{l.label}</h3>
          </div>
        ))}
        {b.ticks.map((t) => (
          <div key={t.x} className={cn("mm-tick", t.month && "month")} style={{ left: t.x, top: -34, height: b.h + 34 }}>
            <span>{t.label}</span>
          </div>
        ))}
        <div className="mm-tick today" style={{ left: b.today, top: -34, height: b.h + 34 }}>
          <span>Today</span>
        </div>
        <div className="mm-backlog" style={{ left: b.backlogX, top: 0, height: b.h }}>
          <span>Backlog · no date yet</span>
        </div>
      </div>
    </ViewportPortal>
  );
}
