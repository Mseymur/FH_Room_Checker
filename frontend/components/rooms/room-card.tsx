import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { RoomNow } from "@/lib/types";
import type { RoomStatus } from "@/lib/time/countdown";

// Duration badge: one pill on the right. FREE → "Free until HH:MM", otherwise "Busy until HH:MM".
function badge(row: RoomNow, status: RoomStatus): { text: string; cls: string } {
  if (status === "FREE") {
    return {
      text: `Free until ${row.free_until}`,
      cls: "bg-free-tint text-free-tint-foreground border-free/40",
    };
  }
  return {
    text: `Busy until ${row.free_until}`,
    cls:
      status === "SOON"
        ? "bg-soon-tint text-soon-tint-foreground border-soon/50"
        : "bg-busy-tint text-busy-tint-foreground border-busy/40",
  };
}

export function RoomCard({
  row,
  status,
  building,
  date,
  reason,
}: {
  row: RoomNow;
  status: RoomStatus;
  building: string;
  date: string;
  reason?: string;
}) {
  const { text, cls } = badge(row, status);
  const accent =
    status === "FREE" ? "border-l-free" : status === "SOON" ? "border-l-soon" : "border-l-busy";

  return (
    <Link
      href={`/room-schedule/${encodeURIComponent(building)}/${encodeURIComponent(row.room_id)}?date=${date}`}
      aria-label={`Room ${row.room_id}. ${text}. View schedule.`}
      className={`bg-card border-border focus-visible:ring-ring relative flex min-h-14 items-center justify-between gap-3 rounded-xl border border-l-[6px] py-2.5 pr-9 pl-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${accent}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-base font-bold tracking-tight">{row.room_id}</p>
        {reason && (
          <p className="text-primary truncate text-xs font-medium" title={reason}>
            matches {reason}
          </p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${cls}`}
      >
        {text}
      </span>
      <ChevronRight
        className="text-foreground/70 absolute top-1/2 right-3 size-5 -translate-y-1/2"
        aria-hidden="true"
      />
    </Link>
  );
}
