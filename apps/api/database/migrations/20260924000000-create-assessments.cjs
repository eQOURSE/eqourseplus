const option = {
  bsonType: "object", additionalProperties: false,
  required: ["id", "text"],
  properties: { id: { bsonType: "string" }, text: { bsonType: "string" } },
};

const base = {
  _id: { bsonType: "objectId" },
  __v: { bsonType: "number" },
  createdAt: { bsonType: "date" },
  updatedAt: { bsonType: "date" },
};

const testsValidator = { $jsonSchema: {
  bsonType: "object", additionalProperties: false,
  required: ["_id", "taxonomySlug", "timeLimitSeconds", "questionCount", "passThresholdPercent", "cooldownDays", "maxAttempts", "tierBands", "questions", "createdAt", "updatedAt"],
  properties: {
    ...base,
    taxonomySlug: { bsonType: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    timeLimitSeconds: { bsonType: "number", minimum: 1 },
    questionCount: { bsonType: "number", minimum: 1 },
    passThresholdPercent: { bsonType: "number", minimum: 0, maximum: 100 },
    cooldownDays: { bsonType: "number", minimum: 0 },
    maxAttempts: { bsonType: "number", minimum: 1 },
    tierBands: {
      bsonType: "object", additionalProperties: false,
      required: ["silverMinPercent", "goldMinPercent"],
      properties: {
        silverMinPercent: { bsonType: "number", minimum: 0, maximum: 100 },
        goldMinPercent: { bsonType: "number", minimum: 0, maximum: 100 },
      },
    },
    questions: { bsonType: "array", items: {
      bsonType: "object", additionalProperties: false,
      required: ["id", "kind", "status", "prompt", "difficulty", "options", "correctOptionId"],
      properties: {
        id: { bsonType: "string" }, kind: { enum: ["MCQ"] },
        status: { enum: ["DRAFT", "APPROVED"] }, prompt: { bsonType: "string" },
        difficulty: { enum: ["EASY", "MEDIUM", "HARD"] },
        options: { bsonType: "array", minItems: 4, maxItems: 4, items: option },
        correctOptionId: { bsonType: "string" },
      },
    } },
  },
} };

const attemptsValidator = { $jsonSchema: {
  bsonType: "object", additionalProperties: false,
  required: ["_id", "userId", "taxonomySlug", "attemptNumber", "status", "startedAt", "expiresAt", "passThresholdPercent", "tierBands", "items", "answers", "violations", "createdAt", "updatedAt"],
  properties: {
    ...base,
    userId: { bsonType: "objectId" }, taxonomySlug: { bsonType: "string" },
    attemptNumber: { bsonType: "number", minimum: 1 },
    status: { enum: ["IN_PROGRESS", "PASSED", "FAILED", "UNDER_REVIEW", "EXPIRED"] },
    startedAt: { bsonType: "date" }, expiresAt: { bsonType: "date" },
    passThresholdPercent: { bsonType: "number", minimum: 0, maximum: 100 },
    tierBands: {
      bsonType: "object", additionalProperties: false,
      required: ["silverMinPercent", "goldMinPercent"],
      properties: {
        silverMinPercent: { bsonType: "number", minimum: 0, maximum: 100 },
        goldMinPercent: { bsonType: "number", minimum: 0, maximum: 100 },
      },
    },
    submittedAt: { bsonType: "date" },
    items: { bsonType: "array", items: {
      bsonType: "object", additionalProperties: false,
      required: ["questionId", "prompt", "options", "correctOptionId"],
      properties: {
        questionId: { bsonType: "string" }, prompt: { bsonType: "string" },
        options: { bsonType: "array", items: option }, correctOptionId: { bsonType: "string" },
      },
    } },
    answers: { bsonType: "array", items: {
      bsonType: "object", additionalProperties: false,
      required: ["questionId", "optionId"],
      properties: { questionId: { bsonType: "string" }, optionId: { bsonType: "string" } },
    } },
    scorePercent: { bsonType: "number", minimum: 0, maximum: 100 },
    violations: { bsonType: "array", items: {
      bsonType: "object", additionalProperties: false,
      required: ["kind", "occurredAt"],
      properties: { kind: { enum: ["FULLSCREEN_EXIT", "TAB_SWITCH", "WINDOW_BLUR"] }, occurredAt: { bsonType: "date" } },
    } },
    tier: { enum: ["BRONZE", "SILVER", "GOLD"] },
  },
} };

async function up(db) {
  for (const [name, validator] of [["tests", testsValidator], ["testAttempts", attemptsValidator]]) {
    if (await db.listCollections({ name }).hasNext()) {
      await db.command({ collMod: name, validator, validationLevel: "strict", validationAction: "error" });
    } else {
      await db.createCollection(name, { validator, validationLevel: "strict", validationAction: "error" });
    }
  }
  const profileCollection = await db.listCollections({ name: "profiles" }).next();
  if (profileCollection?.options?.validator?.$jsonSchema) {
    const profileValidator = structuredClone(profileCollection.options.validator);
    profileValidator.$jsonSchema.properties.assessmentBadges = {
      bsonType: "array",
      items: {
        bsonType: "object", additionalProperties: false,
        required: ["taxonomySlug", "tier", "scorePercent", "awardedAt"],
        properties: {
          taxonomySlug: { bsonType: "string" },
          tier: { enum: ["BRONZE", "SILVER", "GOLD"] },
          scorePercent: { bsonType: "number", minimum: 0, maximum: 100 },
          awardedAt: { bsonType: "date" },
        },
      },
    };
    await db.command({ collMod: "profiles", validator: profileValidator, validationLevel: "strict", validationAction: "error" });
  }
  await db.collection("tests").createIndex({ taxonomySlug: 1 }, { unique: true, name: "tests_taxonomy_slug_unique" });
  await db.collection("testAttempts").createIndex({ userId: 1, taxonomySlug: 1, attemptNumber: 1 }, { unique: true, name: "test_attempt_number_unique" });
  await db.collection("testAttempts").createIndex({ userId: 1, taxonomySlug: 1, startedAt: -1 }, { name: "test_attempt_lookup" });
}

async function down() { throw new Error("Assessment history migration is irreversible"); }

module.exports = { up, down };
