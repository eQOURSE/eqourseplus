import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MongoMemoryReplSet } from "mongodb-memory-server";
import { mongo, model, Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { auditLogSchema } from "../src/company-reviews/audit-log.schema";

interface RoleAssignmentMigration {
  up(db: mongo.Db, client: mongo.MongoClient): Promise<void>;
  down(db: mongo.Db, client: mongo.MongoClient): Promise<void>;
}

const require = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
  testDirectory,
  "..",
  "database",
  "migrations",
  "20261024000000-grant-bhavesh-super-admin.cjs",
);

const TARGET_EMAIL = "bhavesh.ai@eqourse.com";
const AuditLogModel = model("FRADM07AuditLog", auditLogSchema);

describe("FR-ADM-07 reviewed internal role assignment migration", () => {
  let memoryServer: MongoMemoryReplSet;
  let client: mongo.MongoClient;
  let db: mongo.Db;

  beforeAll(async () => {
    memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    client = new mongo.MongoClient(memoryServer.getUri());
    await client.connect();
    db = client.db("internal_role_assignment_test");
  }, 60_000);

  beforeEach(async () => {
    await db.dropDatabase();
    await db.createCollection("users");
    await db.createCollection("auditLogs");
  });

  afterAll(async () => {
    if (client) await client.close();
    if (memoryServer) await memoryServer.stop();
  });

  function migration(): RoleAssignmentMigration {
    return require(migrationPath) as RoleAssignmentMigration;
  }

  async function insertTarget() {
    const id = new mongo.ObjectId();
    await db.collection("users").insertOne({
      _id: id,
      email: TARGET_EMAIL,
      roleAssignments: [],
      refreshSessions: [
        {
          digest: "active-session",
          expiresAt: new Date("2026-12-01T00:00:00.000Z"),
          createdAt: new Date("2026-10-23T00:00:00.000Z"),
        },
        {
          digest: "already-revoked",
          expiresAt: new Date("2026-12-01T00:00:00.000Z"),
          createdAt: new Date("2026-10-22T00:00:00.000Z"),
          revokedAt: new Date("2026-10-23T12:00:00.000Z"),
        },
      ],
      profileState: "DRAFT",
    });
    return id;
  }

  it("grants exactly SUPER_ADMIN, revokes sessions, and records the migration audit", async () => {
    const id = await insertTarget();

    await migration().up(db, client);

    const user = await db.collection("users").findOne({ _id: id });
    expect(user?.roleAssignments).toEqual([
      { role: "SUPER_ADMIN", businessUnit: "EQOURSE" },
    ]);
    expect(user?.refreshSessions).toEqual([
      expect.objectContaining({ digest: "active-session", revokedAt: expect.any(Date) }),
      expect.objectContaining({ digest: "already-revoked", revokedAt: expect.any(Date) }),
    ]);

    const audit = await db.collection("auditLogs").findOne({ subjectId: id });
    expect(audit).toEqual(expect.objectContaining({
      actor: "migration:FR-ADM-07-01",
      subjectCollection: "users",
      subjectId: id,
      subjectEmail: TARGET_EMAIL,
      role: "SUPER_ADMIN",
      businessUnit: "EQOURSE",
      fromState: "UNASSIGNED",
      toState: "SUPER_ADMIN",
      reason: expect.stringContaining("FR-FND-06 observability checks"),
      occurredAt: expect.any(Date),
    }));
    expect(audit).not.toHaveProperty("actorUserId");
  });

  it("requires exactly one actor identity and never accepts both actor forms", async () => {
    const base = {
      subjectCollection: "users",
      subjectId: new Types.ObjectId(),
      fromState: "UNASSIGNED",
      toState: "SUPER_ADMIN",
      reason: "Reviewed role assignment",
      occurredAt: new Date(),
    };

    await expect(new AuditLogModel(base).validate()).rejects.toThrow(/exactly one actor/i);
    await expect(
      new AuditLogModel({
        ...base,
        actor: "migration:FR-ADM-07-01",
        actorUserId: new Types.ObjectId(),
      }).validate(),
    ).rejects.toThrow(/exactly one actor/i);
    await expect(
      new AuditLogModel({ ...base, actor: "migration:FR-ADM-07-01" }).validate(),
    ).resolves.toBeUndefined();
    await expect(
      new AuditLogModel({ ...base, actorUserId: new Types.ObjectId() }).validate(),
    ).resolves.toBeUndefined();
  });

  it("is idempotent and does not rewrite sessions or audit on a rerun", async () => {
    await insertTarget();

    await migration().up(db, client);
    const afterFirstRun = await db.collection("users").findOne({ email: TARGET_EMAIL });
    const auditAfterFirstRun = await db.collection("auditLogs").find().toArray();
    await migration().up(db, client);
    const afterSecondRun = await db.collection("users").findOne({ email: TARGET_EMAIL });

    expect(afterSecondRun).toEqual(afterFirstRun);
    expect(await db.collection("auditLogs").find().toArray()).toEqual(auditAfterFirstRun);
  });

  it("skips without writes and logs the literal subject email when it does not exist", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      await expect(migration().up(db, client)).resolves.toBeUndefined();
      expect(warning).toHaveBeenCalledWith(
        `FR-ADM-07 skipped: subject account ${TARGET_EMAIL} does not exist; no writes performed`,
      );
      expect(await db.collection("users").countDocuments()).toBe(0);
      expect(await db.collection("auditLogs").countDocuments()).toBe(0);
    } finally {
      warning.mockRestore();
    }
  });

  it("rolls back the assignment and session revocation when the audit insert fails", async () => {
    const id = await insertTarget();
    const before = await db.collection("users").findOne({ _id: id });
    await db.command({
      collMod: "auditLogs",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["reason"],
          properties: { reason: { bsonType: "string", pattern: "^FAIL$" } },
        },
      },
      validationLevel: "strict",
      validationAction: "error",
    });

    await expect(migration().up(db, client)).rejects.toMatchObject({ code: 121 });
    expect(await db.collection("users").findOne({ _id: id })).toEqual(before);
    expect(await db.collection("auditLogs").countDocuments()).toBe(0);
  });

  it("down removes only the assignment and leaves the rest of the account unchanged", async () => {
    const id = await insertTarget();
    await migration().up(db, client);
    const granted = await db.collection("users").findOne({ _id: id });
    const sessionsAfterGrant = granted?.refreshSessions;

    await migration().down(db, client);

    const afterDown = await db.collection("users").findOne({ _id: id });
    expect(afterDown?.roleAssignments).toEqual([]);
    expect(afterDown?.refreshSessions).toEqual(sessionsAfterGrant);
    expect(afterDown?.profileState).toBe("DRAFT");
  });
});
