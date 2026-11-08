# GCP exit runbook

Operational record and runbook, dated **7 November 2026**. This does not amend `SPEC.md`. The entire GCP account is being closed, so the API move is forced rather than cost-driven. For context, eqplus itself ran at roughly ₹584/week; approximately 99.5% of the ₹130,221 November bill was Vertex AI in the separate `tutrain-automation` project, since shut off.

## Current inventory

The following inventory was verified in the live consoles on 7 November 2026.

| Location | Inventory |
| --- | --- |
| GCP `eqplus-503212`, `asia-south1` | Cloud Run services `eqplus-api` and `eqplus-api-staging`, one instance each; Cloud Run jobs `eqplus-db-migrate-production-apply`, `eqplus-db-migrate-production-seed`, `eqplus-db-migrate-production-status`, `eqplus-db-migrate-staging-apply`, and `eqplus-db-migrate-staging-seed`; Artifact Registry `asia-south1-docker.pkg.dev/eqplus-503212/eqplus-api`; 12 Secret Manager secrets. |
| GCP identities and network | Service accounts `github-eqplus-deployer@`, `eqplus-migrator@`, `eqplus-api-runtime@`, and `eqplus-api-staging-runtime@`; Workload Identity Federation provider `projects/48495065742/locations/global/workloadIdentityPools/github-actions/providers/eqourseplus`; VPC and NAT with static egress IP `8.234.113.251`, allowlisted in both Atlas projects. |
| AWS account `284874841026` (eQOURSE-PTE), `ap-south-1` | VPC `vpc-0130bb1228abe0de0`; NAT `nat-0c24ad2e21e70417d`; elastic IP `13.207.125.34`, already allowlisted in both Atlas projects; ECR repository `eqplus-api` with lifecycle policy; two scoped OIDC deploy roles; 18 SSM SecureString parameters written 24 October 2026. The $10,000 AWS Activate credit expires 31 October 2028. |

MongoDB Atlas, Cloudflare R2, Vercel, Resend, Sentry, VergeCloud, and Cashfree are unaffected because they are not in GCP.

## Secret inventory and parity risk

The nine SSM names below exist under both `/eqplus/staging/` and `/eqplus/production/`: **9 × 2 = 18 parameters**.

```text
MONGODB_URI · MONGODB_URI_MIGRATOR · JWT_SECRET
VENDOR_IDENTIFIER_HMAC_SECRET · CLIENT_IDENTIFIER_HMAC_SECRET
RESEND_API_KEY · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY · SENTRY_DSN
```

GCP has 12 secrets carrying the same material: `JWT_SECRET` / `JWT_SECRET_STAGING`, `MONGODB_URI` / `MONGODB_URI_STAGING`, `MONGODB_URI_MIGRATOR` / `MONGODB_URI_MIGRATOR_STAGING`, and the other six names shared across both environments. **Correction:** There are no separately named Atlas-hostname parameters. An earlier internal note claimed four; it was wrong. Cluster hostnames live inside the `MONGODB_URI*` connection strings.

The SSM copies were taken on 24 October 2026. A GCP secret version added after that date could make its SSM copy stale and silently break production after cutover. A0 cross-store parity must close this risk before C2.

**No rotation during migration:** reuse every value. Rotating `JWT_SECRET` signs out every user mid-migration; rotating either identifier HMAC secret breaks matching of existing company identifiers.

## Vercel cutover and cached browsers

Vercel project `eqourseplus-web` serves production from `main` at `plus.eqourse.com` and preview at `staging.plus.eqourse.com`. It has two distinct API URL variables:

- `API_URL` is server-side. Change it and redeploy for it to take effect immediately.
- `NEXT_PUBLIC_API_URL` is compiled into the browser bundle. Per FR-REG-02A, the browser uses it to call `register/request` and `otp/request` directly.

After cutover, a browser holding a cached bundle continues calling the old Cloud Run URL. VergeCloud's CDN caching in front of Vercel lengthens that window. **Cloud Run services must not be deleted at cutover.** Scale both to `min-instances=0` so the old endpoint remains available at near-zero idle cost. Delete only after Sentry shows no traffic against the Cloud Run hostname.

## Phased exit

| Step | Action and evidence |
| --- | --- |
| A0 | Secret inventory **DONE**; run cross-store parity as described below and record `OK` for all 18 comparisons. |
| A1 | CI pushes images to ECR through the existing OIDC role; retain the GCP push for rollback. |
| A2 | Build ECS cluster, staging service, ALB, and ACM certificate; inject SSM parameters through the task-definition `secrets` block; send egress through NAT so Atlas sees `13.207.125.34`. |
| A3 | Replace the Cloud Run migration Job with a one-off ECS task. Retain the environment approval gate; production must still fail closed without `MONGODB_MIGRATION_URI`; `auditLogs` stays append-only. Current CI maps staging `action=status` to `apply`; deliberately preserve or fix this behavior in A3. |
| B1 | Point the staging hostname at the ALB. Smoke-test registration, OTP, sign-in, profile save, R2 upload, and the verifier console. |
| B2 | Run migration `status`, then two idempotent `apply` runs from the ECS task. |
| B3 | Confirm Atlas connections from `13.207.125.34`. |
| C1 | Deploy a healthy production ECS service without sending traffic to it. |
| C2 | Cut over by changing Vercel environment variables and redeploying, **not** by changing DNS. Requires A0 parity = `OK`. |
| C3 | Soak for 72 hours; watch Sentry, ALB target health, and Atlas connection counts. |
| D1 | Export anything that exists only in GCP, including Cloud Logging history and any Cloud Storage data. |
| D2 | Remove `8.234.113.251` from both Atlas IP access lists, then update every repository and `SPEC.md` reference to `13.207.125.34`. Do not remove it early: that would take production down. |
| D3 | Delete Cloud Run jobs, Artifact Registry images, service accounts, and the WIF provider. Scale both Cloud Run services to `min-instances=0` rather than deleting them. |
| D4 | Delete the GCP project only after Sentry shows no Cloud Run hostname traffic and explicit sign-off is recorded. |

**A0 parity gates C2 and all of Phase D only. It does not gate A1, A2, A3, or Phase B; none of those steps reads or moves a secret value.**

## Verifying secret parity

With read access to GCP Secret Manager and AWS SSM, and the active project, account, and region set to those in the inventory, run from the repository root:

```bash
./scripts/verify-secret-parity.sh
```

The script is read-only. It prints one verdict per environment/name comparison (`OK`, `MISMATCH`, or `ERROR` with a short reason), the GCP version number when available (`gcp v?` otherwise), and a final count. No value is printed or saved. A nonzero exit means at least one comparison needs investigation; record all 18 `OK` verdicts before C2 or any Phase D action.

Run the checker **twice**: once now and again immediately before C2. A GCP secret updated between those runs would otherwise go unnoticed. On a `MISMATCH`, **GCP Secret Manager is authoritative** because it is what production currently runs against. Reconcile by copying the GCP value into SSM, never the reverse, and never by rotating. Keep values out of logs and the repository.
