import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import type { MapData, MapEdge, MapNode, Topic } from "@/lib/map/types";
import {
  edgeToRow,
  isUuid,
  NODE_COLUMNS,
  nodeToRow,
  rowsToMap,
  topicToRow,
  type EdgeRow,
  type NodeRow,
  type NodeTopicRow,
  type TopicRow,
} from "./rows";
import { inList, rest, supabaseConfig, type SupabaseKey } from "./supabase";

/**
 * Where the map lives. Production: Supabase. Local development without Supabase: a JSON file in .data/ (git-ignored),
 * started from data/seed.json, so the editor can be tried without a database.
 */
export interface MapStore {
  readonly kind: "supabase" | "file";
  read(): Promise<MapData>;
  saveNode(node: MapNode): Promise<void>;
  savePositions(positions: { id: string; fx: number; fy: number }[]): Promise<void>;
  deleteNode(id: string): Promise<void>;
  saveEdge(edge: MapEdge): Promise<void>;
  deleteEdge(id: string): Promise<void>;
  saveTopics(topics: Topic[]): Promise<void>;
  /** Replaces everything (Data → Import). Not atomic on Supabase: export first. */
  replaceAll(map: MapData): Promise<void>;
}

/** The editor's store: Supabase with the secret key, else the dev file. Null in production without Supabase. */
export function editorStore(): MapStore | null {
  if (supabaseConfig("secret")) return supabaseStore("secret");
  if (process.env.NODE_ENV !== "production") return fileStore();
  return null;
}

/** Reads the whole map through Supabase with the given key (the publishable key only sees public rows). */
export async function readSupabase(kind: SupabaseKey): Promise<MapData> {
  const [topics, nodes, nodeTopics, edges] = await Promise.all([
    rest<TopicRow[]>(kind, "topics?select=id,name,color,sort_order&order=sort_order"),
    rest<NodeRow[]>(kind, `nodes?select=${NODE_COLUMNS}&order=created_at&limit=5000`),
    rest<NodeTopicRow[]>(kind, "node_topics?select=node_id,topic_id&limit=20000"),
    rest<EdgeRow[]>(kind, "edges?select=id,from_id,to_id,type,kind&limit=20000"),
  ]);
  return rowsToMap({ topics, nodes, nodeTopics, edges });
}

