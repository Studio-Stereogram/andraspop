# Meta Map

A canvas-based, explorable map of everything published while building in public. Videos from YouTube, Instagram and X sit on a node canvas next to the links, bookmarks, people and notes around them. Entries connect through **continuity** (series, sequels) and **reference** (context) links. Visitors browse it like a mind map instead of a feed. The same canvas is the private workflow tool for planning and publishing.

This repository starts as a **handoff package**: a spec, a working single-file prototype, a design-system skill for Claude Code, a seed dataset, a database schema and a hosting plan. The production app (Next.js on Vercel) gets built on top of it.

## What's here

```
.
├── README.md                  this file
├── CLAUDE.md                  instructions Claude Code reads first
├── SPEC.md                    product spec: data model, connection model, views, interactions, integrations
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

## Get the code

The repository is [Studio-Stereogram/andraspop](https://github.com/Studio-Stereogram/andraspop). `main` deploys to production on Vercel; work happens on branches and merges into `main`.

```bash
git clone git@github.com:Studio-Stereogram/andraspop.git
cd andraspop
```

## Build it with Claude Code

Open the folder in Claude Code. `CLAUDE.md` and the `meta-map-design` skill load automatically. A good first prompt:

> Read CLAUDE.md and SPEC.md, then do milestone M1: scaffold the Next.js app, set up shadcn/ui with our design tokens, and port the prototype canvas to React Flow using data/seed.json. Keep prototype/index.html as the visual reference.

## Deploy

GitHub + Vercel, one project, two domains: the public map on the main domain and the editor on `edit.` behind a password. See `docs/hosting.md` for the setup and the reasons behind it.

## Working agreements

- **Non-destructive changes.** Commit before every redesign. When the prototype's look changes, add a snapshot to `prototype/versions/` and a line to its README.
- **One source of truth for style.** Visual decisions live in the `meta-map-design` skill and `references/tokens.css`. Change them there first, then in code.
- **Public by default, private by flag.** Ideas, drafts and anything marked private never reach the public domain, which is enforced in the database, not just the UI.
