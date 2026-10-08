"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// components.md → Switch: 34×20, --surface-3 off, ink on.
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full bg-surface-3 transition-colors duration-150 data-[state=checked]:bg-ink",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 translate-x-0.5 rounded-full bg-ink-2 transition-[transform,background-color] duration-150 data-[state=checked]:translate-x-4 data-[state=checked]:bg-bg" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
