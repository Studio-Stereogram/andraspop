import { NODE_WIDTH, PLATFORMS } from "./constants";
import { h32 } from "./thumbnail";
import type { MapEdge, MapNode, Rect, Topic, View, XY } from "./types";

// Layouts are pure functions: (nodes, edges, topics) → positions, plus whatever the view draws behind the
// nodes. Ported from the prototype's computeLayout / clusterLayout / timelineLayout.

/** A node with its rendered size; layouts need heights because titles wrap. */
export interface Sized {
  node: MapNode;
  w: number;
  h: number;
}

export interface ClusterBackground {
  type: "cluster";
  /** One soft region per topic: a rounded rect around each member, drawn as one group so overlaps don't stack. */
  halos: { topic: Topic; rects: Rect[] }[];
  labels: { topic: Topic; x: number; y: number; count: number }[];
}

export interface TimelineBackground {
  type: "timeline";
  lanes: { y: number; h: number; label: string }[];
  ticks: { x: number; month: boolean; label: string }[];
  today: number;
  /** x of the Backlog column for undated items. */
  backlogX: number;
  w: number;
  h: number;
}

export type LayoutBackground = ClusterBackground | TimelineBackground | null;

export interface Layout {
  /** Top-left position per laid-out node id. */
  positions: Map<string, XY>;
  background: LayoutBackground;
}

export function freeLayout(nodes: Sized[]): Layout {
  return { positions: new Map(nodes.map(({ node }) => [node.id, { x: node.fx, y: node.fy }])), background: null };
}

/**
 * Clusters: topic gravity. Topics sit on a ring, ordered so often co-tagged topics are neighbours. Every node is
 * pulled equally towards all of its topics, so multi-topic items land in between; untagged nodes settle next to
 * what they connect to. Overlaps are pushed apart without moving the topic labels.
 */
export function clusterLayout(nodes: Sized[], edges: MapEdge[], topics: Topic[]): Layout {
  const has = (n: MapNode, id: string) => n.topics.includes(id);
  const cnt = (id: string) => nodes.filter((s) => has(s.node, id)).length;
  const co = (a: string, b: string) => nodes.filter((s) => has(s.node, a) && has(s.node, b)).length;

  const pool = topics.filter((t) => cnt(t.id)).sort((a, b) => cnt(b.id) - cnt(a.id));
  const order: Topic[] = [];
  if (pool.length) order.push(pool.shift()!);
  while (pool.length) {
    const last = order[order.length - 1].id;
    pool.sort((a, b) => co(last, b.id) - co(last, a.id) || cnt(b.id) - cnt(a.id));
    order.push(pool.shift()!);
  }

  const N = Math.max(order.length, 1),
    R = Math.max(420, N * 150);
  const anchor: Record<string, XY> = {};
  order.forEach((t, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    anchor[t.id] = { x: Math.cos(a) * R, y: Math.sin(a) * R };
  });

  const jitter = (n: MapNode): XY => {
    const h = ((h32(n.id) % 360) / 360) * Math.PI * 2;
    return { x: Math.cos(h) * 46, y: Math.sin(h) * 46 };
  };
  const home = new Map<string, XY>();
  for (const { node } of nodes) {
    const ts = node.topics.filter((id) => anchor[id]);
    if (!ts.length) continue;
    const j = jitter(node);
    home.set(node.id, {
      x: ts.reduce((s, id) => s + anchor[id].x, 0) / ts.length + j.x,
      y: ts.reduce((s, id) => s + anchor[id].y, 0) / ts.length + j.y,
    });
  }
  for (const { node } of nodes) {
    if (home.has(node.id)) continue;
    const nb = edges
      .filter((e) => e.from === node.id || e.to === node.id)
      .map((e) => home.get(e.from === node.id ? e.to : e.from))
      .filter((p): p is XY => Boolean(p));
    const j = jitter(node);
    home.set(
      node.id,
      nb.length
        ? { x: nb.reduce((s, p) => s + p.x, 0) / nb.length + j.x * 2, y: nb.reduce((s, p) => s + p.y, 0) / nb.length + j.y * 2 }
        : j,
    );
  }

  // Relaxation: items are centre points with a box; topic labels are fixed obstacles.
  type Item = { id?: string; fixed: boolean; hx: number; hy: number; x: number; y: number; w: number; h: number };
  const items: Item[] = nodes.map(({ node, w, h }) => {
    const p = home.get(node.id)!;
    return { id: node.id, fixed: false, hx: p.x, hy: p.y, x: p.x, y: p.y, w, h };
  });
  const pins: Item[] = order.map((t) => ({
    fixed: true, hx: 0, hy: 0, x: anchor[t.id].x, y: anchor[t.id].y, w: t.name.length * 31 + 110, h: 70,
  }));
  const all = items.concat(pins),
    M = 30;
  for (let k = 0; k < 280; k++) {
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i],
          b = all[j];
        if (a.fixed && b.fixed) continue;
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const px = (a.w + b.w) / 2 + M - Math.abs(dx),
          py = (a.h + b.h) / 2 + M - Math.abs(dy);
        if (px <= 0 || py <= 0) continue;
        const fa = a.fixed ? 0 : b.fixed ? 1 : 0.5,
          fb = b.fixed ? 0 : a.fixed ? 1 : 0.5;
        if (px < py) {
          const s = dx >= 0 ? px : -px;
          a.x += s * fa;
          b.x -= s * fb;
        } else {
          const s = dy >= 0 ? py : -py;
          a.y += s * fa;
          b.y -= s * fb;
        }
      }
    for (const p of items) {
      p.x += (p.hx - p.x) * 0.03;
      p.y += (p.hy - p.y) * 0.03;
    }
  }

  const positions = new Map<string, XY>(items.map((p) => [p.id!, { x: p.x - p.w / 2, y: p.y - p.h / 2 }]));
  const P = 44;
  const halos: ClusterBackground["halos"] = [];
  const labels: ClusterBackground["labels"] = [];
  for (const t of order) {
    const members = nodes.filter((s) => has(s.node, t.id));
    if (!members.length) continue;
    halos.push({
      topic: t,
      rects: members.map(({ node, w, h }) => {
        const p = positions.get(node.id)!;
        return { x: p.x - P, y: p.y - P, w: w + P * 2, h: h + P * 2 };
      }),
    });
    labels.push({ topic: t, x: anchor[t.id].x, y: anchor[t.id].y, count: members.length });
  }
  return { positions, background: { type: "cluster", halos, labels } };
}

