import rawConfig from "../campus.config.json";

export interface Room { id: string; building: string; floor: string; number: string }

function validateConfig() {
  const c = rawConfig;
  const hm = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!c.name.trim() || !hm.test(c.openingHours.start) || !hm.test(c.openingHours.end) ||
      c.openingHours.start >= c.openingHours.end) {
    throw new Error("Configure a name and same-day opening hours in campus.config.json.");
  }
  new Intl.DateTimeFormat("en", { timeZone: c.timeZone });
  for (const [value, min, max] of [
    [c.soonThresholdMinutes, 0, 1440], [c.cacheSeconds, 0, 3600],
    [c.maxFeedAgeSeconds, 1, 86400],
  ]) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error("Invalid time limits in campus.config.json.");
    }
  }
  if (typeof c.showBookingTitles !== "boolean" || !c.buildings.length || !c.rooms.length) {
    throw new Error("Configure buildings, rooms and showBookingTitles in campus.config.json.");
  }
  const codes = new Set<string>();
  const ids = new Set<string>();
  for (const b of c.buildings) {
    if (!/^[A-Za-z0-9_-]+$/.test(b.code) || codes.has(b.code) || !b.label.trim()) {
      throw new Error("Buildings need unique URL-safe codes and labels.");
    }
    codes.add(b.code);
  }
  for (const r of c.rooms) {
    if (!/^[A-Za-z0-9_.-]+$/.test(r.id) || ids.has(r.id) || !codes.has(r.building) ||
        !r.floor.trim() || !r.number.trim()) {
      throw new Error("Rooms need unique URL-safe IDs, a configured building, floor and number.");
    }
    ids.add(r.id);
  }
  return c;
}

/** Public presentation/catalogue settings only. Credentials belong in server environment variables. */
export const campus = validateConfig();
