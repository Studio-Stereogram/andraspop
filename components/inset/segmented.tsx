"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

// A segmented choice for the stage toolbars: plain labels in a soft track, and a white thumb that slides to
// the chosen one (after microinteractions.dev's tab indicator). Each option can lead with a small mark: a
// theme's swatch dots, a shape's glyph. A radio group to assistive tech: Left/Right (or Up/Down) move and
// choose, Home/End jump; only the chosen option is a tab stop.

export type Segment<K extends string> = { key: K; label: string; mark?: ReactNode };

type Props<K extends string> = {
  options: Segment<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
};

export function Segmented<K extends string>({ options, value, onChange, label }: Props<K>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const index = Math.max(0, options.findIndex((o) => o.key === value));

  // measure the chosen segment (again on resize, since the track can wrap on narrow screens)
  useLayoutEffect(() => {
    const el = refs.current[index];
    if (!el) return;
    const measure = () => setThumb({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [index, options.length]);

  const choose = (i: number) => {
    const next = (i + options.length) % options.length;
    onChange(options[next].key);
    refs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") choose(index + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") choose(index - 1);
    else if (e.key === "Home") choose(0);
    else if (e.key === "End") choose(options.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="seg" role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {thumb && <span className="seg-thumb" aria-hidden style={{ left: thumb.x, top: thumb.y, width: thumb.w, height: thumb.h }} />}
      {options.map((o, i) => (
        <button
          key={o.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.key === value}
          tabIndex={o.key === value ? 0 : -1}
          className="seg-opt"
          onClick={() => onChange(o.key)}
        >
          {o.mark ? <span className="seg-mark" aria-hidden>{o.mark}</span> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A theme's three key colours as overlapping dots. */
export function SwatchDots({ colours }: { colours: string[] }) {
  return (
    <span className="seg-dots">
      {colours.map((c, i) => (
        <i key={i} style={{ background: c }} />
      ))}
    </span>
  );
}
