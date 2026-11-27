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
  - **Accent `--hot` (#E5553A):** reserved for interaction and "now": active tab marker, connect thread, drop target, focus ring, Today line, filter count badge, and the **New** tag (one entry at a time, filled like the Today label). Never decorative, never a topic.
- Text on tints uses `color-mix(in srgb, var(--sc) 55%, var(--ink))`, not raw colour.

## Exception: /hi
The "Say hi" page is a standalone static page (`public/hi/index.html`, served at `/hi` by a rewrite in `next.config.ts`), designed separately from this system (2026-11-17, "hi-v5"). Its font, Allo Sharp, is shared with the map since 2026-11-18 (the map loads the same file); everything else stays its own: black-and-white palette, light/dark from the OS setting, and its motion script. Don't apply these tokens or components to it, and don't carry its palette or layout into the map. Edit the HTML file directly; keep asset paths absolute (`/hi/assets/...`, `/hi/fonts/...`).

## Type
One family across the app and the /hi page: **Allo Sharp** (Allo by Josh Puckett, SIL OFL; `public/hi/fonts`), variable in weight (100–900) and optical size (9–32, automatic). It has no width axis, so roles differ by weight, size and tracking. IBM Plex Mono stays for metadata only.

| Role | Face | Use |
|---|---|---|
| UI | Allo Sharp 400/500, 13–14px, sentence case | buttons, tabs, inputs, menus, inspector body |
| Titles | Allo Sharp 600, 14.5px on cards; 650 at 26px in the inspector, tracking −0.02em | node titles, dialog titles |
| Display | Allo Sharp 650, tight tracking (−0.01 to −0.02em); optical size follows the font size | cluster labels (46px) and timeline lanes (26px) in UPPERCASE; the "mind-map" wordmark (16px) in lowercase |
| Meta | IBM Plex Mono 500, 9.5–11px, UPPERCASE, letter-spacing .06–.12em | node headers, dates, tags, section labels, counts, kbd, stats |

Rules: never uppercase UI controls; mono only for metadata and labels; balance headings (`text-wrap: balance`); tabular numbers wherever digits line up.

## Shape
- Canvas content: 4px corners (cards), 2px (thumbnails), square markers. **People are the only round entities** (pill node, round avatar).
- Chrome: 8px (cards, tabs track, popovers), 6px (buttons, inputs, toggles), 10–12px (panels, dialogs), 999px (badges, switch).
- Selection = corner brackets, not outlines.

## Non-negotiables
1. Two connection points per node: **● continuity** on the right edge, **◆ reference** on the bottom edge. Same shapes everywhere (handles, inspector headings, legends). The one exception is the intro (big-type statement, see `canvas.md`), which has only ◆ reference.
2. Continuity lines are solid and heavier. Reference lines are thinner and dashed (dash varies by kind). No arrows: every line ends in a dot at both ends.
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
