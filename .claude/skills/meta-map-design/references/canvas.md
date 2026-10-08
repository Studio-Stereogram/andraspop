# Canvas (editorial register)

## Ground
24px minor grid (`--grid`) + 120px major grid (`--grid-2`) on `--bg`; both scale and pan with the view. Zoom range 15–250%.

## Node anatomy
Widths: video 252, link/bookmark/note 224, person 236.

```
┌──────────────────────────────────────┐
│ VIDEO  [YT]               ● Published│  header 32px, mono 9.5px uppercase --ink-3; platform outline badge; status badge right
│ ┌──────────────────────────────────┐ │
│ │  generated thumbnail 108px       │ ●  continuity handle (right edge, vertical centre)
│ │                          ▶ 12:40 │ │
│ └──────────────────────────────────┘ │
│ Title in Archivo 600 14.5px          │  balanced, up to 3 lines
│ 16 SEPT 2026 · host.com              │  mono 10px uppercase --ink-3
│ ■ TOOLS  ■ AI WORKFLOWS              │  7px topic squares + mono 9.5px
└──────────────────◆───────────────────┘  reference handle (bottom edge, horizontal centre)
```
- Card: `--surface`, 1px `--line`, 4px radius, no shadow (flat on the grid). Notes use `--note`.
- **People** are pills (999px) with a 44px round avatar (topic-palette colour by name hash, white initials), kind label, name, `@handle · site`.
- **Unpublished videos** (idea/draft) show an empty bracketed grid with "NOT PUBLISHED" instead of a thumbnail.
- Thumbnail: `references/thumbnail.js`. 14×7 cell sequencer pattern seeded by id + title, glyphs (solid, dot, ring, x, quad, bars, hatch, dots9) in the node's topic colours on `--thumb-bg`, cream-white corner brackets, duration chip bottom-right. Same in both themes.

## Connection points (handles)
| | ● Continuity | ◆ Reference |
|---|---|---|
| Position | right edge, vertical centre | bottom edge, horizontal centre |
| Shape | 11px circle | 10px square rotated 45° |
| Meaning | sequence: next in series, same series | context: references, attachment, inspired by, features, made by, related |
| Line | solid, 2.2px, `--ink-2`, arrow | dashed 5/4 (attachment 3/4, references dotted, inspired-by 9/5), 1.4px, `--edge`; arrow except attachment/related |

- Both handles take any number of connections; nodes may have none.
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
- **Timeline:** lanes YouTube / Instagram / X / Links, bookmarks and notes / People; lane titles display face 26px uppercase `--ink-2`. Mono date ticks on Mondays and month starts; Today line 1.5px `--hot` with a filled label; undated items in a Backlog column.
- **Tidy (Free view):** snap to 24px, share column x and row y for near-aligned items, exactly 48px gutters between close neighbours, clear overlaps by moving whole columns or column tails. Undo for 8s.

## Motion
Layout switches and Tidy tween positions over 520ms (ease in-out cubic). Popovers fade/scale 140ms. Hover transitions 120ms. All disabled under `prefers-reduced-motion`.
