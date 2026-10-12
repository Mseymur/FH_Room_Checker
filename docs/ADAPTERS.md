# Timetable adapter contract

`lib/adapters/source.ts` loads a server-only provider response. `normalizeSchedule` in
`lib/adapters/normalize.ts` validates it and copies only the fields below. The room API calls
`lib/availability.ts` to derive display intervals. Provider details stay outside the UI.

## Canonical JSON

```json
{
  "updatedAt": "2026-07-01T08:00:00Z",
  "coverage": {
    "start": "2026-07-01T00:00:00Z",
    "end": "2026-07-02T00:00:00Z",
    "roomIds": ["MAIN-G01", "MAIN-101"]
  },
  "bookings": [
    {
      "roomId": "MAIN-101",
      "start": "2026-07-01T09:00:00Z",
      "end": "2026-07-01T10:30:00Z"
    }
  ]
}
```

The example is fictional and historical, not a live feed. All timestamps must include seconds
(fractions up to nanoseconds are accepted) and `Z` or an explicit offset. Offsets are converted to UTC; display uses the configured campus
timezone. Local timestamps without offsets are rejected. `wallClockToInstant` can convert local
dates/times in an adapter and rejects DST gaps and repeated times; ambiguous provider events need
an explicit source offset to disambiguate them.

`updatedAt` is when the source snapshot was successfully obtained/validated, not the selected
schedule date and not a timestamp you rewrite merely to bypass staleness. The loader also rejects
timestamps more than five minutes in the future.

`coverage` means **every occupied booking for every listed room within this range is represented**.
Only assert it after all required pages/calendars are fetched and validated. A date's entire
opening window must be inside coverage. A catalogue room absent from `roomIds` is unknown and
is not shown as free. An explicitly covered room with no bookings is free during opening hours.
Bookings crossing coverage/day boundaries may start earlier or end later and are clipped.

`roomId` must match the catalogue exactly and belong to a covered room. All durations must be
positive. Optional `title` is capped at 200 characters, dropped unless `showBookingTitles` is true,
and rendered as escaped text. No instructor, student, email, group, or raw-record fields are needed.
Unknown fields are discarded, not forwarded. Unknown rooms and invalid records reject the feed
instead of being silently skipped into false availability.

## Map another provider

1. Inspect a redacted response and provider documentation. Identify room IDs, timezone, event
   start/end, cancellations, recurrence, pagination, and the true coverage range.
2. Put the displayable room catalogue in `campus.config.json` and explicitly map provider room
   identifiers. Never infer coverage solely from rooms that happen to have events.
3. Fetch every required page server-side. Expand recurring events within a bounded window,
   apply exceptions and cancellations, and split multi-room bookings into one record per room.
4. Transform the source into the contract above, then use the existing validator. Retain only
   approved timing/room fields. To support CSV/XML/iCalendar, add a suitable parser at the source
   boundary; do not parse or expose raw responses in client components.
5. Fail the whole affected snapshot when a page, timezone, room mapping or record is uncertain.
   If the provider supplies only a partial set of rooms, mark only those complete rooms covered.

The adapter does not store private raw data or contact information. The in-memory cache holds one
normalized snapshot per server process, deduplicates concurrent loads and rechecks freshness on
cache reads. Expired data is not served as a success after a failed refresh. There is no database,
sync cron, user account, or upstream error body in the public API.
