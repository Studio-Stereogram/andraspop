import { readGlobalConfigItem } from "@/lib/data/global-config";
import { isEditorRequest } from "@/lib/gate";
import { GUESTS_KEY, parseGuestList } from "@/lib/hi/guests";
import { renderGuestsPage } from "@/lib/hi/guests-page";

/**
 * /hi/guests: private list of who booked the Thinking out loud Wednesday slots and whether they're okay with
 * being recorded. Not linked from anywhere. Asks for the editor password (EDIT_PASSWORD, HTTP Basic Auth) and
 * checks it here, so it stays shut even without the proxy. The data lives in Global Config, not in this repo.
 */
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

export async function GET(request: Request) {
  if (!isEditorRequest(request.headers.get("authorization"), process.env.EDIT_PASSWORD)) {
    return new Response("Password required", {
      status: 401,
      headers: { ...PRIVATE_HEADERS, "WWW-Authenticate": 'Basic realm="Thinking out loud guests", charset="UTF-8"' },
    });
  }
  const list = parseGuestList(await readGlobalConfigItem(GUESTS_KEY));
  return new Response(renderGuestsPage(list, new Date()), {
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/html; charset=utf-8" },
  });
}
