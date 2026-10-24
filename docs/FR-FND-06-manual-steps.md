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

## Public-session alert: live Edge delivery gate before production

Before promoting FR-REG-02D (PR #138) and the FR-FND-06 follow-up (PR #139)
together, verify the deployed PR preview rather than relying on the mocked
`@sentry/nextjs` unit tests:

1. Open a marketing route such as `/about` on PR #139's authenticated Vercel
   preview. Set only disposable, invalid `__Host-eqourse-access` and
   `__Host-eqourse-refresh` cookies for that preview host. Use `Secure`,
   `HttpOnly`, and `Path=/`, with no `Domain`; never use a real session.
2. Reload the route once and verify the fail-closed, no-store 503 page. Record
   the actual `reason`: an invalid access token can yield session 401 followed
   by refresh 400, which correctly maps to `upstream_status`. A real
   `refresh_lost` requires an already rotated refresh token and is covered by
   the unit tests; it is not a live-preview requirement.
3. In Sentry's `javascript-nextjs` project, find the new `Public session
   resolution unavailable` event. Confirm `runtime=vercel-edge`,
   the actual `reason`, and `route_group=marketing`. Inspect its message,
   tags, breadcrumbs, and contexts for the absence of a `user` field, IP,
   geolocation, user ID, email, token, cookie value, full route, and query
   string. The Edge `beforeSend` privacy test must also pass.
4. Remove the disposable cookies. Record the event link and result in
   `PROGRESS.md`. Keep production promotion blocked until live event privacy
   and the Sentry alert with a 30-minute action throttle are verified.

## Production alert amendment

The original alert threshold was not actionable: the real incident volume was
two events in four days, so `>9 events in 5 minutes` could never fire. Replace
the old rule with these two named Sentry issue alerts:

| Project | Alert name | Query/environment | Trigger | Action throttle | Recipient |
| --- | --- | --- | --- | --- | --- |
| `javascript-nextjs` | `FR-FND-06 production public-session unavailable` | `environment:production` and the stable public-session issue fingerprint | more than 0 matching events in 1 hour | 30 minutes | `yobhauk@gmail.com` |
| `node-nestjs` | `FR-FND-06 production API error` | `environment:production` | more than 0 new error events in 1 hour | 30 minutes | `yobhauk@gmail.com` |

Do not leave either alert scoped to **All environments**. The web deployment
uses Vercel's `VERCEL_ENV`; the API deployment sets `SENTRY_ENVIRONMENT` to
`staging` or `production` explicitly. Preview and staging events must not
count toward the production rules.

After both rules are saved, trigger one real, production-safe application
error in each app and verify the corresponding issue and email. A Sentry test
event or a green DSN/configuration check is not delivery proof. Record the
issue links, event environment, timestamps, and email-delivery result in
`PROGRESS.md`; keep the FR open until both deliveries are confirmed.

Bhavesh owns any external mail forwarding beyond the configured Sentry
recipient.
