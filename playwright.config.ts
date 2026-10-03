import { defineConfig, devices } from "@playwright/test";

const PORT = 18080;

// Браузерный сценарий гостя и владельца поверх собранного приложения (npm run build).
export default defineConfig({
  testDir: "e2e",
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node dist/server/index.js",
    url: `http://localhost:${PORT}/api/event-types`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
  },
});
