"use client";

import { useState, type CSSProperties } from "react";
import { INSETS, cardStyle, insetIndex } from "@/lib/inset/insets";
import { insetPath } from "@/lib/inset/routing";
import { Card } from "./card";
import { InsetLink } from "./inset-link";
import { Sticker } from "./sticker";

// Home: a headline whose tokens point at the cards, and the cards fanned out below.
// Hovering a token or a card lifts that card; the fan opens up while the pointer is over it.

const FAN = [
  { x: -258, y: 24, r: -9 },
  { x: -86, y: -2, r: -3 },
  { x: 86, y: 4, r: 3 },
  { x: 258, y: 26, r: 9 },
];

export function InsetHome() {
  const [hot, setHot] = useState<string | null>(null);

  return (
    <main className="in-home">
      <section className="in-hero">
        <h1 className="in-hero-title">
          <span className="w-300">Small maps of </span>
          {INSETS.map((inset, i) => {
            const last = i === INSETS.length - 1;
            const punct = last ? "." : i < INSETS.length - 2 ? "," : "";
            return (
              <span key={inset.slug}>
                {last ? <span className="w-200">and </span> : null}
                {/* keep each token with its punctuation, so a comma never starts a line */}
                <span className="nowrap">
                  <InsetLink
                    href={insetPath(inset.slug)}
                    className="in-token"
                    style={cardStyle(inset)}
                    onPointerEnter={() => setHot(inset.slug)}
                    onPointerLeave={() => setHot(null)}
                    onFocus={() => setHot(inset.slug)}
                    onBlur={() => setHot(null)}
                  >
                    <Sticker shape={inset.token.shape} />
                    {inset.token.word}
                  </InsetLink>
                  <span className="w-300">{punct}</span>
                </span>{" "}
              </span>
            );
          })}
        </h1>
        <p className="in-hero-sub">Notions drawn small enough to hold, one idea per inset.</p>
      </section>

      <ul className="in-fan" data-hot={hot ?? undefined} aria-label="Insets">
        {INSETS.map((inset) => {
          const i = insetIndex(inset.slug);
          const pos = FAN[i % FAN.length];
          const style = { "--x": `${pos.x}px`, "--y": `${pos.y}px`, "--r": `${pos.r}deg`, zIndex: i + 1 } as CSSProperties;
          return (
            <li key={inset.slug} className="in-fan-slot" style={style} data-hot={hot === inset.slug || undefined}>
              <InsetLink
                href={insetPath(inset.slug)}
                className="in-fan-link"
                aria-label={`${inset.title}: ${inset.summary}`}
                onPointerEnter={() => setHot(inset.slug)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(inset.slug)}
                onBlur={() => setHot(null)}
              >
                <Card inset={inset} index={i} />
              </InsetLink>
            </li>
          );
        })}
      </ul>

      <p className="in-home-foot">
        {INSETS.length} insets, more on the way. By <a href="https://andraspop.com">András Pop</a>.
      </p>
    </main>
  );
}
