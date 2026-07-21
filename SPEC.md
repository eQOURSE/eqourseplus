# eQOURSE+ — SaaS Requirements Specification (SPEC.md) v2.3 — Global Edition
> Workforce & Project Delivery Platform for eQOURSE (AI Data Services + Content Services) and Tutrain.
> This file is the single source of truth for AI coding agents (Antigravity / Cursor / Claude Code / Kiro).
> RULES FOR AGENTS: Implement only requirements listed here, by FR ID. Never invent endpoints, entities or
> features not defined here. State machines (Section 6) are law.
> STRUCTURE: Part A = Sections 1–13 (core spec). PART B (Sections 14–21, bottom of file) = Global Edition
> additions. WHERE PART B CONFLICTS WITH PART A, PART B WINS — notably: MongoDB Atlas (Sec 19) replaces
> PostgreSQL, and the deployment/stack in Sections 19–20 replaces Section 11's infra rows.

## 1. Purpose
Single reference for building eQOURSE+ — an Outlier.ai/DataPlus-style platform where freelancers and vendor
agencies register, get KYC/KYB-verified, pass proctored category tests, join a tiered talent pool, and execute
projects end to end: staffing → tasks → QA → delivery → invoicing → payouts. Every requirement has a unique ID
(e.g., FR-REG-03). Reference IDs in branches (`feat/FR-REG-03-kyc-adapter`), PRs and agent prompts.

## 2. Product Overview & Goals
One multi-tenant platform, two business units (eQOURSE, Tutrain), one shared verified talent pool.
Chain: Register → Verify (KYC/KYB) → Proctored Test → Talent Pool → Staffing → Execution → QA → Delivery → Invoicing → Payout.
Success metrics: <10 human-minutes per approved freelancer (2 touch points), staffing <48h, first-pass QA ≥90%,
payout disputes <1%, 100% projects with live margin tracking, fraud flags <2% of pool.

## 3. Roles
Freelancer · Vendor (agency) · Vendor Member · Verifier · Project Manager (PM) · QA Reviewer · Finance Admin ·
Super Admin · Client (Phase 3, read-only portal). RBAC is mandatory; roles scoped per business unit.

## 4. Architecture
Modular monolith at MVP: NestJS API + PostgreSQL, module boundaries = {Identity/RBAC, Onboarding/KYC-KYB,
Assessment/Proctoring, Talent DB/Match, Projects/Jobs/Tasks, QA/Quality, Finance, CRM, Messaging/Notifications,
Audit/Compliance}. All third-party capabilities behind provider-agnostic adapters: KYC (IDfy/HyperVerge),
e-sign (Digio/Leegality), proctoring SDK (Mettl/AutoProctor), payouts (RazorpayX/Cashfree; Stripe overseas),
annotation (Label Studio/CVAT), LLM APIs.

## 5. Functional Requirements
Priorities: [P1]=MVP Phase 1, [P2]=Phase 2, [P3]=Phase 3. Format: ID | Requirement | Acceptance criterion.

### 5.1 Registration & Verification (REG)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-REG-01 | [P1] Freelancer sign-up with email + phone OTP; duplicates blocked by phone/PAN/device fingerprint. | No second account with same phone, PAN or device. |
| FR-REG-02 | [P1] Multi-step profile wizard (personal, education, taxonomy skills, languages, experience, samples, availability, rate) with save-and-resume. | Resume incomplete profile; completion % shown. |
| FR-REG-03 | [P1] KYC capture: govt ID, selfie liveness, address proof via KYC API adapter. | ID validity + face-match score stored; raw Aadhaar never stored. |
| FR-REG-04 | [P1] Bank penny-drop verification; PAN mandatory; UPI optional. | Name-match score stored; payouts blocked until verified. |
| FR-REG-05 | [P1] In-flow e-sign of NDA + freelancer agreement. | Signed PDF stored with timestamp + IP. |
| FR-REG-06 | [P1] Profile state machine: Draft→Submitted→Under Review→Test Pending→Test Passed→Approved (+Rejected / More-Info-Needed). | All transitions audit-logged with actor + reason. |
| FR-REG-07 | [P1] Verifier console: 48h SLA queue, docs + API results side-by-side, approve/reject with reason templates, request-more-info. | Clean profile processed in <3 minutes. |
| FR-REG-08 | [P1] Vendor KYB: GST/Udyam, company PAN, incorporation, cancelled cheque, signatory KYC, MSA e-sign, capability profile. | Vendor cannot bid until KYB approved. |
| FR-REG-09 | [P2] Vendor invites members; each does KYC-lite + category tests. | Members tracked individually under vendor. |
| FR-REG-10 | [P2] AI resume/portfolio parsing pre-fills wizard, maps to taxonomy. | 80%+ parsed fields accepted without edit. |

