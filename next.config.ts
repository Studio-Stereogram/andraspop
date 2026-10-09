import type { NextConfig } from "next";
import { THUMBNAIL_HOSTS } from "./lib/map/links";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Real video thumbnails (YouTube, Instagram's CDN). Same list the Thumb component checks before using one.
    remotePatterns: THUMBNAIL_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname: hostname.replace(/^\*\./, "**.") })),
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
