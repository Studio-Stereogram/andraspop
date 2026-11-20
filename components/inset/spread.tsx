"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Progressive disclosure, shared by the insets. The diagram is the surface (titles and a few words).
// Opening an item unfolds a spread: a near full-bleed printed title and a short lede. "Read more"
// unfolds the rest, set as quiet editorial rows. The last item stays rendered while the spread folds away.

export type SpreadItem = {
  key: string;
  kicker: string;
  title: string;
  lede: ReactNode;
  rows: { label: string; content: ReactNode }[];
};

type Props = { id: string; item: SpreadItem | null };

export function Spread({ id, item }: Props) {
  const [shown, setShown] = useState<SpreadItem | null>(item);
  const ref = useRef<HTMLDivElement>(null);
  if (item && item !== shown) setShown(item);

  // Bring the spread into view when an item opens below the fold.
  useEffect(() => {
    if (!item || !ref.current) return;
    const el = ref.current;
    const t = window.setTimeout(() => {
      const top = el.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.7) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [item]);

  return (
    <div ref={ref} className="ed-fold" id={id} data-open={item ? true : undefined} role="region" aria-label={shown?.title} inert={!item}>
      <div className="ed-clip">{shown && <SpreadBody key={shown.key} item={shown} />}</div>
    </div>
  );
}

function SpreadBody({ item }: { item: SpreadItem }) {
  const [more, setMore] = useState(false);
  const moreId = `${item.key}-more`;

  return (
    <article className="ed">
      <div className="ed-inner">
        <p className="ed-kicker">{item.kicker}</p>
        <h2 className="ed-title in-serif">{item.title}</h2>
        <div className="ed-lede">{item.lede}</div>
        <button type="button" className="ed-reveal" aria-expanded={more} aria-controls={moreId} onClick={() => setMore(!more)}>
          {more ? "Show less" : "Read more"}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="ed-more" id={moreId} data-open={more || undefined} inert={!more}>
          <div className="ed-clip">
            <dl className="ed-rows">
              {item.rows.map((row) => (
                <div key={row.label} className="ed-row">
                  <dt>{row.label}</dt>
                  <dd>{row.content}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}

/** A list of titled entries, set in two columns on wide screens. */
export function EdList({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <ul className="ed-list">
      {items.map((it) => (
        <li key={it.title}>
          <span className="ed-list-title">{it.title}</span>
          <span className="ed-list-desc">{it.desc}</span>
        </li>
      ))}
    </ul>
  );
}