### 5.2 Assessment & Proctoring (TST)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-TST-01 | [P1] Admin test builder: per-category banks; MCQ, rubric-scored subjective, practical simulations; randomized, timed, per-category pass threshold. | New category test configured without code. |
| FR-TST-02 | [P1] Proctored mode via SDK: mandatory webcam, snapshots, continuous face presence, face match vs KYC selfie. | No-face/multi-face/mismatch logged as flags. |
| FR-TST-03 | [P1] Secure browser: full-screen; tab-switch/copy-paste/right-click/screen-share detection; N violations auto-terminate (configurable). | Violations visible in attempt report. |
| FR-TST-04 | [P1] Auto-scoring where deterministic; flagged attempts to human review before final result. | Result = Pass/Fail/Under Review; never pass with open flags. |
| FR-TST-05 | [P1] Retakes: 14-day cooldown, max 2 per category (configurable). | Enforced automatically; visible to candidate. |
| FR-TST-06 | [P1] Pass assigns category badge + starting tier (Bronze/Silver/Gold by score bands). | Badge/tier on profile; used by matching. |
| FR-TST-07 | [P2] Trial task on real sample as final gate for sensitive projects. | PM can require trial in project settings. |
| FR-TST-08 | [P3] AI test-variant generation + item statistics. | Leaked questions detectable via anomaly stats. |

### 5.3 Talent Database & Matching (TAL)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-TAL-01 | [P1] Admin-managed taxonomy: Business Unit→Service→Skill→Level; versioned. | Add skill without deployment. |
| FR-TAL-02 | [P1] Faceted talent search (skills, languages, tier, quality, availability, rate, timezone, device, history) + saved searches. | 5 combined filters return in <5s. |
| FR-TAL-03 | [P1] Talent benches: named, access-controlled lists per PM/client. | Reusable across projects. |
| FR-TAL-04 | [P2] Auto-match: fit = skill×quality×availability×rate; ranks on posting; optional auto-invite top N. | Ranked list within 1 min of posting. |
| FR-TAL-05 | [P2] Semantic (embedding) search over profiles. | NL query returns relevant ranked results. |
| FR-TAL-06 | [P2] Live quality score + auto tier updates from QA; tier history kept. | Automatic, logged, worker notified. |

### 5.4 Projects, Jobs & Tasks (PRJ)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-PRJ-01 | [P1] Project creation: title, business unit, client, category, SOP files, skills/languages, headcount, work type (task/hourly/milestone/vendor), rate, budget cap, dates, confidentiality, required test, quality bar. | No posting without budget + rate + category. |
| FR-PRJ-02 | [P1] Posting modes: invite-only (default confidential) + open job board; [P2] vendor RFP sealed bids. | Confidential projects invisible on open board. |
| FR-PRJ-03 | [P1] Application kanban: Applied→Screened→Trial→Selected→Contracted→Active; bulk actions. | Every stage change notifies candidate. |
| FR-PRJ-04 | [P1] Project work order e-signed at selection; assets unlocked only after signing. | Unsigned workers cannot open assets. |
| FR-PRJ-05 | [P1] Task engine: CSV batch upload (API P2); auto-distribution by capacity+tier; states per F4; deadlines + auto-requeue. | 10k-task batch distributes with no manual assignment. |
| FR-PRJ-06 | [P1] Built-in workbench for text/classification; adapters to Label Studio/CVAT/client tools. | Text tasks completed without leaving platform. |
| FR-PRJ-07 | [P1] Project dashboard: progress %, throughput, quality trend, roster, burn-down, budget consumed. | Refresh ≤5 min. |
| FR-PRJ-08 | [P2] Redundancy: same task to K workers + adjudication UI. | K configurable per batch. |
| FR-PRJ-09 | [P2] Vendor RFP: vendor-only posting, side-by-side bid compare, award → milestones + escrow. | Award converts bid to contract in one click. |
| FR-PRJ-10 | [P2] Per-project channel + announcements; PM↔worker DMs; retained/audited; client identity maskable. | Masked projects hide client from workers. |
| FR-PRJ-11 | [P3] Client batch push via API/webhooks; export packages with manifest + QA report. | Client system creates batches without upload. |

