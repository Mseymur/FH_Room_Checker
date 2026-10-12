import { describe, expect, it } from "vitest";
import { campus } from "./config";
import { buildDaySchedule, roomsAtMoment } from "./availability";
import type { Booking, ScheduleData } from "./types";

const date = "2026-07-01";
const room = campus.rooms[0];
const at = (hm: string) => `${date}T${hm}:00Z`;
const booking = (start: string, end: string): Booking => ({ roomId: room.id, start: at(start), end: at(end) });
const data = (bookings: Booking[] = []): ScheduleData => ({ updatedAt: at("08:00"),
  coverage: { start: at("00:00"), end: `${date}T23:59:59Z`, roomIds: [room.id] }, bookings });
const options = { ...campus, timeZone: "UTC", showBookingTitles: false,
  openingHours: { start: "08:00", end: "18:00" } };
const summary = (d: ScheduleData) => buildDaySchedule(d, [room], date, options)
  .map((s) => [s.status, s.start.slice(11, 16), s.end.slice(11, 16)]);

describe("free gaps from occupied bookings", () => {
  it("creates an all-day free interval only for a fully covered empty room", () => {
    expect(summary(data())).toEqual([["FREE", "08:00", "18:00"]]);
    const incomplete = data(); incomplete.coverage.roomIds = [];
    expect(summary(incomplete)).toEqual([]);
    incomplete.coverage.roomIds = [room.id]; incomplete.coverage.start = at("09:00");
    expect(summary(incomplete)).toEqual([]);
    incomplete.coverage.start = at("00:00"); incomplete.coverage.end = at("17:00");
    expect(summary(incomplete)).toEqual([]);
  });
  it("sorts, merges overlaps, duplicates and adjacent bookings", () => {
    expect(summary(data([booking("11:00", "12:00"), booking("09:00", "10:00"),
      booking("09:00", "10:00"), booking("09:30", "11:00")]))).toEqual([
      ["FREE", "08:00", "09:00"], ["BUSY", "09:00", "12:00"], ["FREE", "12:00", "18:00"],
    ]);
  });
  it("clips overnight bookings and excludes bookings outside opening hours", () => {
    expect(summary(data([{ roomId: room.id, start: "2026-06-30T23:00:00Z", end: at("09:00") },
      booking("17:00", "20:00"), booking("01:00", "02:00")]))).toEqual([
      ["BUSY", "08:00", "09:00"], ["FREE", "09:00", "17:00"], ["BUSY", "17:00", "18:00"],
    ]);
  });
  it("uses exact start/end boundaries and returns nothing outside opening hours", () => {
    const d = data([booking("09:00", "10:00")]);
    expect(roomsAtMoment(d, [room], at("09:00"), options)[0].status).toBe("BUSY");
    expect(roomsAtMoment(d, [room], at("10:00"), options)[0].status).toBe("FREE");
    expect(roomsAtMoment(d, [room], at("07:59"), options)).toEqual([]);
    expect(roomsAtMoment(d, [room], at("18:00"), options)).toEqual([]);
  });
  it("keeps rooms isolated and hides booking titles by default", () => {
    const d = data([{ ...booking("09:00", "10:00"), title: "Example title" }]);
    const other = { ...room, id: "fictional-other-room", number: "R2" }; d.coverage.roomIds.push(other.id);
    const slots = buildDaySchedule(d, [room, other], date, options);
    expect(slots.filter((s) => s.room_id === other.id).map((s) => s.status)).toEqual(["FREE"]);
    expect(slots.every((s) => s.title === null)).toBe(true);
  });
});
