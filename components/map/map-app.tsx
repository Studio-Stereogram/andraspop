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
} from "@xyflow/react";
import { KIND_LABEL, VIEWS } from "@/lib/map/constants";
import { displayTitle } from "@/lib/map/format";
import { computeLayout, layoutBounds, type Sized } from "@/lib/map/layouts";
import type { MapData, Rect, View } from "@/lib/map/types";
import { applyFilters, type Filters, NO_FILTERS, neighbourMap } from "@/lib/map/visibility";
import { cn } from "@/lib/utils";
import { AppBar } from "./app-bar";
import { EdgeMarkers, edgeTypes, type FlowEdge } from "./edges";
import { FiltersPopover } from "./filters-popover";
import { Inspector } from "./inspector";
import { LayoutBackground } from "./layout-background";
import { MapVisualContext, type MapVisual } from "./map-context";
import { type FlowNode, nodeTypes } from "./nodes";
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

function toFlowNodes(map: MapData): FlowNode[] {
  return map.nodes.map((n) => ({
    id: n.id,
    type: "entry",
    position: { x: n.fx, y: n.fy },
    data: { node: n },
    ariaLabel: `${KIND_LABEL[n.type]}: ${displayTitle(n)}`,
  }));
}

export function MapApp({ map }: { map: MapData }) {
  return (
    <ReactFlowProvider>
      <MapShell map={map} />
    </ReactFlowProvider>
  );
}

function MapShell({ map }: { map: MapData }) {
  const rf = useReactFlow<FlowNode, FlowEdge>();
  const stageRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const fontsReady = useFontsReady();
  const { toast, el: toastEl } = useToast();

  const [view, setView] = useState<View>("free");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const initialNodes = useMemo(() => toFlowNodes(map), [map]);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes);
  // The first layout is placed and fitted without animation; until then the canvas stays invisible.
  const [placed, setPlaced] = useState(false);
  const fitRequest = useRef<"instant" | "animate" | null>("instant");

  const topicById = useMemo(() => new Map(map.topics.map((t) => [t.id, t])), [map.topics]);
  const nodeById = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map.nodes]);
  const neighbours = useMemo(() => neighbourMap(map.edges), [map.edges]);
  const vis = useMemo(() => applyFilters(map.nodes, filters), [map.nodes, filters]);
  const selectedId = nodes.find((n) => n.selected)?.id ?? null;
  const selected = selectedId ? nodeById.get(selectedId) : undefined;

  const visual = useMemo<MapVisual>(
    () => ({
      topicById,
      selectedId,
      neighbours: new Set(selectedId ? (neighbours.get(selectedId) ?? []) : []),
      dim: vis.dim,
      topicFilter: filters.topics,
    }),
    [topicById, selectedId, neighbours, vis.dim, filters.topics],
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
      fitTo(layout.bounds, !instant);
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
  }, [layout, reduced, rf, setNodes, fitTo]);

  const changeView = useCallback(
    (v: View) => {
      if (v === view) return;
      fitRequest.current = "animate";
      setView(v);
    },
    [view],
  );

  const select = useCallback(
    (id: string | null) => setNodes((ns) => ns.map((n) => (!!n.selected === (n.id === id) ? n : { ...n, selected: n.id === id }))),
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

  // Keyboard: 1 2 3 views, F fits, Esc closes the top-most layer (the filters popover handles its own Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, textarea, select, [contenteditable]") || e.altKey || e.metaKey || e.ctrlKey) return;
      const v = VIEWS.find((x) => x.key === e.key);
      if (v) changeView(v.id);
      else if (e.key.toLowerCase() === "f") fitTo(layout?.bounds ?? null, !reduced);
      else if (e.key === "Escape" && !filtersOpen) select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeView, fitTo, layout, reduced, filtersOpen, select]);

  const zoomBy = (factor: number) => {
    const a = visibleArea();
    zoomAt(rf.getZoom() * factor, (a.left + a.right) / 2, (a.top + a.bottom) / 2);
  };

  return (
    <MapVisualContext.Provider value={visual}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <AppBar view={view} onView={changeView} />
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
          </div>

          <ReactFlow<FlowNode, FlowEdge>
            className={cn("mm-canvas mm-public transition-opacity duration-150", !placed && "opacity-0")}
            aria-label="Content map"
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            edgesReconnectable={false}
            selectNodesOnDrag={false}
            multiSelectionKeyCode={null}
            selectionKeyCode={null}
            deleteKeyCode={null}
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
            <EdgeMarkers />
          </ReactFlow>

          <ZoomControls onZoom={zoomBy} onFit={() => fitTo(layout?.bounds ?? null, !reduced)} />

          {selected && (
            <Inspector
              ref={inspectorRef}
              node={selected}
              map={map}
              topicById={topicById}
              onClose={() => select(null)}
              onGo={(id) => {
                select(id);
                centerOn(id);
              }}
              onTopic={(id) => {
                setFilters((f) => ({ ...f, topics: new Set([id]) }));
                toast(`Filtered to ${topicById.get(id)?.name ?? "topic"}`);
              }}
            />
          )}
        </main>
        {toastEl}
      </div>
    </MapVisualContext.Provider>
  );
}
