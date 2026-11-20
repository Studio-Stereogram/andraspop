"use client";

import { ViewTransition, startTransition, useMemo, useState, type CSSProperties } from "react";
import { EdList, Spread, type SpreadItem } from "./spread";

// Design cycle: a double diamond (Research, Planning) in the designer's focus, and a third diamond
// (Implementation) set apart, since it is often its own sub-cycle. Over them, Shape Up's hill
// (Ryan Singer, Basecamp): uphill is figuring out what to do, downhill is execution. The peak, at
// the end of Planning, is the singular source of truth. Opening a phase puts a dot on the hill.
// Phase content from the original "Design process — source of truth" artifact.

type Phase = {
  n: number;
  label: string;
  /** A few words under the diamond. */
  brief: string;
  /** The opened spread's lede. */
  lede: string;
  /** The diamond's two halves: diverge, then converge. */
  halves: [string, string];
  title: string;
  /** Where the phase sits on the hill, 0–1 across, and how it feels there. */
  hillAt: number;
  hill: string;
  /** The phase's relation to the source of truth: lead-in, the bold verb, the rest. */
  sot: [string, string, string];
  deliverables: { title: string; desc: string }[];
  roles: { name: string; lead?: boolean }[];
};

// Layout across the map, as fractions of its width. The diamonds are squares turned 45°: Research and
// Planning touch (the designer's double diamond); Implementation stands apart after a gap. The hill's
// peak sits exactly where Planning ends, and each diamond hangs under its own point on the hill.
const LEFT = 0.12;
const D = 0.22; // a diamond's width (and height)
const GAP = 0.1;
const CENTRES = [LEFT + D / 2, LEFT + D * 1.5, LEFT + D * 2 + GAP + D / 2];
const PEAK = LEFT + D * 2;
const HILL_H = 1; // the curve's height in its own units; CSS sets the drawn height

/** Height of the hill (0 at the foot, 1 at the peak) at x, 0–1 across. Longer climb, shorter descent. */
function hill(x: number) {
  const t = x <= PEAK ? x / PEAK : (1 - x) / (1 - PEAK);
  return HILL_H * (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t)))) * 0.5;
}

