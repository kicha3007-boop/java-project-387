import { defineConfig } from "@hey-api/openapi-ts";

// Клиентский SDK фронтенда: типы и функции вызова эндпоинтов из OpenAPI-спецификации.
export default defineConfig({
  input: "spec/generated/openapi.yaml",
  // tsconfig фронтенда задаёт вид импортов явно: иначе генератор угадывает его по окружению,
  // и повторная генерация в CI расходится с репозиторием
  output: { path: "web/src/client", tsConfigPath: "tsconfig.web.json" },
  plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
});
