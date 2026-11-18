// Validation for what the editor sends to server actions. Anything a browser sends is untrusted, even behind the gate.

import { normalizeMap } from "@/lib/map/normalize";
import type { MapData, MapEdge, MapNode, Topic } from "@/lib/map/types";

const ID = /^[A-Za-z0-9_-]{1,80}$/;
const TOPIC_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
const LIMITS = { title: 300, summary: 4000, url: 2000, handle: 100, duration: 20, thumbnail: 2000 } as const;

export const isId = (v: unknown): v is string => typeof v === "string" && ID.test(v);

const clip = (s: string, max: number) => s.slice(0, max);

/** A node from the editor, sanitised with the same rules as an import. Null if it can't be one. */
export function parseNode(input: unknown): MapNode | null {
  const raw = (input ?? {}) as Record<string, unknown>;
  if (!isId(raw.id)) return null;
  const topics = Array.isArray(raw.topics) ? raw.topics.filter((t): t is string => typeof t === "string" && TOPIC_ID.test(t)) : [];
  const [n] = normalizeMap({ topics: topics.map((id) => ({ id, name: id, color: "#000000" })), nodes: [raw], edges: [] }).nodes;
  if (!n) return null;
  return {
    ...n,
    title: clip(n.title, LIMITS.title),
    summary: clip(n.summary, LIMITS.summary),
    url: clip(n.url, LIMITS.url),
    handle: clip(n.handle, LIMITS.handle),
    duration: clip(n.duration, LIMITS.duration),
    thumbnail: clip(n.thumbnail, LIMITS.thumbnail),
    date: /^\d{4}-\d{2}-\d{2}$/.test(n.date) ? n.date : "",
    fx: Math.max(-1e6, Math.min(1e6, n.fx)),
    fy: Math.max(-1e6, Math.min(1e6, n.fy)),
  };
}

/** A connection from the editor: known type and kind, two different ids. */
export function parseEdge(input: unknown): MapEdge | null {
  const raw = (input ?? {}) as Record<string, unknown>;
  if (typeof raw.id !== "string" || !isId(raw.from) || !isId(raw.to) || raw.from === raw.to) return null;
  const stub = (id: string) => ({ id, type: "note" });
  const [e] = normalizeMap({ topics: [], nodes: [stub(raw.from), stub(raw.to)], edges: [raw] }).edges;
  return e && e.id === raw.id ? e : null;
}

export function parseTopics(input: unknown): Topic[] | null {
  if (!Array.isArray(input) || input.length > 60) return null;
  const topics = normalizeMap({ topics: input, nodes: [], edges: [] }).topics;
  if (topics.some((t) => !TOPIC_ID.test(t.id) || !t.name.trim()) || new Set(topics.map((t) => t.id)).size !== topics.length)
    return null;
  return topics.map((t) => ({ ...t, name: t.name.trim().slice(0, 60) }));
}

export function parsePositions(input: unknown): { id: string; fx: number; fy: number }[] | null {
  if (!Array.isArray(input) || input.length > 5000) return null;
  const out = input.map((p) => (p ?? {}) as Record<string, unknown>);
  if (!out.every((p) => isId(p.id) && Number.isFinite(p.fx) && Number.isFinite(p.fy))) return null;
  return out.map((p) => ({ id: p.id as string, fx: Math.round(p.fx as number), fy: Math.round(p.fy as number) }));
}

/** A whole map for Data → Import: normalised, then every node checked like a single save. */
export function parseMap(input: unknown): MapData | null {
  let map: MapData;
  try {
    map = normalizeMap(input);
  } catch {
    return null;
  }
  const topics = parseTopics(map.topics);
  if (!topics) return null;
  const nodes = map.nodes.map(parseNode);
  if (nodes.some((n) => !n) || new Set(map.nodes.map((n) => n.id)).size !== map.nodes.length) return null;
  return { topics, nodes: nodes as MapNode[], edges: map.edges };
}
