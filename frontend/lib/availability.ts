import { campus, type Room } from "./config";
import { dateOf, timeOf, wallClockToInstant } from "./time/countdown";
import type { RoomNow, ScheduleData, ScheduleRow } from "./types";

/** Clip, sort and union occupied intervals. Gaps in a COMPLETE day become free intervals. */
export function buildDaySchedule(data: ScheduleData, rooms: Room[], date: string,
  options = campus): ScheduleRow[] {
  const start = Date.parse(wallClockToInstant(date, options.openingHours.start, options.timeZone));
  const end = Date.parse(wallClockToInstant(date, options.openingHours.end, options.timeZone));
  if (Date.parse(data.coverage.start) > start || Date.parse(data.coverage.end) < end) return [];
  const covered = new Set(data.coverage.roomIds);
  const bookingsByRoom = Map.groupBy(data.bookings, (b) => b.roomId);
  return rooms.filter((r) => covered.has(r.id)).flatMap((room) => {
    const intervals = (bookingsByRoom.get(room.id) ?? [])
      .map((b) => ({ start: Math.max(start, Date.parse(b.start)),
        end: Math.min(end, Date.parse(b.end)), title: b.title ?? null }))
      .filter((b) => b.start < b.end).sort((a, b) => a.start - b.start);
    const busy: typeof intervals = [];
    for (const interval of intervals) {
      const previous = busy.at(-1);
      if (previous && interval.start <= previous.end) {
        previous.end = Math.max(previous.end, interval.end);
        previous.title = previous.title === interval.title ? previous.title : null;
      } else busy.push({ ...interval });
    }
    const slots: ScheduleRow[] = [];
    function add(s: number, e: number, status: "FREE" | "BUSY", title: string | null = null) {
      if (s >= e) return;
      slots.push({ id: `${room.id}-${s}`, building: room.building,
        room_id: room.id, room: room.number, floor: room.floor, schedule_date: date,
        start: new Date(s).toISOString(), end: new Date(e).toISOString(), status,
        title: options.showBookingTitles ? title : null });
    }
    let cursor = start;
    for (const b of busy) {
      add(cursor, b.start, "FREE");
      add(b.start, b.end, "BUSY", b.title);
      cursor = b.end;
    }
    add(cursor, end, "FREE");
    return slots;
  });
}

/** Half-open intervals: the booking is active at start, and inactive at end. */
export function roomsAtMoment(data: ScheduleData, rooms: Room[], moment: string,
  options = campus): RoomNow[] {
  const ms = Date.parse(moment);
  return buildDaySchedule(data, rooms, dateOf(moment, options.timeZone), options)
    .filter((s) => Date.parse(s.start) <= ms && ms < Date.parse(s.end))
    .map((s) => ({ ...s, free_until: timeOf(s.end, options.timeZone) }));
}
