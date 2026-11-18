// Host routing and the editor's password gate (docs/hosting.md).
// Public host: the read-only map; /edit 404s. Edit host: HTTP Basic Auth, then "/" is served by /edit.
// Server actions re-check the gate themselves (lib/auth.ts): this file is a convenience layer, not the only lock.

import { NextResponse, type NextRequest } from "next/server";
import { isEditHost, isEditorRequest } from "@/lib/gate";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  if (!isEditHost(host)) {
    if (pathname === "/edit" || pathname.startsWith("/edit/")) return new NextResponse("Not found", { status: 404 });
    return NextResponse.next();
  }

  if (!isEditorRequest(host, req.headers.get("authorization"))) {
    return new NextResponse("Password required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="mind-map editor", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  const res = pathname === "/" ? NextResponse.rewrite(new URL("/edit", req.url)) : NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  // Everything except build assets, optimised images and the icons (on the edit host, /hi needs the password too).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
