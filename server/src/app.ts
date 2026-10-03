import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyError } from "fastify";
import openapiGlue from "fastify-openapi-glue";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Handlers } from "./handlers.js";
import { ApiError, CalendarService } from "./service.js";
import { DEFAULT_EVENT_TYPES, Store } from "./store.js";

export interface AppOptions {
  store?: Store;
  now?: () => Date;
  /** Собранный фронтенд; без него сервер отдаёт только API. */
  staticDir?: string;
  logger?: boolean;
}

const SPEC_PATH = resolve(process.env.SPEC_PATH ?? "spec/generated/openapi.yaml");

export const buildApp = async (options: AppOptions = {}) => {
  const app = Fastify({ logger: options.logger ?? false });
  const service = new CalendarService(options.store ?? new Store(DEFAULT_EVENT_TYPES), options.now);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({ code: error.code, message: error.message });
    }
    if (error.validation) {
      return reply.code(422).send({ code: "validation_error", message: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ code: "internal_error", message: "Внутренняя ошибка" });
  });

  await app.register(openapiGlue, {
    specification: SPEC_PATH,
    serviceHandlers: new Handlers(service),
  });

  const staticDir = options.staticDir && resolve(options.staticDir);
  if (staticDir && existsSync(staticDir)) {
    await app.register(fastifyStatic, { root: staticDir });
    // Маршруты фронтенда (/book/…, /owner/…) отдаёт index.html, неизвестный API — 404 в JSON
    app.setNotFoundHandler((request, reply) =>
      request.url.startsWith("/api/")
        ? reply.code(404).send({ code: "not_found", message: "Маршрут не найден" })
        : reply.sendFile("index.html"),
    );
  }

  return app;
};
