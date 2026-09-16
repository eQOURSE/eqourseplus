import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, disconnect, model, Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { clientSchema, type ClientRecord } from "../src/clients/client.schema";

const ClientModel = model<ClientRecord>("Client", clientSchema, "clients");

describe("FR-REG-15 clients schema", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    await connect(memoryServer.getUri("client_schema_test"));
    await ClientModel.syncIndexes();
  }, 60_000);

  afterAll(async () => {
    await disconnect();
    await memoryServer.stop();
  });

  it("contains exactly the normative fields and no payment fields", () => {
    expect(Object.keys(clientSchema.paths).sort()).toEqual([
      "_id",
      "authorisedPerson",
      "contactPerson",
      "countryCode",
      "countryIdentifiers",
      "createdAt",
      "documents",
      "legalName",
      "ownerUserId",
      "registeredAddress",
      "state",
      "submittedAt",
      "tradingName",
      "updatedAt",
      "website",
    ]);
    expect(JSON.stringify(Object.keys(clientSchema.paths))).not.toMatch(
      /bank|payment|billing/i,
    );
  });

  it("keeps business fields optional for drafts while requiring nested values", () => {
    expect(clientSchema.path("state").options.enum).toEqual([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "MORE_INFO_NEEDED",
      "APPROVED",
      "REJECTED",
    ]);
    expect(clientSchema.path("legalName").isRequired).not.toBe(true);
    expect(clientSchema.path("website").isRequired).not.toBe(true);
    expect(clientSchema.path("registeredAddress").isRequired).not.toBe(true);
    expect(clientSchema.path("registeredAddress.line1").isRequired).toBe(true);
    expect(clientSchema.path("contactPerson").isRequired).not.toBe(true);
    expect(clientSchema.path("authorisedPerson").isRequired).not.toBe(true);
    expect(clientSchema.path("authorisedPerson.name").isRequired).toBe(true);
    expect(clientSchema.path("authorisedPerson.governmentIdentityDocument").isRequired).not.toBe(true);
    expect(clientSchema.path("authorisedPerson.governmentIdentityDocument.objectKey").isRequired).toBe(true);
    expect(clientSchema.path("countryIdentifiers.lookupDigest").isRequired).toBe(true);
  });

  it("declares exactly the normative indexes", () => {
    expect(
      clientSchema.indexes().sort(([left], [right]) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      ),
    ).toEqual(
      [
        [{ ownerUserId: 1 }, {}],
        [{ state: 1 }, {}],
        [{ countryCode: 1 }, {}],
        [{ "countryIdentifiers.lookupDigest": 1 }, { unique: true, sparse: true }],
        [{ state: 1, submittedAt: 1 }, {}],
      ].sort(([left], [right]) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      ),
    );
  });

  it("persists a draft with only its owner", async () => {
    await expect(
      ClientModel.create({ ownerUserId: new Types.ObjectId() }),
    ).resolves.toMatchObject({ state: "DRAFT" });
  });
});
