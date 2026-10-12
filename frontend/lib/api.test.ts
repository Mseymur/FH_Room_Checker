import { beforeEach, describe, expect, it, vi } from "vitest";
import { campus } from "./config";
import { demoSchedule } from "./adapters/demo";
import { wallClockToInstant } from "./time/countdown";

const load = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adapters/source", () => ({ loadSchedule: load }));
import { GET } from "../app/api/rooms/route";

beforeEach(() => { load.mockReset(); load.mockImplementation((date) => Promise.resolve(demoSchedule(date))); });
const request = (params: Record<string, string>) => new Request(`http://localhost/api/rooms?${new URLSearchParams(params)}`);
const room = campus.rooms[0];
const building = room.building;
const date = "2026-07-01";
const opening = Date.parse(wallClockToInstant(date, campus.openingHours.start));
const closing = Date.parse(wallClockToInstant(date, campus.openingHours.end));
const moment = new Date((opening + closing) / 2).toISOString();

describe("public room API", () => {
  it("validates buildings, room ownership, dates and moments before fetching", async () => {
    const cases: Record<string, string>[] = [
      { building: "!", date },
      { building, date: "2026-02-30" },
      { building, moment: "2026-07-01T09:00:00" },
      { building, date, moment },
      { building, moment: "9999-12-31T23:00:00-14:00" },
    ];
    for (const params of cases) expect((await GET(request(params))).status).toBe(400);
    expect((await GET(request({ building, room: "!", date }))).status).toBe(404);
    const otherRoom = campus.rooms.find((r) => r.building !== building);
    if (otherRoom) expect((await GET(request({ building, room: otherRoom.id, date }))).status).toBe(404);
    expect(load).not.toHaveBeenCalled();
  });
  it("returns the room timeline and snapshot without private fields", async () => {
    const response = await GET(request({ building, moment }));
    expect(response.status).toBe(200);
    const rows = await response.json();
    expect(rows).toHaveLength(campus.rooms.filter((r) => r.building === building).length);
    if (!campus.showBookingTitles) expect(rows.every((r: { title: null }) => r.title === null)).toBe(true);
    expect(rows.every((r: object) => !["teacher", "instructor", "email", "students"].some((key) => key in r))).toBe(true);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const timeline = await GET(request({ building, room: room.id, date }));
    expect((await timeline.json()).map((s: { status: string }) => s.status)).toEqual(["FREE"]);
  });
  it("redacts provider exceptions instead of exposing raw details", async () => {
    load.mockRejectedValue(new Error("synthetic-private-value"));
    const response = await GET(request({ building, date }));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("synthetic-private-value");
  });
});
