import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { createBooking, getEventType, listSlots } from "../client/sdk.gen";
import type { Booking, EventType, Slot } from "../client/types.gen";
import { dayKey, formatDate, formatTime } from "../format";

/** Календарь свободных слотов типа встречи и форма записи. */
export const BookEventTypePage = () => {
  const { eventTypeId = "" } = useParams();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadSlots = useCallback(
    () => listSlots({ path: { id: eventTypeId } }).then(({ data }) => setSlots(data ?? [])),
    [eventTypeId],
  );

  useEffect(() => {
    getEventType({ path: { id: eventTypeId } }).then(({ data }) =>
      data ? setEventType(data) : setNotFound(true),
    );
    listSlots({ path: { id: eventTypeId } }).then(({ data }) => setSlots(data ?? []));
  }, [eventTypeId]);

  const days = useMemo(() => {
    const byDay = new Map<string, Slot[]>();
    slots.forEach((item) =>
      byDay.set(dayKey(item.start), [...(byDay.get(dayKey(item.start)) ?? []), item]),
    );
    return byDay;
  }, [slots]);

  const selectedDay = day ?? days.keys().next().value ?? null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slot) {
      return;
    }
    const form = new FormData(event.currentTarget);
    const result = await createBooking({
      body: {
        eventTypeId,
        start: slot.start,
        guestName: String(form.get("guestName")),
        guestEmail: String(form.get("guestEmail")),
      },
    });
    if (result.data) {
      setBooking(result.data);
      return;
    }
    setError(result.error?.message ?? "Не удалось записаться, попробуйте ещё раз");
    setSlot(null);
    await loadSlots();
  };

  if (notFound) {
    return (
      <p>
        Такого типа встречи нет. <Link to="/book">К каталогу</Link>
      </p>
    );
  }
  if (!eventType) {
    return <p>Загрузка…</p>;
  }
  if (booking) {
    return (
      <section className="confirmation" role="status">
        <h1>Вы записаны</h1>
        <p>
          {booking.eventTypeTitle}: {formatDate(booking.start)}, {formatTime(booking.start)}–
          {formatTime(booking.end)} UTC.
        </p>
        <p>Подтверждение для {booking.guestEmail}.</p>
        <Link to="/book">Записаться ещё</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>{eventType.title}</h1>
      <p>{eventType.description}</p>
      <p className="muted">{eventType.durationMinutes} минут · время указано в UTC</p>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      {days.size === 0 ? (
        <p>Свободных слотов в ближайшие 14 дней нет.</p>
      ) : (
        <div className="calendar">
          <ul className="days" aria-label="Дни">
            {[...days.keys()].map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className={key === selectedDay ? "active" : ""}
                  onClick={() => {
                    setDay(key);
                    setSlot(null);
                  }}
                >
                  {formatDate(key)}
                </button>
              </li>
            ))}
          </ul>
          <ul className="slots" aria-label="Свободное время">
            {(selectedDay ? (days.get(selectedDay) ?? []) : []).map((item) => (
              <li key={item.start}>
                <button
                  type="button"
                  className={item.start === slot?.start ? "active" : ""}
                  onClick={() => setSlot(item)}
                >
                  {formatTime(item.start)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slot && (
        <form className="form" onSubmit={submit}>
          <h2>
            {formatDate(slot.start)}, {formatTime(slot.start)}–{formatTime(slot.end)} UTC
          </h2>
          <label>
            Имя
            <input name="guestName" required maxLength={120} />
          </label>
          <label>
            Почта
            <input name="guestEmail" type="email" required />
          </label>
          <button type="submit" className="button">
            Записаться
          </button>
        </form>
      )}
    </section>
  );
};
