import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  SandboxMailerAdapter,
  SandboxSmsAdapter,
  type SmsOtpDelivery,
} from "@eqourse/adapters";
import { BusinessUnit, ProfileState, Role } from "@eqourse/shared";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { mongo } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import {
  AUTH_CLOCK,
  AUTH_STORE,
  MAILER_ADAPTER,
  SMS_ADAPTER,
} from "../src/auth/auth.constants";
import type { AuthStore } from "../src/auth/auth.store";
import { UserModel } from "../src/auth/user.schema";

interface MigrateMongoConfig {
  changelogCollectionName: string;
  lockCollectionName: string;
  lockTtl: number;
  migrationFileExtension: string;
  migrationsDir: string;
  mongodb: { databaseName: string; url: string };
}

interface MigrateMongo {
  config: { set(config: MigrateMongoConfig): void };
  database: {
    connect(): Promise<{ client: mongo.MongoClient; db: mongo.Db }>;
  };
  up(db: mongo.Db, client: mongo.MongoClient): Promise<string[]>;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RegistrationInput {
  email: string;
  phone: string;
  countryCode: string;
  pan?: string;
}

interface UsersMigration {
  up(db: mongo.Db): Promise<void>;
}

class MutableClock {
  now = new Date("2026-08-04T10:00:00.000Z");

  reset(): void {
    this.now = new Date("2026-08-04T10:00:00.000Z");
  }

  advance(milliseconds: number): void {
    this.now = new Date(this.now.getTime() + milliseconds);
  }
}

const require = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, "..");

