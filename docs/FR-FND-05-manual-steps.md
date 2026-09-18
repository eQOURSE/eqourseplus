# FR-FND-05 manual deployment setup

These commands configure the one-time Google Cloud and GitHub prerequisites for
the FR-FND-05 API pipeline. They do not deploy to Vercel or Utho.

## Execution order — do this before merging

**Run every step in Sections 1–6 while the PR is still open, before merging it
to `main`.** The staging workflow fires on the merge itself, so Artifact
Registry, both service accounts, Workload Identity Federation, `MONGODB_URI`,
`JWT_SECRET`, `VENDOR_IDENTIFIER_HMAC_SECRET`, `CLIENT_IDENTIFIER_HMAC_SECRET`, the per-service `CORS_ORIGINS`
values, the GitHub repository variables, the stable Vercel preview configuration,
and the protected `production`
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
$RuntimeServiceAccountId = "eqplus-api-runtime"
$GitHubRepository = "eQOURSE/eqourseplus"

gcloud config set project $ProjectId
$ProjectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$DeployServiceAccount = "$DeployServiceAccountId@$ProjectId.iam.gserviceaccount.com"
$RuntimeServiceAccount = "$RuntimeServiceAccountId@$ProjectId.iam.gserviceaccount.com"
```

The project must print a non-empty numeric project number before continuing:

```powershell
$ProjectNumber
```

## 2. Create Artifact Registry and the two service accounts

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

gcloud iam service-accounts create $RuntimeServiceAccountId `
  --project=$ProjectId `
  --display-name="Cloud Run runtime for eQOURSE+ API"
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

gcloud iam service-accounts add-iam-policy-binding $RuntimeServiceAccount `
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

First, create the database secret using the complete connection string without
an `MONGODB_URI=` prefix or surrounding quotes:

```powershell
gcloud secrets create MONGODB_URI --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

Next, create the JWT signing secret using a password-manager-generated random
value of at least 32 characters, without a `JWT_SECRET=` prefix or surrounding
quotes:

```powershell
gcloud secrets create JWT_SECRET --replication-policy=automatic --data-file=- `
  --project=$ProjectId
```

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

Grant only the Cloud Run runtime identity access to these four secrets:

```powershell
gcloud secrets add-iam-policy-binding MONGODB_URI `
  --project=$ProjectId `
  --member="serviceAccount:$RuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET `
  --project=$ProjectId `
  --member="serviceAccount:$RuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding VENDOR_IDENTIFIER_HMAC_SECRET `
  --project=$ProjectId `
  --member="serviceAccount:$RuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding CLIENT_IDENTIFIER_HMAC_SECRET `
  --project=$ProjectId `
  --member="serviceAccount:$RuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"
```

Per SPEC.md Section 20.1, the development-only Atlas cluster must permit the
Cloud Run connection using the documented temporary `0.0.0.0/0` decision,
SCRAM least-privilege credentials, and TLS. Never apply that rule to a cluster
holding real user data.

## 5. Confirm the non-secret runtime configuration and set repository variables

`CORS_ORIGINS` is not a Secret Manager secret. It is required runtime
configuration that the workflow sets directly on each service with
`--set-env-vars`:

- `eqplus-api-staging`: `http://localhost:3000,https://preview.plus.eqourse.com`
- `eqplus-api`: `https://plus.eqourse.com`

The workflow now expands staging to the exact allow-list
`http://localhost:3000,https://preview.plus.eqourse.com`. The custom preview
origin is deliberately singular. Never replace it with `*.vercel.app`: that
would let a deployment owned by any Vercel customer call the staging API from a
browser. Raw per-branch Vercel URLs remain unable to make the direct
registration and OTP-request calls; use the stable preview origin for those
checks.

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

### Configure the stable Vercel preview as code-managed state

The workflow manages Preview environment variables and points the one stable
preview domain at the current same-repository pull-request branch. It refuses
fork pull requests because repository secrets are never exposed to them. Set
the following prerequisites once; do not duplicate these values by clicking
them into the Vercel dashboard.

