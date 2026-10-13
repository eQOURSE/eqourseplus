import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { BusinessUnit, ProfileState, Role } from "@eqourse/shared";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connection, Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { JwtTokenService } from "../src/auth/jwt-token.service";

describe("FR-REG-07 freelancer verifier console API", () => {
  let app: INestApplication;
  let replicaSet: MongoMemoryReplSet;

  beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = replicaSet.getUri("profile_reviews_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    process.env.VENDOR_IDENTIFIER_HMAC_SECRET = "test-only-vendor-hmac-secret-at-least-32-characters";
    process.env.CLIENT_IDENTIFIER_HMAC_SECRET = "test-only-client-hmac-secret-at-least-32-characters";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 90_000);

  beforeEach(async () => {
    await Promise.all([
      connection.collection("users").deleteMany({}),
      connection.collection("profiles").deleteMany({}),
      connection.collection("auditLogs").deleteMany({}),
    ]);
  });

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.VENDOR_IDENTIFIER_HMAC_SECRET;
    delete process.env.CLIENT_IDENTIFIER_HMAC_SECRET;
    if (app) await app.close();
    if (connection.readyState !== 0) await connection.close();
    if (replicaSet) await replicaSet.stop();
  });

  async function user(role?: Role) {
    const id = new Types.ObjectId();
    await connection.collection("users").insertOne({
      _id: id,
      email: `${id.toHexString()}@example.test`,
      countryCode: "IN",
      roleAssignments: role ? [{ role, businessUnit: BusinessUnit.EQOURSE }] : [],
      deviceFingerprints: [],
      reviewFlags: [],
      refreshSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      id,
      token: app.get(JwtTokenService).issuePair(id.toHexString(), new Date()).accessToken,
    };
  }

  async function profile(state: ProfileState = ProfileState.SUBMITTED) {
    const id = new Types.ObjectId();
    const submittedAt = new Date("2026-10-10T08:00:00.000Z");
    await connection.collection("profiles").insertOne({
      _id: id,
      userId: new Types.ObjectId(),
      state,
      submittedAt,
      personal: { firstName: "Ada", lastName: "Lovelace", headline: "Analyst" },
      education: [{ institution: "Example University", qualification: "Degree", fieldOfStudy: "Math", startYear: 2020 }],
      experience: { totalMonths: 24, entries: [{ organization: "Example", title: "Analyst", startDate: new Date("2024-01-01") }] },
      createdAt: submittedAt,
      updatedAt: submittedAt,
    });
    return { id, submittedAt };
  }

  const auth = (token: string) => ({ authorization: `Bearer ${token}` });

  it("allows only Verifiers and keeps queue results free of profile PII", async () => {
    const verifier = await user(Role.VERIFIER);
    const ordinary = await user(Role.FREELANCER);
    const submitted = await profile();
    const queue = await request(app.getHttpServer())
      .get("/api/v1/profiles/reviews")
      .set(auth(verifier.token))
      .expect(200);
    expect(queue.body).toEqual([{
      id: submitted.id.toHexString(),
      state: ProfileState.SUBMITTED,
      submittedAt: submitted.submittedAt.toISOString(),
    }]);
    expect(JSON.stringify(queue.body)).not.toContain("Ada");
    await request(app.getHttpServer()).get("/api/v1/profiles/reviews").expect(401);
    await request(app.getHttpServer()).get("/api/v1/profiles/reviews").set(auth(ordinary.token)).expect(403);
  });

  it("opens the submitted profile and records approve-for-testing with an audit entry", async () => {
    const verifier = await user(Role.VERIFIER);
    const submitted = await profile();
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/profiles/reviews/${submitted.id}`)
      .set(auth(verifier.token))
      .expect(200);
    expect(detail.body).toMatchObject({
      _id: submitted.id.toHexString(),
      state: ProfileState.SUBMITTED,
      personal: { firstName: "Ada", lastName: "Lovelace" },
    });
    const decision = await request(app.getHttpServer())
      .post(`/api/v1/profiles/reviews/${submitted.id}/decisions`)
      .set(auth(verifier.token))
      .send({ decision: "START_REVIEW", reason: "Profile evidence is ready for review" })
      .expect(201);
    expect(decision.body.state).toBe(ProfileState.UNDER_REVIEW);
    await request(app.getHttpServer())
      .post(`/api/v1/profiles/reviews/${submitted.id}/decisions`)
      .set(auth(verifier.token))
      .send({ decision: "APPROVE", reason: "Profile evidence passed initial checks" })
      .expect(201);
    expect((await connection.collection("profiles").findOne({ _id: submitted.id }))?.state).toBe(ProfileState.TEST_PENDING);
    expect(await connection.collection("auditLogs").countDocuments({ subjectId: submitted.id })).toBe(2);
  });

  it("requires a reason and rejects invalid state transitions", async () => {
    const verifier = await user(Role.VERIFIER);
    const submitted = await profile();
    await request(app.getHttpServer())
      .post(`/api/v1/profiles/reviews/${submitted.id}/decisions`)
      .set(auth(verifier.token))
      .send({ decision: "START_REVIEW" })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/profiles/reviews/${submitted.id}/decisions`)
      .set(auth(verifier.token))
      .send({ decision: "APPROVE", reason: "Cannot skip review" })
      .expect(400);
    expect(await connection.collection("auditLogs").countDocuments({ subjectId: submitted.id })).toBe(0);
  });

  it("rejects a reason that copies reviewed profile data", async () => {
    const verifier = await user(Role.VERIFIER);
    const submitted = await profile();
    await request(app.getHttpServer())
      .post(`/api/v1/profiles/reviews/${submitted.id}/decisions`)
      .set(auth(verifier.token))
      .send({ decision: "START_REVIEW", reason: "Reviewed Ada Lovelace profile" })
      .expect(400);
    expect(await connection.collection("auditLogs").countDocuments({ subjectId: submitted.id })).toBe(0);
  });
});
