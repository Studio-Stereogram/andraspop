import { insetPath } from "@/lib/inset/routing";
import { InsetLink } from "./inset-link";

// "inset" in Geist Serif; the dot on the i turns into a heart on hover (the font's ELSH axis).

export function Wordmark({ back }: { back?: boolean }) {
  return (
    <InsetLink href={insetPath()} className="in-wordmark in-serif" transitionTypes={back ? ["nav-home"] : undefined}>
      inset
    </InsetLink>
  );
}
