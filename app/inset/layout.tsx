import type { Metadata } from "next";
import { GeistSerif } from "geist/font/serif/variable";
import "allo-font";
import "./inset.css";

// inset.andraspop.com (served from /inset by proxy.ts). Its own look, separate from the map:
// Allo (the full variable font from allo-font, roundness 60) with Geist Serif for titles, on paper.

export const metadata: Metadata = {
  metadataBase: new URL("https://inset.andraspop.com"),
  title: { default: "inset · András Pop", template: "%s · inset" },
  description: "Small maps of process, logic and form: notions drawn small enough to hold, one idea per inset.",
  alternates: { canonical: "/" },
};

export default function InsetLayout({ children }: LayoutProps<"/inset">) {
  return <div className={`inset-root ${GeistSerif.variable}`}>{children}</div>;
}
