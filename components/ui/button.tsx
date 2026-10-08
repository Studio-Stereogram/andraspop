import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// components.md → Button: 32px, 6px radius, 13px/500, icon gap 7px; `sm` = 28px. One primary per region.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[7px] whitespace-nowrap rounded-md border font-sans text-[13px] font-medium no-underline transition-[background-color,border-color,color,opacity] duration-[var(--dur-fast)] active:translate-y-[.5px] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-bg hover:opacity-88",
        outline: "border-line-2 bg-transparent text-ink hover:border-ink-3 hover:bg-surface-2",
        secondary: "border-transparent bg-surface-2 text-ink hover:bg-surface-3",
        ghost: "border-transparent bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
        destructive: "border-hot/45 bg-transparent text-hot hover:bg-hot/12",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5 text-[12.5px]",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    compoundVariants: [
      // Toggle buttons (e.g. Filters while open) use aria-pressed and the surface-2 wash.
      { variant: ["outline", "ghost"], className: "aria-pressed:bg-surface-2 aria-expanded:bg-surface-2" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
