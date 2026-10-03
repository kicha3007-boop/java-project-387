import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

/** Запись на звонок: владелец публикует типы встреч, гость бронирует свободный слот. */
@service(#{ title: "Calendar Slots API" })
@info(#{ version: "0.1.0" })
@route("/api")
namespace CalendarSlots;

/** Тип встречи, который владелец календаря предлагает гостям. */
model EventType {
  /** Идентификатор-слаг, задаёт владелец: `intro-call`. */
  @pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
  @maxLength(64)
  id: string;

  @minLength(1)
  @maxLength(120)
  title: string;

  @maxLength(1000)
  description: string;

  /** Длительность встречи: кратна 30 минутам, от 30 до 240. */
  @minValue(30)
  @maxValue(240)
  durationMinutes: int32;
}

/** Свободный интервал для записи. Время в UTC. */
model Slot {
  start: utcDateTime;
  end: utcDateTime;
}

/** Данные гостя для записи на слот. */
model BookingRequest {
  eventTypeId: string;

  /** Начало выбранного слота из списка свободных. */
  start: utcDateTime;

  @minLength(1)
  @maxLength(120)
  guestName: string;

  @pattern("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
  guestEmail: string;
}

/** Встреча в календаре владельца. */
model Booking {
  id: string;
  eventTypeId: string;
  eventTypeTitle: string;
  start: utcDateTime;
  end: utcDateTime;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
}

/** Ошибка с машинным кодом и сообщением для пользователя. */
@error
model ApiError {
  code: "not_found" | "validation_error" | "slot_unavailable" | "already_exists";
  message: string;
}

model NotFoundResponse {
  @statusCode statusCode: 404;
  @body body: ApiError;
}

model ConflictResponse {
  @statusCode statusCode: 409;
  @body body: ApiError;
}

model ValidationResponse {
  @statusCode statusCode: 422;
  @body body: ApiError;
}

@route("/event-types")
@tag("EventTypes")
interface EventTypes {
  /** Каталог типов встреч для гостя и владельца. */
  @get
  @operationId("listEventTypes")
  list(): EventType[];

  /** Владелец создаёт тип встречи. */
  @post
  @operationId("createEventType")
  create(@body eventType: EventType): {
    @statusCode statusCode: 201;
    @body body: EventType;
  } | ConflictResponse | ValidationResponse;

  @get
  @route("/{id}")
  @operationId("getEventType")
  get(@path id: string): EventType | NotFoundResponse;

  /** Свободные слоты на 14 дней вперёд, начиная с текущей даты. */
  @get
  @route("/{id}/slots")
  @operationId("listSlots")
  slots(@path id: string): Slot[] | NotFoundResponse;
}

@route("/bookings")
@tag("Bookings")
interface Bookings {
  /** Предстоящие встречи всех типов, ближайшие первыми. */
  @get
  @operationId("listBookings")
  list(): Booking[];

  /** Гость занимает свободный слот; занятое время даёт 409 даже для другого типа встречи. */
  @post
  @operationId("createBooking")
  create(@body booking: BookingRequest): {
    @statusCode statusCode: 201;
    @body body: Booking;
  } | NotFoundResponse | ConflictResponse | ValidationResponse;
}
