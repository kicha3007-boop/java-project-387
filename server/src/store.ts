import type { components } from "./generated/api.js";

export type EventType = components["schemas"]["EventType"];

export interface StoredBooking {
  id: string;
  eventTypeId: string;
  start: Date;
  end: Date;
  guestName: string;
  guestEmail: string;
  createdAt: Date;
}

/** Хранилище в памяти: один владелец календаря, данные живут до перезапуска. */
export class Store {
  readonly eventTypes = new Map<string, EventType>();
  readonly bookings: StoredBooking[] = [];

  constructor(eventTypes: EventType[] = []) {
    eventTypes.forEach((eventType) => this.eventTypes.set(eventType.id, eventType));
  }
}

/** Типы встреч, с которыми приложение стартует, чтобы гостю было что выбрать. */
export const DEFAULT_EVENT_TYPES: EventType[] = [
  {
    id: "intro-call",
    title: "Знакомство",
    description: "Короткий звонок, чтобы познакомиться и обсудить задачу.",
    durationMinutes: 30,
  },
  {
    id: "consultation",
    title: "Консультация",
    description: "Разбор вопроса с демонстрацией экрана.",
    durationMinutes: 60,
  },
];
