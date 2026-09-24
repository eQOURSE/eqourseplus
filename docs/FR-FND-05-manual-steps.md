# FR-FND-05 manual deployment setup

These commands configure the one-time Google Cloud and GitHub prerequisites for
the FR-FND-05 API pipeline. They do not deploy to Vercel or Utho.

## Execution order — do this before merging

**Run every step in Sections 1–6 while the PR is still open, before merging it
to `main`.** The staging workflow fires on the merge itself, so Artifact
Registry, all three service accounts, Workload Identity Federation,
`MONGODB_URI_STAGING`, `MONGODB_URI_PRODUCTION`,
`JWT_SECRET_STAGING`, `JWT_SECRET_PRODUCTION`, `VENDOR_IDENTIFIER_HMAC_SECRET`, `CLIENT_IDENTIFIER_HMAC_SECRET`, the per-service `CORS_ORIGINS`
values, the GitHub repository variables, and the protected `production`
environment must already exist. Before enabling real email delivery, also
complete Section 10 without changing any existing company-mail DNS record.

Run the following commands in PowerShell from a terminal where `gcloud` is
authenticated as a project IAM administrator. The GitHub CLI commands also
require an authenticated `gh` session with repository administration access.

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

## 2. Create Artifact Registry and the three service accounts

The deploy identity and Cloud Run runtime identity are deliberately separate.
The running API therefore cannot push images or administer Cloud Run.

```powershell
gcloud artifacts repositories create $ArtifactRepository `
  --project=$ProjectId `
  --location=$Region `
  --repository-format=docker `
  --description="eQOURSE+ API images"

gcloud iam service-accounts create $DeployServiceAccountId `
  --project=$ProjectId `
  --display-name="GitHub deployer for eQOURSE+ API"

gcloud iam service-accounts create $StagingRuntimeServiceAccountId `
  --project=$ProjectId `
  --display-name="Staging runtime for eQOURSE+ API"

gcloud iam service-accounts create $ProductionRuntimeServiceAccountId `
  --project=$ProjectId `
  --display-name="Production runtime for eQOURSE+ API"
```

Grant only the deployment permissions needed by the workflow:

```powershell
gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:$DeployServiceAccount" `
  --role="roles/run.admin"

gcloud artifacts repositories add-iam-policy-binding $ArtifactRepository `
  --project=$ProjectId `
  --location=$Region `
  --member="serviceAccount:$DeployServiceAccount" `
  --role="roles/artifactregistry.writer"

gcloud iam service-accounts add-iam-policy-binding $StagingRuntimeServiceAccount `
  --project=$ProjectId `
  --member="serviceAccount:$DeployServiceAccount" `
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts add-iam-policy-binding $ProductionRuntimeServiceAccount `
  --project=$ProjectId `
  --member="serviceAccount:$DeployServiceAccount" `
  --role="roles/iam.serviceAccountUser"
```

## 3. Create the main-only GitHub Workload Identity Federation trust

The provider accepts tokens only when all three claims match:

- repository owner is `eQOURSE`;
- repository is exactly `eQOURSE/eqourseplus`;
- Git ref is exactly `refs/heads/main`.

Tokens from forks, pull-request refs, tags, and arbitrary branches are rejected
by the provider before service-account impersonation is considered.

```powershell
gcloud iam workload-identity-pools create $PoolId `
  --project=$ProjectId `
  --location=global `
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc $ProviderId `
  --project=$ProjectId `
  --location=global `
  --workload-identity-pool=$PoolId `
  --display-name="eQOURSE eqourseplus main" `
  --issuer-uri="https://token.actions.githubusercontent.com" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.ref=assertion.ref" `
  --attribute-condition="assertion.repository_owner=='eQOURSE' && assertion.repository=='eQOURSE/eqourseplus' && assertion.ref=='refs/heads/main'"

gcloud iam service-accounts add-iam-policy-binding $DeployServiceAccount `
  --project=$ProjectId `
  --role="roles/iam.workloadIdentityUser" `
  --member="principalSet://iam.googleapis.com/projects/$ProjectNumber/locations/global/workloadIdentityPools/$PoolId/attribute.repository/eQOURSE/eqourseplus"
```

