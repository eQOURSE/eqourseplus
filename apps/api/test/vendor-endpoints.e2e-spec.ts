import type { INestApplication } from "@nestjs/common";
import type { StorageAdapter } from "@eqourse/adapters";
import { Test } from "@nestjs/testing";
import { BusinessUnit, Role, VendorState } from "@eqourse/shared";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Types, connection } from "mongoose";
import request, { type Response } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "../src/app.module";
import { JwtTokenService } from "../src/auth/jwt-token.service";
import {
  SkillTaxonomyModel,
  SkillTaxonomyStatus,
} from "../src/database/skill-taxonomy.schema";
import type { VendorRecord } from "../src/vendors/vendor.schema";
import { STORAGE_ADAPTER } from "../src/vendors/vendor.constants";

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

  const completeIndiaVendor = (vendorId: string) => ({
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
      { kind: "GST_CERTIFICATE", objectKey: `vendors/${vendorId}/GST_CERTIFICATE/gst.pdf`, uploadedAt: "2026-09-12T09:00:00.000Z" },
      { kind: "COMPANY_PAN", objectKey: `vendors/${vendorId}/COMPANY_PAN/pan.pdf`, uploadedAt: "2026-09-12T09:00:00.000Z" },
      { kind: "UDYAM_CERTIFICATE", objectKey: `vendors/${vendorId}/UDYAM_CERTIFICATE/udyam.pdf`, uploadedAt: "2026-09-12T09:00:00.000Z" },
      { kind: "BANK_PROOF", objectKey: `vendors/${vendorId}/BANK_PROOF/bank.pdf`, uploadedAt: "2026-09-12T09:00:00.000Z" },
    ],
  });

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

  it("accepts only document keys issued for this vendor and declared kind", async () => {
    const owner = await authenticatedUser("vendor-document-key@example.com");
    const draft = await postVendor({ countryCode: "IN" }, owner.accessToken).expect(201);
    const uploadedAt = "2026-09-15T12:00:00.000Z";

    await patchVendor({
      documents: [{
        kind: "BANK_PROOF",
        objectKey: `vendors/${new Types.ObjectId().toHexString()}/BANK_PROOF/random.pdf`,
        uploadedAt,
      }],
    }, owner.accessToken).expect(400);

    await patchVendor({
      documents: [{
        kind: "BANK_PROOF",
        objectKey: `vendors/${draft.body._id}/GST_CERTIFICATE/random.pdf`,
        uploadedAt,
      }],
    }, owner.accessToken).expect(400);

    const upload = await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "application/pdf", size: 100 })
      .expect(201);
    const saved = await patchVendor({
      documents: [{ kind: "BANK_PROOF", objectKey: upload.body.objectKey, uploadedAt }],
    }, owner.accessToken).expect(200);

    expect(saved.body.documents).toEqual([
      { kind: "BANK_PROOF", objectKey: upload.body.objectKey, uploadedAt },
    ]);
  });

  it("does not expose another owner's vendor", async () => {
    const ownerA = await authenticatedUser("vendor-a@example.com");
    const ownerB = await authenticatedUser("vendor-b@example.com");
    await postVendor({}, ownerA.accessToken).expect(201);

    await vendorPath("/me", ownerB.accessToken).expect(404);
    await patchVendor({ legalName: "attacker" }, ownerB.accessToken).expect(404);
    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${ownerB.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "application/pdf", size: 100 })
      .expect(404);
  });

  it("issues a five-minute PUT credential for an applicable document using a server key", async () => {
    const owner = await authenticatedUser("vendor-upload@example.com");
    await postVendor({ countryCode: "IN" }, owner.accessToken).expect(201);
    const storage = app.get<StorageAdapter>(STORAGE_ADAPTER);
    const createSignedUrl = vi.spyOn(storage, "createSignedUrl");

    const signed = await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "application/pdf", size: 1024 })
      .expect(201);

    expect(signed.body).toMatchObject({
      uploadUrl: expect.any(String),
      objectKey: expect.stringMatching(
        /^vendors\/[0-9a-f]{24}\/BANK_PROOF\/[0-9a-f-]{36}\.pdf$/,
      ),
      expiresAt: expect.any(String),
    });
    expect(signed.body).not.toHaveProperty("filename");
    expect(createSignedUrl).toHaveBeenCalledWith({
      objectKey: signed.body.objectKey,
      contentType: "application/pdf",
      contentLength: 1024,
      expiresInSeconds: 300,
    });
    expect(new Date(signed.body.expiresAt).getTime() - Date.now()).toBeGreaterThan(290_000);
    expect(new Date(signed.body.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(300_000);

    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "image/svg+xml", size: 100 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "application/pdf", size: 10 * 1024 * 1024 + 1 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "W9", contentType: "application/pdf", size: 100 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({
        kind: "BANK_PROOF",
        contentType: "application/pdf",
        size: 100,
        objectKey: "vendors/another-vendor/file.pdf",
      })
      .expect(400);

    const credential =
      "https://private.r2.example.test/file?X-Amz-Signature=provider-secret";
    createSignedUrl.mockRejectedValueOnce(
      new Error(`R2 rejected the pre-signed upload URL ${credential}`),
    );
    const failed = await request(app.getHttpServer())
      .post("/api/v1/vendors/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "application/pdf", size: 100 })
      .expect(503);
    expect(failed.body).toEqual({
      statusCode: 503,
      message: "Document upload is temporarily unavailable",
      error: "Service Unavailable",
    });
    expect(JSON.stringify(failed.body)).not.toContain(credential);
    expect(JSON.stringify(failed.body)).not.toContain("X-Amz-Signature");
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
    const draft = await postVendor({}, owner.accessToken).expect(201);
    await patchVendor(completeIndiaVendor(draft.body._id), owner.accessToken).expect(200);

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

  it("allows only one of two concurrent submissions and preserves submittedAt", async () => {
    const owner = await authenticatedUser("vendor-concurrent@example.com");
    const draft = await postVendor({}, owner.accessToken).expect(201);
    await patchVendor(completeIndiaVendor(draft.body._id), owner.accessToken).expect(200);

    const submissions = await Promise.allSettled([
      request(app.getHttpServer())
        .post("/api/v1/vendors/me/submit")
        .set("authorization", `Bearer ${owner.accessToken}`),
      request(app.getHttpServer())
        .post("/api/v1/vendors/me/submit")
        .set("authorization", `Bearer ${owner.accessToken}`),
    ]);
    const responses = submissions
      .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
      .map((result) => result.value);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);

    const stored = await vendorModel.findOne({ ownerUserId: owner.userId }).lean().exec();
    expect(stored?.state).toBe(VendorState.SUBMITTED);
    const successfulSubmission = responses.find((response) => response.status === 201);
    expect(stored?.submittedAt?.toISOString()).toBe(
      new Date(successfulSubmission?.body.submittedAt).toISOString(),
    );
  });
});
