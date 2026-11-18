"use client";

import { AndrasLogo } from "@/components/brand/andras-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ActiveMarker, ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VIEWS } from "@/lib/map/constants";
import type { View } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import type { SaveState } from "./editor/use-editor";

export type Mode = "edit" | "public";

/** Editor domain only: save status, Data, and the Edit / Public tabs. */
export interface AppBarEditor {
  mode: Mode;
  onMode: (m: Mode) => void;
  onData: () => void;
  saveState: SaveState;
}

const SAVE_LABEL: Record<SaveState, string> = { saved: "Saved", saving: "Saving…", error: "Not saved" };

/** András Pop's logo as the main brand, then the "mind-map" wordmark (lowercase, as the name is written). */
function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AndrasLogo className="size-[22px] flex-none" />
      <span aria-hidden className="h-4 w-px flex-none bg-line-2" />
      <b className="text-[16px] font-[650] tracking-[-.02em] whitespace-nowrap">mind-map</b>
      <span className="lbl whitespace-nowrap max-[1100px]:hidden">Building in public</span>
    </div>
  );
}

/**
 * Brand left, view tabs centred, Say hi and the theme toggle right. The editor domain adds save status, Data and the
 * Edit / Public tabs on the right; the public domain never shows them.
 */
export function AppBar({ view, onView, editor }: { view: View; onView: (v: View) => void; editor?: AppBarEditor }) {
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
        {editor ? (
          <>
            <span
              aria-live="polite"
              className={cn(
                "mr-1 font-mono text-[10.5px] font-medium tracking-[.08em] whitespace-nowrap uppercase max-[980px]:hidden",
                editor.saveState === "error" ? "text-hot" : "text-ink-3",
              )}
            >
              {SAVE_LABEL[editor.saveState]}
            </span>
            {editor.mode === "edit" && (
              <Button variant="outline" size="sm" onClick={editor.onData}>
                Data
              </Button>
            )}
            <ToggleGroup
              type="single"
              value={editor.mode}
              onValueChange={(m) => m && editor.onMode(m as Mode)}
              aria-label="Mode"
            >
              <ToggleGroupItem value="edit">Edit</ToggleGroupItem>
              <ToggleGroupItem value="public">Public</ToggleGroupItem>
            </ToggleGroup>
          </>
        ) : (
          // /hi is a static page outside the app (public/hi), so a plain link: full page load, no client routing.
          <Button asChild variant="outline" size="sm">
            <a href="/hi">Say hi</a>
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
