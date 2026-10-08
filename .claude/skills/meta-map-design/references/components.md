# Chrome components (shadcn/ui, re-themed)

Install shadcn/ui and keep its components, then theme them through `tokens.css`. Icons: lucide-react, 16px, stroke 1.8.

## Layout of the screen
| Region | Contents |
|---|---|
| App bar, left | Brand mark + "META MAP" (display face) + mono subtitle |
| App bar, centre | **Tabs**: Free · Clusters · Timeline (with `kbd` 1/2/3) |
| App bar, right | **Data** (outline button, editor only) · **Tabs**: Edit · Public (editor domain only) · theme **icon button** |
| Canvas top-left | Panel with ghost buttons: **Filters** (sliders icon + active-count badge) · **Tidy** (grid icon; editor only) |
| Canvas bottom-left | Zoom panel: − · % (mono) · + · Fit |
| Canvas bottom-centre | Add dock (editor only): Video (primary) · Link · Bookmark · Person · Note (ghost) · legend "● series · ◆ reference" |
| Right | Inspector sheet (352px; bottom sheet under 900px) |
| Top-centre | Public-view banner pill (public preview only) |

## Components
- **Tabs** (view switch, mode switch, status picker): muted track (`--surface-2`, 1px `--line`, 8px radius, 3px padding). Tab 28px high, 13px/500. Active tab is raised: `--surface` background, `--line-2` border, `--shadow-sm`, ink text. View tabs also show a 6px `--hot` square on the active tab. Status picker tabs show a status dot instead.
- **Button** variants (32px, 6px radius, 13px/500, icon gap 7px; `sm` = 28px):
  - `default/primary`: ink fill, bg text. One per region.
  - `outline`: `--line-2` border, transparent. Standard action.
  - `secondary`: `--surface-2` fill.
  - `ghost`: no border, `--ink-2` text; used in toolbars and the dock.
  - `destructive`: `--hot` text and border; the confirm step is solid.
  - `icon`: square 32/28.
  - Toggle buttons (e.g. Filters while open) use `aria-pressed` and the `--surface-2` wash.
- **Badge**: status = tinted pill (15% tint, 38% border, dot, 11px/500). Platform = outline, mono 10px, 4px radius. "Sample data" = draft-tinted badge.
- **Toggle group** (filter chips): 28px, 6px radius, outline. Pressed = inverted (ink fill, bg text) plus a check mark. Topic chips lead with an 8px topic square. Counts in mono `--ink-3`.
- **Switch**: 34×20, `--surface-3` off, ink on.
- **Checkbox**: 16px, 4px radius, ink fill with bg check.
- **Input / Textarea / Select**: 34px, 6px radius, `--line-2` border, transparent; hover `--ink-3` border; focus = accent ring. Search has a leading icon. Labels are sentence case 12.5px/500 `--ink-2` (inspector) or mono uppercase section labels (popover, panels).
- **Popover** (Filters mega-menu): anchored under its trigger with a 12px rotated-square **caret** pointing at the trigger centre; clamps to the viewport; `--shadow-pop`. Structure: header row (search + "Hide non-matching" switch) → three columns (Topics 1.7fr / Platform / Status) divided by `--line` → footer on `--surface-2` (mono count + ghost "Clear filters"). Stays open while toggling; closes on outside click or Esc; focuses search on open. One column under 720px.
- **Dropdown menu** (new connected node): 190px, 4px padding, items 32px with plus icon.
- **Sheet** (inspector): sticky header with mono type label and ghost close icon; body sections separated by `--line` rules.
- **Dialog** (Data / JSON): 12px radius, display-face uppercase title, ghost close icon.
- **Toast**: bottom-right card, 6px `--hot` square, 13px/500. Past-tense, short ("Connected · next in series", "Tidy undone").
- **Kbd**: mono 10.5px, 1px border with 2px bottom border.
- **Meter** (stats): 10 segments, 9×12px, `--surface-3` off / ink on, numbers mono right-aligned.

## Copy
Sentence case for all controls. Buttons are verbs ("Clear filters", "Copy JSON", "Attach"). Empty states invite ("Drag the ◆ on the bottom edge to a related item."). No "please", no exclamation marks, no "successfully".
