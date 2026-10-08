# Meta Map — instructions for Claude Code

## Read first
1. `SPEC.md`: product, data model, connection model (continuity vs reference), views, interactions, integrations, milestones.
2. The `meta-map-design` skill (`.claude/skills/meta-map-design/SKILL.md`): load it before any UI work.
3. `prototype/index.html`: the behavioural and visual reference. When the spec and the prototype disagree, ask.

## Stack (decided)
- Next.js (App Router, TypeScript, latest stable), Tailwind, shadcn/ui re-themed with `references/tokens.css`.
  - Next.js 16.4 with Cache Components is newer than most training data: read the bundled guide in `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`).
  - The shadcn registry may be unreachable from cloud sessions; `components/ui/*` follow shadcn's source style, so `npx shadcn add` works where the registry is reachable (`components.json`).
- Canvas: React Flow (`@xyflow/react`) with custom node and edge components that match the prototype.
- Data: Supabase Postgres (`supabase/schema.sql`). Seed from `data/seed.json`.
- Hosting: Vercel, GitHub `main` → production. See `docs/hosting.md`.
- Node version in `.nvmrc`.

## Commands
- `npm run dev` (localhost:3000), `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` (Vitest).
- Run all four checks before pushing; `main` deploys to production.

## Code map
- `app/page.tsx`: server component. Loads the public map (`lib/data/map.ts`), renders the canvas and a plain list of entries for screen readers and search engines.
- `components/map/map-app.tsx`: the client shell. React Flow state, view switching with tweened layouts, fit/zoom, wheel and keyboard handling, selection.
- `components/map/{nodes,edges,layout-background}.tsx`: canvas pieces; styles in `components/map/canvas.css` (editorial register).
- `components/map/{app-bar,filters-popover,inspector,zoom-controls}.tsx` and `components/ui/*`: chrome (product register).
- `lib/map/*`: pure, tested logic ported from the prototype (`visibility`, `layouts`, `geometry`, `thumbnail`, `normalize`). `lib/tokens.test.ts` keeps `app/globals.css` in sync with the skill's `tokens.css`.

## Architecture rules
- **Two hosts, one app.** The public domain is read-only. The `edit.` domain is the editor and is password-gated by `proxy.ts` (see `docs/snippets/proxy.ts`). Every server action and write route must re-check the editor gate itself; never rely on the proxy alone.
- **Public data rule** (enforced in SQL/RLS and in server queries): show a node only if it is not private and, for videos, its status is `published` or `scheduled`. Hide reference-only nodes (links, bookmarks, people, notes) whose every connection points to a hidden node. Standalone nodes with no connections are allowed and shown.
- **Edges** have `type` = `continuity` | `reference` and a `kind` from that type's list. Each node renders exactly two handles: ● continuity (right edge) and ◆ reference (bottom edge). Lines float (attach to the facing side).
- **Layouts are pure functions:** `(nodes, edges, topics) → positions` for Free (stored), Clusters (topic gravity) and Timeline (date × platform lanes). Port the algorithms from the prototype (`clusterLayout`, `timelineLayout`, `tidy`).
- Keep the JSON import/export format `{ topics, nodes, edges }` working at all times.

## Milestones
- **M1:** scaffold, tokens + shadcn theme, React Flow canvas with custom nodes and edges, the three layouts, filters popover, inspector (read-only), seed data, deploy to Vercel.
  - Done as a public, read-only map. Left for M2 because they are editor-only: Tidy, the add dock, connecting, inspector editing, the status filter and the Data dialog. The prototype's sample "Performance" block was left out so the public site doesn't show made-up numbers; real stats arrive in M3.
- **M2:** Supabase persistence, host routing + edit gate, full editing (dock, connect, inspector, Tidy, status), public page server-rendered and revalidated on publish.
- **M3:** platform sync: YouTube Data API, then Instagram API with Instagram Login (Creator/Business account), stats snapshots, cron.
- **M4:** clusters with real bubble outlines, deep links (`/#slug`), per-node OG images, mobile inspector sheet.

## Working agreements
- Small commits with clear messages; commit before any visual redesign.
- Don't change tokens ad hoc in components. Change `tokens.css` and the skill, then use the variables.
- UI copy: sentence case, verb-first buttons, no exclamation marks.
- Ask before adding a dependency that duplicates React Flow, shadcn/ui or Supabase functionality.
