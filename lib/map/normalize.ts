import { CONTINUITY_KINDS, REFERENCE_KINDS, TOPIC_PALETTE } from "./constants";
import type { EdgeKind, EdgeType, MapData, MapEdge, MapNode, NodeType, Platform, Status, Topic } from "./types";

const NODE_TYPES: NodeType[] = ["video", "link", "bookmark", "person", "note"];
const PLATFORM_IDS: Platform[] = ["youtube", "instagram", "x"];
const STATUSES: Status[] = ["idea", "draft", "scheduled", "published"];
const HEX = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const httpsUrl = (v: string) => {
  try {
    return new URL(v).protocol === "https:" ? v : "";
  } catch {
    return "";
  }
};
const oneOf = <T extends string>(v: unknown, list: readonly T[]): T | null =>
  list.includes(v as T) ? (v as T) : null;

/** Older exports had no edge `type`; the kind decides it (same rule as the prototype). */
export function edgeTypeOf(kind: string): EdgeType {
  return kind in CONTINUITY_KINDS ? "continuity" : "reference";
}

/**
 * Turns `{ topics, nodes, edges }` JSON (seed file, prototype export) into a well-formed MapData:
 * fills defaults, drops unknown enum values and edges that point at missing nodes.
 * Topic colours must be hex, because they end up in SVG attributes and CSS.
 */
export function normalizeMap(input: unknown): MapData {
  const data = (input ?? {}) as Raw;
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("Expected { topics, nodes, edges }");
  }

  const topics: Topic[] = (Array.isArray(data.topics) ? (data.topics as Raw[]) : []).map((t, i) => ({
    id: str(t.id),
    name: str(t.name),
    color: HEX.test(str(t.color)) ? str(t.color) : TOPIC_PALETTE[i % TOPIC_PALETTE.length],
  }));
  const topicIds = new Set(topics.map((t) => t.id));

  const nodes: MapNode[] = (data.nodes as Raw[])
    .filter((n) => str(n.id) && oneOf(n.type, NODE_TYPES))
    .map((n) => {
      const type = n.type as NodeType;
      const isVideo = type === "video";
      return {
        id: str(n.id),
        type,
        title: str(n.title),
        summary: str(n.summary),
        platform: isVideo ? oneOf(n.platform, PLATFORM_IDS) : null,
        status: isVideo ? (oneOf(n.status, STATUSES) ?? "draft") : null,
        date: str(n.date),
        url: str(n.url),
        thumbnail: httpsUrl(str(n.thumbnail)),
        handle: str(n.handle),
        duration: str(n.duration),
        topics: (Array.isArray(n.topics) ? n.topics : []).filter((id): id is string => topicIds.has(id as string)),
        private: n.private === true,
        fx: num(n.fx),
        fy: num(n.fy),
      };
    });
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges: MapEdge[] = (data.edges as Raw[])
    .filter((e) => nodeIds.has(str(e.from)) && nodeIds.has(str(e.to)) && e.from !== e.to)
    .map((e, i) => {
      const kind = str(e.kind);
      const type = oneOf(e.type, ["continuity", "reference"] as const) ?? edgeTypeOf(kind);
      const kinds: Record<string, string> = type === "continuity" ? CONTINUITY_KINDS : REFERENCE_KINDS;
      return {
        id: str(e.id) || `e${i + 1}`,
        from: str(e.from),
        to: str(e.to),
        type,
        kind: (kind in kinds ? kind : type === "continuity" ? "follow-up" : "related") as EdgeKind,
      };
    });

  return { topics, nodes, edges };
}
