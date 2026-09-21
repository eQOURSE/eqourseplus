const PROFILE_STATES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "TEST_PENDING",
  "TEST_PASSED",
  "APPROVED",
  "REJECTED",
  "MORE_INFO_NEEDED",
];

const optionalText = { bsonType: "string", minLength: 1 };
const date = { bsonType: "date" };
const year = {
  bsonType: ["int", "long", "double", "decimal"],
  minimum: 1900,
  maximum: new Date().getUTCFullYear() + 10,
  multipleOf: 1,
};
const strictObject = (properties) => ({
  bsonType: "object",
  additionalProperties: false,
  properties,
});
const optionalArray = (items) => ({ bsonType: "array", items });

const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "state", "createdAt", "updatedAt"],
    additionalProperties: false,
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      state: { enum: PROFILE_STATES },
      resumeSection: {
        enum: [
          "PERSONAL",
          "EDUCATION",
          "SKILLS",
          "LANGUAGES",
          "EXPERIENCE",
          "SAMPLES",
          "AVAILABILITY",
          "RATE",
        ],
      },
      personal: strictObject({
        firstName: optionalText,
        lastName: optionalText,
        headline: optionalText,
        city: optionalText,
      }),
      education: optionalArray(
        strictObject({
          institution: optionalText,
          qualification: optionalText,
          fieldOfStudy: optionalText,
          startYear: year,
          endYear: year,
        }),
      ),
      skills: optionalArray(
        strictObject({
          taxonomySlug: optionalText,
          level: { enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] },
        }),
      ),
      languages: optionalArray(
        strictObject({
          languageCode: optionalText,
          proficiency: {
            enum: ["BASIC", "CONVERSATIONAL", "PROFESSIONAL", "NATIVE"],
          },
        }),
      ),
      experience: strictObject({
        totalMonths: {
          bsonType: ["int", "long", "double", "decimal"],
          minimum: 0,
          maximum: 960,
          multipleOf: 1,
        },
        entries: optionalArray(
          strictObject({
            organization: optionalText,
            title: optionalText,
            startDate: date,
            endDate: date,
            summary: optionalText,
          }),
        ),
      }),
      samples: optionalArray(
        strictObject({ title: optionalText, objectKey: optionalText, uploadedAt: date }),
      ),
      availability: strictObject({
        availableFrom: date,
        weeklyHours: {
          bsonType: ["int", "long", "double", "decimal"],
          minimum: 1,
          maximum: 168,
          multipleOf: 1,
        },
        timeZone: optionalText,
      }),
      rate: strictObject({
        amountMinor: {
          bsonType: ["int", "long", "double", "decimal"],
          minimum: 1,
          multipleOf: 1,
        },
        currencyCode: { bsonType: "string", pattern: "^[A-Z]{3}$" },
        unit: { enum: ["HOUR"] },
      }),
      createdAt: date,
      updatedAt: date,
    },
  },
};

async function ensureCollection(db) {
  const exists = await db.listCollections({ name: "profiles" }).hasNext();
  if (exists) {
    await db.command({
      collMod: "profiles",
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    await db.createCollection("profiles", {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }
}

module.exports = {
  async up(db) {
    const invalid = await db.collection("users").findOne({
      profileState: { $exists: true, $ne: null, $nin: PROFILE_STATES },
    });
    if (invalid) {
      throw new Error("Invalid legacy users.profileState; correct the data before rerunning");
    }

    await ensureCollection(db);
    const profiles = db.collection("profiles");
    await profiles.createIndex({ userId: 1 }, { unique: true });
    await profiles.createIndex({ state: 1 });
    await profiles.createIndex({ "skills.taxonomySlug": 1 });
    await profiles.createIndex({ state: 1, updatedAt: 1 });

    const cursor = db.collection("users").find({}, { projection: { _id: 1, profileState: 1 } });
    for await (const user of cursor) {
      const now = new Date();
      await profiles.updateOne(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            state: user.profileState ?? "DRAFT",
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    }

    if (await db.listCollections({ name: "users" }).hasNext()) {
      const userIndexes = await db.collection("users").indexes();
      const legacyStateIndex = userIndexes.find(
        (index) => index.key && index.key.profileState === 1,
      );
      if (legacyStateIndex) await db.collection("users").dropIndex(legacyStateIndex.name);
    }
  },

  async down() {
    throw new Error("Profiles backfill is irreversible");
  },
};
