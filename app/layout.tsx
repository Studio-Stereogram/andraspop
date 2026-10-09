import type { Metadata, Viewport } from "next";
import { archivo, plexMono } from "./fonts";
import { themeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "mind-map · András Pop",
  description:
    "An explorable map of everything published while building in public: videos, links, bookmarks and people, connected by meaning.",
};

export const viewport: Viewport = {
  themeColor: "#101215",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
