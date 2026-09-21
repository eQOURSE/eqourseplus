import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MongoMemoryServer } from "mongodb-memory-server";
import { mongo } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

interface ProfilesMigration {
  up(db: mongo.Db): Promise<void>;
}

const require = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(
  testDirectory,
  "..",
  "database",
  "migrations",
  "20260921000000-create-profiles-and-backfill-state.cjs",
);

describe("FR-REG-02B profiles migration", () => {
  let memoryServer: MongoMemoryServer;
  let client: mongo.MongoClient;
  let db: mongo.Db;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    client = new mongo.MongoClient(memoryServer.getUri());
    await client.connect();
    db = client.db("profile_migration_test");
  }, 60_000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  afterAll(async () => {
    if (client) await client.close();
    if (memoryServer) await memoryServer.stop();
  });

  function migration(): ProfilesMigration {
    return require(migrationPath) as ProfilesMigration;
  }

  it("creates the strict collection and four normative indexes", async () => {
    await migration().up(db);

    const collection = db.collection("profiles");
    const indexes = await collection.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: { userId: 1 }, unique: true }),
        expect.objectContaining({ key: { state: 1 } }),
        expect.objectContaining({ key: { "skills.taxonomySlug": 1 } }),
        expect.objectContaining({ key: { state: 1, updatedAt: 1 } }),
      ]),
    );

    await expect(
      collection.insertOne({
        userId: new mongo.ObjectId(),
        state: "DRAFT",
        unexpected: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 121 });
  });

  it("normalizes missing and null states, copies valid states, and is idempotent", async () => {
    const users = [
      { _id: new mongo.ObjectId(), email: "valid@example.com", profileState: "SUBMITTED" },
      { _id: new mongo.ObjectId(), email: "missing@example.com" },
      { _id: new mongo.ObjectId(), email: "null@example.com", profileState: null },
      { _id: new mongo.ObjectId(), email: "existing@example.com", profileState: "DRAFT" },
    ];
    const now = new Date("2026-09-21T09:00:00.000Z");
    await db.collection("users").insertMany(
      users.map((user) => ({
        ...user,
        roleAssignments: [],
        refreshSessions: [],
        createdAt: now,
        updatedAt: now,
      })),
    );
    await db.collection("profiles").insertOne({
      userId: users[3]._id,
      state: "APPROVED",
      createdAt: now,
      updatedAt: now,
    });
    const usersBefore = await db.collection("users").find().sort({ email: 1 }).toArray();

    await migration().up(db);
    const afterFirstRun = await db
      .collection("profiles")
      .find()
      .sort({ userId: 1 })
      .toArray();
    await migration().up(db);
    const afterSecondRun = await db
      .collection("profiles")
      .find()
      .sort({ userId: 1 })
      .toArray();

    expect(afterSecondRun).toEqual(afterFirstRun);
    expect(afterSecondRun).toHaveLength(4);
    expect(
      Object.fromEntries(
        afterSecondRun.map((profile) => [
          profile.userId.toHexString(),
          profile.state,
        ]),
      ),
    ).toEqual({
      [users[0]._id.toHexString()]: "SUBMITTED",
      [users[1]._id.toHexString()]: "DRAFT",
      [users[2]._id.toHexString()]: "DRAFT",
      [users[3]._id.toHexString()]: "APPROVED",
    });
    expect(await db.collection("users").find().sort({ email: 1 }).toArray()).toEqual(
      usersBefore,
    );
  });

  it("aborts before any write when a non-null legacy state is invalid", async () => {
    const users = [
      { _id: new mongo.ObjectId(), email: "valid@example.com", profileState: "DRAFT" },
      { _id: new mongo.ObjectId(), email: "corrupt@example.com", profileState: "UNKNOWN" },
    ];
    await db.collection("users").insertMany(users);
    const usersBefore = await db.collection("users").find().sort({ email: 1 }).toArray();

    await expect(migration().up(db)).rejects.toThrow(/profileState/i);

    expect(await db.listCollections({ name: "profiles" }).hasNext()).toBe(false);
    expect(await db.collection("users").find().sort({ email: 1 }).toArray()).toEqual(
      usersBefore,
    );
  });
});
