import type { MapNode, Topic } from "./types";

// The intro's statement is plain text with two marks:
//   *words*           set in full ink; the rest of the sentence is quieter (the /hi page's two-tone headline)
//   {topic}           a topic word, labelled with the topic's name
//   {topic|label}     a topic word with its own label ("{music|art & music}")
// A topic word traces its entries on hover and filters to them on click. Unknown topics read as plain text.

export type StatementPart =
  | { kind: "text"; text: string; strong: boolean }
  | { kind: "topic"; id: string; label: string; strong: boolean };

const TOKEN = /\{([^{}|]+)(?:\|([^{}]*))?\}|\*/g;

export function parseStatement(src: string, topicById: ReadonlyMap<string, Topic>): StatementPart[] {
  const parts: StatementPart[] = [];
  let strong = false;
  let last = 0;
  const text = (t: string) => {
    if (!t) return;
    const prev = parts[parts.length - 1];
    if (prev?.kind === "text" && prev.strong === strong) prev.text += t;
    else parts.push({ kind: "text", text: t, strong });
  };
  for (const m of src.matchAll(TOKEN)) {
    text(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[0] === "*") {
      strong = !strong;
      continue;
    }
    const id = m[1].trim();
    const topic = topicById.get(id);
    const label = (m[2] ?? "").trim() || topic?.name || id;
    if (topic) parts.push({ kind: "topic", id, label, strong });
    else text(label);
  }
  text(src.slice(last));
  return parts;
}

/** The statement as one plain sentence, for screen readers, search engines and the page description. */
export function statementText(parts: StatementPart[]): string {
  return parts
    .map((p) => (p.kind === "text" ? p.text : p.label))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function findIntro(nodes: MapNode[]): MapNode | undefined {
  return nodes.find((n) => n.type === "intro");
}
