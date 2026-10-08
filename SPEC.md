# Meta Map — product spec (v0.3)

A public, canvas-based map of everything András publishes while building in public. Instead of a feed, visitors explore a node graph: videos from YouTube, Instagram and X, plus the links, artifacts, bookmarks and notes that sit around them, connected by meaning. The same canvas is the private workflow tool for planning and tracking what gets published.

Working name: **Meta Map**. Rename freely.

---

## 1. Goals

1. **One place for the whole body of work.** Every published video lands on the canvas, with its context attached.
2. **Explorable relationships.** Visitors follow threads ("this video led to that one", "this bookmark inspired that take") rather than scrolling chronologically.
3. **Low-friction publishing workflow.** Adding a just-published video and flipping it from draft to published takes seconds.
4. **Topic lenses.** Anyone can narrow the map to one theme (e.g. only "Art") and see it re-cluster.

Non-goals for v1: hosting video, comments, analytics dashboards, multi-tenant (other creators).

## 2. Users and roles

| Role | Who | Can |
|---|---|---|
| Owner | András | Everything, incl. inviting editors, deleting |
| Editor | Studio teammates ("by us") | Create/edit nodes, edges, topics; change status |
| Visitor | Public, no login | Read published nodes, filter, switch layouts, open links |

Visitors never see nodes with status `idea` or `draft`, nodes marked private, or attachments whose only connections are hidden nodes.

## 3. Core objects

### Node
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| type | `video` · `link` · `bookmark` · `person` · `note` | `link` = own artifact (template, sheet, repo); `bookmark` = someone else's *thing*; `person` = someone else, the author behind things |
| title | text | required to publish |
| summary | text | the "take", 1–3 sentences, shown in the inspector |
| platform | `youtube` · `instagram` · `x` · null | videos only in v1 |
| status | `idea` · `draft` · `scheduled` · `published` | videos only |
| date | date | publish/scheduled date for videos, added date for others |
| url | url | canonical link out |
| duration | text | e.g. `12:40`; later filled from platform APIs |
| thumbnail | url | the demo generates a sequencer-style pattern seeded by the node (see §11); real thumbnails come from the platform APIs |
| stats | object | cached platform metrics, e.g. `{views, reach, likes, comments, saves, shares, avgWatchTime, fetchedAt}` (see §7) |
| topics | topic id[] | all topics are equal; a node pulls towards every topic it carries |
| handle | text | people only: X handle (also parsed from an x.com URL) |
| private | bool | hidden from visitors regardless of status; notes default to private |
| position | {x, y} | free-layout position, saved per node; Tidy rewrites it |
| createdBy / updatedAt | | audit |

### Edge (relation)
| Field | Type | Notes |
|---|---|---|
| from, to | node id | directional |
| type | `continuity` · `reference` | which connection point it uses (see below) |
| kind | continuity: `follow-up` (next in series) · `series` (same series) — reference: `references` · `attachment` · `inspired-by` · `features` · `made-by` · `related` | the kind list depends on the type; reference defaults come from the two node types (video → person = features, bookmark → person = made-by, video → link = attachment) |

### Connection model
- An entry can have **no connections at all**. Standalone entries are first-class (they still appear in every view and filter).
- Every entry has exactly **two connection points**, and each point can hold any number of connections:
  - **● Continuity** (right edge): sequence. "This is the next episode / the short cut of / part of the same series." Drawn as a solid, heavier line with an arrow. Series can be derived by walking continuity edges.
  - **◆ Reference** (bottom edge): context. Links, bookmarks, people, notes and related takes. Drawn as a thinner dashed line; dash pattern varies by kind.
- Lines float: each end attaches to the side of the card that faces the other card. The points are where you start a drag and where the type is chosen.

### People vs bookmarks
A bookmark is a single piece of work (a talk, an article). A person is the recurring source behind work: one person node can be the author of several bookmarks (`made-by`), be featured in videos (`features`), or inspire them (`inspired-by`). Over time people become hubs on the map, which is the point: visitors can see whose thinking feeds which takes. People render as round pills with an avatar, carry an X handle and/or a website, and get a "Follow on X" / "Visit site" action in public view. They get their own lane in Timeline.

### Topic
`id`, `name`, `color`. Order of topics defines cluster order.

## 4. Views

The same data, three layouts, animated transitions between them:

1. **Free** — hand-arranged mind map. The editor's working surface; positions persist.
   - **Tidy** (button / `T`, undo for 8 s or Cmd/Ctrl+Z): a soft grid, not a table. Positions snap to the 24 px canvas grid; left edges that are within ~4 grid units of each other share one column x; tops within 2 units across columns share one row y; neighbours that are close (< 2.5 gutters apart) get exactly one 48 px gutter, vertically within a column and horizontally between columns; any remaining overlap is cleared by moving whole columns sideways or the rest of a column down. Far-apart groups stay where they were, so the map keeps its shape.
