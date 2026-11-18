"use client";

import { useState } from "react";
import { Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";
import { normalizeMap } from "@/lib/map/normalize";
import type { MapData } from "@/lib/map/types";

/** The JSON format, without app-only fields (views come from the platform, not the data). */
export function exportJson(map: MapData): string {
  const nodes = map.nodes.map((n) => {
    const out = { ...n };
    delete out.views;
    return out;
  });
  return JSON.stringify(
    { topics: map.topics, nodes, edges: map.edges },
    null,
    2,
  );
}

/**
 * Data: the whole map as `{ topics, nodes, edges }` JSON. Copy or download it; paste JSON and import to replace
 * everything (with a confirm step, because it overwrites the database).
 */
export function DataDialog({
  open,
  onOpenChange,
  map,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  map: MapData;
  onImport: (map: MapData) => Promise<string | null>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader
          title="Data"
          description="The whole map as JSON: { topics, nodes, edges }."
        />
        {/* Mounted on open, so the JSON is the map as it is now. */}
        {open && (
          <DataBody
            map={map}
            onImport={onImport}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DataBody({
  map,
  onImport,
  onDone,
}: {
  map: MapData;
  onImport: (map: MapData) => Promise<string | null>;
  onDone: () => void;
}) {
  const [text, setText] = useState(() => exportJson(map));
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied to clipboard.");
    } catch {
      setMsg("Copy was blocked here. Select the text and press Ctrl/Cmd + C.");
    }
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `mind-map-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const parse = (): MapData | null => {
    try {
      return normalizeMap(JSON.parse(text));
    } catch (err) {
      setMsg(
        `Couldn't read it: ${err instanceof Error ? err.message : "invalid JSON"}. Check the JSON and try again.`,
      );
      return null;
    }
  };

  const doImport = async () => {
    const m = parse();
    if (!m) return;
    setBusy(true);
    const error = await onImport(m);
    setBusy(false);
    if (error) setMsg(`Not imported: ${error}`);
    else onDone();
  };

  return (
    <div className="grid min-h-0 gap-3 overflow-auto p-5">
      <Textarea
        aria-label="Map JSON"
        spellCheck={false}
        className="h-[min(52vh,520px)] font-mono text-[12px]"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setConfirm(false);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={copy}>
          <Copy />
          Copy JSON
        </Button>
        <Button variant="outline" onClick={download}>
          <Download />
          Download
        </Button>
        <span className="mx-auto" />
        {confirm ? (
          <>
            <span className="text-[13px] text-ink-2">
              Replace everything with this JSON?
            </span>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              className="border-hot bg-hot text-white hover:bg-hot/90"
              disabled={busy}
              onClick={doImport}
            >
              {busy ? "Importing…" : "Replace"}
            </Button>
          </>
        ) : (
          <Button
            variant="destructive"
            onClick={() => parse() && setConfirm(true)}
          >
            <Upload />
            Import
          </Button>
        )}
      </div>
      <p aria-live="polite" className="m-0 min-h-[18px] text-[13px] text-ink-2">
        {msg}
      </p>
    </div>
  );
}
