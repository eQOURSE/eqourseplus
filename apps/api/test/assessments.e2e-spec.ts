import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, disconnect, mongo as mongoDriver } from "mongoose";
import { createRequire } from "node:module";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Test as NestTest } from "@nestjs/testing";
import { APP_GUARD } from "@nestjs/core";
import type { CanActivate, ExecutionContext, INestApplication } from "@nestjs/common";
import request from "supertest";

import { AssessmentService } from "../src/assessments/assessment.service";
import { TestModel } from "../src/assessments/test.schema";
import { TestAttemptModel } from "../src/assessments/test-attempt.schema";
import { SkillTaxonomyModel } from "../src/database/skill-taxonomy.schema";
import { BusinessUnit } from "@eqourse/shared";
import { SkillTaxonomyStatus } from "../src/database/skill-taxonomy.schema";
import { ProfileModel } from "../src/profiles/profile.schema";
import { AssessmentController } from "../src/assessments/assessment.controller";
import { ProfileState, Role } from "@eqourse/shared";

describe("FR-TST-01/05/06 assessment engine", () => {
  let mongo: MongoMemoryServer;
  let service: AssessmentService;
  let now: Date;
  const slug = "eqourse-content-services-curriculum";
  const userId = "507f1f77bcf86cd799439011";

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const client = new mongoDriver.MongoClient(mongo.getUri());
    await client.connect();
    const require = createRequire(import.meta.url);
    const migration = require("../database/migrations/20260924000000-create-assessments.cjs") as {
      up: (database: mongoDriver.Db) => Promise<void>;
    };
    await migration.up(client.db("test"));
    await client.close();
    await connect(mongo.getUri());
    await Promise.all([TestModel.init(), TestAttemptModel.init()]);
  });

  afterAll(async () => {
    await disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      TestModel.deleteMany({}),
      TestAttemptModel.deleteMany({}),
      SkillTaxonomyModel.deleteMany({}),
      ProfileModel.deleteMany({}),
    ]);
    await SkillTaxonomyModel.create({
      slug,
      businessUnit: BusinessUnit.EQOURSE,
      serviceLine: "Content Services",
      skill: "Curriculum",
      specialization: null,
      status: SkillTaxonomyStatus.ACTIVE,
      version: 1,
    });
    now = new Date("2026-09-24T10:00:00Z");
    await ProfileModel.create({ userId, state: ProfileState.SUBMITTED, assessmentBadges: [] });
    service = new AssessmentService(() => now);
  });

  async function configure(): Promise<void> {
    await service.configure({
      taxonomySlug: slug,
      timeLimitSeconds: 60,
      questionCount: 2,
      passThresholdPercent: 50,
      cooldownDays: 14,
      maxAttempts: 2,
      tierBands: { silverMinPercent: 70, goldMinPercent: 90 },
    });
    for (let n = 1; n <= 4; n++) {
      await service.addQuestion(slug, {
        id: `q${n}`,
        kind: "MCQ",
        status: "DRAFT",
        prompt: `Question ${n}`,
        difficulty: "MEDIUM",
        options: ["a", "b", "c", "d"].map((id) => ({ id, text: `${n}-${id}` })),
        correctOptionId: "a",
      });
      await service.approveQuestion(slug, `q${n}`);
    }
  }

  it("configures a taxonomy category and serves randomized approved MCQs without keys", async () => {
    await configure();
    const attempt = await service.start(userId, slug);
    expect(attempt.items).toHaveLength(2);
    expect(JSON.stringify(attempt)).not.toContain("correctOptionId");
    expect(attempt.expiresAt).toEqual("2026-09-24T10:01:00.000Z");
    expect(attempt.remainingAttempts).toBe(1);
  });

  it("scores on the server, assigns a tier, and enforces cooldown and max attempts", async () => {
    await configure();
    const first = await service.start(userId, slug);
    const result = await service.submit(userId, first.id, []);
    expect(result.status).toBe("FAILED");
    await expect(service.start(userId, slug)).rejects.toThrow(/cooldown/i);
    now = new Date("2026-10-08T10:00:00Z");
    const second = await service.start(userId, slug);
    const saved = await TestAttemptModel.findById(second.id).lean();
    const answers = saved!.items.map((item) => ({
      questionId: item.questionId,
      optionId: item.correctOptionId,
    }));
    const passed = await service.submit(userId, second.id, answers);
    expect(passed.status).toBe("PASSED");
    expect(passed.tier).toBe("GOLD");
    const profile = await ProfileModel.findOne({ userId }).lean();
    expect(profile?.assessmentBadges).toMatchObject([{ taxonomySlug: slug, tier: "GOLD", scorePercent: 100 }]);
    await expect(service.start(userId, slug)).rejects.toThrow(/maximum/i);
  });

  it("keeps the scoring threshold that was active when the attempt began", async () => {
    await configure();
    const started = await service.start(userId, slug);
    await service.configure({
      taxonomySlug: slug, timeLimitSeconds: 60, questionCount: 2,
      passThresholdPercent: 90, cooldownDays: 14, maxAttempts: 2,
      tierBands: { silverMinPercent: 90, goldMinPercent: 100 },
    });
    const saved = await TestAttemptModel.findById(started.id).lean();
    const oneCorrect = [{ questionId: saved!.items[0]!.questionId, optionId: saved!.items[0]!.correctOptionId }];
    expect((await service.submit(userId, started.id, oneCorrect)).status).toBe("PASSED");
  });

  it("uses the server deadline and holds flagged results for review", async () => {
    await configure();
    const first = await service.start(userId, slug);
    await service.recordViolation(userId, first.id, "TAB_SWITCH");
    const saved = await TestAttemptModel.findById(first.id).lean();
    const answers = saved!.items.map((item) => ({
      questionId: item.questionId,
      optionId: item.correctOptionId,
    }));
    const flagged = await service.submit(userId, first.id, answers);
    expect(flagged.status).toBe("UNDER_REVIEW");
    expect(flagged.violations).toHaveLength(1);
    expect((await service.reviewQueue([BusinessUnit.EQOURSE]))[0]).toMatchObject({
      id: first.id, taxonomySlug: slug, violationCount: 1,
    });
    expect((await ProfileModel.findOne({ userId }).lean())?.assessmentBadges).toHaveLength(0);

    now = new Date("2026-09-24T10:01:01Z");
    await expect(service.submit(userId, first.id, answers)).rejects.toThrow();
  });

  it("runs the configured test through authenticated HTTP routes and hides keys", async () => {
    class TestIdentityGuard implements CanActivate {
      canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<{ headers: Record<string, string>; authUser?: object }>();
        const role = req.headers["x-test-role"] ?? Role.FREELANCER;
        req.authUser = {
          id: userId,
          profileState: ProfileState.SUBMITTED,
          roleAssignments: [{ role, businessUnit: BusinessUnit.EQOURSE }],
        };
        return true;
      }
    }
    const module = await NestTest.createTestingModule({
      controllers: [AssessmentController],
      providers: [AssessmentService, { provide: APP_GUARD, useClass: TestIdentityGuard }],
    }).compile();
    const app: INestApplication = module.createNestApplication();
    await app.init();
    try {
      const config = {
        taxonomySlug: slug, timeLimitSeconds: 60, questionCount: 1,
        passThresholdPercent: 50, cooldownDays: 14, maxAttempts: 2,
        tierBands: { silverMinPercent: 70, goldMinPercent: 90 },
      };
      await request(app.getHttpServer()).put("/api/v1/tests/config").set("x-test-role", Role.SUPER_ADMIN)
        .send(config).expect(200);
      const question = {
        id: "q1", kind: "MCQ", status: "DRAFT", prompt: "Which is correct?", difficulty: "EASY",
        options: ["a", "b", "c", "d"].map((id) => ({ id, text: id })), correctOptionId: "a",
      };
      await request(app.getHttpServer()).post(`/api/v1/tests/${slug}/questions`)
        .set("x-test-role", Role.SUPER_ADMIN).send(question).expect(201);
      await request(app.getHttpServer()).post(`/api/v1/tests/${slug}/questions/q1/approve`)
        .set("x-test-role", Role.SUPER_ADMIN).expect(201);
      await request(app.getHttpServer()).get(`/api/v1/tests/${slug}/questions`)
        .set("x-test-role", Role.FREELANCER).expect(403);
      const bank = await request(app.getHttpServer()).get(`/api/v1/tests/${slug}/questions`)
        .set("x-test-role", Role.SUPER_ADMIN).expect(200);
      expect(bank.body[0].correctOptionId).toBe("a");
      const catalog = await request(app.getHttpServer()).get("/api/v1/tests/catalog")
        .set("x-test-role", Role.FREELANCER).expect(200);
      expect(catalog.body[0].taxonomySlug).toBe(slug);
      expect(JSON.stringify(catalog.body)).not.toContain("correctOptionId");
      const started = await request(app.getHttpServer()).post(`/api/v1/tests/${slug}/attempts`)
        .set("x-test-role", Role.FREELANCER).expect(201);
      expect(JSON.stringify(started.body)).not.toContain("correctOptionId");
      const attempt = await TestAttemptModel.findById(started.body.id).lean();
      const submitted = await request(app.getHttpServer()).post(`/api/v1/tests/attempts/${started.body.id}/submit`)
        .set("x-test-role", Role.FREELANCER)
        .send({ answers: [{ questionId: "q1", optionId: attempt!.items[0]!.correctOptionId }] }).expect(200);
      expect(submitted.body.status).toBe("PASSED");
      await request(app.getHttpServer()).get(`/api/v1/tests/attempts/${started.body.id}/report`)
        .set("x-test-role", Role.FREELANCER).expect(403);
      const report = await request(app.getHttpServer()).get(`/api/v1/tests/attempts/${started.body.id}/report`)
        .set("x-test-role", Role.VERIFIER).expect(200);
      expect(report.body.scorePercent).toBe(100);
      const badge = await request(app.getHttpServer()).get(`/api/v1/tests/profiles/${userId}/badges/${slug}`)
        .set("x-test-role", Role.VERIFIER).expect(200);
      expect(badge.body.tier).toBe("GOLD");
    } finally {
      await app.close();
    }
  });
});
