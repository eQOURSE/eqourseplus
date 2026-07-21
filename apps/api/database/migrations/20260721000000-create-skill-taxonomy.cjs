const COLLECTION_NAME = "skillTaxonomy";

const validator = {
  $jsonSchema: {
    bsonType: "object",
    additionalProperties: false,
    required: [
      "_id",
      "businessUnit",
      "serviceLine",
      "skill",
      "slug",
      "status",
      "version",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      _id: { bsonType: "objectId" },
      businessUnit: { enum: ["EQOURSE", "TUTRAIN"] },
      serviceLine: { bsonType: "string", minLength: 1 },
      skill: { bsonType: "string", minLength: 1 },
      specialization: {
        oneOf: [
          { bsonType: "string", minLength: 1 },
          { bsonType: "null" },
        ],
      },
      slug: {
        bsonType: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      },
      status: { enum: ["ACTIVE", "DEPRECATED"] },
      version: { bsonType: "number", minimum: 1 },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

async function up(db) {
  const exists = await db.listCollections({ name: COLLECTION_NAME }).hasNext();

  if (exists) {
    await db.command({
      collMod: COLLECTION_NAME,
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    await db.createCollection(COLLECTION_NAME, {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }

  await db.collection(COLLECTION_NAME).createIndexes([
    {
      key: { slug: 1 },
      name: "skill_taxonomy_slug_unique",
      unique: true,
    },
    {
      key: {
        businessUnit: 1,
        serviceLine: 1,
        skill: 1,
        specialization: 1,
      },
      name: "skill_taxonomy_path_unique",
      unique: true,
    },
    {
      key: { status: 1 },
      name: "skill_taxonomy_status",
    },
  ]);
}

async function down() {
  throw new Error(
    "skillTaxonomy migration is irreversible; taxonomy nodes use soft deprecation",
  );
}

module.exports = { down, up };