2. **Clusters** — topic gravity. Each topic gets an anchor on a ring (topics that are often tagged together sit next to each other). Every node is pulled equally towards all of its topics, so an Art + Vibecoding piece lands between the two, and overlaps are resolved without moving the labels. Each topic draws a soft region around all of its members; where regions overlap, the shared items are visibly in both. Untagged nodes settle next to whatever they connect to. Filtering by a topic fades the other regions.
   - Alternatives considered: (a) primary-topic boxes with "echo" ghost cards in secondary clusters (clear, but duplicates items); (b) one dedicated cluster per topic combination, e.g. "Art × Vibecoding" (precise, explodes with more topics); (c) true bubble sets / metaball contours (nicest look, heavier to build — a good M4 upgrade of the current soft regions).
3. **Timeline** — x = date, one lane per platform plus a lane for links/notes; undated drafts collect in a Backlog column; a "Today" line.

## 5. Interactions

**Everyone**
- Pan (drag / two-finger scroll), zoom (wheel, pinch, Ctrl+scroll), fit to view (`F`), layouts (`1` `2` `3`).
- Filter by topic, platform, search text; matching nodes stay sharp, others dim (or hide). Filters live in a mega-menu popover anchored under the Filters button (sliders icon), with a caret pointing at the button: search and the hide switch across the top, then Topics / Platform / Status columns, and a footer with the result count and Clear filters. It stays open while toggling, closes on outside click or Esc, and the button shows a count badge of active filters. Stacks into one column on phones.
- Select a node → inspector with summary, tags, "Open on YouTube/Instagram/X" link, and connected nodes you can jump to. Neighbours of the selection are highlighted.
- Deep links: `/#node-slug` opens the map centred on a node (v2 of the demo).

**Editors**
- Dock: + Video, + Link, + Bookmark, + Person, + Note (created at viewport centre, inspector focused on title).
- Drag nodes (Free layout).
- Connecting: drag from the **●** (continuity) or the **◆** (reference) point. Hovering the node grows both; hovering a point fills it. Pressing it immediately draws a dashed thread to the pointer. While dragging, candidate nodes show faint corner brackets and already-connected nodes fade. The nearest node within ~80 screen px captures the thread: it turns solid, attaches to that node, the node's brackets lock on in the accent colour and pulse, and a label names the relation that will be created. Release to connect (the connection gets the type of the point you dragged from); release on empty canvas to create a new, already-connected node. Only connections of the same type block a second link between the same two entries.
- Inspector: edit all fields; status segmented control (setting Published with no date stamps today); toggle/create topics; see connections grouped as Continuity (prev / next) and Reference, change their kind or remove them; attach a link or bookmark (creates a connected node); delete with inline confirm.
- "Public view" toggle previews exactly what visitors see.

**Screen layout**
- App bar: brand left; **view tabs (Free / Clusters / Timeline) centred**; right side: **Data** (JSON, edit mode only), **Edit / Public** tabs, theme toggle. In production the Edit/Public tabs only exist on the editor domain (see §8); the public domain shows the view tabs and theme toggle only.
- Canvas, top left: **Filters** (mega-menu popover) and **Tidy** (edit only). Canvas, bottom left: zoom. Bottom centre: add dock (edit only). Right: inspector.

## 6. Publishing workflow

```
idea → draft → scheduled → published
```
- Ideas and drafts are visible only to editors.
- v1: manual. Paste the URL, set status.
- v2: paste a YouTube / Instagram / X URL → fetch title, thumbnail, duration, publish date (see §7).
- v3: auto-ingest — a scheduled job lists new uploads per channel and drops them into an "Inbox" as drafts to be placed and linked.

## 7. Platform data and analytics

**Instagram — official API, works for this use case.**
- Requirement: the account must be a **Professional account (Creator or Business)**. Personal accounts have no API access; the old Basic Display API was shut down in 2025.
- Use the **Instagram API with Instagram Login** (`graph.instagram.com`). No Facebook Page needed. Create a Meta developer app, add the Instagram product, scopes `instagram_business_basic` + `instagram_business_manage_insights`. For your own account (Standard Access) no App Review is needed.
- Media: `GET /{ig-user-id}/media` → `id, caption, media_type, media_product_type, permalink, thumbnail_url, timestamp, like_count, comments_count`.
- Per-post insights: `GET /{media-id}/insights?metric=views,reach,likes,comments,saved,shares` (+ `ig_reels_avg_watch_time` for Reels). `impressions`/`plays` were replaced by `views` in 2025. Insights can lag up to ~48 h and are kept ~2 years.
- Tokens: short-lived (1 h) → exchange for a long-lived token (60 days) → refresh it on a schedule before it expires. Store server-side only.
- No webhook for "new post" or metric changes, so poll: a cron (Vercel Cron / Supabase scheduled function) every 6–12 h lists recent media, upserts nodes as drafts (matched by `permalink`), and refreshes `stats` for posts younger than ~30 days, daily after that.
- Rate limits are generous for one account (on the order of hundreds of calls per hour).

