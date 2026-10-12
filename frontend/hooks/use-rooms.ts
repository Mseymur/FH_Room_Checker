"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getRoomDaySchedule, getRoomSchedule, getRoomsNow } from "@/lib/rooms";

/**
 * Live room snapshot. The query key buckets the moment to the minute, so the ~10s live tick
 * (which drives the client-side status, not refetches) fetches at most once a minute.
 * Previous results stay on screen while the next minute loads. Pass a fixed moment for time-travel.
 */
export function useRoomsNow(building: string | null, momentISO: string) {
  const minuteBucket = momentISO.slice(0, 16); // YYYY-MM-DDTHH:MM
  return useQuery({
    queryKey: ["rooms-now", building, minuteBucket],
    queryFn: () => getRoomsNow(building as string, momentISO),
    enabled: !!building,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Full day schedule for a building + campus date (stable while the user views that day). */
export function useRoomSchedule(building: string | null, date: string) {
  return useQuery({
    queryKey: ["room-schedule", building, date],
    queryFn: () => getRoomSchedule(building as string, date),
    enabled: !!building && !!date,
    staleTime: 5 * 60_000,
  });
}

/** One room's day timeline (room-schedule page). */
export function useRoomDaySchedule(building: string, date: string, roomId: string) {
  return useQuery({
    queryKey: ["room-day-schedule", building, date, roomId],
    queryFn: () => getRoomDaySchedule(building, date, roomId),
    staleTime: 5 * 60_000,
  });
}
