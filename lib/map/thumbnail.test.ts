import { describe, expect, it } from "vitest";
import seed from "./__fixtures__/sample-map.json";
// The design skill's reference implementation; the port must match it exactly.
import { thumbSVG as reference } from "../../.claude/skills/meta-map-design/references/thumbnail.js";
import { normalizeMap } from "./normalize";
import { thumbSVG } from "./thumbnail";

describe("thumbSVG", () => {
  const map = normalizeMap(seed);
  const topic = (id: string) => map.topics.find((t) => t.id === id);

  it.each(map.nodes.filter((n) => n.type === "video").map((n) => [n.id, n] as const))(
    "matches the reference for %s",
    (_, n) => {
      expect(thumbSVG(n, topic)).toBe(reference(n, topic));
    },
  );

  it("falls back to one colour when a video has no topics", () => {
    const n = { id: "x", title: "Untagged", topics: [] };
    expect(thumbSVG(n, topic)).toBe(reference(n, topic));
  });
});
