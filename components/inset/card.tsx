"use client";

import { ViewTransition } from "react";
import { cardStyle, type Inset } from "@/lib/inset/insets";
import { CardArt } from "./card-art";

// The card is 228 × 288 with its art in the top 196 × 120, title set bottom-left in Geist Serif.
// The card body and its title carry view-transition names, so on the way into an inset the card
// shrinks into the switcher's tile and the title flies into its label (and back on the way home).

export const CARD_W = 228;
export const CARD_H = 288;
const ART_W = 196;
const ART_H = 120;

export const cardName = (slug: string) => `inset-card-${slug}`;
export const titleName = (slug: string) => `inset-title-${slug}`;

type Props = {
  inset: Inset;
  /** Index shown on the card's corner. */
  index: number;
  /** Render without its title (the tile copy) and without animating. */
  bare?: boolean;
};

export function CardFace({ inset, index, bare }: Props) {
  return (
    <div className="in-card" style={cardStyle(inset)}>
      <div className="in-card-art">
        <CardArt kind={inset.art} ink={inset.ink} width={ART_W} height={ART_H} still={bare} />
      </div>
      {!bare && (
        <>
          <span className="in-card-index">{String(index + 1).padStart(2, "0")}</span>
          {inset.status === "in-progress" && <span className="in-card-status">In progress</span>}
        </>
      )}
      {!bare && (
        <ViewTransition name={titleName(inset.slug)} share="in-morph" default="none">
          <h2 className="in-card-title in-serif">{inset.cardTitle}</h2>
        </ViewTransition>
      )}
    </div>
  );
}

/** The card as it sits in the home fan, with its shared-element name. */
export function Card(props: Props) {
  return (
    <ViewTransition
      name={cardName(props.inset.slug)}
      share="in-morph"
      enter="in-rise"
      exit="in-sink"
      default="none"
    >
      <div className="in-card-shell">
        <CardFace {...props} />
      </div>
    </ViewTransition>
  );
}
