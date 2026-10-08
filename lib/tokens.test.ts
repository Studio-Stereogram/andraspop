import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The design skill's tokens.css is the source of truth; app/globals.css carries a copy.
// Fonts are the one intended difference (next/font variables instead of a Google Fonts @import).
const FONT_TOKENS = new Set(["--f-ui", "--f-title", "--f-mono"]);
const BLOCKS = [":root", ":root.paper", ":root, :root.paper"];

function tokens(css: string) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Record<string, Record<string, string>> = {};
  for (const selector of BLOCKS) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = clean.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
    if (!match) throw new Error(`Missing block ${selector}`);
    out[selector] = Object.fromEntries(
      [...match[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
        .filter(([, name]) => !FONT_TOKENS.has(name))
        .map(([, name, value]) => [name, value.trim().replace(/\s+/g, " ")]),
    );
  }
  return out;
}

describe("design tokens", () => {
  it("app/globals.css matches the meta-map-design skill's tokens.css", () => {
    const root = process.cwd();
    const skill = readFileSync(join(root, ".claude/skills/meta-map-design/references/tokens.css"), "utf8");
    const app = readFileSync(join(root, "app/globals.css"), "utf8");
    expect(tokens(app)).toEqual(tokens(skill));
  });
});
