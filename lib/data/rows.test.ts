import { describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import { edgeToRow, isUuid, nodeToRow, rowsToMap, topicToRow, type EdgeRow, type NodeRow } from "./rows";

const map = normalizeMap(seed);

/** What Supabase would hand back after map was written with nodeToRow / edgeToRow. */
function roundTrip() {
  const uuidOf = new Map(map.nodes.map((n) => [n.id, crypto.randomUUID()]));
  const nodes: NodeRow[] = map.nodes.map((n) => ({ id: uuidOf.get(n.id)!, ...nodeToRow(n) }));
  const nodeTopics = map.nodes.flatMap((n) => n.topics.map((topic_id) => ({ node_id: uuidOf.get(n.id)!, topic_id })));
  const edges = map.edges
    .map((e) => edgeToRow({ ...e, id: crypto.randomUUID() }, uuidOf))
    .filter((r): r is EdgeRow => r !== null);
  const topics = map.topics.map(topicToRow).reverse(); // order comes from sort_order, not row order
  return rowsToMap({ topics, nodes, nodeTopics, edges });
}

describe("rows ↔ map", () => {
  it("round-trips the seed: ids become slugs, positions and topics survive", () => {
    const back = roundTrip();
    expect(back.topics).toEqual(map.topics);
    expect(back.nodes.map(({ id, fx, fy, topics, title, status }) => ({ id, fx, fy, topics, title, status }))).toEqual(
      map.nodes.map(({ id, fx, fy, topics, title, status }) => ({ id, fx, fy, topics, title, status })),
    );
    expect(back.edges.map(({ from, to, type, kind }) => ({ from, to, type, kind }))).toEqual(
      map.edges.map(({ from, to, type, kind }) => ({ from, to, type, kind })),
    );
    expect(back.edges.every((e) => isUuid(e.id))).toBe(true);
  });

  it("keeps extra links through a write and a read", () => {
    const back = roundTrip();
    const withLinks = map.nodes.filter((n) => n.links.length);
    expect(withLinks.length).toBeGreaterThan(0);
    for (const n of withLinks) expect(back.nodes.find((b) => b.id === n.id)!.links).toEqual(n.links);
  });

  it("writes optional fields as null and only real ISO dates", () => {
    const n = { ...map.nodes[0], url: "", date: "soon", handle: "", fx: 10.6, fy: -3.2 };
    const row = nodeToRow(n);
    expect(row).toMatchObject({ slug: n.id, url: null, date: null, handle: null, pos_x: 11, pos_y: -3 });
  });

  it("keeps platform and status for videos only, and gives videos a status", () => {
    const link = map.nodes.find((n) => n.type === "link")!;
    expect(nodeToRow({ ...link, platform: "youtube", status: "published" })).toMatchObject({ platform: null, status: null });
    const video = map.nodes.find((n) => n.type === "video")!;
    expect(nodeToRow({ ...video, status: null }).status).toBe("draft");
  });

  it("skips connections to unknown entries and to itself", () => {
    const uuidOf = new Map([["a", crypto.randomUUID()]]);
    const e = { id: crypto.randomUUID(), from: "a", to: "b", type: "reference" as const, kind: "related" as const };
    expect(edgeToRow(e, uuidOf)).toBeNull();
    expect(edgeToRow({ ...e, to: "a" }, uuidOf)).toBeNull();
  });
});
