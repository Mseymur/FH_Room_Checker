import "server-only";
import { readFile, stat } from "node:fs/promises";
import { campus } from "../config";
import type { ScheduleData } from "../types";
import { demoSchedule } from "./demo";
import { normalizeSchedule } from "./normalize";

const MAX_BYTES = 5 * 1024 * 1024;
let cached: { expires: number; data: ScheduleData } | undefined;
let pending: Promise<ScheduleData> | undefined;

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function isFresh(data: ScheduleData, now = Date.now()): boolean {
  const age = now - Date.parse(data.updatedAt);
  return age <= campus.maxFeedAgeSeconds * 1000 && age >= -MAX_CLOCK_SKEW_MS;
}

export function assertFresh(data: ScheduleData, now = Date.now()) {
  if (!isFresh(data, now)) throw new Error("Schedule freshness is outside the configured limits.");
}

async function fetchPayload(): Promise<unknown> {
  const source = process.env.SCHEDULE_SOURCE || "demo";
  if (source === "file") {
    const file = process.env.SCHEDULE_FILE;
    if (!file || (await stat(file)).size > MAX_BYTES) throw new Error("Invalid schedule file.");
    const payload = await readFile(file, "utf8");
    if (Buffer.byteLength(payload) > MAX_BYTES) throw new Error("Schedule is too large.");
    return JSON.parse(payload);
  }
  if (source !== "api") throw new Error("Choose demo, file or api as SCHEDULE_SOURCE.");
  const url = new URL(process.env.SCHEDULE_API_URL ?? "");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("Schedule APIs require HTTPS; HTTP is allowed only on localhost.");
  }
  const token = process.env.SCHEDULE_API_TOKEN;
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error("Schedule provider unavailable.");
  }
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    await response.body.cancel();
    throw new Error("Schedule is too large.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("Schedule is too large.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Stale cached data triggers a refresh; failed or stale reads never become an empty feed or demo data. */
export async function loadSchedule(date: string): Promise<ScheduleData> {
  if ((process.env.SCHEDULE_SOURCE || "demo") === "demo") return demoSchedule(date);
  if (cached && cached.expires > Date.now() && isFresh(cached.data)) return cached.data;
  if (!pending) {
    pending = (async () => {
      const data = normalizeSchedule(await fetchPayload());
      assertFresh(data);
      cached = { data, expires: Date.now() + campus.cacheSeconds * 1000 };
      return data;
    })().finally(() => { pending = undefined; });
  }
  return pending;
}
