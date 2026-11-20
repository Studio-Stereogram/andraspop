# /hi/guests: who's coming on Wednesdays

A private page listing who booked the "Thinking out loud" Wednesday slots (13:00, 13:45, 14:30 Budapest time) and how
each guest answered the booking form's recording question. Nothing links to it; it isn't indexed.

## Where things live

| What | Where |
|---|---|
| Page | `app/hi/guests/route.ts` → `lib/hi/guests-page.ts` (plain HTML in the `/hi` style) |
| Gate | HTTP Basic Auth, password = `EDIT_PASSWORD` (any username). Checked in the route itself. Without the variable the page stays shut. |
| Data | Vercel Global Config store connected to the project (`GLOBAL_CONFIG` or `EDGE_CONFIG`, whichever Vercel sets), item `hiGuests` |
| Source | Calendly's "New Event" and "Canceled" emails for the *Thinking out loud* event type, in andras@studiostereogram.com |

Guest names, emails and answers never go into this repository: it's public.

## Data shape

```json
{
  "syncedAt": "2026-11-20T12:00:00Z",
  "guests": [
    {
      "id": "<Calendly event uuid>",
      "name": "…",
      "email": "…",
      "start": "2026-11-25T14:30",
      "tz": "UK, Ireland, Lisbon Time",
      "recording": "yes",
      "answer": "Yes, I'm happy to share whatever we discuss",
      "extra": ["additional guest emails"],
      "canceled": false
    }
  ]
}
```

`start` is Budapest wall-clock time, as Calendly writes it. `recording` is `yes`, `no` or `unanswered`; anything that
isn't a clear yes counts as no (`recordingFromAnswer`). `answer` keeps the guest's words.

## Syncing

For now Claude syncs it with the Gmail connector. Ask "sync the hi guests". Claude then:

1. Searches Gmail: `from:notifications@calendly.com "Thinking out loud"`.
2. Reads each email and turns it into a notice with `parseCalendlyNotification(subject, plaintextBody)`.
3. Applies the notices oldest first to the current list (`applyNotices`), so a cancellation marks its booking.
4. Writes `{ syncedAt, guests }` to the `hiGuests` item through the Vercel connector.

The page reads the item on every request (no cache), so a sync shows on the next reload.

Global Config is meant for small values, and stores have a size limit per plan (each guest is about 300 bytes). When
the list outgrows it, move it to Supabase with RLS, or read Calendly's API directly with a personal access token.
