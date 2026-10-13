const PROFILE_COLLECTION = "profiles";

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
    await db.collection(PROFILE_COLLECTION).createIndex({ state: 1, submittedAt: 1 });
  },

  async down(db) {
    const validator = await currentValidator(db);
    delete validator.$jsonSchema.properties.submittedAt;
    await db.command({
      collMod: PROFILE_COLLECTION,
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
    await db.collection(PROFILE_COLLECTION).dropIndex({ state: 1, submittedAt: 1 });
  },
};
