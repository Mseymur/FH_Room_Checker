import { campus } from "../config";

export type RoomStatus = "FREE" | "SOON" | "BUSY";

export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

export function isValidInstant(iso: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,9})?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(iso);
  return !!m && isValidDate(m[1]) && Number.isFinite(Date.parse(iso)) &&
    !/[+-]14:(?!00)/.test(iso);
}

export function dateOf(iso: string, timeZone = campus.timeZone): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(iso));
  const value = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function timeOf(iso: string, timeZone = campus.timeZone): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso));
}

/** Reject nonexistent or ambiguous local times instead of silently shifting a booking. */
export function wallClockToInstant(date: string, hm: string, timeZone = campus.timeZone): string {
  if (!isValidDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hm)) {
    throw new Error("Choose a valid date and time.");
  }
  const pretendUtc = Date.parse(`${date}T${hm}:00Z`);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const offsets = new Set<number>();
  for (const delta of [-36, -12, 0, 12, 36]) {
    const t = pretendUtc + delta * 3600000;
    const parts = formatter.formatToParts(new Date(t));
    const v = (type: string) => Number(parts.find((p) => p.type === type)!.value);
    const local = new Date(0);
    local.setUTCFullYear(v("year"), v("month") - 1, v("day"));
    local.setUTCHours(v("hour"), v("minute"), v("second"), 0);
    offsets.add(local.getTime() - t);
  }
  const candidates = [...offsets].map((offset) => new Date(pretendUtc - offset).toISOString())
    .filter((iso) => dateOf(iso, timeZone) === date && timeOf(iso, timeZone) === hm);
  if (candidates.length !== 1) {
    throw new Error("This local time is skipped or repeated by a timezone change. Choose another time.");
  }
  return candidates[0];
}

export function deriveMinutesLeft(targetISO: string, momentISO: string): number {
  const remaining = (Date.parse(targetISO) - Date.parse(momentISO)) / 60000;
  return Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : 0;
}

/** A booking that runs until closing never frees the room, so it is never "Available Soon". */
export function deriveStatus(row: { status: string; end: string }, momentISO: string,
  soonThreshold = campus.soonThresholdMinutes): RoomStatus {
  if (row.status === "FREE") return "FREE";
  if (timeOf(row.end) === campus.openingHours.end) return "BUSY";
  return deriveMinutesLeft(row.end, momentISO) <= soonThreshold ? "SOON" : "BUSY";
}
