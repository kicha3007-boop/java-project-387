# AGENTS.md

Запись на звонок: типы встреч владельца, 30-минутные слоты на 14 дней, бронирование гостем.
TypeScript: Fastify (`server/`) + React/Vite (`web/`), один сервис, один Docker-образ.

## Команды

```bash
npm ci                 # зависимости
npm run generate       # TypeSpec → OpenAPI → SDK фронтенда и типы сервера (после правки spec/main.tsp)
npm run dev:server     # API на :8080
npm run dev            # фронтенд на :5173, /api проксируется на :8080
npm run lint           # eslint + prettier --check
npm run typecheck
npm test               # vitest: правила слотов и API
npm run build && npm run test:e2e   # Playwright по собранному приложению
docker build -t calendar . && docker run -e PORT=8080 -p 8080:8080 calendar
```

## Устройство

- `spec/main.tsp` — контракт, источник правды. `spec/generated/`, `server/src/generated/`,
  `web/src/client/` генерируются, руками не правятся.
- `server/src/domain/slots.ts` — правила окна записи и занятости (чистые функции, UTC).
- `server/src/service.ts` — сценарии; `handlers.ts` — обработчики по `operationId`;
  маршруты и проверку запросов строит fastify-openapi-glue из OpenAPI.
- Фронтенд ходит в API только через сгенерированный SDK (`web/src/client/sdk.gen.ts`).
- Решения — `docs/adr/`, словарь — `GLOSSARY.md`.

## Правила

- Коммиты по Conventional Commits: `feat: …`, `fix: …`, `test: …`, `docs: …`, `chore: …`,
  `ci: …`; ссылка на тикет в конце: `(#12)`. По ним release-please собирает версию и changelog.
- Правка API: TypeSpec → `npm run generate` → код обеих сторон, в одном коммите.
- Правила бронирования — только на сервере; интерфейс показывает ответ API.

## Agent skills

### Issue tracker

Issues, map and specs live in GitHub Issues of `kicha3007-boop/java-project-387`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