No service-account key is created or downloaded.

## 4. Create runtime secrets without putting their values in chat or files

For each command below, paste the requested raw value directly into the terminal,
then send end-of-input. In Windows PowerShell, press Enter, then `Ctrl+Z`, then
Enter. In a Unix-like terminal, press Enter, then `Ctrl+D`.

The two Cloud Run services must never share a database credential. Create an
explicitly production-named secret and, at the secure prompt, paste the current
production connection string from the password manager or Atlas. Do not print
or copy it through chat, a ticket, source control, or shell history:

```powershell
gcloud secrets create MONGODB_URI_PRODUCTION --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

After completing the Atlas staging steps in Section 4.1, create the staging
secret by pasting its complete connection string, including the dedicated
`eqplus_staging` database name. Paste only the URI, with no `MONGODB_URI=` prefix
or surrounding quotes:

```powershell
gcloud secrets create MONGODB_URI_STAGING --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

Do not reuse the production URI, production database user, or production
database name in `MONGODB_URI_STAGING`.

Create distinct JWT signing values for staging and production. Generate each
independently in a password manager with at least 32 random characters; never
reuse a value across environments. Paste only the raw value at each secure
prompt, without a `JWT_SECRET=` prefix or surrounding quotes:

```powershell
gcloud secrets create JWT_SECRET_STAGING --replication-policy=automatic --data-file=- `
  --project=$ProjectId

gcloud secrets create JWT_SECRET_PRODUCTION --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

Each service receives its matching secret as the runtime `JWT_SECRET`. Existing
production sessions signed with the old shared value will stop validating if
`JWT_SECRET_PRODUCTION` contains a different value; plan for users to sign in
again after rollout. Keep the old generic `JWT_SECRET` temporarily for rollback
only and retire it after both services have been verified. Once rollback is no
longer needed, remove both runtime identities' accessor bindings on that old
secret and disable its versions.

Create `VENDOR_IDENTIFIER_HMAC_SECRET` in GCP Secret Manager using a
password-manager-generated random value of at least 32 characters. The API uses
it to create deterministic HMAC lookup digests for encrypted vendor country
identifiers. Paste only the raw value, without a
`VENDOR_IDENTIFIER_HMAC_SECRET=` prefix or surrounding quotes:

```powershell
gcloud secrets create VENDOR_IDENTIFIER_HMAC_SECRET --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

Rotating `VENDOR_IDENTIFIER_HMAC_SECRET` invalidates the
`countryIdentifiers.lookupDigest` uniqueness index. Per SPEC.md Section 19.2,
rotation requires recomputing every digest and rebuilding that index as one
coordinated migration; changing only the Secret Manager value is unsafe.

Create `CLIENT_IDENTIFIER_HMAC_SECRET` separately with a password-manager-generated
random value of at least 32 characters. Do not reuse the vendor value or put the
raw value in a file or chat:

```powershell
gcloud secrets create CLIENT_IDENTIFIER_HMAC_SECRET --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

Rotating `CLIENT_IDENTIFIER_HMAC_SECRET` invalidates the client
`countryIdentifiers.lookupDigest` uniqueness index. Recompute every client
digest and rebuild that index as one coordinated migration before changing the
runtime secret; changing only the Secret Manager value is unsafe.

Grant each database and JWT secret only to its matching Cloud Run runtime identity:

```powershell
gcloud secrets add-iam-policy-binding MONGODB_URI_STAGING `
  --project=$ProjectId `
  --member="serviceAccount:$StagingRuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding MONGODB_URI_PRODUCTION `
  --project=$ProjectId `
  --member="serviceAccount:$ProductionRuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET_STAGING `
  --project=$ProjectId `
  --member="serviceAccount:$StagingRuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET_PRODUCTION `
  --project=$ProjectId `
  --member="serviceAccount:$ProductionRuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"
```

Both runtime identities still need the shared identifier-HMAC and existing R2
credential secrets. Grant those common secrets to each identity without granting
either identity the other environment's database or JWT secret:

