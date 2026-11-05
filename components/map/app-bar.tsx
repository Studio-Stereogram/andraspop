"use client";

import Link from "next/link";
import { AndrasLogo } from "@/components/brand/andras-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ActiveMarker, ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VIEWS } from "@/lib/map/constants";
import type { View } from "@/lib/map/types";

/** András Pop's logo as the main brand, then the "mind-map" wordmark (lowercase, as the name is written). */
function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AndrasLogo className="size-[22px] flex-none" />
      <span aria-hidden className="h-4 w-px flex-none bg-line-2" />
      <b className="text-[15px] font-[650] tracking-[.01em] whitespace-nowrap [font-stretch:112%]">mind-map</b>
      <span className="lbl whitespace-nowrap max-[1100px]:hidden">Building in public</span>
    </div>
  );
}

/** Brand left, view tabs centred, Say hi and the theme toggle right. The public domain has no Data or Edit/Public controls. */
export function AppBar({ view, onView }: { view: View; onView: (v: View) => void }) {
  return (
    <header className="z-10 grid flex-none grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2.5 border-b border-line bg-bg px-3.5 py-2.5 max-[980px]:gap-2 max-[980px]:px-2.5 max-[980px]:py-2 max-[640px]:grid-cols-[minmax(0,1fr)_auto]">
      <Brand />
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && onView(v as View)}
        aria-label="View"
        className="max-[640px]:col-span-full max-[640px]:row-start-2 max-[640px]:justify-self-center"
      >
        {VIEWS.map((v) => (
          <ToggleGroupItem key={v.id} value={v.id}>
            <ActiveMarker />
            {v.label}
            <Kbd className="group-data-[state=on]/tab:text-ink-2 max-[980px]:hidden">{v.key}</Kbd>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex items-center gap-1.5 justify-self-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/hi">Say hi</Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