### 5.5 Quality & Monitoring (QLT)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-QLT-01 | [P1] Sampling QA: configurable % per worker to rubric review; feeds quality score. | Sampling rate adjustable at runtime. |
| FR-QLT-02 | [P2] Gold/honeypot tasks mixed silently; auto accuracy measurement. | Indistinguishable to workers; accuracy visible to PM. |
| FR-QLT-03 | [P2] Fraud detection: duplicate device/bank/ID, impossible speed, answer-similarity clusters, geo/VPN anomalies → T&S queue. | Flagged accounts auto-paused. |
| FR-QLT-04 | [P2] Strike/suspension engine with appeals; two-way ratings. | Suspensions carry reason + appeal link. |
| FR-QLT-05 | [P2] Hourly telemetry: active time + idle detection only (no screenshots); versioned consent. | Telemetry off for task-priced work. |
| FR-QLT-06 | [P3] AI QA copilot pre-scores subjective work; humans review borderline band. | ≥50% human QA reduction at equal accuracy (pilot). |

### 5.6 Finance (FIN)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-FIN-01 | [P1] Earnings ledger per accepted task/hour/milestone; near-real-time; per-line disputes. | Ledger reconciles 1:1 with accepted work. |
| FR-FIN-02 | [P1] Live margin per project/client (billing − payouts); leadership-only visibility option. | Margin hidden from PM if configured. |
| FR-FIN-03 | [P1] Payout cycles + threshold; P1 exports approved batch file; [P2] RazorpayX/Cashfree bulk API + webhooks + retry queue. | Failed payouts retried; worker sees status. |
| FR-FIN-04 | [P1] TDS auto-compute (194J/194C via PAN); vendor GST; statements + Form-16A-ready reports. | Cycle-wise TDS report exportable. |
| FR-FIN-05 | [P2] Vendor invoices vs milestones; 2-step approval (PM delivery → Finance payment); e-invoice. | No payment without both approvals. |
| FR-FIN-06 | [P2] Milestone escrow for fixed-price: committed before start, released on QA acceptance. | Escrow state visible to both sides. |
| FR-FIN-07 | [P3] Client invoicing + receivables aging; Zoho Books/Tally export hooks. | Invoice matches milestone acceptances. |

### 5.7 CRM & Clients (CRM)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-CRM-01 | [P2] Client accounts: contacts, contracts/NDAs, rate cards, preferred/blocked talent. | Blocked talent never auto-matched to that client. |
| FR-CRM-02 | [P2] Pipeline Lead→Qualified→Proposal→Won→Active→Renewal; Won auto-creates project shell. | Stage history reportable. |
| FR-CRM-03 | [P3] Client health page: projects, revenue, margin, SLA, renewals. | One page per client. |
| FR-CRM-04 | [P3] White-label read-only client portal + deliverable approval. | Client never sees worker PII or costs. |

### 5.8 Admin & Platform (ADM)