```powershell
foreach ($RuntimePrincipal in @($StagingRuntimeServiceAccount, $ProductionRuntimeServiceAccount)) {
  gcloud secrets add-iam-policy-binding VENDOR_IDENTIFIER_HMAC_SECRET `
    --project=$ProjectId `
    --member="serviceAccount:$RuntimePrincipal" `
    --role="roles/secretmanager.secretAccessor"

  gcloud secrets add-iam-policy-binding CLIENT_IDENTIFIER_HMAC_SECRET `
    --project=$ProjectId `
    --member="serviceAccount:$RuntimePrincipal" `
    --role="roles/secretmanager.secretAccessor"

  gcloud secrets add-iam-policy-binding R2_ACCESS_KEY_ID `
    --project=$ProjectId `
    --member="serviceAccount:$RuntimePrincipal" `
    --role="roles/secretmanager.secretAccessor"

  gcloud secrets add-iam-policy-binding R2_SECRET_ACCESS_KEY `
    --project=$ProjectId `
    --member="serviceAccount:$RuntimePrincipal" `
    --role="roles/secretmanager.secretAccessor"
}
```

### 4.1 Create the isolated Atlas staging database (Bhavesh)

Only an Atlas administrator can complete these steps. Do them before creating
`MONGODB_URI_STAGING` or merging this change:

1. In Atlas, create the separate `eqplus-staging` project and a staging
   deployment inside it. Do not place it in the production Atlas project.
   Choose the same cloud and nearest India
   region used by production to keep network behaviour representative.
2. In **Database & Network Access → Database Users**, create a distinct SCRAM
   database user named `eqplus-staging-api`. Give it the least privilege
   `readWrite` role on the `eqplus_staging` database only. It must have no role
   on the production database and must not reuse the production password.
3. In **Database & Network Access → IP Access List**, allow only the static
   public IP used by the GCP VPC/Cloud NAT path for `eqplus-api-staging`.
   Do not add `0.0.0.0/0` and do not allow a developer workstation permanently.
4. In **Connect → Drivers**, copy the TLS/SRV connection string for the staging
   user. Replace the password placeholder locally and make the path database
   name `/eqplus_staging` (before the query string). Do not paste it into chat,
   a ticket, source control, or shell history.
5. Create `MONGODB_URI_STAGING` from that URI using the secure prompt above.
   Keep the existing production data where it is: do not copy production data,
   company documents, bank details, users, or OTP/session records into staging.

The workflow maps each Secret Manager secret to the same runtime environment
variable name: staging receives `MONGODB_URI_STAGING` and `JWT_SECRET_STAGING`;
production receives `MONGODB_URI_PRODUCTION` and `JWT_SECRET_PRODUCTION`. The old
generic `MONGODB_URI` is retained temporarily for rollback only and may be
disabled after both services have been verified.

### 4.2 Create and verify the staging schema and index parity

Use a trusted local checkout of the exact commit being deployed. Supply each URI
only for the duration of its command; never save either URI in a repository
file. First run the committed migrations against staging twice—the second run
proves they are cleanly idempotent—and check status:

```powershell
$env:MONGODB_URI = gcloud secrets versions access latest --secret=MONGODB_URI_STAGING --project=$ProjectId
pnpm --filter @eqourse/api db:migrate
pnpm --filter @eqourse/api db:migrate
pnpm --filter @eqourse/api db:migrate:status
Remove-Item Env:MONGODB_URI
```

Run `db:migrate:status` against production as a read-only comparison. Do not run
a production migration from this setup task:

```powershell
$env:MONGODB_URI = gcloud secrets versions access latest --secret=MONGODB_URI_PRODUCTION --project=$ProjectId
pnpm --filter @eqourse/api db:migrate:status
Remove-Item Env:MONGODB_URI
```

After the first staging API revision has started, compare the effective index
manifests in Atlas Data Explorer. For every application collection shown in
production, run `db.<collection>.getIndexes()` in the Atlas mongosh for both
databases and compare the complete definitions: name, key order, `unique`,
`sparse`, partial filter, collation, and TTL. Include `_id_`; ignore only the
database name embedded in diagnostic output. The collection set and every index
definition must match.

