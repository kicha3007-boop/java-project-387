import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { client } from "./client/client.gen";
import "./styles.css";

// API отдаёт тот же сервер, что и фронтенд
client.setConfig({ baseUrl: window.location.origin });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