| ID | Requirement | Acceptance |
|---|---|---|
| FR-ADM-01 | [P1] Field-level RBAC (finance hidden from PM; client maskable from workers); 2FA for staff. | Access matrix testable per role. |
| FR-ADM-02 | [P1] Immutable audit log for sensitive actions (actor, ts, before/after). | Append-only, exportable. |
| FR-ADM-03 | [P1] Notifications in-app + email ([P2] SMS/WhatsApp) for every user-affecting state change. | Templates admin-editable. |
| FR-ADM-04 | [P2] Announcements/News + policy center with versioned acceptance. | Re-acceptance enforceable on update. |
| FR-ADM-05 | [P2] Automation rules engine (trigger–condition–action). | Rules configurable without code. |
| FR-ADM-06 | [P2] Org analytics: funnel, supply-vs-demand heatmap, time-to-staff, payout liability, QA trends. | Filterable by business unit. |

## 6. Normative Flows & State Machines
Implement as explicit enums + transition guards (no ad-hoc booleans).

**F1 Freelancer onboarding:** Sign-up → Profile wizard → KYC docs → Bank penny-drop → e-sign →
auto API checks → HUMAN Verifier (touch 1) → [fail: More-Info loop] → Test invite → Proctored test →
auto-score + HUMAN flag review (touch 2) → [fail: 14-day cooldown, max 2 retakes] → APPROVED (badge+tier) → auto-match.

**F2 Vendor:** Sign-up → KYB docs → signatory KYC + MSA → capability profile → Verifier approval → ACTIVE →
invite members (KYC-lite + tests). RFP: PM posts → vendors bid → PM compares/awards → escrow lock + work order → vendor allocates tasks to members.

**F3 Project lifecycle:** CRM Won → PM creates project → staffing mode {open board | auto-match invites | vendor RFP} →
selection pipeline → work orders e-signed → task batches distributed → execution + gold tasks + sampling QA →
QA gate (accept/rework) → deliverable → client acceptance → client invoice → payouts (TDS/GST) → scorecards archived.

**F4 Task states:** QUEUED → IN_PROGRESS → SUBMITTED → {IN_QA | AUTO_ACCEPT} ; IN_QA → {ACCEPTED | REWORK → SUBMITTED | REJECTED};
IN_PROGRESS → EXPIRED → requeue.

**F5 Finance:** Accepted work → EarningLine → cycle close → auto TDS/GST → Finance batch approval →
payout API → webhook success/fail (fail → retry queue) → worker dashboard + payslips; margin analytics fed continuously.
**F5 PayoutBatch state enum (normative):** PENDING → APPROVED → PROCESSING → SUCCEEDED | FAILED → RETRY_QUEUED → PROCESSING; CANCELLED reachable from PENDING/APPROVED only (admin action, audit-logged). EarningLine.status: ACCRUED → LOCKED_IN_BATCH → PAID | FAILED | DISPUTED.
**DESIGN SYSTEM (normative):** ./DESIGN.md (extracted from eqourse.com) is the canonical visual language for all UI — colors, typography, gradients, shadows, radius, glassmorphism, animation library, easing and timing. Any UI FR must comply with DESIGN.md; the platform may EXTEND it (Section 12 of DESIGN.md) but never contradict its tokens.

## 7. Screen Inventory (prototype = production components: Next.js + Tailwind + shadcn/ui)
Freelancer: Onboarding wizard (stepper, save-resume, doc uploader w/ API status) · Dashboard (tier badge, quality ring,
earnings, next payout, recommended jobs) · Job board + applications · Test center (proctoring pre-check, cooldowns) ·
Task workbench (queue, SOP panel, annotation UI, rework) · Earnings & payouts (ledger, disputes, TDS docs) · Profile.
Vendor: KYB onboarding · Team management · RFPs & bids · Delivery/allocation · Invoices.
Ops: Verification queue · Talent search (+semantic P2, benches, compare) · Project builder · Staffing kanban (+auto-match panel) ·
Project dashboard · QA console (rubrics, gold results) · Finance console (cycles, batches, TDS/GST, margin, escrow) ·
Admin (taxonomy, test builder, RBAC matrix, automation rules, audit explorer, announcements).
Design: eqourse.com design system per DESIGN.md — primary teal #0F9B8E (hsl 170 82% 32%), accent mint #7BE8C9, navy #232145/#2B2856, background #F7FAF9, gradient-primary teal→mint; rounded cards, dark mode, EN+HI strings, WCAG-AA,
every empty state has guidance + CTA.

