// Editing helpers shared by the editor UI: new entries, ids and the relation a new connection gets by default.

import type { EdgeKind, EdgeType, MapData, MapEdge, MapNode, NodeType } from "./types";

/** A new entry's id (also its slug for deep links). Short, URL-safe, unique enough for one editor. */
export function newNodeId(): string {
  return `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Connections use uuids (the database's edge id). */
export const newEdgeId = (): string => crypto.randomUUID();

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** A blank entry of a type, as the prototype creates them: videos start as YouTube drafts, notes start private. */
export function newNode(type: NodeType, at: { x: number; y: number }, extra: Partial<MapNode> = {}): MapNode {
  return {
    id: newNodeId(),
    type,
    title: "",
    summary: "",
    platform: type === "video" ? "youtube" : null,
    status: type === "video" ? "draft" : null,
    date: type === "video" ? "" : todayIso(),
    url: "",
    thumbnail: "",
    handle: "",
    duration: "",
    topics: [],
    private: type === "note",
    fx: Math.round(at.x),
    fy: Math.round(at.y),
    ...extra,
  };
}

/** The reference kind a connection from a to b gets by default (SPEC.md §3: video → person = features, …). */
export function referenceKind(a: Pick<MapNode, "type">, b: Pick<MapNode, "type">): EdgeKind {
  if (b.type === "person") return a.type === "video" ? "features" : a.type === "bookmark" || a.type === "link" ? "made-by" : "related";
  if (a.type === "person") return "inspired-by";
  if (a.type === "video" && b.type === "link") return "attachment";
  if (b.type === "bookmark") return "references";
  return "related";
}

export function kindFor(type: EdgeType, a: Pick<MapNode, "type">, b: Pick<MapNode, "type">): EdgeKind {
  return type === "continuity" ? "follow-up" : referenceKind(a, b);
}

/** Only a connection of the same type blocks a second link between the same two entries (either direction). */
export function canConnect(edges: MapEdge[], from: string, to: string, type: EdgeType): boolean {
  if (from === to) return false;
  return !edges.some((e) => e.type === type && ((e.from === from && e.to === to) || (e.from === to && e.to === from)));
}

/** Topic ids from names: lowercase, dashes, unique within the map. */
export function topicIdFor(name: string, map: Pick<MapData, "topics">): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "topic";
  let id = base,
    i = 2;
  while (map.topics.some((t) => t.id === id)) id = `${base}-${i++}`;
  return id;
}
