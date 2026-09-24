const { connect, disconnect } = require("mongoose");

const SLUGS = [
  "eqourse-ai-data-services-annotation-bounding-box",
  "eqourse-ai-data-services-image-annotation-quality-assurance",
  "eqourse-content-services-multilingual-content-quality-review",
];

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const { SkillTaxonomyModel } = require("../../../dist/database/skill-taxonomy.schema.js");
  const { TestModel } = require("../../../dist/assessments/test.schema.js");
  await connect(process.env.MONGODB_URI);
  try {
    for (const taxonomySlug of SLUGS) {
      if (!await SkillTaxonomyModel.exists({ slug: taxonomySlug, status: "ACTIVE" })) {
        throw new Error(`Active taxonomy category missing: ${taxonomySlug}`);
      }
      await TestModel.updateOne({ taxonomySlug }, { $setOnInsert: {
        taxonomySlug,
        timeLimitSeconds: 900,
        questionCount: 10,
        passThresholdPercent: 70,
        cooldownDays: 14,
        maxAttempts: 2,
        tierBands: { silverMinPercent: 80, goldMinPercent: 90 },
        questions: [],
      } }, { upsert: true, runValidators: true });
    }
    process.stdout.write("Showcase tests configured (3 categories; existing configurations preserved)\n");
  } finally { await disconnect(); }
}

if (require.main === module) run().catch((error) => {
  process.stderr.write(`Showcase test configuration failed: ${error.message}\n`);
  process.exitCode = 1;
});

module.exports = { SLUGS };
