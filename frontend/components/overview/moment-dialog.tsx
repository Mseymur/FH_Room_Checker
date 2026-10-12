"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const pad = (n: number) => String(n).padStart(2, "0");
/** The calendar returns local midnight; format it as YYYY-MM-DD without a date library. */
const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Date/time picker: a trigger showing the selected moment that opens a calendar + time
// modal with Cancel / Now / Apply. "Now" returns to the live-ticking mode.
export function MomentDialog({
  triggerLabel,
  dateValue,
  timeValue,
  onNow,
  onApply,
  triggerClassName,
}: {
  triggerLabel: string;
  dateValue: string;
  timeValue: string;
  onNow: () => void;
  /** Returns false to keep the dialog open, e.g. for a time skipped by DST. */
  onApply: (date: string, time: string) => boolean;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(dateValue);
  const [t, setT] = useState(timeValue);

  function handleOpenChange(next: boolean) {
    if (next) {
      setD(dateValue);
      setT(timeValue);
    }
    setOpen(next);
  }

  const selectedDate = d ? new Date(`${d}T00:00:00`) : undefined;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          <CalendarClock className="size-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Date &amp; time</DialogTitle>
          <DialogDescription>View room availability at a chosen moment.</DialogDescription>
        </DialogHeader>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setD(localDay(date))}
          weekStartsOn={1}
          className="w-full bg-transparent p-0"
          classNames={{ root: "w-full" }}
        />

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="md-time" className="text-sm font-medium">
            Time
          </label>
          <Input
            id="md-time"
            type="time"
            value={t}
            onChange={(e) => setT(e.target.value)}
            className="h-10 w-[9.5rem] rounded-lg"
          />
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onNow();
                setOpen(false);
              }}
            >
              Now
            </Button>
            <Button
              onClick={() => {
                if (d && t && onApply(d, t)) setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
