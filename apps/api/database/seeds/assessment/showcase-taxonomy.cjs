const { connect, disconnect } = require("mongoose");

const ROWS = [
  {
    businessUnit: "EQOURSE", serviceLine: "AI Data Services",
    skill: "Image Annotation Quality Assurance", specialization: null,
    slug: "eqourse-ai-data-services-image-annotation-quality-assurance",
  },
  {
    businessUnit: "EQOURSE", serviceLine: "Content Services",
    skill: "Multilingual Content Quality Review", specialization: null,
    slug: "eqourse-content-services-multilingual-content-quality-review",
  },
];

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const { SkillTaxonomyModel } = require("../../../dist/database/skill-taxonomy.schema.js");
  await connect(process.env.MONGODB_URI);
  try {
    for (const row of ROWS) {
      const existing = await SkillTaxonomyModel.findOne({ slug: row.slug });
      if (existing) continue;
      await SkillTaxonomyModel.create({ ...row, status: "ACTIVE", version: 1 });
    }
    process.stdout.write("Showcase taxonomy ready (2 categories)\n");
  } finally { await disconnect(); }
}

if (require.main === module) run().catch((error) => {
  process.stderr.write(`Showcase taxonomy seed failed: ${error.message}\n`);
  process.exitCode = 1;
});

module.exports = { ROWS };