## 8. Core Entities (PostgreSQL system of record — keep names exact)
User · FreelancerProfile · Vendor · VendorMember · Document · Test · TestAttempt · SkillTaxonomy · Client ·
Project · JobPost · Application · WorkOrder · TaskBatch · Task · QAReview · EarningLine · PayoutBatch · Invoice ·
Milestone · AuditLog (append-only). Relationships as described in SRS Section 8.

## 9. API Groups (REST /api/v1, OpenAPI, JWT+RBAC, paginated, idempotent webhooks)
/auth · /profiles · /vendors · /tests · /talent · /projects · /jobs · /applications · /work-orders ·
/tasks · /batches · /qa · /finance · /crm · /admin.

## 10. NFRs
p95 API <400ms; search <5s @100k profiles; 50k users / 5k concurrent / 1M tasks-month; TLS + at-rest encryption;
OWASP ASVS L2; DPDP 2023 + PDPA + GDPR-ready (consent records, erasure workflow, masked Aadhaar only,
versioned proctoring consent); ISO 27001 alignment (access reviews, immutable audit, client-data isolation,
AWS Mumbai + Singapore residency); 99.5% uptime, RPO 1h/RTO 4h; i18n externalized (EN+HI).

## 11. Approved Stack
Next.js 14+/TS/Tailwind/shadcn (PWA) · NestJS modular monolith (Node 22 LTS) · PostgreSQL 16 + Redis(BullMQ) + S3 ·
Typesense/OpenSearch + pgvector · Keycloak/Auth0 (JWT, RBAC, 2FA) · KYC: IDfy/HyperVerge · e-sign: Digio/Leegality ·
Proctoring: Mettl/AutoProctor SDK (buy) · Payouts: RazorpayX/Cashfree (+Stripe overseas) · Label Studio embedded ·
LLM API behind internal service · AWS (Mumbai+SG), Terraform, Docker · Sentry + Grafana + structured logs.

## 12. Phases & Definition of Done
Phase 1 (8–12 wks, all [P1]) M1 auth+wizard+KYC · M2 verifier console+e-sign · M3 proctored tests+tiers ·
M4 talent search+benches · M5 invite-only projects+kanban+work orders · M6 task engine+workbench+sampling QA ·
M7 ledger+payout export+TDS · M8 RBAC+audit+notifications.
DoD-P1: a real freelancer goes sign-up→verified→tested→staffed→tasks→earnings→paid with zero spreadsheets.
Phase 2: all [P2]. Phase 3: all [P3].

## 13. Agent Rules (repeat)
One FR per session; prompt with FR ID + relevant sections + acceptance criterion; tests before merge;
state machines as enums+guards; adapters for all third parties; no new deps without tech-lead approval;
never touch payments/KYC adapters without human review; branches `feat/FR-XXX-nn-name`; PRs list FR IDs.

---

# PART B — v2.0 ADDENDUM (Global Edition) — WHERE B CONFLICTS WITH A, B WINS

## 14. Global KYC/KYB
Country selector at sign-up (FR-REG-11) drives document checklist + contract entity (India → eQOURSE India;
rest of world → eQOURSE PTE LTD Singapore). Primary IDV: one global provider (Sumsub/Onfido/Persona/Veriff/Stripe
Identity — doc authenticity + selfie liveness + face match + AML/sanctions) behind KYCAdapter (FR-REG-12);
India fast-path via IDfy/HyperVerge. Universal fallback: passport + liveness + proof of address + manual lane.
KYB by region: India GST/PAN/Udyam; US Incorporation+EIN+W-9; UK Companies House+VAT; EU VIES VAT; SG ACRA/UEN;
RoW incorporation+taxID+bank proof (FR-REG-13). All vendors: signatory KYC, UBO≥25% declaration + sanctions
screening, MSA e-sign (DocuSign/Dropbox Sign international; Digio/Leegality India — one ESignAdapter).
Tax profile per user/vendor (FR-REG-14): residency, TIN ref, forms (W-8/W-9/GST), withholding rule id.

