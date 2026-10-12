export interface Booking {
  roomId: string;
  start: string;
  end: string;
  title?: string;
}

/** Coverage promises ALL bookings for these rooms and this time range are included. */
export interface ScheduleData {
  updatedAt: string;
  coverage: { start: string; end: string; roomIds: string[] };
  bookings: Booking[];
}

export interface ScheduleRow {
  id: string;
  building: string;
  room_id: string;
  room: string;
  floor: string;
  schedule_date: string;
  start: string;
  end: string;
  status: "FREE" | "BUSY";
  title: string | null;
}

export interface RoomNow extends ScheduleRow { free_until: string }
