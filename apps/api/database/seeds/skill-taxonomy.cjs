const SEED_ROWS = [
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Bounding Box",
    slug: "eqourse-ai-data-services-annotation-bounding-box",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Curriculum",
    specialization: null,
    slug: "eqourse-content-services-curriculum",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "NEET Biology",
    specialization: null,
    slug: "tutrain-tutoring-neet-biology",
    status: "ACTIVE",
  },
];

function changedExpression(row) {
  return {
    $or: [
      { $ne: ["$businessUnit", row.businessUnit] },
      { $ne: ["$serviceLine", row.serviceLine] },
      { $ne: ["$skill", row.skill] },
      { $ne: ["$specialization", row.specialization] },
      { $ne: ["$status", row.status] },
    ],
  };
}

async function seedSkillTaxonomy(db, now = new Date()) {
  const collection = db.collection("skillTaxonomy");

  await collection.bulkWrite(
    SEED_ROWS.map((row) => {
      const isNew = { $eq: [{ $type: "$version" }, "missing"] };
      const changed = changedExpression(row);

      return {
        updateOne: {
          filter: { slug: row.slug },
          update: [
            {
              $set: {
                businessUnit: row.businessUnit,
                serviceLine: row.serviceLine,
                skill: row.skill,
                specialization: row.specialization,
                slug: row.slug,
                status: row.status,
                version: {
                  $cond: [
                    isNew,
                    1,
                    {
                      $cond: [changed, { $add: ["$version", 1] }, "$version"],
                    },
                  ],
                },
                createdAt: { $cond: [isNew, now, "$createdAt"] },
                updatedAt: {
                  $cond: [{ $or: [isNew, changed] }, now, "$updatedAt"],
                },
              },
            },
          ],
          upsert: true,
        },
      };
    }),
    { ordered: true },
  );
}

async function run() {
  const migrateMongoModule = await import("migrate-mongo");
  const migrateMongo = migrateMongoModule.default;
  const config = require("../../migrate-mongo-config.cjs");
  migrateMongo.config.set(config);

  const { client, db } = await migrateMongo.database.connect();
  try {
    await seedSkillTaxonomy(db);
    process.stdout.write("skillTaxonomy seed complete (3 rows)\n");
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`skillTaxonomy seed failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { SEED_ROWS, seedSkillTaxonomy };
