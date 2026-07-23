import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/nestjs";
import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";

import { requestContext } from "./request-context";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

interface HttpRequest {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  originalUrl: string;
  route?: { path?: string };
}

interface HttpResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  on(event: "finish", listener: () => void): void;
}

export function resolveRequestId(value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === "string" && SAFE_REQUEST_ID.test(candidate)
    ? candidate
    : randomUUID();
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HttpRequest");

  use(
    request: HttpRequest,
    response: HttpResponse,
    next: () => void,
  ): void {
    const requestId = resolveRequestId(request.headers["x-request-id"]);
    const startedAt = performance.now();

    response.setHeader("X-Request-Id", requestId);
    requestContext.run({ requestId }, () => {
      Sentry.getIsolationScope().setTag("request_id", requestId);
      response.on("finish", () => {
        const route =
          request.route?.path ??
          new URL(request.originalUrl, "http://api.internal").pathname;
        this.logger.log({
          event: "request.completed",
          method: request.method,
          route,
          statusCode: response.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
        });
      });
      next();
    });
  }
}
