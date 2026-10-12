import { CheckCircle2, Clock, Lock } from "lucide-react";

import { RoomCard } from "@/components/rooms/room-card";
import type { RoomNow } from "@/lib/types";
import type { RoomStatus } from "@/lib/time/countdown";

const ICONS: Record<RoomStatus, typeof CheckCircle2> = {
  FREE: CheckCircle2,
  SOON: Clock,
  BUSY: Lock,
};

export function RoomSection({
  title,
  status,
  rooms,
  reasons,
  building,
  date,
  limit,
}: {
  title: string;
  status: RoomStatus;
  rooms: RoomNow[];
  reasons: Map<string, string | undefined>;
  building: string;
  date: string;
  limit?: number;
}) {
  if (rooms.length === 0) return null;

  const headingId = `section-${status.toLowerCase()}`;
  const Icon = ICONS[status];
  const shown = limit ? rooms.slice(0, limit) : rooms;
  const moreCount = rooms.length - shown.length;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id={headingId} className="text-foreground flex items-center gap-2 text-lg font-bold">
          <Icon className="size-5" aria-hidden="true" />
          {title}
        </h2>
        <span className="border-muted-foreground/40 bg-secondary text-secondary-foreground inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[0.8125rem] font-semibold tabular-nums">
          {rooms.length}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {shown.map((row) => (
          <li key={row.room_id}>
            <RoomCard
              row={row}
              status={status}
              building={building}
              date={date}
              reason={reasons.get(row.room_id)}
            />
          </li>
        ))}
      </ul>

      {moreCount > 0 && (
        <p className="text-muted-foreground mt-3 text-center text-sm font-medium">
          + {moreCount} more busy room{moreCount === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}