function supabaseStore(kind: SupabaseKey): MapStore {
  const uuidsBySlug = async (slugs: string[]) => {
    const rows = await rest<{ id: string; slug: string }[]>(kind, `nodes?select=id,slug&slug=${inList(slugs)}`);
    return new Map(rows.map((r) => [r.slug, r.id]));
  };
  const setTopics = async (nodeUuid: string, topics: string[]) => {
    await rest(kind, `node_topics?node_id=eq.${nodeUuid}`, { method: "DELETE" });
    if (topics.length)
      await rest(kind, "node_topics", { method: "POST", body: topics.map((topic_id) => ({ node_id: nodeUuid, topic_id })) });
  };

  return {
    kind: "supabase",
    read: () => readSupabase(kind),

    async saveNode(node) {
      // Only one entry can be New (unique index): taking the tag clears it everywhere else first.
      if (node.new)
        await rest(kind, `nodes?is_new=is.true&slug=neq.${encodeURIComponent(node.id)}`, {
          method: "PATCH",
          body: { is_new: false },
        });
      const [row] = await rest<{ id: string }[]>(kind, "nodes?on_conflict=slug&select=id", {
        method: "POST",
        body: [nodeToRow(node)],
        prefer: "resolution=merge-duplicates,return=representation",
      });
      await setTopics(row.id, node.topics);
    },

    async savePositions(positions) {
      await Promise.all(
        positions.map((p) =>
          rest(kind, `nodes?slug=eq.${encodeURIComponent(p.id)}`, {
            method: "PATCH",
            body: { pos_x: Math.round(p.fx), pos_y: Math.round(p.fy) },
          }),
        ),
      );
    },

    async deleteNode(id) {
      // Connections and topic links go with it (on delete cascade).
      await rest(kind, `nodes?slug=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    },

    async saveEdge(edge) {
      const row = edgeToRow(edge, await uuidsBySlug([edge.from, edge.to]));
      if (!row || !isUuid(row.id)) throw new Error("Unknown entries or a malformed connection id");
      await rest(kind, "edges?on_conflict=id", { method: "POST", body: [row], prefer: "resolution=merge-duplicates" });
    },

    async deleteEdge(id) {
      if (!isUuid(id)) return;
      await rest(kind, `edges?id=eq.${id}`, { method: "DELETE" });
    },

    async saveTopics(topics) {
      if (topics.length)
        await rest(kind, "topics?on_conflict=id", {
          method: "POST",
          body: topics.map(topicToRow),
          prefer: "resolution=merge-duplicates",
        });
    },

    async replaceAll(map) {
      // PostgREST refuses an unfiltered DELETE, so each one matches every row explicitly.
      await rest(kind, "edges?id=not.is.null", { method: "DELETE" });
      await rest(kind, "nodes?id=not.is.null", { method: "DELETE" }); // node_topics cascade
      await rest(kind, "topics?id=not.is.null", { method: "DELETE" });
      if (map.topics.length) await rest(kind, "topics", { method: "POST", body: map.topics.map(topicToRow) });
      if (!map.nodes.length) return;
      const created = await rest<{ id: string; slug: string }[]>(kind, "nodes?select=id,slug", {
        method: "POST",
        body: map.nodes.map(nodeToRow),
        prefer: "return=representation",
      });
      const uuidOf = new Map(created.map((r) => [r.slug, r.id]));
      const tags = map.nodes.flatMap((n) => n.topics.map((topic_id) => ({ node_id: uuidOf.get(n.id)!, topic_id })));
      if (tags.length) await rest(kind, "node_topics", { method: "POST", body: tags });
      const edges = map.edges
        .map((e) => edgeToRow({ ...e, id: isUuid(e.id) ? e.id : crypto.randomUUID() }, uuidOf))
        .filter((r): r is EdgeRow => r !== null);
      if (edges.length) await rest(kind, "edges", { method: "POST", body: edges });
    },
  };
}

// ---------- local development: a JSON file ----------

const FILE = path.join(process.cwd(), ".data", "map.json");

async function readFileMap(): Promise<MapData> {
  try {
    return normalizeMap(JSON.parse(await readFile(FILE, "utf8")));
  } catch {
    return normalizeMap(seed);
  }
}

export function fileStore(): MapStore {
  const update = async (fn: (m: MapData) => MapData) => {
    const next = fn(await readFileMap());
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(next, null, 2));
  };
  return {
    kind: "file",
    read: readFileMap,
    saveNode: (node) =>
      update((m) => {
        const others = node.new ? m.nodes.map((n) => (n.new && n.id !== node.id ? { ...n, new: undefined } : n)) : m.nodes;
        return {
          ...m,
          nodes: others.some((n) => n.id === node.id) ? others.map((n) => (n.id === node.id ? node : n)) : [...others, node],
        };
      }),
    savePositions: (ps) =>
      update((m) => {
        const at = new Map(ps.map((p) => [p.id, p]));
        return { ...m, nodes: m.nodes.map((n) => (at.has(n.id) ? { ...n, fx: at.get(n.id)!.fx, fy: at.get(n.id)!.fy } : n)) };
      }),
    deleteNode: (id) =>
      update((m) => ({
        ...m,
        nodes: m.nodes.filter((n) => n.id !== id),
        edges: m.edges.filter((e) => e.from !== id && e.to !== id),
      })),
    saveEdge: (edge) =>
      update((m) => ({
        ...m,
        edges: m.edges.some((e) => e.id === edge.id) ? m.edges.map((e) => (e.id === edge.id ? edge : e)) : [...m.edges, edge],
      })),
    deleteEdge: (id) => update((m) => ({ ...m, edges: m.edges.filter((e) => e.id !== id) })),
    saveTopics: (topics) =>
      update((m) => {
        const byId = new Map(m.topics.map((t) => [t.id, t]));
        topics.forEach((t) => byId.set(t.id, t));
        return { ...m, topics: [...byId.values()] };
      }),
    replaceAll: (map) => update(() => map),
  };
}

/** Whether a dev map file exists (public page in development reads it, so edits show up there too). */
export async function hasFileMap(): Promise<boolean> {
  try {
    await readFile(FILE);
    return true;
  } catch {
    return false;
  }
}
