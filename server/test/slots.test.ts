import { describe, expect, it } from "vitest";
import { bookingWindow, freeSlots, isOnSchedule } from "../src/domain/slots.js";

const now = new Date("2026-10-05T10:10:00Z");

describe("freeSlots", () => {
  it("covers 14 days from today in 30-minute steps within working hours", () => {
    const slots = freeSlots(30, [], now);
    const window = bookingWindow(now);

    expect(slots[0].start.toISOString()).toBe("2026-10-05T10:30:00.000Z");
    expect(slots.at(-1)?.start.toISOString()).toBe("2026-10-18T17:30:00.000Z");
    expect(slots.every((slot) => slot.start >= window.start && slot.end <= window.end)).toBe(true);
    expect(slots.every((slot) => slot.start.getUTCMinutes() % 30 === 0)).toBe(true);
  });

  it("keeps long meetings inside the working day", () => {
    const lastToday = freeSlots(60, [], now).filter((slot) =>
      slot.start.toISOString().startsWith("2026-10-05"),
    );

    expect(lastToday.at(-1)?.end.toISOString()).toBe("2026-10-05T18:00:00.000Z");
  });

  it("hides every slot overlapping a booking of any type", () => {
    const busy = [
      { start: new Date("2026-10-06T10:00:00Z"), end: new Date("2026-10-06T11:00:00Z") },
    ];
    const starts = freeSlots(60, busy, now).map((slot) => slot.start.toISOString());

    expect(starts).not.toContain("2026-10-06T09:30:00.000Z");
    expect(starts).not.toContain("2026-10-06T10:00:00.000Z");
    expect(starts).not.toContain("2026-10-06T10:30:00.000Z");
    expect(starts).toContain("2026-10-06T09:00:00.000Z");
    expect(starts).toContain("2026-10-06T11:00:00.000Z");
  });
});

describe("isOnSchedule", () => {
  it.each([
    ["2026-10-06T09:00:00Z", true],
    ["2026-10-06T09:15:00Z", false],
    ["2026-10-05T09:00:00Z", false],
    ["2026-10-19T09:00:00Z", false],
    ["2026-10-06T19:00:00Z", false],
  ])("%s → %s", (start, expected) => {
    expect(isOnSchedule(new Date(start), 30, now)).toBe(expected);
  });
});
