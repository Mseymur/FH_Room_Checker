import { describe, expect, it } from "vitest";
import { campus } from "../config";
import { dateOf, wallClockToInstant, deriveMinutesLeft, deriveStatus, isValidDate, isValidInstant } from "./countdown";

describe("campus time", () => {
  it("converts dates and instants in positive and negative offset zones", () => {
    expect(wallClockToInstant("2026-07-01", "18:00", "Europe/Berlin")).toBe("2026-07-01T16:00:00.000Z");
    expect(wallClockToInstant("2026-01-01", "18:00", "Europe/Berlin")).toBe("2026-01-01T17:00:00.000Z");
    expect(wallClockToInstant("2026-07-01", "08:00", "America/New_York")).toBe("2026-07-01T12:00:00.000Z");
    expect(wallClockToInstant("2026-07-01", "08:00", "Asia/Kolkata")).toBe("2026-07-01T02:30:00.000Z");
    expect(dateOf("2026-07-01T23:30:00Z", "Europe/Berlin")).toBe("2026-07-02");
  });
  it("rejects skipped and repeated local times at DST changes", () => {
    expect(() => wallClockToInstant("2026-03-29", "02:30", "Europe/Berlin")).toThrow();
    expect(() => wallClockToInstant("2026-10-25", "02:30", "Europe/Berlin")).toThrow();
    expect(wallClockToInstant("2026-03-29", "08:00", "Europe/Berlin")).toBe("2026-03-29T06:00:00.000Z");
  });
  it("rejects invalid calendar dates and offset-free provider timestamps", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidInstant("2026-02-30T09:00:00Z")).toBe(false);
    expect(isValidInstant("2026-07-01T09:00:00")).toBe(false);
    expect(isValidInstant("2026-07-01T09:00:00+05:30")).toBe(true);
    expect(isValidInstant("2026-07-01T09:00:00+14:30")).toBe(false);
    expect(isValidInstant("2026-07-01T09:00:00.123456+00:00")).toBe(true); // Python isoformat()
  });
});

describe("availability countdown", () => {
  it("floors whole minutes and clamps invalid or past values", () => {
    expect(deriveMinutesLeft("2026-07-01T09:00:59Z", "2026-07-01T08:00:00Z")).toBe(60);
    expect(deriveMinutesLeft("invalid", "2026-07-01T08:00:00Z")).toBe(0);
    expect(deriveMinutesLeft("2026-07-01T07:00:00Z", "2026-07-01T08:00:00Z")).toBe(0);
  });
  it("changes BUSY to SOON at the configured threshold", () => {
    const row = { status: "BUSY", start: "2026-07-01T08:00:00Z", end: "2026-07-01T10:00:00Z" };
    expect(deriveStatus(row, "2026-07-01T09:29:00Z", 30)).toBe("BUSY");
    expect(deriveStatus(row, "2026-07-01T09:30:00Z", 30)).toBe("SOON");
  });
  it("keeps a room booked until closing BUSY instead of SOON", () => {
    const closing = wallClockToInstant("2026-07-01", campus.openingHours.end);
    const row = { status: "BUSY", end: closing };
    expect(deriveStatus(row, new Date(Date.parse(closing) - 60_000).toISOString(), 30)).toBe("BUSY");
  });
});
