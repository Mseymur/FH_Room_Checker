import type { RoomNow, ScheduleRow } from "./types";

const UNAVAILABLE = "Schedule unavailable or out of date. Try again later.";

/** Errors carry the HTTP status so 4xx responses are shown as-is and not retried. */
async function readRooms<T>(params: Record<string, string>): Promise<T[]> {
  const response = await fetch(`/api/rooms?${new URLSearchParams(params)}`, { cache: "no-store" });
  if (response.ok) return response.json();
  const body: { error?: unknown } = await response.json().catch(() => ({}));
  const message = response.status < 500 && typeof body.error === "string" ? body.error : UNAVAILABLE;
  throw Object.assign(new Error(message), { status: response.status });
}

export function getRoomsNow(building: string, momentISO: string): Promise<RoomNow[]> {
  return readRooms({ building, moment: momentISO });
}
export function getRoomSchedule(building: string, date: string): Promise<ScheduleRow[]> {
  return readRooms({ building, date });
}
export function getRoomDaySchedule(building: string, date: string, roomId: string): Promise<ScheduleRow[]> {
  return readRooms({ building, date, room: roomId });
}
