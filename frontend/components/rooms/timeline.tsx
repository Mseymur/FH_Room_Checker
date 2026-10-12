"use client";

import { CheckCircle2 } from "lucide-react";

import { freeSlotText, type TimelineSlot } from "@/lib/schedule";

function isCurrent(slot: TimelineSlot, nowMs: number): boolean {
  return nowMs >= Date.parse(slot.startISO) && nowMs < Date.parse(slot.endISO);
}

export function Timeline({
  slots,
  nowISO,
  showNow,
}: {
  slots: TimelineSlot[];
  nowISO: string;
  showNow: boolean;
}) {
  const nowMs = Date.parse(nowISO);

  return (
    <ol className="space-y-2">
      {slots.map((slot) => {
        const current = showNow && isCurrent(slot, nowMs);
        const free = slot.status === "FREE";
        return (
          <li
            key={slot.id}
            className={`border-border flex items-center gap-3 rounded-lg border border-l-4 p-3 ${
              free ? "border-l-free bg-card" : "border-l-busy bg-secondary/40"
            } ${current ? "ring-primary/40 ring-1 shadow-md shadow-primary/20" : ""}`}
          >
            <div className="text-muted-foreground w-12 shrink-0 text-xs tabular-nums">
              <div className="text-foreground font-medium">{slot.startLabel}</div>
              <div>{slot.endLabel}</div>
            </div>
            <div className="min-w-0 flex-1">
              {free ? (
                <div className="text-free-tint-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium">{freeSlotText(slot)}</span>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{slot.title || "Scheduled"}</p>

                </div>
              )}
            </div>
            {current && (
              <span className="bg-primary text-primary-foreground h-fit rounded-full px-2 py-0.5 text-[11px] font-medium">
                Now
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
