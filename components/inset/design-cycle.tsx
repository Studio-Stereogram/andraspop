"use client";

import { useState } from "react";

// Design cycle: three phases on a line. Opening one shows what it delivers and who is involved;
// opening Planning raises the "Singular source of truth" pin above it.
// Content from the original "Design process — source of truth" artifact.

type Phase = {
  n: number;
  label: string;
  sublabel: string;
  title: string;
  /** The phase's relation to the source of truth: lead-in, the bold verb, the rest. */
  sot: [string, string, string];
  deliverables: { title: string; desc: string }[];
  roles: { name: string; lead?: boolean }[];
};

const PHASES: Phase[] = [
  {
    n: 1,
    label: "Research",
    sublabel: "Discover & define",
    title: "Research & discovery",
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
    sublabel: "Design & document",
    title: "Design & planning",
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
    label: "Execution",
    sublabel: "Build & deliver",
    title: "Implementation & execution",
    sot: ["This phase ", "consumes and validates", " the design documentation."],
    deliverables: [
      { title: "Dev handoff", desc: "Figma specs, token exports, assets. The design file stays the reference." },
      { title: "QA & design review", desc: "Designers review built screens against the source of truth. Not optional." },
      { title: "Design in code", desc: "Framer, Webflow or coded components, closing the implementation gap directly." },
      { title: "Iteration log", desc: "Post-launch findings fed back into the design system. The loop closes here." },
    ],
    roles: [{ name: "Frontend dev" }, { name: "Backend dev" }, { name: "Designer (QA)", lead: true }, { name: "Designer (code)", lead: true }],
  },
];

const SOURCE = 2;

export function DesignCycle() {
  const [open, setOpen] = useState<number | null>(null);
  // The last opened phase stays rendered while the panel closes, so it folds away instead of vanishing.
  const [shown, setShown] = useState<number | null>(null);
  const phase = PHASES.find((p) => p.n === shown);
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

      <div className="dc-row-wrap">
        <div className="dc-pin" data-visible={open === SOURCE || undefined} aria-hidden={open !== SOURCE}>
          <span className="dc-pin-label">Singular source of truth</span>
          <span className="dc-pin-stem" />
          <span className="dc-pin-dot" />
        </div>
        <div className="dc-row" role="group" aria-label="Phases">
          {PHASES.map((p) => (
            <button
              key={p.n}
              type="button"
              className="dc-phase"
              data-open={open === p.n || undefined}
              data-source={p.n === SOURCE || undefined}
              aria-expanded={open === p.n}
              aria-controls="dc-panel"
              onClick={() => toggle(p.n)}
            >
              <span className="dc-diamond">
                <span className="dc-num in-serif">{p.n}</span>
              </span>
              <span className="dc-label">{p.label}</span>
              <span className="dc-sublabel">{p.sublabel}</span>
            </button>
          ))}
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
            </div>
          )}
        </div>
      </div>

      <p className="dc-hint" data-hidden={open !== null || undefined}>
        Select a phase to open it.
      </p>
    </div>
  );
}
