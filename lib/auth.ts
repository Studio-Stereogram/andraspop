import "server-only";

import { headers } from "next/headers";
import { isEditorRequest } from "./gate";

/** Throws unless the request came through the edit host with the right password. Call first in every write. */
export async function assertEditor(): Promise<void> {
  const h = await headers();
  if (!isEditorRequest(h.get("host") ?? "", h.get("authorization"))) throw new Error("Not allowed");
}
