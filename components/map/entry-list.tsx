import { KIND_LABEL, PLATFORMS } from "@/lib/map/constants";
import { formatDate, safeHref } from "@/lib/map/format";
import type { MapData } from "@/lib/map/types";

/**
 * Every visible entry as a plain list of titles and links, rendered on the server. Screen readers and search
 * engines get the content without the canvas; sighted visitors use the map. Keyboard users who tab past the
 * canvas reach it too, so it shows itself as a panel while it has focus.
 */
export function EntryList({ map }: { map: MapData }) {
  return (
    <section
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:inset-x-3 focus-within:bottom-3 focus-within:z-50 focus-within:max-h-[50dvh] focus-within:overflow-auto focus-within:rounded-[var(--r-panel)] focus-within:border focus-within:border-line-2 focus-within:bg-surface focus-within:p-4 focus-within:shadow-[var(--shadow-pop)] [&_a]:text-ink [&_a]:underline-offset-3 [&_li]:py-1 [&_p]:m-0 [&_p]:text-[13px] [&_p]:text-ink-3"
      aria-labelledby="entries-title"
    >
      <h1 id="entries-title" className="lbl mb-2">
        mind-map: everything András publishes while building in public
      </h1>
      <ul>
        {map.nodes.map((n) => {
          const href = safeHref(n.url);
          const kind = n.type === "video" && n.platform ? `Video on ${PLATFORMS[n.platform].label}` : KIND_LABEL[n.type];
          return (
            <li key={n.id}>
              {href ? <a href={href}>{n.title || "Untitled"}</a> : n.title || "Untitled"}
              {` (${kind}${n.date ? `, ${formatDate(n.date)}` : ""})`}
              {n.summary && <p>{n.summary}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
