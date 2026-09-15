import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connection } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { SkillTaxonomyStatus } from "../src/database/skill-taxonomy.schema";

describe("FR-REG-08A and FR-REG-02B skill taxonomy read API", () => {
  let app: INestApplication;
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri("skill_taxonomy_read_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    process.env.VENDOR_IDENTIFIER_HMAC_SECRET =
      "test-only-vendor-hmac-secret-at-least-32-characters";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    const express = app.getHttpAdapter().getInstance() as {
      set(setting: string, value: boolean): void;
    };
    express.set("trust proxy", true);
    await app.init();

    await connection.collection("skillTaxonomy").insertMany([
      {
        businessUnit: "TUTRAIN",
        serviceLine: "Tutoring",
        skill: "Mathematics",
        slug: "tutrain-tutoring-mathematics",
        status: SkillTaxonomyStatus.ACTIVE,
        version: 3,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Polygon",
        slug: "eqourse-ai-data-services-annotation-polygon",
        status: SkillTaxonomyStatus.ACTIVE,
        version: 2,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Bounding Box",
        slug: "eqourse-ai-data-services-annotation-bounding-box",
        status: SkillTaxonomyStatus.ACTIVE,
        version: 1,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        businessUnit: "EQOURSE",
        serviceLine: "Content Services",
        skill: "Legacy Editing",
        slug: "eqourse-content-services-legacy-editing",
        status: SkillTaxonomyStatus.DEPRECATED,
        version: 4,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);
  }, 120_000);

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.VENDOR_IDENTIFIER_HMAC_SECRET;
    if (app) await app.close();
    if (connection.readyState !== 0) await connection.close();
    if (memoryServer) await memoryServer.stop();
  });

  it("returns only active selector fields publicly in deterministic order", async () => {
    const first = await request(app.getHttpServer())
      .get("/api/v1/skill-taxonomy")
      .set("x-forwarded-for", "198.51.100.10")
      .expect(200);
    const second = await request(app.getHttpServer())
      .get("/api/v1/skill-taxonomy")
      .set("x-forwarded-for", "198.51.100.10")
      .expect(200);

    const expected = [
      {
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Bounding Box",
        slug: "eqourse-ai-data-services-annotation-bounding-box",
      },
      {
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Polygon",
        slug: "eqourse-ai-data-services-annotation-polygon",
      },
      {
        businessUnit: "TUTRAIN",
        serviceLine: "Tutoring",
        skill: "Mathematics",
        specialization: null,
        slug: "tutrain-tutoring-mathematics",
      },
    ];

    expect(first.body).toEqual(expected);
    expect(second.body).toEqual(expected);
    expect(first.headers["cache-control"]).toBe(
      "public, max-age=300, s-maxage=3600",
    );
    expect(JSON.stringify(first.body)).not.toContain("legacy-editing");
    for (const row of first.body as Array<Record<string, unknown>>) {
      expect(Object.keys(row).sort()).toEqual(
        ["businessUnit", "serviceLine", "skill", "slug", "specialization"].sort(),
      );
    }

    // `null` is only the stable API response shape; persistence still keeps optional values absent.
    expect(first.body[2].specialization).toBeNull();
  });

  it("allows 60 requests per minute per IP and rejects the sixty-first", async () => {
    for (let requestNumber = 0; requestNumber < 60; requestNumber += 1) {
      await request(app.getHttpServer())
        .get("/api/v1/skill-taxonomy")
        .set("x-forwarded-for", "198.51.100.60")
        .expect(200);
    }

    await request(app.getHttpServer())
      .get("/api/v1/skill-taxonomy")
      .set("x-forwarded-for", "198.51.100.60")
      .expect(429);
  });
});
