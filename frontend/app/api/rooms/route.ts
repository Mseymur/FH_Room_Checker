import { campus } from "@/lib/config";
import { loadSchedule } from "@/lib/adapters/source";
import { buildDaySchedule, roomsAtMoment } from "@/lib/availability";
import { dateOf, isValidDate, isValidInstant } from "@/lib/time/countdown";

export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const building = params.get("building");
  const room = params.get("room");
  const moment = params.get("moment");
  const date = params.get("date");
  if (!building || !campus.buildings.some((b) => b.code === building)) {
    return json({ error: "Choose a configured building." }, 400);
  }
  // An extreme offset can move a valid moment into a 5-digit or 1-digit campus year.
  const day = moment && isValidInstant(moment) ? dateOf(moment) : date;
  if ((!moment && !date) || (moment && date) || !day || !isValidDate(day)) {
    return json({ error: "Supply either a valid ISO moment with offset or a YYYY-MM-DD date." }, 400);
  }
  const rooms = campus.rooms.filter((r) => r.building === building && (!room || r.id === room));
  if (room && !rooms.length) return json({ error: "Room not found in this building." }, 404);
  try {
    const data = await loadSchedule(day);
    return json(moment ? roomsAtMoment(data, rooms, moment) : buildDaySchedule(data, rooms, day));
  } catch {
    // Never forward provider response bodies, credentials, file paths or raw exceptions.
    return json({ error: "Schedule unavailable or out of date. Try again later." }, 503);
  }
}