describe("FR-REG-01 freelancer registration API", () => {
  let app: INestApplication;
  let memoryServer: MongoMemoryServer;
  let migrationClient: mongo.MongoClient;
  let db: mongo.Db;
  let mailer: SandboxMailerAdapter;
  let sms: SandboxSmsAdapter;
  let clock: MutableClock;
  let requestNumber = 0;

  const baseRegistration = {
    email: "first@example.com",
    phone: "+919876543210",
    countryCode: "IN",
    pan: "ABCDE1234F",
  };

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri("eqourse_reg_01_test");
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";

    const config = require(
      path.join(apiDirectory, "migrate-mongo-config.cjs"),
    ) as MigrateMongoConfig;
    const migrateMongo = (await import("migrate-mongo")) as unknown as MigrateMongo;
    migrateMongo.config.set(config);
    ({ client: migrationClient, db } = await migrateMongo.database.connect());
    await migrateMongo.up(db, migrationClient);

    mailer = new SandboxMailerAdapter();
    sms = new SandboxSmsAdapter(async () => undefined);
    clock = new MutableClock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MAILER_ADAPTER)
      .useValue(mailer)
      .overrideProvider(SMS_ADAPTER)
      .useValue(sms)
      .overrideProvider(AUTH_CLOCK)
      .useValue({ now: () => clock.now })
      .compile();

    app = moduleRef.createNestApplication();
    const express = app.getHttpAdapter().getInstance() as {
      set(setting: string, value: boolean): void;
    };
    express.set("trust proxy", true);
    await app.init();
  }, 60_000);

  beforeEach(async () => {
    await db.collection("users").deleteMany({});
    mailer.deliveries.length = 0;
    sms.deliveries.length = 0;
    clock.reset();
  });

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    if (app) await app.close();
    if (migrationClient) await migrationClient.close();
    if (memoryServer) await memoryServer.stop();
  });

  function nextIp(): string {
    requestNumber += 1;
    return `198.51.${Math.floor(requestNumber / 250)}.${(requestNumber % 250) + 1}`;
  }

  function post(pathname: string, body: object, ip = nextIp()) {
    return request(app.getHttpServer())
      .post(pathname)
      .set("x-forwarded-for", ip)
      .set("user-agent", "eqourse-registration-test/1.0")
      .set("accept-language", "en-IN")
      .send(body);
  }

  async function requestRegistration(
    body: RegistrationInput = baseRegistration,
    ip?: string,
  ): Promise<void> {
    await post("/api/v1/auth/register/request", body, ip).expect(202, {
      status: "accepted",
    });
  }

  function codesFor(email: string, phone: string): {
    emailOtp: string;
    phoneOtp: string;
  } {
    const emailDelivery = mailer.deliveries.findLast((item) => item.to === email);
    const phoneDelivery = sms.deliveries.findLast(
      (item: SmsOtpDelivery) => item.to === phone,
    );
    if (!emailDelivery || !phoneDelivery) throw new Error("Missing OTP delivery");
    return { emailOtp: emailDelivery.code, phoneOtp: phoneDelivery.code };
  }

  async function verifyRegistration(
    body: RegistrationInput = baseRegistration,
  ): Promise<TokenPair> {
    const codes = codesFor(body.email, body.phone);
    const response = await post("/api/v1/auth/register/verify", {
      email: body.email,
      phone: body.phone,
      ...codes,
    }).expect(200);
    expect(response.headers["cache-control"]).toContain("no-store");
    return response.body as TokenPair;
  }

  it("creates a DRAFT user with countryCode and issues tokens only after both OTPs verify", async () => {
    await requestRegistration();
    let stored = await db.collection("users").findOne({ email: baseRegistration.email });
    expect(stored).toMatchObject({
      countryCode: "IN",
      profileState: ProfileState.DRAFT,
      phoneVerifiedAt: null,
    });
    expect(stored?.refreshSessions).toEqual([]);

    const tokens = await verifyRegistration();
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
    stored = await db.collection("users").findOne({ email: baseRegistration.email });
    expect(stored?.phoneVerifiedAt).toEqual(clock.now);
    expect(stored?.refreshSessions).toHaveLength(1);
    expect(stored).not.toHaveProperty("otpChallenge");
    expect(stored).not.toHaveProperty("phoneOtpChallenge");
  });

  it("does not issue tokens when only the email OTP is valid", async () => {
    await requestRegistration();
    const codes = codesFor(baseRegistration.email, baseRegistration.phone);
    await post("/api/v1/auth/register/verify", {
      email: baseRegistration.email,
      phone: baseRegistration.phone,
      emailOtp: codes.emailOtp,
      phoneOtp: "000000",
    }).expect(401);
    expect((await db.collection("users").findOne({}))?.refreshSessions).toEqual([]);
  });

  it("does not issue tokens when only the phone OTP is valid", async () => {
    await requestRegistration();
    const codes = codesFor(baseRegistration.email, baseRegistration.phone);
    await post("/api/v1/auth/register/verify", {
      email: baseRegistration.email,
      phone: baseRegistration.phone,
      emailOtp: "000000",
      phoneOtp: codes.phoneOtp,
    }).expect(401);
    expect((await db.collection("users").findOne({}))?.refreshSessions).toEqual([]);
  });

  it("does not accept a pending registration email OTP through the login verifier", async () => {
    await requestRegistration();
    const codes = codesFor(baseRegistration.email, baseRegistration.phone);
    await post("/api/v1/auth/otp/verify", {
      email: baseRegistration.email,
      otp: codes.emailOtp,
    }).expect(401);
    expect((await db.collection("users").findOne({}))?.refreshSessions).toEqual([]);
  });

  it("blocks duplicate phone with a field-agnostic 409", async () => {
    await requestRegistration();
    const duplicate = { ...baseRegistration, email: "other@example.com", pan: "FGHIJ5678K" };
    const response = await post("/api/v1/auth/register/request", duplicate).expect(409);
    expect(response.body.code).toBe("REGISTRATION_CONFLICT");
    expect(JSON.stringify(response.body)).not.toContain("phone");
    expect(JSON.stringify(response.body)).not.toContain(baseRegistration.phone);
  });

  it("blocks duplicate PAN with a field-agnostic 409", async () => {
    await requestRegistration();
    const duplicate = { ...baseRegistration, email: "other@example.com", phone: "+919876543211" };
    const response = await post("/api/v1/auth/register/request", duplicate).expect(409);
    expect(response.body.code).toBe("REGISTRATION_CONFLICT");
    expect(JSON.stringify(response.body)).not.toMatch(/pan/i);
    expect(JSON.stringify(response.body)).not.toContain(baseRegistration.pan);
  });

  it("allows logical null PAN and phone values under sparse unique indexes", async () => {
    const withoutPan = {
      email: baseRegistration.email,
      phone: baseRegistration.phone,
      countryCode: baseRegistration.countryCode,
    };
    await requestRegistration({ ...withoutPan, email: "null-pan-1@example.com", phone: "+919876543212" });
    await requestRegistration({ ...withoutPan, email: "null-pan-2@example.com", phone: "+919876543213" });
    await UserModel.create([
      { email: "null-phone-1@example.com", phone: null, countryCode: "SG", roleAssignments: [], refreshSessions: [] },
      { email: "null-phone-2@example.com", phone: null, countryCode: "SG", roleAssignments: [], refreshSessions: [] },
    ]);
    expect(await db.collection("users").countDocuments()).toBe(4);
    expect(await db.collection("users").countDocuments({ pan: { $exists: false } })).toBe(4);
    expect(await db.collection("users").countDocuments({ phone: { $exists: false } })).toBe(2);

    const control = db.collection("nonSparseControl");
    await control.createIndex({ nullable: 1 }, { unique: true });
    await control.insertOne({ label: "first" });
    await expect(control.insertOne({ label: "second" })).rejects.toMatchObject({ code: 11000 });
  });

  it("flags a repeated device fingerprint without blocking registration", async () => {
    const sharedIp = "203.0.113.44";
    await requestRegistration(baseRegistration, sharedIp);
    const second = { ...baseRegistration, email: "second@example.com", phone: "+919876543214", pan: "KLMNO9012P" };
    await requestRegistration(second, sharedIp);
    const stored = await db.collection("users").findOne({ email: second.email });
    expect(stored?.reviewFlags).toEqual([
      expect.objectContaining({ kind: "DUPLICATE_DEVICE", resolvedAt: null }),
    ]);
  });

  it("persists OTP digests rather than raw email or SMS codes", async () => {
    await requestRegistration();
    const codes = codesFor(baseRegistration.email, baseRegistration.phone);
    const stored = await db.collection("users").findOne({ email: baseRegistration.email });
    expect(stored?.otpChallenge.digest).not.toBe(codes.emailOtp);
    expect(stored?.phoneOtpChallenge.digest).not.toBe(codes.phoneOtp);
    expect(JSON.stringify(stored)).not.toContain(codes.emailOtp);
    expect(JSON.stringify(stored)).not.toContain(codes.phoneOtp);
  });

  it("never persists raw IP or user-agent signals", async () => {
    const rawIp = "203.0.113.77";
    const rawUserAgent = "eqourse-registration-test/1.0";
    await requestRegistration(baseRegistration, rawIp);
    const serialized = JSON.stringify(await db.collection("users").findOne({}));
    expect(serialized).not.toContain(rawIp);
    expect(serialized).not.toContain(rawUserAgent);
    expect(serialized).toContain("deviceFingerprints");
  });

  it("never returns PAN from success or error responses", async () => {
    const accepted = await post("/api/v1/auth/register/request", baseRegistration).expect(202);
    const verified = await post("/api/v1/auth/register/verify", {
      email: baseRegistration.email,
      phone: baseRegistration.phone,
      ...codesFor(baseRegistration.email, baseRegistration.phone),
    }).expect(200);
    const conflict = await post("/api/v1/auth/register/request", {
      ...baseRegistration,
      email: "conflict@example.com",
      phone: "+919876543215",
    }).expect(409);
    for (const response of [accepted, verified, conflict]) {
      expect(JSON.stringify(response.body)).not.toContain(baseRegistration.pan);
    }
  });

  it("keeps unknown-email login OTP requests non-creating", async () => {
    await post("/api/v1/auth/otp/request", { email: "unknown@example.com" }).expect(202);
    expect(await db.collection("users").countDocuments()).toBe(0);
  });

  it("rate-limits registration verification by normalized phone across IP addresses", async () => {
    const rateLimitedPhone = "+919876543299";
    await requestRegistration({
      ...baseRegistration,
      email: "rate-limit@example.com",
      phone: rateLimitedPhone,
      pan: "QRSTU3456V",
    });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post("/api/v1/auth/register/verify", {
        email: `attempt-${attempt}@example.com`,
        phone: rateLimitedPhone,
        emailOtp: "000000",
        phoneOtp: "000000",
      }).expect(401);
    }
    await post("/api/v1/auth/register/verify", {
      email: "attempt-final@example.com",
      phone: rateLimitedPhone,
      emailOtp: "000000",
      phoneOtp: "000000",
    }).expect(429);
  });

  it("retains the IP cap on registration verification across distinct identifiers", async () => {
    const sharedIp = "203.0.113.182";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post("/api/v1/auth/register/verify", {
        email: `registration-spray-${attempt}@example.com`,
        phone: `+9198765400${attempt.toString().padStart(2, "0")}`,
        emailOtp: "000000",
        phoneOtp: "000000",
      }, sharedIp).expect(401);
    }
    await post("/api/v1/auth/register/verify", {
      email: "registration-spray-final@example.com",
      phone: "+919876540099",
      emailOtp: "000000",
      phoneOtp: "000000",
    }, sharedIp).expect(429);
  });

  it("retains the IP cap on registration requests across distinct identifiers", async () => {
    const sharedIp = "203.0.113.183";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await requestRegistration({
        email: `registration-request-${attempt}@example.com`,
        phone: `+9198765410${attempt.toString().padStart(2, "0")}`,
        countryCode: "IN",
      }, sharedIp);
    }
    await post("/api/v1/auth/register/request", {
      email: "registration-request-final@example.com",
      phone: "+919876541099",
      countryCode: "IN",
    }, sharedIp).expect(429);
  });

  it("creates the normative users indexes with exact sparse and unique flags", async () => {
    const indexes = await db.collection("users").indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: { phone: 1 }, unique: true, sparse: true }),
      expect.objectContaining({ key: { pan: 1 }, unique: true, sparse: true }),
      expect.objectContaining({ key: { "deviceFingerprints.hash": 1 } }),
      expect.objectContaining({ key: { profileState: 1 } }),
    ]));
  });

  it("migrates legacy users without inventing countryCode", async () => {
    const legacyDb = migrationClient.db("eqourse_reg_01_legacy_migration_test");
    await legacyDb.dropDatabase();
    await legacyDb.collection("users").insertOne({
      email: "legacy-migration@example.com",
      roleAssignments: [],
      refreshSessions: [],
      createdAt: clock.now,
      updatedAt: clock.now,
    });
    const migration = require(
      path.join(
        apiDirectory,
        "database",
        "migrations",
        "20260804000000-add-users-registration-indexes.cjs",
      ),
    ) as UsersMigration;
    await migration.up(legacyDb);
    const stored = await legacyDb
      .collection("users")
      .findOne({ email: "legacy-migration@example.com" });
    expect(stored).not.toHaveProperty("countryCode");
    await legacyDb.dropDatabase();
  });

  it("allows a legacy user without countryCode to complete login and refresh", async () => {
    await db.collection("users").insertOne({
      email: "legacy-login@example.com",
      roleAssignments: [{ role: Role.FREELANCER, businessUnit: BusinessUnit.EQOURSE }],
      refreshSessions: [],
      createdAt: clock.now,
      updatedAt: clock.now,
    });
    await post("/api/v1/auth/otp/request", { email: "legacy-login@example.com" }).expect(202);
    const code = mailer.deliveries.findLast((item) => item.to === "legacy-login@example.com")?.code;
    const login = await post("/api/v1/auth/otp/verify", {
      email: "legacy-login@example.com",
      otp: code,
    }).expect(200);
    const refreshed = await post("/api/v1/auth/refresh", {
      refreshToken: login.body.refreshToken,
    }).expect(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(await db.collection("users").findOne({ email: "legacy-login@example.com" })).not.toHaveProperty("countryCode");
  });

  it.each([
    { label: "present", storedValue: ProfileState.SUBMITTED },
    { label: "absent", storedValue: undefined },
    { label: "explicit null", storedValue: null },
  ])(
    "maps a $label MongoDB profileState to an enum-valued StoredUser",
    async ({ label, storedValue }) => {
      const inserted = await db.collection("users").insertOne({
        email: `profile-state-${label.replace(" ", "-")}@example.com`,
        roleAssignments: [],
        refreshSessions: [],
        ...(storedValue === undefined ? {} : { profileState: storedValue }),
        createdAt: clock.now,
        updatedAt: clock.now,
      });
      const authStore = app.get<AuthStore>(AUTH_STORE);

      expect((await authStore.findById(inserted.insertedId.toHexString()))?.profileState).toBe(
        storedValue === ProfileState.SUBMITTED
          ? ProfileState.SUBMITTED
          : ProfileState.DRAFT,
      );
      const raw = await db.collection("users").findOne({ _id: inserted.insertedId });
      if (storedValue === undefined) {
        expect(raw).not.toHaveProperty("profileState");
      } else {
        expect(raw?.profileState).toBe(storedValue);
      }
    },
  );

  it("rotates refresh tokens in MongoDB and rejects old-token reuse", async () => {
    await db.collection("users").insertOne({
      email: "mongo-rotation@example.com",
      roleAssignments: [
        { role: Role.FREELANCER, businessUnit: BusinessUnit.EQOURSE },
      ],
      refreshSessions: [],
      createdAt: clock.now,
      updatedAt: clock.now,
    });
    await post("/api/v1/auth/otp/request", {
      email: "mongo-rotation@example.com",
    }).expect(202);
    const code = mailer.deliveries.findLast(
      (item) => item.to === "mongo-rotation@example.com",
    )?.code;
    const login = await post("/api/v1/auth/otp/verify", {
      email: "mongo-rotation@example.com",
      otp: code,
    }).expect(200);

    const rotated = await post("/api/v1/auth/refresh", {
      refreshToken: login.body.refreshToken,
    }).expect(200);
    expect(rotated.body.refreshToken).not.toBe(login.body.refreshToken);
    await post("/api/v1/auth/refresh", {
      refreshToken: login.body.refreshToken,
    }).expect(401);

    const rotatedDigest = createHash("sha256")
      .update(rotated.body.refreshToken as string)
      .digest("hex");
    await db.collection("users").updateOne(
      { email: "mongo-rotation@example.com" },
      { $set: { "refreshSessions.$[session].revokedAt": null } },
      { arrayFilters: [{ "session.digest": rotatedDigest }] },
    );

    await post("/api/v1/auth/refresh", {
      refreshToken: rotated.body.refreshToken,
    }).expect(401);
  });

  it("classifies explicit BSON null as inactive without blocking an active MongoDB session", async () => {
    const email = "mongo-null-classification@example.com";
    await db.collection("users").insertOne({
      email,
      roleAssignments: [
        { role: Role.FREELANCER, businessUnit: BusinessUnit.EQOURSE },
      ],
      refreshSessions: [],
      createdAt: clock.now,
      updatedAt: clock.now,
    });

    await post("/api/v1/auth/otp/request", { email }).expect(202);
    const firstCode = mailer.deliveries.findLast(
      (item) => item.to === email,
    )?.code;
    const nullSession = await post("/api/v1/auth/otp/verify", {
      email,
      otp: firstCode,
    }).expect(200);
    const nullDigest = createHash("sha256")
      .update(nullSession.body.refreshToken as string)
      .digest("hex");
    await db.collection("users").updateOne(
      { email },
      { $set: { "refreshSessions.$[session].revokedAt": null } },
      { arrayFilters: [{ "session.digest": nullDigest }] },
    );

    await post("/api/v1/auth/otp/request", { email }).expect(202);
    const secondCode = mailer.deliveries.findLast(
      (item) => item.to === email,
    )?.code;
    const activeSession = await post("/api/v1/auth/otp/verify", {
      email,
      otp: secondCode,
    }).expect(200);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await post("/api/v1/auth/refresh", {
        refreshToken: nullSession.body.refreshToken,
      }).expect(401);
    }
    await post("/api/v1/auth/refresh", {
      refreshToken: nullSession.body.refreshToken,
    }).expect(429);
    await post("/api/v1/auth/refresh", {
      refreshToken: activeSession.body.refreshToken,
    }).expect(200);
  });

  it("reclaims an expired unverified registration but never a verified account", async () => {
    await requestRegistration();
    const originalId = (await db.collection("users").findOne({}))?._id;
    clock.advance(10 * 60 * 1000 + 1);
    const replacement = { ...baseRegistration, email: "owner@example.com" };
    await requestRegistration(replacement);
    expect(await db.collection("users").countDocuments()).toBe(1);
    expect((await db.collection("users").findOne({ email: replacement.email }))?._id).toEqual(originalId);

    await verifyRegistration(replacement);
    clock.advance(10 * 60 * 1000 + 1);
    await post("/api/v1/auth/register/request", { ...replacement, email: "attacker@example.com" }).expect(409);
  });
});
