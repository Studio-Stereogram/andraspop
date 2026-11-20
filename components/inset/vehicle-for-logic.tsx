"use client";

import { useState } from "react";

// A vehicle for logic: what an LLM's output can become, as a ladder from a read-once answer (4)
// up to a tool others work and build with (1). Each rung is scored on the same four axes, so the
// list reads as an index; opening a rung shows what it is best used for, who meets it and what it is made of.

type Axis = { key: "reach" | "lifespan" | "agency" | "effort"; label: string; hint: string };

const AXES: Axis[] = [
  { key: "reach", label: "Reach", hint: "How many people can use it" },
  { key: "lifespan", label: "Lifespan", hint: "How long it stays useful" },
  { key: "agency", label: "Agency", hint: "How much others can do with it" },
  { key: "effort", label: "Effort", hint: "What it takes to make" },
];

const MAX = 4;

type Level = {
  n: number;
  name: string;
  line: string;
  bestFor: string[];
  who: string;
  whoHint: string;
  modalities: string[];
  scores: Record<Axis["key"], number>;
  baseline?: boolean;
};

const LEVELS: Level[] = [
  {
    n: 1,
    name: "Tool or system",
    line: "Others use the underlying system to do an operative task, or a number of tasks, or to come up with new tools.",
    bestFor: ["Operative, repeatable tasks", "Running a number of tasks", "Making new tools"],
    who: "Operator, builder",
    whoHint: "Uses it to get work done, or builds on it",
    modalities: ["Code", "Data", "Any as input and output"],
    scores: { reach: 4, lifespan: 4, agency: 4, effort: 4 },
  },
  {
    n: 2,
    name: "Interactive artifact",
    line: "Others can interface with it and explore different scenarios on a specific idea or problem. It allows for a wider spectrum of messages.",
    bestFor: ["Exploring scenarios", "One idea or problem, seen from many sides", "Messages a page can't hold"],
    who: "Explorer",
    whoHint: "Changes inputs and sees what follows",
    modalities: ["Text", "Image", "Sound", "Code"],
    scores: { reach: 3, lifespan: 3, agency: 3, effort: 3 },
  },
  {
    n: 3,
    name: "Standalone document",
    line: "A fixed record that holds up on its own, outside the conversation that made it.",
    bestFor: ["Strategic decisions", "Logs of events", "Rules, or a set of rules"],
    who: "Reader",
    whoHint: "Reads it, cites it, follows it",
    modalities: ["Text", "Image", "Tables"],
    scores: { reach: 2, lifespan: 3, agency: 2, effort: 2 },
  },
  {
    n: 4,
    name: "Answer",
    line: "The plain reply in a chat. Read once, then it stays in the conversation.",
    bestFor: ["A quick question", "A one-off explanation"],
    who: "You",
    whoHint: "Only whoever asked",
    modalities: ["Text", "Image"],
    scores: { reach: 1, lifespan: 1, agency: 1, effort: 1 },
    baseline: true,
  },
];

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <span className="vl-meter" role="img" aria-label={`${label}: ${value} of ${MAX}`}>
      {Array.from({ length: MAX }, (_, i) => (
        <span key={i} className="vl-pip" data-on={i < value || undefined} />
      ))}
    </span>
  );
}

export function VehicleForLogic() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="vl">
      <header className="vl-head">
        <p className="in-kicker">LLM outputs, indexed</p>
        <h1 className="vl-title in-serif">A vehicle for logic</h1>
        <p className="vl-sub">What a model&rsquo;s output can become, from a read-once answer to a tool others build with.</p>
      </header>

      <div className="vl-ladder">
        <div className="vl-axis" aria-hidden>
          <span>More leverage</span>
        </div>

        <div className="vl-list">
          <div className="vl-legend" aria-hidden>
            <span className="vl-legend-spacer" />
            {AXES.map((axis) => (
              <span key={axis.key} className="vl-legend-item" title={axis.hint}>
                {axis.label}
              </span>
            ))}
          </div>

          <ol className="vl-rungs">
            {LEVELS.map((level) => {
              const isOpen = open === level.n;
              return (
                <li key={level.n} className="vl-rung" data-open={isOpen || undefined} data-baseline={level.baseline || undefined}>
                  <button
                    type="button"
                    className="vl-rung-head"
                    aria-expanded={isOpen}
                    aria-controls={`vl-detail-${level.n}`}
                    onClick={() => setOpen(isOpen ? null : level.n)}
                  >
                    <span className="vl-num in-serif">{level.n}</span>
                    <span className="vl-name">
                      <span className="vl-level">Level {level.n}</span>
                      {level.name}
                    </span>
                    <span className="vl-scores">
                      {AXES.map((axis) => (
                        <span key={axis.key} className="vl-score">
                          <span className="vl-score-label">{axis.label}</span>
                          <Meter value={level.scores[axis.key]} label={axis.label} />
                        </span>
                      ))}
                    </span>
                  </button>

                  <div className="vl-detail" id={`vl-detail-${level.n}`} inert={!isOpen}>
                    <div className="vl-detail-clip">
                      <div className="vl-detail-inner">
                        <p className="vl-line">{level.line}</p>
                        <dl className="vl-facts">
                          <div>
                            <dt>Best used for</dt>
                            <dd>
                              <ul className="vl-chips">
                                {level.bestFor.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                          <div>
                            <dt>Who interacts</dt>
                            <dd>
                              <span className="vl-who">{level.who}</span>
                              <span className="vl-who-hint">{level.whoHint}</span>
                            </dd>
                          </div>
                          <div>
                            <dt>Made of</dt>
                            <dd>
                              <ul className="vl-chips vl-chips-quiet">
                                {level.modalities.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <p className="vl-hint">Select a level to open it. Scores run from 1 to {MAX}.</p>
    </div>
  );
}
