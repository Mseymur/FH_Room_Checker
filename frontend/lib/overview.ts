// Pure UI helpers for the overview dashboard (sorting + search). Time logic lives in
// lib/time/countdown.ts — this only orders/filters rooms.

import type { RoomNow, ScheduleRow } from "@/lib/types";
import { deriveMinutesLeft, type RoomStatus } from "@/lib/time/countdown";

export function isGroundFloor(floor: string): boolean {
  return ["G", "GF", "0"].includes(floor.toUpperCase());
}

/** Floor ordering: ground floor first, then numbered floors ascending, then anything else (e.g. U1). */
export function floorRank(floor: string): number {
  if (isGroundFloor(floor)) return 0;
  const n = Number.parseInt(floor, 10);
  return Number.isNaN(n) ? 1000 : n;
}

/**
 * Section sort :
 *  - FREE: minutes_left DESC (most time first), then floor (ground floor first), then room number.
 *  - SOON/BUSY: minutes-until-free ASC (soonest first), then floor, then room number.
 */
export function compareRooms(
  a: RoomNow,
  b: RoomNow,
  momentISO: string,
  section: RoomStatus,
): number {
  const ma = deriveMinutesLeft(a.end, momentISO);
  const mb = deriveMinutesLeft(b.end, momentISO);
  if (section === "FREE") {
    if (mb !== ma) return mb - ma;
  } else if (ma !== mb) {
    return ma - mb;
  }
  const fa = floorRank(a.floor);
  const fb = floorRank(b.floor);
  if (fa !== fb) return fa - fb;
  return a.room.localeCompare(b.room, undefined, { numeric: true });
}

export interface SearchMatch {
  matched: boolean;
  /** Human-readable "why it matched" reasons (room code / booking title). */
  reasons: string[];
}

/**
 * Advanced search : a room matches if its code/number matches, OR any of its
 * slots that day match by booking title. Returns the reasons so the UI can show why.
 */
export function matchRoom(
  roomId: string,
  roomNumber: string,
  query: string,
  scheduleByRoom: Map<string, ScheduleRow[]>,
): SearchMatch {
  const q = query.trim().toLowerCase();
  if (!q) return { matched: true, reasons: [] };

  const reasons: string[] = [];
  if (roomId.toLowerCase().includes(q) || roomNumber.toLowerCase().includes(q)) {
    reasons.push(`room ${roomId}`);
  }
  for (const slot of scheduleByRoom.get(roomId) ?? []) {
    if (slot.status === "BUSY" && slot.title && slot.title.toLowerCase().includes(q)) {
      reasons.push(`booking: ${slot.title}`);
    }
  }
  const unique = [...new Set(reasons)];
  return { matched: unique.length > 0, reasons: unique };
}
