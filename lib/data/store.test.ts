import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import seed from "@/data/seed.json";
import { normalizeMap } from "@/lib/map/normalize";
import { editorStore } from "./store";

// The Supabase store against a fake fetch: checks the REST calls it makes (no database in tests).
type Call = {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
};
let calls: Call[];
let replies: ((c: Call) => unknown)[];

beforeEach(() => {
  calls = [];
  replies = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co/";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const call = {
      method: init.method ?? "GET",
      path: url.replace("https://example.supabase.co/rest/v1/", ""),
      body: init.body ? JSON.parse(init.body as string) : undefined,
      headers: init.headers as Record<string, string>,
    };
    calls.push(call);
    const reply = replies.shift()?.(call);
    return new Response(reply === undefined ? "" : JSON.stringify(reply), {
      status: 200,
    });
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
});

describe("Supabase store", () => {
  it("sends the secret key as apikey and saves a node by slug, then its topics", async () => {
    const store = editorStore()!;
    expect(store.kind).toBe("supabase");
    replies = [() => [{ id: "11111111-1111-4111-8111-111111111111" }]];
    const node = normalizeMap(seed).nodes.find((n) => n.topics.length)!;
    await store.saveNode(node);
    expect(calls[0]).toMatchObject({
      method: "POST",
      path: "nodes?on_conflict=slug&select=id",
    });
    expect(calls[0].headers.apikey).toBe("sb_secret_test");
    expect(calls[0].headers.Prefer).toContain("resolution=merge-duplicates");
    expect((calls[0].body as { slug: string }[])[0].slug).toBe(node.id);
    expect(calls[1]).toMatchObject({
      method: "DELETE",
      path: "node_topics?node_id=eq.11111111-1111-4111-8111-111111111111",
    });
    expect(calls[2]).toMatchObject({ method: "POST", path: "node_topics" });
    expect((calls[2].body as unknown[]).length).toBe(node.topics.length);
  });

  it("resolves both ends of a connection by slug before saving it", async () => {
    const store = editorStore()!;
    replies = [
      () => [
        { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", slug: "a" },
        { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", slug: "b" },
      ],
    ];
    const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    await store.saveEdge({
      id,
      from: "a",
      to: "b",
      type: "reference",
      kind: "related",
    });
    expect(decodeURIComponent(calls[0].path)).toBe(
      'nodes?select=id,slug&slug=in.("a","b")',
    );
    expect(calls[1]).toMatchObject({
      method: "POST",
      path: "edges?on_conflict=id",
    });
    expect(calls[1].body).toEqual([
      {
        id,
        from_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        to_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        type: "reference",
        kind: "related",
      },
    ]);
  });

  it("replaces everything: clears, then writes topics, nodes, tags and edges with uuids", async () => {
    const store = editorStore()!;
    const map = normalizeMap(seed);
    replies = [
      () => undefined,
      () => undefined,
      () => undefined,
      () => undefined,
      (c) =>
        (c.body as { slug: string }[]).map((r, i) => ({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          slug: r.slug,
        })),
    ];
    await store.replaceAll(map);
    expect(calls.slice(0, 3).map((c) => `${c.method} ${c.path}`)).toEqual([
      "DELETE edges?id=not.is.null",
      "DELETE nodes?id=not.is.null",
      "DELETE topics?id=not.is.null",
    ]);
    expect(calls.map((c) => c.path.split("?")[0])).toEqual([
      "edges",
      "nodes",
      "topics",
      "topics",
      "nodes",
      "node_topics",
      "edges",
    ]);
    const edges = calls[6].body as { id: string }[];
    expect(edges.length).toBe(map.edges.length);
    expect(edges.every((e) => /^[0-9a-f-]{36}$/.test(e.id))).toBe(true);
  });
});
