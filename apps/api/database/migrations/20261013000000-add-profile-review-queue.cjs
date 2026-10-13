const PROFILE_COLLECTION = "profiles";
const OLD_QUEUE_INDEX = "state_1_updatedAt_1";
const NEW_QUEUE_INDEX = "state_1_submittedAt_1";

async function currentValidator(db) {
  const definition = await db
    .listCollections({ name: PROFILE_COLLECTION }, { nameOnly: false })
    .next();
  const validator = definition?.options?.validator;
  if (!validator?.$jsonSchema) throw new Error("profiles validator is missing");
  return validator;
}

module.exports = {
  async up(db) {
    const validator = await currentValidator(db);
    validator.$jsonSchema.properties.submittedAt = { bsonType: "date" };
    await db.command({
      collMod: PROFILE_COLLECTION,
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
    // Existing submitted profiles predate submittedAt; updatedAt is the closest available
    // submission-time proxy. The service also falls back to createdAt for exceptional legacy rows.
    await db.collection(PROFILE_COLLECTION).updateMany(
      {
        state: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
        submittedAt: { $exists: false },
      },
      [{ $set: { submittedAt: { $ifNull: ["$updatedAt", "$createdAt"] } } }],
    );
    await dropIndexIfPresent(db, OLD_QUEUE_INDEX);
    await db.collection(PROFILE_COLLECTION).createIndex({ state: 1, submittedAt: 1 });
  },

  async down(db) {
    const validator = await currentValidator(db);
    await db.collection(PROFILE_COLLECTION).updateMany(
      { submittedAt: { $exists: true } },
      { $unset: { submittedAt: "" } },
    );
    delete validator.$jsonSchema.properties.submittedAt;
    await db.command({
      collMod: PROFILE_COLLECTION,
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
    await dropIndexIfPresent(db, NEW_QUEUE_INDEX);
    await db.collection(PROFILE_COLLECTION).createIndex({ state: 1, updatedAt: 1 });
  },
};

async function dropIndexIfPresent(db, indexName) {
  const collection = db.collection(PROFILE_COLLECTION);
  const indexes = await collection.listIndexes().toArray();
  if (indexes.some((index) => index.name === indexName)) {
    await collection.dropIndex(indexName);
  }
}
