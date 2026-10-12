# Security

Use the repository host's private vulnerability reporting feature if the maintainer enables it.
Otherwise request a private reporting channel without posting exploit details in a public issue.
Do not include credentials, private provider responses, or personal data in reports.

Provider URLs, bearer tokens and file paths are server environment variables. Never prefix them
with `NEXT_PUBLIC_`, put them in `campus.config.json`, or expose the raw provider payload to the
browser. The normalization layer copies only approved room/timing fields; booking titles are
opt-in. The public API serves availability and timelines without an authentication requirement,
so connect it only to data you are permitted to publish.

The server rejects malformed, stale and oversized feeds and does not follow API redirects.
Browser requests stay on the app's origin. The CSP permits inline scripts/styles required by
the current UI; it is not a nonce-based policy. Production responses send HSTS; configure HTTPS
and any rate limits at your host.

Run `npm audit` regularly and review dependency updates. If a credential was ever published,
revoke or rotate it before cleaning files or Git history. Deleting the file does not revoke it.
The included source scan catches common patterns, not every possible secret.
