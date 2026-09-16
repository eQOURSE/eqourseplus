import type { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { ClientState, getCompanyCountryRequirements } from "@eqourse/shared";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connection, Model, Types } from "mongoose";
import request, { type Response } from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { JwtTokenService } from "../src/auth/jwt-token.service";
import type { ClientRecord } from "../src/clients/client.schema";

describe("FR-REG-15 client draft and submission API", () => {
  let app: INestApplication;
  let memoryServer: MongoMemoryServer;
  let clientModel: Model<ClientRecord>;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri("client_endpoints_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    process.env.VENDOR_IDENTIFIER_HMAC_SECRET =
      "test-only-vendor-hmac-secret-at-least-32-characters";
    process.env.CLIENT_IDENTIFIER_HMAC_SECRET =
      "test-only-client-hmac-secret-at-least-32-characters";

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    clientModel = app.get<Model<ClientRecord>>(getModelToken("Client"));
  }, 60_000);

  beforeEach(async () => {
    await clientModel.deleteMany({});
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

  async function authenticatedUser(email: string) {
    const user = await connection.collection("users").insertOne({
      _id: new Types.ObjectId(),
      email,
      countryCode: "IN",
      roleAssignments: [],
      deviceFingerprints: [],
      reviewFlags: [],
      refreshSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userId = user.insertedId.toHexString();
    const accessToken = app.get(JwtTokenService).issuePair(userId, new Date()).accessToken;
    return { userId, accessToken };
  }

  function postClient(body: object, accessToken: string) {
    return request(app.getHttpServer())
      .post("/api/v1/clients")
      .set("authorization", `Bearer ${accessToken}`)
      .send(body);
  }

  function patchClient(body: object, accessToken: string) {
    return request(app.getHttpServer())
      .patch("/api/v1/clients/me")
      .set("authorization", `Bearer ${accessToken}`)
      .send(body);
  }

  function submitClient(accessToken: string) {
    return request(app.getHttpServer())
      .post("/api/v1/clients/me/submit")
      .set("authorization", `Bearer ${accessToken}`);
  }

  const completeIndiaClient = (clientId: string) => ({
    legalName: "Acme India Private Limited",
    tradingName: "Acme",
    countryCode: "IN",
    registeredAddress: {
      line1: "1 Example Road",
      city: "Bengaluru",
      postalCode: "560001",
      countryCode: "IN",
    },
    website: "https://acme.example",
    contactPerson: {
      name: "Client Contact",
      email: "contact@acme.example",
      phone: "+919876543210",
    },
    authorisedPerson: {
      name: "Authorised Person",
      governmentIdentityDocument: {
        kind: "PASSPORT",
        objectKey: `clients/${clientId}/authorised-person/government-identity-document/PASSPORT/id.pdf`,
        uploadedAt: "2026-09-16T09:00:00.000Z",
      },
    },
    countryIdentifiers: [
      { scheme: "GSTIN", value: "27ABCDE1234F1Z5" },
      { scheme: "COMPANY_PAN", value: "ABCDE1234F" },
      { scheme: "UDYAM", value: "UDYAM-IN-00-0000000" },
    ],
    documents: [
      {
        kind: "GST_CERTIFICATE",
        objectKey: `clients/${clientId}/documents/GST_CERTIFICATE/gst.pdf`,
        uploadedAt: "2026-09-16T09:00:00.000Z",
      },
      {
        kind: "COMPANY_PAN",
        objectKey: `clients/${clientId}/documents/COMPANY_PAN/pan.pdf`,
        uploadedAt: "2026-09-16T09:00:00.000Z",
      },
      {
        kind: "UDYAM_CERTIFICATE",
        objectKey: `clients/${clientId}/documents/UDYAM_CERTIFICATE/udyam.pdf`,
        uploadedAt: "2026-09-16T09:00:00.000Z",
      },
    ],
  });

  it("creates one owner-only draft for an authenticated person with no roles", async () => {
    const owner = await authenticatedUser("client-owner@example.com");
    const first = await postClient({}, owner.accessToken).expect(201);
    const second = await postClient({}, owner.accessToken).expect(201);
    await postClient(
      { ownerUserId: new Types.ObjectId().toHexString() },
      owner.accessToken,
    ).expect(400);

    expect(first.body).toMatchObject({ ownerUserId: owner.userId, state: ClientState.DRAFT });
    expect(second.body._id).toBe(first.body._id);
    expect(await clientModel.countDocuments({ ownerUserId: owner.userId })).toBe(1);
  });

  it("accepts a partial save, canonicalizes identifiers, and rejects unknown fields", async () => {
    const owner = await authenticatedUser("client-partial@example.com");
    await postClient({}, owner.accessToken).expect(201);
    const saved = await patchClient(
      {
        legalName: "Acme",
        countryCode: "DE",
        countryIdentifiers: [{ scheme: "EU_VAT", value: "de 123-456" }],
      },
      owner.accessToken,
    ).expect(200);
    expect(saved.body.countryIdentifiers).toEqual([
      { scheme: "EU_VAT", value: "DE123456", lookupDigest: expect.any(String) },
    ]);
    const savedPerson = await patchClient(
      { authorisedPerson: { name: "Director" } },
      owner.accessToken,
    ).expect(200);
    expect(savedPerson.body.authorisedPerson).toEqual({ name: "Director" });
    await patchClient({ unknownField: true }, owner.accessToken).expect(400);
    await patchClient({ bankDetails: {} }, owner.accessToken).expect(400);
  });

  it("does not expose or modify another owner's client", async () => {
    const ownerA = await authenticatedUser("client-a@example.com");
    const ownerB = await authenticatedUser("client-b@example.com");
    await postClient({}, ownerA.accessToken).expect(201);
    await request(app.getHttpServer())
      .get("/api/v1/clients/me")
      .set("authorization", `Bearer ${ownerB.accessToken}`)
      .expect(404);
    await patchClient({ legalName: "Attacker" }, ownerB.accessToken).expect(404);
    await request(app.getHttpServer())
      .post("/api/v1/clients/me/authorised-person/government-identity-document/upload-url")
      .set("authorization", `Bearer ${ownerB.accessToken}`)
      .send({ kind: "PASSPORT", contentType: "application/pdf", size: 100 })
      .expect(404);
  });

  it("issues separate owned upload paths and rejects another client's key", async () => {
    const owner = await authenticatedUser("client-upload@example.com");
    const draft = await postClient({ countryCode: "IN" }, owner.accessToken).expect(201);
    const companyUpload = await request(app.getHttpServer())
      .post("/api/v1/clients/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "GST_CERTIFICATE", contentType: "application/pdf", size: 100 })
      .expect(201);
    const identityUpload = await request(app.getHttpServer())
      .post("/api/v1/clients/me/authorised-person/government-identity-document/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "PASSPORT", contentType: "application/pdf", size: 100 })
      .expect(201);

    expect(companyUpload.body.objectKey).toMatch(
      new RegExp(`^clients/${draft.body._id}/documents/GST_CERTIFICATE/`),
    );
    expect(identityUpload.body.objectKey).toMatch(
      new RegExp(
        `^clients/${draft.body._id}/authorised-person/government-identity-document/PASSPORT/`,
      ),
    );

    await patchClient(
      {
        documents: [
          {
            kind: "GST_CERTIFICATE",
            objectKey: `clients/${new Types.ObjectId().toHexString()}/documents/GST_CERTIFICATE/file.pdf`,
            uploadedAt: "2026-09-16T09:00:00.000Z",
          },
        ],
      },
      owner.accessToken,
    ).expect(400);
    await patchClient(
      {
        authorisedPerson: {
          name: "Authorised Person",
          governmentIdentityDocument: {
            kind: "PASSPORT",
            objectKey: `clients/${new Types.ObjectId().toHexString()}/authorised-person/government-identity-document/PASSPORT/file.pdf`,
            uploadedAt: "2026-09-16T09:00:00.000Z",
          },
        },
      },
      owner.accessToken,
    ).expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/clients/me/documents/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "BANK_PROOF", contentType: "application/pdf", size: 100 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/clients/me/authorised-person/government-identity-document/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "AADHAAR", contentType: "application/pdf", size: 100 })
      .expect(400);
    await request(app.getHttpServer())
      .post("/api/v1/clients/me/authorised-person/government-identity-document/upload-url")
      .set("authorization", `Bearer ${owner.accessToken}`)
      .send({ kind: "../OTHER", contentType: "application/pdf", size: 100 })
      .expect(400);
  });

  it("rejects submission when country requirements or identity are missing", async () => {
    const owner = await authenticatedUser("client-incomplete@example.com");
    await postClient({}, owner.accessToken).expect(201);
    await patchClient(
      {
        legalName: "Incomplete Client",
        countryCode: "DE",
        website: "https://incomplete.example",
      },
      owner.accessToken,
    ).expect(200);
    const response = await submitClient(owner.accessToken).expect(400);
    expect(response.body.message).toBe("Client is missing required submission information");
  });

  it("submits a complete draft and preserves submittedAt after more information", async () => {
    const owner = await authenticatedUser("client-submit@example.com");
    const draft = await postClient({}, owner.accessToken).expect(201);
    await patchClient(completeIndiaClient(draft.body._id), owner.accessToken).expect(200);
    const submitted = await submitClient(owner.accessToken).expect(201);
    expect(submitted.body.state).toBe(ClientState.SUBMITTED);

    await clientModel.updateOne(
      { ownerUserId: owner.userId },
      { $set: { state: ClientState.MORE_INFO_NEEDED } },
    );
    const resubmitted = await submitClient(owner.accessToken).expect(201);
    expect(resubmitted.body.submittedAt).toBe(submitted.body.submittedAt);
  });

  it("allows exactly one of two concurrent submissions", async () => {
    const owner = await authenticatedUser("client-concurrent@example.com");
    const draft = await postClient({}, owner.accessToken).expect(201);
    await patchClient(completeIndiaClient(draft.body._id), owner.accessToken).expect(200);

    const results = await Promise.allSettled([
      submitClient(owner.accessToken),
      submitClient(owner.accessToken),
    ]);
    const responses = results
      .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
      .map((result) => result.value);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 400]);
  });

  it.each(["SG", "CN", "DE"])(
    "submits a complete %s client with only that country's identifiers and non-bank documents",
    async (countryCode) => {
      const owner = await authenticatedUser(`client-${countryCode.toLowerCase()}@example.com`);
      const draft = await postClient({}, owner.accessToken).expect(201);
      const requirements = getCompanyCountryRequirements(countryCode);
      expect(requirements).toBeDefined();
      const details = {
        ...completeIndiaClient(draft.body._id),
        countryCode,
        registeredAddress: {
          ...completeIndiaClient(draft.body._id).registeredAddress,
          countryCode,
        },
        countryIdentifiers: requirements!.identifierSchemes.map((scheme, index) => ({
          scheme,
          value: `company-${countryCode}-${index}`,
        })),
        documents: requirements!.documentKinds.map((kind) => ({
          kind,
          objectKey: `clients/${draft.body._id}/documents/${kind}/file.pdf`,
          uploadedAt: "2026-09-16T09:00:00.000Z",
        })),
      };
      expect(details.documents.some(({ kind }) => kind === "BANK_PROOF")).toBe(false);
      await patchClient(details, owner.accessToken).expect(200);
      const submitted = await submitClient(owner.accessToken).expect(201);
      expect(submitted.body).toMatchObject({ state: ClientState.SUBMITTED });
      expect(submitted.body.submittedAt).toEqual(expect.any(String));
    },
  );
});
