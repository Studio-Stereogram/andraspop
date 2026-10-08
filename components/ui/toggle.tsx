"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// components.md → Toggle group (filter chips): 28px, 6px radius, outline.
// Pressed = inverted (ink fill, bg text) plus a check mark. Topic chips lead with an 8px topic square (--tc).
const toggleVariants = cva(
  "inline-flex h-7 items-center gap-[7px] rounded-md border border-line-2 bg-transparent px-[9px] text-[12.5px] font-medium whitespace-nowrap text-ink-2 transition-[background-color,border-color,color] duration-[var(--dur-fast)] hover:bg-surface-2 hover:text-ink data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-bg data-[state=on]:after:-ml-px data-[state=on]:after:h-[5px] data-[state=on]:after:w-[9px] data-[state=on]:after:translate-x-px data-[state=on]:after:-translate-y-px data-[state=on]:after:-rotate-45 data-[state=on]:after:border-b-[1.6px] data-[state=on]:after:border-l-[1.6px] data-[state=on]:after:border-current data-[state=on]:after:content-['']",
  {
    variants: {
      dot: {
        true: "before:size-2 before:rounded-[2px] before:bg-[var(--tc)] before:content-['']",
        false: "",
      },
    },
    defaultVariants: { dot: false },
  },
);

function Toggle({
  className,
  dot,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ dot }), className)} {...props} />;
}

/** Count shown inside a chip, mono --ink-3 (dimmed when the chip is pressed). */
function ToggleCount({ className, ...props }: React.ComponentProps<"i">) {
  return (
    <i
      className={cn(
        "font-mono text-[10.5px] font-medium not-italic text-ink-3 [[data-state=on]_&]:text-current [[data-state=on]_&]:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Toggle, ToggleCount, toggleVariants };