If the comparison differs, stop. Add the missing or corrected index as a
reviewed `migrate-mongo` migration, apply it to staging, and compare again.
Never use `syncIndexes()` or manually drop a production index as a shortcut:
both can remove a live constraint, and a manual Atlas-only fix would drift from
the repository. Production migration remains separately approval-gated.

### 4.3 Skill taxonomy decision (not executed by this change)

The production database currently contains 3 taxonomy rows while the committed
FR-FND-03A seed contains 59. Do not clone those 3 production rows into staging,
and never make `db:seed` an automatic deploy or application-startup step.

Proposal: after index parity is green, run the existing idempotent `db:seed`
command on staging first, confirm exactly 59 unique slugs and exercise taxonomy
selection there. Export or otherwise record the current three-row production
state, then schedule that seed commit for production under explicit approval.
Because the seed upserts by slug and does not hard-delete rows, this
gives staging validation without silently mutating production. No seed command
is run or wired into CI by this PR.

## 5. Confirm the non-secret runtime configuration and set repository variables

`CORS_ORIGINS` is not a Secret Manager secret. It is required runtime
configuration that the workflow sets directly on each service with
`--set-env-vars`:

- `eqplus-api-staging`: `http://localhost:3000`
- `eqplus-api`: `https://plus.eqourse.com`

Staging is deliberately limited to the local web origin. Vercel preview URLs
cannot make browser-originated calls to the staging API until a stable preview
origin exists. The browser-originated registration and OTP-request endpoints
therefore cannot be exercised from per-branch previews.

`--set-env-vars` replaces the service's complete plain environment-variable
group. Before adding another plain variable outside this workflow, update the
workflow's complete list so a later deployment cannot remove it silently.

Get the full provider resource name and store it with the deploy service-account
email as GitHub repository variables:

```powershell
$WorkloadIdentityProvider = gcloud iam workload-identity-pools providers describe $ProviderId `
  --project=$ProjectId `
  --location=global `
  --workload-identity-pool=$PoolId `
  --format="value(name)"

gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER `
  --repo $GitHubRepository `
  --body $WorkloadIdentityProvider

gh variable set GCP_DEPLOY_SERVICE_ACCOUNT `
  --repo $GitHubRepository `
  --body $DeployServiceAccount
```

These identifiers are not secrets. Do not create a `GCP_CREDENTIALS` secret or
upload a JSON service-account key.

## 6. Create and protect the GitHub `production` environment

Before merging, open:

`https://github.com/eQOURSE/eqourseplus/settings/environments`

1. Select **New environment**, enter `production`, and configure it.
2. Enable **Required reviewers** and select the human approver(s).
3. Enable **Prevent self-review** if another approver is available.
4. Save the protection rules.

The workflow declares `environment: production`; the production job will remain
visibly waiting until a configured reviewer approves it. Merely allowing
GitHub to auto-create an unprotected environment would not satisfy FR-FND-05.

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
gcloud secrets describe MONGODB_URI_PRODUCTION --project=$ProjectId
gcloud secrets describe JWT_SECRET_STAGING --project=$ProjectId
gcloud secrets describe JWT_SECRET_PRODUCTION --project=$ProjectId
gcloud secrets describe VENDOR_IDENTIFIER_HMAC_SECRET --project=$ProjectId
gcloud secrets describe CLIENT_IDENTIFIER_HMAC_SECRET --project=$ProjectId

foreach ($SecretName in @("MONGODB_URI_STAGING", "MONGODB_URI_PRODUCTION", "JWT_SECRET_STAGING", "JWT_SECRET_PRODUCTION")) {
  gcloud secrets get-iam-policy $SecretName --project=$ProjectId
}

