"use client";

import { useEffect, useRef } from "react";
import type { ArtKind } from "@/lib/inset/insets";

// Generative art for the top of an inset card, drawn in the card's ink on its colour.
// Each motif is a small picture of the idea: a lattice a wave cycles through (design cycle),
// lanes carrying different kinds of cargo (multimodal logic), dots that group by proximity (gestalt).
// Animates only while on screen; draws one still frame for reduced motion.

type Props = { kind: ArtKind; ink: string; width: number; height: number; still?: boolean };

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ink: string) => void;

const smooth = (x: number) => x * x * (3 - 2 * x);

const lattice: Draw = (ctx, w, h, t, ink) => {
  const cols = 13;
  const rows = 7;
  const cw = w / cols;
  const ch = h / rows;
  const size = Math.min(cw, ch) * 0.62;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // A wave sweeps left to right and loops: research, planning, execution, again.
      const phase = (c / cols - t * 0.12 + r * 0.015) % 1;
      const p = phase < 0 ? phase + 1 : phase;
      const pulse = p < 0.3 ? smooth(1 - Math.abs(p - 0.15) / 0.15) : 0;
      const s = size * (0.42 + 0.58 * pulse);
      const x = c * cw + cw / 2;
      const y = r * ch + ch / 2;
      ctx.beginPath();
      ctx.moveTo(x, y - s / 2);
      ctx.lineTo(x + s / 2, y);
      ctx.lineTo(x, y + s / 2);
      ctx.lineTo(x - s / 2, y);
      ctx.closePath();
      ctx.globalAlpha = 0.35 + 0.65 * pulse;
      if (pulse > 0.35) ctx.fill();
      else ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
};

const lanes: Draw = (ctx, w, h, t, ink) => {
  const count = 8;
  const gap = h / count;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  for (let i = 0; i < count; i++) {
    const y = i * gap + gap / 2;
    const speed = 10 + ((i * 7) % 5) * 6;
    const kind = i % 3; // 0 text, 1 image, 2 sound
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, y - 0.5, w, 1);
    ctx.globalAlpha = 1;
    const span = 54 + (i % 4) * 10;
    const offset = ((t * speed + i * 37) % span) - span;
    for (let x = offset; x < w + span; x += span) {
      if (kind === 0) {
        ctx.fillRect(x, y - 2, 22, 4);
        ctx.fillRect(x + 26, y - 2, 9, 4);
      } else if (kind === 1) {
        ctx.fillRect(x, y - 5, 10, 10);
        ctx.fillRect(x + 13, y - 5, 10, 10);
      } else {
        ctx.beginPath();
        for (let k = 0; k <= 28; k++) {
          const yy = y + Math.sin(k * 0.7 + t * 3) * 4 * Math.sin((k / 28) * Math.PI);
          if (k === 0) ctx.moveTo(x + k, yy);
          else ctx.lineTo(x + k, yy);
        }
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
};

const gestalt: Draw = (ctx, w, h, t, ink) => {
  const cols = 16;
  const rows = 8;
  const centres = [
    [w * 0.2, h * 0.35],
    [w * 0.52, h * 0.66],
    [w * 0.82, h * 0.3],
  ];
  // Dots drift from an even grid into three groups and back: proximity makes the groups.
  const k = smooth((Math.sin(t * 0.7) + 1) / 2);
  ctx.fillStyle = ink;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const gx = (c + 0.5) * (w / cols);
      const gy = (r + 0.5) * (h / rows);
      const g = (c * 3 + r) % 3;
      const [cx, cy] = centres[g];
      const angle = (c * 12.9898 + r * 78.233) % (Math.PI * 2);
      const radius = 6 + ((c * 31 + r * 17) % 20);
      const tx = cx + Math.cos(angle) * radius * 1.3;
      const ty = cy + Math.sin(angle) * radius * 0.9;
      const x = gx + (tx - gx) * k;
      const y = gy + (ty - gy) * k;
      const s = 1.6 + g * 0.9 * k;
      ctx.globalAlpha = 0.55 + 0.45 * k;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
};

const DRAW: Record<ArtKind, Draw> = { lattice, lanes, gestalt };

export function CardArt({ kind, ink, width, height, still }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const draw = DRAW[kind];
    const paint = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height, t, ink);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    paint(2.2);
    if (still || reduced) return;

    let frame = 0;
    let visible = false;
    const start = performance.now() - 2200;
    const loop = (now: number) => {
      paint((now - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(loop);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [kind, ink, width, height, still]);

  return <canvas ref={ref} aria-hidden style={{ width, height, display: "block" }} />;
}
