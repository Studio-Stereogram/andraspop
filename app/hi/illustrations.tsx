import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HAND_FILL, HAND_INK, HAND_VIEWBOX } from "./hand-paths";

/** András's photo, square-cropped for the round portraits (public/hi/andras-square.jpg, 480×480). */
const PHOTO = "/hi/andras-square.jpg";

export function Portrait({ size, className, priority = false }: { size: number; className?: string; priority?: boolean }) {
  return (
    <span className={cn("hi-portrait", className)} style={{ width: size, height: size } as CSSProperties} aria-hidden>
      <Image src={PHOTO} alt="" fill sizes={`${size}px`} priority={priority} className="object-cover" />
    </span>
  );
}

/**
 * The ✌ hand, redrawn from András's icon with a brush feel: the outline is warped slightly, its edge roughened with
 * noise and snapped back to solid ink (so it reads as a dry brush stroke, not a blur). A cream sticker in both themes.
 */
export function Hand({ size = 72, className }: { size?: number; className?: string }) {
  const id = "hi-brush";
  return (
    <span className={cn("hi-hand-wrap", className)} style={{ width: size * (144 / 208), height: size }} aria-hidden>
      <svg viewBox={HAND_VIEWBOX} width="100%" height="100%" className="hi-hand">
        <defs>
          <filter id={`${id}-ink`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={4} result="warp" />
            <feDisplacementMap in="SourceAlpha" in2="warp" scale={4.5} xChannelSelector="R" yChannelSelector="G" result="wob" />
            <feGaussianBlur in="wob" stdDeviation={1} result="soft" />
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves={2} seed={11} result="grain" />
            <feComposite in="soft" in2="grain" operator="arithmetic" k1={0} k2={1.5} k3={0.9} k4={-0.95} result="mix" />
            <feComponentTransfer in="mix" result="edge">
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
            <feFlood floodColor="var(--hi-hand-ink)" />
            <feComposite in2="edge" operator="in" />
          </filter>
          <filter id={`${id}-fill`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={4} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={4.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <path d={HAND_FILL} fill="var(--hi-hand-fill)" filter={`url(#${id}-fill)`} />
        <path d={HAND_INK} fill="#000" fillRule="evenodd" filter={`url(#${id}-ink)`} />
      </svg>
    </span>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The week at a glance: three open 45-minute slots, every Wednesday. Times live on Calendly, so none are shown. */
export function Week() {
  return (
    <figure className="m-0 grid gap-3">
      <div className="hi-week" role="img" aria-label="A week from Monday to Sunday. Wednesday has three open 45-minute slots.">
        {DAYS.map((d, i) => (
          <div key={d} className={cn("hi-day", i === 2 && "wed", i > 4 && "weekend")}>
            <span className="hi-day-name">{d}</span>
            <div className="hi-day-body">
              {i === 2 &&
                [0, 1, 2].map((s) => (
                  <div key={s} className="hi-slot" style={{ "--i": s } as CSSProperties}>
                    <Portrait size={18} />
                    <span className="hi-you" />
                    <span className="truncate">45 min</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] font-medium tracking-[.06em] text-ink-2 uppercase">
        <span>Every Wednesday</span>
        <span aria-hidden>·</span>
        <span>3 slots</span>
        <span aria-hidden>·</span>
        <span>45 min each</span>
      </figcaption>
    </figure>
  );
}
