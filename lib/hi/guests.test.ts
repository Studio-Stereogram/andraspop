import { describe, expect, it } from "vitest";
import {
  applyNotices,
  budapestNow,
  groupByDay,
  nextWednesday,
  parseCalendlyDateTime,
  parseCalendlyNotification,
  parseGuestList,
  recordingFromAnswer,
  type Guest,
} from "./guests";

// Made-up guests only: this repository is public.
const UUID = "00000000-1111-2222-3333-444444444444";
const scheduledBody = ` Calendly\n\n| |\n\n| Hi András Pop, A new event has been scheduled. Event Type: Thinking out loud — 45 Min. Discussion Invitee: Ada Example Invitee Email: ada@example.com[](ada@example.com) Additional Guests: bo@example.com cy@example.com Event Date/Time: 14:30 - Wednesday, 25 November 2026 (Central European Time) Location: This is a Google Meet web conference. Join now[](https://calendly.com/events/${UUID}/google_meet) Invitee Time Zone: UK, Ireland, Lisbon Time Questions: Are you okay with this discussion being recorded, so that it can be posted publicly to the benefit of the community? Yes, I'm happy to share whatever we discuss View event in Calendly[](https://calendly.com/app/scheduled_events/user/me?period=upcoming&uuid=${UUID}) #### Pro Tip! #### Get Calendly on Mobile |`;
const scheduledSubject = "New Event: Ada Example - 14:30 Wed, 25 Nov 2026 - Thinking out loud — 45 Min. Discussion";

const guest = (over: Partial<Guest>): Guest => ({ id: "a", name: "A", email: "a@example.com", start: "2026-11-25T13:00", recording: "yes", ...over });

describe("recordingFromAnswer", () => {
  it("reads a clear yes, treats anything else as no", () => {
    expect(recordingFromAnswer("Yes, I'm happy to share whatever we discuss")).toBe("yes");
    expect(recordingFromAnswer("I'd rather not share")).toBe("no");
    expect(recordingFromAnswer("Yesterday works")).toBe("no");
    expect(recordingFromAnswer("  ")).toBe("unanswered");
    expect(recordingFromAnswer(undefined)).toBe("unanswered");
  });
});

describe("parseCalendlyDateTime", () => {
  it("turns Calendly's format into Budapest wall-clock time", () => {
    expect(parseCalendlyDateTime("14:30 - Wednesday, 25 November 2026 (Central European Time)")).toBe("2026-11-25T14:30");
    expect(parseCalendlyDateTime("9:05 - Wednesday, 2 December 2026")).toBe("2026-12-02T09:05");
    expect(parseCalendlyDateTime("soon")).toBeNull();
  });
});

describe("parseCalendlyNotification", () => {
  it("reads a new booking", () => {
    expect(parseCalendlyNotification(scheduledSubject, scheduledBody)).toEqual({
      kind: "scheduled",
      guest: {
        id: UUID,
        name: "Ada Example",
        email: "ada@example.com",
        start: "2026-11-25T14:30",
        tz: "UK, Ireland, Lisbon Time",
        recording: "yes",
        answer: "Yes, I'm happy to share whatever we discuss",
        extra: ["bo@example.com", "cy@example.com"],
      },
    });
  });

  it("reads a cancellation", () => {
    const body =
      "Hi András Pop, The event below has been canceled. Event Type: Thinking out loud — 45 Min. Discussion Invitee: Ada Example Invitee Email: ada@example.com Event Date/Time: 14:30 - Wednesday, 25 November 2026 (Central European Time) Canceled by: Ada Example";
    expect(parseCalendlyNotification("Canceled: Thinking out loud — 45 Min. Discussion with Ada Example on 25 November 2026", body)).toEqual({
      kind: "canceled",
      email: "ada@example.com",
      start: "2026-11-25T14:30",
    });
  });

  it("ignores other event types", () => {
    const other = scheduledBody.replace("Thinking out loud — 45 Min. Discussion", "30 Minute Meeting");
    expect(parseCalendlyNotification("New Event: Ada Example - 30 Minute Meeting", other)).toBeNull();
  });
});

describe("applyNotices", () => {
  it("adds bookings and marks matching cancellations", () => {
    const list = applyNotices(
      [guest({ id: "x", email: "Ada@Example.com", start: "2026-11-25T14:30" })],
      [
        { kind: "scheduled", guest: guest({ id: "y", start: "2026-11-25T13:00" }) },
        { kind: "canceled", email: "ada@example.com", start: "2026-11-25T14:30" },
      ],
    );
    expect(list.map((g) => [g.id, g.canceled ?? false])).toEqual([
      ["y", false],
      ["x", true],
    ]);
  });
});

describe("parseGuestList", () => {
  it("keeps valid guests and drops malformed ones", () => {
    const list = parseGuestList({
      syncedAt: "2026-11-20T10:00:00Z",
      guests: [guest({}), { id: "b", name: "B", start: "25 Nov" }, null, { ...guest({ id: "c" }), recording: "maybe" }],
    });
    expect(list?.guests.map((g) => [g.id, g.recording])).toEqual([
      ["a", "yes"],
      ["c", "unanswered"],
    ]);
    expect(parseGuestList("nope")).toBeNull();
  });
});

describe("days", () => {
  it("formats now in Budapest time", () => {
    expect(budapestNow(new Date("2026-11-25T13:30:00Z"))).toBe("2026-11-25T14:30");
    expect(budapestNow(new Date("2026-07-01T10:00:00Z"))).toBe("2026-07-01T12:00");
  });

  it("finds the next Wednesday", () => {
    expect(nextWednesday("2026-11-20")).toBe("2026-11-25");
    expect(nextWednesday("2026-11-25")).toBe("2026-11-25");
  });

  it("always shows the next Wednesday and splits past from upcoming", () => {
    const guests = [guest({ id: "old", start: "2026-11-18T13:00" }), guest({ id: "later", start: "2026-12-09T13:45" })];
    const friday = groupByDay(guests, new Date("2026-11-20T10:00:00Z"));
    expect(friday.upcoming.map((d) => [d.date, d.guests.length])).toEqual([
      ["2026-11-25", 0],
      ["2026-12-09", 1],
    ]);
    expect(friday.past.map((d) => d.date)).toEqual(["2026-11-18"]);

    const wedEvening = groupByDay([guest({ id: "today", start: "2026-11-25T14:30" })], new Date("2026-11-25T17:00:00Z"));
    expect(wedEvening.upcoming.map((d) => d.date)).toEqual(["2026-12-02"]);
    expect(wedEvening.past.map((d) => d.date)).toEqual(["2026-11-25"]);
  });
});
