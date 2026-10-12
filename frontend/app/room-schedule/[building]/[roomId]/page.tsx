"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Timeline } from "@/components/rooms/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveMoment } from "@/hooks/use-live-moment";
import { useRoomDaySchedule } from "@/hooks/use-rooms";
import { buildingLabel } from "@/lib/buildings";
import { processDaySlots } from "@/lib/schedule";
import { campus } from "@/lib/config";
import { dateOf, isValidDate } from "@/lib/time/countdown";
import { ON_BRAND } from "@/lib/utils";

function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}


function RoomScheduleView() {
  const params = useParams<{ building: string; roomId: string }>();
  const search = useSearchParams();
  const building = params.building;
  const roomId = params.roomId;

  const today = dateOf(new Date().toISOString());
  const [date, setDate] = useState(isValidDate(search.get("date") ?? "") ? search.get("date")! : today);
  const isToday = date === today;

  const { nowISO } = useLiveMoment(); // for the "now" highlight only
  const query = useRoomDaySchedule(building, date, roomId);
  const slots = useMemo(() => processDaySlots(query.data ?? [], date), [query.data, date]);

  const dateLabel = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC", // `date` already represents a campus calendar date.
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col">
      {/* Light: the whole top zone (title + date controls) is a red banner, down to the divider.
          Dark: blends into the canvas (the divider provides the separator). */}
      <header className="bg-brand-gradient text-white dark:bg-none dark:bg-background dark:text-foreground">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Back to overview"
              className="text-white hover:bg-white/15 hover:text-white dark:text-foreground dark:hover:bg-muted/50 dark:hover:text-foreground"
            >
              <Link href="/">
                <ArrowLeft className="size-5" aria-hidden="true" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">{roomId}</h1>
              <p className="text-sm text-white/80 dark:text-muted-foreground">{buildingLabel(building)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous day"
              onClick={() => setDate(addDays(date, -1))}
              className={`size-10 ${ON_BRAND}`}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <label htmlFor="schedule-date" className="sr-only">
              Date
            </label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => isValidDate(e.target.value) && setDate(e.target.value)}
              className={`h-10 flex-1 text-center sm:w-[12rem] sm:flex-none ${ON_BRAND}`}
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Next day"
              onClick={() => setDate(addDays(date, 1))}
              className={`size-10 ${ON_BRAND}`}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <div className="border-border border-t" aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {query.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : query.isError ? (
          <div role="alert" className="bg-destructive/10 text-destructive space-y-2 rounded-md p-4 text-sm">
            <p>{(query.error as Error).message}</p>
            <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        ) : slots.length === 0 ? (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            No complete schedule for {roomId} on {dateLabel}. This room or date is outside
            the feed&apos;s confirmed coverage.
          </div>
        ) : (
          <section aria-label={`Timeline for ${roomId} on ${dateLabel}`}>
            <Timeline slots={slots} nowISO={nowISO} showNow={isToday} />
            <p className="text-muted-foreground mt-3 text-xs">Opening hours {campus.openingHours.start}–{campus.openingHours.end} ({campus.timeZone}).</p>
          </section>
        )}
      </div>
    </div>
  );
}

export default function RoomSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <RoomScheduleView />
    </Suspense>
  );
}
