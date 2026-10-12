import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { campus } from "../config";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

vi.mock("server-only", () => ({}));
const now = new Date("2026-07-01T08:00:00Z");
const payload = () => ({ updatedAt: now.toISOString(),
  coverage: { start: "2026-07-01T00:00:00Z", end: "2026-07-02T00:00:00Z", roomIds: [campus.rooms[0].id] },
  bookings: [] });

beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(now);
  vi.stubEnv("SCHEDULE_SOURCE", "api");
  vi.stubEnv("SCHEDULE_API_URL", "https://example.invalid/schedule");
  vi.stubEnv("SCHEDULE_API_TOKEN", "synthetic-test-value");
});
afterEach(() => { vi.doUnmock("../config"); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("server provider boundary", () => {
  it("sends credentials only upstream, deduplicates and caches normalized data", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload())));
    vi.stubGlobal("fetch", fetch);
    const { loadSchedule } = await import("./source");
    const [a, b] = await Promise.all([loadSchedule("2026-07-01"), loadSchedule("2026-07-01")]);
    expect(a).toEqual(b); expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer synthetic-test-value");
    expect(fetch.mock.calls[0][1].redirect).toBe("error");
    expect(JSON.stringify(a)).not.toContain("synthetic-test-value");
    await loadSchedule("2026-07-01"); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("refreshes stale cached data and rejects stale or future-dated feeds", async () => {
    vi.doMock("../config", () => ({ campus: { ...campus, cacheSeconds: 3600 } }));
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload())));
    vi.stubGlobal("fetch", fetch);
    const { loadSchedule, assertFresh } = await import("./source");
    await loadSchedule("2026-07-01");
    vi.setSystemTime(new Date(now.getTime() + (campus.maxFeedAgeSeconds + 1) * 1000));
    await expect(loadSchedule("2026-07-01")).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2); // Stale cache was refreshed; the refreshed feed was still stale.
    expect(() => assertFresh({ ...payload(), updatedAt: "2026-07-02T08:00:00Z" }, now.getTime())).toThrow();
  });
  it("loads and validates a server-side JSON file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "room-finder-test-"));
    try {
      const file = join(directory, "schedule.json");
      await writeFile(file, JSON.stringify(payload()));
      vi.stubEnv("SCHEDULE_SOURCE", "file"); vi.stubEnv("SCHEDULE_FILE", file);
      const { loadSchedule } = await import("./source");
      expect((await loadSchedule("2026-07-01")).coverage.roomIds).toEqual([campus.rooms[0].id]);
    } finally { await rm(directory, { recursive: true }); }
  });
  it("does not interpret provider errors or malformed data as free rooms", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response("private-provider-detail", { status: 503 }))
      .mockResolvedValueOnce(new Response('{"bookings":[]}'));
    vi.stubGlobal("fetch", fetch);
    const { loadSchedule } = await import("./source");
    await expect(loadSchedule("2026-07-01")).rejects.toThrow();
    await expect(loadSchedule("2026-07-01")).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("rejects oversized responses before parsing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", {
      headers: { "content-length": String(6 * 1024 * 1024) },
    })));
    const { loadSchedule } = await import("./source");
    await expect(loadSchedule("2026-07-01")).rejects.toThrow("too large");
  });
  it("does not fetch insecure URLs or silently accept unknown source modes", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.stubEnv("SCHEDULE_API_URL", "http://example.invalid/schedule");
    const { loadSchedule } = await import("./source");
    await expect(loadSchedule("2026-07-01")).rejects.toThrow();
    vi.stubEnv("SCHEDULE_SOURCE", "unknown");
    await expect(loadSchedule("2026-07-01")).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
