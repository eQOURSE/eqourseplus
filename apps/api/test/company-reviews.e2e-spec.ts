import type { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { BusinessUnit, ClientState, Role, VendorState } from "@eqourse/shared";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connection, Model, Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "../src/app.module";
import { JwtTokenService } from "../src/auth/jwt-token.service";
import type { ClientRecord } from "../src/clients/client.schema";
import type { VendorRecord } from "../src/vendors/vendor.schema";

type CompanyType = "vendors" | "clients";
type Decision = "START_REVIEW" | "APPROVE" | "REJECT" | "REQUEST_MORE_INFO";

describe("FR-REG-07A company review API", () => {
  let app: INestApplication;
  let replicaSet: MongoMemoryReplSet;
  let vendors: Model<VendorRecord>;
  let clients: Model<ClientRecord>;

  beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = replicaSet.getUri("company_reviews_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";
    process.env.VENDOR_IDENTIFIER_HMAC_SECRET =
      "test-only-vendor-hmac-secret-at-least-32-characters";
    process.env.CLIENT_IDENTIFIER_HMAC_SECRET =
      "test-only-client-hmac-secret-at-least-32-characters";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    vendors = app.get<Model<VendorRecord>>(getModelToken("Vendor"));
    clients = app.get<Model<ClientRecord>>(getModelToken("Client"));
    const auditCollectionExists = await connection.db!
      .listCollections({ name: "auditLogs" }, { nameOnly: true })
      .hasNext();
    // The fallback keeps the red suite runnable before the module exists. It creates
    // no indexes, so the index test still fails if the application stops owning them.
    if (!auditCollectionExists) await connection.db!.createCollection("auditLogs");
  }, 90_000);

  beforeEach(async () => {
    await Promise.all([
      vendors.deleteMany({}),
      clients.deleteMany({}),
      connection.collection("users").deleteMany({}),
      connection.collection("auditLogs").deleteMany({}),
    ]);
    await connection.db!.command({
      collMod: "auditLogs",
      validator: {},
      validationLevel: "strict",
    });
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

  async function user(role?: Role, businessUnit = BusinessUnit.EQOURSE) {
    const id = new Types.ObjectId();
    await connection.collection("users").insertOne({
      _id: id,
      email: `person-${id.toHexString()}@example.test`,
      countryCode: "DE",
      roleAssignments: role ? [{ role, businessUnit }] : [],
      deviceFingerprints: [],
      reviewFlags: [],
      refreshSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      id: id.toHexString(),
      token: app.get(JwtTokenService).issuePair(id.toHexString(), new Date()).accessToken,
    };
  }

  async function company(type: CompanyType, state: ClientState | VendorState = ClientState.SUBMITTED) {
    const id = new Types.ObjectId();
    const ownerUserId = new Types.ObjectId();
    const submittedAt = new Date("2026-09-18T09:00:00.000Z");
    const document = {
      kind: "INCORPORATION",
      objectKey: type === "vendors"
        ? `vendors/${id.toHexString()}/INCORPORATION/file.pdf`
        : `clients/${id.toHexString()}/documents/INCORPORATION/file.pdf`,
      uploadedAt: submittedAt,
    };
    const record = {
      _id: id,
      ownerUserId,
      state,
      legalName: "Private Example GmbH",
      tradingName: "Secret Trading Name",
      countryCode: "DE",
      registeredAddress: {
        line1: "17 Private Strasse",
        city: "Berlin",
        postalCode: "10115",
        countryCode: "DE",
      },
      contactPerson: {
        name: "Secret Contact",
        email: "private@example.test",
        phone: "+4915112345678",
      },
      countryIdentifiers: [
        { scheme: "EU_VAT", value: "DE123456789", lookupDigest: id.toHexString() },
      ],
      documents: [document],
      submittedAt,
    };
    if (type === "vendors") {
      await vendors.create({
        ...record,
        capabilities: [],
        bankDetails: {
          accountHolderName: "Private Example GmbH",
          bankCountryCode: "DE",
          currencyCode: "EUR",
          accountIdentifier: { scheme: "IBAN", value: "DE89370400440532013000" },
        },
      });
    } else {
      await clients.create({
        ...record,
        authorisedPerson: {
          name: "Secret Director",
          governmentIdentityDocument: {
            kind: "PASSPORT",
            objectKey: `clients/${id.toHexString()}/authorised-person/government-identity-document/PASSPORT/id.pdf`,
            uploadedAt: submittedAt,
          },
        },
      });
    }
    return { id: id.toHexString(), submittedAt, document };
  }

  const path = (type: CompanyType, id: string) => `/api/v1/company-reviews/${type}/${id}`;
  const auth = (token: string) => ({ authorization: `Bearer ${token}` });
  const decide = (type: CompanyType, id: string, token: string, decision: Decision, reason?: string) =>
    request(app.getHttpServer())
      .post(`${path(type, id)}/decisions`)
      .set(auth(token))
      .send(reason === undefined ? { decision } : { decision, reason });

  it("refuses an authenticated non-Verifier and an unauthenticated caller", async () => {
    const ordinary = await user(Role.CLIENT);
    const record = await company("clients");
    await request(app.getHttpServer()).get("/api/v1/company-reviews").expect(401);
    await request(app.getHttpServer()).get("/api/v1/company-reviews").set(auth(ordinary.token)).expect(403);
    await request(app.getHttpServer()).get(path("clients", record.id)).set(auth(ordinary.token)).expect(403);
    await decide("clients", record.id, ordinary.token, "START_REVIEW", "Beginning review").expect(403);
    await request(app.getHttpServer())
      .get(`${path("clients", record.id)}/documents/INCORPORATION/url`)
      .set(auth(ordinary.token))
      .expect(403);
  });

  it.each([BusinessUnit.EQOURSE, BusinessUnit.TUTRAIN])(
    "allows a %s Verifier to see both company types without company business-unit scoping",
    async (businessUnit) => {
      const verifier = await user(Role.VERIFIER, businessUnit);
      const vendor = await company("vendors");
      const client = await company("clients");
      const queue = await request(app.getHttpServer())
        .get("/api/v1/company-reviews")
        .set(auth(verifier.token))
        .expect(200);
      expect(queue.body).toEqual(expect.arrayContaining([
        { id: vendor.id, companyType: "vendors", state: VendorState.SUBMITTED, submittedAt: vendor.submittedAt.toISOString() },
        { id: client.id, companyType: "clients", state: ClientState.SUBMITTED, submittedAt: client.submittedAt.toISOString() },
      ]));
    },
  );

  it("projects only opaque ID, type, state and submission time in the queue", async () => {
    const verifier = await user(Role.VERIFIER);
    await company("vendors");
    await company("clients");
    const queue = await request(app.getHttpServer())
      .get("/api/v1/company-reviews")
      .set(auth(verifier.token))
      .expect(200);
    expect(queue.body).toHaveLength(2);
    for (const item of queue.body) {
      expect(Object.keys(item).sort()).toEqual(["companyType", "id", "state", "submittedAt"]);
    }
    const serialized = JSON.stringify(queue.body);
    for (const secret of ["Private Example", "Secret", "DE123456789", "DE89370400440532013000", "private@example.test", "INCORPORATION", "objectKey"]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it("shows identifying values and document references only in the authorised single-record view", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("clients");
    const detail = await request(app.getHttpServer())
      .get(path("clients", record.id))
      .set(auth(verifier.token))
      .expect(200);
    expect(detail.body).toMatchObject({
      _id: record.id,
      legalName: "Private Example GmbH",
      countryIdentifiers: [{ scheme: "EU_VAT", value: "DE123456789" }],
      documents: [{ objectKey: record.document.objectKey }],
    });
    expect(JSON.stringify(detail.body)).not.toContain("lookupDigest");
  });

  it("reports a referenced but absent R2 object instead of issuing a broken link", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("clients");
    const response = await request(app.getHttpServer())
      .get(`${path("clients", record.id)}/documents/INCORPORATION/url`)
      .set(auth(verifier.token))
      .expect(404);
    expect(response.body.message).toBe("document not found in storage");
    expect(JSON.stringify(response.body)).not.toContain("X-Amz-Signature");
  });

  it("never logs or audits a signed document URL", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("clients");
    const credential = "https://private.r2.example.test/file?X-Amz-Signature=secret";
    const storage = app.get<{
      objectExists(objectKey: string): Promise<boolean>;
      createSignedGetUrl(input: { objectKey: string; expiresInSeconds: number }): Promise<{ url: string }>;
    }>("COMPANY_REVIEW_STORAGE_ADAPTER");
    const exists = vi.spyOn(storage, "objectExists").mockResolvedValue(true);
    const sign = vi.spyOn(storage, "createSignedGetUrl").mockResolvedValue({ url: credential });
    const logs = [
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
      vi.spyOn(console, "error").mockImplementation(() => undefined),
    ];
    try {
      const response = await request(app.getHttpServer())
        .get(`${path("clients", record.id)}/documents/INCORPORATION/url`)
        .set(auth(verifier.token))
        .expect(200);
      expect(response.body.url).toBe(credential);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(exists).toHaveBeenCalledWith(record.document.objectKey);
      expect(sign).toHaveBeenCalledWith({
        objectKey: record.document.objectKey,
        expiresInSeconds: 300,
      });
      await decide("clients", record.id, verifier.token, "START_REVIEW", "Opening company review").expect(201);
      const entries = await connection.collection("auditLogs")
        .find({ subjectId: new Types.ObjectId(record.id) }).toArray();
      expect(entries).toHaveLength(1);
      expect(JSON.stringify(entries)).not.toContain(credential);
      expect(JSON.stringify(entries)).not.toContain("X-Amz-Signature");
      expect(JSON.stringify(logs.flatMap((spy) => spy.mock.calls))).not.toContain(credential);
      expect(JSON.stringify(logs.flatMap((spy) => spy.mock.calls))).not.toContain("X-Amz-Signature");
    } finally {
      exists.mockRestore();
      sign.mockRestore();
      logs.forEach((spy) => spy.mockRestore());
    }
  });

  it("requires a reason for entry into review, rejection, more-info, and client approval", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("clients");
    await decide("clients", record.id, verifier.token, "START_REVIEW").expect(400);
    await decide("clients", record.id, verifier.token, "START_REVIEW", "  ").expect(400);
    await decide("clients", record.id, verifier.token, "START_REVIEW", "Reviewing incorporation documents").expect(201);
    for (const decision of ["REJECT", "REQUEST_MORE_INFO", "APPROVE"] as const) {
      await decide("clients", record.id, verifier.token, decision).expect(400);
      await decide("clients", record.id, verifier.token, decision, " ").expect(400);
    }
    expect((await clients.findById(record.id).lean()).state).toBe(ClientState.UNDER_REVIEW);
  });

  it("refuses decisions outside the existing client and vendor state machines", async () => {
    const verifier = await user(Role.VERIFIER);
    const submittedClient = await company("clients");
    await decide(
      "clients",
      submittedClient.id,
      verifier.token,
      "APPROVE",
      "Documents accepted",
    ).expect(400);
    expect((await clients.findById(submittedClient.id).lean())?.state).toBe(
      ClientState.SUBMITTED,
    );
    expect(await connection.collection("auditLogs").countDocuments({
      subjectId: new Types.ObjectId(submittedClient.id),
    })).toBe(0);

    const approvedClient = await company("clients");
    await decide(
      "clients",
      approvedClient.id,
      verifier.token,
      "START_REVIEW",
      "Opening company review",
    ).expect(201);
    await decide(
      "clients",
      approvedClient.id,
      verifier.token,
      "APPROVE",
      "Documents accepted",
    ).expect(201);
    await decide(
      "clients",
      approvedClient.id,
      verifier.token,
      "REJECT",
      "A later conflicting decision",
    ).expect(400);
    expect((await clients.findById(approvedClient.id).lean())?.state).toBe(
      ClientState.APPROVED,
    );

    const rejectedVendor = await company("vendors");
    await decide(
      "vendors",
      rejectedVendor.id,
      verifier.token,
      "START_REVIEW",
      "Opening company review",
    ).expect(201);
    await decide(
      "vendors",
      rejectedVendor.id,
      verifier.token,
      "REJECT",
      "Documents could not be accepted",
    ).expect(201);
    await decide(
      "vendors",
      rejectedVendor.id,
      verifier.token,
      "REQUEST_MORE_INFO",
      "A later conflicting decision",
    ).expect(400);
    expect((await vendors.findById(rejectedVendor.id).lean())?.state).toBe(
      VendorState.REJECTED,
    );
  });

  it("allows only one of two concurrent verifier decisions on the same state", async () => {
    const firstVerifier = await user(Role.VERIFIER, BusinessUnit.EQOURSE);
    const secondVerifier = await user(Role.VERIFIER, BusinessUnit.TUTRAIN);
    const record = await company("clients");
    await decide(
      "clients",
      record.id,
      firstVerifier.token,
      "START_REVIEW",
      "Opening company review",
    ).expect(201);

    const [approval, rejection] = await Promise.all([
      decide(
        "clients",
        record.id,
        firstVerifier.token,
        "APPROVE",
        "Documents accepted",
      ),
      decide(
        "clients",
        record.id,
        secondVerifier.token,
        "REJECT",
        "Documents could not be accepted",
      ),
    ]);
    expect([approval.status, rejection.status].sort()).toEqual([201, 400]);
    const stored = await clients.findById(record.id).lean();
    expect([ClientState.APPROVED, ClientState.REJECTED]).toContain(stored?.state);
    const terminalEntries = await connection.collection("auditLogs").find({
      subjectId: new Types.ObjectId(record.id),
      toState: { $in: [ClientState.APPROVED, ClientState.REJECTED] },
    }).toArray();
    expect(terminalEntries).toHaveLength(1);
    expect(terminalEntries[0]?.toState).toBe(stored?.state);
  });

  it("approves a client and inserts one exact-shape audit entry with actor and reason", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("clients");
    await decide("clients", record.id, verifier.token, "START_REVIEW", "Opening company review").expect(201);
    const reason = "Company documents checked and accepted";
    await decide("clients", record.id, verifier.token, "APPROVE", reason).expect(201);
    expect((await clients.findById(record.id).lean()).state).toBe(ClientState.APPROVED);
    const entries = await connection.collection("auditLogs").find({ subjectId: new Types.ObjectId(record.id) }).toArray();
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({
      actorUserId: new Types.ObjectId(verifier.id),
      subjectCollection: "clients",
      subjectId: new Types.ObjectId(record.id),
      fromState: ClientState.UNDER_REVIEW,
      toState: ClientState.APPROVED,
      reason,
      occurredAt: expect.any(Date),
    });
    expect(Object.keys(entries[1]).sort()).toEqual([
      "_id", "actorUserId", "fromState", "occurredAt", "reason", "subjectCollection", "subjectId", "toState",
    ]);
  });

  it("creates the two specified audit history indexes", async () => {
    const indexes = await connection.collection("auditLogs").indexes();
    expect(indexes.map((index) => index.key)).toEqual(expect.arrayContaining([
      { subjectCollection: 1, subjectId: 1, occurredAt: 1 },
      { actorUserId: 1, occurredAt: 1 },
    ]));
  });

  it("exposes only insert and find operations on the append-only audit repository", () => {
    const store = app.get("AUDIT_LOG_STORE");
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(store)).sort()).toEqual([
      "constructor", "findBySubject", "insert",
    ].sort());
    for (const operation of ["update", "updateOne", "replace", "delete", "deleteOne", "remove"]) {
      expect(operation in store).toBe(false);
    }
  });

  it.each([
    ["vendors", "REJECT", VendorState.REJECTED],
    ["vendors", "REQUEST_MORE_INFO", VendorState.MORE_INFO_NEEDED],
    ["clients", "REJECT", ClientState.REJECTED],
    ["clients", "REQUEST_MORE_INFO", ClientState.MORE_INFO_NEEDED],
  ] as const)("moves %s through %s with an audit entry", async (type, decision, expectedState) => {
    const verifier = await user(Role.VERIFIER);
    const record = await company(type);
    await decide(type, record.id, verifier.token, "START_REVIEW", "Opening company review").expect(201);
    await decide(type, record.id, verifier.token, decision, "Further verification required").expect(201);
    const model = type === "vendors" ? vendors : clients;
    expect((await model.findById(record.id).lean())?.state).toBe(expectedState);
    expect(await connection.collection("auditLogs").countDocuments({
      subjectCollection: type,
      subjectId: new Types.ObjectId(record.id),
      toState: expectedState,
      reason: "Further verification required",
    })).toBe(1);
  });

  it("never moves a vendor to ACTIVE through a review decision", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("vendors");
    await decide("vendors", record.id, verifier.token, "START_REVIEW", "Opening company review").expect(201);
    await decide("vendors", record.id, verifier.token, "APPROVE", "Company documents accepted").expect(400);
    await decide("vendors", record.id, verifier.token, "ACTIVE" as Decision, "Company documents accepted").expect(400);
    expect((await vendors.findById(record.id).lean())?.state).toBe(VendorState.UNDER_REVIEW);
    expect(await connection.collection("auditLogs").countDocuments({
      subjectCollection: "vendors",
      toState: VendorState.ACTIVE,
    })).toBe(0);
  });

  it("rolls back the company update when the audit insert itself fails validation", async () => {
    const verifier = await user(Role.VERIFIER);
    const record = await company("clients");
    await connection.db!.command({
      collMod: "auditLogs",
      validator: { $jsonSchema: { bsonType: "object", required: ["reason"], properties: {
        reason: { bsonType: "string", pattern: "^AUDIT_INSERT_MUST_FAIL$" },
      } } },
      validationLevel: "strict",
      validationAction: "error",
    });
    await expect(connection.collection("auditLogs").insertOne({
      actorUserId: new Types.ObjectId(verifier.id),
      subjectCollection: "clients",
      subjectId: new Types.ObjectId(record.id),
      fromState: ClientState.SUBMITTED,
      toState: ClientState.UNDER_REVIEW,
      reason: "Opening company review",
      occurredAt: new Date(),
    })).rejects.toMatchObject({ code: 121 });
    await decide("clients", record.id, verifier.token, "START_REVIEW", "Opening company review").expect(503);
    expect((await clients.findById(record.id).lean())?.state).toBe(ClientState.SUBMITTED);
    expect(await connection.collection("auditLogs").countDocuments({ subjectId: new Types.ObjectId(record.id) })).toBe(0);
  });

  // Pattern checks cannot catch every possible PII disclosure; verifiers must still avoid copying reviewed data.
  it.each([
    "DE 123-456-789",
    "private@EXAMPLE.test",
    "+4915112345678",
    "Private   Example GmbH",
    "billing@unrelated.example",
    "+447700900123",
    "27ABCDE1234F1Z5",
  ])(
    "rejects a reason containing reviewed PII: %s",
    async (value) => {
      const verifier = await user(Role.VERIFIER);
      const record = await company("clients");
      await decide("clients", record.id, verifier.token, "START_REVIEW", `Checked ${value}`).expect(400);
      expect((await clients.findById(record.id).lean())?.state).toBe(ClientState.SUBMITTED);
      expect(await connection.collection("auditLogs").countDocuments({})).toBe(0);
    },
  );
});
