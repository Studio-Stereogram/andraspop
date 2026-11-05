import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * András's photo. Until public/hi/andras.jpg is added, a monogram stands in. To use the photo, put a square image at
 * public/hi/andras.jpg and set PHOTO to "/hi/andras.jpg".
 */
const PHOTO: string | null = null;

export function Portrait({ size, className }: { size: number; className?: string }) {
  return (
    <span
      className={cn("hi-portrait", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) } as CSSProperties}
      aria-hidden
    >
      {PHOTO ? <Image src={PHOTO} alt="" fill sizes={`${size}px`} className="object-cover" /> : size >= 28 ? "AP" : null}
    </span>
  );
}

/** A hand-drawn-style waving hand: outlined, in the page's sun colour, with two motion arcs. Waves once on load. */
export function Wave({ size = 56, className }: { size?: number; className?: string }) {
  const parts = (
    <>
      <rect x="18" y="28" width="28.5" height="27" rx="11" />
      <rect x="18.4" y="12" width="7.8" height="26" rx="3.9" />
      <rect x="25.7" y="8" width="7.8" height="28" rx="3.9" />
      <rect x="33" y="10" width="7.8" height="26" rx="3.9" />
      <rect x="40.2" y="16" width="7.4" height="21" rx="3.7" />
      <rect x="14.5" y="29" width="8" height="21" rx="4" transform="rotate(-40 19 47)" />
    </>
  );
  return (
    <span className={cn("hi-wave", className)} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 64 64" width={size * 0.72} height={size * 0.72} overflow="visible">
        <g transform="rotate(-10 32 56)">
          <g className="hi-hand">
            {/* outline: the same shapes drawn fat in ink underneath, then filled on top, so they read as one hand */}
            <g fill="var(--hi-sun-ink)" stroke="var(--hi-sun-ink)" strokeWidth="4.4" strokeLinejoin="round">
              {parts}
            </g>
            <g fill="var(--hi-sun)">{parts}</g>
            <g stroke="var(--hi-sun-ink)" strokeWidth="1.6" strokeLinecap="round" fill="none">
              <path d="M26.1 16v18M33.4 14.5v19.5M40.6 20.5v13.5" />
            </g>
          </g>
        </g>
        <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M51 9c4.5 2.8 6.6 7 6.4 12" />
          <path d="M55.5 2.5c7 4.4 10 11 9.5 19" opacity=".55" />
          <path d="M10 12c-3.8 2.6-5.6 6.2-5.8 10.4" />
        </g>
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
                  <div key={s} className="hi-slot">
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
