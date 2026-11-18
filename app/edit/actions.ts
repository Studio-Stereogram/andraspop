"use server";

// Editor writes. Each action re-checks the gate itself (a server action can be called from any page, so the proxy
// alone is not enough), validates its input, writes through the store, then expires the public map's cache so
// visitors see the change on their next load.

import { updateTag } from "next/cache";
import seed from "@/data/seed.json";
import { assertEditor } from "@/lib/auth";
import { MAP_TAG } from "@/lib/data/map";
import { editorStore, type MapStore } from "@/lib/data/store";
import { isId, parseEdge, parseMap, parseNode, parsePositions, parseTopics } from "@/lib/data/validate";
import type { MapData } from "@/lib/map/types";

export type Result = { ok: true } | { ok: false; error: string };

async function write(fn: (store: MapStore) => Promise<void>): Promise<Result> {
  try {
    await assertEditor();
  } catch {
    return { ok: false, error: "Not allowed" };
  }
  const store = editorStore();
  if (!store) return { ok: false, error: "The database isn't connected" };
  try {
    await fn(store);
  } catch (err) {
    console.error("Editor save failed", err);
    return { ok: false, error: err instanceof Error && err.message === "Invalid input" ? "Invalid input" : "Couldn't save" };
  }
  updateTag(MAP_TAG);
  return { ok: true };
}

function need<T>(v: T | null): T {
  if (v === null) throw new Error("Invalid input");
  return v;
}

export async function saveNode(node: unknown): Promise<Result> {
  return write((s) => s.saveNode(need(parseNode(node))));
}

export async function savePositions(positions: unknown): Promise<Result> {
  return write((s) => s.savePositions(need(parsePositions(positions))));
}

export async function deleteNode(id: unknown): Promise<Result> {
  return write((s) => s.deleteNode(need(isId(id) ? id : null)));
}

export async function saveEdge(edge: unknown): Promise<Result> {
  return write((s) => s.saveEdge(need(parseEdge(edge))));
}

export async function deleteEdge(id: unknown): Promise<Result> {
  return write((s) => s.deleteEdge(need(typeof id === "string" && id.length <= 80 ? id : null)));
}

/** The full, ordered topic list (order is the cluster order). */
export async function saveTopics(topics: unknown): Promise<Result> {
  return write((s) => s.saveTopics(need(parseTopics(topics))));
}

/** Data → Import: replaces everything. */
export async function importMap(map: unknown): Promise<Result> {
  return write((s) => s.replaceAll(need(parseMap(map))));
}

/** First run: fill an empty database from data/seed.json. Refuses if it already has entries. */
export async function importSeed(): Promise<Result> {
  return write(async (s) => {
    const current: MapData = await s.read();
    if (current.nodes.length) throw new Error("Invalid input");
    await s.replaceAll(need(parseMap(seed)));
  });
}
