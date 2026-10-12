# Prompt for adapting a university feed

Give your coding assistant this repository, provider documentation, and a **redacted or fictional**
sample response. Keep credentials in your local/host environment; do not paste tokens or personal
records into the prompt. Replace the bracketed fields below.

```text
Adapt this Campus Room Finder repository to my university's timetable source.

Public app name: [name]
IANA timezone: [timezone]
Opening hours: [start/end]
Buildings and public room catalogue: [codes, labels, room IDs, floors, numbers]
Provider format and documentation: [JSON/CSV/XML/iCalendar and docs]
Redacted sample payload: [sample]
Authentication mechanism, without credentials: [none/bearer/custom]
Pagination, coverage and cancellation rules: [documented behavior]

Read README.md, docs/ADAPTERS.md, docs/SETUP.md, frontend/campus.config.json,
frontend/lib/adapters/{source,normalize}.ts, frontend/lib/availability.ts and
frontend/lib/time/countdown.ts before changing code.

Keep the room UI and canonical ScheduleData contract reusable. Put provider-specific
fetching/parsing/mapping inside lib/adapters. Change campus.config.json only for
public campus settings/catalogue. Keep URLs, tokens and paths server-only; never
use NEXT_PUBLIC_ for provider credentials or put secrets in code, tests or docs.

Fetch all necessary pages before asserting coverage. Explicitly map room IDs.
Expand bounded recurrence and apply cancellations/exceptions and multi-room events.
Use offset-aware timestamps; resolve the provider timezone and DST rules. Missing
pages or uncertain records must not become an empty schedule or false FREE rooms.
Do not infer complete room coverage from event presence. Do not hardcode credentials.

Copy only roomId/start/end and optionally approved public titles. Drop instructor,
student, contact, attendance, group and other raw data. Keep titles disabled unless
I explicitly request them. Never forward raw payloads or upstream errors to clients.

Use the existing interval engine to merge overlap/adjacency and derive free gaps.
If the source needs a parser, add the smallest maintained dependency appropriate
to the format and explain it. If provider documentation cannot establish coverage
or timezone, ask me for that specific missing information before declaring success.

Add fictional tests for mapping, cancellations/recurrence where applicable,
timezone/DST, full/partial coverage, malformed records, upstream failures, and
secret/personal-field exclusion. Run lint, typecheck, tests and a production build.
Verify the building -> overview -> room timeline flow against the adapted source.
Run python3 scripts/release.py --check from the repository root.

Return the changed files, exact environment variable NAMES, setup steps, test
results and any remaining provider limitation. Never print credential values.
```
