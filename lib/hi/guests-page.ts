import { groupByDay, SLOTS, TIME_ZONE, type Day, type Guest, type GuestList } from "./guests";

/**
 * The private guest list at /hi/guests, as one plain HTML document in the /hi page's style
 * (Allo Sharp, same colours, light and dark). Every value from the data is escaped.
 */
export function renderGuestsPage(list: GuestList | null, now: Date): string {
  const guests = list?.guests ?? [];
  const { upcoming, past } = groupByDay(guests, now);
  const live = guests.filter((g) => !g.canceled);
  const upcomingLive = upcoming.flatMap((d) => d.guests).filter((g) => !g.canceled);
  const yes = upcomingLive.filter((g) => g.recording === "yes").length;

  const synced = list?.syncedAt ? `Synced ${esc(formatDateTime(list.syncedAt))}` : "Not synced yet";
  const summary = `${count(upcomingLive.length, "guest")} coming · ${yes} okay to record · ${count(live.length, "booking")} in total`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>Guests · Thinking out loud</title>
<link rel="icon" href="/icon.svg">
<link rel="preload" href="/hi/fonts/AlloSharp.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
</head>
<body>
<main class="wrap">
  <header class="meta">
    <a class="back" href="/hi">Thinking out loud</a>
    <span class="muted">${synced}</span>
  </header>
  <h1>Guests</h1>
  <p class="lead">${esc(summary)}</p>
  ${list ? "" : `<p class="note">Nothing synced yet. Ask Claude to sync the Thinking out loud guests from Gmail.</p>`}
  <section aria-label="Upcoming Wednesdays">${upcoming.map((d) => renderDay(d, true)).join("")}</section>
  ${
    past.length
      ? `<details class="past"><summary>Past Wednesdays (${past.length})</summary>${past.map((d) => renderDay(d, false)).join("")}</details>`
      : ""
  }
</main>
</body>
</html>`;
}

function renderDay(day: Day, upcoming: boolean): string {
  const isWednesday = new Date(`${day.date}T12:00:00Z`).getUTCDay() === 3;
  const times = isWednesday && upcoming ? [...new Set([...SLOTS, ...day.guests.map((g) => time(g))])].sort() : [...new Set(day.guests.map(time))].sort();
  const rows = times
    .map((t) => {
      const here = day.guests.filter((g) => time(g) === t);
      if (!here.length) return `<li class="row open"><span class="t">${t}</span><span class="muted">Open</span></li>`;
      return here.map((g) => renderGuest(t, g)).join("");
    })
    .join("");
  return `<article class="day"><h2>${esc(formatDate(day.date))}</h2><ul>${rows}</ul></article>`;
}

function renderGuest(t: string, g: Guest): string {
  const badge =
    g.recording === "yes"
      ? `<span class="badge yes">Okay to record</span>`
      : g.recording === "no"
        ? `<span class="badge no">Don't record</span>`
        : `<span class="badge">No answer</span>`;
  const extra = g.extra?.length ? `<span class="muted">+ ${g.extra.map((e) => esc(e)).join(", ")}</span>` : "";
  return `<li class="row${g.canceled ? " canceled" : ""}">
    <span class="t">${t}</span>
    <div class="who">
      <b>${esc(g.name)}</b>${g.canceled ? ` <span class="muted">Canceled</span>` : ""}
      <span class="muted">${g.email ? `<a href="mailto:${esc(g.email)}">${esc(g.email)}</a>` : ""}${g.tz ? ` · ${esc(g.tz)}` : ""}</span>
      ${extra}
      ${g.answer ? `<q>${esc(g.answer)}</q>` : ""}
    </div>
    ${badge}
  </li>`;
}

const time = (g: Guest) => g.start.slice(11, 16);
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE }).format(d);
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const CSS = `
@font-face{font-family:"Allo Sharp";src:url("/hi/fonts/AlloSharp.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
:root{--bg:#fff;--fg:#0b0b0b;--muted:#a3a3a3;--soft:#6b6b6b;--line:#e8e8e8;--card:#f4f4f3;--accent:#d8392b;--yes:#1f7a3d;
  --pad:clamp(20px,4vw,48px);--font:"Allo Sharp","Helvetica Neue",Helvetica,Arial,sans-serif;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#0c0c0c;--fg:#f2f2f2;--muted:#5e5e5e;--soft:#9a9a9a;--line:#1f1f1f;--card:#161616;--yes:#5cc47f;color-scheme:dark}}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font:400 16px/1.5 var(--font);font-optical-sizing:auto;-webkit-font-smoothing:antialiased}
a{color:inherit;text-underline-offset:3px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.wrap{max-width:880px;margin:0 auto;padding:0 var(--pad) calc(var(--pad) * 2)}
.meta{display:flex;justify-content:space-between;gap:16px;padding:var(--pad) 0;font-size:14px}
.back{text-decoration:none;font-weight:500}
.back::before{content:"← ";color:var(--muted)}
.muted{color:var(--muted)}
h1{font:600 clamp(40px,6vw,72px)/1 var(--font);letter-spacing:-.03em;margin-top:clamp(24px,5vw,56px)}
.lead{color:var(--soft);margin:14px 0 clamp(32px,5vw,56px)}
.note{background:var(--card);border-radius:12px;padding:16px 18px;margin-bottom:32px;color:var(--soft)}
.day{margin-bottom:40px}
h2{font:500 14px/1.4 var(--font);color:var(--soft);padding-bottom:10px;border-bottom:1px solid var(--line)}
ul{list-style:none}
.row{display:grid;grid-template-columns:56px 1fr auto;gap:16px;align-items:start;padding:16px 0;border-bottom:1px solid var(--line)}
.t{font-variant-numeric:tabular-nums;color:var(--soft);padding-top:1px}
.who{display:flex;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}
.who b{font-weight:500;font-size:18px}
.who .muted{font-size:14px}
q{display:block;margin-top:6px;color:var(--soft);font-size:14px}
q::before{content:"“"}q::after{content:"”"}
.open .muted{font-size:14px}
.badge{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:4px 10px;white-space:nowrap;color:var(--soft)}
.badge.yes{color:var(--yes);border-color:color-mix(in srgb,var(--yes) 40%,transparent)}
.badge.no{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.canceled .who b,.canceled q{text-decoration:line-through;color:var(--muted)}
.canceled .badge{opacity:.5}
.past summary{cursor:pointer;color:var(--soft);font-size:14px;margin-bottom:24px}
@media (max-width:560px){.row{grid-template-columns:44px 1fr}.row .badge{grid-column:2;justify-self:start}}
`;
