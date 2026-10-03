import { Link } from "react-router";

export const HomePage = () => (
  <section className="hero">
    <h1>Запишитесь на звонок</h1>
    <p>
      Выберите тип встречи, удобный день и свободное время в ближайшие две недели. Регистрация не
      нужна: достаточно имени и почты.
    </p>
    <Link to="/book" className="button">
      Выбрать время
    </Link>
  </section>
);
