import {
  Controller,
  Get,
  type INestApplication,
  Req,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { configureTrustProxy } from "../src/trust-proxy.config";

@Controller("test/client-ip")
class ClientIpController {
  @Get()
  read(@Req() incoming: { ip: string }): { ip: string } {
    return { ip: incoming.ip };
  }
}

describe("API trust-proxy bootstrap configuration", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClientIpController],
    }).compile();
    app = moduleRef.createNestApplication();
    configureTrustProxy(app);
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it("uses Cloud Run's appended client address instead of a forged leading value", async () => {
    const response = await request(app.getHttpServer())
      .get("/test/client-ip")
      .set("x-forwarded-for", "203.0.113.1, 198.51.100.42")
      .expect(200);

    expect(response.body).toEqual({ ip: "198.51.100.42" });
  });
});
