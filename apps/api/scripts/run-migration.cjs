const { spawnSync } = require("node:child_process");
const path = require("node:path");

const cliPath = path.resolve(__dirname, "../node_modules/migrate-mongo/bin/migrate-mongo.js");
const configPath = path.resolve(__dirname, "../migrate-mongo-config.cjs");
const seedPath = path.resolve(__dirname, "../database/seeds/skill-taxonomy.cjs");
const action = process.env.MIGRATION_ACTION || "status";

if (!new Set(["status", "apply", "seed"]).has(action)) {
  console.error(`Unsupported database operation: ${action}`);
  process.exit(2);
}

function run(command) {
  console.log(`migration: ${command}`);
  const result = spawnSync(process.execPath, [cliPath, command, "-f", configPath], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (action === "seed") {
  console.log("database: seed skill taxonomy");
  const result = spawnSync(process.execPath, [seedPath], {
    stdio: "inherit",
    env: process.env,
    cwd: path.resolve(__dirname, ".."),
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
} else {
  run("status");
  if (action === "apply") {
    run("up");
    run("status");
  }
}
