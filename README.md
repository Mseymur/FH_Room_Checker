# Campus Room Finder

A reusable room finder for universities with a timetable API or schedule export. It includes
the room UI, building and floor filters, live free/busy status, a date/time picker, room timelines,
light/dark themes, and the code that turns occupied bookings into free intervals.

Runs immediately with **fictional demo data**. No database, account, API key, analytics service,
or university affiliation is required. This is a read-only schedule viewer; it does not book rooms
or measure physical occupancy.

## Run it

Use Node.js 22.12 or newer:

```sh
cd frontend
npm ci
npm run dev
```

Open <http://localhost:3000>, choose a building, and view rooms. Demo mode is clearly labelled.
The default campus timezone is UTC.

## Use it at your university

1. Edit [`frontend/campus.config.json`](frontend/campus.config.json): app name, IANA timezone,
   same-day opening hours, buildings, and a complete catalogue of rooms you want to show.
2. Copy `frontend/.env.example` to `frontend/.env.local`. Select `file` or `api` mode and set
   the server-only path or URL. Put credentials only in `.env.local` or your hosting environment.
3. Map your provider's payload to the small [schedule contract](docs/ADAPTERS.md). A compatible
   JSON feed works directly. Other JSON formats, CSV, XML, and iCalendar require an adapter;
   automatic support for those formats is not included.
4. Test your feed and deploy. The [setup guide](docs/SETUP.md) and
   [AI adaptation prompt](docs/ADAPT_WITH_AI.md) walk through the changes.

The UI remains reusable: provider-specific work belongs in `frontend/lib/adapters/`.
Booking titles are hidden by default, and instructor/student data is not part of the contract.

## How a schedule becomes free rooms

The server validates the feed's timestamps, freshness, and confirmed room/date coverage. For
each covered room, it clips bookings to opening hours, sorts them, and merges overlaps and
back-to-back bookings. Gaps between the merged intervals are free. A current busy interval
ending within the configured threshold appears as **Available Soon**.

Example: opening hours `08:00–18:00`, bookings `09:00–10:00` and `09:30–11:00` produce
`FREE 08:00–09:00`, `BUSY 09:00–11:00`, `FREE 11:00–18:00`.

An empty booking list proves a room is free **only if the feed explicitly covers that room and
the entire opening-hours window**. Missing coverage produces no room result. Invalid or stale
feeds produce an error. Access restrictions and unrecorded bookings remain outside the tool's knowledge.

## Checks

```sh
cd frontend
npm run lint
npm run typecheck
npm test
npm audit --omit=dev
npm run build
cd ..
python3 scripts/release.py --check
```

`release.py --check` scans the source (and every Git-tracked file) for common secret and
private-data patterns without printing matched values. CI runs these checks plus a
[gitleaks](https://github.com/gitleaks/gitleaks) scan of the full Git history. See
[`SECURITY.md`](SECURITY.md) for the security model.

Project source and original docs are MIT licensed. Third-party UI notices are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Schedule providers retain rights to their data.
