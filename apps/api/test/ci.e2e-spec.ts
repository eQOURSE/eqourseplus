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
const dockerfilePath = path.join(
  repositoryDirectory,
  "apps",
  "api",
  "Dockerfile",
);
const dockerignorePath = path.join(repositoryDirectory, ".dockerignore");
const deploymentRunbookPath = path.join(
  repositoryDirectory,
  "docs",
  "FR-FND-05-manual-steps.md",
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
    const ciJob = workflow.slice(
      workflow.indexOf("  ci:"),
      workflow.indexOf("  staging-deploy:"),
    );
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
    expect(rootPackage.packageManager).toBe("pnpm@11.9.0");
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
    expect(ciJob).not.toContain("MONGODB_URI");
  });

  it("cancels superseded PR runs and leaves a main-only staging deploy hook", () => {
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

describe("FR-FND-05 API deployment", () => {
  it("defines a pnpm-aware, multi-stage, non-root production API image", () => {
    const dockerfile = readFileSync(dockerfilePath, "utf8");
    const dockerignore = readFileSync(dockerignorePath, "utf8");

    expect(dockerfile.match(/^FROM /gm)).toHaveLength(3);
    expect(dockerfile).toMatch(/^FROM .+ AS build$/m);
    expect(dockerfile).toContain("corepack enable");
    expect(dockerfile).toContain("pnpm@11.9.0");
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toMatch(/pnpm .+@eqourse\/api.+ build/);
    expect(dockerfile).toMatch(/^FROM node:22\.23\.1-.+ AS runtime$/m);
    expect(dockerfile).toMatch(/^ENV NODE_ENV=production$/m);
    expect(dockerfile).toMatch(/^ENV PORT=8080$/m);
    expect(dockerfile).toMatch(/^USER node$/m);
    expect(dockerfile).toMatch(/^EXPOSE 8080$/m);
    expect(dockerfile).toContain('CMD ["node", "dist/main.js"]');

    expect(dockerignore).toContain(".env");
    expect(dockerignore).toContain("gha-creds-*.json");
    expect(dockerignore).toContain(".git");
    expect(dockerignore).toContain("node_modules");
  });

  it("builds one immutable image and deploys staging from main with keyless auth", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("FR-FND-05");
    expect(workflow).toContain("PROJECT_ID: eqplus-503212");
    expect(workflow).toContain("REGION: asia-south1");
    expect(workflow).toContain("ARTIFACT_REPOSITORY: eqplus-api");
    expect(workflow).toContain("IMAGE_NAME: eqplus-api");
    expect(workflow).toMatch(/staging-deploy:[\s\S]+needs: ci/);
    expect(workflow).toMatch(
      /staging-deploy:[\s\S]+github\.event_name == 'push'[\s\S]+refs\/heads\/main/,
    );
    expect(workflow).toMatch(
      /staging-deploy:[\s\S]+permissions:[\s\S]+contents: read[\s\S]+id-token: write/,
    );
    expect(workflow).toContain("google-github-actions/auth@v3");
    expect(workflow).toContain("google-github-actions/setup-gcloud@v3");
    expect(workflow).toContain(
      "workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}",
    );
    expect(workflow).toContain(
      "service_account: ${{ vars.GCP_DEPLOY_SERVICE_ACCOUNT }}",
    );
    expect(workflow).toContain(
      "asia-south1-docker.pkg.dev/eqplus-503212/eqplus-api/eqplus-api:${{ github.sha }}",
    );
    expect(workflow).toContain("docker build");
    expect(workflow).toContain("docker push");
    expect(workflow).toContain("gcloud run deploy eqplus-api-staging");
    expect(workflow).toContain("--region=asia-south1");
    expect(workflow).toContain("--min-instances=0");
    expect(workflow).toContain("--allow-unauthenticated");
    expect(workflow).toContain(
      "--set-secrets=MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest",
    );
    expect(workflow).toContain("--startup-probe=httpGet.path=/health");
    expect(workflow).toContain("--liveness-probe=httpGet.path=/health");
    expect(workflow).not.toContain("credentials_json");
    expect(workflow).not.toMatch(/service[_-]account[_-]key/i);
  });

  it("deploys the same commit image to production only through its approval environment", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(
      /production-deploy:[\s\S]+needs: staging-deploy[\s\S]+environment:\s*\n\s+name: production/,
    );
    expect(workflow).toContain("gcloud run deploy eqplus-api");
    expect(workflow).toContain(
      "asia-south1-docker.pkg.dev/eqplus-503212/eqplus-api/eqplus-api:${{ github.sha }}",
    );
    expect(
      workflow.match(/--region=asia-south1/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      workflow.match(/--min-instances=0/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      workflow.match(/--allow-unauthenticated/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      workflow.match(
        /--set-secrets=MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest/g,
      )?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      workflow.match(/--startup-probe=httpGet\.path=\/health/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      workflow.match(/--liveness-probe=httpGet\.path=\/health/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("documents the pre-merge, main-only WIF and Secret Manager setup", () => {
    const runbook = readFileSync(deploymentRunbookPath, "utf8");

    expect(runbook).toMatch(/before merging/i);
    expect(runbook).toContain("eQOURSE/eqourseplus");
    expect(runbook).toContain("refs/heads/main");
    expect(runbook).toContain("assertion.repository_owner=='eQOURSE'");
    expect(runbook).toContain(
      "assertion.repository=='eQOURSE/eqourseplus'",
    );
    expect(runbook).toContain("assertion.ref=='refs/heads/main'");
    expect(runbook).toContain("roles/iam.workloadIdentityUser");
    expect(runbook).toContain(
      "gcloud secrets create MONGODB_URI --replication-policy=automatic --data-file=-",
    );
    expect(runbook).toContain(
      "gcloud secrets create JWT_SECRET --replication-policy=automatic --data-file=-",
    );
    expect(runbook).toContain(
      'gcloud secrets add-iam-policy-binding JWT_SECRET',
    );
    expect(runbook).toContain("GCP_WORKLOAD_IDENTITY_PROVIDER");
    expect(runbook).toContain("GCP_DEPLOY_SERVICE_ACCOUNT");
    expect(runbook).toMatch(/production.+required reviewer/is);
  });
});
