// Themes for the design system inset: the same sign-up card, dressed by four token sets.
// Each is a set of semantic tokens (what a value is for, not what it is), applied as CSS variables.
// "No theme" is the whitelabel baseline; Inset and Meta Map are this site's real looks; Sherbet is an
// invented, deliberately loud brand. Every text and fill pair is checked with APCA (ds-themes.test.ts).

import type { CSSProperties } from "react";

export type ThemeKey = "none" | "inset" | "metamap" | "sherbet";

export type DsTheme = {
  key: ThemeKey;
  name: string;
  /** What the tokens hold, what that does to the components and screen, and the feel it adds. */
  tokens: string;
  components: string;
  screens: string;
  feel: string;
  colour: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    action: string;
    onAction: string;
    accent: string;
    onAccent: string;
  };
  radius: string;
  buttonRadius: string;
  borderWidth: string;
  shadow: string;
  fontHead: string;
  fontBody: string;
  fontLabel: string;
  headWeight: number;
  bodyWeight: number;
  /** Allo's roundness, 0–100 (ignored by fonts without the axis). */
  rond: number;
};

export const DS_THEMES: DsTheme[] = [
  {
    key: "none",
    name: "No theme",
    tokens: "None yet: greys, system type, square corners.",
    components: "Raw and whitelabel. They work, but say nothing.",
    screens: "A wireframe sign-up.",
    feel: "Neutral. Nothing to feel yet.",
    colour: {
      bg: "#ffffff",
      surface: "#ffffff",
      text: "#3d3d3d",
      muted: "#6b6b6b",
      border: "#9b9b9b",
      action: "#e4e4e4",
      onAction: "#2e2e2e",
      accent: "#eeeeee",
      onAccent: "#4a4a4a",
    },
    radius: "0px",
    buttonRadius: "0px",
    borderWidth: "1px",
    shadow: "none",
    fontHead: '"Helvetica Neue", Arial, sans-serif',
    fontBody: '"Helvetica Neue", Arial, sans-serif',
    fontLabel: '"Helvetica Neue", Arial, sans-serif',
    headWeight: 400,
    bodyWeight: 400,
    rond: 0,
  },
  {
    key: "inset",
    name: "Inset",
    tokens: "Paper and ink, Geist Serif with Allo, soft 13px corners.",
    components: "Ink pill buttons, quiet inputs, a soft tag.",
    screens: "A calm, editorial sign-up.",
    feel: "Warm and editorial.",
    colour: {
      bg: "#f6f4ef",
      surface: "#ffffff",
      text: "#17171a",
      muted: "#55534d",
      border: "#e4e1d9",
      action: "#17171a",
      onAction: "#f6f4ef",
      accent: "#e6e9ff",
      onAccent: "#2a37c9",
    },
    radius: "13px",
    buttonRadius: "999px",
    borderWidth: "1px",
    shadow: "0 1px 2px rgba(23,23,26,.06), 0 12px 28px -14px rgba(23,23,26,.25)",
    fontHead: "var(--font-geist-serif), serif",
    fontBody: '"Allo", system-ui, sans-serif',
    fontLabel: '"Allo", system-ui, sans-serif',
    headWeight: 400,
    bodyWeight: 400,
    rond: 45,
  },
  {
    key: "metamap",
    name: "Meta Map",
    tokens: "Graphite, signal orange, Allo Sharp, mono labels, 8px corners.",
    components: "Dark surfaces, ink buttons, an orange signal.",
    screens: "A focused, technical sign-up.",
    feel: "Precise and technical.",
    colour: {
      bg: "#101215",
      surface: "#1a1d22",
      text: "#edf0f4",
      muted: "#ccd2da",
      border: "#2f343c",
      action: "#edf0f4",
      onAction: "#101215",
      accent: "#3a1a14",
      onAccent: "#ffcabd",
    },
    radius: "8px",
    buttonRadius: "6px",
    borderWidth: "1px",
    shadow: "0 1px 2px rgba(0,0,0,.4), 0 10px 26px rgba(0,0,0,.35)",
    fontHead: 'var(--font-allo), "Helvetica Neue", sans-serif',
    fontBody: 'var(--font-allo), "Helvetica Neue", sans-serif',
    fontLabel: "var(--font-plex-mono), ui-monospace, monospace",
    headWeight: 600,
    bodyWeight: 400,
    rond: 0,
  },
  {
    key: "sherbet",
    name: "Sherbet",
    tokens: "Candy pink and plum, round heavy Allo, 22px corners, hard shadows.",
    components: "Chunky, outlined and bouncy.",
    screens: "A loud, playful sign-up.",
    feel: "Loud and playful.",
    colour: {
      bg: "#fff1e4",
      surface: "#ffffff",
      text: "#2b1055",
      muted: "#5b4580",
      border: "#2b1055",
      action: "#d81f69",
      onAction: "#ffffff",
      accent: "#ffd84d",
      onAccent: "#2b1055",
    },
    radius: "22px",
    buttonRadius: "16px",
    borderWidth: "2px",
    shadow: "4px 4px 0 #2b1055",
    fontHead: '"Allo", system-ui, sans-serif',
    fontBody: '"Allo", system-ui, sans-serif',
    fontLabel: '"Allo", system-ui, sans-serif',
    headWeight: 850,
    bodyWeight: 520,
    rond: 100,
  },
];

/** A theme as the CSS variables the specimen's components read. */
export function themeVars(t: DsTheme): CSSProperties {
  const c = t.colour;
  return {
    "--ds-bg": c.bg,
    "--ds-surface": c.surface,
    "--ds-text": c.text,
    "--ds-muted": c.muted,
    "--ds-border": c.border,
    "--ds-action": c.action,
    "--ds-on-action": c.onAction,
    "--ds-accent": c.accent,
    "--ds-on-accent": c.onAccent,
    "--ds-radius": t.radius,
    "--ds-btn-radius": t.buttonRadius,
    "--ds-border-w": t.borderWidth,
    "--ds-shadow": t.shadow,
    "--ds-font-head": t.fontHead,
    "--ds-font-body": t.fontBody,
    "--ds-font-label": t.fontLabel,
    "--ds-head-weight": t.headWeight,
    "--ds-body-weight": t.bodyWeight,
    "--ds-rond": `"ROND" ${t.rond}`,
  } as CSSProperties;
}