## 15. Global Payments
Corridors: India → RazorpayX/Cashfree; International → Wise Platform or Payoneer; Stripe Connect where it fits;
PayPal fallback. Multi-currency EarningLines with FX snapshot at cycle close (FR-FIN-08); provider routing by
corridor behind PayoutAdapter with unified webhooks (FR-FIN-09); withholding rules engine keyed by
(payer entity, payee residency, payee type) (FR-FIN-10). Fee-bearer policy configurable per corridor.

## 16. Screens (build order)
PUBLIC (SSR, SEO): Home / Jobs (/jobs, /jobs/[slug] with JobPosting schema) / For Freelancers / For Vendors /
About-Trust / Login / Register (role question → Freelancer|Vendor wizard; country select).
FREELANCER: register → verify → country → 5-step profile wizard → per-country KYC step (live status chips) →
payout setup → e-sign → under-review (SLA countdown) → Test Center (proctoring pre-check) → proctored test →
result (badge/tier or cooldown) → Dashboard (tier badge, quality ring, earnings, next payout, recommended jobs)
→ Workbench (task center, SOP side panel, timer, rework banner).
VENDOR: company register → KYB checklist → signatory KYC → capability → MSA → dashboard → Team mgmt
(email/CSV invites, member KYC/test/quality table) → allocation board (drag task groups, capacity bars) →
RFP list/detail → bid composer → tracker.
PM (coordinator; no margin/finance visibility): My Projects, New-project wizard (budget over limit → SA approval),
Talent Search (+semantic bar), Staffing kanban (+auto-match panel), Project Room (Overview/Tasks/QA/People/Files/
Chat), Delivery. SUPER ADMIN: command-center home (revenue+margin, funnel, risk, payout liability, fraud, SLA),
Users&Roles (audited impersonation), verification oversight, taxonomy+test builder, finance control (batch
approvals, withholding, entities), automation rules, integrations health, feature flags, audit explorer,
announcements, unified Approvals inbox; assigns coordinators to projects.

## 17. AI vs Manual
AI: parsing, IDV checks, proctoring flags, auto-match, semantic search, distribution, gold accuracy, AI QA
pre-score, fraud anomalies, withholding+FX, payout reconciliation, programmatic SEO pages.
HUMAN (irreversible): flagged-profile approval, flagged-test results, selection/award, borderline QA,
payout batch approval, suspensions/appeals, client acceptance. Rule: AI proposes; humans approve anything irreversible.

## 18. SEO & Domain
Host at **plus.eqourse.com** (subdomain: inherits brand/authority via links, isolates app SEO risk from main site).
No new standalone domain. Crawlable links from eqourse.com header/footer/homepage → subdomain; platform footer
links back ("eQOURSE+ — the talent platform by eQOURSE") + contextual category↔service interlinks. No copied
content (canonical to eqourse.com if unavoidable). Standards: titles ≤60 chars keyword-first; metas ≤155;
self-canonicals; clean slugs; schema = Organization(parentOrganization: eQOURSE) + WebSite + JobPosting (every job
→ Google Jobs) + FAQPage + BreadcrumbList; hreflang en/x-default; SSR/SSG public routes; auto sitemap on publish;
robots blocks /app,/api; separate GSC property; CWV budget LCP<2.5s. FR-SEO-01: programmatic pages per open job and
per category×language landing.

