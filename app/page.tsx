import { Badge } from "@/components/ui/badge";

// Temporary page while the prototype canvas is ported to React Flow (milestone M1).
export default function Home() {
  return (
    <main className="canvas-grid grid min-h-full place-items-center p-6">
      <div className="grid max-w-md gap-4 rounded-[var(--r-panel)] border border-line bg-surface p-6 shadow-[var(--shadow)]">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
            <circle cx="5" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 7h8" stroke="currentColor" strokeWidth="1.5" />
            <rect x="17" y="2" width="9" height="10" fill="var(--hot)" />
          </svg>
          <h1 className="text-[15px] font-[650] tracking-[.01em] uppercase [font-stretch:112%]">Meta Map</h1>
          <Badge tone="draft" className="ml-auto">
            In progress
          </Badge>
        </div>
        <p className="text-ink-2">The map is being ported from the prototype. It lands here with milestone M1.</p>
      </div>
    </main>
  );
}
