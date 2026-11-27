"use client";

import { ViewTransition, startTransition, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Participant } from "@/lib/inset/roles";
import { RoleTags } from "./role-tags";
import { Spread, type SpreadItem } from "./spread";

// A vehicle for logic: what an LLM's output can become, as a ladder from a read-once answer (4)
// up to a tool others work and build with (1). The surface is the ladder: a name and a few words
// per level. Opening a level shows its spread; "Read more" adds what it's best used for, who meets it,
// what it's made of and its index scores.

type Axis = { key: "reach" | "lifespan" | "agency" | "effort"; label: string; hint: string };

const AXES: Axis[] = [
  { key: "reach", label: "Reach", hint: "how many people can use it" },
  { key: "lifespan", label: "Lifespan", hint: "how long it stays useful" },
  { key: "agency", label: "Agency", hint: "how much others can do with it" },
  { key: "effort", label: "Effort", hint: "what it takes to make" },
];

const MAX = 4;

type Level = {
  n: number;
  name: string;
  brief: string;
  line: string;
  bestFor: string[];
  who: Participant[];
  modalities: string[];
  scores: Record<Axis["key"], number>;
  baseline?: boolean;
};

const LEVELS: Level[] = [
  {
    n: 1,
    name: "Tool or system",
    brief: "Others work with it, or build on it.",
    line: "Others use the underlying system to do an operative task, or a number of tasks, or to come up with new tools.",
    bestFor: ["Operative, repeatable tasks", "Running a number of tasks", "Making new tools"],
    who: [{ id: "operator" }, { id: "builder" }],
    modalities: ["Code", "Data", "Any as input and output"],
    scores: { reach: 4, lifespan: 4, agency: 4, effort: 4 },
  },
  {
    n: 2,
    name: "Interactive artifact",
    brief: "Others explore scenarios with it.",
    line: "Others can interface with it and explore different scenarios on a specific idea or problem. It allows for a wider spectrum of messages.",
    bestFor: ["Exploring scenarios", "One idea or problem, seen from many sides", "Messages a page can't hold"],
    who: [{ id: "explorer" }],
    modalities: ["Text", "Image", "Sound", "Code"],
    scores: { reach: 3, lifespan: 3, agency: 3, effort: 3 },
  },
  {
    n: 3,
    name: "Standalone document",
    brief: "A record others read and follow.",
    line: "A fixed record that holds up on its own, outside the conversation that made it.",
    bestFor: ["Strategic decisions", "Logs of events", "Rules, or a set of rules"],
    who: [{ id: "reader" }],
    modalities: ["Text", "Image", "Tables"],
    scores: { reach: 2, lifespan: 3, agency: 2, effort: 2 },
  },
  {
    n: 4,
    name: "Answer",
    brief: "Read once, in the chat.",
    line: "The plain reply in a chat. Read once, then it stays in the conversation.",
    bestFor: ["A quick question", "A one-off explanation"],
    who: [{ id: "you" }],
    modalities: ["Text", "Image"],
    scores: { reach: 1, lifespan: 1, agency: 1, effort: 1 },
    baseline: true,
  },
];

function Meter({ value, label, cost }: { value: number; label: string; cost?: boolean }) {
  return (
    <span className="vl-meter" data-cost={cost || undefined} role="img" aria-label={`${label}: ${value} of ${MAX}`}>
      {Array.from({ length: MAX }, (_, i) => (
        <span key={i} className="vl-pip" data-on={i < value || undefined} />
      ))}
    </span>
  );
}

function spreadFor(level: Level): SpreadItem {
  return {
    key: `level-${level.n}`,
    kicker: `Level ${level.n}${level.baseline ? " · the baseline" : ""}`,
    title: level.name,
    lede: <p>{level.line}</p>,
    people: <RoleTags participants={level.who} legend={false} />,
    rows: [
      { label: "Best used for", content: <p>{level.bestFor.join(". ")}.</p> },
      { label: "Made of", content: <p>{level.modalities.map((m, i) => (i === 0 ? m : m.toLowerCase())).join(", ")}.</p> },
      {
        label: "Index",
        content: (
          <ul className="vl-index">
            {AXES.map((axis) => (
              <li key={axis.key}>
                <span className="vl-index-label">
                  {axis.label} <span>· {axis.hint}</span>
                </span>
                <Meter value={level.scores[axis.key]} label={axis.label} cost={axis.key === "effort"} />
              </li>
            ))}
          </ul>
        ),
      },
    ],
  };
}

export function VehicleForLogic() {
  const [open, setOpen] = useState<number | null>(null);
  const active = LEVELS.find((l) => l.n === open);
  const item = useMemo(() => (active ? spreadFor(active) : null), [active]);
  // the thumb under the open rung, measured (again on resize, as rungs reflow on narrow screens)
  const rungs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = open === null ? null : rungs.current[LEVELS.findIndex((l) => l.n === open)];
    if (!el) {
      setThumb(null);
      return;
    }
    const measure = () => setThumb({ y: el.offsetTop, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // Up/Down move between rungs, Home/End jump; Enter or Space opens one
  const onKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const i = rungs.current.findIndex((el) => el === document.activeElement);
    if (i < 0) return;
    const go = (j: number) => rungs.current[(j + LEVELS.length) % LEVELS.length]?.focus();
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(LEVELS.length - 1);
    else return;
    e.preventDefault();
  };

  const toggle = (n: number) => {
    const next = open === n ? null : n;
    // Opening the first level (or closing the last) changes the layout on wide screens: animate that move.
    if ((open === null) !== (next === null)) startTransition(() => setOpen(next));
    else setOpen(next);
  };

  return (
    <div className="vl split" data-open={open !== null || undefined}>
      <ViewTransition update="in-layout" default="none">
        <div className="split-nav">
          <header className="vl-head">
            <p className="in-kicker">LLM outputs, indexed</p>
            <h1 className="vl-title in-serif">A vehicle for logic</h1>
            <p className="vl-sub">From a read-once answer to a tool others build with.</p>
          </header>

          <div className="vl-ladder">
            <div className="vl-axis" aria-hidden>
              <span>More leverage</span>
            </div>
            {/* the same toolbar as the stages: a soft track, and a white thumb that slides to the open level */}
            <div className="tb vl-tb">
            <div className="vl-track">
            {thumb && <span className="vl-thumb" aria-hidden style={{ top: thumb.y, height: thumb.h }} />}
            <ol className="vl-rungs" onKeyDown={onKey}>
              {LEVELS.map((level, i) => {
                const isOpen = open === level.n;
                return (
                  <li key={level.n}>
                    <button
                      ref={(el) => {
                        rungs.current[i] = el;
                      }}
                      type="button"
                      className="vl-rung"
                      data-open={isOpen || undefined}
                      data-baseline={level.baseline || undefined}
                      aria-expanded={isOpen}
                      aria-controls="vl-spread"
                      onClick={() => toggle(level.n)}
                    >
                      <span className="vl-num in-serif">{level.n}</span>
                      <span className="vl-name">{level.name}</span>
                      <span className="vl-brief">{level.brief}</span>
                  {/* the focused rung's ambient outline: a faint track with one dash circling it slowly */}
                  <svg className="vl-orbit" aria-hidden>
                    <rect className="vl-orbit-track" width="100%" height="100%" rx="8" pathLength={100} />
                    <rect className="vl-orbit-dash" width="100%" height="100%" rx="8" pathLength={100} />
                  </svg>
                    </button>
                  </li>
                );
              })}
            </ol>
            </div>
            </div>
          </div>
        </div>
      </ViewTransition>

      <Spread id="vl-spread" item={item} />
    </div>
  );
}
