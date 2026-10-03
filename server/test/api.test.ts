import type { FastifyInstance } from "fastify";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { DEFAULT_EVENT_TYPES, Store } from "../src/store.js";

const now = () => new Date("2026-10-05T10:10:00Z");
const SLOT = "2026-10-06T09:00:00.000Z";

const guest = { guestName: "Анна", guestEmail: "anna@example.com" };

describe("API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({ store: new Store(DEFAULT_EVENT_TYPES), now });
  });

  afterEach(() => app.close());

  const book = (eventTypeId: string, start = SLOT, data = guest) =>
    app.inject({ method: "POST", url: "/api/bookings", payload: { eventTypeId, start, ...data } });

  it("lists event types", async () => {
    const response = await app.inject("/api/event-types");

    expect(response.statusCode).toBe(200);
    expect(response.json().map((type: { id: string }) => type.id)).toEqual([
      "intro-call",
      "consultation",
    ]);
  });

  it("creates an event type and rejects a duplicate id", async () => {
    const payload = { id: "demo", title: "Демо", description: "", durationMinutes: 90 };

    const created = await app.inject({ method: "POST", url: "/api/event-types", payload });
    const duplicate = await app.inject({ method: "POST", url: "/api/event-types", payload });

    expect(created.statusCode).toBe(201);
    expect((await app.inject("/api/event-types/demo")).json()).toEqual(payload);
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().code).toBe("already_exists");
  });

  it.each([
    { id: "Bad Id", title: "x", description: "", durationMinutes: 30 },
    { id: "short", title: "x", description: "", durationMinutes: 45 },
    { id: "long", title: "x", description: "", durationMinutes: 300 },
  ])("rejects an invalid event type %#", async (payload) => {
    const response = await app.inject({ method: "POST", url: "/api/event-types", payload });

    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("validation_error");
  });

  it("returns 404 for an unknown event type", async () => {
    expect((await app.inject("/api/event-types/missing")).statusCode).toBe(404);
    expect((await app.inject("/api/event-types/missing/slots")).statusCode).toBe(404);
  });

  it("books a free slot and removes it from free slots", async () => {
    const response = await book("intro-call");

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      eventTypeId: "intro-call",
      eventTypeTitle: "Знакомство",
      start: SLOT,
      end: "2026-10-06T09:30:00.000Z",
      ...guest,
    });
    const slots = (await app.inject("/api/event-types/intro-call/slots")).json();
    expect(slots.map((slot: { start: string }) => slot.start)).not.toContain(SLOT);
  });

  it("does not book the same time twice, even for another event type", async () => {
    await book("intro-call");

    const sameType = await book("intro-call");
    const otherType = await book("consultation", "2026-10-06T08:30:00.000Z");
    const overlapping = await book("consultation", SLOT);

    expect(sameType.statusCode).toBe(409);
    expect(sameType.json().code).toBe("slot_unavailable");
    expect(otherType.statusCode).toBe(422);
    expect(overlapping.statusCode).toBe(409);
    expect((await app.inject("/api/bookings")).json()).toHaveLength(1);
  });

  it.each([
    ["off the 30-minute grid", "2026-10-06T09:10:00.000Z"],
    ["in the past", "2026-10-05T09:00:00.000Z"],
    ["outside the 14-day window", "2026-10-25T09:00:00.000Z"],
  ])("rejects a booking %s", async (_, start) => {
    const response = await book("intro-call", start);

    expect(response.statusCode).toBe(422);
  });

  it("rejects a booking with an invalid email or unknown event type", async () => {
    expect((await book("intro-call", SLOT, { guestName: "x", guestEmail: "x" })).statusCode).toBe(
      422,
    );
    expect((await book("missing")).statusCode).toBe(404);
  });

  it("lists upcoming bookings of all types, nearest first", async () => {
    await book("consultation", "2026-10-07T12:00:00.000Z");
    await book("intro-call", SLOT);

    const bookings = (await app.inject("/api/bookings")).json();

    expect(bookings.map((booking: { eventTypeId: string }) => booking.eventTypeId)).toEqual([
      "intro-call",
      "consultation",
    ]);
  });

  it("serves the frontend for app routes and 404 JSON for unknown API paths", async () => {
    const staticDir = mkdtempSync(join(tmpdir(), "web-"));
    writeFileSync(join(staticDir, "index.html"), "<html>calendar</html>");
    const withFrontend = await buildApp({ staticDir, now });

    const home = await withFrontend.inject("/");
    const route = await withFrontend.inject("/book/intro-call");
    const api = await withFrontend.inject("/api/unknown");
    await withFrontend.close();

    expect(home.statusCode).toBe(200);
    expect(route.body).toContain("calendar");
    expect(api.statusCode).toBe(404);
  });
});
