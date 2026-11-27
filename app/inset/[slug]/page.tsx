import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { DesignCycle } from "@/components/inset/design-cycle";
import { DesignSystems } from "@/components/inset/design-systems";
import { InProgress } from "@/components/inset/in-progress";
import { ShapeOfInformation } from "@/components/inset/shape-of-information";
import { Switcher } from "@/components/inset/switcher";
import { VehicleForLogic } from "@/components/inset/vehicle-for-logic";
import { Wordmark } from "@/components/inset/wordmark";
import { INSETS, getInset } from "@/lib/inset/insets";

export function generateStaticParams() {
  return INSETS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/inset/[slug]">): Promise<Metadata> {
  const inset = getInset((await params).slug);
  if (!inset) return {};
  return { title: inset.title, description: inset.summary, alternates: { canonical: `/${inset.slug}` } };
}

const PIECES: Record<string, () => React.ReactNode> = {
  "design-cycle": () => <DesignCycle />,
  "vehicle-for-logic": () => <VehicleForLogic />,
  "shape-of-information": () => <ShapeOfInformation />,
  "design-systems": () => <DesignSystems />,
};

export default async function InsetPage({ params }: PageProps<"/inset/[slug]">) {
  const inset = getInset((await params).slug);
  if (!inset) notFound();
  const piece = PIECES[inset.slug];

  return (
    <>
      <header className="in-bar">
        <Switcher current={inset} />
        <Wordmark back />
      </header>
      <ViewTransition
        key={inset.slug}
        enter={{ "nav-forward": "in-slide-left", "nav-back": "in-slide-right", default: "in-page-in" }}
        exit={{ "nav-forward": "in-slide-left", "nav-back": "in-slide-right", default: "in-page-out" }}
        default="none"
      >
        <main className="in-page">{piece ? piece() : <InProgress inset={inset} />}</main>
      </ViewTransition>
    </>
  );
}
