import { Archivo, IBM_Plex_Mono } from "next/font/google";

// Archivo is variable in weight and width; the display face uses font-stretch 112%, so load the wdth axis too.
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
