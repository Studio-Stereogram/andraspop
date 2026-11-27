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
  /** The topic whose word is hovered or focused in the intro (its entries are traced), or null. */
  tracing: string | null;
  /** Topic words shown in full ink: the traced one, else the filtered ones; empty means all. */
  litTopics: ReadonlySet<string>;
  traceTopic: (id: string | null) => void;
  /** Filter to this topic, or clear the filter when it is the only one on. */
  pickTopic: (id: string) => void;
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
