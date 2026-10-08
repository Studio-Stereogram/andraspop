# Hosting and editing

**Goal:** the public map on your main domain, anyone can read it. The editor on a subdomain only you (and later teammates) can open. Both live on the same GitHub + Vercel setup as your other projects.

## Recommended setup: one app, two domains, in-app gate

```
github.com/<you>/meta-map  ──push main──▶  Vercel project "meta-map"
                                              ├── andraspop.com        public, read-only, cached
                                              └── edit.andraspop.com   editor, password-gated
                                                        │
                                                        ▼
                                                Supabase (Postgres + RLS)
```

- **One codebase, one Vercel project.** Both domains are attached to the same project. A small `proxy.ts` (called `middleware.ts` before Next.js 16) looks at the host name:
  - **Public host:** serves the read-only map. Any `/edit` or `/api/admin` path returns 404.
  - **`edit.` host:** asks for the password, then serves the editor (the same canvas with Edit mode, dock, inspector editing and Data).
- **Why not Vercel's own protection?** Vercel's deployment protection applies to a whole project, so it would lock the public domain too.
  - Vercel Authentication became free on every plan in September 2026, but every editor needs a Vercel account on your team.
  - Password Protection needs the Pro plan, at $20 per protected project per month.
  - You need an in-app check for database writes anyway, so the gate lives in the app.
- **Preview deployments** (one per pull request) stay behind Vercel Authentication, which is on by default for new projects. They're for you, not visitors.

## Two ways to gate the editor

| | Password gate (start here) | Magic-link login (when teammates join) |
|---|---|---|
| How | Browser password prompt (HTTP Basic Auth) from `proxy.ts`; one `EDIT_PASSWORD` env var | Supabase Auth email magic link; `editors` table lists allowed emails |
| Setup | ~20 lines, no accounts | Supabase Auth config + login page |
| Who | You (share the password with care) | Named people; revoke one without changing a password |
| Writes | Server actions use the Supabase service key after re-checking the password | Writes use the user's session; RLS checks `is_editor()` |
| Logout | Close the browser | Real sessions |

Start with the password gate (`docs/snippets/proxy.ts`). The schema already contains the `editors` table and `is_editor()` policy, so switching to magic links later doesn't need a migration.

**Security notes**
- Every server action and API route that writes must **re-check** the gate. The proxy is a convenience layer, not the only lock. Next.js has had proxy/middleware bypass bugs before.
- The service role key is server-only. Never prefix it with `NEXT_PUBLIC_`.
- Use a long random password (a password manager's 24+ characters) and rotate it by changing the env var and redeploying.

## Step by step

1. **GitHub.** Create the repo (see README). Private is simplest; public also works since secrets live only in Vercel.
2. **Supabase.** Create a project in an EU region (Frankfurt) and run `supabase/schema.sql` in the SQL editor. Import `data/seed.json` with the seed script the app will include in M1.
3. **Vercel.** "Add New Project" → import the GitHub repo → framework Next.js. Add the env vars from `.env.example` for Production and Preview.
4. **Domains.** In the Vercel project: Settings → Domains → add `andraspop.com` and `edit.andraspop.com`. At your DNS provider, add the records Vercel shows (usually a `CNAME` to `cname.vercel-dns.com` for each subdomain, or `A` records for an apex domain).
5. **Env:** set `PUBLIC_HOST=andraspop.com` and `EDIT_HOST=edit.andraspop.com` so the proxy knows which is which.
6. **Publish flow.** When you mark a video Published in the editor, the server action saves it and calls `revalidateTag('map')`, so the public page updates within seconds while staying cached.
7. **Platform sync (M3).** A Vercel Cron job (`vercel.json` → `crons`) calls `/api/sync/instagram` and `/api/sync/youtube` every 6–12 hours. The routes check `CRON_SECRET`.

## Domains

- Public: `andraspop.com` (apex: add the `A` record Vercel shows; optionally redirect `www.andraspop.com` to it in Vercel → Domains).
- Editor: `edit.andraspop.com` (`CNAME` to the target Vercel shows). Kept out of search engines with `X-Robots-Tag: noindex` (the proxy snippet does this).

## How the password and auto-refresh work

1. In Vercel → Project → Settings → Environment Variables, add `EDIT_PASSWORD` (Production, and Preview if you want previews editable). It never goes into the repo.
2. Visiting `edit.andraspop.com` shows the browser's password prompt; the proxy compares it with `EDIT_PASSWORD`. Every save re-checks it on the server.
3. Saving or publishing in the editor writes to Supabase and calls `revalidateTag('map')`. The next visitor to `andraspop.com` gets the fresh map within seconds; no redeploy.
4. Changing the password: edit the variable, then Redeploy (env changes apply to new deployments).
5. Optional later: Supabase Realtime so pages already open on `andraspop.com` update live.
