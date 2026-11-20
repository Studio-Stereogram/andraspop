"use client";

import { useState } from "react";

// Design cycle: a double diamond (Research, Planning) in the designer's focus, and a third diamond
// (Implementation) set apart, since it is often its own sub-cycle. Over them, Shape Up's hill
// (Ryan Singer, Basecamp): uphill is figuring out what to do, downhill is execution. The peak, at
// the end of Planning, is the singular source of truth. Opening a phase puts a dot on the hill.
// Phase content from the original "Design process — source of truth" artifact.

type Phase = {
  n: number;
  label: string;
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
  note?: string;
};

// The hill peaks where Planning ends: two thirds across.
const PEAK = 2 / 3;
const HILL_H = 1; // the curve's height in its own units; CSS sets the drawn height

/** Height of the hill (0 at the foot, 1 at the peak) at x, 0–1 across. Steeper going up, gentler coming down. */
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
    halves: ["Discover", "Define"],
    title: "Research & discovery",
    hillAt: 1 / 6,
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
    halves: ["Develop", "Document"],
    title: "Design & planning",
    hillAt: 0.5,
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
    halves: ["Build", "Deliver"],
    title: "Implementation",
    hillAt: 5 / 6,
    hill: "Downhill. Certainty: all the work is visible, and it is a matter of doing it.",
    sot: ["This phase ", "consumes and validates", " the design documentation."],
    deliverables: [
      { title: "Dev handoff", desc: "Figma specs, token exports, assets. The design file stays the reference." },
      { title: "QA & design review", desc: "Designers review built screens against the source of truth. Not optional." },
      { title: "Design in code", desc: "Framer, Webflow or coded components, closing the implementation gap directly." },
      { title: "Iteration log", desc: "Post-launch findings fed back into the design system. The loop closes here." },
    ],
    roles: [{ name: "Frontend dev" }, { name: "Backend dev" }, { name: "Designer (QA)", lead: true }, { name: "Designer (code)", lead: true }],
    note: "Often its own sub-cycle, run by the people who build it.",
  },
];

export function DesignCycle() {
  const [open, setOpen] = useState<number | null>(null);
  // The last opened phase stays rendered while the panel closes, so it folds away instead of vanishing.
  const [shown, setShown] = useState<number | null>(null);
  const phase = PHASES.find((p) => p.n === shown);
  const active = PHASES.find((p) => p.n === open);
  const toggle = (n: number) => {
    setOpen(open === n ? null : n);
    if (open !== n) setShown(n);
  };

  return (
    <div className="dc">
      <header className="dc-head">
        <p className="in-kicker">Design process overview</p>
        <h1 className="dc-title in-serif">
          From ambiguity <span className="dc-to">to</span> execution
        </h1>
      </header>

      <div className="dc-map">
        <div className="dc-hill" aria-hidden>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path className="dc-hill-fill" d={`${HILL_PATH} L1000,100 L0,100 Z`} />
            <path className="dc-hill-line" d={HILL_PATH} vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="dc-slope dc-slope-up">
            <strong>Uphill</strong> · figuring it out
          </span>
          <span className="dc-slope dc-slope-down">
            <strong>Downhill</strong> · execution
          </span>
          <span className="dc-peak" style={{ left: `${PEAK * 100}%` }} data-active={open === 2 || undefined}>
            <span className="dc-peak-label">Singular source of truth</span>
            <span className="dc-peak-stem" />
          </span>
          <span
            className="dc-dot"
            data-visible={active ? true : undefined}
            style={{ left: `${(active?.hillAt ?? 0) * 100}%`, bottom: `${hill(active?.hillAt ?? 0) * 92}%` }}
          />
        </div>

        <div className="dc-diamonds" role="group" aria-label="Phases">
          {PHASES.map((p) => (
            <div key={p.n} className="dc-col" data-apart={p.n === 3 || undefined}>
              <button
                type="button"
                className="dc-phase"
                data-open={open === p.n || undefined}
                data-source={p.n === 2 || undefined}
                aria-expanded={open === p.n}
                aria-controls="dc-panel"
                onClick={() => toggle(p.n)}
              >
                <span className="dc-shape">
                  <svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
                    <path className="dc-rhomb" d="M1,50 L100,1 L199,50 L100,99 Z" vectorEffect="non-scaling-stroke" />
                    <path className="dc-mid" d="M100,8 L100,92" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <span className="dc-half dc-half-l">{p.halves[0]}</span>
                  <span className="dc-half dc-half-r">{p.halves[1]}</span>
                </span>
                <span className="dc-label">
                  <span className="dc-num in-serif">{p.n}</span> {p.label}
                </span>
                <span className="dc-sublabel">
                  {p.halves[0]} & {p.halves[1].toLowerCase()}
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="dc-groups" aria-hidden>
          <span className="dc-group dc-group-focus">Designer&rsquo;s focus</span>
          <span className="dc-group dc-group-impl">Often its own sub-cycle</span>
        </div>
      </div>

      <div className="dc-panel" id="dc-panel" data-open={open !== null || undefined} role="region" aria-label={phase?.title} inert={open === null}>
        <div className="dc-panel-clip">
          {phase && (
            <div className="dc-panel-inner" key={phase.n}>
              <div className="dc-panel-head">
                <h2 className="dc-panel-title in-serif">{phase.title}</h2>
                <span className="dc-tag">Phase {String(phase.n).padStart(2, "0")}</span>
              </div>
              <p className="dc-sot">
                {phase.sot[0]}
                <strong>{phase.sot[1]}</strong>
                {phase.sot[2]}
              </p>
              <p className="dc-onhill">
                <span className="dc-onhill-label">On the hill</span>
                {phase.hill}
              </p>
              <ul className="dc-deliverables">
                {phase.deliverables.map((d) => (
                  <li key={d.title} className="dc-deliverable">
                    <span className="dc-deliverable-title">{d.title}</span>
                    <span className="dc-deliverable-desc">{d.desc}</span>
                  </li>
                ))}
              </ul>
              <p className="dc-roles-label">Roles involved</p>
              <ul className="dc-roles">
                {phase.roles.map((r) => (
                  <li key={r.name} className="dc-role" data-lead={r.lead || undefined}>
                    {r.name}
                  </li>
                ))}
              </ul>
              {phase.note && <p className="dc-note">{phase.note}</p>}
            </div>
          )}
        </div>
      </div>

      <p className="dc-hint" data-hidden={open !== null || undefined}>
        Select a phase to open it.
      </p>
      <p className="dc-credit">
        The hill is from{" "}
        <a href="https://basecamp.com/shapeup/3.4-chapter-13" target="_blank" rel="noreferrer">
          Shape Up
        </a>{" "}
        by Ryan Singer: uphill is figuring out what to do, downhill is execution.
      </p>
    </div>
  );
}
