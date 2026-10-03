import { NavLink, Route, Routes } from "react-router";
import { BookEventTypePage } from "./pages/BookEventTypePage";
import { CatalogPage } from "./pages/CatalogPage";
import { HomePage } from "./pages/HomePage";
import { OwnerBookingsPage } from "./pages/OwnerBookingsPage";
import { OwnerEventTypesPage } from "./pages/OwnerEventTypesPage";

export const App = () => (
  <>
    <header className="header">
      <NavLink to="/" className="logo">
        Запись на звонок
      </NavLink>
      <nav>
        <NavLink to="/book">Записаться</NavLink>
        <NavLink to="/owner/bookings">Встречи</NavLink>
        <NavLink to="/owner/event-types">Типы встреч</NavLink>
      </nav>
    </header>
    <main className="main">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<CatalogPage />} />
        <Route path="/book/:eventTypeId" element={<BookEventTypePage />} />
        <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
        <Route path="/owner/event-types" element={<OwnerEventTypesPage />} />
        <Route path="*" element={<p>Страница не найдена.</p>} />
      </Routes>
    </main>
  </>
);
