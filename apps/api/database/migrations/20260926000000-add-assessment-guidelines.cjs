const guideline = {
  bsonType: "object", additionalProperties: false,
  required: ["title", "body"],
  properties: {
    title: { bsonType: "string", minLength: 1, maxLength: 200 },
    body: { bsonType: "string", minLength: 1, maxLength: 10000 },
  },
};

const acknowledgement = {
  bsonType: "object", additionalProperties: false,
  required: ["digest", "title", "body", "acknowledgedAt"],
  properties: {
    digest: { bsonType: "string", pattern: "^[a-f0-9]{64}$" },
    title: { bsonType: "string" },
    body: { bsonType: "string" },
    acknowledgedAt: { bsonType: "date" },
  },
};

async function up(db) {
  for (const [collectionName, field, schema] of [
    ["tests", "guideline", guideline],
    ["testAttempts", "guidelineAcknowledgement", acknowledgement],
  ]) {
    const collection = await db.listCollections({ name: collectionName }).next();
    if (!collection?.options?.validator?.$jsonSchema) throw new Error(`Assessment validator missing: ${collectionName}`);
    const validator = structuredClone(collection.options.validator);
    validator.$jsonSchema.properties[field] = schema;
    await db.command({ collMod: collectionName, validator, validationLevel: "strict", validationAction: "error" });
  }
}

async function down() { throw new Error("Assessment guideline history migration is irreversible"); }

module.exports = { up, down };
