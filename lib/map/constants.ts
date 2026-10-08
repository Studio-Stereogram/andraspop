import type { ContinuityKind, EdgeKind, EdgeType, NodeType, Platform, ReferenceKind, Status, View } from "./types";

export const KIND_LABEL: Record<NodeType, string> = {
  video: "Video",
  link: "Link",
  bookmark: "Bookmark",
  person: "Person",
  note: "Note",
};

export const PLATFORMS: Record<Platform, { label: string; short: string }> = {
  youtube: { label: "YouTube", short: "YT" },
  instagram: { label: "Instagram", short: "IG" },
  x: { label: "X", short: "X" },
};

export const STATUS_LABEL: Record<Status, string> = {
  idea: "Idea",
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

export const CONTINUITY_KINDS: Record<ContinuityKind, string> = {
  "follow-up": "next in series",
  series: "same series",
};

export const REFERENCE_KINDS: Record<ReferenceKind, string> = {
  references: "references",
  attachment: "attachment",
  "inspired-by": "inspired by",
  features: "features",
  "made-by": "made by",
  related: "related",
};

export const EDGE_KIND_LABEL: Record<EdgeKind, string> = { ...CONTINUITY_KINDS, ...REFERENCE_KINDS };

export const EDGE_TYPE_LABEL: Record<EdgeType, string> = {
  continuity: "Continuity",
  reference: "Reference",
};

export const VIEWS: { id: View; label: string; key: string }[] = [
  { id: "free", label: "Free", key: "1" },
  { id: "cluster", label: "Clusters", key: "2" },
  { id: "timeline", label: "Timeline", key: "3" },
];

/** Card widths per node type (canvas.md → Node anatomy). */
export const NODE_WIDTH: Record<NodeType, number> = {
  video: 252,
  link: 224,
  bookmark: 224,
  person: 236,
  note: 224,
};

/** Height estimates used until React Flow has measured a node. */
export const NODE_HEIGHT_ESTIMATE: Record<NodeType, number> = {
  video: 236,
  link: 104,
  bookmark: 104,
  person: 62,
  note: 104,
};

/** Topic palette, in assignment order (tokens.css --topic-1 … --topic-10). */
export const TOPIC_PALETTE = [
  "#3E63DD", "#12A594", "#F76B15", "#D6409F", "#8E4EC6",
  "#A18072", "#46A758", "#0090FF", "#E5484D", "#FFB224",
] as const;
