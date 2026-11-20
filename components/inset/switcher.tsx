"use client";

import { DropdownMenu } from "radix-ui";
import { ViewTransition } from "react";
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
          {INSETS.map((inset) => {
            const isCurrent = inset.slug === current.slug;
            return (
              <DropdownMenu.Item key={inset.slug} asChild disabled={isCurrent}>
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
                  {isCurrent ? <span className="in-menu-here">Here</span> : inset.status === "in-progress" ? <span className="in-menu-soon">In progress</span> : null}
                </InsetLink>
              </DropdownMenu.Item>
            );
          })}
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
