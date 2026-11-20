/**
 * Guests of the "Thinking out loud" Wednesday slots (/hi), tracked privately at /hi/guests.
 *
 * The list is built from Calendly's notification emails (New Event / Canceled) and stored in Vercel Edge Config
 * under GUESTS_KEY. Guest names, emails and answers never go into this public repository.
 * Times are Budapest wall-clock times ("2026-11-25T14:30"), as Calendly writes them in the host's zone.
 */

export const GUESTS_KEY = "hiGuests";
export const EVENT_TYPE = "Thinking out loud";
export const SLOTS = ["13:00", "13:45", "14:30"] as const;
export const TIME_ZONE = "Europe/Budapest";

export type Recording = "yes" | "no" | "unanswered";

export type Guest = {
  /** Calendly event UUID, from the email's links. */
  id: string;
  name: string;
  email: string;
  /** Budapest wall-clock start, "YYYY-MM-DDTHH:mm". */
  start: string;
  /** The invitee's own time zone, as Calendly names it ("UK, Ireland, Lisbon Time"). */
  tz?: string;
  recording: Recording;
  /** The answer to the recording question, word for word. */
  answer?: string;
  /** Additional guests' emails. */
  extra?: string[];
  canceled?: boolean;
};

export type GuestList = { syncedAt: string; guests: Guest[] };

/** Maps the booking form's answer to a recording decision. Anything that isn't a clear yes counts as no. */
export function recordingFromAnswer(answer: string | undefined): Recording {
  const a = (answer ?? "").trim().toLowerCase();
  if (!a) return "unanswered";
  if (/^(yes|igen)\b/.test(a)) return "yes";
  return "no";
}

const isStr = (v: unknown): v is string => typeof v === "string";

/** Validates what Edge Config returned. Malformed entries are dropped rather than breaking the page. */
export function parseGuestList(value: unknown): GuestList | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { syncedAt?: unknown; guests?: unknown };
  if (!Array.isArray(v.guests)) return null;
  const guests = v.guests.flatMap((g): Guest[] => {
    if (!g || typeof g !== "object") return [];
    const r = g as Record<string, unknown>;
    if (!isStr(r.id) || !isStr(r.name) || !isStr(r.start) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(r.start)) return [];
    const recording: Recording = r.recording === "yes" || r.recording === "no" ? r.recording : "unanswered";
    return [
      {
        id: r.id,
        name: r.name,
        email: isStr(r.email) ? r.email : "",
        start: r.start,
        tz: isStr(r.tz) ? r.tz : undefined,
        recording,
        answer: isStr(r.answer) ? r.answer : undefined,
        extra: Array.isArray(r.extra) ? r.extra.filter(isStr) : undefined,
        canceled: r.canceled === true,
      },
    ];
  });
  return { syncedAt: isStr(v.syncedAt) ? v.syncedAt : "", guests };
}