const DAY = 864e5;
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
const LANES: [string, string][] = [
  ["youtube", "YouTube"],
  ["instagram", "Instagram"],
  ["x", "X"],
  ["ideas", "Ideas"],
  ["other", "Links, bookmarks & notes"],
  ["people", "People"],
];

/**
 * Timeline: x = date (30px a day), one lane per platform, plus Ideas (videos without a platform yet), links/notes
 * and people; undated items in a Backlog.
 */
export function timelineLayout(nodes: Sized[], today: string): Layout {
  const PX = 30;
  const dated = nodes.filter((s) => s.node.date),
    undated = nodes.filter((s) => !s.node.date);
  const times = dated.map((s) => ms(s.node.date)).concat(ms(today));
  const t0 = Math.min(...times) - 4 * DAY,
    t1 = Math.max(...times) + 5 * DAY;
  const xOf = (t: number) => ((t - t0) / DAY) * PX;
  const backlogX = xOf(t1) + 120;
  const laneOf = ({ node }: Sized) => {
    if (node.type === "person") return "people";
    if (node.type !== "video") return "other";
    return node.platform && PLATFORMS[node.platform] ? node.platform : "ideas";
  };

  const positions = new Map<string, XY>();
  const lanes: TimelineBackground["lanes"] = [];
  let y = 0;
  for (const [key, label] of LANES) {
    const items = dated.filter((s) => laneOf(s) === key).sort((a, b) => ms(a.node.date) - ms(b.node.date));
    const back = undated.filter((s) => laneOf(s) === key);
    if (!items.length && !back.length) continue;
    const ends: number[] = [];
    const rowOf = new Map<string, number>();
    const xs = new Map<string, number>();
    for (const s of items) {
      const x = xOf(ms(s.node.date));
      let r = ends.findIndex((e) => e <= x - 18);
      if (r < 0) {
        r = ends.length;
        ends.push(0);
      }
      ends[r] = x + s.w;
      rowOf.set(s.node.id, r);
      xs.set(s.node.id, x);
    }
    const laneItems = items.concat(back);
    const rowH = Math.max(70, ...laneItems.map((s) => s.h)) + 26;
    back.forEach((s, i) => {
      rowOf.set(s.node.id, i);
      xs.set(s.node.id, backlogX + 30);
    });
    const rows = Math.max(ends.length, back.length, 1);
    for (const s of laneItems) positions.set(s.node.id, { x: xs.get(s.node.id)!, y: y + 58 + rowOf.get(s.node.id)! * rowH });
    const h = 58 + rows * rowH + 10;
    lanes.push({ y, h, label });
    y += h;
  }

  const ticks: TimelineBackground["ticks"] = [];
  for (let t = t0; t <= t1; t += DAY) {
    const dt = new Date(t);
    if (dt.getUTCDay() === 1 || dt.getUTCDate() === 1)
      ticks.push({
        x: xOf(t),
        month: dt.getUTCDate() === 1,
        label: dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      });
  }
  return {
    positions,
    background: { type: "timeline", lanes, ticks, today: xOf(ms(today)), backlogX, w: backlogX + NODE_WIDTH.video + 90, h: y },
  };
}

export function computeLayout(view: View, nodes: Sized[], edges: MapEdge[], topics: Topic[], today: string): Layout {
  if (view === "cluster") return clusterLayout(nodes, edges, topics);
  if (view === "timeline") return timelineLayout(nodes, today);
  return freeLayout(nodes);
}

/** Everything a view shows, for fitting: node boxes plus halos and labels (clusters) or the lanes (timeline). */
export function layoutBounds(layout: Layout, nodes: Sized[]): Rect | null {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  const add = (x: number, y: number, w: number, h: number) => {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + w);
    y1 = Math.max(y1, y + h);
  };
  for (const { node, w, h } of nodes) {
    const p = layout.positions.get(node.id);
    if (p) add(p.x, p.y, w, h);
  }
  if (x0 === Infinity) return null;
  const bg = layout.background;
  if (bg?.type === "cluster") {
    bg.halos.forEach((g) => g.rects.forEach((r) => add(r.x, r.y, r.w, r.h)));
    bg.labels.forEach((l) => add(l.x - 170, l.y - 34, 340, 68));
  }
  if (bg?.type === "timeline") {
    x0 = Math.min(x0, -60);
    y0 = Math.min(y0, -40);
    x1 = Math.max(x1, bg.w);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
