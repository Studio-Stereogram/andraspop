"use client";

import { useState, type CSSProperties, type Ref } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toggleVariants } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CONTINUITY_KINDS,
  EDGE_TYPE_LABEL,
  KIND_LABEL,
  PLATFORMS,
  REFERENCE_KINDS,
  STATUS_LABEL,
} from "@/lib/map/constants";
import { newEdgeId, newNode, referenceKind, todayIso } from "@/lib/map/edit";
import { displayTitle, handleOf, hostOf, isXUrl } from "@/lib/map/format";
import type { EdgeKind, EdgeType, MapData, MapNode, NodeType, Platform, Status, Topic } from "@/lib/map/types";
import { PortGlyph } from "../pieces";
import type { EditorApi } from "./use-editor";

const STATUS_DOT: Record<Status, string> = {
  idea: "var(--st-idea)",
  draft: "var(--st-draft)",
  scheduled: "var(--st-sched)",
  published: "var(--st-pub)",
};

function Connections({ node, map, ed, onGo }: { node: MapNode; map: MapData; ed: EditorApi; onGo: (id: string) => void }) {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const group = (type: EdgeType) => {
    const kinds: Record<string, string> = type === "continuity" ? CONTINUITY_KINDS : REFERENCE_KINDS;
    const rows = map.edges
      .filter((e) => e.type === type && (e.from === node.id || e.to === node.id))
      .map((e) => ({ e, out: e.from === node.id, other: byId.get(e.from === node.id ? e.to : e.from) }))
      .filter((r): r is typeof r & { other: MapNode } => Boolean(r.other));
    return (
      <div key={type} className="grid gap-2">
        <span className="lbl flex items-center gap-2">
          <PortGlyph type={type} />
          {EDGE_TYPE_LABEL[type]}
        </span>
        {rows.length === 0 && (
          <p className="m-0 text-[13px] text-ink-3">
            {type === "continuity"
              ? "Drag the ● on the right edge to the next item in a series."
              : "Drag the ◆ on the bottom edge to a related item."}
          </p>
        )}
        {rows.map(({ e, out, other }) => (
          <div key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
            <span className="w-8 font-mono text-[11px] font-medium text-ink-3">
              {type === "continuity" ? (out ? "next" : "prev") : out ? "→" : "←"}
            </span>
            <button
              type="button"
              className="truncate text-left text-[13.5px] font-medium text-ink hover:underline hover:underline-offset-3"
              onClick={() => onGo(other.id)}
            >
              {displayTitle(other)}
            </button>
            <Select
              aria-label="Relation"
              className="h-7 w-auto px-1.5 text-[12px]"
              value={e.kind}
              onChange={(ev) => ed.updateEdge(e.id, { kind: ev.target.value as EdgeKind })}
            >
              {Object.entries(kinds).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
            <Button variant="ghost" size="icon-sm" aria-label="Remove connection" onClick={() => ed.removeEdge(e.id)}>
              <X />
            </Button>
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="grid gap-4">
      {group("continuity")}
      {group("reference")}
    </div>
  );
}

function Attach({ node, ed, toast }: { node: MapNode; ed: EditorApi; toast: (m: string) => void }) {
  const [type, setType] = useState<NodeType>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const attach = () => {
    const t = title.trim(),
      u = url.trim();
    if (!t && !u) return toast("Add a title or a URL to attach");
    const extra: Partial<MapNode> = { title: t || hostOf(u), url: u, topics: node.topics.slice(0, 1) };
    if (type === "person" && isXUrl(u)) extra.handle = handleOf({ handle: "", url: u });
    const m = newNode(type, { x: node.fx + 360, y: node.fy + 120 }, extra);
    ed.addNode(m, { id: newEdgeId(), from: node.id, to: m.id, type: "reference", kind: referenceKind(node, m) });
    setTitle("");
    setUrl("");
    toast(`${KIND_LABEL[type]} attached`);
  };
  return (
    <div className="grid gap-2 rounded-lg border border-line bg-surface-2 p-3">
      <span className="lbl">Attach to this {KIND_LABEL[node.type].toLowerCase()}</span>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <Select aria-label="Attachment type" className="w-auto" value={type} onChange={(e) => setType(e.target.value as NodeType)}>
          <option value="link">Link / artifact</option>
          <option value="bookmark">Bookmark</option>
          <option value="person">Person</option>
        </Select>
        <Input aria-label="Title or name" placeholder="Title or name" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <Input
        aria-label="URL"
        placeholder="https://"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && attach()}
      />
      <Button variant="secondary" className="justify-self-start" onClick={attach}>
        <Plus />
        Attach
      </Button>
    </div>
  );
}

/**
 * The editing inspector (editor domain, Edit mode): every field, status, topics, connections with their relation,
 * attach, delete with an inline confirm. Changes show at once and save 600ms after the last keystroke.
 * `derived` holds what the video's link fills in (title, date…): shown as placeholders, never saved.
 */
export function InspectorEdit({
  ref,
  node,
  derived,
  map,
  ed,
  onClose,
  onGo,
  toast,
}: {
  ref: Ref<HTMLElement>;
  node: MapNode;
  derived: Partial<MapNode>;
  map: MapData;
  ed: EditorApi;
  onClose: () => void;
  onGo: (id: string) => void;
  toast: (m: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const isVideo = node.type === "video",
    isPerson = node.type === "person";
  const set = (patch: Partial<MapNode>, now = false) => ed.updateNode(node.id, patch, now);
  const text = (field: "title" | "summary" | "url" | "handle" | "duration" | "date") => ({
    value: node[field],
    onChange: (e: { target: { value: string } }) => set({ [field]: e.target.value }),
  });
  const toggleTopic = (id: string) =>
    set({ topics: node.topics.includes(id) ? node.topics.filter((t) => t !== id) : [...node.topics, id] }, true);
  const addTopic = () => {
    const name = newTopic.trim();
    if (!name) return;
    const t: Topic = ed.ensureTopic(name);
    if (!node.topics.includes(t.id)) set({ topics: [...node.topics, t.id] }, true);
    setNewTopic("");
  };

  return (
    <aside
      ref={ref}
      aria-label="Inspector"
      className="absolute top-3 right-3 bottom-3 z-[3] flex w-[352px] flex-col overflow-auto rounded-[var(--r-panel)] border border-line bg-surface shadow-[var(--shadow)] max-[900px]:inset-x-0 max-[900px]:top-auto max-[900px]:bottom-0 max-[900px]:max-h-[62%] max-[900px]:w-auto max-[900px]:rounded-t-xl max-[900px]:rounded-b-none"
    >
      <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-line bg-surface py-2.5 pr-2.5 pl-4">
        <span className="lbl">{KIND_LABEL[node.type]}</span>
        <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose} aria-label="Close inspector">
          <X />
        </Button>
      </div>

      <div className="grid gap-4 p-4">
        <Field label={isPerson ? "Name" : "Title"}>
          <Input
            id="f-title"
            placeholder={derived.title || (isPerson ? "Who is it?" : "What is it called?")}
            {...text("title")}
          />
        </Field>

        {isVideo && (
          <div className="grid gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-2">Status</span>
            <ToggleGroup
              type="single"
              aria-label="Status"
              value={node.status ?? "draft"}
              onValueChange={(v) => {
                if (!v) return;
                const status = v as Status;
                set({ status, ...(status === "published" && !node.date && !derived.date ? { date: todayIso() } : {}) }, true);
              }}
              className="w-full"
            >
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <ToggleGroupItem key={s} value={s} className="flex-1 justify-center px-1.5 text-[12.5px]">
                  <span aria-hidden className="size-1.5 rounded-full" style={{ background: STATUS_DOT[s] }} />
                  {STATUS_LABEL[s]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}

        {isPerson ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="X handle">
                <Input placeholder="@handle" {...text("handle")} />
              </Field>
              <Field label="Website">
                <Input placeholder="https://" {...text("url")} />
              </Field>
            </div>
            <Field label="Why they matter">
              <Textarea placeholder="What you take from their work." {...text("summary")} />
            </Field>
          </>
        ) : (
          <>
            {isVideo && (
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Platform">
                  <Select
                    value={node.platform ?? ""}
                    onChange={(e) => set({ platform: (e.target.value || null) as Platform | null }, true)}
                  >
                    <option value="">Not decided</option>
                    {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                      <option key={p} value={p}>
                        {PLATFORMS[p].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Duration">
                  <Input placeholder={derived.duration || "12:40"} {...text("duration")} />
                </Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={isVideo ? "Publish date" : "Added"}>
                <Input type="date" {...text("date")} />
              </Field>
              <Field label="URL">
                <Input placeholder="https://" {...text("url")} />
              </Field>
            </div>
            {isVideo && derived.date && !node.date && (
              <p className="-mt-2 m-0 text-[12.5px] text-ink-3">Date from the link: {derived.date}</p>
            )}
            <Field label={isVideo ? "The take" : "Why it matters"}>
              <Textarea placeholder="One to three sentences visitors will read." {...text("summary")} />
            </Field>
          </>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-ink-2">
          <Checkbox checked={node.private} onChange={(e) => set({ private: e.target.checked }, true)} />
          Hide from public view
        </label>

        <div className="grid gap-2">
          <span className="text-[12.5px] font-medium text-ink-2">Topics</span>
          <div className="flex flex-wrap gap-1.5">
            {map.topics.map((t) => (
              <button
                key={t.id}
                type="button"
                className={toggleVariants({ dot: true })}
                style={{ "--tc": t.color } as CSSProperties}
                aria-pressed={node.topics.includes(t.id)}
                data-state={node.topics.includes(t.id) ? "on" : "off"}
                onClick={() => toggleTopic(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
          <Input
            aria-label="New topic"
            placeholder="New topic, then Enter"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTopic()}
          />
        </div>

        <div className="border-t border-line" />
        <Connections node={node} map={map} ed={ed} onGo={onGo} />
        <Attach node={node} ed={ed} toast={toast} />

        <div className="border-t border-line" />
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-[13px] text-ink-2">Delete this entry and its connections?</span>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              className="border-hot bg-hot text-white hover:bg-hot/90"
              onClick={() => {
                ed.removeNode(node.id);
                onClose();
                toast("Deleted");
              }}
            >
              Delete
            </Button>
          </div>
        ) : (
          <Button variant="destructive" className="justify-self-start" onClick={() => setConfirmDelete(true)}>
            Delete entry
          </Button>
        )}
      </div>
    </aside>
  );
}
