"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

// A tick rail (after microinteractions.dev's study): one short tick per item, top to bottom. The ticks grow
// around the pointer with a cosine falloff over three rows, and a small card names the item under it, which
// is also previewed. A click or tap selects (again to release). Keys: Up/Down move, Home/End jump,
// Enter/Space select, Escape clears. With reduced motion the ticks change length at once.

export type TickItem<K extends string> = { key: K; label: string; hint: string };

type Props<K extends string> = {
  items: TickItem<K>[];
  selected: K | null;
  onSelect: (key: K | null) => void;
  /** The item under the pointer or keyboard focus, or null: lets the caller preview it. */
  onPreview: (key: K | null) => void;
  label: string;
  disabled?: boolean;
};

const ROW = 30; // px between tick centres
const FALLOFF = 3; // rows

export function TickRail<K extends string>({ items, selected, onSelect, onPreview, label, disabled }: Props<K>) {
  const [pointerY, setPointerY] = useState<number | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  // whether focus came from the keyboard: only then does a focused tick grow and show its card
  const [keyboard, setKeyboard] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const near = pointerY === null ? null : Math.max(0, Math.min(items.length - 1, Math.round(pointerY / ROW - 0.5)));
  const kbdIdx = keyboard ? focusIdx : null;
  const lit = near ?? kbdIdx; // the tick whose card shows
  const grow = (i: number) => {
    if (pointerY !== null) {
      const d = Math.abs(pointerY / ROW - 0.5 - i);
      return d < FALLOFF ? (1 + Math.cos((Math.PI * d) / FALLOFF)) / 2 : 0;
    }
    return i === kbdIdx ? 1 : 0;
  };

  const preview = (i: number | null) => onPreview(i === null ? null : items[i].key);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return; // a finger can't hover: taps select instead
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    setPointerY(y);
    const i = Math.max(0, Math.min(items.length - 1, Math.round(y / ROW - 0.5)));
    preview(i);
  };
  const onLeave = () => {
    setPointerY(null);
    preview(kbdIdx);
  };

  const move = (i: number) => {
    const next = (i + items.length) % items.length;
    refs.current[next]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = focusIdx ?? 0;
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(items.length - 1);
    else if (e.key === "Escape") {
      onSelect(null);
      setFocusIdx(null);
      preview(null);
      (document.activeElement as HTMLElement | null)?.blur();
    } else return;
    e.preventDefault();
  };

  // roving tab stop: the selected tick, else the first
  const tabStop = Math.max(0, items.findIndex((it) => it.key === selected));

  return (
    <div
      className="tr"
      role="group"
      aria-label={label}
      inert={disabled}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onKeyDown={onKey}
      style={{ "--row": `${ROW}px` } as CSSProperties}
    >
      {items.map((it, i) => (
        <button
          key={it.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          className="tr-tick"
          aria-pressed={selected === it.key}
          aria-label={`${it.label}: ${it.hint}`}
          tabIndex={i === tabStop ? 0 : -1}
          data-selected={selected === it.key || undefined}
          style={{ "--grow": grow(i) } as CSSProperties}
          onClick={() => onSelect(selected === it.key ? null : it.key)}
          onFocus={(e) => {
            setFocusIdx(i);
            // only keyboard focus shows the card: after a click or tap the pointer has already done its job
            const kbd = e.currentTarget.matches(":focus-visible");
            setKeyboard(kbd);
            if (kbd) preview(i);
          }}
          onBlur={() => {
            setFocusIdx(null);
            setKeyboard(false);
            if (pointerY === null) preview(null);
          }}
        >
          <span className="tr-line" aria-hidden />
        </button>
      ))}
      <span className="tr-card" aria-hidden data-visible={lit !== null || undefined} style={{ "--at": lit ?? 0 } as CSSProperties}>
        {lit !== null ? (
          <>
            <span className="tr-card-label">{items[lit].label}</span>
            <span className="tr-card-hint">{items[lit].hint}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
