// The map's data model, in the JSON import/export shape ({ topics, nodes, edges }) used by
// data/seed.json and the prototype's "Copy JSON". See SPEC.md §3 and the field mapping in §8.

export type NodeType = "video" | "link" | "bookmark" | "person" | "note";
export type Platform = "youtube" | "instagram" | "x";
export type Status = "idea" | "draft" | "scheduled" | "published";

export type EdgeType = "continuity" | "reference";
export type ContinuityKind = "follow-up" | "series";
export type ReferenceKind = "references" | "attachment" | "inspired-by" | "features" | "made-by" | "related";
export type EdgeKind = ContinuityKind | ReferenceKind;

export interface Topic {
  id: string;
  name: string;
  /** Hex colour from the design tokens' topic set. */
  color: string;
}

export interface MapNode {
  id: string;
  type: NodeType;
  title: string;
  /** The "take", 1–3 sentences. */
  summary: string;
  /** Videos only. */
  platform: Platform | null;
  /** Videos only. */
  status: Status | null;
  /** ISO date (YYYY-MM-DD) or "" when not set. */
  date: string;
  url: string;
  /** Real thumbnail (https). Empty: videos get a generated pattern instead. */
  thumbnail: string;
  /** People only: X handle. */
  handle: string;
  duration: string;
  topics: string[];
  private: boolean;
  /** Free-layout position. */
  fx: number;
  fy: number;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  kind: EdgeKind;
}

export interface MapData {
  topics: Topic[];
  nodes: MapNode[];
  edges: MapEdge[];
}

export type View = "free" | "cluster" | "timeline";

export interface XY {
  x: number;
  y: number;
}

/** A node's box in flow coordinates. */
export interface Rect extends XY {
  w: number;
  h: number;
}
