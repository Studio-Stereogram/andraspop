import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { allo, plexMono } from "./fonts";
import { themeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  // Lets pages give relative URLs for canonical links and share images (e.g. /hi).
  metadataBase: new URL("https://andraspop.com"),
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
    <html lang="en" className={`${allo.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        {/* Vercel Web Analytics: page views and visitors, cookieless. /hi has its own script tag (public/hi/index.html). */}
        <Analytics />
      </body>
    </html>
  );
}
