import { campus } from "./config";
import type { ScheduleRow } from "./types";
import { timeOf } from "./time/countdown";

export interface TimelineSlot {
  id: string;
  status: "FREE" | "BUSY";
  title: string | null;
  startISO: string;
  endISO: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  extendsPast: boolean;
}

/** API intervals are already clamped to the configured opening hours. */
export function processDaySlots(rows: ScheduleRow[], date: string): TimelineSlot[] {
  return rows.filter((r) => r.schedule_date === date).map((r) => {
    const mins = Math.floor((Date.parse(r.end) - Date.parse(r.start)) / 60000);
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    return { id: r.id, status: r.status, title: r.title, startISO: r.start, endISO: r.end,
      startLabel: timeOf(r.start), endLabel: timeOf(r.end),
      durationLabel: hours ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${mins} min`,
      extendsPast: r.status === "FREE" && timeOf(r.end) === campus.openingHours.end };
  }).sort((a, b) => Date.parse(a.startISO) - Date.parse(b.startISO));
}
export function freeSlotText(slot: TimelineSlot): string {
  return slot.extendsPast ? "Free until closing" : `Free for ${slot.durationLabel}`;
}
