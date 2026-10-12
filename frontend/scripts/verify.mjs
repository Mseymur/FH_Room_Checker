import assert from "node:assert/strict";
import { chromium } from "playwright";
import campus from "../campus.config.json" with { type: "json" };
import { mkdir } from "node:fs/promises";

const room = campus.rooms[0]; // The first demo room is free for the full opening window.
const building = campus.buildings.find((b) => b.code === room.building);
const minutes = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3));
const midpoint = Math.floor((minutes(campus.openingHours.start) + minutes(campus.openingHours.end)) / 2);
const time = `${String(Math.floor(midpoint / 60)).padStart(2, "0")}:${String(midpoint % 60).padStart(2, "0")}`;
const roomLinkName = new RegExp(`^Room ${room.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`);

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const errors = [];
const externalRequests = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== new URL(base).origin) {
      externalRequests.push(url.origin);
    }
  });
  await page.goto(`${base}/welcome`);
  await page.getByRole("combobox", { name: "Building" }).click();
  await page.getByRole("option", { name: `${building.code} — ${building.label}`, exact: true }).click();
  await page.getByRole("button", { name: "View available rooms" }).click();
  await page.waitForURL(`${base}/`);
  await page.getByRole("button", { name: /^Now/ }).click();
  await page.getByLabel("Time", { exact: true }).fill(time);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.getByRole("link", { name: roomLinkName }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Available", exact: true }).count(), 1);
  await page.getByRole("searchbox").fill(room.id);
  await page.getByRole("link", { name: roomLinkName }).click();
  await page.getByText("Free until closing", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: room.id, exact: true }).count(), 1);
  const dateInput = page.getByLabel("Date", { exact: true });
  const oldDate = await dateInput.inputValue();
  await page.getByRole("button", { name: "Next day" }).click();
  const newDate = await dateInput.inputValue();
  assert.notEqual(newDate, oldDate);
  await page.getByRole("region", { name: new RegExp(`^Timeline for ${room.id}`) }).waitFor();
  await page.getByText("Free until closing", { exact: true }).waitFor();
  assert.ok(await page.getByText("Demo: fictional rooms and bookings.").count());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/mobile.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  for (const theme of ["Light", "Dark"]) {
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await page.getByRole("menuitem", { name: theme, exact: true }).click();
    await page.waitForFunction((dark) => document.documentElement.classList.contains("dark") === dark, theme === "Dark");
    if (process.env.SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/desktop-${theme.toLowerCase()}.png`, fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(externalRequests, []);
  await context.close();
  console.log("Demo flow passed: building -> overview -> search -> timeline -> date change; mobile/desktop; light/dark; no page errors or external requests.");
} finally { await browser.close(); }
