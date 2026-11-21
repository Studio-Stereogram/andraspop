"use client";

import { ViewTransition, startTransition, useMemo, useState, type CSSProperties } from "react";
import { EdList, Spread, type SpreadItem } from "./spread";

// The shape of information. A piece of information carries a meaning only once it takes a shape, and
// the shape comes from how pieces are distributed on screen. The surface is a specimen: the same seven
// pieces, rearranged into different shapes, each with its cue (a thread, an enclosure, branches, page
// regions). Under it, the causal stream Information → Distribution → Shape → Meaning reads out what the
// current arrangement does. Opening a stage of the stream shows its spread.

type ShapeKey = "none" | "timeline" | "groups" | "hierarchy" | "page";

type Box = { x: number; y: number; w: number; h: number; r?: number }; // % of the stage

type Shape = {
  key: ShapeKey;
  name: string;
  distribution: string;
  shape: string;
  meaning: string;
  boxes: Box[];
};

// Seven pieces of information. Each knows its date (for a timeline), its kind (for groups) and the
// region it would hold on a page.
const PIECES = [
  { date: "Mar 3", kind: 0, region: "Identity" },
  { date: "Mar 10", kind: 1, region: "Navigation" },
  { date: "Mar 17", kind: 2, region: "Headline" },
  { date: "Mar 24", kind: 0, region: "Content" },
  { date: "Mar 31", kind: 1, region: "Content" },
  { date: "Apr 7", kind: 2, region: "Content" },
  { date: "Apr 14", kind: 0, region: "Footer" },
];

const SHAPES: Shape[] = [
  {
    key: "none",
    name: "No shape",
    distribution: "Anywhere, at random.",
    shape: "None yet.",
    meaning: "Just pieces. Nothing connects them.",
    boxes: [
      { x: 6, y: 10, w: 13, h: 20, r: -6 },
      { x: 64, y: 6, w: 13, h: 20, r: 4 },
      { x: 30, y: 38, w: 13, h: 20, r: 3 },
      { x: 82, y: 44, w: 13, h: 20, r: -5 },
      { x: 10, y: 66, w: 13, h: 20, r: 5 },
      { x: 50, y: 70, w: 13, h: 20, r: -3 },
      { x: 42, y: 8, w: 13, h: 20, r: 7 },
    ],
  },
  {
    key: "timeline",
    name: "Timeline",
    distribution: "In one line, in date order, joined by a thread.",
    shape: "A timeline.",
    meaning: "A series of events: one thing happened after another.",
    boxes: PIECES.map((_, i) => ({ x: 3.5 + i * 13.5, y: i % 2 ? 60 : 18, w: 11.5, h: 21 })),
  },
  {
    key: "groups",
    name: "Groups",
    distribution: "Close to their own kind, with space between kinds.",
    shape: "Clusters.",
    meaning: "Categories: these belong together.",
    // three kinds, evenly spaced: 9–35, 50–62, 78–90
    boxes: [
      { x: 9, y: 18, w: 12, h: 24 },
      { x: 50, y: 18, w: 12, h: 24 },
      { x: 78, y: 18, w: 12, h: 24 },
      { x: 23, y: 18, w: 12, h: 24 },
      { x: 50, y: 52, w: 12, h: 24 },
      { x: 78, y: 52, w: 12, h: 24 },
      { x: 16, y: 52, w: 12, h: 24 },
    ],
  },
  {
    key: "hierarchy",
    name: "Hierarchy",
    distribution: "One on top, the rest branching below it.",
    shape: "A tree.",
    meaning: "Parts of a whole: some lead or contain others.",
    boxes: [
      { x: 44, y: 5, w: 12, h: 20 },
      { x: 20, y: 40, w: 12, h: 20 },
      { x: 68, y: 40, w: 12, h: 20 },
      { x: 7, y: 75, w: 12, h: 20 },
      { x: 33, y: 75, w: 12, h: 20 },
      { x: 55, y: 75, w: 12, h: 20 },
      { x: 81, y: 75, w: 12, h: 20 },
    ],
  },
  {
    key: "page",
    name: "Page",
    distribution: "A top bar, a large headline, columns, a footer.",
    shape: "A web page.",
    meaning: "What matters most comes first and largest; the edges hold the rest.",
    boxes: [
      { x: 3, y: 4, w: 16, h: 11 },
      { x: 50, y: 4, w: 47, h: 11 },
      { x: 3, y: 20, w: 94, h: 30 },
      { x: 3, y: 55, w: 30, h: 28 },
      { x: 35, y: 55, w: 30, h: 28 },
      { x: 67, y: 55, w: 30, h: 28 },
      { x: 3, y: 88, w: 94, h: 8 },
    ],
  },
];