/** "Now" as a Budapest wall-clock string, comparable with Guest.start. */
export function budapestNow(now: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** The date ("YYYY-MM-DD") of the next Wednesday on or after the given Budapest date. */
export function nextWednesday(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((3 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

export type Day = { date: string; guests: Guest[] };

/**
 * Splits guests into days. Upcoming starts with the next Wednesday (shown even when empty) and is sorted
 * soonest first; past days are newest first. A day counts as past once its last slot has ended.
 */
export function groupByDay(guests: Guest[], now: Date): { upcoming: Day[]; past: Day[] } {
  const nowLocal = budapestNow(now);
  const today = nowLocal.slice(0, 10);
  const byDate = new Map<string, Guest[]>();
  for (const g of [...guests].sort((a, b) => a.start.localeCompare(b.start))) {
    const date = g.start.slice(0, 10);
    byDate.set(date, [...(byDate.get(date) ?? []), g]);
  }
  // Wednesday's slots end at 15:15; after that, show the following Wednesday as next.
  const nextWed = nextWednesday(nowLocal > `${today}T15:15` ? addDays(today, 1) : today);
  if (!byDate.has(nextWed)) byDate.set(nextWed, []);

  const days = [...byDate.entries()].map(([date, gs]) => ({ date, guests: gs }));
  const isPast = (d: Day) => d.date < today || (d.date === today && nowLocal > `${today}T15:15`);
  return {
    upcoming: days.filter((d) => !isPast(d)).sort((a, b) => a.date.localeCompare(b.date)),
    past: days.filter(isPast).sort((a, b) => b.date.localeCompare(a.date)),
  };
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/** "14:30 - Wednesday, 25 November 2026" → "2026-11-25T14:30". */
export function parseCalendlyDateTime(s: string): string | null {
  const m = s.match(/(\d{1,2}):(\d{2})\s*-\s*\w+,\s*(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[4].toLowerCase());
  if (month === -1) return null;
  const pad = (n: string | number) => String(n).padStart(2, "0");
  return `${m[5]}-${pad(month + 1)}-${pad(m[3])}T${pad(m[1])}:${m[2]}`;
}

export type CalendlyNotice =
  | { kind: "scheduled"; guest: Guest }
  | { kind: "canceled"; email: string; start: string };

/**
 * Reads one Calendly notification email (subject + plain-text body, as Gmail returns it) for the Thinking out
 * loud event type. Returns null for anything else (other event types, reminders, account mail).
 */
export function parseCalendlyNotification(subject: string, body: string): CalendlyNotice | null {
  const text = body.replace(/\[\]\([^)]*\)/g, " ").replace(/\s+/g, " ");
  if (!subject.includes(EVENT_TYPE) && !text.includes(`Event Type: ${EVENT_TYPE}`)) return null;

  const field = (label: string, next: string[]) => {
    const re = new RegExp(`${label}:\\s*(.*?)\\s*(?:${next.join("|")}):`);
    return text.match(re)?.[1]?.trim() ?? "";
  };
  const email = field("Invitee Email", ["Additional Guests", "Event Date/Time"]);
  const start = parseCalendlyDateTime(field("Event Date/Time", ["Location", "Invitee Time Zone", "Canceled by", "Questions", "Reason"]) || text);
  if (!email || !start) return null;

  if (/^Canceled:/i.test(subject) || /has been canceled/i.test(text)) return { kind: "canceled", email, start };
  if (!/^(New Event|Updated):/i.test(subject) && !/has been scheduled/i.test(text)) return null;

  const id = body.match(/calendly\.com\/events\/([0-9a-f-]{36})/)?.[1] ?? body.match(/uuid=([0-9a-f-]{36})/)?.[1] ?? `${email}|${start}`;
  const answer = text.match(/Questions: .*?\? (.*?)(?: View event in Calendly| ####|$)/)?.[1]?.trim();
  const extra = field("Additional Guests", ["Event Date/Time"]).split(/\s+/).filter((e) => e.includes("@"));
  const tz = text.match(/Invitee Time Zone: (.*?)(?: Questions:| View event in Calendly| ####|$)/)?.[1]?.trim();

  return {
    kind: "scheduled",
    guest: {
      id,
      name: field("Invitee", ["Invitee Email"]),
      email,
      start,
      tz: tz || undefined,
      recording: recordingFromAnswer(answer),
      answer: answer || undefined,
      extra: extra.length ? extra : undefined,
    },
  };
}

/** Applies notices oldest first: a booking adds or replaces a guest, a cancellation marks the matching booking. */
export function applyNotices(guests: Guest[], notices: CalendlyNotice[]): Guest[] {
  const out = new Map(guests.map((g) => [g.id, g]));
  for (const n of notices) {
    if (n.kind === "scheduled") {
      out.set(n.guest.id, n.guest);
      continue;
    }
    for (const g of out.values()) {
      if (g.email.toLowerCase() === n.email.toLowerCase() && g.start === n.start) out.set(g.id, { ...g, canceled: true });
    }
  }
  return [...out.values()].sort((a, b) => a.start.localeCompare(b.start));
}
