"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { BuildingSwitcher } from "@/components/overview/building-switcher";
import { FloorChips } from "@/components/overview/floor-chips";
import { MomentDialog } from "@/components/overview/moment-dialog";
import { RoomSection } from "@/components/overview/room-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveMoment } from "@/hooks/use-live-moment";
import { useRoomSchedule, useRoomsNow } from "@/hooks/use-rooms";
import { useSelectedBuilding } from "@/hooks/use-selected-building";
import { buildingLabel } from "@/lib/buildings";
import { campus } from "@/lib/config";
import { compareRooms, floorRank, matchRoom } from "@/lib/overview";
import {
  deriveStatus,
  dateOf,
  timeOf,
  wallClockToInstant,
} from "@/lib/time/countdown";
import type { RoomNow } from "@/lib/types";
import { ON_BRAND } from "@/lib/utils";

const BUSY_LIMIT = 8;

const PILL = `h-12 rounded-xl ${ON_BRAND}`;

export default function OverviewPage() {
  const router = useRouter();
  const { code, select, hydrated } = useSelectedBuilding();

  useEffect(() => {
    if (hydrated && !code) router.replace("/welcome");
  }, [hydrated, code, router]);

  const [fixedISO, setFixedISO] = useState<string | null>(null);
  const [travel, setTravel] = useState(() => {
    const iso = new Date().toISOString();
    return { date: dateOf(iso), time: timeOf(iso) };
  });
  const { nowISO, isLive } = useLiveMoment({ fixedISO });

  /** Returns false (and keeps the dialog open) for a time skipped or repeated by DST. */
  function handleFixed(date: string, time: string): boolean {
    try {
      setFixedISO(wallClockToInstant(date, time));
      setTravel({ date, time });
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  }
  function handleNow() {
    setFixedISO(null);
    const iso = new Date().toISOString();
    setTravel({ date: dateOf(iso), time: timeOf(iso) });
  }

  const building = code ?? "";
  const now = useRoomsNow(building || null, nowISO);
  // The day schedule is only needed to search booking titles.
  const schedule = useRoomSchedule(campus.showBookingTitles && building ? building : null, dateOf(nowISO));

  useEffect(() => {
    if (schedule.isError) toast.error((schedule.error as Error).message);
  }, [schedule.isError, schedule.error]);

  const [floor, setFloor] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => (now.data ?? []).filter((r) =>
    Date.parse(r.start) <= Date.parse(nowISO) && Date.parse(r.end) > Date.parse(nowISO)), [now.data, nowISO]);
  const floors = useMemo(
    () => [...new Set(rows.map((r) => r.floor))].sort((a, b) => floorRank(a) - floorRank(b)),
    [rows],
  );
  // ponytail: Map.groupBy needs Safari 17.4+/Chrome 117+; add a manual loop if older browsers matter.
  const scheduleByRoom = useMemo(() => Map.groupBy(schedule.data ?? [], (r) => r.room_id), [schedule.data]);
  // A floor picked in another building falls back to "all".
  const activeFloor = floors.includes(floor) ? floor : "all";

  const { rooms: visible, reasons } = useMemo(() => {
    const reasons = new Map<string, string | undefined>();
    const rooms = rows.filter((r) => {
      if (activeFloor !== "all" && r.floor !== activeFloor) return false;
      const match = matchRoom(r.room_id, r.room, query, scheduleByRoom);
      if (!match.matched) return false;
      reasons.set(r.room_id, match.reasons[0]);
      return true;
    });
    return { rooms, reasons };
  }, [rows, activeFloor, query, scheduleByRoom]);

  const sections = useMemo(() => {
    const free: RoomNow[] = [];
    const soon: RoomNow[] = [];
    const busy: RoomNow[] = [];
    for (const r of visible) {
      const s = deriveStatus(r, nowISO);
      if (s === "FREE") free.push(r);
      else if (s === "SOON") soon.push(r);
      else busy.push(r);
    }
    free.sort((a, b) => compareRooms(a, b, nowISO, "FREE"));
    soon.sort((a, b) => compareRooms(a, b, nowISO, "SOON"));
    busy.sort((a, b) => compareRooms(a, b, nowISO, "BUSY"));
    return { free, soon, busy };
  }, [visible, nowISO]);

  if (!hydrated || !code) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const triggerLabel = isLive
    ? `Now · ${timeOf(nowISO)}`
    : `${travel.date} ${travel.time}`;
  const day = dateOf(nowISO);

  return (
    <div className="flex flex-1 flex-col">
      {/* Light: red gradient controls header. Dark: blends into the canvas (no banner). */}
      <header className="bg-brand-gradient text-white shadow-sm dark:bg-none dark:bg-background dark:text-foreground dark:border-border dark:border-b dark:shadow-none">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4">
          <div className="flex items-stretch gap-3">
            <div className="min-w-0 flex-1">
              <BuildingSwitcher
                value={building}
                onChange={select}
                triggerClassName={`w-full data-[size=default]:h-12 font-semibold data-[placeholder]:text-white/80 [&_svg]:text-white dark:data-[placeholder]:text-muted-foreground dark:[&_svg]:text-muted-foreground ${PILL}`}
              />
            </div>
            <MomentDialog
              triggerLabel={triggerLabel}
              dateValue={travel.date}
              timeValue={travel.time}
              onNow={handleNow}
              onApply={handleFixed}
              triggerClassName={`shrink-0 justify-start font-semibold ${PILL}`}
            />
          </div>

          <div className="relative">
            <label htmlFor="room-search" className="sr-only">
              {campus.showBookingTitles ? "Search rooms or booking titles" : "Search rooms"}
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/80 dark:text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="room-search"
              type="search"
              placeholder="Search rooms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${PILL} pl-9 font-medium placeholder:text-white/80 dark:placeholder:text-muted-foreground`}
            />
          </div>

          <FloorChips floors={floors} value={activeFloor} onChange={setFloor} />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {now.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : now.isError ? (
          <div role="alert" className="bg-destructive/10 text-destructive space-y-2 rounded-md p-4 text-sm">
            <p>{(now.error as Error).message}</p>
            <Button size="sm" variant="outline" onClick={() => void now.refetch()}>
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed bg-card p-8 text-center text-sm">
            No complete schedule for {buildingLabel(building)} at this time. It may be outside
            opening hours or feed coverage. Try another building or date.
          </div>
        ) : visible.length === 0 ? (
          <div className="border-border text-muted-foreground rounded-2xl border bg-card p-10 text-center">
            <p className="text-foreground text-lg font-bold">No rooms match your filters</p>
            <p className="mt-1 text-sm">Try adjusting your search or floor.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("");
                setFloor("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8" aria-live="polite">
            <RoomSection
              title="Available"
              status="FREE"
              rooms={sections.free}
              reasons={reasons}
              building={building}
              date={day}
            />
            <RoomSection
              title="Available Soon"
              status="SOON"
              rooms={sections.soon}
              reasons={reasons}
              building={building}
              date={day}
            />
            <RoomSection
              title="Busy"
              status="BUSY"
              rooms={sections.busy}
              reasons={reasons}
              building={building}
              date={day}
              limit={BUSY_LIMIT}
            />
          </div>
        )}
      </div>
    </div>
  );
}
