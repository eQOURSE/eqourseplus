import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { BusinessUnit, Role, VendorState } from "@eqourse/shared";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types, connection } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { JwtTokenService } from "../src/auth/jwt-token.service";
import {
  SkillTaxonomyModel,
  SkillTaxonomyStatus,
} from "../src/database/skill-taxonomy.schema";
import type { VendorRecord } from "../src/vendors/vendor.schema";

describe("FR-REG-08A vendor draft and submission API", () => {
  let app: INestApplication;
  let memoryServer: MongoMemoryServer;
  let vendorModel: Model<VendorRecord>;
  const taxonomySlug = "eqourse-vendor-test-skill";

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri("vendor_endpoints_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    process.env.VENDOR_IDENTIFIER_HMAC_SECRET =
      "test-only-vendor-hmac-secret-at-least-32-characters";

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    vendorModel = app.get<Model<VendorRecord>>(getModelToken("Vendor"));
  }, 60_000);

  beforeEach(async () => {
    await vendorModel.deleteMany({});
    await SkillTaxonomyModel.deleteMany({});
    await SkillTaxonomyModel.create({
      businessUnit: BusinessUnit.EQOURSE,
      serviceLine: "Vendor Services",
      skill: "Testing",
      slug: taxonomySlug,
      status: SkillTaxonomyStatus.ACTIVE,
      version: 1,
    });
  });

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.VENDOR_IDENTIFIER_HMAC_SECRET;
    if (app) await app.close();
    if (connection.readyState !== 0) await connection.close();
    if (memoryServer) await memoryServer.stop();
  });

  async function authenticatedUser(email: string) {
    const user = await connection.collection("users").insertOne({
      _id: new Types.ObjectId(),
      email,
      countryCode: "IN",
      roleAssignments: [{ role: Role.VENDOR, businessUnit: BusinessUnit.EQOURSE }],
      deviceFingerprints: [],
      reviewFlags: [],
      refreshSessions: [],
      profileState: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userId = user.insertedId.toHexString();
    const accessToken = app
      .get(JwtTokenService)
      .issuePair(userId, new Date()).accessToken;
    return { userId, accessToken };
  }

  function vendorPath(pathname: string, accessToken: string) {
    return request(app.getHttpServer())
      .get(`/api/v1/vendors${pathname}`)
      .set("authorization", `Bearer ${accessToken}`);
  }

  function patchVendor(body: object, accessToken: string) {
    return request(app.getHttpServer())
      .patch("/api/v1/vendors/me")
      .set("authorization", `Bearer ${accessToken}`)
      .send(body);
  }

  function postVendor(body: object, accessToken: string) {
    return request(app.getHttpServer())
      .post("/api/v1/vendors")
      .set("authorization", `Bearer ${accessToken}`)
      .send(body);
  }

  const completeIndiaVendor = {
    legalName: "Acme India Private Limited",
    countryCode: "IN",
    registeredAddress: {
      line1: "1 Example Road",
      city: "Bengaluru",
      postalCode: "560001",
      countryCode: "IN",
    },
    contactPerson: {
      name: "Vendor Contact",
      email: "vendor@example.com",
      phone: "+919876543210",
    },
    capabilities: [{ taxonomySlug }],
    countryIdentifiers: [
      { scheme: "GSTIN", value: "27ABCDE1234F1Z5" },
      { scheme: "COMPANY_PAN", value: "ABCDE1234F" },
      { scheme: "UDYAM", value: "UDYAM-IN-00-0000000" },
    ],
    bankDetails: {
      accountHolderName: "Acme India Private Limited",
      bankCountryCode: "IN",
      currencyCode: "INR",
      accountIdentifier: { scheme: "ACCOUNT", value: "123456789" },
    },
    documents: [
      { kind: "GST_CERTIFICATE", objectKey: "vendors/gst.pdf", uploadedAt: "2026-09-12T09:00:00.000Z" },
      { kind: "COMPANY_PAN", objectKey: "vendors/pan.pdf", uploadedAt: "2026-09-12T09:00:00.000Z" },
      { kind: "UDYAM_CERTIFICATE", objectKey: "vendors/udyam.pdf", uploadedAt: "2026-09-12T09:00:00.000Z" },
      { kind: "BANK_PROOF", objectKey: "vendors/bank.pdf", uploadedAt: "2026-09-12T09:00:00.000Z" },
    ],
  };

  it("creates one idempotent draft using only the authenticated owner", async () => {
    const owner = await authenticatedUser("vendor-owner@example.com");

    const first = await postVendor({}, owner.accessToken).expect(201);
    const second = await postVendor({}, owner.accessToken).expect(201);
    const rejected = await postVendor({ ownerUserId: new Types.ObjectId().toHexString() }, owner.accessToken).expect(400);

    expect(first.body).toMatchObject({ ownerUserId: owner.userId, state: VendorState.DRAFT });
    expect(second.body._id).toBe(first.body._id);
    expect(rejected.body.message).toEqual(expect.any(String));
    expect(await vendorModel.countDocuments({ ownerUserId: owner.userId })).toBe(1);
  });

  it("saves a partial draft, computes identifier digests, and rejects unknown fields", async () => {
    const owner = await authenticatedUser("vendor-partial@example.com");
    await postVendor({}, owner.accessToken).expect(201);

    const saved = await patchVendor(
      { legalName: "Acme", countryCode: "IN", countryIdentifiers: [{ scheme: "GSTIN", value: "27 abcde 1234 f1z5" }] },
      owner.accessToken,
    ).expect(200);
    expect(saved.body.countryIdentifiers).toEqual([
      { scheme: "GSTIN", value: "27ABCDE1234F1Z5", lookupDigest: expect.any(String) },
    ]);

    await patchVendor({ unknownField: "must reject" }, owner.accessToken).expect(400);
  });

  it("does not expose another owner's vendor", async () => {
    const ownerA = await authenticatedUser("vendor-a@example.com");
    const ownerB = await authenticatedUser("vendor-b@example.com");
    await postVendor({}, ownerA.accessToken).expect(201);

    await vendorPath("/me", ownerB.accessToken).expect(404);
    await patchVendor({ legalName: "attacker" }, ownerB.accessToken).expect(404);
  });

  it("rejects submission when required country identifiers, documents, or taxonomy are missing", async () => {
    const owner = await authenticatedUser("vendor-incomplete@example.com");
    await postVendor({}, owner.accessToken).expect(201);
    await patchVendor(
      { legalName: "Incomplete Vendor", countryCode: "IN", capabilities: [{ taxonomySlug: "does-not-exist" }] },
      owner.accessToken,
    ).expect(200);

    const response = await request(app.getHttpServer())
      .post("/api/v1/vendors/me/submit")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .expect(400);
    expect(JSON.stringify(response.body)).not.toContain("does-not-exist");
  });

  it("submits a complete draft once and preserves submittedAt on resubmission", async () => {
    const owner = await authenticatedUser("vendor-submit@example.com");
    await postVendor({}, owner.accessToken).expect(201);
    await patchVendor(completeIndiaVendor, owner.accessToken).expect(200);

    const submitted = await request(app.getHttpServer())
      .post("/api/v1/vendors/me/submit")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(submitted.body.state).toBe(VendorState.SUBMITTED);
    const submittedAt = submitted.body.submittedAt;

    await vendorModel.updateOne(
      { ownerUserId: owner.userId },
      { $set: { state: VendorState.MORE_INFO_NEEDED } },
    );
    const resubmitted = await request(app.getHttpServer())
      .post("/api/v1/vendors/me/submit")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .expect(201);
    expect(resubmitted.body.state).toBe(VendorState.SUBMITTED);
    expect(resubmitted.body.submittedAt).toBe(submittedAt);
  });
});
