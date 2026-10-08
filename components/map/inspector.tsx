"use client";

import type { CSSProperties, Ref } from "react";
import { ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleVariants } from "@/components/ui/toggle";
import { EDGE_KIND_LABEL, EDGE_TYPE_LABEL, KIND_LABEL, PLATFORMS, STATUS_LABEL } from "@/lib/map/constants";
import { formatDate, handleOf, hostOf, isXUrl, personMeta, safeHref } from "@/lib/map/format";
import type { EdgeType, MapData, MapNode, Topic } from "@/lib/map/types";
import { Avatar, PortGlyph, Thumb } from "./pieces";

function Connections({ node, map, onGo }: { node: MapNode; map: MapData; onGo: (id: string) => void }) {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const group = (type: EdgeType) => {
    const rows = map.edges
      .filter((e) => e.type === type && (e.from === node.id || e.to === node.id))
      .map((e) => {
        const out = e.from === node.id;
        return { e, out, other: byId.get(out ? e.to : e.from) };
      })
      .filter((r): r is typeof r & { other: MapNode } => Boolean(r.other));
    if (!rows.length) return null;
    return (
      <div key={type} className="grid gap-2">
        <span className="lbl flex items-center gap-2">
          <PortGlyph type={type} />
          {EDGE_TYPE_LABEL[type]}
        </span>
        {rows.map(({ e, out, other }) => (
          <div key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <span className="font-mono text-[11px] font-medium text-ink-3">
              {type === "continuity" ? (out ? "next" : "prev") : out ? "→" : "←"}
            </span>
            <button
              type="button"
              className="truncate text-left text-[13.5px] font-medium text-ink hover:underline hover:underline-offset-3"
              onClick={() => onGo(other.id)}
            >
              {other.title || "Untitled"}
            </button>
            <span className="font-mono text-[11px] font-medium tracking-[.06em] text-ink-3 uppercase">
              {EDGE_KIND_LABEL[e.kind]}
            </span>
          </div>
        ))}
      </div>
    );
  };
  const groups = [group("continuity"), group("reference")].filter(Boolean);
  if (!groups.length)
    return (
      <div className="grid gap-2">
        <span className="lbl">Connections</span>
        <p className="m-0 text-[13px] text-ink-3">This item stands on its own.</p>
      </div>
    );
  return <div className="grid gap-3">{groups}</div>;
}

function LinkButton({ href, primary, children }: { href: string | null; primary?: boolean; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <Button asChild variant={primary ? "default" : "outline"}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ExternalLink />
      </a>
    </Button>
  );
}

/** Read-only inspector (the public view of an entry). Sheet on the right; bottom sheet under 900px. */
export function Inspector({
  ref,
  node,
  map,
  topicById,
  onClose,
  onGo,
  onTopic,
}: {
  ref: Ref<HTMLElement>;
  node: MapNode;
  map: MapData;
  topicById: ReadonlyMap<string, Topic>;
  onClose: () => void;
  onGo: (id: string) => void;
  onTopic: (id: string) => void;
}) {
  const isVideo = node.type === "video";
  const isPerson = node.type === "person";
  const topics = node.topics.map((id) => topicById.get(id)).filter((t): t is Topic => Boolean(t));
  const handle = isPerson ? handleOf(node) : "";
  const label =
    KIND_LABEL[node.type] + (isVideo && node.platform ? ` · ${PLATFORMS[node.platform].label}` : "");

  return (
    <aside
      ref={ref}
      aria-label="Inspector"
      className="absolute top-3 right-3 bottom-3 z-[3] flex w-[352px] flex-col overflow-auto rounded-[var(--r-panel)] border border-line bg-surface shadow-[var(--shadow)] max-[900px]:inset-x-0 max-[900px]:top-auto max-[900px]:bottom-0 max-[900px]:max-h-[58%] max-[900px]:w-auto max-[900px]:rounded-t-xl max-[900px]:rounded-b-none max-[900px]:pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-line bg-surface py-2.5 pr-2.5 pl-4">
        <span className="lbl">{label}</span>
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose} aria-label="Close inspector">
          <X />
        </Button>
      </div>

      <div className="grid gap-4 p-4">
        {isVideo && <Thumb node={node} topicById={topicById} large />}
        {isPerson && <Avatar node={node} large />}
        <h2 className="m-0 text-[26px] leading-[1.08] font-[650] tracking-[-.01em] text-balance [font-stretch:104%]">
          {node.title || (isPerson ? "Unnamed person" : "Untitled")}
        </h2>
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] font-medium tracking-[.06em] text-ink-3 uppercase">
          {isPerson ? (
            <span className="normal-case">{personMeta(node)}</span>
          ) : (
            <>
              {isVideo && node.status && (
                <Badge tone={node.status} className="tracking-normal normal-case">
                  {STATUS_LABEL[node.status]}
                </Badge>
              )}
              {node.date && <span>{formatDate(node.date)}</span>}
              {!isVideo && node.url && <span>{hostOf(node.url)}</span>}
            </>
          )}
        </div>
        {node.summary && <p className="m-0 max-w-[65ch] text-[15px] leading-[1.55] text-ink-2">{node.summary}</p>}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                className={toggleVariants({ dot: true })}
                style={{ "--tc": t.color } as CSSProperties}
                onClick={() => onTopic(t.id)}
                title={`Show only ${t.name}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 empty:hidden">
          {isPerson ? (
            <>
              {handle && (
                <LinkButton href={`https://x.com/${encodeURIComponent(handle)}`} primary>
                  Follow @{handle}
                </LinkButton>
              )}
              {node.url && !isXUrl(node.url) && (
                <LinkButton href={safeHref(node.url)} primary={!handle}>
                  {hostOf(node.url)}
                </LinkButton>
              )}
            </>
          ) : (
            <LinkButton href={safeHref(node.url)} primary>
              {isVideo && node.platform ? `Watch on ${PLATFORMS[node.platform].label}` : "Open link"}
            </LinkButton>
          )}
        </div>
        <div className="border-t border-line" />
        <Connections node={node} map={map} onGo={onGo} />
      </div>
    </aside>
  );
}
