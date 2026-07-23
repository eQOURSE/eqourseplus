# FR-FND-06 observability setup

The application and CI tests do not require a live Sentry DSN. Both SDKs are
disabled when their environment variable is absent.

## API — optional Secret Manager activation

Cloud Run rejects a revision that references a Secret Manager secret which does
not exist. For that reason, the deployment workflow leaves Sentry disabled
unless the non-secret GitHub repository variable
`ENABLE_SENTRY_DSN_SECRET` is exactly `true`.

Create the API DSN secret without putting its value in chat, shell history, or a
repository file. Paste only the raw DSN into stdin:

```powershell
gcloud secrets create SENTRY_DSN --replication-policy=automatic --data-file=- `
  --project=eqplus-503212
```

Grant the existing Cloud Run runtime identity access:

```powershell
gcloud secrets add-iam-policy-binding SENTRY_DSN `
  --project=eqplus-503212 `
  --member="serviceAccount:eqplus-api-runtime@eqplus-503212.iam.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

Verify the secret metadata without reading its value, then enable the optional
workflow step:

```powershell
gcloud secrets describe SENTRY_DSN --project=eqplus-503212
gh variable set ENABLE_SENTRY_DSN_SECRET `
  --repo eQOURSE/eqourseplus `
  --body true
```

On the next main deployment, the workflow adds
`SENTRY_DSN=SENTRY_DSN:latest` to both `eqplus-api-staging` and `eqplus-api`.
If the secret has not been created yet, leave the repository variable absent;
Cloud Run deployment continues normally and Sentry remains disabled.

## Web — Vercel environment

Set `NEXT_PUBLIC_SENTRY_DSN` in the Vercel project settings for Preview and
Production. This variable is intentionally browser-exposed: a Sentry DSN is a
public ingestion identifier, not an account credential. Keep the value out of
the repository and chat even though it is public by design.

Do not add a live DSN to GitHub Actions. The test suite uses a fake DSN with a
local transport (API) and a mocked capture boundary (web), so CI makes no
requests to Sentry.
