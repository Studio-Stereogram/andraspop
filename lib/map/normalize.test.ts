import { describe, expect, it } from "vitest";
import realSeed from "@/data/seed.json";
import seed from "./__fixtures__/sample-map.json";
import { normalizeMap } from "./normalize";

describe("normalizeMap", () => {
  it("loads the seed without dropping anything", () => {
    const map = normalizeMap(seed);
    expect([map.topics.length, map.nodes.length, map.edges.length]).toEqual([7, 24, 21]);
  });

  it("loads the real seed without dropping anything", () => {
    const map = normalizeMap(realSeed);
    expect(map.nodes.length).toBe(realSeed.nodes.length);
    expect(map.edges.length).toBe(realSeed.edges.length);
    expect(map.nodes.every((n) => n.topics.length === (realSeed.nodes.find((r) => r.id === n.id)?.topics.length ?? -1))).toBe(true);
  });

  it("keeps only https thumbnails", () => {
    const map = normalizeMap({
      topics: [],
      nodes: [
        { id: "a", type: "video", thumbnail: "https://i.ytimg.com/vi/x/hqdefault.jpg" },
        { id: "b", type: "video", thumbnail: "javascript:alert(1)" },
      ],
      edges: [],
    });
    expect(map.nodes.map((n) => n.thumbnail)).toEqual(["https://i.ytimg.com/vi/x/hqdefault.jpg", ""]);
  });

  it("fills defaults and derives a missing edge type from its kind", () => {
    const map = normalizeMap({
      topics: [{ id: "t", name: "T", color: "red;stroke:url(x)" }],
      nodes: [{ id: "a", type: "video", topics: ["t", "nope"] }, { id: "b", type: "link" }, { id: "c", type: "alien" }],
      edges: [{ from: "a", to: "b", kind: "follow-up" }, { from: "a", to: "c", kind: "related" }],
    });
    expect(map.topics[0].color).toBe("#3E63DD");
    expect(map.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(map.nodes[0]).toMatchObject({ status: "draft", platform: null, topics: ["t"], fx: 0, private: false });
    expect(map.edges).toEqual([{ id: "e1", from: "a", to: "b", type: "continuity", kind: "follow-up" }]);
  });

  it("rejects data without nodes and edges", () => {
    expect(() => normalizeMap({ topics: [] })).toThrow("Expected { topics, nodes, edges }");
  });
});

describe("extra links", () => {
  it("keeps http(s) links once, skips the main url, and accepts plain strings", async () => {
    const { normalizeLinks } = await import("./normalize");
    expect(
      normalizeLinks(
        [
          { url: "https://www.instagram.com/gabor.suhajda/", label: " IG " },
          "https://github.com/someone",
          { url: "javascript:alert(1)" },
          { url: "https://gaborsuhajda.com/" },
          "https://github.com/someone",
          42,
        ],
        "https://gaborsuhajda.com/",
      ),
    ).toEqual([
      { url: "https://www.instagram.com/gabor.suhajda/", label: "IG" },
      { url: "https://github.com/someone", label: "" },
    ]);
    expect(normalizeLinks(undefined, "")).toEqual([]);
  });

  it("names a link from its label, the site, or the host", async () => {
    const { linkLabel } = await import("./format");
    expect(linkLabel({ url: "https://www.instagram.com/gabor.suhajda/", label: "" })).toBe("Instagram");
    expect(linkLabel({ url: "https://x.com/someone", label: "" })).toBe("X");
    expect(linkLabel({ url: "https://www.example.org/a", label: "" })).toBe("example.org");
    expect(linkLabel({ url: "https://github.com/a", label: "Source" })).toBe("Source");
  });
});

describe("the New tag", () => {
  it("is kept on the first entry only", () => {
    const map = normalizeMap({
      topics: [],
      nodes: [
        { id: "a", type: "note" },
        { id: "b", type: "link", new: true },
        { id: "c", type: "link", new: true },
        { id: "d", type: "link", new: "yes" },
      ],
      edges: [],
    });
    expect(map.nodes.filter((n) => n.new).map((n) => n.id)).toEqual(["b"]);
    expect("new" in map.nodes[0]).toBe(false);
  });
});
