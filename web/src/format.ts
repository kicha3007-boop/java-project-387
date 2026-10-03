// Время в приложении хранится и показывается в UTC, чтобы гость и владелец видели одно и то же.

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const timeFormat = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export const formatTime = (iso: string) => timeFormat.format(new Date(iso));

/** Ключ дня для группировки слотов: YYYY-MM-DD в UTC. */
export const dayKey = (iso: string) => iso.slice(0, 10);
