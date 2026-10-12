"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Search, DoorOpen } from "lucide-react";

import { campus } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelectedBuilding } from "@/hooks/use-selected-building";

export default function WelcomePage() {
  const router = useRouter();
  const { code, select } = useSelectedBuilding();
  const [pending, setPending] = useState<string | null>(null);

  const chosen = pending ?? code ?? "";

  function viewRooms() {
    if (!chosen) return;
    select(chosen);
    router.push("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-10">
      {/* Hero */}
      <header className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-[60px] items-center justify-center rounded-full bg-white p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <DoorOpen className="text-primary size-8" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            {campus.name}
          </span>
        </h1>
        <p className="text-muted-foreground max-w-[280px] text-sm leading-relaxed">
          Find an empty classroom to study in seconds.
        </p>

      </header>

      {/* Feature cards (de-emphasized) */}
      <div className="mb-4 space-y-2">
        <div className="border-border bg-card rounded-[10px] border px-4 py-4 opacity-90">
          <div className="mb-1.5 flex items-center gap-2">
            <Search className="size-5" aria-hidden="true" />
            <h2 className="font-semibold">Find free rooms</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-snug">
            See which rooms have no scheduled bookings during opening hours.
          </p>
        </div>
        <div className="border-border bg-card rounded-[10px] border px-4 py-4 opacity-90">
          <div className="mb-1.5 flex items-center gap-2">
            <Clock className="size-5" aria-hidden="true" />
            <h2 className="font-semibold">Real-time schedules</h2>
          </div>
          <p className="text-muted-foreground text-sm leading-snug">
            Check daily room schedules to plan study sessions without interruptions.
          </p>
        </div>
      </div>

      {/* Building selection — primary focus */}
      <div className="border-border bg-card rounded-2xl border p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-bold tracking-tight">Select your building</h2>
          <p className="text-muted-foreground text-sm">We&apos;ll show you all available rooms.</p>
        </div>

        <label htmlFor="welcome-building" className="sr-only">
          Building
        </label>
        <Select value={chosen} onValueChange={setPending}>
          <SelectTrigger
            id="welcome-building"
            aria-label="Building"
            className="h-12 w-full rounded-lg data-[size=default]:h-12"
          >
            <SelectValue placeholder="Select building…" />
          </SelectTrigger>
          <SelectContent className="max-h-72 rounded-lg p-1.5">
            {campus.buildings.map((b) => (
              <SelectItem
                key={b.code}
                value={b.code}
                className="rounded-md py-2.5 pl-3"
              >
                {b.code} — {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Primary CTA */}
      <Button
        className="mt-4 h-12 w-full rounded-xl text-base font-bold"
        disabled={!chosen}
        onClick={viewRooms}
      >
        View available rooms
      </Button>
    </div>
  );
}
