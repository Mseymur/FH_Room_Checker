"use client";

import { campus } from "@/lib/config";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "room-finder:building";
let memorySelection: string | null = null;

// Dispatched after a same-tab write so the external-store read re-evaluates (the native
// `storage` event only fires in OTHER tabs).
const BUILDING_CHANGED_EVENT = "selected-building-changed";

function subscribe(cb: () => void) {
  window.addEventListener(BUILDING_CHANGED_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(BUILDING_CHANGED_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): string | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? memorySelection;
    return campus.buildings.some((b) => b.code === saved) ? saved : null;
  } catch {
    return memorySelection;
  }
}

// Server / first paint: no stored value is readable, so render as "not selected".
const getServerSnapshot = (): string | null => null;

// Flips false → true once mounted on the client, mirroring the old `hydrated` flag so
// redirect gates wait until localStorage has actually been read.
const subscribeNoop = () => () => {};
const getHydratedClient = () => true;
const getHydratedServer = () => false;

/**
 * Selected-building state, persisted to localStorage (saved locally).
 * Reads via useSyncExternalStore so the client value is correct on first render without an
 * effect, avoiding SSR/client mismatch. `hydrated` is false during SSR/hydration and true
 * once mounted, so callers can defer redirects until the stored value is known.
 */
export function useSelectedBuilding() {
  const code = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeNoop, getHydratedClient, getHydratedServer);

  const select = useCallback((next: string) => {
    if (!campus.buildings.some((b) => b.code === next)) return;
    memorySelection = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* non-fatal */
    }
    window.dispatchEvent(new Event(BUILDING_CHANGED_EVENT));
  }, []);

  return { code, select, hydrated };
}
