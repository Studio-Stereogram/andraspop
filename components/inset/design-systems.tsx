"use client";

import { ViewTransition, startTransition, useMemo, useState } from "react";
import { DS_THEMES, themeVars, type DsTheme, type ThemeKey } from "@/lib/inset/ds-themes";
import { EdList, Spread, type SpreadItem } from "./spread";
import { Segmented, SwatchDots } from "./segmented";
import { TickRail } from "./tick-rail";

// Design systems. One sign-up card, built from components and dressed by tokens. The theme switch swaps
// the token set (No theme leaves the components raw and whitelabel); "Explode layers" pulls the card
// apart into the atomic chain: tokens, components, patterns, screen. Under it, the chain as tied nodes,
// and the theme layer as a rail beneath all four, since tokens reach every step. Each opens a spread.

type LayerKey = "tokens" | "components" | "patterns" | "screens" | "theme";
type Layer = { n: number; key: LayerKey; label: string };

const CHAIN: Layer[] = [
  { n: 1, key: "tokens", label: "Tokens" },
  { n: 2, key: "components", label: "Components" },
  { n: 3, key: "patterns", label: "Patterns" },
  { n: 4, key: "screens", label: "Screens" },
];
const THEME_LAYER: Layer = { n: 5, key: "theme", label: "Theme layer" };

// The exploded stack, top to bottom, with the buttons that focus each plane.
type PlaneKey = Exclude<LayerKey, "theme">;
const PLANES: { key: PlaneKey; label: string; hint: string }[] = [
  { key: "tokens", label: "Tokens", hint: "Colour, type, corners" },
  { key: "components", label: "Components", hint: "Button, input, toggle, tag" },
  { key: "patterns", label: "Patterns", hint: "Form field, toggle row, action row" },
  { key: "screens", label: "Screen", hint: "The composed sign-up" },
];

function readout(key: LayerKey, t: DsTheme): string {
  switch (key) {
    case "tokens":
      return t.tokens;
    case "components":
      return `Button, input, toggle, tag. ${t.components}`;
    case "patterns":
      return "Form field, toggle row, action row. The same in every theme.";
    case "screens":
      return t.screens;
    case "theme":
      return t.feel;
  }
}

/* ---- the components, reading the theme's variables ---- */

const Btn = ({ kind, children }: { kind: "primary" | "secondary"; children: string }) => <span className={`ds-btn ds-btn-${kind}`}>{children}</span>;
const Input = ({ value }: { value: string }) => <span className="ds-input">{value}</span>;
const Field = ({ label, value }: { label: string; value: string }) => (
  <span className="ds-field">
    <span className="ds-label">{label}</span>
    <Input value={value} />
  </span>
);
const Switch = () => (
  <span className="ds-switch">
    <span className="ds-knob" />
  </span>
);
const ToggleRow = () => (
  <span className="ds-toggle-row">
    <Switch />
    Send me updates
  </span>
);
const Tag = () => <span className="ds-tag">New</span>;

function SignUpCard() {
  return (
    <span className="ds-card">
      <Tag />
      <span className="ds-h">Create an account</span>
      <span className="ds-p">Two minutes. No card needed.</span>
      <Field label="Email" value="you@example.com" />
      <Field label="Password" value="••••••••" />
      <ToggleRow />
      <span className="ds-actions">
        <Btn kind="primary">Sign up</Btn>
        <Btn kind="secondary">Log in</Btn>
      </span>
    </span>
  );
}

/* ---- the four planes of the exploded view, bottom to top ---- */

function Planes({ theme }: { theme: DsTheme }) {
  const c = theme.colour;
  const swatches: [string, string][] = [
    ["Surface", c.surface],
    ["Text", c.text],
    ["Action", c.action],
    ["Accent", c.accent],
    ["Border", c.border],
  ];
  return (
    <>
      <span className="ds-plane" data-layer="screens">
        <span className="ds-plane-label">Screen</span>
        <span className="ds-page">
          <span className="ds-bar">
            <span className="ds-logo" />
            <span className="ds-nav" />
            <span className="ds-nav" />
          </span>
          <SignUpCard />
        </span>
      </span>
      <span className="ds-plane" data-layer="patterns">
        <span className="ds-plane-label">Patterns</span>
        <span className="ds-plane-body ds-patterns">
          <span className="ds-group">
            <span className="ds-group-label">Form field</span>
            <Field label="Email" value="you@example.com" />
          </span>
          <span className="ds-group">
            <span className="ds-group-label">Toggle row</span>
            <ToggleRow />
          </span>
          <span className="ds-group">
            <span className="ds-group-label">Action row</span>
            <span className="ds-actions">
              <Btn kind="primary">Sign up</Btn>
              <Btn kind="secondary">Log in</Btn>
            </span>
          </span>
        </span>
      </span>
      <span className="ds-plane" data-layer="components">
        <span className="ds-plane-label">Components</span>
        <span className="ds-plane-body ds-atoms">
          <Btn kind="primary">Button</Btn>
          <Btn kind="secondary">Button</Btn>
          <Input value="Input" />
          <Switch />
          <Tag />
        </span>
      </span>
      <span className="ds-plane" data-layer="tokens">
        <span className="ds-plane-label">Tokens</span>
        <span className="ds-plane-body ds-tokens">
          <span className="ds-swatches">
            {swatches.map(([name, value]) => (
              <span key={name} className="ds-swatch">
                <span className="ds-chip" style={{ background: value }} />
                {name}
              </span>
            ))}
          </span>
          <span className="ds-type">
            <span className="ds-type-head">Aa</span>
            <span className="ds-type-body">Aa</span>
            <span className="ds-radius" />
          </span>
        </span>
      </span>
    </>
  );
}

