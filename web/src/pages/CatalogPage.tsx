import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listEventTypes } from "../client/sdk.gen";
import type { EventType } from "../client/types.gen";

/** Каталог типов встреч: гость выбирает, на что записаться. */
export const CatalogPage = () => {
  const [eventTypes, setEventTypes] = useState<EventType[] | null>(null);

  useEffect(() => {
    listEventTypes().then(({ data }) => setEventTypes(data ?? []));
  }, []);

  if (!eventTypes) {
    return <p>Загрузка…</p>;
  }

  return (
    <section>
      <h1>Выберите тип встречи</h1>
      {eventTypes.length === 0 && <p>Владелец пока не опубликовал ни одного типа встречи.</p>}
      <ul className="cards">
        {eventTypes.map((eventType) => (
          <li key={eventType.id} className="card">
            <h2>{eventType.title}</h2>
            <p>{eventType.description}</p>
            <p className="muted">{eventType.durationMinutes} минут</p>
            <Link to={`/book/${eventType.id}`} className="button">
              Выбрать время
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
