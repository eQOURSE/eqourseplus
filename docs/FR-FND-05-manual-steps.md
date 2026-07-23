# FR-FND-05 manual deployment setup

These commands configure the one-time Google Cloud and GitHub prerequisites for
the FR-FND-05 API pipeline. They do not deploy to Vercel or Utho.

## Execution order — do this before merging

**Run every step in Sections 1–6 while the PR is still open, before merging it
to `main`.** The staging workflow fires on the merge itself, so Artifact
Registry, both service accounts, Workload Identity Federation, `MONGODB_URI`,
`JWT_SECRET`, the GitHub repository variables, and the protected `production`
environment must already exist.

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

Grant only the Cloud Run runtime identity access to these two secrets:

```powershell
gcloud secrets add-iam-policy-binding MONGODB_URI `
  --project=$ProjectId `
  --member="serviceAccount:$RuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET `
  --project=$ProjectId `
  --member="serviceAccount:$RuntimeServiceAccount" `
  --role="roles/secretmanager.secretAccessor"
```

Per SPEC.md Section 20.1, the development-only Atlas cluster must permit the
Cloud Run connection using the documented temporary `0.0.0.0/0` decision,
SCRAM least-privilege credentials, and TLS. Never apply that rule to a cluster
holding real user data.

## 5. Set the non-secret GitHub repository variables

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

gcloud secrets describe MONGODB_URI --project=$ProjectId
gcloud secrets describe JWT_SECRET --project=$ProjectId

gh variable list --repo $GitHubRepository
```

Confirm in GitHub that the `production` environment shows at least one required
reviewer. Only then merge the PR.

## 8. Post-merge acceptance verification

The staging job builds and pushes the commit-SHA image, deploys
`eqplus-api-staging` in `asia-south1` with `min-instances=0`, public invocation,
Secret Manager injection for `MONGODB_URI` and `JWT_SECRET`, and HTTP
startup/liveness probes. It then calls `/health` and fails if the endpoint does
not return a successful response.

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
