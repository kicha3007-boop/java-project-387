import type { FastifyReply, FastifyRequest } from "fastify";
import type { components } from "./generated/api.js";
import type { CalendarService } from "./service.js";

type EventType = components["schemas"]["EventType"];
type BookingRequest = components["schemas"]["BookingRequest"];
type IdParams = { Params: { id: string } };

/**
 * Обработчики по operationId из OpenAPI: fastify-openapi-glue строит по спецификации маршруты и
 * проверку запросов, а сюда приходят уже проверенные данные.
 */
export class Handlers {
  constructor(private readonly service: CalendarService) {}

  async listEventTypes() {
    return this.service.listEventTypes();
  }

  async createEventType(request: FastifyRequest<{ Body: EventType }>, reply: FastifyReply) {
    reply.code(201);
    return this.service.createEventType(request.body);
  }

  async getEventType(request: FastifyRequest<IdParams>) {
    return this.service.getEventType(request.params.id);
  }

  async listSlots(request: FastifyRequest<IdParams>) {
    return this.service.listSlots(request.params.id);
  }

  async listBookings() {
    return this.service.listBookings();
  }

  async createBooking(request: FastifyRequest<{ Body: BookingRequest }>, reply: FastifyReply) {
    reply.code(201);
    return this.service.createBooking(request.body);
  }
}
