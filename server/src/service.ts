import { randomUUID } from "node:crypto";
import { freeSlots, isOnSchedule, overlaps, type Interval } from "./domain/slots.js";
import type { components } from "./generated/api.js";
import type { EventType, Store, StoredBooking } from "./store.js";

type Booking = components["schemas"]["Booking"];
type BookingRequest = components["schemas"]["BookingRequest"];
type Slot = components["schemas"]["Slot"];
type ErrorCode = components["schemas"]["ApiError"]["code"];

/** Ошибка предметной области с HTTP-статусом и кодом из контракта. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: 404 | 409 | 422,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const MINUTE = 60_000;

export class CalendarService {
  constructor(
    private readonly store: Store,
    private readonly now: () => Date = () => new Date(),
  ) {}

  listEventTypes(): EventType[] {
    return [...this.store.eventTypes.values()];
  }

  getEventType(id: string): EventType {
    const eventType = this.store.eventTypes.get(id);
    if (!eventType) {
      throw new ApiError(404, "not_found", "Такого типа встречи нет");
    }
    return eventType;
  }

  createEventType(eventType: EventType): EventType {
    if (eventType.durationMinutes % 30 !== 0) {
      throw new ApiError(422, "validation_error", "Длительность должна быть кратна 30 минутам");
    }
    if (this.store.eventTypes.has(eventType.id)) {
      throw new ApiError(409, "already_exists", "Тип встречи с таким идентификатором уже есть");
    }
    this.store.eventTypes.set(eventType.id, eventType);
    return eventType;
  }

  listSlots(eventTypeId: string): Slot[] {
    const eventType = this.getEventType(eventTypeId);
    return freeSlots(eventType.durationMinutes, this.busyIntervals(), this.now()).map(toSlot);
  }

  /** Правило занятости проверяется здесь, на сервере: интерфейс его не обходит. */
  createBooking(request: BookingRequest): Booking {
    const eventType = this.getEventType(request.eventTypeId);
    const start = new Date(request.start);
    if (!isOnSchedule(start, eventType.durationMinutes, this.now())) {
      throw new ApiError(
        422,
        "validation_error",
        "Время должно совпадать со слотом из ближайших 14 дней",
      );
    }
    const interval = { start, end: new Date(start.getTime() + eventType.durationMinutes * MINUTE) };
    if (this.busyIntervals().some((busy) => overlaps(interval, busy))) {
      throw new ApiError(409, "slot_unavailable", "Это время уже занято, выберите другой слот");
    }
    const booking: StoredBooking = {
      id: randomUUID(),
      eventTypeId: eventType.id,
      ...interval,
      guestName: request.guestName,
      guestEmail: request.guestEmail,
      createdAt: this.now(),
    };
    this.store.bookings.push(booking);
    return this.toBooking(booking);
  }

  /** Предстоящие встречи всех типов, ближайшие первыми. */
  listBookings(): Booking[] {
    const now = this.now();
    return this.store.bookings
      .filter((booking) => booking.end > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .map((booking) => this.toBooking(booking));
  }

  private busyIntervals(): Interval[] {
    return this.store.bookings.map(({ start, end }) => ({ start, end }));
  }

  private toBooking(booking: StoredBooking): Booking {
    return {
      id: booking.id,
      eventTypeId: booking.eventTypeId,
      eventTypeTitle: this.store.eventTypes.get(booking.eventTypeId)?.title ?? booking.eventTypeId,
      start: booking.start.toISOString(),
      end: booking.end.toISOString(),
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}

const toSlot = (slot: Interval): Slot => ({
  start: slot.start.toISOString(),
  end: slot.end.toISOString(),
});