## 19. MongoDB Atlas (system of record — replaces Postgres)
Org eQOURSE; projects eqplus-dev/staging/prod; M0 dev, M10+ prod in AWS ap-south-1 (+SG replica later);
continuous backups; SCRAM users least-privilege; IP allowlist/VPC peering only; CSFLE/Queryable Encryption on PII;
Atlas Search (talent facets) + Atlas Vector Search (semantic). Mongoose strict schemas + collection validators;
migrate-mongo. Collections mirror Section 8 entities (users, freelancerProfiles, vendors, vendorMembers,
documentsVault[files in R2], tests, testAttempts, skillTaxonomy, clients, projects, jobPosts, applications,
workOrders, taskBatches, tasks, qaReviews, earningLines[APPEND-ONLY], payoutBatches, invoices, milestones,
auditLogs[APPEND-ONLY], notifications, announcements, messages). MANDATORY: multi-document transactions for all
ledger/payout writes; state machines as enums + service-layer guards. If finance outgrows Mongo, isolate ledger
into small Postgres service later via adapter.

### 19.2 Normative collection schemas (added v2.3 — extend this subsection as each collection is first implemented)

**skillTaxonomy** — one document per selectable skill node.
```
{
  _id: ObjectId,
  businessUnit: "EQOURSE" | "TUTRAIN",        // required
  serviceLine: string,                         // required, e.g. "AI Data Services", "Content Services", "Tutoring"
  skill: string,                               // required, e.g. "Annotation", "Curriculum", "NEET Biology"
  specialization: string | null,               // optional leaf refinement, e.g. "Bounding Box"; null = general skill
  slug: string,                                // required, unique, kebab-case of full path, e.g. "eqourse-ai-data-services-annotation-bounding-box"
  status: "ACTIVE" | "DEPRECATED",             // required, default "ACTIVE" (never hard-delete taxonomy nodes)
  version: number,                             // required, starts 1, increments on any field change
  createdAt: Date, updatedAt: Date
}
```
Indexes: unique on `slug`; unique compound on `(businessUnit, serviceLine, skill, specialization)`; index on `status`.
Rules: proficiency levels (BEGINNER | INTERMEDIATE | ADVANCED | EXPERT) are NOT taxonomy rows — they are stored on
profiles as `{ taxonomySlug, level }` when FR-REG-02 lands. Seed/import operations upsert by `slug` (idempotent).
Normative seed rows (FR-FND-03):
1. EQOURSE / AI Data Services / Annotation / Bounding Box
2. EQOURSE / Content Services / Curriculum / null
3. TUTRAIN / Tutoring / NEET Biology / null


## 20. Deployment (no physical servers)
Vercel (Next.js, plus.eqourse.com CNAME, PR previews) · Railway/Render (NestJS API + BullMQ workers; Node 22 LTS; Docker;
ap-south-1/SG) · Upstash Redis · MongoDB Atlas · Cloudflare R2 (buckets: kyc-docs encrypted-private,
project-assets, deliverables; pre-signed URLs) · Resend/SES + MSG91/WhatsApp Cloud · Auth0 or Keycloak ·
GitHub Actions CI/CD (prod migrations manual-gated) · Secrets: Doppler → synced to Vercel/Railway; never in repo;
per-env sandbox keys (all providers have sandboxes — staging uses them) · Sentry + BetterStack + Atlas alerts.

## 21. Naming & Phases (solo engineer + AI agents)
Name **eQOURSE+** at plus.eqourse.com; byline "the talent platform by eQOURSE"; Tutrain = business unit,
white-label in Phase 3. Phases (exit-criterion gated): 0 Foundation (wk1–2: repo/auth/Atlas/Doppler/pipelines) →
1 Public site+SEO (wk3–4) → 2 Freelancer onboarding REG-01..07,11,12,14 (wk5–8) → 3 Test gate TST-01..06 (wk9–11)
→ 4 Talent DB+projects TAL-01..03, PRJ-01..07 (wk12–16) → 5 QA+finance core QLT-01, FIN-01..04,08 (wk17–20) →
6 Vendors REG-08/09/13, PRJ-09, FIN-05/06 (wk21–24) → 7 Autonomy TAL-04/05, QLT-02/03, FIN-09, ADM-04..06,
open board (wk25–30) → 8 AI+CRM (31+). Never start a phase before the previous exit criterion runs on staging.

