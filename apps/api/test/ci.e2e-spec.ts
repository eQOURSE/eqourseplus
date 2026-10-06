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

describe("FR-FND-05 API deployment", () => {
  it("provides an approved Cloud Run migration runner for FR-FND-07", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const migrationJob = workflow.slice(workflow.indexOf("  database-migrate:"));

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toMatch(
      /workflow_dispatch:[\s\S]+environment:[\s\S]+type:\s*choice[\s\S]+staging[\s\S]+production/,
    );
    expect(workflow).toMatch(
      /database-migrate:[\s\S]+if:\s*\$\{\{ github\.event_name == 'workflow_dispatch' \}\}/,
    );
    expect(migrationJob).toMatch(
      /environment:\s*\n\s+name:\s*\$\{\{ inputs\.environment \}\}/,
    );
    expect(migrationJob).toContain("id-token: write");
    expect(migrationJob).toContain("google-github-actions/auth@v3");
    expect(migrationJob).toContain(
      "workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}",
    );
    expect(migrationJob).toContain(
      "service_account: ${{ vars.GCP_DEPLOY_SERVICE_ACCOUNT }}",
    );
    expect(migrationJob).toContain("google-github-actions/setup-gcloud@v3");
    expect(migrationJob).toContain("MONGODB_URI_MIGRATOR_STAGING");
    expect(migrationJob).toContain("MONGODB_URI_MIGRATOR");
    expect(migrationJob).toContain(
      "MIGRATION_ARGS=up,-f,/app/migrate-mongo-config.cjs",
    );
    expect(migrationJob).toContain(
      "MIGRATION_ARGS=status,-f,/app/migrate-mongo-config.cjs",
    );
    expect(migrationJob).toContain("--command=node");
    expect(migrationJob).toContain(
      "--args=\"/app/node_modules/migrate-mongo/bin/migrate-mongo.js,${MIGRATION_ARGS}\"",
    );
    expect(migrationJob).not.toContain("--command=pnpm");
    expect(migrationJob).toContain("--network=default");
    expect(migrationJob).toContain("--subnet=default");
    expect(migrationJob).toContain("--vpc-egress=all-traffic");
    expect(migrationJob).toContain("--set-secrets");
    expect(migrationJob).toContain("gcloud run jobs executions wait");
    expect(migrationJob).toContain("gcloud run jobs executions describe");
    expect(migrationJob).toContain("gcloud logging read");
    expect(migrationJob).not.toContain("gcloud secrets versions access");
    expect(migrationJob).not.toContain("echo $MONGODB_MIGRATION_URI");
  });

  it("documents the migration identity, IAM contract, and environment secrets", () => {
    const runbook = readFileSync(deploymentRunbookPath, "utf8");

    expect(runbook).toContain(
      "eqplus-migrator@eqplus-503212.iam.gserviceaccount.com",
    );
    expect(runbook).toContain("roles/run.admin");
    expect(runbook).toContain("roles/iam.serviceAccountUser");
    expect(runbook).toContain("roles/secretmanager.secretAccessor");
    expect(runbook).toContain("roles/logging.viewer");
    expect(runbook).toContain(
      "github-eqplus-deployer@eqplus-503212.iam.gserviceaccount.com",
    );
    expect(runbook).toContain(
      "MONGODB_URI_MIGRATOR_STAGING",
    );
    expect(runbook).toContain("MONGODB_URI_MIGRATOR");
    expect(runbook).toMatch(
      /staging[\s\S]+MONGODB_URI_MIGRATOR_STAGING[\s\S]+production[\s\S]+MONGODB_URI_MIGRATOR/,
    );
  });

  it("passes the Cloud Run migration secret to migrate-mongo", () => {
    const migrationConfig = readFileSync(
      path.join(repositoryDirectory, "apps", "api", "migrate-mongo-config.cjs"),
      "utf8",
    );

    expect(migrationConfig).toContain(
      "environment.MONGODB_MIGRATION_URI ?? environment.MONGODB_URI",
    );
  });

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

  it("builds one SHA image and deploys staging from develop with keyless auth", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("FR-FND-05");
    expect(workflow).toContain("PROJECT_ID: eqplus-503212");
    expect(workflow).toContain("REGION: asia-south1");
    expect(workflow).toContain("ARTIFACT_REPOSITORY: eqplus-api");
    expect(workflow).toContain("IMAGE_NAME: eqplus-api");
    expect(workflow).toMatch(/staging-deploy:[\s\S]+needs: ci/);
    expect(workflow).toMatch(
      /staging-deploy:[\s\S]+github\.event_name == 'push'[\s\S]+refs\/heads\/develop/,
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
      "--set-secrets=MONGODB_URI=MONGODB_URI_STAGING:latest,JWT_SECRET=JWT_SECRET_STAGING:latest,VENDOR_IDENTIFIER_HMAC_SECRET=VENDOR_IDENTIFIER_HMAC_SECRET:latest,CLIENT_IDENTIFIER_HMAC_SECRET=CLIENT_IDENTIFIER_HMAC_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest",
    );
    expect(workflow).toContain("--startup-probe=httpGet.path=/health");
    expect(workflow).toContain("--liveness-probe=httpGet.path=/health");
    expect(workflow).not.toContain("credentials_json");
    expect(workflow).not.toMatch(/service[_-]account[_-]key/i);
  });

  it("promotes the successful develop image without rebuilding behind production approval", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const productionJob = workflow.slice(workflow.indexOf("  production-deploy:"));

    expect(workflow).toMatch(
      /production-deploy:[\s\S]+needs: ci[\s\S]+environment:\s*\n\s+name: production/,
    );
    expect(productionJob).toContain("refs/heads/main");
    expect(productionJob).toContain("HEAD^2");
    expect(productionJob).toContain('"$(git rev-parse origin/develop)"');
    expect(productionJob).toContain("actions/workflows/ci.yml/runs");
    expect(productionJob).toContain('"Build, push, and deploy staging API"');
    expect(productionJob).toContain("gcloud artifacts docker images describe");
    expect(productionJob).toContain('PROMOTED_IMAGE="${IMAGE_BASE}@${DIGEST}"');
    expect(productionJob).toContain("status.imageDigest");
    expect(productionJob).not.toContain("docker build");
    expect(productionJob).not.toContain("docker push");
    expect(workflow).toContain("gcloud run deploy eqplus-api");
    expect(productionJob).toContain('--image="${PROMOTED_IMAGE}"');
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
      workflow.match(/--set-secrets=MONGODB_URI=[^,]+:latest/g)?.length,
    ).toBe(2);
    expect(
      workflow.match(/--startup-probe=httpGet\.path=\/health/g)?.length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      workflow.match(/--liveness-probe=httpGet\.path=\/health/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("tags the main merge commit only after production health succeeds", () => {
    const productionJob = readFileSync(workflowPath, "utf8").split("  production-deploy:")[1];
    expect(productionJob.indexOf("Verify production health")).toBeLessThan(
      productionJob.indexOf("Tag production release"),
    );
    expect(productionJob).toContain("contents: write");
    expect(productionJob).toContain("git tag -a");
    expect(productionJob).toContain("prod-%Y%m%d-%H%M");
    expect(productionJob).toContain("git push origin");
  });

  it("binds staging and production to separate MongoDB secrets", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const stagingJob = workflow.slice(
      workflow.indexOf("  staging-deploy:"),
      workflow.indexOf("  production-deploy:"),
    );
    const productionJob = workflow.slice(workflow.indexOf("  production-deploy:"));

    expect(stagingJob).toContain(
      '--service-account="${STAGING_RUNTIME_SERVICE_ACCOUNT}"',
    );
    expect(productionJob).toContain(
      '--service-account="${PRODUCTION_RUNTIME_SERVICE_ACCOUNT}"',
    );
    expect(workflow).not.toMatch(/^\s+RUNTIME_SERVICE_ACCOUNT:/m);
    expect(stagingJob).toContain(
      "MONGODB_URI=MONGODB_URI_STAGING:latest",
    );
    expect(stagingJob).not.toContain(
      "MONGODB_URI=MONGODB_URI_PRODUCTION:latest",
    );
    expect(productionJob).toContain("MONGODB_URI=MONGODB_URI:latest");
    expect(productionJob).not.toContain(
      "MONGODB_URI=MONGODB_URI_PRODUCTION:latest",
    );
    expect(productionJob).not.toContain(
      "MONGODB_URI=MONGODB_URI_STAGING:latest",
    );
    expect(stagingJob).not.toContain("MONGODB_URI=MONGODB_URI:latest");
  });

  it("binds each runtime identity to its own JWT signing secret", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const stagingJob = workflow.slice(
      workflow.indexOf("  staging-deploy:"),
      workflow.indexOf("  production-deploy:"),
    );
    const productionJob = workflow.slice(workflow.indexOf("  production-deploy:"));
    const runbook = readFileSync(deploymentRunbookPath, "utf8");

    expect(stagingJob).toContain("JWT_SECRET=JWT_SECRET_STAGING:latest");
    expect(stagingJob).not.toContain("JWT_SECRET=JWT_SECRET_PRODUCTION:latest");
    expect(productionJob).toContain("JWT_SECRET=JWT_SECRET:latest");
    expect(productionJob).not.toContain("JWT_SECRET=JWT_SECRET_PRODUCTION:latest");
    expect(productionJob).not.toContain("JWT_SECRET=JWT_SECRET_STAGING:latest");
    expect(stagingJob).not.toContain("JWT_SECRET=JWT_SECRET:latest");

    expect(runbook).not.toContain("gcloud secrets create JWT_SECRET_STAGING");
    expect(runbook).toContain("gcloud secrets get-iam-policy JWT_SECRET_STAGING");
    expect(runbook).toContain("gcloud secrets describe JWT_SECRET_STAGING");
    expect(runbook).toContain("gcloud secrets describe JWT_SECRET");
    expect(runbook).toContain("distinct database clusters, users,");
    expect(runbook).toContain("JWT values");
    expect(runbook).toMatch(/Unsuffixed names are PRODUCTION/i);
  });

  it("fails fast and deploys each service with its explicit CORS origin", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const stagingJob = workflow.slice(
      workflow.indexOf("  staging-deploy:"),
      workflow.indexOf("  production-deploy:"),
    );
    const productionJob = workflow.slice(
      workflow.indexOf("  production-deploy:"),
    );

    expect(stagingJob).toContain(
      'CORS_ORIGINS: "http://localhost:3000,https://staging.plus.eqourse.com"',
    );
    expect(productionJob).toContain(
      'CORS_ORIGINS: "https://plus.eqourse.com"',
    );
    expect(stagingJob).toContain("Validate staging runtime configuration");
    expect(productionJob).toContain(
      "Validate production runtime configuration",
    );
    expect(stagingJob).toContain(
      "Missing required runtime configuration: CORS_ORIGINS",
    );
    expect(productionJob).toContain(
      "Missing required runtime configuration: CORS_ORIGINS",
    );
    expect(stagingJob).toContain(
      '--set-env-vars="^;^CORS_ORIGINS=${CORS_ORIGINS};MAILER_PROVIDER=${MAILER_PROVIDER}',
    );
    expect(productionJob).toContain(
      '--set-env-vars=CORS_ORIGINS="${CORS_ORIGINS}",MAILER_PROVIDER="${MAILER_PROVIDER}",OTP_EMAIL_FROM="${OTP_EMAIL_FROM}"',
    );
    expect(stagingJob).toContain(
      "--set-secrets=MONGODB_URI=MONGODB_URI_STAGING:latest,JWT_SECRET=JWT_SECRET_STAGING:latest,VENDOR_IDENTIFIER_HMAC_SECRET=VENDOR_IDENTIFIER_HMAC_SECRET:latest,CLIENT_IDENTIFIER_HMAC_SECRET=CLIENT_IDENTIFIER_HMAC_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest",
    );
    expect(productionJob).toContain(
      "--set-secrets=MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,VENDOR_IDENTIFIER_HMAC_SECRET=VENDOR_IDENTIFIER_HMAC_SECRET:latest,CLIENT_IDENTIFIER_HMAC_SECRET=CLIENT_IDENTIFIER_HMAC_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest",
    );
  });

  it("uses the real environment-specific private R2 bucket in both deploy jobs", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const stagingJob = workflow.slice(
      workflow.indexOf("  staging-deploy:"),
      workflow.indexOf("  production-deploy:"),
    );
    const productionJob = workflow.slice(workflow.indexOf("  production-deploy:"));

    for (const job of [stagingJob, productionJob]) {
      expect(job).toContain('STORAGE_PROVIDER: "r2"');
      expect(job).toContain(
        'R2_ENDPOINT: "https://50c49dfc680d966ef959aba266b04ea9.r2.cloudflarestorage.com"',
      );
    }
    expect(stagingJob).toContain('R2_BUCKET: "eqplus-staging-kyc-docs"');
    expect(productionJob).toContain('R2_BUCKET: "eqplus-prod-kyc-docs"');
  });

  it("uses the approved Resend sender in both staging and production", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const stagingJob = workflow.slice(
      workflow.indexOf("  staging-deploy:"),
      workflow.indexOf("  production-deploy:"),
    );
    const productionJob = workflow.slice(
      workflow.indexOf("  production-deploy:"),
    );

    expect(stagingJob).toContain('MAILER_PROVIDER: "resend"');
    expect(stagingJob).toContain("OTP_EMAIL_FROM: ${{ vars.OTP_EMAIL_FROM }}");
    expect(stagingJob).toContain("Missing required runtime configuration: OTP_EMAIL_FROM");
    expect(stagingJob).toContain(
      ';MAILER_PROVIDER=${MAILER_PROVIDER};OTP_EMAIL_FROM=${OTP_EMAIL_FROM}',
    );
    expect(stagingJob).toContain("RESEND_API_KEY=RESEND_API_KEY:latest");

    expect(productionJob).toContain('MAILER_PROVIDER: "resend"');
    expect(productionJob).toContain("OTP_EMAIL_FROM: ${{ vars.OTP_EMAIL_FROM }}");
    expect(productionJob).toContain(
      "Missing required runtime configuration: OTP_EMAIL_FROM",
    );
    expect(productionJob).toContain(
      '--set-env-vars=CORS_ORIGINS="${CORS_ORIGINS}",MAILER_PROVIDER="${MAILER_PROVIDER}",OTP_EMAIL_FROM="${OTP_EMAIL_FROM}"',
    );
    expect(productionJob).toContain(
      "RESEND_API_KEY=RESEND_API_KEY:latest",
    );
  });

  it("keeps the SMS port sandboxed in staging and production", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    const stagingJob = workflow.slice(
      workflow.indexOf("  staging-deploy:"),
      workflow.indexOf("  production-deploy:"),
    );
    const productionJob = workflow.slice(
      workflow.indexOf("  production-deploy:"),
    );

    expect(stagingJob).toContain('SMS_PROVIDER: "sandbox"');
    expect(productionJob).toContain('SMS_PROVIDER: "sandbox"');
    expect(productionJob).toContain(
      '--set-env-vars=CORS_ORIGINS="${CORS_ORIGINS}",MAILER_PROVIDER="${MAILER_PROVIDER}",OTP_EMAIL_FROM="${OTP_EMAIL_FROM}",SMS_PROVIDER="${SMS_PROVIDER}"',
    );
    expect(productionJob).toContain(
      "--set-secrets=MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,VENDOR_IDENTIFIER_HMAC_SECRET=VENDOR_IDENTIFIER_HMAC_SECRET:latest,CLIENT_IDENTIFIER_HMAC_SECRET=CLIENT_IDENTIFIER_HMAC_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest,R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest",
    );
  });

  it("never truncates a folded deploy command with an inline shell comment", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    // A folded block scalar joins its lines with spaces, so a '#' inside one
    // turns every following flag into a shell comment and silently drops it.
    const foldedCommands = [
      ...workflow.matchAll(/run: >-\r?\n((?:[ \t]+\S.*\r?\n)+)/g),
    ].map((match) => match[1]);

    expect(foldedCommands.length).toBeGreaterThanOrEqual(4);
    for (const command of foldedCommands) {
      expect(command).not.toMatch(/^\s*#/m);
      expect(command.replace(/\n\s*/g, " ")).not.toContain(" #");
    }
  });

  it("documents the deploy identity's actAs grant on both runtime service accounts", () => {
    const runbook = readFileSync(deploymentRunbookPath, "utf8");

    expect(runbook).toContain("roles/iam.serviceAccountUser");
    expect(runbook).toMatch(
      /iam service-accounts get-iam-policy[\s\S]+RuntimePrincipal/,
    );
    expect(runbook).toMatch(/actAs/);
    expect(runbook).toContain(
      "gcloud secrets get-iam-policy MONGODB_URI_STAGING",
    );
  });

  it("documents develop and main WIF trust and Secret Manager setup", () => {
    const runbook = readFileSync(deploymentRunbookPath, "utf8");

    expect(runbook).toMatch(/before merging/i);
    expect(runbook).toContain("eQOURSE/eqourseplus");
    expect(runbook).toContain("refs/heads/main");
    expect(runbook).toContain("refs/heads/develop");
    expect(runbook).toContain("assertion.repository_owner=='eQOURSE'");
    expect(runbook).toContain(
      "assertion.repository=='eQOURSE/eqourseplus'",
    );
    expect(runbook).toContain("assertion.ref in ['refs/heads/develop', 'refs/heads/main']");
    expect(runbook).toContain("providers update-oidc");
    expect(runbook).toContain("roles/iam.workloadIdentityUser");
    expect(runbook).not.toMatch(/gcloud (?:artifacts repositories|iam service-accounts|secrets) create /);
    expect(runbook).toContain("gcloud secrets describe MONGODB_URI_STAGING");
    expect(runbook).toContain("gcloud secrets get-iam-policy JWT_SECRET_STAGING");
    expect(runbook).toContain("gcloud secrets get-iam-policy VENDOR_IDENTIFIER_HMAC_SECRET");
    expect(runbook).toContain("gcloud secrets get-iam-policy CLIENT_IDENTIFIER_HMAC_SECRET");
    expect(runbook).toMatch(
      /rotating[\s\S]+countryIdentifiers\.lookupDigest[\s\S]+recomputing every digest[\s\S]+rebuilding that index/i,
    );
    expect(runbook).toContain("GCP_WORKLOAD_IDENTITY_PROVIDER");
    expect(runbook).toContain("GCP_DEPLOY_SERVICE_ACCOUNT");
    expect(runbook).toContain("CORS_ORIGINS");
    expect(runbook).toContain("RESEND_API_KEY");
    expect(runbook).toContain("OTP_EMAIL_FROM");
    expect(runbook).toContain("GoDaddy CNAME");
    expect(runbook).toContain("already complete");
    expect(runbook).toContain("--set-env-vars");
    expect(runbook).toMatch(/not a Secret Manager secret/i);
    expect(runbook).toMatch(/production.+required reviewer/is);
  });

  it("documents the existing isolated Atlas staging setup without stale taxonomy instructions", () => {
    const runbook = readFileSync(deploymentRunbookPath, "utf8");

    expect(runbook).toContain("MONGODB_URI_STAGING");
    expect(runbook).toContain("MONGODB_URI");
    expect(runbook).not.toContain("MONGODB_URI_PRODUCTION");
    expect(runbook).toContain("eqplus-api-staging-runtime");
    expect(runbook).toContain("`MONGODB_URI_STAGING` and `JWT_SECRET_STAGING` must grant only the staging");
    expect(runbook).toContain("unsuffixed database and JWT secrets must grant only production");
    expect(runbook).toMatch(/Never copy production users, documents, or OTP\/session data/i);
    expect(runbook).toContain("SCRAM user `eqplus-staging-app`");
    expect(runbook).toContain("migrate-mongo `status`");
    expect(runbook).toContain("migrate-mongo `up`");
    expect(runbook).toContain(
      "/app/node_modules/migrate-mongo/bin/migrate-mongo.js",
    );
    expect(runbook).toContain("Staging remains valid for application");
    expect(runbook).toMatch(/FR-FND-07\s+migrations run through the dedicated workflow job/);
    expect(runbook).toContain("GCP_MIGRATION_SERVICE_ACCOUNT");
    expect(runbook).toMatch(/`autoIndex: false` in\s+deployed environments/);
    expect(runbook).toContain("eqplus-staging-app");
    expect(runbook).toContain("/eqplus");
    expect(runbook).not.toContain("eqplus-staging-api");
    expect(runbook).not.toContain("eqplus_staging");
    expect(runbook).not.toContain("production database currently contains 3 taxonomy rows");
    expect(runbook).not.toContain("disable squash and rebase merging for this repository");
    expect(runbook).toContain("Squash feature-to-develop PRs");
    expect(runbook).toContain("Create a merge commit");
    expect(runbook).toContain("http://localhost:3000,https://staging.plus.eqourse.com");
    expect(runbook).toContain("staging.plus.eqourse.com");
  });
});
