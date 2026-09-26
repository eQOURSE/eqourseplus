const SEED_ROWS = [
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Collection",
    specialization: "Image Data Collection",
    slug: "eqourse-ai-data-services-data-collection-image-data-collection",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Collection",
    specialization: "Audio and Speech Data Collection",
    slug: "eqourse-ai-data-services-data-collection-audio-and-speech-data-collection",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Collection",
    specialization: "Text Data Collection",
    slug: "eqourse-ai-data-services-data-collection-text-data-collection",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Collection",
    specialization: "Video Data Collection",
    slug: "eqourse-ai-data-services-data-collection-video-data-collection",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Collection",
    specialization: "Multimodal Data Collection",
    slug: "eqourse-ai-data-services-data-collection-multimodal-data-collection",
    status: "ACTIVE",
  },
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
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Polygon",
    slug: "eqourse-ai-data-services-annotation-polygon",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Semantic Segmentation",
    slug: "eqourse-ai-data-services-annotation-semantic-segmentation",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Instance Segmentation",
    slug: "eqourse-ai-data-services-annotation-instance-segmentation",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Keypoints",
    slug: "eqourse-ai-data-services-annotation-keypoints",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Annotation",
    specialization: "Image Classification",
    slug: "eqourse-ai-data-services-annotation-image-classification",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Audio Annotation",
    specialization: "Transcription",
    slug: "eqourse-ai-data-services-audio-annotation-transcription",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Audio Annotation",
    specialization: "Speaker Diarization",
    slug: "eqourse-ai-data-services-audio-annotation-speaker-diarization",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Audio Annotation",
    specialization: "Emotion",
    slug: "eqourse-ai-data-services-audio-annotation-emotion",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Audio Annotation",
    specialization: "Acoustic Events",
    slug: "eqourse-ai-data-services-audio-annotation-acoustic-events",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Video Annotation",
    specialization: "Object Tracking",
    slug: "eqourse-ai-data-services-video-annotation-object-tracking",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Video Annotation",
    specialization: "Action Recognition",
    slug: "eqourse-ai-data-services-video-annotation-action-recognition",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Video Annotation",
    specialization: "Event Boundaries",
    slug: "eqourse-ai-data-services-video-annotation-event-boundaries",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "LLM Evaluation",
    specialization: "Response Ranking",
    slug: "eqourse-ai-data-services-llm-evaluation-response-ranking",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "LLM Evaluation",
    specialization: "Safety Evaluation",
    slug: "eqourse-ai-data-services-llm-evaluation-safety-evaluation",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "LLM Evaluation",
    specialization: "Factuality Verification",
    slug: "eqourse-ai-data-services-llm-evaluation-factuality-verification",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "LLM Evaluation",
    specialization: "Red Teaming",
    slug: "eqourse-ai-data-services-llm-evaluation-red-teaming",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "AI Model Testing",
    specialization: "Human Evaluation",
    slug: "eqourse-ai-data-services-ai-model-testing-human-evaluation",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "AI Model Testing",
    specialization: "AI Bias and Fairness Audit",
    slug: "eqourse-ai-data-services-ai-model-testing-ai-bias-and-fairness-audit",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Quality",
    specialization: "Data Cleaning",
    slug: "eqourse-ai-data-services-data-quality-data-cleaning",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Quality",
    specialization: "Dataset QA and Label Audit",
    slug: "eqourse-ai-data-services-data-quality-dataset-qa-and-label-audit",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Quality",
    specialization: "PII Detection and Redaction",
    slug: "eqourse-ai-data-services-data-quality-pii-detection-and-redaction",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Quality",
    specialization: "Metadata Enrichment",
    slug: "eqourse-ai-data-services-data-quality-metadata-enrichment",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "AI Data Services",
    skill: "Data Quality",
    specialization: "Data Validation and Verification",
    slug: "eqourse-ai-data-services-data-quality-data-validation-and-verification",
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
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Curriculum",
    specialization: "Curriculum Development",
    slug: "eqourse-content-services-curriculum-curriculum-development",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Curriculum",
    specialization: "Assessment Alignment",
    slug: "eqourse-content-services-curriculum-assessment-alignment",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Writing",
    specialization: "Instructional Writing",
    slug: "eqourse-content-services-writing-instructional-writing",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Writing",
    specialization: "Assessment Writing",
    slug: "eqourse-content-services-writing-assessment-writing",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Editing",
    specialization: "Copy Editing",
    slug: "eqourse-content-services-editing-copy-editing",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Editing",
    specialization: "Proofreading",
    slug: "eqourse-content-services-editing-proofreading",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Localization",
    specialization: "Translation",
    slug: "eqourse-content-services-localization-translation",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Localization",
    specialization: "Transcreation",
    slug: "eqourse-content-services-localization-transcreation",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Localization",
    specialization: "Multilingual QA",
    slug: "eqourse-content-services-localization-multilingual-qa",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Digital Learning",
    specialization: "eLearning Storyboarding",
    slug: "eqourse-content-services-digital-learning-elearning-storyboarding",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Digital Learning",
    specialization: "Accessibility Review",
    slug: "eqourse-content-services-digital-learning-accessibility-review",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Video Content",
    specialization: "Learning Video",
    slug: "eqourse-content-services-video-content-learning-video",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Publishing",
    specialization: "Content QA",
    slug: "eqourse-content-services-publishing-content-qa",
    status: "ACTIVE",
  },
  {
    businessUnit: "EQOURSE",
    serviceLine: "Content Services",
    skill: "Subject-Matter Review",
    specialization: "Education Subject Review",
    slug: "eqourse-content-services-subject-matter-review-education-subject-review",
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
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "NEET Physics",
    specialization: null,
    slug: "tutrain-tutoring-neet-physics",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "NEET Chemistry",
    specialization: null,
    slug: "tutrain-tutoring-neet-chemistry",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "JEE Mathematics",
    specialization: null,
    slug: "tutrain-tutoring-jee-mathematics",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "JEE Physics",
    specialization: null,
    slug: "tutrain-tutoring-jee-physics",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "JEE Chemistry",
    specialization: null,
    slug: "tutrain-tutoring-jee-chemistry",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "IGCSE Mathematics",
    specialization: null,
    slug: "tutrain-tutoring-igcse-mathematics",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "IGCSE English",
    specialization: null,
    slug: "tutrain-tutoring-igcse-english",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "IGCSE Biology",
    specialization: null,
    slug: "tutrain-tutoring-igcse-biology",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "Coding and AI",
    specialization: null,
    slug: "tutrain-tutoring-coding-and-ai",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "Mathematics",
    specialization: null,
    slug: "tutrain-tutoring-mathematics",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "Science",
    specialization: null,
    slug: "tutrain-tutoring-science",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "English",
    specialization: null,
    slug: "tutrain-tutoring-english",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "Computer Science",
    specialization: null,
    slug: "tutrain-tutoring-computer-science",
    status: "ACTIVE",
  },
  {
    businessUnit: "TUTRAIN",
    serviceLine: "Tutoring",
    skill: "Social Studies",
    specialization: null,
    slug: "tutrain-tutoring-social-studies",
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
    process.stdout.write(`skillTaxonomy seed complete (${SEED_ROWS.length} rows)\n`);
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
