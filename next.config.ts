import type { NextConfig } from "next";
import { THUMBNAIL_HOSTS } from "./lib/map/links";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Real video thumbnails (YouTube, Instagram's CDN). Same list the Thumb component checks before using one.
    remotePatterns: THUMBNAIL_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname: hostname.replace(/^\*\./, "**.") })),
  },
  // /hi is a standalone static page (public/hi/index.html, with its own font, styles and script), outside the app.
  async rewrites() {
    return [{ source: "/hi", destination: "/hi/index.html" }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
