import path from "node:path";

import { defineConfig } from "vitest/config";

process.env.MONGOMS_DOWNLOAD_DIR ??= path.resolve(
  __dirname,
  "../../node_modules/.cache/mongodb-memory-server",
);

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
  },
});
