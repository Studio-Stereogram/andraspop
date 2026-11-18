"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as actions from "@/app/edit/actions";
import type { Result } from "@/app/edit/actions";
import { TOPIC_PALETTE } from "@/lib/map/constants";
import { topicIdFor } from "@/lib/map/edit";
import type { MapData, MapEdge, MapNode, Topic, XY } from "@/lib/map/types";

export type SaveState = "saved" | "saving" | "error";

const NODE_SAVE_MS = 600;

/**
 * The editor's copy of the map and how changes reach the server. Every change applies locally at once; saves go
 * through one queue so they land in order (a new entry is stored before a connection to it). Typing in the inspector
 * saves 600ms after the last keystroke.
 */
export function useEditor(initial: MapData, onError: (msg: string) => void) {
  const [data, setData] = useState(initial);
  const dataRef = useRef(data);
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const commit = useCallback((fn: (m: MapData) => MapData) => {
    dataRef.current = fn(dataRef.current);
    setData(dataRef.current);
  }, []);

  const enqueue = useCallback(
    (job: () => Promise<Result>) => {
      setPending((p) => p + 1);
      queue.current = queue.current.then(async () => {
        let r: Result;
        try {
          r = await job();
        } catch {
          r = { ok: false, error: "Couldn't reach the server" };
        }
        setPending((p) => p - 1);
        if (r.ok) setFailed(false);
        else {
          setFailed(true);
          onError(`Not saved: ${r.error}`);
        }
      });
    },
    [onError],
  );

  const saveNodeNow = useCallback(
    (id: string) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      enqueue(async () => {
        const n = dataRef.current.nodes.find((x) => x.id === id);
        return n ? actions.saveNode(n) : { ok: true };
      });
    },
    [enqueue],
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<MapNode>, now = false) => {
      commit((m) => ({ ...m, nodes: m.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
      if (now) return saveNodeNow(id);
      clearTimeout(timers.current.get(id));
      timers.current.set(id, setTimeout(() => saveNodeNow(id), NODE_SAVE_MS));
    },
    [commit, saveNodeNow],
  );

  const addNode = useCallback(
    (node: MapNode, edge?: MapEdge) => {
      commit((m) => ({ ...m, nodes: [...m.nodes, node], edges: edge ? [...m.edges, edge] : m.edges }));
      enqueue(() => actions.saveNode(node));
      if (edge) enqueue(() => actions.saveEdge(edge));
    },
    [commit, enqueue],
  );

  const removeNode = useCallback(
    (id: string) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      commit((m) => ({
        ...m,
        nodes: m.nodes.filter((n) => n.id !== id),
        edges: m.edges.filter((e) => e.from !== id && e.to !== id),
      }));
      enqueue(() => actions.deleteNode(id));
    },
    [commit, enqueue],
  );

  const addEdge = useCallback(
    (edge: MapEdge) => {
      commit((m) => ({ ...m, edges: [...m.edges, edge] }));
      enqueue(() => actions.saveEdge(edge));
    },
    [commit, enqueue],
  );

  const updateEdge = useCallback(
    (id: string, patch: Partial<MapEdge>) => {
      commit((m) => ({ ...m, edges: m.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
      enqueue(async () => {
        const e = dataRef.current.edges.find((x) => x.id === id);
        return e ? actions.saveEdge(e) : { ok: true };
      });
    },
    [commit, enqueue],
  );

  const removeEdge = useCallback(
    (id: string) => {
      commit((m) => ({ ...m, edges: m.edges.filter((e) => e.id !== id) }));
      enqueue(() => actions.deleteEdge(id));
    },
    [commit, enqueue],
  );

  /** Finds a topic by name (any case) or creates it with the next palette colour. */
  const ensureTopic = useCallback(
    (name: string): Topic => {
      const m = dataRef.current;
      const found = m.topics.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (found) return found;
      const t = { id: topicIdFor(name, m), name, color: TOPIC_PALETTE[m.topics.length % TOPIC_PALETTE.length] };
      commit((x) => ({ ...x, topics: [...x.topics, t] }));
      const topics = dataRef.current.topics;
      enqueue(() => actions.saveTopics(topics));
      return t;
    },
    [commit, enqueue],
  );

  const setPositions = useCallback(
    (positions: Map<string, XY>) => {
      if (!positions.size) return;
      commit((m) => ({
        ...m,
        nodes: m.nodes.map((n) => {
          const p = positions.get(n.id);
          return p ? { ...n, fx: Math.round(p.x), fy: Math.round(p.y) } : n;
        }),
      }));
      const list = [...positions].map(([id, p]) => ({ id, fx: Math.round(p.x), fy: Math.round(p.y) }));
      enqueue(() => actions.savePositions(list));
    },
    [commit, enqueue],
  );

  /** Data → Import. Waits for the queue, then replaces everything. */
  const replaceAll = useCallback(
    async (map: MapData): Promise<Result> => {
      await queue.current;
      const r = await actions.importMap(map);
      if (r.ok) commit(() => map);
      return r;
    },
    [commit],
  );

  const importSeed = useCallback(async (): Promise<Result> => {
    await queue.current;
    return actions.importSeed();
  }, []);

  // Typing that hasn't been sent yet would be lost on close, so the browser asks first.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending > 0 || timers.current.size > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);

  const saveState: SaveState = pending > 0 ? "saving" : failed ? "error" : "saved";

  return {
    data,
    saveState,
    updateNode,
    saveNodeNow,
    addNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
    ensureTopic,
    setPositions,
    replaceAll,
    importSeed,
  };
}

export type EditorApi = ReturnType<typeof useEditor>;
