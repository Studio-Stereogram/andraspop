"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

// components.md → Popover: anchored under its trigger with a 12px rotated-square caret pointing at the trigger
// centre; clamps to the viewport; --shadow-pop. Fades/scales in over 140ms.
function PopoverContent({
  className,
  children,
  sideOffset = 10,
  collisionPadding = 12,
  caret = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & { caret?: boolean }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 origin-(--radix-popover-content-transform-origin) rounded-[var(--r-panel)] border border-line-2 bg-surface text-ink shadow-[var(--shadow-pop)] outline-none data-[state=open]:animate-[pop-in_var(--dur-pop)_ease-out]",
          className,
        )}
        {...props}
      >
        {children}
        {caret && (
          // Radix flips the arrow towards the trigger; the 1px shift lets it cover the panel's border.
          <PopoverPrimitive.Arrow asChild width={12} height={7}>
            <span className="block h-[7px] w-3 -translate-y-px overflow-hidden">
              <span className="mx-auto block size-3 -translate-y-1.5 rotate-45 rounded-br-[2px] border-r border-b border-line-2 bg-surface" />
            </span>
          </PopoverPrimitive.Arrow>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
