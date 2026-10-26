# FR-FND-07 index ownership rollout

This rollout follows [SPEC.md](../SPEC.md) §19.2 and FR-FND-07. Do not merge
the runtime change into `develop` until the staging role split is verified;
do not promote it to `main` until the production role split is verified.

## Current Atlas state (direct review, 2026-10-26)

- In `eqplus-dev`, production `api-prod` uses custom role `eqplus-app` on
  `admin`. Its `auditLogs` privilege is already `find` + `insert` only; the
  sole reported violation is `createIndex`, which must be removed in place.
- In `eqplus-staging`, `eqplus-staging-app` still has
  `readWriteAnyDatabase@admin`; it must be replaced by `eqplus-app-staging`.
- Both project-local `eqplus-migrator` users and production-project `api-dev`
  still have broad `readWrite@eqplus`, which permits `update` and `remove` on
  `auditLogs`. The migrators must be replaced by `eqplus-migrator-role`.
- The repository references `api-dev` only in legacy `SETUP.md`, `HANDOFF.md`
  and this rollout document; no application code, workflow, deployed secret
  or connection configuration uses it. Its external use must be confirmed
  before the production-project user is removed.
- The staging and production projects have distinct `eqplus-migrator`
  principals. Secret Manager contains `MONGODB_URI_MIGRATOR_STAGING` and
  `MONGODB_URI_MIGRATOR`.
- The two clusters have different names for four `users` indexes with the
  same observed key patterns. The Atlas connector exposes names and keys but
  not the complete `unique`, `sparse`, partial-filter, collation and TTL
  options, so its output alone is insufficient for the parity gate.

## Target Atlas role shapes (2026-10-26)

Atlas custom roles are project-local. Create the staging and production roles
separately; do not attach a built-in `readWrite`, `readWriteAnyDatabase` or
`dbAdmin` role to either deployed principal, and do not inherit one through
another custom role.

### Runtime principals

- In `eqplus-staging`, keep username `eqplus-staging-app` and replace its
  `readWriteAnyDatabase@admin` assignment with the custom role
  `eqplus-app-staging`. In `eqplus-dev` (the production project), keep
  username `api-prod` and keep the existing custom role `eqplus-app`.
- `eqplus-app-staging` is intentionally narrower than the current production
  role: it has full `find`, `insert`, `update` and `remove` only on the
  non-audit application collections (`users`, `profiles`, `vendors`,
  `clients`, `skillTaxonomy`) and only `find` and `insert` on `auditLogs`. It
  has no index actions and no privileges on `migrationChangelog`,
  `migrationLock`, `tests` or `testAttempts`.
- Production `eqplus-app` already has the correct `auditLogs` shape. This is
  option (a), so production has two tracked tightening changes: first remove
  only its `createIndex` action; second remove its `find`/`insert`/`update`/
  `remove` privileges on `migrationChangelog` and `migrationLock`, plus its
  `find`/`insert`/`update` privileges on `tests` and `testAttempts`. Do not
  rebuild the role; record each change and its effective-privilege result.
- Neither runtime role may inherit a built-in role or hold
  `readWriteAnyDatabase`, `dbAdmin`, `listIndexes`, `createIndex`, `dropIndex`,
  `collMod`, `createCollection`, database-wide, `admin`-database or
  `AnyDatabase` privilege. MongoDB cannot express the audit-log subtraction
  through an inherited built-in role, so these are explicit custom roles.
- `api-dev` exists only in the repository's legacy setup and handoff notes; no
  application, workflow, deployed secret or connection configuration in this
  repository references it. Its purpose is therefore not evidenced as an
  active production dependency. Bhavesh must confirm no external local tool or
  operator still uses it; if none does, remove the production-project user
  rather than repurpose it.

### Migration principals

- Keep username `eqplus-migrator` in each project, but replace its
  `readWrite@eqplus` (and any other built-in role) assignment with the
  project-local custom role `eqplus-migrator-role`. Staging and production
  retain separate credentials in their existing managed secrets.
- `eqplus-migrator-role` uses this explicit matrix. “Full CRUD” below means
  `find`, `insert`, `update` and `remove`.

  | Resource | Actions |
  | --- | --- |
  | `eqplus.users` | full CRUD, `createIndex`, `dropIndex`, `listIndexes`, `createCollection` |
  | `eqplus.profiles` | full CRUD, `createIndex`, `dropIndex`, `listIndexes`, `collMod`, `createCollection` |
  | `eqplus.vendors` | full CRUD, `createIndex`, `dropIndex`, `listIndexes` |
  | `eqplus.clients` | full CRUD, `createIndex`, `dropIndex`, `listIndexes` |
  | `eqplus.skillTaxonomy` | full CRUD, `createIndex`, `dropIndex`, `listIndexes`, `collMod`, `createCollection` |
  | `eqplus.auditLogs` | `find`, `insert`, `createIndex`, `dropIndex`, `listIndexes` only |
  | `eqplus.migrationChangelog` | full CRUD; no index action |
  | `eqplus.migrationLock` | full CRUD, `createIndex`; no `dropIndex` or `listIndexes` |
  | database `eqplus` | `listCollections` only |

  `listCollections` is deliberately granted at database scope because MongoDB
  does not expose a collection-scoped form of that action. The committed
  migrations call `db.listCollections({ name: ... })` for `users`, `profiles`
  and `skillTaxonomy`, so this is an unavoidable database-level widening within
  `eqplus`, not an `AnyDatabase` privilege. The users migration also contains a
  `createCollection("users")` fallback, so `users` is intentionally included
  above.

  The repository uses `migrate-mongo@14.0.7` with `lockTtl: 300`. Its lock
  helper creates the TTL index on `migrationLock`; it does not call
  `listIndexes` and does not create an index on `migrationChangelog`. Therefore
  `createIndex` is allowed on `migrationLock`, while `dropIndex` and
  `listIndexes` are omitted from both bookkeeping collections. The migrator
  has no `update` or `remove` action on `auditLogs`, despite having index
  actions there. It has no inherited built-in role and no `AnyDatabase`
  privilege.

