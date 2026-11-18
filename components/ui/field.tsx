import * as React from "react";

import { cn } from "@/lib/utils";

// components.md → Input / Textarea / Select: 34px, 6px radius, --line-2 border, transparent; hover --ink-3 border;
// focus = accent ring (globals.css :focus-visible). Labels: sentence case 12.5px/500 --ink-2 in the inspector.
const control =
  "w-full min-w-0 rounded-md border border-line-2 bg-transparent px-2.5 text-[13.5px] text-ink transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-ink-3 hover:border-ink-3 focus-visible:border-ink-2";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(control, "min-h-[84px] resize-y py-2 leading-[1.45]", className)} {...props} />;
}

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn(control, "h-[34px] bg-surface pr-7", className)} {...props} />;
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("grid min-w-0 gap-1.5", className)}>
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return <input type="checkbox" className={cn("size-4 flex-none accent-[var(--ink)]", className)} {...props} />;
}

export { Textarea, Select, Field, Checkbox };
