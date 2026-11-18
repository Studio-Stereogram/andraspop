import { describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import { parseEdge, parseMap, parseNode, parsePositions, parseTopics } from "./validate";

describe("editor input validation", () => {
  it("accepts the seed as an import", () => {
    const map = parseMap(seed)!;
    expect(map.nodes.length).toBe(seed.nodes.length);
    expect(map.topics.length).toBe(seed.topics.length);
  });

  it("rejects bad ids, unknown types and duplicate ids", () => {
    expect(parseNode({ id: "a b", type: "note" })).toBeNull();
    expect(parseNode({ id: "x", type: "essay" })).toBeNull();
    expect(parseMap({ topics: [], nodes: [{ id: "a", type: "note" }, { id: "a", type: "link" }], edges: [] })).toBeNull();
  });

  it("cleans a node: long text clipped, bad dates dropped, topics kept as ids", () => {
    const n = parseNode({ id: "n1", type: "video", title: "t".repeat(500), date: "tomorrow", topics: ["ai", "Bad Topic"] })!;
    expect(n.title.length).toBe(300);
    expect(n.date).toBe("");
    expect(n.status).toBe("draft");
    expect(n.topics).toEqual(["ai"]);
  });

  it("checks connections and positions", () => {
    const id = crypto.randomUUID();
    expect(parseEdge({ id, from: "a", to: "b", type: "continuity", kind: "series" })).toMatchObject({ kind: "series" });
    expect(parseEdge({ id, from: "a", to: "a", type: "reference", kind: "related" })).toBeNull();
    expect(parsePositions([{ id: "a", fx: 1.4, fy: 2.6 }])).toEqual([{ id: "a", fx: 1, fy: 3 }]);
    expect(parsePositions([{ id: "a", fx: "1", fy: 2 }])).toBeNull();
  });

  it("checks topics", () => {
    expect(parseTopics([{ id: "art", name: " Art ", color: "#3E63DD" }])).toEqual([{ id: "art", name: "Art", color: "#3E63DD" }]);
    expect(parseTopics([{ id: "Art!", name: "Art", color: "#3E63DD" }])).toBeNull();
    expect(parseTopics([{ id: "a", name: "A", color: "#000" }, { id: "a", name: "B", color: "#000" }])).toBeNull();
  });
});
