import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ANDRAS_LOGO_PATH } from "@/components/brand/andras-logo";

// The share card for /hi, rendered once at build time. Colours are the Dark theme's tokens (app/globals.css);
// fonts are the site's Archivo (semi-expanded, 600) and IBM Plex Mono, kept in assets/og (SIL Open Font License).
export const alt = "Say hi: open Wednesday conversations with András Pop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#101215";
const INK = "#EDF0F4";
const INK_2 = "#B2B9C4";
const LINE = "#2F343C";
const HOT = "#E5553A";

const archivo = await readFile(join(process.cwd(), "assets/og/Archivo-SemiBold-SemiExpanded.ttf"));
const plexMono = await readFile(join(process.cwd(), "assets/og/IBMPlexMono-Medium.ttf"));
const photo = `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public/hi/andras.jpg"))).toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: BG,
          backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
          color: INK,
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="44" height="44" viewBox="3 3 249.368 249.367">
            <path fill={INK} fillRule="evenodd" d={ANDRAS_LOGO_PATH} />
          </svg>
          <div style={{ width: 2, height: 32, background: LINE }} />
          <div style={{ fontSize: 30 }}>mind-map</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 132, lineHeight: 1, letterSpacing: "-0.01em" }}>Say hi</div>
          <div style={{ fontSize: 40, lineHeight: 1.25, color: INK_2, maxWidth: 560 }}>
            Three open slots every Wednesday. 45 minutes, no agenda.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Plex Mono", fontSize: 24, color: INK_2 }}>
          <div style={{ width: 12, height: 12, background: HOT }} />
          ANDRASPOP.COM/HI
        </div>
        <img
          src={photo}
          alt=""
          width={400}
          height={500}
          style={{ position: "absolute", right: 80, top: 65, width: 400, height: 500, objectFit: "cover", borderRadius: 20 }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 600, style: "normal" },
        { name: "Plex Mono", data: plexMono, weight: 500, style: "normal" },
      ],
    },
  );
}
