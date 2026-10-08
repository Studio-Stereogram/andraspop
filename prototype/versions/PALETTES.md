# Meta Map — colour history

v1 and v2 used the same palette (v2 only strengthened cluster halos in dark). v3 and v4 share the sequencer palette (v4 changed components, not colours, apart from adding `--surface-3`).

## v1 / v2 — "cool graphite" (followed the system light/dark setting)

| Token | Light | Dark | Role |
|---|---|---|---|
| --canvas | #E8EBEF | #101215 | canvas ground (dot grid) |
| --dot | #C3CAD3 | #252A31 | grid dots |
| --surface | #FFFFFF | #1A1D22 | cards, panels |
| --surface-2 | #F3F5F8 | #22262D | inputs, tracks |
| --line | #D3D9E0 | #2F343C | borders |
| --ink | #13161B | #EDF0F4 | primary text |
| --ink-2 | #47505C | #B2B9C4 | secondary text |
| --ink-3 | #7A8391 | #7D8693 | muted text |
| --edge | #98A2AF | #59626E | connections |
| --note | #FFF7D6 | #2A2717 | note cards |
| --st-idea | #8B95A3 | #8E98A6 | status |
| --st-draft | #B97C0C | #E0A53C | status |
| --st-sched | #2F6FE4 | #6795F2 | status |
| --st-pub | #278A50 | #4DC07E | status |

Topic colours (saturated): Design craft #3E63DD · AI workflows #12A594 · Studio business #F76B15 · Art #D6409F · Framer #8E4EC6 · Tools #A18072 · Vibecoding #46A758 (added in v2). Spare: #0090FF #E5484D #FFB224.
Accent: none. Selection and connections used `--ink`.
Type: Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono (labels).

## v3 / v4 — "sequencer" (dark by default, Paper as a manual option)

| Token | Dark (default) | Paper | Role |
|---|---|---|---|
| --bg | #0F0F0E | #ECECE9 | canvas ground (line grid) |
| --grid / --grid-2 | #191917 / #22221F | #E2E2DE / #D5D5D0 | 24 px / 120 px grid |
| --surface | #161615 (v3 #151514) | #FBFBF9 | cards, panels |
| --surface-2 | #1F1F1D | #F1F1ED | inputs, tracks |
| --surface-3 (v4) | #292926 | #E6E6E1 | hover, meter off |
| --line / --line-2 | #2B2B28 / #3C3B37 | #DADAD4 / #C3C2BB | borders |
| --ink / --ink-2 / --ink-3 | #ECE8DF / #ABA79D / #77746C | #151514 / #4F4E49 / #7E7C75 | text |
| --edge | #55534D | #A3A19A | connections |
| --hot | #E5553A | #D9472C | the one accent: active, connect, drop, Today |
| --st-draft / sched / pub | #D9A24E / #8FB7C9 / #9DB36B | #A8721A / #337493 / #557426 | status |

Topic colours (muted retro): Design craft #8FB7C9 · AI workflows #5E8592 · Studio business #D9A24E · Art #E5553A · Framer #B4A6C9 · Tools #C9B99A · Vibecoding #9DB36B.
Type: Archivo (UI + titles), IBM Plex Mono (metadata, labels).

## v5 — v1 graphite in the v4 UI (current)

Dark theme = the v1 dark values mapped onto the v4 token names: --bg #101215, --grid #171A1F, --grid-2 #20242B, --surface #1A1D22, --surface-2 #22262D, --surface-3 #2A2F37 (new), --line #2F343C, --line-2 #3B414B (new), --ink #EDF0F4 / #B2B9C4 / #7D8693, --edge #59626E, status #8E98A6 / #E0A53C / #6795F2 / #4DC07E, v1 card shadow for panels.
Kept from v4: the --hot accent #E5553A for interaction, the line grid, components and type. Topic colours are back to the v1 saturated set (Art moved from terracotta to magenta, so it no longer clashes with the accent). Paper theme unchanged.
Thumbnails use cool white #EDF0F4 and #0C0E11 instead of cream and warm black.
