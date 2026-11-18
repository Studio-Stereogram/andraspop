// Database rows ↔ the app's JSON shape ({ topics, nodes, edges }). Pure, so it is unit-tested.
// Field mapping (SPEC.md §8): node.id ↔ nodes.slug (nodes.id is a uuid), fx/fy ↔ pos_x/pos_y, node.topics ↔ node_topics,
// edge.from/to (node ids) ↔ edges.from_id/to_id (uuids). Edge ids are the edges' uuids.

import { normalizeMap } from "@/lib/map/normalize";
import type { MapData, MapEdge, MapNode, Topic } from "@/lib/map/types";

export interface TopicRow {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface NodeRow {
  id: string;
  slug: string | null;
  type: string;
  title: string;
  summary: string;
  platform: string | null;
  status: string | null;
  date: string | null;
  url: string | null;
  handle: string | null;
  duration: string | null;
  thumbnail: string | null;
  links: unknown;
  private: boolean;
  pos_x: number;
  pos_y: number;
}

export interface NodeTopicRow {
  node_id: string;
  topic_id: string;
}

export interface EdgeRow {
  id: string;
  from_id: string;
  to_id: string;
  type: string;
  kind: string;
}

/** The columns a node write sends. `id` (uuid) is left to the database; `slug` carries the app's id. */
export type NodeWrite = Omit<NodeRow, "id">;

export const NODE_COLUMNS = "id,slug,type,title,summary,platform,status,date,url,handle,duration,thumbnail,links,private,pos_x,pos_y";

/** Rows as read from Supabase → a well-formed map (normalizeMap drops anything malformed). */
export function rowsToMap(rows: {
  topics: TopicRow[];
  nodes: NodeRow[];
  nodeTopics: NodeTopicRow[];
  edges: EdgeRow[];
}): MapData {
  const appId = new Map(rows.nodes.map((n) => [n.id, n.slug || n.id]));
  const topicsOf = new Map<string, string[]>();
  for (const nt of rows.nodeTopics) topicsOf.set(nt.node_id, [...(topicsOf.get(nt.node_id) ?? []), nt.topic_id]);
  const topics: Topic[] = [...rows.topics]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({ id: t.id, name: t.name, color: t.color }));
  const nodes = rows.nodes.map((n) => ({
    id: appId.get(n.id)!,
    type: n.type,
    title: n.title,
    summary: n.summary,
    platform: n.platform,
    status: n.status,
    date: n.date ?? "",
    url: n.url ?? "",
    thumbnail: n.thumbnail ?? "",
    handle: n.handle ?? "",
    duration: n.duration ?? "",
    links: n.links ?? [],
    topics: topicsOf.get(n.id) ?? [],
    private: n.private,
    fx: n.pos_x,
    fy: n.pos_y,
  }));
  const edges = rows.edges
    .filter((e) => appId.has(e.from_id) && appId.has(e.to_id))
    .map((e) => ({ id: e.id, from: appId.get(e.from_id)!, to: appId.get(e.to_id)!, type: e.type, kind: e.kind }));
  return normalizeMap({ topics, nodes, edges });
}

export function topicToRow(t: Topic, order: number): TopicRow {
  return { id: t.id, name: t.name, color: t.color, sort_order: order };
}

/** A node → the columns to write. Empty strings become null where the column is optional, and dates must be ISO. */
export function nodeToRow(n: MapNode): NodeWrite {
  const isVideo = n.type === "video";
  return {
    slug: n.id,
    type: n.type,
    title: n.title,
    summary: n.summary,
    platform: isVideo ? n.platform : null,
    status: isVideo ? (n.status ?? "draft") : null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(n.date) ? n.date : null,
    url: n.url || null,
    handle: n.handle || null,
    duration: n.duration || null,
    thumbnail: n.thumbnail || null,
    links: n.links,
    private: n.private,
    pos_x: Math.round(n.fx),
    pos_y: Math.round(n.fy),
  };
}

/** Edge → row, given the uuid of every node by app id. Null when either end is unknown. */
export function edgeToRow(e: MapEdge, uuidOf: ReadonlyMap<string, string>): EdgeRow | null {
  const from = uuidOf.get(e.from),
    to = uuidOf.get(e.to);
  if (!from || !to || from === to) return null;
  return { id: e.id, from_id: from, to_id: to, type: e.type, kind: e.kind };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);
