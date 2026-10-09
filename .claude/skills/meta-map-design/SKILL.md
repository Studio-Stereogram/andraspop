---
name: meta-map-design
description: Meta Map's design system — tokens, type, colour rules, shadcn/ui component conventions and canvas rules (nodes, connection points, edges, thumbnails). Use before building or changing any Meta Map UI, canvas element, OG image or marketing visual.
---

# Meta Map design system

Meta Map is a dark, instrument-like canvas for a body of published work. Its look has **two registers** that must stay distinct:

1. **Canvas content (editorial register).** The nodes, connections, cluster and timeline backgrounds. Mono metadata, square tiles, generated sequencer-style thumbnails, corner-bracket selection. It should feel like a step sequencer or a hardware UI.
2. **Chrome (product register).** App bar, canvas tool panels, filters popover, inspector, dock, dialogs, toasts. Plain, obvious shadcn/ui components re-themed with our tokens. Anyone should be able to tell what's clickable at a glance.

When in doubt: content can be expressive, controls must be trivial to read.

## Files
- `references/tokens.css`: all colour, radius, shadow and font tokens for both themes, plus the shadcn/ui variable mapping. **Copy into `app/globals.css`; never hard-code hex values in components.**
- `references/components.md`: how each shadcn/ui component is configured and when to use which variant.
- `references/canvas.md`: node anatomy, connection points, edge styles, selection and drag states, layouts, motion.
- `references/thumbnail.js`: deterministic generated thumbnail (port as-is).
- Visual reference: `prototype/index.html` (current) and `prototype/versions/` (history).

## Themes
- **Dark (default, "graphite"):** cool blue-grey. Canvas `#101215`, cards `#1A1D22`, text `#EDF0F4`.
- **Paper (optional, manual toggle):** neutral light. The app does not follow the OS theme; the visitor's choice is remembered.

## Colour rules
- Chrome is greyscale. Colour carries meaning only:
  - **Topic colours:** saturated set: blue `#3E63DD`, teal `#12A594`, orange `#F76B15`, magenta `#D6409F`, violet `#8E4EC6`, brown `#A18072`, green `#46A758`. Spares: `#0090FF`, `#E5484D`, `#FFB224`. Topic colour appears as small squares, chip dots, cluster halos and labels, and in thumbnails. Never as a card fill.
  - **Status:** idea grey, draft amber, scheduled blue, published green. Always as a Badge (tinted pill with a dot), never as plain coloured text.
  - **Accent `--hot` (#E5553A):** reserved for interaction and "now": active tab marker, connect thread, drop target, focus ring, Today line, filter count badge. Never decorative, never a topic.
- Text on tints uses `color-mix(in srgb, var(--sc) 55%, var(--ink))`, not raw colour.

## Type
| Role | Face | Use |
|---|---|---|
| UI | Archivo 400/500, 13–14px, sentence case | buttons, tabs, inputs, menus, inspector body |
| Titles | Archivo 600, 14.5px on cards, 26px in inspector | node titles, dialog titles |
| Display | Archivo 650, width 112 | cluster labels (46px) and timeline lanes (26px) in UPPERCASE; the "mind-map" wordmark (15px) in lowercase |
| Meta | IBM Plex Mono 500, 9.5–11px, UPPERCASE, letter-spacing .06–.12em | node headers, dates, tags, section labels, counts, kbd, stats |

Rules: never uppercase UI controls; mono only for metadata and labels; balance headings (`text-wrap: balance`); tabular numbers wherever digits line up.

## Shape
- Canvas content: 4px corners (cards), 2px (thumbnails), square markers. **People are the only round entities** (pill node, round avatar).
- Chrome: 8px (cards, tabs track, popovers), 6px (buttons, inputs, toggles), 10–12px (panels, dialogs), 999px (badges, switch).
- Selection = corner brackets, not outlines.

## Non-negotiables
1. Two connection points per node: **● continuity** on the right edge, **◆ reference** on the bottom edge. Same shapes everywhere (handles, inspector headings, legends).
2. Continuity lines are solid, heavier and have arrows. Reference lines are thinner and dashed (dash varies by kind).
3. Exactly one primary (filled) button per view region. The rest use outline, secondary or ghost.
4. Every interactive element has hover, focus-visible (accent ring, `box-shadow: var(--focus-ring)`) and pressed/selected states. `--ring` is shadcn's ring *colour* (= `--hot`), not a shadow.
5. Public mode never shows editing affordances: no handles, dock, Tidy or Data.
6. Respect `prefers-reduced-motion`: drop the lock-on pulse and layout tweens.

## Checklist before shipping UI
- [ ] Only tokens from `tokens.css`; works in Dark and Paper.
- [ ] Controls read as controls (Tabs, Button variants, Badges, Toggles, Switch).
- [ ] Canvas pieces follow `canvas.md` (header, badge, handles, brackets).
- [ ] Copy: sentence case, verb-first buttons, no "please", no exclamation marks.
- [ ] Keyboard: `1/2/3` views, `F` fit, `T` tidy, `Esc` closes the top-most layer.
