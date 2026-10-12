# Frontend and schedule API

This folder contains the complete Next.js app. See the [project README](../README.md) for the
quick start, [setup](../docs/SETUP.md) for configuration/deployment, and
[adapters](../docs/ADAPTERS.md) for connecting a timetable.

```sh
npm ci
npm run dev
```

No environment variables are needed for demo mode. `campus.config.json` is public configuration;
`.env.local` stores server-only provider settings. Restart the server after changing either.

The main layers are `app/` (pages and the room API), `components/` (UI), `lib/adapters/` (data
loading and mapping), `lib/availability.ts` (interval logic), and `lib/time/` (timezone/countdowns).

Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
With a server running, `npm run test:e2e` checks the default demo UI using Playwright.
Install its browser first with `npx playwright install chromium`.
