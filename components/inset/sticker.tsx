// The little shape that stands for an inset in a token or the switcher: filled with the card colour,
// outlined in its ink like a sticker.

import type { StickerShape } from "@/lib/inset/insets";

type Props = { shape: StickerShape; size?: number };

export function Sticker({ shape, size = 22 }: Props) {
  return (
    <svg className="in-sticker" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {shape === "diamond" && <rect x="5.5" y="5.5" width="13" height="13" rx="2.5" transform="rotate(45 12 12)" />}
      {shape === "triangle" && <path d="M12 3.8 L21 19.2 Q21.4 20 20.5 20 H3.5 Q2.6 20 3 19.2 Z" strokeLinejoin="round" />}
      {shape === "circle" && <circle cx="12" cy="12" r="8" />}
      {shape === "square" && <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />}
    </svg>
  );
}
