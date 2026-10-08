-- Meta Map — starter schema (Supabase / Postgres)
-- Run in the Supabase SQL editor. Public visitors use the anon key and only ever see public rows.

create extension if not exists "pgcrypto";

-- Topics ---------------------------------------------------------------
create table public.topics (
  id          text primary key,              -- slug, e.g. 'art'
  name        text not null,
  color       text not null,                 -- hex, from the design tokens' topic set
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- Nodes (entries) ------------------------------------------------------
create type node_type   as enum ('video','link','bookmark','person','note');
create type node_status as enum ('idea','draft','scheduled','published');
create type platform    as enum ('youtube','instagram','x');

create table public.nodes (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,                   -- for deep links /#slug
  type        node_type not null,
  title       text not null default '',
  summary     text not null default '',      -- "the take"
  platform    platform,                      -- videos only
  status      node_status,                   -- videos only
  date        date,                          -- publish/scheduled date for videos, added date otherwise
  url         text,
  handle      text,                          -- people: X handle
  duration    text,
  thumbnail   text,
  private     boolean not null default false,
  pos_x       real not null default 0,       -- Free layout position
  pos_y       real not null default 0,
  external_id text,                          -- platform media id for sync
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint video_fields check (
    (type = 'video' and status is not null) or (type <> 'video')
  )
);
create index on public.nodes (type, status);
create unique index nodes_platform_external on public.nodes (platform, external_id) where external_id is not null;

create table public.node_topics (
  node_id  uuid references public.nodes(id) on delete cascade,
  topic_id text references public.topics(id) on delete cascade,
  primary key (node_id, topic_id)
);

-- Edges (connections) ---------------------------------------------------
create type edge_type as enum ('continuity','reference');

create table public.edges (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references public.nodes(id) on delete cascade,
  to_id      uuid not null references public.nodes(id) on delete cascade,
  type       edge_type not null,
  kind       text not null,
  created_at timestamptz not null default now(),
  constraint no_self check (from_id <> to_id),
  constraint kind_matches_type check (
    (type = 'continuity' and kind in ('follow-up','series')) or
    (type = 'reference'  and kind in ('references','attachment','inspired-by','features','made-by','related'))
  ),
  unique (from_id, to_id, type)
);

-- Platform data (M3) ----------------------------------------------------
create table public.stats_snapshots (
  id          bigint generated always as identity primary key,
  node_id     uuid not null references public.nodes(id) on delete cascade,
  fetched_at  timestamptz not null default now(),
  metrics     jsonb not null                 -- {views, reach, likes, comments, saves, shares, avg_watch_time}
);
create index on public.stats_snapshots (node_id, fetched_at desc);

create table public.integrations (            -- server-only; no public policies
  platform     platform primary key,
  account_id   text not null,
  access_token text not null,                 -- store encrypted (e.g. pgsodium / Vault) in production
  expires_at   timestamptz
);

-- Editors (for magic-link login later) -------------------------------------
create table public.editors (
  email text primary key,
  role  text not null default 'editor' check (role in ('owner','editor'))
);

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editors e where e.email = (auth.jwt() ->> 'email'));
$$;

-- Visibility rule ----------------------------------------------------------
-- A node is public if it isn't private and (for videos) is published or scheduled.
create or replace function public.node_is_public(n public.nodes) returns boolean
language sql stable as $$
  select not n.private and (n.type <> 'video' or n.status in ('published','scheduled'));
$$;

-- Row-level security --------------------------------------------------------
alter table public.topics          enable row level security;
alter table public.nodes           enable row level security;
alter table public.node_topics     enable row level security;
alter table public.edges           enable row level security;
alter table public.stats_snapshots enable row level security;
alter table public.integrations    enable row level security;
alter table public.editors         enable row level security;

-- public read
create policy "topics are public" on public.topics for select using (true);
create policy "public nodes" on public.nodes for select using (public.node_is_public(nodes) or public.is_editor());
create policy "topics of public nodes" on public.node_topics for select
  using (exists (select 1 from public.nodes n where n.id = node_id and (public.node_is_public(n) or public.is_editor())));
create policy "edges between public nodes" on public.edges for select
  using (
    public.is_editor() or (
      exists (select 1 from public.nodes a where a.id = from_id and public.node_is_public(a)) and
      exists (select 1 from public.nodes b where b.id = to_id   and public.node_is_public(b))
    )
  );
create policy "stats of public nodes" on public.stats_snapshots for select
  using (exists (select 1 from public.nodes n where n.id = node_id and (public.node_is_public(n) or public.is_editor())));

-- editor writes (magic-link mode). With the password gate, writes use the service role key server-side.
create policy "editors write topics" on public.topics      for all using (public.is_editor()) with check (public.is_editor());
create policy "editors write nodes"  on public.nodes       for all using (public.is_editor()) with check (public.is_editor());
create policy "editors write tags"   on public.node_topics for all using (public.is_editor()) with check (public.is_editor());
create policy "editors write edges"  on public.edges       for all using (public.is_editor()) with check (public.is_editor());
-- integrations and editors: no policies → only the service role can read/write them.

-- Note: the extra rule "hide reference-only nodes whose every connection is hidden"
-- is applied in the public query (see SPEC.md), because it depends on the whole graph.

-- keep updated_at fresh
create or replace function public.touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger nodes_touch before update on public.nodes for each row execute function public.touch();
