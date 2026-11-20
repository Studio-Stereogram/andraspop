import { describe, expect, it } from "vitest";
import { renderGuestsPage } from "./guests-page";

describe("renderGuestsPage", () => {
  const now = new Date("2026-11-20T10:00:00Z");

  it("escapes guest data", () => {
    const html = renderGuestsPage(
      { syncedAt: "2026-11-20T09:00:00Z", guests: [{ id: "x", name: "<script>alert(1)</script>", email: 'a"b@example.com', start: "2026-11-25T13:00", recording: "no", answer: "I'd rather not share" }] },
      now,
    );
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a&quot;b@example.com");
    expect(html).toContain("Don't record");
  });

  it("shows the next Wednesday's open slots and an empty state before the first sync", () => {
    const html = renderGuestsPage(null, now);
    expect(html).toMatch(/Wednesday,? 25 November 2026/);
    expect(html.match(/class="row open"/g)).toHaveLength(3);
    expect(html).toContain("Not synced yet");
  });
});
