import { describe, expect, it, vi } from "vitest";
import { campus } from "../config";
import { normalizeSchedule } from "./normalize";

vi.mock("../config", async (importOriginal) => {
  const original = await importOriginal<typeof import("../config")>();
  return { ...original, campus: { ...original.campus, showBookingTitles: false } };
});

const roomId = campus.rooms[0].id;
function sample() { return { updatedAt: "2026-07-01T08:00:00Z",
  coverage: { start: "2026-07-01T00:00:00Z", end: "2026-07-02T00:00:00Z", roomIds: [roomId] },
  bookings: [{ roomId, start: "2026-07-01T09:00:00Z", end: "2026-07-01T10:00:00Z" }] }; }

describe("feed validation and minimization", () => {
  it("copies only approved fields and drops titles by default", () => {
    const input = sample();
    const normalized = normalizeSchedule({ ...input, students: ["Fictional Student"], bookings: [
      { ...input.bookings[0], title: "Example title", instructor: "Fictional Instructor", internalId: "example" },
    ] });
    expect(Object.keys(normalized)).toEqual(["updatedAt", "coverage", "bookings"]);
    expect(Object.keys(normalized.bookings[0])).toEqual(["roomId", "start", "end"]);
  });
  it("rejects missing coverage, invalid timestamps and reversed bookings", () => {
    expect(() => normalizeSchedule({ bookings: [] })).toThrow();
    const input = sample(); input.bookings[0].start = "2026-07-01T09:00:00";
    expect(() => normalizeSchedule(input)).toThrow();
    input.bookings[0].start = "2026-07-01T11:00:00Z";
    expect(() => normalizeSchedule(input)).toThrow();
  });
  it("rejects unconfigured and uncovered rooms", () => {
    const input = sample(); input.bookings[0].roomId = "UNKNOWN";
    expect(() => normalizeSchedule(input)).toThrow();
    input.bookings[0].roomId = roomId; input.coverage.roomIds = [];
    expect(() => normalizeSchedule(input)).toThrow();
  });
});
