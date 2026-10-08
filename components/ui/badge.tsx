import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// components.md → Badge. Status = tinted pill (15% tint, 38% border, dot, 11px/500), text mixed towards ink.
// Platform = outline, mono 10px, 4px radius.
const badgeVariants = cva("inline-flex shrink-0 items-center whitespace-nowrap", {
  variants: {
    variant: {
      status:
        "h-5 gap-[5px] rounded-full border border-[color-mix(in_srgb,var(--sc)_38%,transparent)] bg-[color-mix(in_srgb,var(--sc)_15%,transparent)] px-2 text-[11px] leading-none font-medium text-[color-mix(in_srgb,var(--sc)_55%,var(--ink))] before:size-1.5 before:rounded-full before:bg-[var(--sc)] before:content-['']",
      outline:
        "h-[18px] rounded-sm border border-line-2 px-1.5 font-mono text-[10px] leading-none font-medium tracking-[.06em] text-ink-2",
    },
    tone: {
      idea: "[--sc:var(--st-idea)]",
      draft: "[--sc:var(--st-draft)]",
      scheduled: "[--sc:var(--st-sched)]",
      published: "[--sc:var(--st-pub)]",
      private: "[--sc:var(--ink-3)]",
      sample: "[--sc:var(--st-draft)]",
    },
  },
  defaultVariants: { variant: "status", tone: "idea" },
});

function Badge({ className, variant, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant ?? "status"}
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
