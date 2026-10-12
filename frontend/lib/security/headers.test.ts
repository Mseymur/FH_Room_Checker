import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "./headers";

describe("browser security headers", () => {
  it("restricts production connections and scripts to the application", () => {
    const headers = Object.fromEntries(buildSecurityHeaders({ isDev: false }).map((h) => [h.key, h.value]));
    expect(headers["Content-Security-Policy"]).toContain("connect-src 'self'");
    expect(headers["Content-Security-Policy"]).not.toContain("unsafe-eval");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
  });
  it("omits HSTS in development", () => {
    expect(buildSecurityHeaders({ isDev: true }).some((h) => h.key === "Strict-Transport-Security")).toBe(false);
  });
});
