import * as React from "react";

import { cn } from "@/lib/utils";

// components.md → Kbd: mono 10.5px, 1px border with 2px bottom border.
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "min-w-[17px] rounded-sm border border-b-2 border-line-2 px-1 text-center font-mono text-[10.5px] leading-[15px] font-medium text-ink-3",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
