import type { XY } from "./types";

// Tidy (SPEC.md §4, canvas.md): a soft grid, not a table. Ported from the prototype's tidy().
// Snap to the 24px grid; left edges close together share one column x; tops close together across columns share one
// row y; close neighbours get exactly one 48px gutter (vertically within a column, horizontally between columns);
// any overlap left is cleared by moving whole columns sideways or the rest of a column down. Far-apart groups stay put.

export const GRID = 24;
export const GAP = 48;

export interface TidyItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface P extends TidyItem {
  col: Col;
}
interface Col {
  first: number;
  x: number;
  items: P[];
}

const snap = (v: number) => Math.round(v / GRID) * GRID;
const median = (vs: number[]) => [...vs].sort((a, b) => a - b)[Math.floor((vs.length - 1) / 2)];

/** New top-left positions for every item (same ids). Pure: the input is not changed. */
export function tidy(items: TidyItem[]): Map<string, XY> {
  const it = items.map((i) => ({ ...i, x: snap(i.x), y: snap(i.y) })) as P[];

  // 1. columns: left edges that are close together share one x
  const cols: Col[] = [];
  for (const p of [...it].sort((a, b) => a.x - b.x)) {
    const c = cols[cols.length - 1];
    if (c && p.x - c.first <= GAP * 2) c.items.push(p);
    else cols.push({ first: p.x, x: p.x, items: [p] });
  }
  for (const c of cols) {
    c.x = median(c.items.map((p) => p.x));
    c.items.forEach((p) => {
      p.x = c.x;
      p.col = c;
    });
  }

  // 2. rows: tops that are close together across columns share one y
  const rows: { first: number; items: P[] }[] = [];
  for (const p of [...it].sort((a, b) => a.y - b.y)) {
    const r = rows[rows.length - 1];
    if (r && p.y - r.first <= GAP && !r.items.some((q) => q.col === p.col)) r.items.push(p);
    else rows.push({ first: p.y, items: [p] });
  }
  for (const r of rows) {
    if (r.items.length < 2) continue;
    const m = median(r.items.map((p) => p.y));
    r.items.forEach((p) => (p.y = m));
  }

  // 3. inside a column: close neighbours get exactly one gutter
  for (const c of cols) {
    c.items.sort((a, b) => a.y - b.y);
    for (let i = 1; i < c.items.length; i++) {
      const a = c.items[i - 1],
        b = c.items[i];
      if (b.y - (a.y + a.h) < GAP * 2.5) b.y = a.y + a.h + GAP;
    }
  }

  // 4. between columns: close neighbours get exactly one gutter
  cols.sort((a, b) => a.x - b.x);
  for (let i = 1; i < cols.length; i++) {
    const right = Math.max(...cols[i - 1].items.map((p) => p.x + p.w));
    const cur = cols[i];
    if (cur.x - right < GAP * 2.5) {
      const d = right + GAP - cur.x;
      for (const c of cols.slice(i)) {
        c.items.forEach((p) => (p.x += d));
        c.x += d;
      }
    }
  }

  // 5. clear any remaining overlap: whole columns sideways, or the rest of a column down
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < it.length; i++)
      for (let j = i + 1; j < it.length; j++) {
        const a = it[i],
          b = it[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + GAP,
          oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + GAP;
        if (ox <= 0 || oy <= 0) continue;
        if (a.col === b.col || oy <= ox) {
          const [t, u] = a.y <= b.y ? [a, b] : [b, a];
          const d = t.y + t.h + GAP - u.y;
          u.col.items.filter((p) => p.y >= u.y).forEach((p) => (p.y += d));
        } else {
          const [l, r] = a.x <= b.x ? [a, b] : [b, a];
          const d = l.x + l.w + GAP - r.x;
          r.col.items.forEach((p) => (p.x += d));
          r.col.x += d;
        }
        moved = true;
      }
    if (!moved) break;
  }

  return new Map(it.map((p) => [p.id, { x: p.x, y: p.y }]));
}
