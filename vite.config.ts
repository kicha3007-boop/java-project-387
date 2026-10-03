import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "web",
  plugins: [react()],
  build: {
    outDir: "../dist/web",
    emptyOutDir: true,
  },
  server: {
    // В разработке API отдаёт сервер на 8080 (npm run dev:server)
    proxy: { "/api": "http://localhost:8080" },
  },
  test: {
    root: ".",
    include: ["server/test/**/*.test.ts"],
  },
});
