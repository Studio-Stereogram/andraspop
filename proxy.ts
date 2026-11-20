// Host routing. Today it only serves inset.andraspop.com from the /inset pages; the editor gate
// (docs/snippets/proxy.ts) joins it in M2. The matcher only runs this for the inset host,
// so the public map never passes through it.

import { NextResponse, type NextRequest } from "next/server";
import { insetRewritePath, isInsetHost } from "@/lib/inset/routing";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (!isInsetHost(host)) return NextResponse.next();
  const target = insetRewritePath(req.nextUrl.pathname);
  if (!target) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|api/|favicon.ico|icon.svg|robots.txt|hi/).*)",
      has: [{ type: "header", key: "host", value: "inset\\..*" }],
    },
  ],
};
