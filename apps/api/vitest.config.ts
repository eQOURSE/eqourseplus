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
    // Existing AppModule integration suites predate the client secret. Keep their
    // fixtures unchanged while exercising startup validation explicitly elsewhere.
    env: {
      CLIENT_IDENTIFIER_HMAC_SECRET:
        "test-only-client-hmac-secret-at-least-32-characters",
    },
  },
});
