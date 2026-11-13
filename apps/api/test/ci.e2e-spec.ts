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
      workflow.indexOf("  database-migrate:"),
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

  it("checks pull requests and pushes to both protected branches", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toMatch(/^concurrency:\s*$/m);
    expect(workflow).toContain("cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}");
    expect(workflow).toMatch(/^\s+push:\s*$/m);
    expect(workflow).toMatch(/^\s+- main\s*$/m);
    expect(workflow).toMatch(/^\s+- develop\s*$/m);
    expect(workflow).toContain("staging-deploy");
    expect(workflow).toContain("refs/heads/develop");
    expect(workflow).toContain("github.event_name == 'push'");
    expect(workflow).toContain("FR-FND-05");
  });
});

describe("FR-FND-05 AWS ECS deployment", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const migration = workflow.split("  database-migrate:")[1].split("  staging-deploy:")[0];
  const staging = workflow.split("  staging-deploy:")[1].split("  production-deploy:")[0];
  const production = workflow.split("  production-deploy:")[1];

  it("uses keyless AWS roles in each approved environment", () => {
    for (const forbidden of ["gcloud", "google-github-actions", "aws-access-key-id", "secrets.AWS_", "vars.GCP_"]) expect(workflow).not.toContain(forbidden);
    expect(workflow).toContain("AWS_REGION: ap-south-1");
    expect(workflow).toContain("AWS_ACCOUNT_ID: 284874841026");
    expect(workflow).toContain("ECR_REPOSITORY: eqplus-api");
    expect(workflow.match(/aws-actions\/configure-aws-credentials@v4/g)).toHaveLength(3);
    expect(staging).toContain("name: Build, push, and deploy staging API");
    expect(staging).not.toMatch(/^\s+environment:/m);
    expect(staging).toContain("role/eqplus-github-deploy-staging");
    expect(production).toMatch(/environment:\s*\n\s+name: production/);
    expect(production).toContain("role/eqplus-github-deploy-production");
    expect(migration).toContain("name: ${{ inputs.environment }}");
    expect(migration).toContain("role/eqplus-github-migrate-${{ inputs.environment }}");
  });

  it("builds once for staging and checks its ECS rollout", () => {
    for (const fragment of ["aws-actions/amazon-ecr-login@v2", "aws ecr describe-images", "docker build --file apps/api/Dockerfile", "docker push", "^sha256:[a-f0-9]{64}$", "aws ecs describe-task-definition", "aws ecs register-task-definition", "key=Project,value=eQOURSE+", "key=Environment,value=staging", "key=SourceSha,value=", "aws ecs update-service", "aws ecs wait services-stable", "rolloutState", "COMPLETED", "https://api-staging.plus.eqourse.com/health", "Missing required runtime configuration: OTP_EMAIL_FROM", "http://localhost:3000,https://staging.plus.eqourse.com", "eqplus-staging-kyc-docs"]) expect(staging).toContain(fragment);
    expect(staging).toContain("--include TAGS");
    expect(staging).toContain(".taskDefinition | del(.taskDefinitionArn,.revision,.status,.requiresAttributes,.compatibilities,.registeredAt,.registeredBy,.deregisteredAt)");
    expect(staging).not.toContain(".secrets =");
  });

  it("promotes only the verified digest behind production approval", () => {
    for (const fragment of ["HEAD^2", "origin/develop", "Verify source commit passed staging deployment", "gh api", "Build, push, and deploy staging API", "aws ecr describe-images", "PROMOTED_IMAGE", "Staging is not running the image selected for promotion", "aws ecs describe-services", "aws ecs describe-task-definition", "key=Project,value=eQOURSE+", "key=Environment,value=production", "aws ecs wait services-stable", "rolloutState", "https://api.plus.eqourse.com/health", "eqplus-prod-kyc-docs", "git tag -a", "SOURCE_SHA"]) expect(production).toContain(fragment);
    expect(production).not.toContain("docker build");
    expect(production).not.toContain("docker push");
    expect(production).not.toContain(".secrets =");
    expect(production.indexOf("Verify production health")).toBeLessThan(production.indexOf("Tag production release"));
  });

  it("runs approval gated ECS migrations with logs and exit validation", () => {
    for (const fragment of ["MIGRATION_ACTION=seed", "MIGRATION_ACTION=apply", "aws ecr describe-images", "/app/scripts/run-migration.cjs", "MONGODB_MIGRATION_URI", "MONGODB_URI_MIGRATOR", "aws ecs register-task-definition", "key=Project,value=eQOURSE+", "key=Environment,value=", "aws ecs run-task", "assignPublicIp=DISABLED", "aws ecs wait tasks-stopped", "aws logs get-log-events", "if: always()", "EssentialContainerExited", "exitCode"]) expect(migration).toContain(fragment);
    expect(migration).toContain("subnet-08f064ed2f87d7663");
    expect(migration).toContain("subnet-02ee1d41c12e597dc");
    expect(migration).toContain("sg-0abf6a84538fd858b");
    expect(migration).toContain("sg-0bdab43c8e81b9785");
    expect(migration).not.toContain("taskRoleArn");
    expect(migration).not.toContain("--with-decryption");
    expect(migration).toContain("environment:");
    expect(migration).toContain("inputs.environment");
  });

  it("keeps the non-root production Docker image", () => {
    const dockerfile = readFileSync(dockerfilePath, "utf8");
    const dockerignore = readFileSync(dockerignorePath, "utf8");
    expect(dockerfile.match(/^FROM /gm)).toHaveLength(3);
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toMatch(/^ENV NODE_ENV=production$/m);
    expect(dockerfile).toMatch(/^USER node$/m);
    expect(dockerfile).toContain('CMD ["node", "dist/main.js"]');
    for (const fragment of [".env", ".git", "node_modules"]) expect(dockerignore).toContain(fragment);
  });
});
