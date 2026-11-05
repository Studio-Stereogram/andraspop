import { describe, expect, it } from "vitest";
import { formatIsoDuration, formatViews, parseYouTubeVideo } from "./youtube";

const sample = {
  kind: "youtube#videoListResponse",
  items: [
    {
      id: "76CJ_CMCfs0",
      snippet: {
        publishedAt: "2026-09-18T16:00:07Z",
        title: "Ai Crafts — Denver / How AI is Elevating Designers to Consultants [CC] ",
        thumbnails: {
          default: { url: "https://i.ytimg.com/vi/76CJ_CMCfs0/default.jpg", width: 120, height: 90 },
          medium: { url: "https://i.ytimg.com/vi/76CJ_CMCfs0/mqdefault.jpg", width: 320, height: 180 },
          high: { url: "https://i.ytimg.com/vi/76CJ_CMCfs0/hqdefault.jpg", width: 480, height: 360 },
          maxres: { url: "https://i.ytimg.com/vi/76CJ_CMCfs0/maxresdefault.jpg", width: 1280, height: 720 },
        },
      },
      contentDetails: { duration: "PT24M7S" },
      statistics: { viewCount: "1287", likeCount: "41" },
    },
  ],
};

describe("parseYouTubeVideo", () => {
  it("reads title, date, duration, the 16:9 thumbnail and views", () => {
    expect(parseYouTubeVideo(sample)).toEqual({
      title: "Ai Crafts — Denver / How AI is Elevating Designers to Consultants [CC]",
      date: "2026-09-18",
      duration: "24:07",
      thumbnail: "https://i.ytimg.com/vi/76CJ_CMCfs0/maxresdefault.jpg",
      views: 1287,
    });
  });

  it("falls back to the medium thumbnail and tolerates hidden stats", () => {
    const item = structuredClone(sample.items[0]) as Record<string, unknown> & typeof sample.items[0];
    delete (item.snippet.thumbnails as Record<string, unknown>).maxres;
    delete (item as Record<string, unknown>).statistics;
    const v = parseYouTubeVideo({ items: [item] });
    expect(v?.thumbnail).toBe("https://i.ytimg.com/vi/76CJ_CMCfs0/mqdefault.jpg");
    expect(v?.views).toBeNull();
  });

  it("returns null for an empty or malformed response", () => {
    expect(parseYouTubeVideo({ items: [] })).toBeNull();
    expect(parseYouTubeVideo(null)).toBeNull();
    expect(parseYouTubeVideo({ error: { code: 403 } })).toBeNull();
  });
});

describe("formatIsoDuration", () => {
  it("formats minutes and hours like a player", () => {
    expect(formatIsoDuration("PT24M7S")).toBe("24:07");
    expect(formatIsoDuration("PT45S")).toBe("0:45");
    expect(formatIsoDuration("PT1H2M3S")).toBe("1:02:03");
    expect(formatIsoDuration("PT1H")).toBe("1:00:00");
    expect(formatIsoDuration("P1DT2H")).toBe("26:00:00");
  });

  it("is empty for live streams and junk", () => {
    expect(formatIsoDuration("P0D")).toBe("");
    expect(formatIsoDuration("")).toBe("");
    expect(formatIsoDuration("12:40")).toBe("");
  });
});

describe("formatViews", () => {
  it("is exact below 10,000 and compact above", () => {
    expect(formatViews(1)).toBe("1 view");
    expect(formatViews(1287)).toBe("1,287 views");
    expect(formatViews(12_340)).toBe("12.3K views");
    expect(formatViews(1_250_000)).toBe("1.3M views");
  });
});
