// proxy.ts — place at the project root (or in src/).
// Next.js 16+ calls this file proxy.ts with an exported `proxy` function.
// On Next.js 15, name the file middleware.ts and export `middleware` instead.
//
// Public host: read-only map; editor paths 404.
// Edit host: HTTP Basic Auth password gate, then everything is served from /edit/*.
// Server actions and write routes MUST call `assertEditor()` themselves as well.

import { NextResponse, type NextRequest } from "next/server";

const EDIT_HOST = process.env.EDIT_HOST ?? "";
const EDIT_PASSWORD = process.env.EDIT_PASSWORD ?? "";

function isEditHost(host: string) {
  return host === EDIT_HOST || host.startsWith("edit.");
}

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function passwordFromRequest(authHeader: string | null) {
  if (!authHeader?.startsWith("Basic ")) return "";
  const decoded = atob(authHeader.slice(6));
  return decoded.slice(decoded.indexOf(":") + 1); // username is ignored
}

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const { pathname } = req.nextUrl;

  if (!isEditHost(host)) {
    if (pathname.startsWith("/edit") || pathname.startsWith("/api/admin")) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  const ok = safeEqual(passwordFromRequest(req.headers.get("authorization")), EDIT_PASSWORD);
  if (!ok) {
    return new NextResponse("Password required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Meta Map editor", charset="UTF-8"' },
    });
  }

  const res =
    pathname.startsWith("/edit") || pathname.startsWith("/api")
      ? NextResponse.next()
      : NextResponse.rewrite(new URL(`/edit${pathname === "/" ? "" : pathname}`, req.url));
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};

// In server actions / route handlers (lib/auth.ts):
//
// import { headers } from "next/headers";
// export async function assertEditor() {
//   const h = await headers();
//   const host = (h.get("host") ?? "").split(":")[0];
//   const pw = passwordFromRequest(h.get("authorization"));
//   if (!isEditHost(host) || !safeEqual(pw, process.env.EDIT_PASSWORD ?? "")) {
//     throw new Error("Not allowed");
//   }
// }
