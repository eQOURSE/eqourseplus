import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connection, Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { JwtTokenService } from "../src/auth/jwt-token.service";

describe("FR-REG-02B authenticated profile draft API", () => {
  let app: INestApplication;
  let memoryServer: MongoMemoryReplSet;

  beforeAll(async () => {
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = memoryServer.getUri("profile_draft_api_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    process.env.VENDOR_IDENTIFIER_HMAC_SECRET =
      "test-only-vendor-hmac-secret-at-least-32-characters";
    process.env.CLIENT_IDENTIFIER_HMAC_SECRET =
      "test-only-client-hmac-secret-at-least-32-characters";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 60_000);

  beforeEach(async () => {
    await connection.collection("users").deleteMany({});
    await connection.collection("profiles").deleteMany({});
    await connection.collection("skillTaxonomy").deleteMany({});
  });

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.VENDOR_IDENTIFIER_HMAC_SECRET;
    delete process.env.CLIENT_IDENTIFIER_HMAC_SECRET;
    if (app) await app.close();
    if (connection.readyState !== 0) await connection.close();
    if (memoryServer) await memoryServer.stop();
  });

  async function account(email: string) {
    const userId = new Types.ObjectId();
    const now = new Date();
    await connection.collection("users").insertOne({
      _id: userId,
      email,
      countryCode: "IN",
      roleAssignments: [],
      deviceFingerprints: [],
      reviewFlags: [],
      refreshSessions: [],
      createdAt: now,
      updatedAt: now,
    });
    await connection.collection("profiles").insertOne({
      userId,
      state: "DRAFT",
      createdAt: now,
      updatedAt: now,
    });
    const accessToken = app
      .get(JwtTokenService)
      .issuePair(userId.toHexString(), now).accessToken;
    return { accessToken, userId };
  }

  function readProfile(accessToken: string) {
    return request(app.getHttpServer())
      .get("/api/v1/profiles/me")
      .set("authorization", `Bearer ${accessToken}`);
  }

  function saveProfile(accessToken: string, body: object) {
    return request(app.getHttpServer())
      .patch("/api/v1/profiles/me")
      .set("authorization", `Bearer ${accessToken}`)
      .send(body);
  }

  function submitProfile(accessToken: string) {
    return request(app.getHttpServer())
      .post("/api/v1/profiles/me/submit")
      .set("authorization", `Bearer ${accessToken}`)
      .send({});
  }

  it("requires the authenticated FR-REG-02A transport", async () => {
    await request(app.getHttpServer()).get("/api/v1/profiles/me").expect(401);
    await request(app.getHttpServer())
      .patch("/api/v1/profiles/me")
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post("/api/v1/profiles/me/samples/upload-url")
      .send({ contentType: "application/pdf", size: 128 })
      .expect(401);
  });

  it("reads a fresh empty draft without inventing a resume section", async () => {
    const owner = await account("fresh-profile@example.com");
    const response = await readProfile(owner.accessToken).expect(200);

    expect(response.body).toMatchObject({
      userId: owner.userId.toHexString(),
      state: "DRAFT",
      completionPercentage: 0,
    });
    expect(response.body).not.toHaveProperty("resumeSection");
    expect(response.headers["cache-control"]).toContain("no-store");
    await request(app.getHttpServer())
      .post("/api/v1/profiles")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({})
      .expect(404);
  });

  it("accepts a wholly empty draft save and keeps optional BSON fields absent", async () => {
    const owner = await account("empty-profile@example.com");
    await saveProfile(owner.accessToken, {}).expect(200);
    await saveProfile(owner.accessToken, {
      personal: { firstName: "Ada" },
    }).expect(200);

    const stored = await connection
      .collection("profiles")
      .findOne({ userId: owner.userId });
    expect(stored?.personal).toEqual({ firstName: "Ada" });
    expect(stored?.personal).not.toHaveProperty("lastName");
    expect(stored).not.toHaveProperty("resumeSection");
    expect(JSON.stringify(stored)).not.toContain(":null");

    await saveProfile(owner.accessToken, {
      personal: { firstName: "Ada", lastName: null },
    }).expect(400);
  });

  it("submits a complete draft through the guarded, audited profile transition", async () => {
    const owner = await account("submit-profile@example.com");
    await connection.collection("skillTaxonomy").insertOne({
      businessUnit: "EQOURSE",
      serviceLine: "AI Data Services",
      skill: "Annotation",
      specialization: "Bounding Box",
      slug: "eqourse-ai-data-services-annotation-bounding-box",
      status: "ACTIVE",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveProfile(owner.accessToken, {
      personal: { firstName: "Ada", lastName: "Lovelace" },
      education: [{ institution: "University", qualification: "Certificate", fieldOfStudy: "Math", startYear: 2020 }],
      skills: [{ taxonomySlug: "eqourse-ai-data-services-annotation-bounding-box", level: "EXPERT" }],
      languages: [{ languageCode: "en-GB", proficiency: "NATIVE" }],
      experience: { totalMonths: 24, entries: [{ organization: "Example", title: "Annotator", startDate: "2024-01-01" }] },
      availability: { availableFrom: "2026-10-01", weeklyHours: 40, timeZone: "Europe/London" },
      rate: { amountMinor: 12_500, currencyCode: "GBP", unit: "HOUR" },
    }).expect(200);

    const submitted = await submitProfile(owner.accessToken).expect(200);
    expect(submitted.body).toMatchObject({ state: "SUBMITTED", completionPercentage: 100 });
    expect((await saveProfile(owner.accessToken, { personal: { city: "London" } })).status).toBe(400);

    const audit = await connection.collection("auditLogs").findOne({
      subjectCollection: "profiles",
      actorUserId: owner.userId,
    });
    expect(audit).toMatchObject({
      actorUserId: owner.userId,
      fromState: "DRAFT",
      toState: "SUBMITTED",
      reason: "Profile submitted by the account holder for review.",
    });
  });

  it("persists and resumes each in-scope section independently", async () => {
    const owner = await account("resume-profile@example.com");
    const saves = [
      { personal: { firstName: "Ada", headline: "Data specialist" } },
      {
        education: [
          { institution: "Example University", startYear: 2020 },
        ],
      },
      {
        skills: [
          {
            taxonomySlug:
              "eqourse-ai-data-services-annotation-bounding-box",
            level: "ADVANCED",
          },
        ],
      },
      {
        languages: [
          { languageCode: "en-IN", proficiency: "PROFESSIONAL" },
        ],
      },
      {
        experience: {
          totalMonths: 24,
          entries: [{ organization: "Example Ltd" }],
        },
      },
      {
        availability: {
          availableFrom: "2026-10-01T00:00:00.000Z",
          weeklyHours: 40,
          timeZone: "Asia/Kolkata",
        },
      },
      { rate: { amountMinor: 10_000, currencyCode: "INR", unit: "HOUR" } },
      { resumeSection: "RATE" },
    ];

    await connection.collection("skillTaxonomy").insertOne({
      businessUnit: "EQOURSE",
      serviceLine: "AI Data Services",
      skill: "Annotation",
      specialization: "Bounding Box",
      slug: "eqourse-ai-data-services-annotation-bounding-box",
      status: "ACTIVE",
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const body of saves) {
      await saveProfile(owner.accessToken, body).expect(200);
    }

    const resumed = await readProfile(owner.accessToken).expect(200);
    expect(resumed.body).toMatchObject({
      personal: { firstName: "Ada", headline: "Data specialist" },
      education: [{ institution: "Example University", startYear: 2020 }],
      skills: [
        {
          taxonomySlug:
            "eqourse-ai-data-services-annotation-bounding-box",
          level: "ADVANCED",
        },
      ],
      languages: [
        { languageCode: "en-IN", proficiency: "PROFESSIONAL" },
      ],
      experience: {
        totalMonths: 24,
        entries: [{ organization: "Example Ltd" }],
      },
      availability: {
        availableFrom: "2026-10-01T00:00:00.000Z",
        weeklyHours: 40,
        timeZone: "Asia/Kolkata",
      },
      rate: { amountMinor: 10_000, currencyCode: "INR", unit: "HOUR" },
      resumeSection: "RATE",
    });
  });

  it("uses the fixed denominator when additional partial entries are added", async () => {
    const owner = await account("completion-profile@example.com");
    await connection.collection("skillTaxonomy").insertMany([
      {
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Bounding Box",
        slug: "eqourse-ai-data-services-annotation-bounding-box",
        status: "ACTIVE",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        businessUnit: "TUTRAIN",
        serviceLine: "Tutoring",
        skill: "NEET Biology",
        specialization: null,
        slug: "tutrain-tutoring-neet-biology",
        status: "ACTIVE",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const firstEntries = {
      personal: { firstName: "Ada", lastName: "Lovelace" },
      education: [
        {
          institution: "University of London",
          qualification: "Certificate",
          fieldOfStudy: "Mathematics",
          startYear: 2020,
        },
      ],
      skills: [
        {
          taxonomySlug:
            "eqourse-ai-data-services-annotation-bounding-box",
          level: "EXPERT",
        },
      ],
      languages: [{ languageCode: "en-GB", proficiency: "NATIVE" }],
      experience: {
        totalMonths: 120,
        entries: [
          {
            organization: "Analytical Engine",
            title: "Programmer",
            startDate: "2020-01-01T00:00:00.000Z",
          },
        ],
      },
      availability: {
        availableFrom: "2026-10-01T00:00:00.000Z",
        weeklyHours: 40,
        timeZone: "Europe/London",
      },
      rate: { amountMinor: 12_500, currencyCode: "GBP", unit: "HOUR" },
    };

    await saveProfile(owner.accessToken, firstEntries).expect(200);
    const before = await readProfile(owner.accessToken).expect(200);

    await saveProfile(owner.accessToken, {
      education: [
        ...firstEntries.education,
        { institution: "A second, still-partial education entry" },
      ],
      skills: [
        ...firstEntries.skills,
        { taxonomySlug: "tutrain-tutoring-neet-biology" },
      ],
      experience: {
        ...firstEntries.experience,
        entries: [
          ...firstEntries.experience.entries,
          { organization: "A second, still-partial experience entry" },
        ],
      },
    }).expect(200);
    const after = await readProfile(owner.accessToken).expect(200);

    expect(before.body.completionPercentage).toBe(100);
    expect(after.body.completionPercentage).toBe(
      before.body.completionPercentage,
    );
  });

  it("accepts existing deprecated skills and rejects unknown taxonomy slugs atomically", async () => {
    const owner = await account("taxonomy-profile@example.com");
    await connection.collection("skillTaxonomy").insertOne({
      businessUnit: "EQOURSE",
      serviceLine: "Content Services",
      skill: "Curriculum",
      specialization: null,
      slug: "eqourse-content-services-curriculum",
      status: "DEPRECATED",
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await saveProfile(owner.accessToken, {
      skills: [
        {
          taxonomySlug: "eqourse-content-services-curriculum",
          level: "INTERMEDIATE",
        },
      ],
    }).expect(200);
    await saveProfile(owner.accessToken, {
      skills: [{ taxonomySlug: "does-not-exist", level: "EXPERT" }],
    }).expect(400);

    expect(
      (await readProfile(owner.accessToken).expect(200)).body.skills,
    ).toEqual([
      {
        taxonomySlug: "eqourse-content-services-curriculum",
        level: "INTERMEDIATE",
      },
    ]);
  });

  it("issues owner-scoped sample keys and rejects client-chosen foreign keys", async () => {
    const owner = await account("owner-profile@example.com");
    const other = await account("other-profile@example.com");

    await saveProfile(owner.accessToken, { state: "APPROVED" }).expect(400);
    await saveProfile(owner.accessToken, { completionPercentage: 100 }).expect(
      400,
    );
    const upload = await request(app.getHttpServer())
      .post("/api/v1/profiles/me/samples/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ contentType: "application/pdf", size: 128 })
      .expect(201);

    expect(upload.body.objectKey).toMatch(/^profiles\/[a-f0-9]{24}\/samples\//);
    expect(upload.body.uploadUrl).toBe("https://storage.invalid/" + encodeURIComponent(upload.body.objectKey));

    await saveProfile(owner.accessToken, {
      samples: [{ title: "Portfolio", objectKey: upload.body.objectKey }],
    }).expect(200);

    await saveProfile(owner.accessToken, {
      samples: [{ title: "Foreign", objectKey: "profiles/another-user/samples/foreign.pdf" }],
    }).expect(400);

    expect((await readProfile(owner.accessToken).expect(200)).body.samples).toEqual([
      { title: "Portfolio", objectKey: upload.body.objectKey },
    ]);

    const otherRead = await readProfile(other.accessToken).expect(200);
    expect(otherRead.body.userId).toBe(other.userId.toHexString());
    expect(otherRead.body.userId).not.toBe(owner.userId.toHexString());
  });
});
