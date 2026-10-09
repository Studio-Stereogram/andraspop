# Meta Map

A canvas-based, explorable map of everything published while building in public. Videos from YouTube, Instagram and X sit on a node canvas next to the links, bookmarks, people and notes around them. Entries connect through **continuity** (series, sequels) and **reference** (context) links. Visitors browse it like a mind map instead of a feed. The same canvas is the private workflow tool for planning and publishing.

This repository started as a **handoff package**: a spec, a working single-file prototype, a design-system skill for Claude Code, a seed dataset, a database schema and a hosting plan. The production app (Next.js on Vercel) is built on top of it. Milestone M1, the read-only public map running on the seed data, is in place.

## What's here

```
.
├── README.md                  this file
├── CLAUDE.md                  instructions Claude Code reads first (AGENTS.md: Next.js 16 notes)
├── SPEC.md                    product spec: data model, connection model, views, interactions, integrations
├── app/                       Next.js App Router: layout (fonts, theme), page, globals.css (design tokens)
├── components/
│   ├── map/                   the canvas: React Flow nodes and edges, layouts' backgrounds, filters, inspector
│   └── ui/                    shadcn/ui components themed with the tokens
├── lib/
│   ├── map/                   pure logic with tests: types, visibility rule, filters, layouts, edge geometry, thumbnails
│   └── data/map.ts            where the public map comes from (seed now, Supabase in M2)
├── prototype/
│   ├── index.html             the working demo (open it in a browser, no build step)
│   └── versions/              snapshots of earlier demo versions + colour history
├── data/seed.json             sample map in the import/export format ({ topics, nodes, edges })
├── supabase/schema.sql        starter Postgres schema with row-level security
├── docs/
│   ├── hosting.md             GitHub + Vercel setup, public domain + password-protected edit subdomain
│   └── snippets/proxy.ts      host-based routing and password gate for the edit subdomain
├── .claude/skills/meta-map-design/
│   ├── SKILL.md               design system skill (tokens, type, components, canvas rules)
│   └── references/            tokens.css, components.md, canvas.md, thumbnail.js
├── .env.example               environment variables the app will need
├── .editorconfig, .gitignore, .nvmrc
```

## Look at the prototype

Open `prototype/index.html` in a browser. Everything works offline except the web fonts. Edits are kept in your browser's local storage. **Data → Copy JSON** exports the map in the same format as `data/seed.json`.

Keyboard: `1` `2` `3` switch views, `F` fits the map, `T` tidies the Free view, `Esc` closes panels.

## Run the app

Node 22 (`.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:3000
```

Before pushing: `npm run lint && npm run typecheck && npm test && npm run build`.

## Get the code

The repository is [Studio-Stereogram/andraspop](https://github.com/Studio-Stereogram/andraspop). `main` deploys to production on Vercel; work happens on branches and merges into `main`.

```bash
git clone git@github.com:Studio-Stereogram/andraspop.git
cd andraspop
```

## Build it with Claude Code

Open the folder in Claude Code. `CLAUDE.md` and the `meta-map-design` skill load automatically. A good next prompt:

> Read CLAUDE.md and SPEC.md, then start milestone M2: Supabase persistence behind lib/data/map.ts, the host routing and edit gate from docs/snippets/proxy.ts, and the editor (dock, connecting, inspector editing, Tidy, status). Keep prototype/index.html as the reference for editing behaviour.

## Deploy

GitHub + Vercel, one project, two domains: the public map on the main domain and the editor on `edit.` behind a password. See `docs/hosting.md` for the setup and the reasons behind it.

## Working agreements

- **Non-destructive changes.** Commit before every redesign. When the prototype's look changes, add a snapshot to `prototype/versions/` and a line to its README.
- **One source of truth for style.** Visual decisions live in the `meta-map-design` skill and `references/tokens.css`. Change them there first, then in code.
- **Public by default, private by flag.** Drafts and anything marked private never reach the public domain (ideas are public, as a roadmap), which is enforced in the database, not just the UI.
