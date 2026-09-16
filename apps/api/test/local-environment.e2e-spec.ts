import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { loadLocalEnvironment } from "../src/local-environment";

describe("FR-FND-02 local API environment", () => {
  it("loads the repository .env before starting both development workspaces", () => {
    const testDirectory = path.dirname(fileURLToPath(import.meta.url));
    const packagePath = path.resolve(testDirectory, "../../..", "package.json");
    const rootPackage = JSON.parse(readFileSync(packagePath, "utf8")) as {
      scripts: { dev: string };
    };

    expect(rootPackage.scripts.dev).toBe(
      "node --env-file=.env node_modules/turbo/bin/turbo run dev --env-mode=loose --parallel --filter=@eqourse/web --filter=@eqourse/api",
    );
  });

  it("loads the repository-root .env when the API starts from its workspace", () => {
    const workspace = path.join("C:", "workspace", "apps", "api");
    const rootEnv = path.join("C:", "workspace", ".env");
    const loadEnvFile = vi.fn();

    const loaded = loadLocalEnvironment({
      cwd: workspace,
      environment: { NODE_ENV: "development" },
      fileExists: (candidate) => candidate === rootEnv,
      loadEnvFile,
    });

    expect(loaded).toBe(rootEnv);
    expect(loadEnvFile).toHaveBeenCalledTimes(1);
    expect(loadEnvFile).toHaveBeenCalledWith(rootEnv);
  });

  it("does not load a local file in production", () => {
    const loadEnvFile = vi.fn();

    expect(loadLocalEnvironment({
      cwd: path.join("C:", "workspace", "apps", "api"),
      environment: { NODE_ENV: "production" },
      fileExists: () => true,
      loadEnvFile,
    })).toBeUndefined();
    expect(loadEnvFile).not.toHaveBeenCalled();
  });
});
