export type HttpHeader = { key: string; value: string };

/** The browser only talks to its own origin; provider credentials stay on the server. */
export function buildSecurityHeaders({ isDev }: { isDev: boolean }): HttpHeader[] {
  return [
    { key: "Content-Security-Policy", value: [
      "default-src 'self'", "base-uri 'self'", "object-src 'none'",
      "frame-ancestors 'none'", "form-action 'self'", "img-src 'self' data: blob:",
      "font-src 'self' data:", "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      `connect-src 'self'${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
    ].join("; ") },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    // Browsers ignore HSTS over plain HTTP, so this is inert for local `npm start`.
    ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  ];
}
