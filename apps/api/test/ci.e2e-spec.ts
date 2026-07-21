import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryDirectory = path.resolve(testDirectory, "../../..");
const workflowPath = path.join(
  repositoryDirectory,
  ".github",
  "workflows",
  "ci.yml",
);
const packagePath = path.join(repositoryDirectory, "package.json");
const nodeVersionPath = path.join(repositoryDirectory, ".node-version");
const pinnedNodeVersion = "22.23.1";
const pnpmMinimumNodeVersion = [22, 13, 0] as const;

function parseNodeVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Expected a pinned Node version, received ${version}`);

  return match.slice(1).map(Number) as [number, number, number];
}

function meetsMinimumVersion(
  version: [number, number, number],
  minimum: readonly [number, number, number],
) {
  for (const [index, part] of version.entries()) {
    if (part !== minimum[index]) return part > minimum[index];
  }

  return true;
}

describe("FR-FND-04 CI workflow", () => {
  it("runs pinned, cache-backed lint, offline tests, and build checks for pull requests", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const rootPackage = JSON.parse(readFileSync(packagePath, "utf8")) as {
      engines: { node: string };
      packageManager: string;
    };
    const workflowNodeVersion = /node-version:\s*(\d+\.\d+\.\d+)/.exec(
      workflow,
    )?.[1];

    expect(workflow).toMatch(/^name: CI$/m);
    expect(workflow).toMatch(/^\s+pull_request:\s*$/m);
    expect(workflow).toContain("pnpm/action-setup@v4");
    expect(workflow).toMatch(/version:\s*11\.9\.0/);
        expect(rootPackage.packageManager).toBe("pnpm@99.9.9");
        expect(workflow).toContain("actions/setup-node@v4");
    expect(workflowNodeVersion).toBe(pinnedNodeVersion);
    expect(rootPackage.engines.node).toBe(pinnedNodeVersion);
    expect(readFileSync(nodeVersionPath, "utf8").trim()).toBe(
      pinnedNodeVersion,
    );
    expect(
      meetsMinimumVersion(
        parseNodeVersion(pinnedNodeVersion),
        pnpmMinimumNodeVersion,
      ),
    ).toBe(true);
    expect(workflow).toMatch(/cache:\s*pnpm/);
    expect(workflow).toContain("pnpm-lock.yaml");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("pnpm lint");
    expect(workflow).toContain("pnpm test");
    expect(workflow).toContain("pnpm build");
    expect(workflow).toMatch(/MONGOMS_RUNTIME_DOWNLOAD:\s*["']false["']/);
    expect(workflow).not.toContain("MONGODB_URI");
  });

  it("cancels superseded PR runs and leaves a main-only staging deploy stub", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/^concurrency:\s*$/m);
    expect(workflow).toMatch(/cancel-in-progress:\s*true/);
    expect(workflow).toMatch(/^\s+push:\s*$/m);
    expect(workflow).toMatch(/^\s+- main\s*$/m);
    expect(workflow).toContain("staging-deploy");
    expect(workflow).toContain("github.event_name == 'push'");
    expect(workflow).toContain("FR-FND-05");
  });
});
