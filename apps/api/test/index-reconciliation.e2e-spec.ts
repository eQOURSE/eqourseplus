import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { MongoMemoryServer } from "mongodb-memory-server";
import { mongo } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

interface IndexNameMigration {
  up(db: mongo.Db): Promise<void>;
  down(db: mongo.Db): Promise<void>;
}

const require = createRequire(import.meta.url);
const migration = require(
  fileURLToPath(
    new URL(
      "../database/migrations/20260929000000-reconcile-users-index-names.cjs",
      import.meta.url,
    ),
  ),
) as IndexNameMigration;

const originalNames = {
  phone: "users_phone_unique_sparse",
  pan: "users_pan_unique_sparse",
  fingerprint: "users_device_fingerprint_hash",
  state: "users_profile_state",
};
const canonicalNames = {
  phone: "phone_1",
  pan: "pan_1",
  fingerprint: "deviceFingerprints.hash_1",
  state: "profileState_1",
};

describe("FR-FND-07 name-aware users index reconciliation", () => {
  let server: MongoMemoryServer;
  let client: mongo.MongoClient;
  const scratch = mkdtempSync(path.join(tmpdir(), "eqplus-index-baseline-"));

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = new mongo.MongoClient(server.getUri());
    await client.connect();
  });

  afterAll(async () => {
    if (client) await client.close();
    if (server) await server.stop();
    for (const file of readdirSync(scratch)) {
      unlinkSync(path.join(scratch, file));
    }
    rmdirSync(scratch);
    delete process.env.INDEX_RECONCILIATION_BASELINE_PATH;
    delete process.env.INDEX_RECONCILIATION_WRITES_PAUSED;
    delete process.env.MONGODB_MIGRATION_URI;
  });

  async function seed(db: mongo.Db, names: typeof canonicalNames): Promise<void> {
    const users = db.collection("users");
    await users.insertOne({ email: "sample@example.com" });
    await users.createIndexes([
      { key: { phone: 1 }, name: names.phone, unique: true, sparse: true },
      { key: { pan: 1 }, name: names.pan, unique: true, sparse: true },
      { key: { "deviceFingerprints.hash": 1 }, name: names.fingerprint },
      { key: { profileState: 1 }, name: names.state },
    ]);
  }

  async function names(db: mongo.Db): Promise<string[]> {
    return (await db.collection("users").indexes())
      .map((index) => index.name as string)
      .sort();
  }

  for (const [startingPoint, initial] of [
    ["production", canonicalNames],
    ["staging", originalNames],
  ] as const) {
    it(`reconciles and reverses the ${startingPoint} manifest`, async () => {
      const db = client.db(`index_reconciliation_${startingPoint}`);
      await seed(db, initial);
      const before = await names(db);
      process.env.MONGODB_MIGRATION_URI = server.getUri(db.databaseName);
      process.env.INDEX_RECONCILIATION_BASELINE_PATH = path.join(
        scratch,
        `${startingPoint}.json`,
      );
      process.env.INDEX_RECONCILIATION_WRITES_PAUSED = "true";

      await migration.up(db);
      expect(await names(db)).toEqual(["_id_", ...Object.values(canonicalNames)].sort());
      await migration.up(db);
      expect(await names(db)).toEqual(["_id_", ...Object.values(canonicalNames)].sort());
      expect(JSON.parse(readFileSync(process.env.INDEX_RECONCILIATION_BASELINE_PATH, "utf8"))).toMatchObject({ database: db.databaseName });

      await migration.down(db);
      expect(await names(db)).toEqual(before);
      const indexes = await db.collection("users").indexes();
      expect(indexes.find((index) => index.name === initial.phone)).toMatchObject({
        unique: true,
        sparse: true,
      });
      expect(indexes.find((index) => index.name === initial.pan)).toMatchObject({
        unique: true,
        sparse: true,
      });
    });
  }

  it("refuses an unexpected unique-index definition before dropping anything", async () => {
    const db = client.db("index_reconciliation_unexpected");
    await seed(db, originalNames);
    await db.collection("users").dropIndex(originalNames.phone);
    await db.collection("users").createIndex({ phone: 1 }, { name: originalNames.phone });
    const before = await names(db);
    process.env.MONGODB_MIGRATION_URI = server.getUri(db.databaseName);
    process.env.INDEX_RECONCILIATION_BASELINE_PATH = path.join(scratch, "unexpected.json");
    process.env.INDEX_RECONCILIATION_WRITES_PAUSED = "true";

    await expect(migration.up(db)).rejects.toThrow(/unexpected.*phone/i);
    expect(await names(db)).toEqual(before);
  });

  it("requires a write pause before changing a unique index name", async () => {
    const db = client.db("index_reconciliation_not_paused");
    await seed(db, originalNames);
    const before = await names(db);
    const baselinePath = path.join(scratch, "not-paused.json");
    process.env.MONGODB_MIGRATION_URI = server.getUri(db.databaseName);
    process.env.INDEX_RECONCILIATION_BASELINE_PATH = baselinePath;
    delete process.env.INDEX_RECONCILIATION_WRITES_PAUSED;

    await expect(migration.up(db)).rejects.toThrow(/pause application writes/i);
    expect(await names(db)).toEqual(before);
    expect(existsSync(baselinePath)).toBe(false);
  });

  it("refuses a baseline captured from another database", async () => {
    const db = client.db("index_reconciliation_wrong_baseline");
    await seed(db, originalNames);
    const before = await names(db);
    process.env.MONGODB_MIGRATION_URI = server.getUri(db.databaseName);
    process.env.INDEX_RECONCILIATION_BASELINE_PATH = path.join(scratch, "staging.json");
    process.env.INDEX_RECONCILIATION_WRITES_PAUSED = "true";

    await expect(migration.up(db)).rejects.toThrow(/baseline does not belong/i);
    expect(await names(db)).toEqual(before);
  });
});
