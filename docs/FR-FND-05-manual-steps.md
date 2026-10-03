# FR-FND-05 deployment rollout checklist

This runbook reflects the existing eQOURSE+ staging and production setup.
The Artifact Registry repository, deploy and runtime service accounts, `actAs`
bindings, database/JWT/HMAC/R2 secrets and grants, isolated Atlas staging
cluster, staging migrations, production approval environment, Resend secret and
sender, staging Resend access, and GoDaddy CNAME are already complete. Do not
rerun resource-creation commands or re-seed taxonomy to prepare this workflow.

Before the first merge into `develop`, an IAM administrator must update the
existing GitHub WIF provider in Section 3 to accept `refs/heads/develop`.
Repository administrators must establish the reviewed-PR branch rules in
Section 6.1. Verify existing resources in Sections 2, 4, 5, 6, and 7; treat
any discrepancy as a configuration issue rather than recreating a resource.

Index parity is currently unresolved. Staging remains valid for application
testing, including this workflow's deploy and health checks, but it is not a
valid migration rehearsal until the separately tracked index-ownership and
index-name reconciliation work is complete.

Run read-only checks and the WIF update from a trusted PowerShell terminal.
Do not display secret values or paste them into chat, tickets, or source control.

## 1. Set the identifiers

```powershell
$ProjectId = "eqplus-503212"
$Region = "asia-south1"
$ArtifactRepository = "eqplus-api"
$PoolId = "github-actions"
$ProviderId = "eqourseplus"
$DeployServiceAccountId = "github-eqplus-deployer"
$StagingRuntimeServiceAccountId = "eqplus-api-staging-runtime"
$ProductionRuntimeServiceAccountId = "eqplus-api-runtime"
$GitHubRepository = "eQOURSE/eqourseplus"

gcloud config set project $ProjectId
$ProjectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$DeployServiceAccount = "$DeployServiceAccountId@$ProjectId.iam.gserviceaccount.com"
$StagingRuntimeServiceAccount = "$StagingRuntimeServiceAccountId@$ProjectId.iam.gserviceaccount.com"
$ProductionRuntimeServiceAccount = "$ProductionRuntimeServiceAccountId@$ProjectId.iam.gserviceaccount.com"
```

The project must print a non-empty numeric project number before continuing:

```powershell
$ProjectNumber
```

## 2. Verify the existing Artifact Registry and service accounts

The repository and all three accounts exist. The deploy identity has
`roles/run.admin`, Artifact Registry writer, and `roles/iam.serviceAccountUser`
(`actAs`) on both runtime accounts. Verify those bindings; do not recreate or
regrant them unless an administrator finds a missing binding.

```powershell
gcloud artifacts repositories describe $ArtifactRepository `
  --project=$ProjectId --location=$Region

foreach ($RuntimePrincipal in @($StagingRuntimeServiceAccount, $ProductionRuntimeServiceAccount)) {
  gcloud iam service-accounts get-iam-policy $RuntimePrincipal `
    --project=$ProjectId `
    --flatten="bindings[].members" `
    --filter="bindings.role=roles/iam.serviceAccountUser" `
    --format="value(bindings.members)"
}
```

Each runtime account's `actAs` output must include the deploy service account.
The running API uses its own runtime identity and does not receive deployer
permissions.

## 3. Extend the existing GitHub Workload Identity Federation provider

The provider already exists. The first `develop` push cannot deploy until its
attribute condition accepts both `refs/heads/develop` and `refs/heads/main`.
Only the exact `eQOURSE/eqourseplus` repository may authenticate; PR refs,
forks, tags, and other branches remain excluded. An IAM administrator runs:

```powershell
gcloud iam workload-identity-pools providers update-oidc $ProviderId `
  --project=$ProjectId `
  --location=global `
  --workload-identity-pool=$PoolId `
  --attribute-condition="assertion.repository_owner=='eQOURSE' && assertion.repository=='eQOURSE/eqourseplus' && assertion.ref in ['refs/heads/develop', 'refs/heads/main']"

