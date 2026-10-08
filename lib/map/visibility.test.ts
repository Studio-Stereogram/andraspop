import { describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import { normalizeMap } from "./normalize";
import type { MapData, MapNode } from "./types";
import { applyFilters, hiddenFromPublic, NO_FILTERS, toPublicMap } from "./visibility";

const node = (id: string, over: Partial<MapNode> = {}): MapNode => ({
  id, type: "link", title: id, summary: "", platform: null, status: null, date: "", url: "",
  handle: "", duration: "", topics: [], private: false, fx: 0, fy: 0, ...over,
});
const video = (id: string, status: MapNode["status"], over: Partial<MapNode> = {}) =>
  node(id, { type: "video", platform: "youtube", status, ...over });

describe("public visibility", () => {
  it("hides ideas, drafts and private entries from the seed", () => {
    const hidden = hiddenFromPublic(normalizeMap(seed));
    expect([...hidden].sort()).toEqual(["n1", "v10", "v11", "v13", "v9"]);
  });

  it("keeps scheduled videos and standalone entries", () => {
    const map: MapData = { topics: [], nodes: [video("s", "scheduled"), node("alone")], edges: [] };
    expect(hiddenFromPublic(map).size).toBe(0);
  });

  it("hides reference-only entries whose every connection is hidden", () => {
    const map: MapData = {
      topics: [],
      nodes: [node("b", { type: "bookmark" }), node("n", { type: "note", private: true }), video("d", "draft")],
      edges: [
        { id: "1", from: "b", to: "d", type: "reference", kind: "references" },
        { id: "2", from: "n", to: "b", type: "reference", kind: "related" },
      ],
    };
    expect([...hiddenFromPublic(map)].sort()).toEqual(["b", "d", "n"]);
  });

  it("keeps two reference-only entries linked to each other", () => {
    const map: MapData = {
      topics: [],
      nodes: [node("p", { type: "person" }), node("b", { type: "bookmark" }), video("d", "draft")],
      edges: [
        { id: "1", from: "p", to: "b", type: "reference", kind: "made-by" },
        { id: "2", from: "b", to: "d", type: "reference", kind: "references" },
      ],
    };
    expect([...hiddenFromPublic(map)]).toEqual(["d"]);
  });

  it("keeps a reference-only entry that still has one visible connection", () => {
    const map: MapData = {
      topics: [],
      nodes: [node("l"), video("d", "draft"), video("p", "published")],
      edges: [
        { id: "1", from: "d", to: "l", type: "reference", kind: "attachment" },
        { id: "2", from: "p", to: "l", type: "reference", kind: "attachment" },
      ],
    };
    expect([...hiddenFromPublic(map)]).toEqual(["d"]);
  });

  it("drops hidden nodes, their edges and topics only they use", () => {
    const pub = toPublicMap(normalizeMap(seed));
    const ids = new Set(pub.nodes.map((n) => n.id));
    expect(ids.has("n1")).toBe(false);
    expect(pub.edges.every((e) => ids.has(e.from) && ids.has(e.to))).toBe(true);
    const used = new Set(pub.nodes.flatMap((n) => n.topics));
    expect(pub.topics.every((t) => used.has(t.id))).toBe(true);
  });
});

describe("filters", () => {
  const nodes = [
    video("a", "published", { topics: ["art"], title: "Posters" }),
    video("b", "published", { platform: "x", topics: ["biz"] }),
    node("c", { topics: ["art"], summary: "poster archive" }),
  ];

  it("does nothing without active filters", () => {
    const r = applyFilters(nodes, NO_FILTERS);
    expect(r.hidden.size + r.dim.size).toBe(0);
  });

  it("dims non-matching nodes, or hides them with hide on", () => {
    const f = { ...NO_FILTERS, topics: new Set(["art"]) };
    expect([...applyFilters(nodes, f).dim]).toEqual(["b"]);
    expect([...applyFilters(nodes, { ...f, hide: true }).hidden]).toEqual(["b"]);
  });

  it("matches platform on videos only and searches titles and takes", () => {
    expect([...applyFilters(nodes, { ...NO_FILTERS, platforms: new Set(["youtube"] as const) }).dim]).toEqual(["b", "c"]);
    expect([...applyFilters(nodes, { ...NO_FILTERS, q: "POSTER" }).dim]).toEqual(["b"]);
  });
});