## 22. Foundation & Public-Site Requirements (Phase 0–1 FR IDs — added v2.1)

### 22.1 Foundation (FND) — Phase 0, in this order
| ID | Requirement | Acceptance |
|---|---|---|
| FR-FND-01 | [P1] Turborepo scaffold: apps/web (Next.js 14 App Router, TS, Tailwind, shadcn init), apps/api (NestJS Node 22 LTS, Mongoose, GET /health), packages/shared (state enums from Flows F1/F4/F5 + zod schemas), packages/adapters (KYC/ESign/Payout/Proctor/Storage/LLM interfaces + sandbox implementations only), packages/ui (tokens per DESIGN.md: primary teal hsl(170 82% 32%) #0F9B8E, accent mint hsl(165 75% 71%) #7BE8C9, navy #232145, background #F7FAF9, destructive #EF4444, radius 0.75rem, shadows soft/card/elevated, gradient-primary 135deg teal→mint; fonts Inter (body) + Plus Jakarta Sans (headings)). | `pnpm dev` runs web+api; `pnpm test` and `pnpm lint` green; /health returns 200. |
| FR-FND-02 | [P1] Auth core: email OTP sign-in, JWT access+refresh, roles enum, RBAC route guard, rate-limit on auth endpoints. | Tests prove 401 unauthenticated, 403 wrong-role, 200 correct-role. |
| FR-FND-03 | [P1] Database wiring: Atlas dev connection via env, migrate-mongo configured, seed script inserting skillTaxonomy sample tree. | Migration + seed run cleanly against the dev cluster; no credentials in repo. |
| FR-FND-04 | [P1] CI: GitHub Actions on PR = lint + test + build; merge to main = staging deploy hook. | A failing test blocks the PR check. |
| FR-FND-05 | [P1] Deployments: web on Vercel (or CF Workers), api container on GCP Cloud Run asia-south1, full stack on Utho via Dokploy as staging; health checks + envs from secret manager. | Hello-world reachable on staging and prod URLs; secrets absent from repo. |
| FR-FND-06 | [P1] Observability: Sentry on web+api, structured JSON logs, request-id propagation. | A deliberately thrown error appears in Sentry from both apps. |

### 22.2 Public site (PUB) — Phase 1, after all FND
| ID | Requirement | Acceptance |
|---|---|---|
| FR-PUB-01 | [P1] Home `/` per Section 16.1 (hero, trust strip, how-it-works, category grid, stats, testimonials, footer with eqourse.com links). | SSR; Lighthouse SEO ≥95; meta/canonical per Section 18. |
| FR-PUB-02 | [P1] `/jobs` listing + `/jobs/[slug]` detail with JobPosting JSON-LD, filters by category/language; sourced from seeded sample jobs until FR-PRJ ships. | Google Rich Results test passes JobPosting on a job page. |
| FR-PUB-03 | [P1] `/freelancers` landing (earnings, tiers, testing, payout methods by country, FAQ + FAQPage schema). | Indexed-ready; meta standards met. |
| FR-PUB-04 | [P1] `/vendors` landing (RFP model, capability requirements, case-study links to eqourse.com). | Same standards. |
| FR-PUB-05 | [P1] `/about` trust page (parent-company story, certifications, security, contact). | Organization schema includes parentOrganization: eQOURSE. |
| FR-PUB-06 | [P1] `/login` + `/register` with role choice (Freelancer / Vendor) and country selector stub feeding FR-REG-11. | Role choice routes to the correct wizard placeholder; app routes noindex. |
| FR-SEO-01 | [P1] Programmatic SEO engine: auto-generated category×language landing pages, sitemap.xml regenerated on job publish, robots.txt blocking /app + /api, sitewide Organization + WebSite JSON-LD. | Publishing a seeded job updates sitemap.xml automatically; /app routes carry noindex. |

Ordering rule: FND-01→06 strictly sequential; PUB-01..06 then FR-SEO-01. FR-SEO-01 must not begin before FR-FND-01/05 are done.