### Effective-role verification

After each role assignment, the trusted Atlas operator records the role and
privilege view for the exact username without displaying credentials. Use the
Atlas console's effective-privilege view or an equivalent `usersInfo` check
with `showPrivileges: true` and `showCredentials: false`. Apply and verify in
this order:

1. **Staging first:** `eqplus-staging-app` has only `eqplus-app-staging`, the
   `readWriteAnyDatabase@admin` role is absent, and its effective privileges
   contain no index action. `eqplus-migrator` has only
   `eqplus-migrator-role`, with the exact matrix above, including
   database-level `listCollections` and `createIndex` on `migrationLock`.
2. Run the staging API smoke test and capture the effective-privilege output.
   Confirm `auditLogs` has no `update` or `remove` for either principal and
   that no inherited `readWrite`, `readWriteAnyDatabase` or `dbAdmin` role
   remains.
3. **Production second:** `api-prod` keeps `eqplus-app`; remove its
   `createIndex` action, then remove the over-granted migration/test collection
   privileges listed above, proving its existing `auditLogs` `find`/`insert`
   shape is unchanged after each tracked change. Replace production
   `eqplus-migrator`'s built-in role with `eqplus-migrator-role`, then record
   the same effective-privilege view.
4. Confirm `api-dev` has no external dependency. If unused, remove it; do not
   treat its deletion as the runtime-role verification.
5. Run a staging migration `status` and two idempotent `up` runs with the
   staging migrator URI. Production is verified with `status` first and
   remains approval-gated for any `up`/`apply` execution.

The recorded evidence must include the two projects, usernames, effective
roles, relevant privilege rows and command timestamps. It must not include a
password or a connection URI.

## Required sequence

1. Capture the current effective roles for `eqplus-staging-app`, staging
   `eqplus-migrator`, `api-prod`, production `eqplus-migrator` and `api-dev`.
   Capture `db.<collection>.getIndexes()` for each application collection in
   both clusters, including `_id_`, and retain complete manifests for review
   and rollback. Compare names, key order and all index options.
2. **Apply staging first.** In `eqplus-staging`, create
   `eqplus-app-staging` and `eqplus-migrator-role`; replace the staging runtime
   user's `readWriteAnyDatabase@admin` assignment and the staging migrator's
   built-in roles. Do not rotate either credential.
3. **Verify staging before touching production.** Record effective privileges
   for both staging principals, confirm the runtime has no index actions and
   the migrator matches the exact matrix above, and confirm neither can update
   or remove `auditLogs`. Run the staging API smoke test.
4. **Apply production second.** On `eqplus-app`, first remove `createIndex`,
   then remove its over-granted `migrationChangelog`, `migrationLock`, `tests`
   and `testAttempts` privileges as the second tracked change. Prove the
   existing `auditLogs` `find`/`insert` privileges are unchanged after each
   change. Replace the production migrator's built-in roles with
   `eqplus-migrator-role`, then record and verify effective privileges.
5. Confirm whether any external local tool or operator uses `api-dev`. If no
   dependency exists, remove the production-project user; do not use it as a
   deployed runtime or migration identity.
6. Store each migration URI as a separate managed secret. Make it available
   only to the trusted migration operator or job. Never inject it into a
   Cloud Run API service, save it in the repository, or print it in logs.
7. Deploy the API change that sets `autoIndex: false` under `NODE_ENV=production`.
   Confirm application startup creates no index and normal reads/writes work.
8. Only then run the reviewed name-reconciliation migration on staging with
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
and execution, `roles/logging.viewer` on project `eqplus-503212` for reading
Cloud Run Job execution logs, plus `roles/iam.serviceAccountUser` on the migration identity
for `actAs`; the migration identity has
`roles/secretmanager.secretAccessor` on
`MONGODB_URI_MIGRATOR_STAGING` and `MONGODB_URI_MIGRATOR` only. The staging
dispatch reads `MONGODB_URI_MIGRATOR_STAGING`; the production dispatch reads
`MONGODB_URI_MIGRATOR` and runs status only. The URI never enters the GitHub
runner.

The existing `MONGODB_URI` remains the API runtime credential. Local
development and tests may still use it with `autoIndex: true`. A deployed
migration command fails closed without `MONGODB_MIGRATION_URI`.
