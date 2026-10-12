import { campus } from "../config";
import { isValidInstant } from "../time/countdown";
import type { Booking, ScheduleData } from "../types";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}
function instant(value: unknown): string {
  if (typeof value !== "string" || !isValidInstant(value)) {
    throw new Error("Timestamps must be valid ISO 8601 instants with seconds and a UTC offset.");
  }
  return new Date(value).toISOString();
}

/** Adapt a provider payload here. Copy approved fields only; never spread raw records. */
export function normalizeSchedule(input: unknown): ScheduleData {
  const raw = object(input);
  const c = object(raw.coverage);
  const start = instant(c.start);
  const end = instant(c.end);
  if (Date.parse(start) >= Date.parse(end)) throw new Error("Coverage must have a positive duration.");
  if (!Array.isArray(c.roomIds) || !Array.isArray(raw.bookings)) {
    throw new Error("Coverage roomIds and bookings must be arrays.");
  }
  if (raw.bookings.length > 50000) throw new Error("Too many bookings; request a smaller schedule window.");
  const configured = new Set(campus.rooms.map((r) => r.id));
  const roomIds = c.roomIds.map((id) => {
    if (typeof id !== "string" || !configured.has(id)) throw new Error("Coverage contains an unconfigured room.");
    return id;
  });
  if (new Set(roomIds).size !== roomIds.length) throw new Error("Coverage contains duplicate rooms.");
  const covered = new Set(roomIds);
  const bookings: Booking[] = raw.bookings.map((value) => {
    const b = object(value);
    if (typeof b.roomId !== "string" || !covered.has(b.roomId)) {
      throw new Error("Every booking must belong to a covered, configured room.");
    }
    const bStart = instant(b.start);
    const bEnd = instant(b.end);
    if (Date.parse(bStart) >= Date.parse(bEnd)) throw new Error("Bookings must have a positive duration.");
    if (b.title !== undefined && (typeof b.title !== "string" || b.title.length > 200)) {
      throw new Error("Booking titles must be strings of at most 200 characters.");
    }
    return { roomId: b.roomId, start: bStart, end: bEnd,
      ...(campus.showBookingTitles && typeof b.title === "string" ? { title: b.title } : {}) };
  });
  return { updatedAt: instant(raw.updatedAt), coverage: { start, end, roomIds }, bookings };
}
