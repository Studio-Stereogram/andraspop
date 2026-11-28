"use client";

import { DropdownMenu } from "radix-ui";
import { ViewTransition, useLayoutEffect, useRef, useState } from "react";
import { INSETS, cardStyle, directionBetween, type Inset } from "@/lib/inset/insets";
import { insetPath } from "@/lib/inset/routing";
import { cardName, titleName } from "./card";
import { InsetLink } from "./inset-link";
import { CardArt } from "./card-art";

// The smart dropdown in the top-left of every inset. Its tile is a square crop of the card's art:
// coming from home the card flies into it. It lists every inset, so you can jump sideways
// without going home; moving to another inset slides the page in that direction and flips the tile.

const TILE = 34;
const ART = 96; // the art is drawn at 96px and shown at 34px: a square crop, like the menu thumbnails

function Tile({ inset }: { inset: Inset }) {
  return (
    <span className="in-tile in-grain" style={{ width: TILE, height: TILE, ...cardStyle(inset) }}>
      <span className="in-tile-art" style={{ transform: `scale(${TILE / ART})` }}>
        <CardArt kind={inset.art} ink={inset.ink} width={ART} height={ART} still />
      </span>
    </span>
  );
}

// The inset list as a toolbar track: a white thumb glides to the item under the pointer or keyboard,
// and rests on the current inset otherwise. The current one also keeps a thin outline, so it stays
// findable while the thumb is elsewhere.
function MenuTrack({ current }: { current: Inset }) {
  const track = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // whether the last move was a key: only then does the highlighted item get a focus ring
  const [keys, setKeys] = useState(false);
  const [glide, setGlide] = useState<{ y: number; h: number } | null>(null);
  const currentIdx = INSETS.findIndex((inset) => inset.slug === current.slug);
  const at = hover ?? currentIdx;

  useLayoutEffect(() => {
    const el = track.current?.querySelectorAll<HTMLElement>(".in-menu-item")[at];
    if (el) setGlide({ y: el.offsetTop, h: el.offsetHeight });
  }, [at]);

  return (
    <div
      className="in-menu-track"
      ref={track}
      data-keys={keys || undefined}
      onPointerLeave={() => setHover(null)}
      onPointerMove={() => setKeys(false)}
      onKeyDown={() => setKeys(true)}
    >
      {glide && <span className="in-menu-glide" aria-hidden style={{ top: glide.y, height: glide.h }} />}
      {INSETS.map((inset, i) => {
        const isCurrent = i === currentIdx;
        return (
          <DropdownMenu.Item key={inset.slug} asChild disabled={isCurrent} onFocus={() => setHover(i)} onPointerMove={() => setHover(i)}>
            <InsetLink
              href={insetPath(inset.slug)}
              className="in-menu-item"
              style={cardStyle(inset)}
              aria-current={isCurrent ? "page" : undefined}
              transitionTypes={[directionBetween(current.slug, inset.slug)]}
            >
              <span className="in-menu-thumb in-grain" aria-hidden>
                <CardArt kind={inset.art} ink={inset.ink} width={96} height={96} />
              </span>
              <span className="in-menu-text">
                <span className="in-menu-title">{inset.title}</span>
                <span className="in-menu-summary">{inset.summary}</span>
              </span>
              {inset.status === "in-progress" ? <span className="in-menu-soon">In progress</span> : null}
            </InsetLink>
          </DropdownMenu.Item>
        );
      })}
    </div>
  );
}

export function Switcher({ current }: { current: Inset }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="in-switch" aria-label={`${current.title}. Switch inset`}>
        <ViewTransition name={cardName(current.slug)} share="in-morph" enter="in-flip-in" exit="in-flip-out" default="none">
          <span className="in-switch-tile">
            <Tile inset={current} />
          </span>
        </ViewTransition>
        <ViewTransition name={titleName(current.slug)} share="in-morph" enter="in-flip-in" exit="in-flip-out" default="none">
          <span className="in-switch-label in-serif">{current.title}</span>
        </ViewTransition>
        <svg className="in-switch-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="in-menu" align="start" sideOffset={10} collisionPadding={12}>
          <DropdownMenu.Label className="in-menu-label">Insets</DropdownMenu.Label>
          <MenuTrack current={current} />
          <DropdownMenu.Separator className="in-menu-sep" />
          <DropdownMenu.Item asChild>
            <InsetLink href={insetPath()} className="in-menu-home" transitionTypes={["nav-home"]}>
              <span aria-hidden>←</span> All insets
            </InsetLink>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