gh variable list --repo $GitHubRepository
```

Confirm each of the four secret policies grants `roles/secretmanager.secretAccessor`
only to its matching runtime identity. Confirm both JWT values are present as
enabled versions without displaying either value. Do not grant the deployment
identity access to any runtime secret.

Confirm in GitHub that the `production` environment shows at least one required
reviewer. Only then merge the PR.

## 8. Post-merge acceptance verification

The staging job builds and pushes the commit-SHA image, deploys
`eqplus-api-staging` in `asia-south1` with `min-instances=0`, public invocation,
`CORS_ORIGINS=http://localhost:3000` as non-secret runtime configuration,
Secret Manager injection from `MONGODB_URI_STAGING` and `JWT_SECRET_STAGING`
into the corresponding runtime variables, and shared
`VENDOR_IDENTIFIER_HMAC_SECRET` and `CLIENT_IDENTIFIER_HMAC_SECRET`, plus HTTP
startup/liveness probes. It then
calls `/health` and fails if the endpoint does not return a successful response.
Production receives
`CORS_ORIGINS=https://plus.eqourse.com` and the secrets
`MONGODB_URI_PRODUCTION` and `JWT_SECRET_PRODUCTION` only after manual approval.

After that succeeds, the `Deploy production API` job must be visibly waiting
for approval. Approve it only when you intend to promote that exact commit image.

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

## 10. Configure Resend email delivery

SPEC.md Section 20 approves Resend/SES for email delivery. The API deliberately
uses the in-memory sandbox mailer unless `MAILER_PROVIDER=resend` is configured.
The deployment workflow keeps staging on `sandbox` and configures production as
`resend`; production therefore fails at startup if its sender or API key is
missing instead of silently claiming to send an OTP.

### Create and verify the provider account

1. Create the Resend account under the company-owned login and enable account
   security controls offered by the provider.
2. In Resend, add the sending domain or dedicated sending subdomain that will be
   used by `OTP_EMAIL_FROM`.
3. Copy each DNS host, type and value from Resend exactly. Do not copy an API key
   into DNS, this repository, a shell history, a ticket, or chat.
4. Wait until Resend reports the domain verified before enabling the production
   provider.

### Add SPF, DKIM and DMARC safely in GoDaddy

The authoritative `eqourse.com` DNS zone is at GoDaddy. It is **add-only** and
already hosts the Google Workspace MX records for live company mail. Add the
provider-verification records; never replace, edit, or delete the Google
Workspace MX records or any unrelated existing record. A mistaken replacement
can stop company email. If a requested host already exists or GoDaddy proposes
replacing a record, stop and investigate instead of confirming the change.

Add or confirm all three authentication controls:

- **SPF:** add the exact Resend-supplied TXT record on its requested sending host.
  A hostname must not publish two SPF policies; if that host already has an SPF
  record, stop and resolve the collision rather than replacing it. A dedicated
  sending subdomain avoids modifying the root domain's mail policy.
- **DKIM:** add every Resend-supplied DKIM TXT or CNAME record with the exact
  selector, host and value. Do not reuse or replace Google Workspace selectors.
- **DMARC:** confirm that the organizational/sending domain has one DMARC TXT
  policy. If none exists, add a deliberate initial monitoring policy such as
  `v=DMARC1; p=none`; if one already exists, keep it and confirm alignment rather
  than creating a second policy. Tightening enforcement is a separate mail-admin
  decision after reviewing reports.

After propagation, verify SPF, DKIM and DMARC independently and confirm Resend's
domain page is green. Send a provider test only to a controlled company inbox;
do not use a real user's address for setup testing.

### Store runtime configuration

Create the Resend API key as a GCP Secret Manager secret by pasting only the raw
value at the secure prompt:

```powershell
gcloud secrets create RESEND_API_KEY --replication-policy=automatic --data-file=- `
  --project=$ProjectId

gcloud secrets add-iam-policy-binding RESEND_API_KEY `
  --project=$ProjectId `
  --member="serviceAccount:$ProductionRuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"
```

Store the verified sender as a non-secret GitHub repository variable. Use a
verified address without a comma in its display name because Cloud Run parses
comma-separated environment assignments:

```powershell
gh variable set OTP_EMAIL_FROM `
  --repo $GitHubRepository `
  --body "verified-sender-address-from-resend"

gcloud secrets describe RESEND_API_KEY --project=$ProjectId
gh variable get OTP_EMAIL_FROM --repo $GitHubRepository
```

The production deployment injects `RESEND_API_KEY` from Secret Manager and sets
`MAILER_PROVIDER=resend` plus `OTP_EMAIL_FROM`. Staging, local development and CI
remain on the sandbox adapter and require no provider credentials.