/* ---- spreads ---- */

const SPREADS: Record<LayerKey, Omit<SpreadItem, "key">> = {
  tokens: {
    kicker: "Layer 1 · the theme's values",
    title: "Tokens",
    lede: <p>Named decisions about colour, type, space, corners and motion. They hold the brand&rsquo;s feel, not any one screen.</p>,
    rows: [
      {
        label: "Two tiers",
        content: (
          <EdList
            items={[
              { title: "Primitive", desc: "Raw values with plain names: blue 600, 16px, 8px." },
              { title: "Semantic", desc: "What a value is for: action colour, body text, card corner." },
            ]}
          />
        ),
      },
      { label: "Why names", content: <p>Components ask for &ldquo;action colour&rdquo;, never for a hex. Change the token once and everything that uses it follows.</p> },
    ],
  },
  components: {
    kicker: "Layer 2 · the parts",
    title: "Components",
    lede: <p>The building blocks: button, input, toggle, tag. Each has a structure and states, and takes its look from the tokens.</p>,
    rows: [
      { label: "Without tokens", content: <p>Raw and whitelabel: grey boxes, system type, square corners. They work, but they say nothing.</p> },
      { label: "States", content: <p>Default, hover, focus, pressed, disabled, error. Each state is a set of tokens too.</p> },
    ],
  },
  patterns: {
    kicker: "Layer 3 · the UX",
    title: "Patterns",
    lede: <p>Components combined to solve a recurring task: a form field, a sign-in, a search, an empty state.</p>,
    rows: [
      {
        label: "Examples",
        content: (
          <EdList
            items={[
              { title: "Form field", desc: "A label, an input, help and error text." },
              { title: "Toggle row", desc: "A switch with the setting it changes." },
              { title: "Action row", desc: "One primary action, one way out." },
            ]}
          />
        ),
      },
      { label: "The UI kit", content: <p>Components and patterns together make the UI kit: the structure every screen is built from.</p> },
    ],
  },
  screens: {
    kicker: "Layer 4 · the product",
    title: "Screens",
    lede: <p>Patterns arranged for one real job, with real content. This is the part people see.</p>,
    rows: [{ label: "Built, not drawn", content: <p>A screen built from the kit inherits every fix and every theme change, without being redrawn.</p> }],
  },
  theme: {
    kicker: "Across every layer",
    title: "The theme layer",
    lede: <p>Tokens don&rsquo;t only start the chain, they run through it. Change the theme and every component, pattern and screen changes with it, while the structure stays.</p>,
    rows: [
      { label: "Typography", content: <p>Type carries much of the feel. A serif reads editorial, a round heavy sans reads playful, a mono reads technical.</p> },
      { label: "Without it", content: <p>Components alone are whitelabel: they look like a wireframe. The theme is what makes them yours.</p> },
      { label: "Delight", content: <p>Colour, corners, shadows and motion add emotional depth: the difference between usable and loved.</p> },
    ],
  },
};

