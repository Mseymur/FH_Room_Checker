"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSelectedBuilding } from "@/hooks/use-selected-building";

/** Send unmatched URLs to the overview or building selection. */
export default function NotFound() {
  const router = useRouter();
  const { code, hydrated } = useSelectedBuilding();

  useEffect(() => {
    // Wait for localStorage to hydrate so we read the real selection, not the null first paint.
    if (!hydrated) return;
    router.replace(code ? "/" : "/welcome");
  }, [hydrated, code, router]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <p className="text-muted-foreground text-sm">Redirecting…</p>
    </div>
  );
}
