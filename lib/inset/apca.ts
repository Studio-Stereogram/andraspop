// APCA lightness contrast (Lc), version 0.0.98G-4g, as used for the inset colours.
// Positive Lc: dark text on a light background; negative: light text on dark. Compare with Math.abs.
// Short labels and tags at 13–14px semibold aim for |Lc| >= 75 here (APCA's body-text level), comfortably above
// the 60 that bold labels need.

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
}

const softClamp = (y: number) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);

export function apcaLc(text: string, background: string): number {
  const yt = softClamp(luminance(text));
  const yb = softClamp(luminance(background));
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}
