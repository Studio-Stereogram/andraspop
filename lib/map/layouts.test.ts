import { describe, expect, it } from "vitest";
import seed from "./__fixtures__/sample-map.json";
import { NODE_HEIGHT_ESTIMATE, NODE_WIDTH } from "./constants";
import { facing, link } from "./geometry";
import { clusterLayout, layoutBounds, timelineLayout, type Sized } from "./layouts";
import { normalizeMap } from "./normalize";
import type { Rect } from "./types";
import { toPublicMap } from "./visibility";

const map = toPublicMap(normalizeMap(seed));
const sized: Sized[] = map.nodes.map((node) => ({ node, w: NODE_WIDTH[node.type], h: NODE_HEIGHT_ESTIMATE[node.type] }));

describe("floating edges", () => {
  it("attaches to the facing sides", () => {
    const a = { x: 0, y: 0, w: 100, h: 50 };
    expect(facing(a, { x: 300, y: 0, w: 100, h: 50 })).toEqual(["r", "l"]);
    expect(facing(a, { x: 0, y: 300, w: 100, h: 50 })).toEqual(["b", "t"]);
    expect(facing(a, { x: -300, y: 20, w: 100, h: 50 })).toEqual(["l", "r"]);
    expect(link(a, { x: 300, y: 0, w: 100, h: 50 }).d.startsWith("M100,25 ")).toBe(true);
    const g = link(a, { x: 300, y: 0, w: 100, h: 50 });
    expect([g.a, g.b]).toEqual([{ x: 100, y: 25 }, { x: 300, y: 25 }]);
  });
});

describe("clusterLayout", () => {
  const layout = clusterLayout(sized, map.edges, map.topics);

  it("places every node and draws one region and label per used topic", () => {
    expect(layout.positions.size).toBe(sized.length);
    const bg = layout.background!;
    expect(bg.type).toBe("cluster");
    if (bg.type !== "cluster") return;
    expect(bg.labels.map((l) => l.topic.id).sort()).toEqual(map.topics.map((t) => t.id).sort());
    for (const l of bg.labels) expect(l.count).toBe(sized.filter((s) => s.node.topics.includes(l.topic.id)).length);
  });

  it("is deterministic", () => {
    expect(clusterLayout(sized, map.edges, map.topics).positions).toEqual(layout.positions);
  });

  it("pulls a two-topic node towards both topic labels", () => {
    const bg = layout.background;
    if (bg?.type !== "cluster") throw new Error("expected clusters");
    const at = (id: string) => bg.labels.find((l) => l.topic.id === id)!;
    const s = sized.find((x) => x.node.id === "v1")!; // framer + biz
    const p = layout.positions.get("v1")!;
    const c = { x: p.x + s.w / 2, y: p.y + s.h / 2 };
    const mid = { x: (at("framer").x + at("biz").x) / 2, y: (at("framer").y + at("biz").y) / 2 };
    const far = Math.max(...bg.labels.map((l) => Math.hypot(l.x - mid.x, l.y - mid.y)));
    expect(Math.hypot(c.x - mid.x, c.y - mid.y)).toBeLessThan(far / 2);
  });
});

describe("timelineLayout", () => {
  const layout = timelineLayout(sized, "2026-10-08");
  const bg = layout.background;
  if (bg?.type !== "timeline") throw new Error("expected timeline");

  it("orders lanes YouTube, Instagram, X, links, people", () => {
    expect(bg.lanes.map((l) => l.label)).toEqual(["YouTube", "Instagram", "X", "Links, bookmarks & notes", "People"]);
  });

  it("puts later dates further right and keeps lanes from overlapping", () => {
    const x = (id: string) => layout.positions.get(id)!.x;
    expect(x("v2")).toBeGreaterThan(x("v1")); // 22 Aug after 19 Aug
    for (let i = 1; i < bg.lanes.length; i++) expect(bg.lanes[i].y).toBe(bg.lanes[i - 1].y + bg.lanes[i - 1].h);
  });

  it("puts ideas without a platform in their own lane, in the backlog", () => {
    const idea = { ...sized[0], node: { ...sized[0].node, id: "idea", platform: null, status: "idea" as const, date: "" } };
    const l = timelineLayout([...sized, idea], "2026-10-08");
    if (l.background?.type !== "timeline") throw new Error("expected timeline");
    const lane = l.background.lanes.find((x) => x.label === "Ideas")!;
    const p = l.positions.get("idea")!;
    expect(p.y).toBeGreaterThanOrEqual(lane.y);
    expect(p.y).toBeLessThan(lane.y + lane.h);
    expect(p.x).toBe(l.background.backlogX + 30);
  });

  it("marks month starts and today", () => {
    expect(bg.ticks.some((t) => t.month && t.label === "1 Sept")).toBe(true);
    expect(bg.today).toBeGreaterThan(layout.positions.get("v12")!.x);
    expect(layoutBounds(layout, sized)!.w).toBeGreaterThanOrEqual(bg.w);
  });
});

describe("the intro in each layout", () => {
  const intro: Sized = {
    node: { ...sized[0].node, id: "intro", type: "intro", topics: [], date: "", platform: null, status: null },
    w: NODE_WIDTH.intro,
    h: NODE_HEIGHT_ESTIMATE.intro,
  };
  const withIntro = [intro, ...sized];
  const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const box = (l: { positions: Map<string, { x: number; y: number }> }, s: Sized): Rect => ({ ...l.positions.get(s.node.id)!, w: s.w, h: s.h });

  it("holds the centre of the cluster ring, clear of every entry", () => {
    const l = clusterLayout(withIntro, map.edges, map.topics);
    expect(l.positions.get("intro")).toEqual({ x: -intro.w / 2, y: -intro.h / 2 });
    for (const s of sized) expect(overlaps(box(l, intro), box(l, s))).toBe(false);
    if (l.background?.type !== "cluster") throw new Error("expected clusters");
    expect(l.background.halos.every((g) => g.rects.length === sized.filter((s) => s.node.topics.includes(g.topic.id)).length)).toBe(true);
  });

  it("stands before the first date on the timeline, outside the lanes", () => {
    const l = timelineLayout(withIntro, "2026-10-08");
    const p = l.positions.get("intro")!;
    expect(p.x + intro.w).toBeLessThan(-60);
    expect(p.y).toBe(0);
    for (const s of sized) expect(l.positions.get(s.node.id)!.x).toBeGreaterThan(p.x + intro.w);
  });
});
