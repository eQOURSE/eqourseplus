import { randomUUID } from "node:crypto";

import * as Sentry from "@sentry/nestjs";
import {
  Controller,
  Get,
  type INestApplication,
  Logger,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { Public } from "../src/auth/public.decorator";
import { DatabaseConnectionService } from "../src/database/database-connection.service";
import { JsonLogger } from "../src/observability/json-logger";

const DELIBERATE_API_ERROR_MESSAGE = "FR-FND-06 deliberate API error";

@Controller("__test__/observability")
@Public()
class DeliberateErrorController {
  @Get("error")
  throwError(): never {
    throw new Error(DELIBERATE_API_ERROR_MESSAGE);
  }

  @Get("log")
  logRequest(): { status: string } {
    new Logger(DeliberateErrorController.name).log("request log probe");
    return { status: "ok" };
  }
}

describe("FR-FND-06 API observability", () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
    await Sentry.close(0);
    delete process.env.JWT_SECRET;
  });

  async function createApp(logger?: JsonLogger): Promise<INestApplication> {
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [DeliberateErrorController],
    })
      .overrideProvider(DatabaseConnectionService)
      .useValue({})
      .compile();

    const nestApp = moduleRef.createNestApplication({
      logger: logger ?? false,
    });
    await nestApp.init();
    return nestApp;
  }

  it("sends the deliberately thrown API error through Sentry without a live DSN", async () => {
    const envelopes: unknown[] = [];
    Sentry.init({
      dsn: "https://public@example.invalid/1",
      integrations: [],
      transport: () => ({
        send: (envelope) => {
          envelopes.push(envelope);
          return Promise.resolve({ statusCode: 200 });
        },
        flush: () => Promise.resolve(true),
      }),
    });
    app = await createApp();

    await request(app.getHttpServer())
      .get("/__test__/observability/error")
      .expect(500);
    await Sentry.flush(1_000);

    expect(JSON.stringify(envelopes)).toContain(DELIBERATE_API_ERROR_MESSAGE);
  });

  it("honors or mints a request id and returns it on the response", async () => {
    app = await createApp();
    const incomingRequestId = "web-request-123";

    await request(app.getHttpServer())
      .get("/health")
      .set("X-Request-Id", incomingRequestId)
      .expect("X-Request-Id", incomingRequestId)
      .expect(200);

    const generatedResponse = await request(app.getHttpServer())
      .get("/health")
      .expect(200);
    expect(generatedResponse.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("adds the request id to every log emitted inside that request", async () => {
    const lines: string[] = [];
    const logger = new JsonLogger((line) => lines.push(line));
    app = await createApp(logger);
    const requestId = randomUUID();

    await request(app.getHttpServer())
      .get("/__test__/observability/log")
      .set("X-Request-Id", requestId)
      .expect(200);

    const requestLines = lines
      .map(
        (line) =>
          JSON.parse(line) as {
            message: string | { event?: string };
            requestId: string | null;
          },
      )
      .filter(
        (line) =>
          line.message === "request log probe" ||
          (typeof line.message === "object" &&
            line.message.event === "request.completed"),
      );
    expect(requestLines).toHaveLength(2);
    expect(requestLines.every((line) => line.requestId === requestId)).toBe(true);
  });

  it("redacts PII, bearer tokens, and credentialed connection URLs", () => {
    const lines: string[] = [];
    const logger = new JsonLogger((line) => lines.push(line));
    const email = "worker@example.com";
    const bearerToken = "Bearer secret-access-token";
    const connectionUrl =
      "mongodb+srv://db-user:db-password@cluster.example.com/eqplus";

    logger.log(
      {
        email,
        authorization: bearerToken,
        connectionString: connectionUrl,
      },
      "RedactionProbe",
    );

    expect(lines).toHaveLength(1);
    expect(() => JSON.parse(lines[0])).not.toThrow();
    expect(lines[0]).not.toContain(email);
    expect(lines[0]).not.toContain(bearerToken);
    expect(lines[0]).not.toContain(connectionUrl);
  });
});
