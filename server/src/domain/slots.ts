// Правила календаря: окно записи, рабочие часы и занятость. Чистые функции, время в UTC.

export const SLOT_STEP_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 14;
export const WORKDAY_START_HOUR = 9;
export const WORKDAY_END_HOUR = 18;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export interface Interval {
  start: Date;
  end: Date;
}

const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const overlaps = (a: Interval, b: Interval): boolean => a.start < b.end && b.start < a.end;

/** Границы окна записи: с текущей даты на 14 дней вперёд. */
export const bookingWindow = (now: Date): Interval => {
  const start = startOfUtcDay(now);
  return { start, end: new Date(start.getTime() + BOOKING_WINDOW_DAYS * DAY) };
};

/**
 * Свободные слоты для встречи заданной длительности: шаг 30 минут в рабочих часах каждого дня
 * окна, только в будущем и без пересечения с уже занятыми интервалами — любого типа встречи.
 */
export const freeSlots = (durationMinutes: number, busy: Interval[], now: Date): Interval[] => {
  const window = bookingWindow(now);
  const slots: Interval[] = [];
  for (let day = window.start.getTime(); day < window.end.getTime(); day += DAY) {
    const dayEnd = day + WORKDAY_END_HOUR * 60 * MINUTE;
    for (
      let start = day + WORKDAY_START_HOUR * 60 * MINUTE;
      start + durationMinutes * MINUTE <= dayEnd;
      start += SLOT_STEP_MINUTES * MINUTE
    ) {
      const slot = { start: new Date(start), end: new Date(start + durationMinutes * MINUTE) };
      if (slot.start > now && !busy.some((interval) => overlaps(slot, interval))) {
        slots.push(slot);
      }
    }
  }
  return slots;
};

/** Начало слота должно совпадать с сеткой и окном; иначе запрос некорректен, а не конфликтен. */
export const isOnSchedule = (start: Date, durationMinutes: number, now: Date): boolean =>
  freeSlots(durationMinutes, [], now).some((slot) => slot.start.getTime() === start.getTime());
