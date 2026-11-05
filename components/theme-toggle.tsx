"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEME_KEY } from "@/lib/theme";

function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

/** Dark ⇄ Paper. Shared by the map's app bar and /hi; the choice is remembered (lib/theme.ts). */
export function ThemeToggle() {
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
