import { useEffect, useState, type FormEvent } from "react";
import { createEventType, listEventTypes } from "../client/sdk.gen";
import type { EventType } from "../client/types.gen";

/** Владелец создаёт типы встреч и видит уже опубликованные. */
export const OwnerEventTypesPage = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const load = () => listEventTypes().then(({ data }) => setEventTypes(data ?? []));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await createEventType({
      body: {
        id: String(form.get("id")),
        title: String(form.get("title")),
        description: String(form.get("description")),
        durationMinutes: Number(form.get("durationMinutes")),
      },
    });
    if (result.data) {
      setMessage({ text: `Тип встречи «${result.data.title}» создан`, isError: false });
      formElement.reset();
      await load();
    } else {
      setMessage({
        text: result.error?.message ?? "Не удалось создать тип встречи",
        isError: true,
      });
    }
  };

  return (
    <section>
      <h1>Типы встреч</h1>
      <ul className="cards">
        {eventTypes.map((eventType) => (
          <li key={eventType.id} className="card">
            <h2>{eventType.title}</h2>
            <p>{eventType.description}</p>
            <p className="muted">
              {eventType.id} · {eventType.durationMinutes} минут
            </p>
          </li>
        ))}
      </ul>

      <form className="form" onSubmit={submit}>
        <h2>Новый тип встречи</h2>
        {message && (
          <p className={message.isError ? "alert" : "success"} role="alert">
            {message.text}
          </p>
        )}
        <label>
          Идентификатор
          <input name="id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="intro-call" />
        </label>
        <label>
          Название
          <input name="title" required maxLength={120} />
        </label>
        <label>
          Описание
          <textarea name="description" maxLength={1000} />
        </label>
        <label>
          Длительность, минут
          <select name="durationMinutes" defaultValue="30">
            {[30, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button">
          Создать
        </button>
      </form>
    </section>
  );
};