// Parent → child links for the tree.
const TREE: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
];

const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** The bounds of each kind's cluster, padded, for the groups' enclosures. */
function enclosures(boxes: Box[]): Box[] {
  return [0, 1, 2].map((kind) => {
    const own = boxes.filter((_, i) => PIECES[i].kind === kind);
    const x = Math.min(...own.map((b) => b.x)) - 2.5;
    const y = Math.min(...own.map((b) => b.y)) - 5;
    const r = Math.max(...own.map((b) => b.x + b.w)) + 2.5;
    const bottom = Math.max(...own.map((b) => b.y + b.h)) + 5;
    return { x, y, w: r - x, h: bottom - y };
  });
}

type Stage = { n: number; key: "information" | "distribution" | "shape" | "meaning"; label: string };

const STAGES: Stage[] = [
  { n: 1, key: "information", label: "Information" },
  { n: 2, key: "distribution", label: "Distribution" },
  { n: 3, key: "shape", label: "Shape" },
  { n: 4, key: "meaning", label: "Meaning" },
];

function readout(stage: Stage, shape: Shape): string {
  if (stage.key === "information") return "Seven pieces, the same in every shape.";
  return shape[stage.key];
}

const SPREADS: Record<Stage["key"], Omit<SpreadItem, "key">> = {
  information: {
    kicker: "Stage 1 · the granular piece",
    title: "Information",
    lede: <p>A single piece: a word, a number, a date, an image. On its own it holds a little meaning, and waits for context.</p>,
    rows: [
      { label: "Examples", content: <p>A date. A name. A price. A photo. A status.</p> },
      { label: "On a page", content: <p>Every element starts here: one heading, one link, one image, one line of text.</p> },
    ],
  },
  distribution: {
    kicker: "Stage 2 · placing the pieces",
    title: "Distribution",
    lede: <p>Where each piece is placed, how large it is, and what sits next to it.</p>,
    rows: [
      {
        label: "The levers",
        content: (
          <EdList
            items={[
              { title: "Position", desc: "Top and left are read first. The edges read as secondary." },
              { title: "Size", desc: "Larger reads as more important." },
              { title: "Proximity", desc: "Pieces close together read as related." },
              { title: "Similarity", desc: "Pieces that look alike read as the same kind." },
              { title: "Continuity", desc: "Pieces on one line or thread read as a sequence." },
              { title: "Connection", desc: "Pieces joined by a line read as linked." },
            ]}
          />
        ),
      },
      {
        label: "Web anatomy",
        content: <p>The top left reads as identity, the top bar as navigation, the largest type as the headline, the columns as content, the bottom as fine print.</p>,
      },
    ],
  },
  shape: {
    kicker: "Stage 3 · the pattern",
    title: "Shape",
    lede: <p>The pattern the pieces form together. The eye recognises it before it reads a single word.</p>,
    rows: [
      {
        label: "Common shapes",
        content: (
          <EdList
            items={[
              { title: "Timeline", desc: "A line in order, joined by a thread (continuity)." },
              { title: "Groups", desc: "Clusters with space between them (proximity)." },
              { title: "Hierarchy", desc: "One above, branches below (connection)." },
              { title: "Page", desc: "Regions by position and size (web anatomy)." },
            ]}
          />
        ),
      },
    ],
  },
  meaning: {
    kicker: "Stage 4 · what it says",
    title: "Meaning",
    lede: <p>What the reader concludes from the shape. A timeline says &ldquo;this happened in order&rdquo; before any date is read.</p>,
    rows: [
      {
        label: "The same pieces",
        content: <p>Seven pieces read as events, as categories, as parts of a whole, or as a page. Only their placement changed.</p>,
      },
      { label: "So", content: <p>To change what information means, change its shape.</p> },
    ],
  },
};