export function DesignSystems() {
  const [themeKey, setThemeKey] = useState<ThemeKey>("inset");
  const [exploded, setExploded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  // the plane being inspected in the exploded view: picked beside the stack, or by opening it in the chain
  const [focus, setFocus] = useState<PlaneKey | null>(null);
  // the plane under the rail's pointer or keyboard focus, previewed before it is picked
  const [preview, setPreview] = useState<PlaneKey | null>(null);
  const theme = DS_THEMES.find((t) => t.key === themeKey) ?? DS_THEMES[1];
  const active = [...CHAIN, THEME_LAYER].find((l) => l.n === open);
  const shown = preview ?? focus;
  // the caption describes the kept layer; the rail's own card names a previewed one
  const focused = PLANES.find((p) => p.key === focus);
  const item = useMemo<SpreadItem | null>(() => (active ? { key: active.key, ...SPREADS[active.key] } : null), [active]);

  const toggle = (n: number) => {
    const next = open === n ? null : n;
    // opening a layer explodes the card and focuses that layer, so it can be seen in place
    const layer = CHAIN.find((l) => l.n === next);
    if (layer) {
      setExploded(true);
      setFocus(layer.key as PlaneKey);
    } else if (next === null) setFocus(null);
    // Opening the first layer (or closing the last) changes the layout on wide screens: animate that move.
    if ((open === null) !== (next === null)) startTransition(() => setOpen(next));
    else setOpen(next);
  };

  return (
    <div className="ds split" data-open={open !== null || undefined}>
      <ViewTransition update="in-layout" default="none">
        <div className="split-nav">
          <header className="ds-head">
            <p className="in-kicker">How design systems work</p>
            <h1 className="ds-title in-serif">Design systems</h1>
            <p className="ds-sub">Components give it structure. Tokens give it feel.</p>
          </header>

          <div className="ds-specimen">
            <div className="stage-frame">
            <div
              className="ds-stage"
              data-theme={theme.key}
              data-exploded={exploded || undefined}
              data-focus={exploded ? (shown ?? undefined) : undefined}
              style={themeVars(theme)}
            >
              <span
                className="ds-stack"
                role="img"
                aria-label={`A sign-up card in the ${theme.name} theme${exploded ? ", pulled apart into tokens, components, patterns and screen" : ""}.`}
              >
                <Planes theme={theme} />
              </span>

              {/* inspect one layer at a time: hover the rail to preview a plane, click to keep it */}
              <div className="ds-inspect">
                <TickRail items={PLANES} selected={focus} onSelect={setFocus} onPreview={setPreview} label="Inspect a layer" disabled={!exploded} />
              </div>
              <p className="ds-caption" aria-live="polite" data-visible={(exploded && focused) || undefined}>
                {exploded && focused ? (
                  <>
                    <strong>{focused.label}.</strong> {readout(focused.key, theme)}
                  </>
                ) : null}
              </p>
            </div>

            {/* the stage toolbar: themes (each with its swatch dots) and the layers toggle */}
            <div className="tb">
              <Segmented
                label="Theme"
                value={theme.key}
                onChange={setThemeKey}
                options={DS_THEMES.map((t) => ({
                  key: t.key,
                  label: t.name,
                  mark: <SwatchDots colours={[t.colour.bg, t.colour.action, t.colour.accent]} />,
                }))}
              />
              <span className="tb-div" aria-hidden />
              <button
                type="button"
                className="tb-btn"
                aria-pressed={exploded}
                onClick={() => {
                  setExploded(!exploded);
                  if (exploded) setFocus(null);
                }}
              >
                <span className="tb-stack" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                {exploded ? "Stack" : "Pull apart"}
              </button>
            </div>
            </div>
          </div>

          <ol className="si-stream" aria-label="From tokens to screens">
            {CHAIN.map((layer) => (
              <li key={layer.key} data-step={layer.n}>
                {layer.n > 1 && <span className="si-port si-port-in" aria-hidden />}
                {layer.n < CHAIN.length && <span className="si-port si-port-out" aria-hidden />}
                <button
                  type="button"
                  className="si-seg"
                  data-open={open === layer.n || undefined}
                  aria-expanded={open === layer.n}
                  aria-controls="ds-spread"
                  onClick={() => toggle(layer.n)}
                >
                  <span className="si-seg-label">
                    <span className="si-seg-n in-serif">{layer.n}</span> {layer.label}
                  </span>
                  <span className="si-seg-value" key={`${layer.key}-${theme.key}`}>
                    {readout(layer.key, theme)}
                  </span>
                  <svg className="vl-orbit" aria-hidden>
                    <rect className="vl-orbit-track" width="100%" height="100%" rx="16" pathLength={100} />
                    <rect className="vl-orbit-dash" width="100%" height="100%" rx="16" pathLength={100} />
                  </svg>
                </button>
              </li>
            ))}
          </ol>

          {/* the theme layer runs under every step of the chain */}
          <button
            type="button"
            className="ds-rail"
            data-open={open === THEME_LAYER.n || undefined}
            aria-expanded={open === THEME_LAYER.n}
            aria-controls="ds-spread"
            onClick={() => toggle(THEME_LAYER.n)}
          >
            {CHAIN.map((layer, i) => (
              <span key={layer.key} className="ds-rail-tie" style={{ "--i": i } as React.CSSProperties} aria-hidden />
            ))}
            <span className="si-seg-label">{THEME_LAYER.label}</span>
            <span className="si-seg-value" key={`theme-${theme.key}`}>
              Runs through every layer. {readout("theme", theme)}
            </span>
            <svg className="vl-orbit" aria-hidden>
              <rect className="vl-orbit-track" width="100%" height="100%" rx="16" pathLength={100} />
              <rect className="vl-orbit-dash" width="100%" height="100%" rx="16" pathLength={100} />
            </svg>
          </button>
        </div>
      </ViewTransition>

      <Spread id="ds-spread" item={item} />
    </div>
  );
}
