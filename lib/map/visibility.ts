import type { MapData, MapEdge, MapNode, Platform, Status } from "./types";

export function neighbourMap(edges: MapEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) {
    m.set(e.from, [...(m.get(e.from) ?? []), e.to]);
    m.set(e.to, [...(m.get(e.to) ?? []), e.from]);
  }
  return m;
}

/**
 * A node is public if it isn't private and, for videos, isn't a draft: ideas, scheduled and published videos
 * are all shown (ideas as a roadmap). Mirrors node_is_public in supabase/schema.sql.
 */
export function isPublicNode(n: MapNode): boolean {
  return !n.private && (n.type !== "video" || n.status !== "draft");
}

/**
 * Ids visitors must not see: non-public nodes, plus reference-only nodes (links, bookmarks, people, notes)
 * whose every connection points to a non-public node. Standalone nodes with no connections stay visible.
 * One pass is enough and order doesn't matter: connections count both ways, so a reference-only node linked
 * to another one always has a visible neighbour.
 */
export function hiddenFromPublic(map: MapData): Set<string> {
  const base = new Set(map.nodes.filter((n) => !isPublicNode(n)).map((n) => n.id));
  const nb = neighbourMap(map.edges);
  const hidden = new Set(base);
  for (const n of map.nodes) {
    if (n.type === "video" || base.has(n.id)) continue;
    const ids = nb.get(n.id) ?? [];
    if (ids.length && ids.every((id) => base.has(id))) hidden.add(n.id);
  }
  return hidden;
}

/**
 * The visitor's copy of the map. Applied on the server so hidden entries never reach the browser.
 * Topics that only hidden entries use are dropped too.
 */
export function toPublicMap(map: MapData): MapData {
  const hidden = hiddenFromPublic(map);
  const nodes = map.nodes.filter((n) => !hidden.has(n.id));
  const used = new Set(nodes.flatMap((n) => n.topics));
  return {
    topics: map.topics.filter((t) => used.has(t.id)),
    nodes,
    edges: map.edges.filter((e) => !hidden.has(e.from) && !hidden.has(e.to)),
  };
}

export interface Filters {
  topics: ReadonlySet<string>;
  platforms: ReadonlySet<Platform>;
  /** Video statuses (visitors see idea, scheduled and published). */
  statuses: ReadonlySet<Status>;
  q: string;
  /** "Hide non-matching": hide instead of dim. */
  hide: boolean;
}

export const NO_FILTERS: Filters = { topics: new Set(), platforms: new Set(), statuses: new Set(), q: "", hide: false };

export function activeFilterCount(f: Filters): number {
  return f.topics.size + f.platforms.size + f.statuses.size + (f.q.trim() ? 1 : 0);
}

/** Matching nodes stay sharp; the rest dim, or hide with "Hide non-matching". */
export function applyFilters(nodes: MapNode[], f: Filters): { hidden: Set<string>; dim: Set<string> } {
  const hidden = new Set<string>();
  const dim = new Set<string>();
  if (!activeFilterCount(f)) return { hidden, dim };
  const q = f.q.trim().toLowerCase();
  for (const n of nodes) {
    const ok =
      (!f.topics.size || n.topics.some((t) => f.topics.has(t))) &&
      (!f.platforms.size || (n.type === "video" && n.platform !== null && f.platforms.has(n.platform))) &&
      (!f.statuses.size || (n.type === "video" && n.status !== null && f.statuses.has(n.status))) &&
      (!q || `${n.title} ${n.summary}`.toLowerCase().includes(q));
    if (!ok) (f.hide ? hidden : dim).add(n.id);
  }
  return { hidden, dim };
}