export function ShapeOfInformation() {
  const [shapeKey, setShapeKey] = useState<ShapeKey>("timeline");
  const [open, setOpen] = useState<number | null>(null);
  const shape = SHAPES.find((s) => s.key === shapeKey) ?? SHAPES[1];
  const active = STAGES.find((s) => s.n === open);
  const item = useMemo<SpreadItem | null>(() => (active ? { key: active.key, ...SPREADS[active.key] } : null), [active]);
  const groups = useMemo(() => enclosures(SHAPES.find((s) => s.key === "groups")!.boxes), []);
  const timeline = SHAPES.find((s) => s.key === "timeline")!.boxes;
  const tree = SHAPES.find((s) => s.key === "hierarchy")!.boxes;

  const toggle = (n: number) => {
    const next = open === n ? null : n;
    // Opening the first stage (or closing the last) changes the layout on wide screens: animate that move.
    if ((open === null) !== (next === null)) startTransition(() => setOpen(next));
    else setOpen(next);
  };

  return (
    <div className="si split" data-open={open !== null || undefined}>
      <ViewTransition update="in-layout" default="none">
        <div className="split-nav">
          <header className="si-head">
            <p className="in-kicker">Web anatomy</p>
            <h1 className="si-title in-serif">The shape of information</h1>
            <p className="si-sub">Information takes a shape before it takes a meaning.</p>
          </header>

          <div className="si-specimen">
            <div className="si-stage" data-shape={shape.key} role="img" aria-label={`Seven pieces arranged as: ${shape.shape} ${shape.meaning}`}>
              {/* cues, drawn under the pieces: the timeline's thread, the tree's branches, the groups' enclosures */}
              <svg className="si-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <path className="si-cue si-cue-timeline" d="M1,50 L99,50" vectorEffect="non-scaling-stroke" />
                {timeline.map((b, i) => (
                  <path key={i} className="si-cue si-cue-timeline" d={`M${centre(b).x},${i % 2 ? b.y : b.y + b.h} L${centre(b).x},50`} vectorEffect="non-scaling-stroke" />
                ))}
                {TREE.map(([a, c]) => {
                  const p = tree[a];
                  const q = tree[c];
                  const mid = (p.y + p.h + q.y) / 2;
                  return (
                    <path
                      key={`${a}-${c}`}
                      className="si-cue si-cue-hierarchy"
                      d={`M${centre(p).x},${p.y + p.h} L${centre(p).x},${mid} L${centre(q).x},${mid} L${centre(q).x},${q.y}`}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
              {groups.map((g, i) => (
                <span key={i} className="si-cue si-cue-groups si-enclosure" style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%`, height: `${g.h}%` }} />
              ))}
              {timeline.map((b, i) => (
                <span key={i} className="si-cue si-cue-timeline si-tick" style={{ left: `${centre(b).x}%` }} />
              ))}

              {PIECES.map((piece, i) => {
                const b = shape.boxes[i];
                const style = {
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.w}%`,
                  height: `${b.h}%`,
                  rotate: `${b.r ?? 0}deg`,
                  transitionDelay: `${i * 35}ms`,
                } as CSSProperties;
                return (
                  <span key={i} className="si-piece" data-kind={piece.kind} style={style}>
                    <span className="si-piece-date">{piece.date}</span>
                    <span className="si-piece-region">{piece.region}</span>
                    <span className="si-piece-bar" />
                    <span className="si-piece-bar si-piece-bar-short" />
                  </span>
                );
              })}
            </div>

            <div className="si-shapes" role="group" aria-label="Arrange the pieces as">
              {SHAPES.map((s) => (
                <button key={s.key} type="button" className="si-shape-btn" aria-pressed={s.key === shape.key} onClick={() => setShapeKey(s.key)}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <ol className="si-stream" aria-label="From information to meaning">
            {STAGES.map((stage) => (
              <li key={stage.key} data-step={stage.n}>
                {/* node ports: a ring where the stream comes in, a dot where it goes on; the li draws the tie between them */}
                {stage.n > 1 && <span className="si-port si-port-in" aria-hidden />}
                {stage.n < STAGES.length && <span className="si-port si-port-out" aria-hidden />}
                <button
                  type="button"
                  className="si-seg"
                  data-open={open === stage.n || undefined}
                  aria-expanded={open === stage.n}
                  aria-controls="si-spread"
                  onClick={() => toggle(stage.n)}
                >
                  <span className="si-seg-label">
                    <span className="si-seg-n in-serif">{stage.n}</span> {stage.label}
                  </span>
                  <span className="si-seg-value" key={`${stage.key}-${shape.key}`}>
                    {readout(stage, shape)}
                  </span>
                  <svg className="vl-orbit" aria-hidden>
                    <rect className="vl-orbit-track" width="100%" height="100%" rx="16" pathLength={100} />
                    <rect className="vl-orbit-dash" width="100%" height="100%" rx="16" pathLength={100} />
                  </svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </ViewTransition>

      <Spread id="si-spread" item={item} />
    </div>
  );
}
