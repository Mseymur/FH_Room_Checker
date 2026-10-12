"use client";

import { isGroundFloor } from "@/lib/overview";

function floorLabel(f: string): string {
  if (f === "all") return "All Floors";
  if (isGroundFloor(f)) return "Ground Floor";
  return `Floor ${f}`;
}

export function FloorChips({
  floors,
  value,
  onChange,
}: {
  floors: string[];
  value: string;
  onChange: (floor: string) => void;
}) {
  const options = ["all", ...floors];
  return (
    <div
      role="group"
      aria-label="Filter by floor"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((f) => {
        const active = value === f;
        const cls = active
          ? "border-white bg-white text-foreground shadow-sm dark:border-primary dark:bg-primary dark:text-primary-foreground dark:shadow-none"
          : "border-white/50 bg-white/15 text-white hover:bg-white/25 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent";
        return (
          <button
            key={f}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f)}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none ${cls}`}
          >
            {floorLabel(f)}
          </button>
        );
      })}
    </div>
  );
}
