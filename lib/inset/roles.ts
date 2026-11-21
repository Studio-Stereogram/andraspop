// The people who take part in an inset's phases or levels, shown as colour-coded tags with a short
// definition on hover. Colours come in families (who they are, roughly), each with a pale tint for
// supporting roles and a solid fill for the roles that lead. Every pair is checked with APCA (roles.test.ts).

export type Family = "research" | "design" | "product" | "engineering" | "people";

export const FAMILIES: Record<Family, { tint: string; ink: string; solid: string; onSolid: string }> = {
  research: { tint: "#d3f0ea", ink: "#0b463d", solid: "#0e6d63", onSolid: "#ffffff" },
  design: { tint: "#e5e1ff", ink: "#33238c", solid: "#4f3ad6", onSolid: "#ffffff" },
  product: { tint: "#fbe8c2", ink: "#5c3a00", solid: "#9a5400", onSolid: "#ffffff" },
  engineering: { tint: "#dcf1d2", ink: "#1b4f10", solid: "#2c6e1c", onSolid: "#ffffff" },
  people: { tint: "#f7dbe5", ink: "#6d1a37", solid: "#9c2c55", onSolid: "#ffffff" },
};

export type Role = { name: string; family: Family; definition: string };

export const ROLES = {
  // design cycle
  "ux-researcher": { name: "UX researcher", family: "research", definition: "Finds out what people need, through interviews, tests and data." },
  "product-designer": { name: "Product designer", family: "design", definition: "Shapes the whole experience, from the problem to the solution." },
  "ui-designer": { name: "UI designer", family: "design", definition: "Designs the screens: layout, type, colour and components." },
  "product-manager": { name: "Product manager", family: "product", definition: "Decides what to build and why, and keeps the scope in check." },
  stakeholders: { name: "Stakeholders", family: "people", definition: "People with a say in the outcome: leads, clients, other teams." },
  "tech-lead": { name: "Tech lead", family: "engineering", definition: "Checks what is feasible and plans how it gets built." },
  "frontend-dev": { name: "Frontend developer", family: "engineering", definition: "Builds what people see and use, in the browser or the app." },
  "backend-dev": { name: "Backend developer", family: "engineering", definition: "Builds the data, logic and services behind it." },
  "designer-qa": { name: "Designer (QA)", family: "design", definition: "Reviews what was built against the design, and flags the gaps." },
  "designer-code": { name: "Designer (code)", family: "design", definition: "Designs directly in code, closing the gap to what ships." },
  // a vehicle for logic
  you: { name: "You", family: "people", definition: "Only whoever asked. Nobody else sees it." },
  reader: { name: "Reader", family: "research", definition: "Reads it, cites it and follows it." },
  explorer: { name: "Explorer", family: "design", definition: "Changes the inputs and sees what follows." },
  operator: { name: "Operator", family: "product", definition: "Uses it to get a task done." },
  builder: { name: "Builder", family: "engineering", definition: "Builds new tools on top of it." },
} satisfies Record<string, Role>;

export type RoleId = keyof typeof ROLES;
export type Participant = { id: RoleId; lead?: boolean };
