import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { MongoMemoryServer } from "mongodb-memory-server";
import { deleteModel, model, Schema } from "mongoose";
import { describe, expect, it } from "vitest";

import { DatabaseConnectionService } from "../src/database/database-connection.service";
import { loadDatabaseConfig } from "../src/database/database.config";

describe("FR-FND-07 deployed index ownership", () => {
  const migrationConfigPath = fileURLToPath(
    new URL("../migrate-mongo-config.cjs", import.meta.url),
  );

  it("disables Mongoose index creation in deployed runtimes", () => {
    expect(
      loadDatabaseConfig({
        MONGODB_URI: "mongodb://localhost:27017/eqplus",
        NODE_ENV: "production",
      }).autoIndex,
    ).toBe(false);
  });

  it("retains schema index creation in development and tests", () => {
    for (const nodeEnvironment of ["development", "test"]) {
      expect(
        loadDatabaseConfig({
          MONGODB_URI: "mongodb://localhost:27017/eqplus",
          NODE_ENV: nodeEnvironment,
        }).autoIndex,
      ).toBe(true);
    }
  });

  it("starts a deployed model without building its declared index", async () => {
    const server = await MongoMemoryServer.create();
    const previousUri = process.env.MONGODB_URI;
    const previousNodeEnvironment = process.env.NODE_ENV;
    const schema = new Schema({ value: String }, { collection: "indexOwnershipProbe" });
    schema.index({ value: 1 }, { unique: true });
    const Probe = model("IndexOwnershipProbe", schema);
    const database = new DatabaseConnectionService();
    try {
      process.env.MONGODB_URI = server.getUri("index_ownership_test");
      process.env.NODE_ENV = "production";
      await database.connect();
      await Probe.init();
      const indexes = await Probe.collection.indexes();
      expect(indexes.map((index) => index.name)).toEqual(["_id_"]);
    } finally {
      await database.onApplicationShutdown();
      deleteModel("IndexOwnershipProbe");
      await server.stop();
      if (previousUri === undefined) delete process.env.MONGODB_URI;
      else process.env.MONGODB_URI = previousUri;
      if (previousNodeEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnvironment;
    }
  });

  it("uses a separate migration credential in production", () => {
    const command = [
      "-e",
      "process.stdout.write(require(process.argv[1]).mongodb.url)",
      migrationConfigPath,
    ];
    const appUri = "mongodb://localhost:27017/app";
    const migrationUri = "mongodb://localhost:27017/migration";
    const configured = spawnSync(process.execPath, command, {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        MONGODB_URI: appUri,
        MONGODB_MIGRATION_URI: migrationUri,
      },
    });
    expect(configured.status).toBe(0);
    expect(configured.stdout).toBe(migrationUri);

    const missing = spawnSync(process.execPath, command, {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        MONGODB_URI: appUri,
        MONGODB_MIGRATION_URI: "",
      },
    });
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toContain("MONGODB_MIGRATION_URI is required");
  });
});
