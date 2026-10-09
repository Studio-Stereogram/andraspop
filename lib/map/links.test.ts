import { describe, expect, it } from "vitest";
import {
  canonicalInstagramUrl,
  decodeEntities,
  instagramPreview,
  isAllowedThumbnail,
  parseOpenGraph,
  titleFromCaption,
  youtubeId,
  youtubeOEmbedTitle,
} from "./links";

// Sample responses are written in the shape YouTube's oEmbed and Instagram's link-preview tags use;
// they are not captured from the real posts (this repo's build machine can't reach them).

describe("youtubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=76CJ_CMCfs0", "76CJ_CMCfs0"],
    ["https://youtu.be/K2yXm-u9e0s?si=abc", "K2yXm-u9e0s"],
    ["https://m.youtube.com/watch?v=K2yXm-u9e0s&t=10s", "K2yXm-u9e0s"],
    ["https://www.youtube.com/shorts/76CJ_CMCfs0", "76CJ_CMCfs0"],
    ["https://www.youtube.com/embed/76CJ_CMCfs0", "76CJ_CMCfs0"],
  ])("reads %s", (url, id) => expect(youtubeId(url)).toBe(id));

  it("rejects other links and malformed ids", () => {
    expect(youtubeId("https://vimeo.com/36579366")).toBeNull();
    expect(youtubeId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(youtubeId("not a url")).toBeNull();
  });
});

describe("canonicalInstagramUrl", () => {
  it("drops share-tracking parameters", () => {
    expect(
      canonicalInstagramUrl(
        "https://www.instagram.com/reel/DeKVLAEoUI3/?utm_source=ig_web_copy_link&obrf=MzRlODBiNWFlZA==&srtk=MzRlODBiNWFlZA==",
      ),
    ).toBe("https://www.instagram.com/reel/DeKVLAEoUI3/");
    expect(canonicalInstagramUrl("https://instagram.com/p/AbC123/?igsh=x")).toBe("https://www.instagram.com/p/AbC123/");
    expect(canonicalInstagramUrl("https://example.com/reel/x/")).toBeNull();
  });
});

describe("parseOpenGraph", () => {
  it("reads og tags in either attribute order and decodes entities", () => {
    const og = parseOpenGraph(`<head>
      <meta property="og:title" content="Andr&#xe1;s Pop on Instagram: &quot;Tiny tools &amp; big ideas&quot;" />
      <meta content='https://scontent-fra5-1.cdninstagram.com/v/t51/cover.jpg?oe=1' property='og:image'>
      <meta name="description" content="ignored for og">
    </head>`);
    expect(og["og:title"]).toBe('András Pop on Instagram: "Tiny tools & big ideas"');
    expect(og["og:image"]).toBe("https://scontent-fra5-1.cdninstagram.com/v/t51/cover.jpg?oe=1");
  });
});

describe("instagramPreview", () => {
  it("takes the caption's first line as the title, the cover as thumbnail and the post date", () => {
    const p = instagramPreview({
      "og:title": 'András Pop on Instagram: "Building a node canvas for my videos\nPart one of the series #buildinpublic"',
      "og:description": '120 likes, 8 comments - andraspop on September 30, 2026: "Building a node canvas for my videos"',
      "og:image": "https://scontent.cdninstagram.com/v/cover.jpg",
    });
    expect(p).toEqual({
      title: "Building a node canvas for my videos",
      thumbnail: "https://scontent.cdninstagram.com/v/cover.jpg",
      date: "2026-09-30",
    });
  });

  it("ignores images from hosts the app doesn't allow, and copes with missing tags", () => {
    expect(instagramPreview({ "og:image": "https://evil.example/x.jpg" })).toEqual({ title: "", thumbnail: "", date: "" });
  });
});

describe("titleFromCaption", () => {
  it("drops trailing hashtags and mentions", () => {
    expect(titleFromCaption("New poster series @friend #art #vibecoding")).toBe("New poster series");
  });

  it("shortens long captions at a word boundary", () => {
    const t = titleFromCaption("word ".repeat(40));
    expect(t.length).toBeLessThanOrEqual(90);
    expect(t.endsWith("…")).toBe(true);
    expect(t).not.toMatch(/\s…$/);
  });
});

describe("misc", () => {
  it("reads the oEmbed title", () => {
    expect(youtubeOEmbedTitle({ title: " A video ", author_name: "x" })).toBe("A video");
    expect(youtubeOEmbedTitle(null)).toBe("");
  });

  it("allows only known thumbnail hosts over https", () => {
    expect(isAllowedThumbnail("https://i.ytimg.com/vi/76CJ_CMCfs0/hqdefault.jpg")).toBe(true);
    expect(isAllowedThumbnail("https://scontent-fra5-1.cdninstagram.com/v/x.jpg")).toBe(true);
    expect(isAllowedThumbnail("http://i.ytimg.com/vi/x/hqdefault.jpg")).toBe(false);
    expect(isAllowedThumbnail("https://ytimg.com.evil.example/x.jpg")).toBe(false);
  });

  it("decodes numeric and named entities", () => {
    expect(decodeEntities("&#39;a&#x27; &lt;b&gt;")).toBe("'a' <b>");
  });
});
