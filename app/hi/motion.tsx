"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Runs before first paint (inline in the page), so blocks start hidden only when they will be revealed. */
export const MOTION_SCRIPT = `(function(e){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)e.classList.add("hi-motion")}catch(_){}})(document.currentScript.parentElement)`;

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Reveals each `.hi-reveal` block as it scrolls into view, staggering blocks that arrive together. Also covers client
 * navigation to /hi (where the inline script doesn't run) by switching motion on before paint.
 */
export function RevealObserver() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".hi");
    if (!root || reduced()) return;
    root.classList.add("hi-motion");
    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.setProperty("--stagger", `${n++ * 90}ms`);
          el.classList.add("in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    root.querySelectorAll(".hi-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/**
 * Phones only: the booking button pinned to the bottom of the screen, shown whenever neither of the page's own
 * booking buttons is on screen. Hidden copies are inert, so keyboard and screen-reader users never meet a duplicate.
 */
export function StickyBook({ href }: { href: string }) {
  const [show, setShow] = useState(false);
  const visible = useRef(new Set<Element>());
  useEffect(() => {
    const targets = document.querySelectorAll("[data-book-inline]");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.current.add(e.target);
        else visible.current.delete(e.target);
      }
      setShow(visible.current.size === 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return (
    <div className={cn("hi-sticky min-[641px]:hidden", show && "on")} inert={!show}>
      <Button asChild className="h-12 w-full text-[15px] [&_svg]:size-[18px]">
        <a href={href}>
          Pick a Wednesday slot
          <ArrowUpRight aria-hidden />
        </a>
      </Button>
    </div>
  );
}
