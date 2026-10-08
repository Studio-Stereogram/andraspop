"use client";

import type { CSSProperties } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Toggle, ToggleCount } from "@/components/ui/toggle";
import { PLATFORMS } from "@/lib/map/constants";
import type { MapData, Platform } from "@/lib/map/types";
import { activeFilterCount, type Filters, NO_FILTERS } from "@/lib/map/visibility";

function toggled<T>(set: ReadonlySet<T>, v: T): Set<T> {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

/**
 * Filters as a mega-menu popover under its button: search and the hide switch across the top, then Topics and
 * Platform columns, and a footer with the result count. Stays open while toggling; Esc or an outside click closes it.
 * (Status filters arrive with the editor in M2; visitors only ever see published and scheduled videos.)
 */
export function FiltersPopover({
  map,
  filters,
  onChange,
  open,
  onOpenChange,
  excluded,
}: {
  map: MapData;
  filters: Filters;
  onChange: (f: Filters) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nodes the filters dim or hide. */
  excluded: number;
}) {
  const count = activeFilterCount(filters);
  const shown = map.nodes.length - excluded;
  const platforms = Object.keys(PLATFORMS) as Platform[];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-ink" title="Filter the map" aria-pressed={open}>
          <SlidersHorizontal />
          <span className="max-[640px]:hidden">Filters</span>
          {count > 0 && (
            <span className="h-[18px] min-w-[18px] rounded-full bg-hot px-[5px] text-center font-mono text-[10.5px] leading-[18px] font-semibold text-white">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Filters"
        className="w-[min(760px,calc(100vw-24px))] p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector("input")?.focus({ preventScroll: true });
        }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-line px-4 py-3.5 max-[720px]:grid-cols-1">
          <div className="relative">
            <Search className="pointer-events-none absolute top-[9px] left-2.5 size-4 text-ink-3" aria-hidden />
            <Input
              type="search"
              placeholder="Search titles and takes"
              aria-label="Search"
              className="pl-8"
              value={filters.q}
              onChange={(e) => onChange({ ...filters, q: e.target.value })}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-2">
            <Switch checked={filters.hide} onCheckedChange={(hide) => onChange({ ...filters, hide })} />
            Hide non-matching
          </label>
        </div>

        <div className="grid max-h-[calc(100dvh-230px)] grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] overflow-auto max-[720px]:grid-cols-1">
          <section className="grid min-w-0 content-start gap-2.5 p-4" aria-label="Topics">
            <span className="lbl">Topics</span>
            <p className="m-0 text-[12.5px] leading-[1.4] text-ink-3">Show content tagged with any of these.</p>
            <div className="flex flex-wrap gap-1.5">
              {map.topics.map((t) => (
                <Toggle
                  key={t.id}
                  dot
                  style={{ "--tc": t.color } as CSSProperties}
                  pressed={filters.topics.has(t.id)}
                  onPressedChange={() => onChange({ ...filters, topics: toggled(filters.topics, t.id) })}
                >
                  {t.name} <ToggleCount>{map.nodes.filter((n) => n.topics.includes(t.id)).length}</ToggleCount>
                </Toggle>
              ))}
            </div>
          </section>
          <section
            className="grid min-w-0 content-start gap-2.5 border-l border-line p-4 max-[720px]:border-t max-[720px]:border-l-0"
            aria-label="Platform"
          >
            <span className="lbl">Platform</span>
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <Toggle
                  key={p}
                  pressed={filters.platforms.has(p)}
                  onPressedChange={() => onChange({ ...filters, platforms: toggled(filters.platforms, p) })}
                >
                  {PLATFORMS[p].label}{" "}
                  <ToggleCount>{map.nodes.filter((n) => n.type === "video" && n.platform === p).length}</ToggleCount>
                </Toggle>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between rounded-b-[var(--r-panel)] border-t border-line bg-surface-2 py-2.5 pr-3 pl-4 font-mono text-[11px] font-medium tracking-[.06em] text-ink-3">
          <span aria-live="polite">
            {shown} shown{excluded > 0 && ` · ${excluded} ${filters.hide ? "hidden" : "dimmed"}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...NO_FILTERS, hide: filters.hide })}
            disabled={count === 0}
          >
            Clear filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
