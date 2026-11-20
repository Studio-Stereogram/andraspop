import { ViewTransition } from "react";
import { InsetHome } from "@/components/inset/home";
import { Wordmark } from "@/components/inset/wordmark";

export default function InsetHomePage() {
  return (
    <>
      <header className="in-bar">
        <Wordmark />
        <a className="in-bar-link" href="https://andraspop.com">
          andraspop.com
        </a>
      </header>
      <ViewTransition enter="in-page-in" exit="in-page-out" default="none">
        <InsetHome />
      </ViewTransition>
    </>
  );
}
