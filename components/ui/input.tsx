import * as React from "react";

import { cn } from "@/lib/utils";

// components.md → Input: 34px, 6px radius, --line-2 border, transparent; hover --ink-3 border; focus = accent ring.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[34px] w-full min-w-0 rounded-md border border-line-2 bg-transparent px-2.5 text-[13.5px] text-ink transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-ink-3 hover:border-ink-3 focus-visible:border-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
