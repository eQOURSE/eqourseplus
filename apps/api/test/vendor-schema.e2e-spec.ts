import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, disconnect, model, Types } from "mongoose";

import { vendorSchema, type VendorRecord } from "../src/vendors/vendor.schema";

const VendorModel = model<VendorRecord>("Vendor", vendorSchema, "vendors");

describe("FR-REG-08A vendors schema", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    await connect(memoryServer.getUri("vendor_schema_test"));
    await VendorModel.syncIndexes();
  }, 60_000);

  afterAll(async () => {
    await disconnect();
    await memoryServer.stop();
  });

  it("contains exactly the normative top-level fields", () => {
    expect(Object.keys(vendorSchema.paths).sort()).toEqual([
      "_id",
      "bankDetails",
      "capabilities",
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
    ]);
  });

  it("models the normative nested fields and requiredness", () => {
    expect(vendorSchema.path("ownerUserId").instance).toBe("ObjectId");
    expect(vendorSchema.path("state").options.enum).toEqual([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "MORE_INFO_NEEDED",
      "ACTIVE",
      "REJECTED",
    ]);
    expect(vendorSchema.path("legalName").isRequired).not.toBe(true);
    expect(vendorSchema.path("tradingName").isRequired).not.toBe(true);
    expect(vendorSchema.path("countryCode").isRequired).not.toBe(true);
    expect(vendorSchema.path("registeredAddress").isRequired).not.toBe(true);
    expect(vendorSchema.path("registeredAddress.line1").isRequired).toBe(true);
    expect(vendorSchema.path("registeredAddress.line2").isRequired).not.toBe(true);
    expect(vendorSchema.path("registeredAddress.city").isRequired).toBe(true);
    expect(vendorSchema.path("registeredAddress.region").isRequired).not.toBe(true);
    expect(vendorSchema.path("registeredAddress.postalCode").isRequired).toBe(true);
    expect(vendorSchema.path("registeredAddress.countryCode").isRequired).toBe(true);
    expect(vendorSchema.path("contactPerson.name").isRequired).toBe(true);
    expect(vendorSchema.path("contactPerson.email").isRequired).toBe(true);
    expect(vendorSchema.path("contactPerson.phone").isRequired).toBe(true);
    expect(vendorSchema.path("contactPerson").isRequired).not.toBe(true);
    expect(vendorSchema.path("capabilities.taxonomySlug").isRequired).toBe(true);
    expect(vendorSchema.path("countryIdentifiers.scheme").isRequired).toBe(true);
    expect(vendorSchema.path("countryIdentifiers.value").isRequired).toBe(true);
    expect(vendorSchema.path("countryIdentifiers.lookupDigest").isRequired).toBe(true);
    expect(vendorSchema.path("bankDetails.accountHolderName").isRequired).toBe(true);
    expect(vendorSchema.path("bankDetails.bankCountryCode").isRequired).toBe(true);
    expect(vendorSchema.path("bankDetails.currencyCode").isRequired).toBe(true);
    expect(vendorSchema.path("bankDetails.accountIdentifier.scheme").isRequired).toBe(true);
    expect(vendorSchema.path("bankDetails.accountIdentifier.value").isRequired).toBe(true);
    expect(vendorSchema.path("bankDetails.bankIdentifier").isRequired).not.toBe(true);
    expect(vendorSchema.path("bankDetails").isRequired).not.toBe(true);
    expect(vendorSchema.path("documents.kind").isRequired).toBe(true);
    expect(vendorSchema.path("documents.objectKey").isRequired).toBe(true);
    expect(vendorSchema.path("documents.uploadedAt").isRequired).toBe(true);
    expect(vendorSchema.path("submittedAt").isRequired).not.toBe(true);
  });

  it("declares exactly the normative indexes", () => {
    expect(vendorSchema.indexes().sort(([left], [right]) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    )).toEqual([
      [{ ownerUserId: 1 }, {}],
      [{ state: 1 }, {}],
      [{ countryCode: 1 }, {}],
      [{ "capabilities.taxonomySlug": 1 }, {}],
      [{ "countryIdentifiers.lookupDigest": 1 }, { unique: true, sparse: true }],
      [{ state: 1, submittedAt: 1 }, {}],
    ].sort(([left], [right]) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right)),
    ));
  });

  it("exports the Vendor model", () => {
    expect(VendorModel.modelName).toBe("Vendor");
    expect(VendorModel.collection.name).toBe("vendors");
  });

  it("stores no null placeholder for an inapplicable GSTIN", async () => {
    const vendor = await VendorModel.create({
      ownerUserId: new Types.ObjectId(),
      legalName: "Vendor Company",
      countryCode: "SG",
      registeredAddress: {
        line1: "1 Example Road",
        city: "Singapore",
        postalCode: "018989",
        countryCode: "SG",
      },
      contactPerson: {
        name: "Vendor Contact",
        email: "vendor@example.com",
        phone: "+6591234567",
      },
      countryIdentifiers: [
        {
          scheme: "UEN",
          value: "2019123456A",
          lookupDigest: "uen-digest-1",
        },
      ],
      bankDetails: {
        accountHolderName: "Vendor Company",
        bankCountryCode: "SG",
        currencyCode: "SGD",
        accountIdentifier: { scheme: "ACCOUNT", value: "123456789" },
      },
    });

    const stored = await VendorModel.collection.findOne({ _id: vendor._id });
    expect(stored?.countryIdentifiers).toHaveLength(1);
    expect(stored?.countryIdentifiers).toEqual([
      {
        scheme: "UEN",
        value: "2019123456A",
        lookupDigest: "uen-digest-1",
      },
    ]);
    expect(
      stored?.countryIdentifiers.every(
        (identifier) =>
          identifier.value !== null && identifier.lookupDigest !== null,
      ),
    ).toBe(true);
  });

  it("persists a draft with only its owner", async () => {
    await expect(
      VendorModel.create({ ownerUserId: new Types.ObjectId() }),
    ).resolves.toMatchObject({ state: "DRAFT" });
  });

  it("allows two vendors without a GSTIN to insert under the sparse digest index", async () => {
    await VendorModel.deleteMany({});

    const baseVendor = {
      state: "DRAFT",
      legalName: "Vendor Company",
      countryCode: "SG",
      registeredAddress: {
        line1: "1 Example Road",
        city: "Singapore",
        postalCode: "018989",
        countryCode: "SG",
      },
      contactPerson: {
        name: "Vendor Contact",
        email: "vendor@example.com",
        phone: "+6591234567",
      },
      bankDetails: {
        accountHolderName: "Vendor Company",
        bankCountryCode: "SG",
        currencyCode: "SGD",
        accountIdentifier: { scheme: "ACCOUNT", value: "123456789" },
      },
    } as const;

    await VendorModel.create({
      ...baseVendor,
      ownerUserId: new Types.ObjectId(),
      contactPerson: { ...baseVendor.contactPerson, email: "one@example.com" },
    });

    await expect(
      VendorModel.create({
        ...baseVendor,
        ownerUserId: new Types.ObjectId(),
        contactPerson: { ...baseVendor.contactPerson, email: "two@example.com" },
      }),
    ).resolves.toBeDefined();
  });
});