gcloud iam workload-identity-pools providers describe $ProviderId `
  --project=$ProjectId `
  --location=global `
  --workload-identity-pool=$PoolId `
  --format="yaml(name,attributeMapping,attributeCondition)"
```

Check the displayed condition before merging into `develop`. The existing
`roles/iam.workloadIdentityUser` binding remains in place. No service-account
JSON key is created or downloaded.

## 4. Verify existing runtime secrets and grants

`MONGODB_URI`, `JWT_SECRET`, `MONGODB_URI_STAGING`, `JWT_SECRET_STAGING`, both
identifier HMAC secrets, both R2 credential secrets, and `RESEND_API_KEY`
already exist. Staging and production have distinct database clusters, users,
URIs, JWT values, and runtime identities. The staging URI uses the database
name `/eqplus` inside its separate staging cluster; it is not a production URI.
Unsuffixed names are PRODUCTION; staging uses the explicitly suffixed database
and JWT secrets.
The Resend key and sender are intentionally shared across the two environments.

Inspect metadata and IAM policies without reading secret values:

```powershell
foreach ($SecretName in @("MONGODB_URI", "MONGODB_URI_STAGING", "JWT_SECRET", "JWT_SECRET_STAGING", "VENDOR_IDENTIFIER_HMAC_SECRET", "CLIENT_IDENTIFIER_HMAC_SECRET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "RESEND_API_KEY")) {
  gcloud secrets describe $SecretName --project=$ProjectId
  gcloud secrets get-iam-policy $SecretName --project=$ProjectId
}

gcloud secrets get-iam-policy MONGODB_URI_STAGING --project=$ProjectId
gcloud secrets get-iam-policy JWT_SECRET_STAGING --project=$ProjectId
gcloud secrets get-iam-policy VENDOR_IDENTIFIER_HMAC_SECRET --project=$ProjectId
gcloud secrets get-iam-policy CLIENT_IDENTIFIER_HMAC_SECRET --project=$ProjectId
gcloud secrets get-iam-policy RESEND_API_KEY --project=$ProjectId
```

`MONGODB_URI_STAGING` and `JWT_SECRET_STAGING` must grant only the staging
runtime; unsuffixed database and JWT secrets must grant only production.
`RESEND_API_KEY` must grant both runtime identities. The shared HMAC and R2
secrets have the previously configured per-runtime access. Rotating either
identifier HMAC secret affects `countryIdentifiers.lookupDigest`: it requires
recomputing every digest and rebuilding that index as a coordinated migration;
changing only the secret value is unsafe.

### 4.1 Existing isolated Atlas staging database

The staging Atlas project, cluster, SCRAM user `eqplus-staging-app`, static NAT
IP allowlist, and `/eqplus` database already exist. Isolation comes from the
separate Atlas project and cluster, credentials, and runtime identity; the
database name can therefore match production without sharing data. Do not
change the working URI, user, database name, or network rules to match an old
runbook example. Never copy production users, documents, or OTP/session data
into staging.

### 4.2 Verify staging schema and index parity

The committed migrations were already run against staging. Do not rerun them
for this workflow change. Check migration status only if investigating drift,
using the existing `db:migrate:status` command with the staging URI supplied
transiently; do not save the URI in a repository file.

Index parity is not a blocker for this application-testing rollout. It is a
separately tracked migration-safety issue: production was created app-first and
staging migrations-first, so Mongoose-created and migration-created indexes may
have equivalent definitions with different names. Until index ownership and
names are reconciled, staging is not a valid rehearsal for migrations.

The follow-up must set `autoIndex: false` in deployed environments while
retaining it locally and in tests. It must then use a reviewed, idempotent,
name-aware `migrate-mongo` migration to reconcile indexes by key definition
and repair its `down` path. Never use `syncIndexes()` or manually change a
production index in Atlas. Production migrations remain separately
approval-gated.



## 5. Verify runtime origins and repository variables

`CORS_ORIGINS` is not a Secret Manager secret. The workflow sets the complete
non-secret Cloud Run environment-variable group:

- `eqplus-api-staging`: `CORS_ORIGINS=http://localhost:3000,https://staging.plus.eqourse.com`
- `eqplus-api`: `CORS_ORIGINS=https://plus.eqourse.com`

The staging web origin and its GoDaddy CNAME are already complete. The API
parses the comma-separated CORS value into two exact origins. Because gcloud
also uses commas to separate `--set-env-vars` assignments, the staging deploy
uses a semicolon delimiter (`^;^`) so both the CORS comma and the sender's `@`
sign remain inside their values.
`--set-env-vars` replaces the service's complete plain-variable group; keep
the workflow list complete when adding another variable.

`GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`, and
`OTP_EMAIL_FROM` are existing GitHub repository variables. Verify their
presence without replacing them:

```powershell
gh variable list --repo $GitHubRepository
```

Do not create a `GCP_CREDENTIALS` secret or upload a JSON service-account key.

## 6. Verify the existing GitHub `production` approval environment

The protected `production` environment already exists and its required-reviewer
gate works. Confirm that the reviewers remain configured before the first
`main` release; do not create another environment. The workflow's production
job continues to declare `environment: production`.

### 6.1 Use reviewed PRs and a merge commit for releases

Require reviewed PRs and the `Lint, test, and build` check for both protected
branches, and block direct pushes to `main`. Squash feature-to-develop PRs as
usual. After the `develop` push has passed staging deployment and health, open
a reviewed PR with base `main` and head `develop`. For that release PR, choose
**Create a merge commit**. Do not squash or rebase that specific PR: production
resolves the tested `develop` source as `HEAD^2` of the resulting merge commit.
This is a release-merge discipline, not a repository-wide ban on squash merges.

The `main` workflow fails closed if the merge has the wrong parent shape, the
second parent is not the current `develop` tip, the staging run failed, or the
staging image digest differs. After approval and successful production health,
it pushes an annotated UTC `prod-YYYYMMDD-HHMM` tag on the `main` merge commit.
The production job needs `contents: write` to push it; repository tag rules
must allow GitHub Actions to create `prod-*` tags.

## 7. Pre-merge verification

Run these while the PR is still open:

```powershell
gcloud artifacts repositories describe $ArtifactRepository `
  --project=$ProjectId `
  --location=$Region

gcloud iam workload-identity-pools providers describe $ProviderId `
  --project=$ProjectId `
  --location=global `
  --workload-identity-pool=$PoolId `
  --format="yaml(name,attributeMapping,attributeCondition)"

gcloud secrets describe MONGODB_URI_STAGING --project=$ProjectId
gcloud secrets describe MONGODB_URI --project=$ProjectId
gcloud secrets describe JWT_SECRET_STAGING --project=$ProjectId
gcloud secrets describe JWT_SECRET --project=$ProjectId
gcloud secrets describe VENDOR_IDENTIFIER_HMAC_SECRET --project=$ProjectId
gcloud secrets describe CLIENT_IDENTIFIER_HMAC_SECRET --project=$ProjectId
gcloud secrets describe RESEND_API_KEY --project=$ProjectId

foreach ($SecretName in @("MONGODB_URI_STAGING", "MONGODB_URI", "JWT_SECRET_STAGING", "JWT_SECRET", "RESEND_API_KEY")) {
  gcloud secrets get-iam-policy $SecretName --project=$ProjectId
}

gh variable list --repo $GitHubRepository
```

Confirm each database and JWT policy grants `roles/secretmanager.secretAccessor`
only to its matching runtime identity, and `RESEND_API_KEY` grants both runtimes.
Confirm the existing JWT secrets have enabled versions without displaying values.
Do not grant the deployment identity access to any runtime secret.

Confirm WIF includes `develop` and `main`, GitHub's `production` environment
shows at least one required reviewer, and the branch rules in Section 6.1 are
configured. Only then merge the PR into `develop`.

## 8. Post-merge acceptance verification

The `develop` push staging job builds and pushes the commit-SHA image, deploys
`eqplus-api-staging` in `asia-south1` with `min-instances=0`, public invocation,
`CORS_ORIGINS=http://localhost:3000,https://staging.plus.eqourse.com` as
non-secret runtime configuration, `MAILER_PROVIDER=resend` with the existing
`OTP_EMAIL_FROM` sender and `RESEND_API_KEY` secret,
Secret Manager injection from `MONGODB_URI_STAGING` and `JWT_SECRET_STAGING`
into the corresponding runtime variables, and shared
`VENDOR_IDENTIFIER_HMAC_SECRET` and `CLIENT_IDENTIFIER_HMAC_SECRET`, plus HTTP
startup/liveness probes. It then
calls `/health` and fails if the endpoint does not return a successful response.
Production receives
`CORS_ORIGINS=https://plus.eqourse.com` and the unsuffixed production secrets
`MONGODB_URI` and `JWT_SECRET` only after manual approval.

After staging succeeds, merge the reviewed `develop` to `main` PR. The `main`
workflow runs its own lint, test, and build checks; `Deploy production API`
then waits for approval. Approve it only when you intend to promote the exact
staging image, without a rebuild. Verify the resulting `prod-*` annotated tag
points to the `main` merge commit after production `/health` succeeds.

Verify staging independently:

```powershell
$StagingUrl = gcloud run services describe eqplus-api-staging `
  --project=$ProjectId `
  --region=$Region `
  --format="value(status.url)"

$StagingUrl
Invoke-WebRequest -Uri "$StagingUrl/health" -UseBasicParsing

gcloud run services describe eqplus-api-staging `
  --project=$ProjectId `
  --region=$Region `
  --format="yaml(spec.template.metadata.annotations,spec.template.spec.containers[0].startupProbe,spec.template.spec.containers[0].livenessProbe,status.url)"
```

The request must return HTTP 200 with `{"status":"ok"}`.

## 9. Configure the Vercel Production web environment

The `eqourseplus-web` Vercel project requires all three of these variables in
the **Production** environment:

| Variable | Production value | Read by | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | The Cloud Run production URL | Browser code, inlined at build time | Used only for direct `register/request` and `otp/request` calls so the API receives the real client's device-fingerprint inputs |
| `API_URL` | The same Cloud Run production URL | Next.js server only, at runtime | `apiFetch` calls from every `/api/auth/*` Route Handler |
| `APP_URL` | `https://plus.eqourse.com` | Next.js server only, at runtime | Exact-origin allow-list for CSRF validation |

Create these as Vercel **Config**, not Secret, values. They are public URLs, and
`NEXT_PUBLIC_*` values are intentionally compiled into the browser bundle. Keep
the localhost values in `.env.example` as development defaults; production
values live in the Vercel Production environment.

Enter every value with **no trailing slash**. The API's `CORS_ORIGINS` check and
the web CSRF check compare exact origins, so a trailing slash fails the match.

`NEXT_PUBLIC_*` variables are inlined at build time. Adding
`NEXT_PUBLIC_API_URL` and choosing Vercel's **Redeploy** action on an existing
deployment does not re-inline the value, even when the build cache is disabled.
A fresh git-triggered build is required. `API_URL` and `APP_URL` are read at
runtime and take effect immediately.

## 10. Verify existing Resend delivery in both environments

Resend, the production sender stored in `OTP_EMAIL_FROM`, and the
`RESEND_API_KEY` Secret Manager value are already configured. The staging
runtime has already been granted `roles/secretmanager.secretAccessor` on that
same key; the GoDaddy CNAME and sender DNS setup are already complete. Do not
create another key, repeat DNS changes, or change the working sender.

Both API deploy jobs set `MAILER_PROVIDER=resend`, inject `RESEND_API_KEY`, and
set `OTP_EMAIL_FROM` to the existing verified production sender. Both jobs
fail fast when the sender variable is absent. The SMS adapter remains
sandboxed. Confirm the staging key grant with the read-only policy check in
Section 4, then send any staging email test only to a controlled company inbox.