**YouTube — easiest.** YouTube Data API v3 (`videos.list` with `snippet,contentDetails,statistics`) gives title, thumbnail, duration, views, likes and comments with an API key. Watch time, average view duration and subscriber gain need the YouTube Analytics API with OAuth on the channel.

**X — possible, but paid.** Since February 2026 new developers are on pay-per-use (about $0.005 per post read); the old free tier is closed. Fetching a few dozen own posts a day costs cents, but confirm in X's docs which metrics (impressions, video views) are returned for your own posts before relying on them. Fallback: manual entry or oEmbed for the card only.

**Architecture:** one `integrations` table (platform, account id, encrypted token, expires_at), one `stats_snapshots` table (node_id, fetched_at, metrics json) so the map can later show growth over time, and a single `/api/sync/[platform]` route called by cron. The demo shows a "Performance · Sample" block with segmented meters where these numbers will land.

## 8. Recommended build (Claude Code)

- **Frontend:** Next.js (App Router) + TypeScript. Canvas on **React Flow (@xyflow/react)** — custom node components per type, custom edges per kind, built-in pan/zoom/minimap. Port the demo's visual language into those components.
- **Layouts:** layout functions are pure `(nodes, edges, topics) → positions`; animate with React Flow node updates. Clusters v2: `d3-force` with topic-centre attraction.
- **Data:** Supabase (Postgres + row-level security). Starter schema in `supabase/schema.sql`. Visitors read only what is public (published or scheduled videos, non-private entries); writes happen on the editor domain only.
- **Tables:** `nodes`, `edges`, `topics`, `node_topics`, `profiles`.
- **Public page:** server-render the published graph as JSON + static HTML list of titles/links for SEO and no-JS readers.
- **Hosting:** GitHub + Vercel, one project, two domains: the public map on the main domain, the editor on an `edit.` subdomain behind a password gate. Full plan in `docs/hosting.md`. OG image per node for sharing.
- **Import/export:** keep the demo's JSON shape (`{topics, nodes, edges}`) as the seed format.

## 9. Milestones

1. **M1 – Port the demo** to Next.js + React Flow with the JSON as seed. Read-only public route.
2. **M2 – Persistence and the editor domain**: Supabase, host-based routing, password gate on `edit.`, server-side public/private filtering.
3. **M3 – Platform sync**: YouTube Data API first, then Instagram API with Instagram Login (needs the Creator/Business account), real thumbnails and stats snapshots.
4. **M4 – Exploration polish:** force clustering, deep links, minimap, OG images, mobile bottom-sheet inspector.

## 10. Open questions

- Should X threads (text, no video) be first-class nodes, or only X video posts?
- Is a node one video, or one *idea* that may have a YouTube long-form + IG cut + X clip? (Suggested v2: a `video` node with multiple platform URLs, so one take = one node.)
- Should visitors be able to suggest connections or bookmarks?
- Who can see editor names on nodes?

## 11. Visual direction

Dark-first, "instrument panel" editorial style, inspired by step-sequencer and hardware-UI aesthetics (Teenage Engineering-like), with a light "Paper" theme as a manual option.
- **Canvas:** near-black ground with a 24 px grid and a stronger 120 px major grid.
- **Type:** IBM Plex Mono for all UI and labels (uppercase, letterspaced); Archivo for titles; Archivo wide uppercase for cluster and lane headings.
- **Colour:** dark theme uses the cool-graphite palette (`#101215` canvas, `#1A1D22` cards, `#EDF0F4` text; full list in versions/PALETTES.md). UI chrome is greyscale. Colour comes only from topics (saturated set: blue, teal, orange, magenta, violet, brown, green), status badges and the thumbnails. One accent (terracotta red) is reserved for interaction: active option, connect thread, drop target, Today line.
- **Shape language:** square corners and square markers for things; people are the only round elements. Selection and drop targets use corner brackets instead of outlines.
- **Two registers:** the *canvas content* is editorial (mono metadata, square tiles, generated thumbnails, corner-bracket selection). The *chrome* around it (app bar, filters, inspector, dock, dialogs) follows shadcn/ui component conventions so controls are obvious at a glance: Tabs for view and mode (muted track, raised active tab), Button variants (primary, outline, secondary, ghost, destructive, icon) with lucide-style icons, Badges for status (tinted pill with a dot) and platform (outline), outline Toggles with a check for filters, a Switch, Inputs with focus rings, a Card/Sheet for panels, a toast in the corner. In the real build, use shadcn/ui directly and map its CSS variables to these tokens.
- **Thumbnails:** until real thumbnails exist, each video gets a generated sequencer-style tile pattern (dots, rings, crosses, hatches, bars) in its topic colours, seeded by the node so it never changes. Unpublished videos show an empty bracketed grid.

## 12. Demo scope (this handoff)

`index.html` is a single-file, dependency-free prototype: all of the above interactions except auth, URL ingestion and server persistence. Data lives in memory and is cached in the browser; use **Data → Copy JSON** to move the content into the real build.
