import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connection, type mongo } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";

interface MigrateMongoConfig {
  changelogCollectionName: string;
  lockCollectionName: string;
  lockTtl: number;
  migrationFileExtension: string;
  migrationsDir: string;
  mongodb: {
    databaseName: string;
    url: string;
  };
}

interface MigrateMongo {
  config: {
    set(config: MigrateMongoConfig): void;
  };
  database: {
    connect(): Promise<{ client: mongo.MongoClient; db: mongo.Db }>;
  };
  up(db: mongo.Db, client: mongo.MongoClient): Promise<string[]>;
}

interface SkillTaxonomySeed {
  seedSkillTaxonomy(db: mongo.Db, now?: Date): Promise<void>;
}

interface SeededTaxonomyRow {
  businessUnit: "EQOURSE" | "TUTRAIN";
  createdAt: Date;
  serviceLine: string;
  skill: string;
  slug: string;
  specialization: string | null;
  status: "ACTIVE" | "DEPRECATED";
  updatedAt: Date;
  version: number;
}

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(testDirectory, "..");

describe("FR-FND-03 database migration and taxonomy seed", () => {
  let memoryServer: MongoMemoryServer;
  let client: mongo.MongoClient;
  let db: mongo.Db;
  let uri: string;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    const databaseName = "eqourse_fnd_03_test";
    uri = memoryServer.getUri(databaseName);
    process.env.MONGODB_URI = uri;

    const config = require(
      path.join(apiDirectory, "migrate-mongo-config.cjs"),
    ) as MigrateMongoConfig;
    const migrateMongo = (await import(
      "migrate-mongo"
    )) as unknown as MigrateMongo;
    migrateMongo.config.set(config);

    ({ client, db } = await migrateMongo.database.connect());
    await migrateMongo.up(db, client);
  }, 60_000);

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    if (client) await client.close();
    if (memoryServer) await memoryServer.stop();
  });

  it("creates the strict skillTaxonomy validator and normative indexes", async () => {
    const collection = db.collection("skillTaxonomy");
    const indexes = await collection.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: { slug: 1 }, unique: true }),
        expect.objectContaining({
          key: {
            businessUnit: 1,
            serviceLine: 1,
            skill: 1,
            specialization: 1,
          },
          unique: true,
        }),
        expect.objectContaining({ key: { status: 1 } }),
      ]),
    );

    await expect(
      collection.insertOne({
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Polygon",
        slug: "eqourse-ai-data-services-annotation-polygon",
        status: "ACTIVE",
        version: 1,
        level: "ADVANCED",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 121 });

    await expect(
      collection.insertOne({
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Polygon",
        slug: "Not-Kebab-Case",
        status: "ACTIVE",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: 121 });
  });

  it("wires the Nest application through MONGODB_URI", async () => {
    let app: INestApplication | undefined;
    process.env.JWT_SECRET = "test-only-jwt-secret-at-least-32-characters";

    try {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleRef.createNestApplication();
      await app.init();

      expect(connection.readyState).toBe(1);
    } finally {
      delete process.env.JWT_SECRET;
      if (app) await app.close();
    }
  });

  it("upserts the three normative rows by slug without duplicates or mutations", async () => {
    const { seedSkillTaxonomy } = require(
      path.join(apiDirectory, "database", "seeds", "skill-taxonomy.cjs"),
    ) as SkillTaxonomySeed;
    const collection = db.collection<SeededTaxonomyRow>("skillTaxonomy");

    await seedSkillTaxonomy(db, new Date("2026-07-21T01:00:00.000Z"));
    const afterFirstRun = await collection.find().sort({ slug: 1 }).toArray();

    await seedSkillTaxonomy(db, new Date("2026-07-21T02:00:00.000Z"));
    const afterSecondRun = await collection.find().sort({ slug: 1 }).toArray();

    expect(afterSecondRun).toEqual(afterFirstRun);
    expect(afterSecondRun).toHaveLength(3);
    expect(
      afterSecondRun.map((row) => ({
        businessUnit: row.businessUnit,
        serviceLine: row.serviceLine,
        skill: row.skill,
        specialization: row.specialization,
        slug: row.slug,
        status: row.status,
        version: row.version,
      })),
    ).toEqual([
      {
        businessUnit: "EQOURSE",
        serviceLine: "AI Data Services",
        skill: "Annotation",
        specialization: "Bounding Box",
        slug: "eqourse-ai-data-services-annotation-bounding-box",
        status: "ACTIVE",
        version: 1,
      },
      {
        businessUnit: "EQOURSE",
        serviceLine: "Content Services",
        skill: "Curriculum",
        specialization: null,
        slug: "eqourse-content-services-curriculum",
        status: "ACTIVE",
        version: 1,
      },
      {
        businessUnit: "TUTRAIN",
        serviceLine: "Tutoring",
        skill: "NEET Biology",
        specialization: null,
        slug: "tutrain-tutoring-neet-biology",
        status: "ACTIVE",
        version: 1,
      },
    ]);
  });

  it("runs the seed CLI cleanly using only MONGODB_URI", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [path.join(apiDirectory, "database", "seeds", "skill-taxonomy.cjs")],
      {
        cwd: apiDirectory,
        env: { ...process.env, MONGODB_URI: uri },
      },
    );

    expect(stdout).toContain("skillTaxonomy seed complete (3 rows)");
    expect(await db.collection("skillTaxonomy").countDocuments()).toBe(3);
  });
});
