"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ActiveMarker, ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VIEWS } from "@/lib/map/constants";
import type { View } from "@/lib/map/types";
import { THEME_KEY } from "@/lib/theme";

function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function ThemeToggle() {
  const paper = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("paper"),
    () => false,
  );
  const toggle = () => {
    document.documentElement.classList.toggle("paper", !paper);
    try {
      localStorage.setItem(THEME_KEY, paper ? "dark" : "paper");
    } catch {}
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={paper ? "Switch to Dark theme" : "Switch to Paper theme"}
      title="Switch theme"
    >
      {paper ? <Moon /> : <Sun />}
    </Button>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden className="flex-none">
        <circle cx="5" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 7h8" stroke="currentColor" strokeWidth="1.5" />
        <rect x="17" y="2" width="9" height="10" fill="var(--hot)" />
      </svg>
      <b className="text-[15px] font-[650] tracking-[.01em] whitespace-nowrap uppercase [font-stretch:112%]">Meta Map</b>
      <span className="lbl whitespace-nowrap max-[1100px]:hidden">Building in public · sample data</span>
    </div>
  );
}

/** Brand left, view tabs centred, theme toggle right. The public domain has no Data or Edit/Public controls. */
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
      <div className="flex items-center gap-2 justify-self-end">
        <ThemeToggle />
      </div>
    </header>
  );
}
