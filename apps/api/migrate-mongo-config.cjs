const path = require("node:path");

function requireMongoUri(environment) {
  const uri =
    environment.NODE_ENV === "production"
      ? environment.MONGODB_MIGRATION_URI
      : environment.MONGODB_MIGRATION_URI || environment.MONGODB_URI;
  if (!uri) {
    throw new Error(
      environment.NODE_ENV === "production"
        ? "MONGODB_MIGRATION_URI is required for deployed database migrations"
        : "MONGODB_MIGRATION_URI or MONGODB_URI is required for database migrations",
    );
  }
  return uri;
}

function databaseNameFromUri(uri) {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/.*\/([^/?]+)(?:\?.*)?$/);
  if (!match?.[1]) {
    throw new Error("Migration MongoDB URI must include a database name");
  }
  return decodeURIComponent(match[1]);
}

const url = requireMongoUri(process.env);

module.exports = {
  mongodb: {
    url,
    databaseName: databaseNameFromUri(url),
  },
  migrationsDir: path.join(__dirname, "database", "migrations"),
  changelogCollectionName: "migrationChangelog",
  lockCollectionName: "migrationLock",
  lockTtl: 300,
  migrationFileExtension: ".cjs",
};
