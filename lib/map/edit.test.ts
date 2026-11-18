import { describe, expect, it } from "vitest";
import { canConnect, kindFor, newNode, topicIdFor } from "./edit";
import { GAP, GRID, tidy, type TidyItem } from "./tidy";

const overlaps = (a: TidyItem, b: TidyItem) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("tidy", () => {
  const items: TidyItem[] = [
    { id: "a", x: 3, y: 5, w: 224, h: 100 },
    { id: "b", x: 40, y: 130, w: 224, h: 120 }, // close under a, nearly the same column
    { id: "c", x: 250, y: 20, w: 252, h: 300 }, // overlaps a's column sideways
    { id: "d", x: 3000, y: 3000, w: 224, h: 80 }, // far away: keeps its place relative to its column
  ];
  const out = tidy(items);
  const placed = items.map((i) => ({ ...i, ...out.get(i.id)! }));

  it("starts from the grid and leaves no overlaps", () => {
    expect(placed[0]).toMatchObject({ x: 0, y: 0 }); // snapped; later columns shift by card widths to keep 48px gutters
    expect(placed[0].y % GRID).toBe(0);
    for (let i = 0; i < placed.length; i++)
      for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i], placed[j])).toBe(false);
  });

  it("shares a column and puts exactly one gutter between close neighbours", () => {
    const [a, b] = placed;
    expect(a.x).toBe(b.x);
    expect(b.y - (a.y + a.h)).toBe(GAP);
  });

  it("keeps far-apart items in place apart from columns shifting together", () => {
    const shift = placed[2].x - 240; // column c moved right to clear a's column; columns after it move with it
    expect(out.get("d")).toEqual({ x: 3000 + shift, y: 3000 });
  });
});

describe("editing helpers", () => {
  it("creates entries like the prototype", () => {
    const v = newNode("video", { x: 10.4, y: 20.6 });
    expect(v).toMatchObject({ type: "video", status: "draft", platform: "youtube", date: "", fx: 10, fy: 21 });
    expect(newNode("note", { x: 0, y: 0 }).private).toBe(true);
    expect(newNode("link", { x: 0, y: 0 }).date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("picks the default relation", () => {
    expect(kindFor("continuity", { type: "video" }, { type: "video" })).toBe("follow-up");
    expect(kindFor("reference", { type: "video" }, { type: "person" })).toBe("features");
    expect(kindFor("reference", { type: "bookmark" }, { type: "person" })).toBe("made-by");
    expect(kindFor("reference", { type: "video" }, { type: "link" })).toBe("attachment");
    expect(kindFor("reference", { type: "note" }, { type: "bookmark" })).toBe("references");
  });

  it("allows one connection per type between two entries", () => {
    const edges = [{ id: "1", from: "a", to: "b", type: "reference" as const, kind: "related" as const }];
    expect(canConnect(edges, "b", "a", "reference")).toBe(false);
    expect(canConnect(edges, "a", "b", "continuity")).toBe(true);
    expect(canConnect(edges, "a", "a", "continuity")).toBe(false);
  });

  it("makes unique topic ids", () => {
    expect(topicIdFor("Art & Music", { topics: [] })).toBe("art-music");
    expect(topicIdFor("Ősz", { topics: [{ id: "osz", name: "", color: "" }] })).toBe("osz-2");
  });
});
