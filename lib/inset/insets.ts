// The insets: small, standalone pieces that each explain one idea (inset.andraspop.com).
// Pure data and helpers, shared by the home fan, the switcher and each inset's page.

import type { CSSProperties } from "react";

export type ArtKind = "lattice" | "lanes" | "gestalt";
export type InsetStatus = "live" | "in-progress";

export type Inset = {
  slug: string;
  title: string;
  /** Card title with a forced line break, as the card sets it. */
  cardTitle: string;
  /** One line for the switcher and page meta. */
  summary: string;
  /** The word that stands for it in the home headline, with its sticker shape. */
  token: { word: string; shape: "diamond" | "triangle" | "circle" };
  /** Card fill and the ink drawn on it. */
  color: string;
  ink: string;
  /** A pale tint of the colour for hover fills on the page. */
  tint: string;
  art: ArtKind;
  status: InsetStatus;
  /** Topics the piece will cover, shown while it is in progress. */
  notes?: string[];
};

export const INSETS: Inset[] = [
  {
    slug: "design-cycle",
    title: "Design cycle",
    cardTitle: "Design\ncycle",
    summary: "How work moves from ambiguity to execution.",
    token: { word: "process", shape: "diamond" },
    color: "#3346FF",
    ink: "#E4E8FF",
    tint: "#E6E9FF",
    art: "lattice",
    status: "live",
  },
  {
    slug: "vehicle-for-logic",
    title: "A vehicle for logic",
    cardTitle: "A vehicle\nfor logic",
    summary: "Multimodal artifacts from LLMs, and what each one is worth.",
    token: { word: "logic", shape: "triangle" },
    color: "#FFD23F",
    ink: "#3D2E00",
    tint: "#FFF4C8",
    art: "lanes",
    status: "in-progress",
    notes: ["Multimodal artifacts", "Value index", "Text, image, sound, code"],
  },
  {
    slug: "shape-of-information",
    title: "The shape of information",
    cardTitle: "The shape of\ninformation",
    summary: "How web anatomy and gestalt shape the message you deliver.",
    token: { word: "form", shape: "circle" },
    color: "#FF8FB8",
    ink: "#5C0B2E",
    tint: "#FFE3EE",
    art: "gestalt",
    status: "in-progress",
    notes: ["Web anatomy", "Visual hierarchy", "Gestalt"],
  },
];

export function getInset(slug: string): Inset | undefined {
  return INSETS.find((inset) => inset.slug === slug);
}

export function insetIndex(slug: string): number {
  return INSETS.findIndex((inset) => inset.slug === slug);
}

/** "nav-forward" when moving to a later inset, "nav-back" to an earlier one: the page slides that way. */
export function directionBetween(from: string, to: string): "nav-forward" | "nav-back" {
  return insetIndex(to) >= insetIndex(from) ? "nav-forward" : "nav-back";
}

/** The card colours as CSS variables, for anything drawn in an inset's colour. */
export function cardStyle(inset: Inset): CSSProperties {
  return { "--card": inset.color, "--card-ink": inset.ink, "--card-tint": inset.tint } as CSSProperties;
}
