"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

// components.md → Dialog (Data / JSON): 12px radius, display-face uppercase title, ghost close icon.
function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-[fade-in_var(--dur-pop)_ease-out]" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-32px)] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[var(--r-dialog)] border border-line-2 bg-surface text-ink shadow-[var(--shadow-pop)] outline-none data-[state=open]:animate-[fade-in_var(--dur-pop)_ease-out]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-5 py-4">
      <div className="grid gap-1">
        <DialogPrimitive.Title className="m-0 text-[22px] leading-none font-[650] uppercase [font-stretch:112%]">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="m-0 text-[13px] text-ink-3">{description}</DialogPrimitive.Description>
        )}
      </div>
      <DialogPrimitive.Close asChild>
        <Button variant="ghost" size="icon-sm" className="ml-auto" aria-label="Close">
          <X />
        </Button>
      </DialogPrimitive.Close>
    </div>
  );
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader };
