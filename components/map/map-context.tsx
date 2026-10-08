"use client";

import { createContext, useContext } from "react";
import type { Topic } from "@/lib/map/types";

/** What canvas pieces need to know beyond their own data: topics, the selection and the filter result. */
export interface MapVisual {
  topicById: ReadonlyMap<string, Topic>;
  selectedId: string | null;
  /** Neighbours of the selection (highlighted while everything else fades). */
  neighbours: ReadonlySet<string>;
  /** Nodes that don't match the filters, shown dimmed. */
  dim: ReadonlySet<string>;
  /** Topics the filter narrows to; cluster regions of other topics fade. */
  topicFilter: ReadonlySet<string>;
}

export const MapVisualContext = createContext<MapVisual | null>(null);

export function useMapVisual(): MapVisual {
  const v = useContext(MapVisualContext);
  if (!v) throw new Error("useMapVisual must be used inside MapVisualContext");
  return v;
}

/** Class names for a node's state: sel, nb (neighbour of the selection), fade, dim. */
export function useNodeState(id: string, selected: boolean): string {
  const { selectedId, neighbours, dim } = useMapVisual();
  const nb = neighbours.has(id);
  return [
    selected && "sel",
    nb && "nb",
    selectedId && !selected && !nb && "fade",
    dim.has(id) && "dim",
  ]
    .filter(Boolean)
    .join(" ");
}
