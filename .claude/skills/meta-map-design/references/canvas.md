# Canvas (editorial register)

## Ground
24px minor grid (`--grid`) + 120px major grid (`--grid-2`) on `--bg`; both scale and pan with the view. Zoom range 15–250%.

## Node anatomy
Widths: link/bookmark/note 224, person 236. Videos take the width of their **frame**, so a card's shape says what it holds before you read it:

| Frame | Ratio | Card | Used for |
|---|---|---|---|
| Wide | 16:9 | 252 | YouTube videos, X videos |
| Vertical | 4:5 | 216 | everything vertical: Instagram posts and reels, YouTube Shorts (one consistent crop) |
| Idea / draft | none | 224 | videos with status idea or draft (nothing to show yet) |

```
Wide (YouTube)                          Vertical (4:5)     Idea
┌──────────────────────────────────────┐ ┌────────────────┐ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐
│ VIDEO  [YT]               ● Published│ │ VIDEO [IG] ●Pub│ ┆ VIDEO              ● Idea┆
│ ┌──────────────────────────────────┐ │ │ ┌────────────┐ │ ┆ Title in Allo Sharp 600  ┆
│ │  thumbnail 16:9        ▶ on hover│ ● │ │            │ ● ┆ The take, 2 lines max, ink-2 ●
│ │                          ▶ 12:40 │ │ │ │  4:5   ▶   │ │ ┆ ■ AI  ■ WORK             ┆
│ └──────────────────────────────────┘ │ │ │            │ │ └┄┄┄┄┄┄┄┄┄┄┄◆┄┄┄┄┄┄┄┄┄┄┄┄┘
│ Title in Allo Sharp 600 14.5px       │ │ └────────────┘ │
│ 16 SEPT 2026 · host.com              │ │ Title          │
│ ■ TOOLS  ■ AI WORKFLOWS              │ │ 6 OCT 2026     │
└──────────────────◆───────────────────┘ └───────◆────────┘
```
- Card: `--surface`, 1px `--line`, 4px radius, no shadow (flat on the grid). Notes use `--note`.
- Header 32px, mono 9.5px uppercase `--ink-3`; platform outline badge; status badge right. Title balanced, up to 3 lines; meta mono 10px uppercase `--ink-3`; topic squares 7px + mono 9.5px.
- **Two frames:** 16:9 for YouTube and X, and **4:5 for everything vertical** (Instagram posts, reels, YouTube Shorts), so vertical work reads as one consistent shape. The image is cropped to fill (`object-fit: cover`), never letterboxed, on the card and in the inspector.
- **Play affordance:** a published video with a playable link shows a 36px round ▶ (`--thumb-ink` on `--thumb-bg` at 85%) centred on the thumbnail on card hover. Clicking the card still selects it; playback happens in the inspector, where the ▶ is a real button ("Play video"). Nothing from YouTube or Instagram loads until it is pressed (YouTube uses youtube-nocookie.com).
- **Ideas and drafts** have nothing to show yet, so they are compact: no thumbnail, a **dashed** 1px `--line-2` border, the take (summary) under the title in `--ink-2`, clamped to 2 lines.
  - **Ideas are secondary** in the hierarchy: the header says **Idea** (not Video) and there is no status badge; the card is an outline on the grid (no fill) at 72% opacity with a 500-weight `--ink-2` title, back to full strength on hover or selection.
  - **Drafts** (editor only) keep the Video header and a Draft badge.
- **People** are pills (999px) with a 44px round avatar (topic-palette colour by name hash, white initials), kind label, name, `@handle · site`.
- Generated thumbnail (no real image, or it fails to load): `references/thumbnail.js`. 14×7 cell sequencer pattern seeded by id + title, glyphs (solid, dot, ring, x, quad, bars, hatch, dots9) in the node's topic colours on `--thumb-bg`, cream-white corner brackets, duration chip bottom-right. Same in both themes; cropped to the frame like a real image.

## Connection points (handles)
| | ● Continuity | ◆ Reference |
|---|---|---|
| Position | right edge, vertical centre | bottom edge, horizontal centre |
| Shape | 11px circle | 10px square rotated 45° |
| Meaning | sequence: next in series, same series | context: references, attachment, inspired by, features, made by, related |
| Line | solid, 2.2px, `--ink-2` | dashed 5/4 (attachment 3/4, references dotted, inspired-by 9/5), 1.4px, `--edge` |
| Ends | filled dot at both ends, r 3.6px, line colour | filled dot at both ends, r 2.8px, line colour |

- Both handles take any number of connections; nodes may have none.
- **No arrows.** Relations are not always one-way (same series, related), so every line ends in a dot at both ends where it meets the card. The kind label carries the reading.
- Lines **float**: each end attaches to the midpoint of the side facing the other node; Bézier tangents are normal to that side (`k = max(40, distance × 0.38)`).
- Selected node: its lines go `--ink` 2px with a mono uppercase kind label at the midpoint (stroked with `--bg` for legibility). Unrelated nodes fade to 42%.

## States
- **Hover node:** border `--line-2`; both handles scale 1.25 with an ink border.
- **Hover handle:** filled `--hot`, scale 1.5, 5px soft `--hot` halo.
- **Selected:** border `--ink-2` plus **corner brackets** (12px arms, 1.5px, 8px outside the card).
- **Dragging a connection:** the source handle stays `--hot`; a dashed `--hot` thread follows the pointer from the facing side, ending in a hollow dot with a mono label ("Reference · release for a new node"). Candidate nodes show faint `--line-2` brackets; nodes already linked *by the same type* fade to 30%.
- **Snap / lock-on:** within 80 screen px of a node, the thread turns solid and attaches to the target's facing side, the end dot fills, the target gets `--hot` brackets that breathe between 12px and 7px out (0.8s alternate), and the label names the relation that will be created.
- **Release on empty canvas:** opens a small menu to create a new node already connected with that type.
- **Filtered out:** 16% opacity (or hidden with "Hide non-matching").

## Layout backgrounds
- **Clusters:** topic anchors on a ring (co-tagged topics adjacent). Nodes pulled equally to all their topics, so multi-topic items sit in between. Each topic draws soft halos (rounded rects, 11% topic colour) around its members, which overlap where topics are shared. Labels: display face 46px uppercase in topic colour with a mono two-digit count.
- **Timeline:** lanes YouTube / Instagram / X / Links, bookmarks and notes / People; lane titles display face 26px uppercase `--ink-2`. Mono date ticks on Mondays and month starts; Today line 1.5px `--hot` with a filled label; undated items in a Backlog column. Opens on Today at a readable zoom (80–100%, never a fit-everything strip); a picture-in-picture overview above the zoom panel (desktop only) shows lanes, month ticks, Today and every card as a blip, outlines what is on screen, and pans on press or drag. The zoom panel gains a Today button.
- **Tidy (Freeform view):** snap to 24px, share column x and row y for near-aligned items, exactly 48px gutters between close neighbours, clear overlaps by moving whole columns or column tails. Undo for 8s.

## Motion
Layout switches and Tidy tween positions over 520ms (ease in-out cubic). Popovers fade/scale 140ms. Hover transitions 120ms. All disabled under `prefers-reduced-motion`.
