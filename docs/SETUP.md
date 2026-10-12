# Setup

## Campus configuration

Edit `frontend/campus.config.json`. The file is imported by both server and browser, so everything
in it is public. It contains no credentials.

| Setting | Meaning |
| --- | --- |
| `name` | Application name |
| `timeZone` | IANA zone such as `UTC`, `Europe/Berlin` or `America/New_York` |
| `openingHours` | Local `HH:MM` start/end, identical each day; start must precede end |
| `soonThresholdMinutes` | Busy rooms ending within this many whole minutes appear soon |
| `showBookingTitles` | `false` by default; enable only for titles approved for public display |
| `cacheSeconds` | Server feed cache, 0–3600 seconds, per process; default 60 |
| `maxFeedAgeSeconds` | Maximum age of the provider snapshot; default 600 seconds |
| `buildings` | Unique URL-safe codes and labels |
| `rooms` | Globally unique IDs, building codes, floor labels and display numbers |

Room IDs may contain letters, digits, underscores, periods and hyphens. Building codes use
letters, digits, underscores and hyphens. Keep the catalogue explicit: discovering rooms solely
from today's bookings hides unbooked rooms. Remove rooms that should not be shown as available.

Overnight opening windows, per-room opening hours, holiday calendars, bookings, and physical
occupancy detection are not included. Represent a known closure as a busy interval, or extend
the opening-hours logic. A missing feed day means unknown coverage, not a holiday/free day.

## Connect a file

Create `frontend/.env.local`:

```dotenv
SCHEDULE_SOURCE=file
SCHEDULE_FILE=.local/schedule.json
```

Store a canonical [schedule payload](ADAPTERS.md) in `frontend/.local/schedule.json`. That folder
is ignored and excluded from releases. Paths are relative to the server's working directory,
normally `frontend/`. Refresh the file atomically and preserve the actual snapshot timestamp.
The committed JSON example illustrates the shape and deliberately contains historical demo dates.

## Connect an API

```dotenv
SCHEDULE_SOURCE=api
SCHEDULE_API_URL=https://example.invalid/schedule.json
SCHEDULE_API_TOKEN=replace-with-your-server-only-bearer-token
```

The token is optional and sent as `Authorization: Bearer …`. Custom auth, pagination, date-range
parameters or a different data format belong in `lib/adapters/source.ts` and `normalize.ts`.
The current loader requests one configured URL whose response covers all rooms/dates it serves;
the UI does not dynamically substitute a selected date into that URL. HTTPS is required, except
for local HTTP providers on localhost. Redirects are rejected. Requests time out after ten seconds,
payloads are limited to 5 MiB, and normalized feeds to 50,000 bookings.

Restart after changing environment variables or campus configuration. Failed production feeds never
fall back to demo data. Do not treat a partial/paginated response as complete coverage.

## Build and deploy

```sh
cd frontend
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Deploy `frontend/` as a Next.js Node application on a compatible host, or run the production server
yourself. Set the provider environment variables on the server and optionally set `SITE_URL` to
your public origin before building. No database is required. API mode
works on hosts without persistent storage; file mode needs a readable file available at runtime.
Static export alone cannot run the schedule API.

For restricted environments where Turbopack cannot create its internal worker socket, use
`npm run build -- --webpack`. Use `npm start` for a public deployment; the development server
is for local work. Configure HTTPS at your host. Add your own operator/contact/privacy information
before running a public instance; the starter contains no personal legal pages or contact details.

## Verify your connection

With a server running, request `/api/rooms?building=MAIN&date=2026-07-01`, replacing the building
and date with ones in your configuration and confirmed coverage. A snapshot instead uses
`moment=2026-07-01T09%3A00%3A00Z`. A room timeline adds `room=MAIN-G01`.

Compare occupied/free intervals to the source timetable. Verify an empty but covered room, an
unknown room/date, overlapping and adjacent bookings, overnight bookings, timezone/DST behavior,
closures, cancelled bookings, missing pages, stale feeds and provider failures. Confirm the browser
never sees upstream tokens, raw records, student/instructor details, or debug responses.
