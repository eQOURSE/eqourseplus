# PROGRESS.md — FR completion tracker (agents update this; human owns it)
Current phase: 0 — Foundation complete (next: FR-PUB-01)
Last completed FR: FR-FND-06 — 2026-07-23 — Added pinned Sentry 9.17.0 integrations for Next.js web and NestJS API, disabled cleanly when DSNs are absent; tests prove deliberately thrown errors reach the web capture boundary as the exact Error instance and the API in-memory Sentry transport without a live DSN. API logs are single-line structured JSON with request-scoped IDs, allowlisted HTTP metadata, and tested redaction of emails, bearer tokens, and credentialed connection URLs. Web middleware originates/preserves `X-Request-Id`, the server API client forwards it, and the API honors or mints it, includes it on request logs/Sentry context, and returns it. Cloud Run can opt into Secret Manager-backed `SENTRY_DSN` only after the secret exists, so initial deployments do not fail; Vercel reads its intentionally public browser DSN from env only. Full tests, lint, and build are green.

## Phase 0 — Foundation (wk 1–2) — SPEC.md Section 22.1, strictly in order
- [x] FR-FND-01 scaffold (2026-07-17)  - [x] FR-FND-02 auth core (2026-07-20)  - [x] FR-FND-03 db wiring (2026-07-21)
- [x] FR-FND-04 CI (2026-07-21)  - [x] FR-FND-05 deployments (2026-07-23)  - [x] FR-FND-06 observability (2026-07-23)
## Phase 1 — Public site + SEO (wk 3–4) — SPEC.md Section 22.2
- [ ] FR-PUB-01 home  - [ ] FR-PUB-02 jobs pages  - [ ] FR-PUB-03 /freelancers
- [ ] FR-PUB-04 /vendors  - [ ] FR-PUB-05 /about  - [ ] FR-PUB-06 login/register
- [ ] FR-SEO-01 programmatic SEO engine
- [ ] Manual (not code): GSC property + links from eqourse.com live
## Phase 2 — Freelancer onboarding (wk 5–8)
- [ ] FR-REG-01  - [ ] FR-REG-02  - [ ] FR-REG-03  - [ ] FR-REG-04  - [ ] FR-REG-05
- [ ] FR-REG-06  - [ ] FR-REG-07  - [ ] FR-REG-11  - [ ] FR-REG-12  - [ ] FR-REG-14
## Phase 3 — Test gate (wk 9–11)
- [ ] FR-TST-01  - [ ] FR-TST-02(lite)  - [ ] FR-TST-03  - [ ] FR-TST-04  - [ ] FR-TST-05  - [ ] FR-TST-06
## Phase 4 — Talent DB + projects (wk 12–16)
- [ ] FR-TAL-01..03  - [ ] FR-PRJ-01..07
## Phase 5 — QA + finance core (wk 17–20)
- [ ] FR-QLT-01  - [ ] FR-FIN-01..04  - [ ] FR-FIN-08
## Phase 6 — Vendors (wk 21–24)
- [ ] FR-REG-08/09/13  - [ ] FR-PRJ-09  - [ ] FR-FIN-05/06
## Phase 7 — Autonomy (wk 25–30)
- [ ] FR-TAL-04/05  - [ ] FR-QLT-02/03  - [ ] FR-FIN-09  - [ ] FR-ADM-04..06  - [ ] Open job board
## Phase 8 — AI + CRM
- [ ] FR-QLT-06  - [ ] FR-CRM-01..04
