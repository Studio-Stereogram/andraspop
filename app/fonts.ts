import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";

// Allo Sharp (Allo by Josh Puckett, SIL OFL: public/hi/fonts/Allo-OFL.txt), the same file the /hi page uses.
// Variable: wght 100–900 and opsz 9–32 (font-optical-sizing: auto picks the text or display cut by size).
// No width axis, so the display role gets its character from weight and tight tracking instead of width.
export const allo = localFont({
  src: "../public/hi/fonts/AlloSharp.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-allo",
  display: "swap",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
