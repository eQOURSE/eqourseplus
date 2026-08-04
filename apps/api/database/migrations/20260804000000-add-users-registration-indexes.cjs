const COLLECTION_NAME = "users";

const indexes = [
  {
    key: { phone: 1 },
    name: "users_phone_unique_sparse",
    unique: true,
    sparse: true,
  },
  {
    key: { pan: 1 },
    name: "users_pan_unique_sparse",
    unique: true,
    sparse: true,
  },
  {
    key: { "deviceFingerprints.hash": 1 },
    name: "users_device_fingerprint_hash",
  },
  {
    key: { profileState: 1 },
    name: "users_profile_state",
  },
];

async function up(db) {
  const exists = await db.listCollections({ name: COLLECTION_NAME }).hasNext();
  if (!exists) {
    await db.createCollection(COLLECTION_NAME);
  }
  await db.collection(COLLECTION_NAME).createIndexes(indexes);
}

async function down(db) {
  const exists = await db.listCollections({ name: COLLECTION_NAME }).hasNext();
  if (!exists) return;
  for (const index of indexes) {
    await db.collection(COLLECTION_NAME).dropIndex(index.name);
  }
}

module.exports = { down, up };
