"use client";

import { useEffect, useState } from "react";

const TICK_MS = 10_000;

export interface LiveMoment {
  /** Current moment ISO — ticks in live mode, fixed in time-travel mode. */
  nowISO: string;
  /** True when ticking live; false when pinned to a fixed moment. */
  isLive: boolean;
}

/**
 * The live "now" used to re-derive room status client-side between server fetches.
 * - Live mode (default): ticks every 10s so statuses update without refetching.
 * - Time-travel: pass `fixedISO` to pin the moment (no ticking).
 *
 * This does NOT fetch anything — combine with the absolute targets from a snapshot
 * (see lib/time/countdown.ts) so the countdown updates without re-querying the server.
 */
export function useLiveMoment(opts?: { fixedISO?: string | null }): LiveMoment {
  const fixedISO = opts?.fixedISO ?? null;

  const [prevFixedISO, setPrevFixedISO] = useState<string | null>(fixedISO);
  const [nowISO, setNowISO] = useState<string>(() => fixedISO ?? new Date().toISOString());

  // Adjust state during render when fixedISO changes
  if (fixedISO !== prevFixedISO) {
    setPrevFixedISO(fixedISO);
    setNowISO(fixedISO ?? new Date().toISOString());
  }

  useEffect(() => {
    if (fixedISO) return;
    const id = setInterval(() => setNowISO(new Date().toISOString()), TICK_MS);
    return () => clearInterval(id);
  }, [fixedISO]);

  return { nowISO, isLive: !fixedISO };
}

