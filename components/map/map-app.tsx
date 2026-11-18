"use client";

import "@xyflow/react/dist/base.css";
import "./canvas.css";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type OnConnectEnd,
  type OnConnectStart,
} from "@xyflow/react";
import { LayoutGrid, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EDGE_KIND_LABEL, NODE_WIDTH, VIEWS } from "@/lib/map/constants";
import { canConnect, kindFor, newEdgeId, newNode } from "@/lib/map/edit";
import { displayTitle, kindLabel } from "@/lib/map/format";
import { distanceToRect } from "@/lib/map/geometry";
import { computeLayout, layoutBounds, type Sized } from "@/lib/map/layouts";
import { tidy } from "@/lib/map/tidy";
import { withDerived, type Derived, type EdgeType, type MapData, type MapNode, type NodeType, type Rect, type View, type XY } from "@/lib/map/types";
import { todayViewport } from "@/lib/map/viewport";
import { applyFilters, type Filters, NO_FILTERS, neighbourMap, toPublicMap } from "@/lib/map/visibility";
import { cn } from "@/lib/utils";
import { AppBar, type Mode } from "./app-bar";
import { ConnectionLine, paneToFlow, rectOf, SNAP_PX, SnapContext, type Snap } from "./editor/connect";
import { DataDialog } from "./editor/data-dialog";
import { Dock, QuickAdd } from "./editor/dock";
import { InspectorEdit } from "./editor/inspector-edit";
import { useEditor } from "./editor/use-editor";
import { edgeTypes, type FlowEdge } from "./edges";
import { FiltersPopover } from "./filters-popover";
import { Inspector } from "./inspector";
import { LayoutBackground } from "./layout-background";
import { MapVisualContext, type MapVisual } from "./map-context";
import { type FlowNode, nodeTypes } from "./nodes";
import { Overview } from "./overview";
import { ZoomControls } from "./zoom-controls";

