# 2. Design First: контракт в TypeSpec, всё остальное генерируется

Статус: принято

## Контекст

Фронтенд и бекенд реализуются по отдельности, часто разными сессиями агента. Расхождение с API
должно ловиться до запуска, а не на живом приложении.

## Решение

```text
spec/main.tsp ──tsp──> spec/generated/openapi.yaml ──┬─ openapi-ts ──> web/src/client (SDK)
                                                      ├─ openapi-typescript ──> server/src/generated/api.ts
                                                      └─ fastify-openapi-glue (в рантайме): маршруты и проверка запросов
```

- Вся цепочка повторяется командой `npm run generate`; CI проверяет, что сгенерированное в
  репозитории совпадает с результатом генерации.
- Сгенерированные файлы руками не правятся. Адрес API для SDK задаётся при старте фронтенда
  (`client.setConfig`), а не правкой `client.gen.ts`.
- Ошибки — одна модель `ApiError { code, message }`; коды: `not_found` (404),
  `slot_unavailable` / `already_exists` (409), `validation_error` (422).

## Последствия

Правка API идёт строго в порядке: TypeSpec → `npm run generate` → код обеих сторон.
