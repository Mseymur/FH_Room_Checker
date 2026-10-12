import { campus } from "../config";
import { wallClockToInstant } from "../time/countdown";
import type { ScheduleData } from "../types";

/** Entirely fictional bookings, generated for the chosen campus date. */
export function demoSchedule(date: string): ScheduleData {
  const start = wallClockToInstant(date, campus.openingHours.start);
  const end = wallClockToInstant(date, campus.openingHours.end);
  const from = Date.parse(start);
  const duration = Date.parse(end) - from;
  return {
    updatedAt: new Date().toISOString(),
    coverage: { start, end, roomIds: campus.rooms.map((r) => r.id) },
    bookings: campus.rooms.filter((_, i) => i % 3 !== 0).flatMap((room, i) =>
      [[0.1 + (i % 2) * 0.08, 0.4], [0.55, 0.8]].map(([s, e]) => ({
        roomId: room.id, start: new Date(from + duration * s).toISOString(),
        end: new Date(from + duration * e).toISOString(), title: "Example booking",
      }))),
  };
}