// Evaluated once per page load, like the prototype: the Timeline's "Today" line.
const TODAY = new Date().toISOString().slice(0, 10);

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;
const FIT_MAX_ZOOM = 1.1;
const FIT_PAD = 50;
const BOTTOM_ROOM = 60; // keeps fitted content clear of the bottom panels
const LAYOUT_MS = 520;
const VIEW_MS = 420;
const UNDO_TIDY_MS = 8000;
const EMPTY = new Set<string>();
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function subscribeReducedMotion(cb: () => void) {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Layouts depend on title wrapping, so wait for the web fonts before the first one. */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

function useToast() {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMsg({ text, id: Date.now() });
    timer.current = setTimeout(() => setMsg(null), 1900);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const el = (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-30">
      {msg && (
        <div
          key={msg.id}
          className="flex items-center gap-[9px] rounded-lg border border-line-2 bg-surface px-3.5 py-[11px] text-[13px] font-medium text-ink shadow-[var(--shadow)] before:size-1.5 before:bg-hot before:content-['']"
        >
          {msg.text}
        </div>
      )}
    </div>
  );
  return { toast, el };
}

function toFlowNode(n: MapNode): FlowNode {
  return {
    id: n.id,
    type: "entry",
    position: { x: n.fx, y: n.fy },
    data: { node: n },
    ariaLabel: `${kindLabel(n)}: ${displayTitle(n)}`,
  };
}

/** Editor domain only: what the server adds to the raw map. */
export interface EditorProps {
  /** Per video id: what its link fills in where the data is empty (display only). */
  derived: Record<string, Derived>;
  /** The database is connected but empty: offer to import the seed file. */
  needsImport: boolean;
}

export function MapApp({ map, editor }: { map: MapData; editor?: EditorProps }) {
  return (
    <ReactFlowProvider>
      <MapShell initial={map} editor={editor} />
    </ReactFlowProvider>
  );
}

function MapShell({ initial, editor }: { initial: MapData; editor?: EditorProps }) {
  const rf = useReactFlow<FlowNode, FlowEdge>();
  const stageRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const fontsReady = useFontsReady();
  const { toast, el: toastEl } = useToast();

  // The editor's copy of the data; on the public site it never changes.
  const ed = useEditor(initial, toast);
  const isEditor = editor !== undefined;
  const [mode, setMode] = useState<Mode>(isEditor ? "edit" : "public");
  const editing = isEditor && mode === "edit";
  const derived = editor?.derived;
  const shown = useMemo<MapData>(
    () => (derived ? { ...ed.data, nodes: ed.data.nodes.map((n) => withDerived(n, derived[n.id])) } : ed.data),
    [ed.data, derived],
  );
  // Public preview shows exactly what visitors get.
  const map = useMemo(() => (isEditor && mode === "public" ? toPublicMap(shown) : shown), [isEditor, mode, shown]);

  const [view, setView] = useState<View>("free");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(useMemo(() => initial.nodes.map(toFlowNode), [initial]));
  // The first layout is placed and fitted without animation; until then the canvas stays invisible.
  const [placed, setPlaced] = useState(false);
  const fitRequest = useRef<"instant" | "animate" | null>("instant");

  // A selection asked for before React Flow has the node (a just-added entry); applied when it arrives.
  const pendingSelect = useRef<string | null>(null);

  // Keep React Flow's nodes in step with the data: new entries appear, deleted ones go, edits re-render.
  useEffect(() => {
    setNodes((ns) => {
      const byId = new Map(ns.map((n) => [n.id, n]));
      const next = map.nodes.map((n) => {
        const cur = byId.get(n.id);
        if (!cur) return n.id === pendingSelect.current ? { ...toFlowNode(n), selected: true } : toFlowNode(n);
        return cur.data.node === n ? cur : { ...cur, data: { node: n }, ariaLabel: toFlowNode(n).ariaLabel };
      });
      return next.length === ns.length && next.every((n, i) => n === ns[i]) ? ns : next;
    });
  }, [map.nodes, setNodes]);

  const topicById = useMemo(() => new Map(map.topics.map((t) => [t.id, t])), [map.topics]);
  const nodeById = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map.nodes]);
  const neighbours = useMemo(() => neighbourMap(map.edges), [map.edges]);
  const vis = useMemo(() => applyFilters(map.nodes, filters), [map.nodes, filters]);
  const selectedId = nodes.find((n) => n.selected && nodeById.has(n.id))?.id ?? null;
  const selected = selectedId ? nodeById.get(selectedId) : undefined;
  const selectedRaw = selectedId ? ed.data.nodes.find((n) => n.id === selectedId) : undefined;

  // While connecting: entries already linked to the source by the same type fade and can't take the thread.
  const [connecting, setConnecting] = useState<{ from: string; type: EdgeType } | null>(null);
  const noDrop = useMemo(() => {
    if (!connecting) return EMPTY;
    const { from, type } = connecting;
    return new Set(
      map.edges.filter((e) => e.type === type && (e.from === from || e.to === from)).map((e) => (e.from === from ? e.to : e.from)),
    );
  }, [connecting, map.edges]);

  const visual = useMemo<MapVisual>(
    () => ({
      topicById,
      selectedId,
      neighbours: new Set(selectedId ? (neighbours.get(selectedId) ?? []) : []),
      dim: vis.dim,
      topicFilter: filters.topics,
      editing,
      noDrop,
    }),
    [topicById, selectedId, neighbours, vis.dim, filters.topics, editing, noDrop],
  );

  // React Flow sees the node state plus `hidden` from the filters ("Hide non-matching").
  const flowNodes = useMemo(
    () =>
      nodes.map((n) => {
        const hidden = vis.hidden.has(n.id);
        return (n.hidden ?? false) === hidden ? n : { ...n, hidden };
      }),
    [nodes, vis.hidden],
  );

  const flowEdges = useMemo<FlowEdge[]>(
    () =>
      map.edges.map((e) => {
        const hl = selectedId !== null && (e.from === selectedId || e.to === selectedId);
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          sourceHandle: e.type,
          targetHandle: e.type,
          type: "floating",
          zIndex: hl ? 1 : 0,
          hidden: vis.hidden.has(e.from) || vis.hidden.has(e.to),
          data: { type: e.type, kind: e.kind, hl, dim: !hl && (vis.dim.has(e.from) || vis.dim.has(e.to)) },
        };
      }),
    [map.edges, selectedId, vis],
  );

  // Measured sizes, as a string so layouts only recompute when a size changes (not on every animation frame).
  const sizeKey = JSON.stringify(nodes.map((n) => [n.id, n.measured?.width ?? 0, n.measured?.height ?? 0]));
  const sizes = useMemo(
    () => new Map((JSON.parse(sizeKey) as [string, number, number][]).map(([id, w, h]) => [id, { w, h }])),
    [sizeKey],
  );

  const layout = useMemo(() => {
    if (!fontsReady) return null;
    const visible = map.nodes.filter((n) => !vis.hidden.has(n.id));
    if (visible.some((n) => !sizes.get(n.id)?.h)) return null; // wait until React Flow has measured them
    const sized: Sized[] = visible.map((node) => ({ node, ...sizes.get(node.id)! }));
    const l = computeLayout(view, sized, map.edges, map.topics, TODAY);
    return { ...l, sized, bounds: layoutBounds(l, sized) };
  }, [fontsReady, map, vis.hidden, sizes, view]);

  /** The canvas minus the inspector, which covers the right side (or the bottom on small screens). */
  const visibleArea = useCallback(() => {
    const r = stageRef.current!.getBoundingClientRect();
    let right = r.width,
      bottom = r.height;
    const insp = inspectorRef.current;
    if (insp) {
      if (window.innerWidth > 900) right -= insp.offsetWidth + 24;
      else bottom -= insp.offsetHeight;
    }
    return { left: 0, top: 0, right, bottom };
  }, []);

  const fitTo = useCallback(
    (b: Rect | null, animate: boolean) => {
      if (!b || !stageRef.current) return;
      const a = visibleArea();
      const aw = a.right - a.left - FIT_PAD * 2,
        ah = a.bottom - a.top - FIT_PAD * 2 - BOTTOM_ROOM;
      const k = clamp(Math.min(aw / b.w, ah / b.h), MIN_ZOOM, FIT_MAX_ZOOM);
      rf.setViewport(
        { zoom: k, x: a.left + FIT_PAD + (aw - b.w * k) / 2 - b.x * k, y: a.top + FIT_PAD + (ah - b.h * k) / 2 - b.y * k },
        { duration: animate ? VIEW_MS : 0, ease: easeOutCubic },
      );
    },
    [rf, visibleArea],
  );

  /** Timeline: a readable zoom with the Today line in view, rather than the whole history squeezed to fit. */
  const goToday = useCallback(
    (animate: boolean) => {
      const bg = layout?.background;
      if (bg?.type !== "timeline" || !stageRef.current) return;
      rf.setViewport(todayViewport(bg, visibleArea(), FIT_PAD, BOTTOM_ROOM), {
        duration: animate ? VIEW_MS : 0,
        ease: easeOutCubic,
      });
    },
    [layout, rf, visibleArea],
  );

  const viewCenter = useCallback((): XY => {
    const a = visibleArea(),
      v = rf.getViewport();
    return { x: ((a.left + a.right) / 2 - v.x) / v.zoom, y: ((a.top + a.bottom) / 2 - v.y) / v.zoom };
  }, [rf, visibleArea]);

  const centerAt = useCallback(
    (p: XY) => {
      const a = visibleArea(),
        k = rf.getZoom();
      rf.setViewport({ zoom: k, x: (a.left + a.right) / 2 - p.x * k, y: (a.top + a.bottom) / 2 - p.y * k });
    },
    [rf, visibleArea],
  );

  const zoomAt = useCallback(
    (zoom: number, cx: number, cy: number) => {
      const v = rf.getViewport();
      const k = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
      const wx = (cx - v.x) / v.zoom,
        wy = (cy - v.y) / v.zoom;
      rf.setViewport({ zoom: k, x: cx - wx * k, y: cy - wy * k });
    },
    [rf],
  );

  // Move nodes to the layout's positions: tweened 520ms, or instantly the first time and with reduced motion.
  useEffect(() => {
    if (!layout) return;
    const first = fitRequest.current === "instant";
    const instant = first || reduced;
    if (fitRequest.current) {
      if (layout.background?.type === "timeline") goToday(!instant);
      else fitTo(layout.bounds, !instant);
      fitRequest.current = null;
    }
    const from = new Map(rf.getNodes().map((n) => [n.id, n.position]));
    const moving = [...layout.positions].some(([id, p]) => {
      const a = from.get(id);
      return a && (a.x !== p.x || a.y !== p.y);
    });
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = instant ? 1 : Math.min(1, (now - start) / LAYOUT_MS);
      const e = easeInOutCubic(t);
      if (moving)
        setNodes((ns) =>
          ns.map((n) => {
            const a = from.get(n.id),
              b = layout.positions.get(n.id);
            if (!a || !b || (a.x === b.x && a.y === b.y)) return n;
            return { ...n, position: { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e } };
          }),
        );
      if (t < 1) raf = requestAnimationFrame(step);
      else if (first) setPlaced(true);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [layout, reduced, rf, setNodes, fitTo, goToday]);

  const changeView = useCallback(
    (v: View) => {
      if (v === view) return;
      fitRequest.current = "animate";
      setView(v);
    },
    [view],
  );

  const changeMode = useCallback((m: Mode) => {
    fitRequest.current = "animate";
    setMode(m);
  }, []);

  const select = useCallback(
    (id: string | null) => {
      pendingSelect.current = id;
      setNodes((ns) => ns.map((n) => (!!n.selected === (n.id === id) ? n : { ...n, selected: n.id === id })));
    },
    [setNodes],
  );

  const centerOn = useCallback(
    (id: string) => {
      const p = layout?.positions.get(id),
        s = sizes.get(id);
      if (!p || !s) return;
      const a = visibleArea();
      const k = Math.max(rf.getZoom(), 0.8);
      rf.setViewport(
        { zoom: k, x: (a.left + a.right) / 2 - (p.x + s.w / 2) * k, y: (a.top + a.bottom) / 2 - (p.y + s.h / 2) * k },
        { duration: reduced ? 0 : VIEW_MS, ease: easeOutCubic },
      );
    },
    [layout, sizes, visibleArea, rf, reduced],
  );

  // ---------- editing ----------

  const focusTitle = () => setTimeout(() => document.getElementById("f-title")?.focus(), 40);

  /** Dock: a new entry at the centre of the view, selected, with the title field focused. */
  const addAtCenter = useCallback(
    (type: NodeType) => {
      const c = viewCenter();
      const n = newNode(type, { x: c.x - NODE_WIDTH[type] / 2, y: c.y - 80 });
      ed.addNode(n);
      select(n.id);
      focusTitle();
    },
    [ed, select, viewCenter],
  );

  const snap = useCallback<Snap>(
    (fromId, type, pointer) => {
      const zoom = rf.getZoom();
      const linked = new Set(
        map.edges.filter((e) => e.type === type && (e.from === fromId || e.to === fromId)).map((e) => (e.from === fromId ? e.to : e.from)),
      );
      let best: ReturnType<Snap> = null,
        bd = Infinity;
      for (const n of map.nodes) {
        if (n.id === fromId || linked.has(n.id) || vis.hidden.has(n.id)) continue;
        const inode = rf.getInternalNode(n.id);
        if (!inode?.measured.width) continue;
        const d = distanceToRect(pointer, rectOf(inode)) * zoom;
        if (d < bd) {
          bd = d;
          best = inode;
        }
      }
      return bd <= SNAP_PX ? best : null;
    },
    [rf, map.edges, map.nodes, vis.hidden],
  );

  const [quick, setQuick] = useState<{ from: string; type: EdgeType; screen: XY; world: XY } | null>(null);

  const onConnectStart = useCallback<OnConnectStart>((_, { nodeId, handleId }) => {
    if (nodeId && (handleId === "continuity" || handleId === "reference")) setConnecting({ from: nodeId, type: handleId });
  }, []);

  const onConnectEnd = useCallback<OnConnectEnd>(
    (event, state) => {
      setConnecting(null);
      if (!state.fromNode || !state.fromHandle || !state.pointer) return;
      const type = state.fromHandle.id as EdgeType;
      const from = nodeById.get(state.fromNode.id);
      if (!from) return;
      const v = rf.getViewport();
      const pointer = paneToFlow(state.pointer, v.x, v.y, v.zoom);
      const target = snap(from.id, type, pointer);
      if (target && canConnect(ed.data.edges, from.id, target.id, type)) {
        const kind = kindFor(type, from, target.data.node);
        ed.addEdge({ id: newEdgeId(), from: from.id, to: target.id, type, kind });
        select(from.id);
        toast(`Connected · ${EDGE_KIND_LABEL[kind]}`);
        return;
      }
      // Released on empty canvas, far enough from the card: offer a new, already connected entry.
      const pt = "changedTouches" in event ? event.changedTouches[0] : event;
      const r = stageRef.current!.getBoundingClientRect();
      const screen = { x: pt.clientX - r.left, y: pt.clientY - r.top };
      const fromRect = rectOf(state.fromNode);
      if (distanceToRect(pointer, fromRect) * v.zoom > 30)
        setQuick({
          from: from.id,
          type,
          screen: { x: Math.min(screen.x + 10, r.width - 202), y: Math.min(screen.y + 10, r.height - 230) },
          world: pointer,
        });
    },
    [snap, nodeById, ed, select, toast, rf],
  );

  const quickAdd = (t: NodeType) => {
    if (!quick) return;
    const from = nodeById.get(quick.from);
    setQuick(null);
    if (!from) return;
    const n = newNode(t, { x: quick.world.x, y: quick.world.y - 20 }, { topics: from.topics.slice(0, 1) });
    ed.addNode(n, { id: newEdgeId(), from: from.id, to: n.id, type: quick.type, kind: kindFor(quick.type, from, n) });
    select(n.id);
    focusTitle();
  };

  // Tidy (Freeform, Edit mode): one press tidies, the same button undoes for 8 seconds (also T and Cmd/Ctrl+Z).
  const [undoTidy, setUndoTidy] = useState<Map<string, XY> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const canTidy = editing && view === "free";
  const runTidy = useCallback(() => {
    if (!canTidy || !layout || layout.sized.length < 2) return;
    const items = layout.sized.map(({ node, w, h }) => ({ id: node.id, x: node.fx, y: node.fy, w, h }));
    const out = tidy(items);
    if (items.every((i) => out.get(i.id)!.x === i.x && out.get(i.id)!.y === i.y)) return toast("Already tidy");
    setUndoTidy(new Map(items.map((i) => [i.id, { x: i.x, y: i.y }])));
    ed.setPositions(out);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoTidy(null), UNDO_TIDY_MS);
  }, [canTidy, layout, ed, toast]);
  const revertTidy = useCallback(() => {
    if (!undoTidy) return;
    ed.setPositions(undoTidy);
    setUndoTidy(null);
    clearTimeout(undoTimer.current);
    toast("Tidy undone");
  }, [undoTidy, ed, toast]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);

  // ---------- input ----------

  // A mouse wheel zooms around the pointer; trackpad scrolling pans and pinch zooms (React Flow handles those).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
      if (!mouseWheel || e.ctrlKey || e.metaKey || !(e.target as Element).closest(".react-flow")) return;
      e.preventDefault();
      e.stopPropagation();
      const r = el.getBoundingClientRect();
      zoomAt(rf.getZoom() * Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, [rf, zoomAt]);

  // Keyboard: 1 2 3 views, F fits, T tidies (editor), Esc closes the top-most layer (popover and dialog handle their own).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, textarea, select, [contenteditable]") || e.altKey) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && undoTidy) {
        e.preventDefault();
        return revertTidy();
      }
      if (e.metaKey || e.ctrlKey || dataOpen) return;
      const v = VIEWS.find((x) => x.key === e.key);
      if (v) changeView(v.id);
      else if (e.key.toLowerCase() === "f") fitTo(layout?.bounds ?? null, !reduced);
      else if (e.key.toLowerCase() === "t" && canTidy) {
        if (undoTidy) revertTidy();
        else runTidy();
      }
      else if (e.key === "Escape" && quick) setQuick(null);
      else if (e.key === "Escape" && !filtersOpen) select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeView, fitTo, layout, reduced, filtersOpen, select, undoTidy, revertTidy, runTidy, canTidy, quick, dataOpen]);

  const zoomBy = (factor: number) => {
    const a = visibleArea();
    zoomAt(rf.getZoom() * factor, (a.left + a.right) / 2, (a.top + a.bottom) / 2);
  };

  const onGo = (id: string) => {
    select(id);
    centerOn(id);
  };

  const showImport = editor?.needsImport && ed.data.nodes.length === 0;

  return (
    <MapVisualContext.Provider value={visual}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <AppBar
          view={view}
          onView={changeView}
          editor={isEditor ? { mode, onMode: changeMode, onData: () => setDataOpen(true), saveState: ed.saveState } : undefined}
        />
        <main ref={stageRef} className="relative min-h-0 flex-1">
          <div
            role="toolbar"
            aria-label="Canvas tools"
            className="absolute top-3 left-3 z-[3] flex items-center gap-0.5 rounded-[var(--r-panel)] border border-line bg-surface p-1 shadow-[var(--shadow)]"
          >
            <FiltersPopover
              map={map}
              filters={filters}
              onChange={setFilters}
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              excluded={vis.hidden.size + vis.dim.size}
            />
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-ink"
                disabled={!canTidy}
                onClick={undoTidy ? revertTidy : runTidy}
                title={canTidy ? "Align entries to the grid with equal spacing (T)" : "Tidy works in the Freeform view"}
              >
                {undoTidy ? <Undo2 /> : <LayoutGrid />}
                <span className="max-[640px]:hidden">{undoTidy ? "Undo tidy" : "Tidy"}</span>
              </Button>
            )}
          </div>

          {isEditor && mode === "public" && (
            <div className="pointer-events-none absolute top-3 left-1/2 z-[3] -translate-x-1/2 rounded-full border border-line-2 bg-surface px-3.5 py-1.5 font-mono text-[10.5px] font-medium tracking-[.08em] whitespace-nowrap text-ink-2 uppercase shadow-[var(--shadow)] max-[640px]:hidden">
              Public preview · what visitors see
            </div>
          )}

          <SnapContext.Provider value={snap}>
            <ReactFlow<FlowNode, FlowEdge>
              className={cn(
                "mm-canvas transition-opacity duration-150",
                !editing && "mm-public",
                connecting && `connecting c-${connecting.type}`,
                !placed && "opacity-0",
              )}
              aria-label="Content map"
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              connectionLineComponent={ConnectionLine}
              connectionRadius={0}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              nodesDraggable={editing && view === "free"}
              onNodeDragStop={(_, n) => ed.setPositions(new Map([[n.id, n.position]]))}
              nodesConnectable={editing}
              edgesFocusable={false}
              edgesReconnectable={false}
              selectNodesOnDrag={false}
              multiSelectionKeyCode={null}
              selectionKeyCode={null}
              deleteKeyCode={null}
              onPaneClick={() => setQuick(null)}
              panOnScroll
              zoomOnScroll={false}
              zoomOnPinch
              zoomOnDoubleClick={false}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
            >
              <Background id="minor" variant={BackgroundVariant.Lines} gap={24} lineWidth={1} color="var(--grid)" />
              <Background id="major" variant={BackgroundVariant.Lines} gap={120} lineWidth={1} color="var(--grid-2)" />
              <LayoutBackground background={layout?.background ?? null} />
            </ReactFlow>
          </SnapContext.Provider>

          {placed && layout?.background?.type === "timeline" && layout.bounds && (
            <Overview
              bounds={layout.bounds}
              background={layout.background}
              sized={layout.sized}
              positions={layout.positions}
              viewCenter={viewCenter}
              centerAt={centerAt}
            />
          )}

          <ZoomControls
            onZoom={zoomBy}
            onFit={() => fitTo(layout?.bounds ?? null, !reduced)}
            onToday={layout?.background?.type === "timeline" ? () => goToday(!reduced) : undefined}
          />

          {editing && <Dock onAdd={addAtCenter} />}

          {quick && (
            <QuickAdd at={quick.screen} type={quick.type === "continuity" ? "continuity" : "reference"} onPick={quickAdd} onClose={() => setQuick(null)} />
          )}

          {showImport && (
            <div className="absolute top-1/2 left-1/2 z-[4] grid w-[min(420px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 gap-3 rounded-[var(--r-panel)] border border-line-2 bg-surface p-5 shadow-[var(--shadow-pop)]">
              <span className="lbl">Database</span>
              <p className="m-0 text-[15px] leading-[1.5] text-ink-2">
                The database is connected and empty. Start from the seed file (data/seed.json), or paste your own JSON in
                Data.
              </p>
              <Button
                className="justify-self-start"
                onClick={async () => {
                  const r = await ed.importSeed();
                  if (r.ok) window.location.reload();
                  else toast(`Not imported: ${r.error}`);
                }}
              >
                Import the seed
              </Button>
            </div>
          )}

          {selected &&
            (editing && selectedRaw ? (
              <InspectorEdit
                key={selected.id}
                ref={inspectorRef}
                node={selectedRaw}
                derived={derived?.[selected.id] ?? {}}
                map={ed.data}
                ed={ed}
                onClose={() => select(null)}
                onGo={onGo}
                toast={toast}
              />
            ) : (
              <Inspector
                ref={inspectorRef}
                node={selected}
                map={map}
                topicById={topicById}
                onClose={() => select(null)}
                onGo={onGo}
                onTopic={(id) => {
                  setFilters((f) => ({ ...f, topics: new Set([id]) }));
                  toast(`Filtered to ${topicById.get(id)?.name ?? "topic"}`);
                }}
              />
            ))}
        </main>
        {isEditor && (
          <DataDialog
            open={dataOpen}
            onOpenChange={setDataOpen}
            map={ed.data}
            onImport={async (m) => {
              const r = await ed.replaceAll(m);
              if (!r.ok) return r.error;
              window.location.reload(); // the database gives connections new ids: start from what it holds
              return null;
            }}
          />
        )}
        {toastEl}
      </div>
    </MapVisualContext.Provider>
  );
}