const HILL_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = i / 120;
    pts.push(`${(x * 1000).toFixed(1)},${(100 - hill(x) * 92).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
})();

const PHASES: Phase[] = [
  {
    n: 1,
    label: "Research",
    brief: "Find the real problem.",
    lede: "Discover what people need, then define the problem worth solving.",
    halves: ["Discover", "Define"],
    title: "Research & discovery",
    hillAt: CENTRES[0],
    hill: "Uphill. Full of unknowns: still working out what the problem is.",
    sot: ["Output from this phase ", "feeds into", " the design documentation."],
    deliverables: [
      { title: "User research", desc: "Interviews, surveys, usability tests. Findings documented in a structured insights repository." },
      { title: "Competitive analysis", desc: "Benchmarking against market standards. Identifies patterns, gaps and opportunities." },
      { title: "Problem definition", desc: "How Might We statements, Jobs To Be Done, and validated problem framing." },
      { title: "Personas & journey maps", desc: "Living documents, updated as new research emerges throughout the project." },
    ],
    roles: [{ name: "UX researcher", lead: true }, { name: "Product designer", lead: true }, { name: "Product manager" }, { name: "Stakeholders" }],
  },
  {
    n: 2,
    label: "Planning",
    brief: "Decide the solution.",
    lede: "Develop the solution and document it. This is the source of truth, and the designer owns it.",
    halves: ["Develop", "Document"],
    title: "Design & planning",
    hillAt: CENTRES[1],
    hill: "Near the top. The approach is validated; at the end of this phase, “Now I know what to do.”",
    sot: ["This phase ", "is", " the source of truth. The designer owns it."],
    deliverables: [
      { title: "Design system", desc: "Components, tokens, patterns. The single source every UI decision derives from." },
      { title: "Wireframes & flows", desc: "Low-fidelity structure, validated with stakeholders before high fidelity." },
      { title: "High-fidelity prototypes", desc: "Annotated Figma files. The definitive visual and interaction spec." },
      { title: "Handoff documentation", desc: "Spacing, states, edge cases, copy. Everything a developer needs, without asking." },
    ],
    roles: [{ name: "Product designer", lead: true }, { name: "UI designer", lead: true }, { name: "Product manager" }, { name: "Tech lead" }],
  },
  {
    n: 3,
    label: "Implementation",
    brief: "Build and ship it.",
    lede: "Build it and deliver it, checked against the documentation. Often its own sub-cycle, run by the people who build it.",
    halves: ["Build", "Deliver"],
    title: "Implementation",
    hillAt: CENTRES[2],
    hill: "Downhill. Certainty: all the work is visible, and it is a matter of doing it.",
    sot: ["This phase ", "consumes and validates", " the design documentation."],
    deliverables: [
      { title: "Dev handoff", desc: "Figma specs, token exports, assets. The design file stays the reference." },
      { title: "QA & design review", desc: "Designers review built screens against the source of truth. Not optional." },
      { title: "Design in code", desc: "Framer, Webflow or coded components, closing the implementation gap directly." },
      { title: "Iteration log", desc: "Post-launch findings fed back into the design system. The loop closes here." },
    ],
    roles: [{ name: "Frontend dev" }, { name: "Backend dev" }, { name: "Designer doing QA", lead: true }, { name: "Designer working in code", lead: true }],
  },
];

function spreadFor(p: Phase): SpreadItem {
  // Role names read mid-sentence: lowercase the first letter unless it starts an acronym (UI, UX).
  const inline = (name: string) => (/^[A-Z]{2}/.test(name) ? name : name[0].toLowerCase() + name.slice(1));
  const leads = p.roles.filter((r) => r.lead).map((r) => inline(r.name));
  const others = p.roles.filter((r) => !r.lead).map((r) => inline(r.name));
  return {
    key: `phase-${p.n}`,
    kicker: `Phase ${String(p.n).padStart(2, "0")} · ${p.halves[0]}, then ${p.halves[1].toLowerCase()}`,
    title: p.label,
    lede: <p>{p.lede}</p>,
    rows: [
      { label: "On the hill", content: <p>{p.hill}</p> },
      // Planning's lede already says it is the source of truth.
      ...(p.n === 2
        ? []
        : [
            {
              label: "Source of truth",
              content: (
                <p>
                  {p.sot[0]}
                  <strong>{p.sot[1]}</strong>
                  {p.sot[2]}
                </p>
              ),
            },
          ]),
      { label: "What it delivers", content: <EdList items={p.deliverables} /> },
      {
        label: "Who",
        content: (
          <p>
            Led by the {leads.join(" and ")}, with the {others.join(" and ")}.
          </p>
        ),
      },
    ],
  };
}

export function DesignCycle() {
  const [open, setOpen] = useState<number | null>(null);
  const active = PHASES.find((p) => p.n === open);
  const item = useMemo(() => (active ? spreadFor(active) : null), [active]);
  const toggle = (n: number) => {
    const next = open === n ? null : n;
    // Opening the first phase (or closing the last) changes the layout on wide screens: animate that move.
    if ((open === null) !== (next === null)) startTransition(() => setOpen(next));
    else setOpen(next);
  };

  return (
    <div className="dc split" data-open={open !== null || undefined}>
      <ViewTransition update="in-layout" default="none">
        <div className="split-nav">
          <header className="dc-head">
            <p className="in-kicker">Design process overview</p>
            <h1 className="dc-title in-serif">
              From ambiguity <span className="dc-to">to</span> execution
            </h1>
            <p className="dc-sub">Two diamonds to decide what to make, one to make it.</p>
          </header>

          <div className="dc-map">
            <div className="dc-hill" aria-hidden>
              <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path className="dc-hill-fill" d={`${HILL_PATH} L1000,100 L0,100 Z`} />
                <path className="dc-hill-line" d={HILL_PATH} vectorEffect="non-scaling-stroke" />
              </svg>
              <span className="dc-slope dc-slope-up">
                <strong>Uphill</strong>
                <span className="dc-slope-note"> · figuring it out</span>
              </span>
              <span className="dc-slope dc-slope-down">
                <strong>Downhill</strong>
                <span className="dc-slope-note"> · execution</span>
              </span>
              <span className="dc-peak" style={{ left: `${PEAK * 100}%` }} data-active={open === 2 || undefined}>
                <span className="dc-peak-label">Source of truth</span>
                <span className="dc-peak-stem" />
              </span>
              <span
                className="dc-dot"
                data-visible={active ? true : undefined}
                style={{ left: `${(active?.hillAt ?? 0) * 100}%`, bottom: `${hill(active?.hillAt ?? 0) * 92}%` }}
              />
            </div>

            <div className="dc-diamonds" role="group" aria-label="Phases">
              {PHASES.map((p, i) => (
                <button
                  key={p.n}
                  type="button"
                  className="dc-phase"
                  style={{ gridColumn: i === 2 ? 5 : i + 2, "--h": hill(p.hillAt) } as CSSProperties}
                  data-open={open === p.n || undefined}
                  data-source={p.n === 2 || undefined}
                  aria-expanded={open === p.n}
                  aria-controls="dc-spread"
                  onClick={() => toggle(p.n)}
                >
                  <span className="dc-shape">
                    {/* a dashed line up from the diamond's tip to its point on the hill */}
                    <span className="dc-drop" aria-hidden />
                    <svg viewBox="0 0 100 100" aria-hidden>
                      <path className="dc-rhomb" d="M50,1 L99,50 L50,99 L1,50 Z" vectorEffect="non-scaling-stroke" />
                      <path className="dc-mid" d="M50,8 L50,92" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </span>
                  <span className="dc-label">{p.label}</span>
                  <span className="dc-sublabel">{p.brief}</span>
                </button>
              ))}
              <span className="dc-divider" aria-hidden />
            </div>

            <div className="dc-groups" aria-hidden>
              <span className="dc-group dc-group-focus">Designer&rsquo;s focus</span>
              <span className="dc-group dc-group-impl">Its own sub-cycle</span>
            </div>
          </div>

          <p className="dc-credit">
            The hill is from{" "}
            <a href="https://basecamp.com/shapeup/3.4-chapter-13" target="_blank" rel="noreferrer">
              Shape Up
            </a>{" "}
            by Ryan Singer.
          </p>
        </div>
      </ViewTransition>

      <Spread id="dc-spread" item={item} />
    </div>
  );
}
