import { describe, expect, it } from "vitest";
import realSeed from "@/data/seed.json";
import { parseStatement, statementText } from "./intro";
import { normalizeMap } from "./normalize";
import type { Topic } from "./types";

const topics = new Map<string, Topic>([
  ["ai", { id: "ai", name: "AI", color: "#3E63DD" }],
  ["music", { id: "music", name: "Art & music", color: "#D6409F" }],
]);

describe("parseStatement", () => {
  it("splits strong phrases, topic words and plain text", () => {
    expect(parseStatement("*Hi,* notes on {ai} and {music|art & music}.", topics)).toEqual([
      { kind: "text", text: "Hi,", strong: true },
      { kind: "text", text: " notes on ", strong: false },
      { kind: "topic", id: "ai", label: "AI", strong: false },
      { kind: "text", text: " and ", strong: false },
      { kind: "topic", id: "music", label: "art & music", strong: false },
      { kind: "text", text: ".", strong: false },
    ]);
  });

  it("reads an unknown topic as plain text, so a dropped topic never breaks the sentence", () => {
    expect(statementText(parseStatement("on {gone|old things} and {ai}", topics))).toBe("on old things and AI");
  });

  it("reads the seed's intro as one plain sentence", () => {
    const map = normalizeMap(realSeed);
    const intro = map.nodes.find((n) => n.type === "intro")!;
    const text = statementText(parseStatement(intro.summary, new Map(map.topics.map((t) => [t.id, t]))));
    expect(text).toMatch(/^I'm András, a designer/);
    expect(text).toMatch(/This is almost all of it, connected\.$/);
    expect(text).not.toMatch(/[{}*|]/);
  });
});

describe("normalizeMap with an intro", () => {
  it("keeps one intro, without topics or continuity lines", () => {
    const map = normalizeMap({
      topics: [{ id: "ai", name: "AI", color: "#3E63DD" }],
      nodes: [
        { id: "i1", type: "intro", topics: ["ai"] },
        { id: "i2", type: "intro" },
        { id: "v", type: "video" },
      ],
      edges: [
        { from: "i1", to: "v", type: "continuity", kind: "series" },
        { from: "i1", to: "v", type: "reference", kind: "related" },
      ],
    });
    expect(map.nodes.map((n) => n.id)).toEqual(["i1", "v"]);
    expect(map.nodes[0].topics).toEqual([]);
    expect(map.edges.map((e) => e.type)).toEqual(["reference"]);
  });
});
