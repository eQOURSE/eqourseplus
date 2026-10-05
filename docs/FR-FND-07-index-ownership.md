# FR-FND-07 index ownership rollout

This rollout follows [SPEC.md](../SPEC.md) §19.2 and FR-FND-07. Do not merge
the runtime change into `develop` until the staging role split is verified;
do not promote it to `main` until the production role split is verified.

## Current Atlas state (reported prerequisite state, 2026-10-03)

- The dev project has `api-dev` with the broad development role, while the
  deployed `eqplus-app` runtime role is restricted. FR-FND-07 includes replacing
  the broad `api-dev` role before FR-REG-07A; the FR-TST-01 `tests`,
  `testAttempts` and `collMod` role addition is intentionally separate.
- The staging and production projects have distinct `eqplus-migrator`
  principals with the reviewed migration permissions. Secret Manager contains
  `MONGODB_URI_MIGRATOR_STAGING` and `MONGODB_URI_MIGRATOR`.
- The two clusters have different names for four `users` indexes with the
  same observed key patterns. The Atlas connector exposes names and keys but
  not the complete `unique`, `sparse`, partial-filter, collation and TTL
  options, so its output alone is insufficient for the parity gate.

## Required sequence

1. Capture `db.<collection>.getIndexes()` for each application collection
   in both clusters, including `_id_`, and retain the complete manifests for
   review and rollback. Compare names, key order and all index options.
2. Provision a distinct migration principal in each Atlas project. Give it
   the reviewed index-management permissions from FR-FND-07 and only the
   collection data and `migrate-mongo` changelog/lock permissions needed by
   committed migrations. It must not update or remove `auditLogs`.
3. Remove database-wide grants and index permissions from the staging and
   production application runtime principals, and replace the broad `api-dev`
   development role with the FR-FND-07-restricted role before FR-REG-07A.
   Verify their effective roles,
   including the absence of inherited broad privileges. Retain `FIND` and
   `INSERT`, but no `UPDATE` or `REMOVE`, on `auditLogs`.
4. Store each migration URI as a separate managed secret. Make it available
   only to the trusted migration operator or job. Never inject it into a
   Cloud Run API service, save it in the repository, or print it in logs.
5. Deploy the API change that sets `autoIndex: false` under `NODE_ENV=production`.
   Confirm application startup creates no index and normal reads/writes work.
6. Only then run the reviewed name-reconciliation migration on staging with
   `NODE_ENV=production` and `MONGODB_MIGRATION_URI` set to the staging
   migration credential. Set `INDEX_RECONCILIATION_BASELINE_PATH` to a new,
   absolute path outside the repository and retain the generated file for
   rollback. Use a different file for production. Pause application writes
   before any unique index is dropped and only then set
   `INDEX_RECONCILIATION_WRITES_PAUSED=true`; keep writes paused until the
   replacement is built and the complete manifest is verified. The migration
   refuses missing or unexpected options and refuses rollback without its
   original per-cluster baseline file. Confirm complete manifest parity and
   migration idempotence before the separately approved production run.

The repeatable live acceptance run is `.github/workflows/ci.yml`'s
`workflow_dispatch` `database-migrate` job. Choose `staging` twice; each run
deploys a one-shot Cloud Run Job with `--vpc-egress=all-traffic`, injects the
staging migrator secret inside Cloud Run, and waits for the terminal execution
status. Choose `production` only after reviewer approval; it injects the
production migrator secret and runs `db:migrate:status` only. The workflow uses
the repository variable `GCP_MIGRATION_SERVICE_ACCOUNT` for the Cloud Run Job
execution identity. Its value must be
`eqplus-migrator@eqplus-503212.iam.gserviceaccount.com`.

The IAM contract is explicit: `github-eqplus-deployer@eqplus-503212.iam.gserviceaccount.com`
has `roles/run.admin` on project `eqplus-503212` for Cloud Run Job deployment
and execution, plus `roles/iam.serviceAccountUser` on the migration identity
for `actAs`; the migration identity has
`roles/secretmanager.secretAccessor` on
`MONGODB_URI_MIGRATOR_STAGING` and `MONGODB_URI_MIGRATOR` only. The staging
dispatch reads `MONGODB_URI_MIGRATOR_STAGING`; the production dispatch reads
`MONGODB_URI_MIGRATOR` and runs status only. The URI never enters the GitHub
runner.

The existing `MONGODB_URI` remains the API runtime credential. Local
development and tests may still use it with `autoIndex: true`. A deployed
migration command fails closed without `MONGODB_MIGRATION_URI`.
