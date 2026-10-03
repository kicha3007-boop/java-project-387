import { useEffect, useState } from "react";
import { listBookings } from "../client/sdk.gen";
import type { Booking } from "../client/types.gen";
import { formatDate, formatTime } from "../format";

/** Страница владельца: предстоящие встречи всех типов в одном списке. */
export const OwnerBookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    listBookings().then(({ data }) => setBookings(data ?? []));
  }, []);

  if (!bookings) {
    return <p>Загрузка…</p>;
  }

  return (
    <section>
      <h1>Предстоящие встречи</h1>
      {bookings.length === 0 ? (
        <p>Записей пока нет.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Время (UTC)</th>
              <th>Тип встречи</th>
              <th>Гость</th>
              <th>Почта</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{formatDate(booking.start)}</td>
                <td>
                  {formatTime(booking.start)}–{formatTime(booking.end)}
                </td>
                <td>{booking.eventTypeTitle}</td>
                <td>{booking.guestName}</td>
                <td>{booking.guestEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
