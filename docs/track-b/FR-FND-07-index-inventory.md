# FR-FND-07 index inventory

This inventory covers repository sources only. It says nothing about which indexes the deployed clusters currently contain.

The comparison is between SPEC.md §19.2, the current Mongoose schemas, and committed repository migrations. `unique` and `sparse` are shown as `false` when not declared; `partialFilterExpression`, `collation`, and TTL are shown as `none` when not declared. The `_id_` row is MongoDB's implicit default index, not a schema or migration declaration. Index names are the explicit migration names where one exists, otherwise the MongoDB name derived from the ordered key specification.

## users

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `email: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:370`) | `apps/api/src/auth/user.schema.ts:102-108` | none |
| `phone: 1` | unique: true; sparse: true; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:370`) | `apps/api/src/auth/user.schema.ts:109-115` | `20260804000000-add-users-registration-indexes.cjs:3-9`, `users_phone_unique_sparse` |
| `pan: 1` | unique: true; sparse: true; partialFilterExpression: none; collation: none; TTL: none | no — SPEC says the former top-level `pan` is replaced (`SPEC.md:371`) | `apps/api/src/auth/user.schema.ts:124-131` | `20260804000000-add-users-registration-indexes.cjs:10-15`, `users_pan_unique_sparse` |
| `countryIdentifiers.lookupDigest: 1` | unique: true; sparse: true; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:370`) | none | none |
| `deviceFingerprints.hash: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:370`) | `apps/api/src/auth/user.schema.ts:161` | `20260804000000-add-users-registration-indexes.cjs:16-19`, `users_device_fingerprint_hash` |
| `profileState: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — legacy field is inert (`SPEC.md:371`) | none | `20260804000000-add-users-registration-indexes.cjs:20-23`, `users_profile_state` |

## profiles

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `userId: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:457`) | `apps/api/src/profiles/profile.schema.ts:157` | `20260921000000-create-profiles-and-backfill-state.cjs:151`, `userId_1` |
| `state: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:457`) | `apps/api/src/profiles/profile.schema.ts:158` | `20260921000000-create-profiles-and-backfill-state.cjs:152`, `state_1` |
| `skills.taxonomySlug: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:457`) | `apps/api/src/profiles/profile.schema.ts:159` | `20260921000000-create-profiles-and-backfill-state.cjs:153`, `skills.taxonomySlug_1` |
| `state: 1, updatedAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:457`) | none | `20260921000000-create-profiles-and-backfill-state.cjs:154`, `state_1_updatedAt_1`; removed by the `up` path of `20261013000000-add-profile-review-queue.cjs:33` and recreated only by its `down` path at `:51` |
| `state: 1, submittedAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — current SPEC still lists `updatedAt` (`SPEC.md:457`) | `apps/api/src/profiles/profile.schema.ts:160` | `20261013000000-add-profile-review-queue.cjs:33-35`, `state_1_submittedAt_1` |

## vendors

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `ownerUserId: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:406`) | `apps/api/src/vendors/vendor.schema.ts:181` | none |
| `state: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:406`) | `apps/api/src/vendors/vendor.schema.ts:139-145` | none |
| `countryCode: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:406`) | `apps/api/src/vendors/vendor.schema.ts:148-155` | none |
| `capabilities.taxonomySlug: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:406`) | `apps/api/src/vendors/vendor.schema.ts:182` | none |
| `countryIdentifiers.lookupDigest: 1` | unique: true; sparse: true; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:406`) | `apps/api/src/vendors/vendor.schema.ts:183-186` | none |
| `state: 1, submittedAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:406`) | `apps/api/src/vendors/vendor.schema.ts:187` | none |

## clients

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `ownerUserId: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:494`) | `apps/api/src/clients/client.schema.ts:129` | none |
| `state: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:494`) | `apps/api/src/clients/client.schema.ts:96-102` | none |
| `countryCode: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:494`) | `apps/api/src/clients/client.schema.ts:105-111` | none |
| `countryIdentifiers.lookupDigest: 1` | unique: true; sparse: true; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:494`) | `apps/api/src/clients/client.schema.ts:130-133` | none |
| `state: 1, submittedAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:494`) | `apps/api/src/clients/client.schema.ts:134` | none |

