import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, it } from "vitest";

import { AppModule } from "../src/app.module";
import { DatabaseConnectionService } from "../src/database/database-connection.service";

describe("GET /health (FR-FND-01)", () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("returns HTTP 200", async () => {
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseConnectionService)
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get("/health").expect(200);
    delete process.env.JWT_SECRET;
  });
});
