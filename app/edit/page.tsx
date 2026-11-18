import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapApp } from "@/components/map/map-app";
import { assertEditor } from "@/lib/auth";
import { derivedFields } from "@/lib/data/map";
import { editorStore } from "@/lib/data/store";
import type { Derived } from "@/lib/map/types";

export const metadata: Metadata = {
  title: "Editor · mind-map",
  robots: { index: false, follow: false },
};

/**
 * The editor (edit host only; proxy.ts rewrites "/" here after the password prompt). Everything, drafts and private
 * entries included, read fresh on every request through the editor store. The gate is checked again here.
 */
export default function EditPage() {
  return (
    <Suspense fallback={<p className="lbl p-6">Loading the editor…</p>}>
      <Editor />
    </Suspense>
  );
}

async function Editor() {
  try {
    await assertEditor();
  } catch {
    notFound();
  }
  const store = editorStore();
  if (!store)
    return (
      <main className="grid h-dvh place-items-center p-6">
        <div className="grid max-w-[460px] gap-3">
          <span className="lbl">Editor</span>
          <p className="m-0 text-[15px] leading-[1.5] text-ink-2">
            The database isn&apos;t connected. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in Vercel, then
            redeploy.
          </p>
        </div>
      </main>
    );

  let map;
  try {
    map = await store.read();
  } catch (err) {
    console.error("Editor: reading the map failed", err);
    return (
      <main className="grid h-dvh place-items-center p-6">
        <div className="grid max-w-[460px] gap-3">
          <span className="lbl">Editor</span>
          <p className="m-0 text-[15px] leading-[1.5] text-ink-2">
            Couldn&apos;t read the database. If this is the first run, run supabase/schema.sql in the Supabase SQL editor,
            then reload.
          </p>
        </div>
      </main>
    );
  }

  const derived: Record<string, Derived> = Object.fromEntries(
    await Promise.all(map.nodes.map(async (n) => [n.id, await derivedFields(n)] as const)),
  );
  return <MapApp map={map} editor={{ derived, needsImport: store.kind === "supabase" && map.nodes.length === 0 }} />;
}