Create a company-owned Vercel access token scoped to the `tutrain's projects`
team, then store it directly in GitHub without putting it in a file or chat:

```powershell
gh secret set VERCEL_TOKEN --repo $GitHubRepository
```

Record the non-secret Vercel identifiers as repository variables:

```powershell
gh variable set VERCEL_PROJECT_ID `
  --repo $GitHubRepository `
  --body "prj_kNnnDCw49iOD9vyh5QQXMMuZhvGd"

gh variable set VERCEL_TEAM_ID `
  --repo $GitHubRepository `
  --body "team_nxAn0lKroRlgvXWUt3fg07SR"
```

Add `preview.plus.eqourse.com` to the `eqourseplus-web` Vercel project using
the Vercel CLI, then inspect the required DNS value:

```powershell
vercel domains add preview.plus.eqourse.com eqourseplus-web `
  --scope "tutrains-projects"
vercel domains inspect preview.plus.eqourse.com `
  --scope "tutrains-projects"
```

At the authoritative GoDaddy zone, add only the exact CNAME Vercel reports.
Never replace or delete an existing record. Re-run `vercel domains inspect`
until the domain and certificate are valid. The pull-request workflow then uses
Vercel's API to assign that domain to `${{ github.head_ref }}`; no dashboard
branch assignment is required.

For every same-repository pull request, the `Configure stable Vercel preview`
job upserts these Preview-scoped variables:

| Variable | Preview value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://eqplus-api-staging-48495065742.asia-south1.run.app` |
| `API_URL` | `https://eqplus-api-staging-48495065742.asia-south1.run.app` |
| `APP_URL` | `https://preview.plus.eqourse.com` |

`NEXT_PUBLIC_API_URL` serves only the two direct browser request endpoints;
`API_URL` supplies the same-origin Next.js handlers; and `APP_URL` pins their
CSRF origin. None points at production. Because `NEXT_PUBLIC_API_URL` is
compiled into the client bundle, the first run that creates these variables
must be followed by a new git-triggered preview build. A dashboard redeploy is
not an acceptable substitute.

There is intentionally only one shared stable preview. When multiple internal
pull requests run concurrently, the most recently successful configuration job
owns `preview.plus.eqourse.com`; do not conduct two human preview walkthroughs
at once.

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

gcloud secrets describe MONGODB_URI --project=$ProjectId
gcloud secrets describe JWT_SECRET --project=$ProjectId
gcloud secrets describe VENDOR_IDENTIFIER_HMAC_SECRET --project=$ProjectId
gcloud secrets describe CLIENT_IDENTIFIER_HMAC_SECRET --project=$ProjectId

gh variable list --repo $GitHubRepository
```

Confirm in GitHub that the `production` environment shows at least one required
reviewer. Only then merge the PR.

## 8. Post-merge acceptance verification

The staging job builds and pushes the commit-SHA image, deploys
`eqplus-api-staging` in `asia-south1` with `min-instances=0`, public invocation,
`CORS_ORIGINS=http://localhost:3000,https://preview.plus.eqourse.com` as
non-secret runtime configuration,
Secret Manager injection for `MONGODB_URI`, `JWT_SECRET`, and
`VENDOR_IDENTIFIER_HMAC_SECRET`, `CLIENT_IDENTIFIER_HMAC_SECRET`, plus HTTP startup/liveness probes. It then
calls `/health` and fails if the endpoint does not return a successful response.
Production receives
`CORS_ORIGINS=https://plus.eqourse.com` only after manual approval.

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

Preview values are not configured here or in the dashboard. Section 5 and the
`Configure stable Vercel preview` workflow job are their source of truth.

### Staging sandbox-mailer limitation

The staging API still uses the sandbox mailer. It keeps generated OTPs only in
memory and exposes no retrieval surface, so a human can exercise the preview's
request path but cannot complete sign-in. Do not point Preview at the production
API to work around this. The available policy choices and their costs must be
decided separately before changing the staging mailer.

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
  --member="serviceAccount:$RuntimeServiceAccount" `
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