## skillTaxonomy

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `slug: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:335`) | `apps/api/src/database/skill-taxonomy.schema.ts:52` | `20260721000000-create-skill-taxonomy.cjs:59-64`, `skill_taxonomy_slug_unique` |
| `businessUnit: 1, serviceLine: 1, skill: 1, specialization: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:335`) | `apps/api/src/database/skill-taxonomy.schema.ts:53-56` | `20260721000000-create-skill-taxonomy.cjs:65-74`, `skill_taxonomy_path_unique` |
| `status: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:335`) | `apps/api/src/database/skill-taxonomy.schema.ts:57` | `20260721000000-create-skill-taxonomy.cjs:75-78`, `skill_taxonomy_status` |

## auditLogs

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `subjectCollection: 1, subjectId: 1, occurredAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:514`) | `apps/api/src/company-reviews/audit-log.schema.ts:53` | none |
| `actorUserId: 1, occurredAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: none | yes (`SPEC.md:514`) | `apps/api/src/company-reviews/audit-log.schema.ts:54` | none |

## migrationLock

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |
| `createdAt: 1` | unique: false; sparse: false; partialFilterExpression: none; collation: none; TTL: 300 seconds | no | none | none; created by migrate-mongo's lock helper, not a migration (`apps/api/node_modules/migrate-mongo/lib/utils/lock.js:3-10`), using `lockTtl: 300` (`apps/api/migrate-mongo-config.cjs:33-36`); default name `createdAt_1` |

## migrationChangelog

| Index keys in order | Options (unique, sparse, partialFilterExpression, collation, TTL) | Listed in SPEC §19.2? | Mongoose schema declaration | Committed migration and name |
|---|---|---|---|---|
| `_id: 1` | unique: true; sparse: false; partialFilterExpression: none; collation: none; TTL: none | no — implicit MongoDB default | none | none — implicit MongoDB default |

## Indexes declared in SPEC or a schema with no migration creator

- `users.email: 1` — schema `apps/api/src/auth/user.schema.ts:102-108`; SPEC `SPEC.md:370`.
- `users.countryIdentifiers.lookupDigest: 1` — SPEC `SPEC.md:370`; no current Mongoose declaration.
- `vendors.ownerUserId: 1` — schema `apps/api/src/vendors/vendor.schema.ts:181`; SPEC `SPEC.md:406`.
- `vendors.state: 1` — schema `apps/api/src/vendors/vendor.schema.ts:139-145`; SPEC `SPEC.md:406`.
- `vendors.countryCode: 1` — schema `apps/api/src/vendors/vendor.schema.ts:148-155`; SPEC `SPEC.md:406`.
- `vendors.capabilities.taxonomySlug: 1` — schema `apps/api/src/vendors/vendor.schema.ts:182`; SPEC `SPEC.md:406`.
- `vendors.countryIdentifiers.lookupDigest: 1` — schema `apps/api/src/vendors/vendor.schema.ts:183-186`; SPEC `SPEC.md:406`.
- `vendors.state: 1, submittedAt: 1` — schema `apps/api/src/vendors/vendor.schema.ts:187`; SPEC `SPEC.md:406`.
- `clients.ownerUserId: 1` — schema `apps/api/src/clients/client.schema.ts:129`; SPEC `SPEC.md:494`.
- `clients.state: 1` — schema `apps/api/src/clients/client.schema.ts:96-102`; SPEC `SPEC.md:494`.
- `clients.countryCode: 1` — schema `apps/api/src/clients/client.schema.ts:105-111`; SPEC `SPEC.md:494`.
- `clients.countryIdentifiers.lookupDigest: 1` — schema `apps/api/src/clients/client.schema.ts:130-133`; SPEC `SPEC.md:494`.
- `clients.state: 1, submittedAt: 1` — schema `apps/api/src/clients/client.schema.ts:134`; SPEC `SPEC.md:494`.
- `auditLogs.subjectCollection: 1, subjectId: 1, occurredAt: 1` — schema `apps/api/src/company-reviews/audit-log.schema.ts:53`; SPEC `SPEC.md:514`.
- `auditLogs.actorUserId: 1, occurredAt: 1` — schema `apps/api/src/company-reviews/audit-log.schema.ts:54`; SPEC `SPEC.md:514`.

A database built only from migrations would lack these indexes.

## Indexes created by a migration with no current schema or SPEC declaration

- `users.profileState: 1`, name `users_profile_state`, from `20260804000000-add-users-registration-indexes.cjs:20-23`. It is a legacy index; the current schema has no `profileState` field or index, and SPEC §19.2 says the legacy field is inert (`SPEC.md:371`).

