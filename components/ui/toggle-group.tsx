"use client";

import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// components.md → Tabs look (view switch, mode switch, status picker): muted track (--surface-2, 1px --line,
// 8px radius, 3px padding), 28px items at 13px/500; the active item is raised (--surface, --line-2 border, --shadow-sm).
// Built on ToggleGroup (single) rather than Tabs because these switch a view, they don't own tab panels.
function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-2 p-[3px]", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "group/tab inline-flex h-7 items-center gap-[7px] rounded-md border border-transparent px-[11px] text-[13px] font-medium whitespace-nowrap text-ink-3 transition-colors duration-[var(--dur-fast)] hover:text-ink data-[state=on]:border-line-2 data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-[var(--shadow-sm)] [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** The 6px --hot square shown on the active view tab. */
function ActiveMarker() {
  return <span aria-hidden className="hidden size-1.5 bg-hot group-data-[state=on]/tab:block" />;
}

export { ToggleGroup, ToggleGroupItem, ActiveMarker };
