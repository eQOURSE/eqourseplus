# eQOURSE+ — SaaS Requirements Specification (SPEC.md) v2.29 — Global Edition
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
Freelancer · Vendor (agency) · Vendor Member · Verifier · Project Manager (PM) · Project Coordinator · SME · Expert ·
Subject Head · Academic Head · QA Reviewer · Finance Admin · Super Admin · Client (self-registering actor whose company must be verified). Project Coordinator, SME, Expert, Subject Head and Academic Head sit under a Project Manager in a delivery team. Only the Verifier role may access and decide company reviews in FR-REG-07A. RBAC is mandatory; roles scoped per business unit.

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
| FR-REG-01 | [P1] Freelancer sign-up collects personal first and last name, email, phone, country and the country-driven individual `countryIdentifiers` applicable at registration, and is verified by email OTP only; phone verification is not performed (phone verification removed v2.18). The names are persisted only as `profiles.personal.firstName` and `profiles.personal.lastName` on the unique owning profile created for every account; those profile fields are authoritative and `users` carries no name field. India requires PAN at registration, canonicalised to uppercase and format-validated as five letters, four digits and one letter (`^[A-Z]{5}[0-9]{4}[A-Z]$`); validation is format-only and performs no government lookup. For every other country, a tax identifier is optional at registration and required before payout. The correct identifier is not yet known for every jurisdiction, so an unsupported country requirement is not guessed or rendered; the country-driven registry is expected to grow as jurisdiction rules are established. Registration collects no document and no address: a tax identifier is a field, not a document. Duplicates are hard-blocked by phone and the sparse unique `countryIdentifiers.lookupDigest`; device fingerprint is recorded and flagged for verifier review, never auto-blocked. The phone number is still collected, validated as E.164 and held to the sparse unique constraint, and duplicate phones remain hard-blocked. Identity is established by FR-REG-03 and FR-REG-04, which are materially stronger signals than SMS receipt and are not restricted to a single country. The registration flow never populates `phoneVerifiedAt`; legacy values are ignored and retained without migration. `register/request` still reports which channels it issued and always returns `["email"]`. | No second account has the same phone or canonical country identifier. An Indian registration without a PAN in the required format is rejected; a non-Indian registration may omit its tax identifier, but payout remains blocked until the applicable identifier is supplied. The name exists only in the owning profile, and no registration document or address is collected. Only email OTP is issued and required, the SMS adapter is not called, and new registration records do not populate `phoneVerifiedAt`. A supplied phone OTP is rejected. Existing `phoneVerifiedAt` and `phoneOtpChallenge` values are never read and remain stored without migration or clearing. A repeated device fingerprint creates a review flag visible to FR-REG-07 and does not by itself prevent sign-up. |
| FR-REG-02 | [P1] Multi-step profile wizard (personal, education, taxonomy skills, languages, experience, samples, availability, rate) with save-and-resume. | Resume incomplete profile; completion % shown. |
| FR-REG-02A | [P1] Authenticated session transport (added v2.9; prerequisite for FR-REG-02 save-and-resume). **Cookies and lifetime.** The FR-FND-02 / FR-REG-01 token pair is held in first-party cookies set by the **web** origin, named with the `__Host-` prefix, `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no `Domain` attribute. The access-token and cookie lifetime is 15 minutes; the refresh-token, cookie and durable session lifetime is 30 days. The 30-day lifetime was reviewed and deliberately retained: monthly OTP re-authentication is acceptable and a longer lifetime would enlarge the lost-device exposure while no remote session-revocation endpoint exists. Internal-role accounts also remain at 30 days, and granting an internal role revokes every existing refresh session for that account before the role becomes usable. Re-authentication after expiry or revocation is by the existing one-time email code. Passwords were considered and rejected: they would add password storage, a reset flow with single-use expiring tokens, further rate limiting and brute-force protection, and permanent credential-stuffing exposure from passwords reused on breached sites, all to address friction that a 30-day session already avoids. No remote session-revocation endpoint is added here; a lost device therefore remains a recorded risk requiring a separate FR if remote revocation is introduced. No token value is ever written to `localStorage`, `sessionStorage`, or any JavaScript-readable store. **Route matrix (normative).** Called **directly** by the browser, retaining IP-keyed rate limiting: `POST /api/v1/auth/register/request` and `POST /api/v1/auth/otp/request` — `register/request` because its device fingerprint derives from the real client IP, user-agent and accept-language, and both because per-IP abuse limiting is the point of the endpoint. Called **only** through same-origin Next.js Route Handlers: `register/verify`, `otp/verify`, `refresh`, `logout`, and all authenticated API traffic. **Rate limiting.** Delivery is staged: `otp/verify` and `register/verify` retain their IP-keyed `ThrottlerGuard` alongside their existing per-identifier limiters until the same-origin Route Handlers ship, and that IP guard is removed only in the web-transport slice when those endpoints actually become server-originated. `refresh` and `logout` use pre-mutation active-session classification immediately: cryptographically verify the subject, digest the token, then inspect durable `refreshSessions` state. An active session requires `revokedAt` to be absent and `expiresAt` to be in the future; explicit `revokedAt: null` is inactive and mapping code must never normalise null to missing. Separate endpoint-scoped active and inactive subject buckets plus a constant invalid-token bucket are enforced before rotation or revocation, and refresh and logout never share a namespace. The IP-keyed limit on the direct endpoints is unchanged. **CSRF.** Every state-changing Route Handler validates the `Origin` header against an exact allow-list with an explicit rejection policy when the header is absent, plus Fetch Metadata validation or a CSRF token. `SameSite=Lax` is defence-in-depth only, because sibling `*.eqourse.com` origins are same-site and `www.eqourse.com` is vendor-deployed and out of scope. **Handling.** Token-bearing API responses are consumed server-side and never appear in Route Handler JSON, logs, cache, the DOM or an RSC payload; authenticated responses carry `Cache-Control: no-store`. **Session read (added v2.12).** `GET /api/v1/auth/session` is the first authenticated endpoint in the API: it carries no `@Public` marker, is gated by the existing `JwtAuthGuard`, and returns **only the caller's own** user account plus its unique owning `profiles` record — `userId`, `email`, `roleAssignments` and `profileState`; `profileState` is read from `profiles`, not `users`. It must never return `phone`, `countryIdentifiers`, `otpChallenge`, `refreshSessions`, `deviceFingerprints`, `reviewFlags` or any token, and it carries `Cache-Control: no-store`. An absent, malformed or expired access token returns 401 with no indication of whether the subject exists. `StoredUser` and its Mongoose mapping remain authentication-only; the unique owning `profiles` mapping supplies `profileState` to this response. This endpoint exists so that FR-REG-02A's cookie transport is provable end to end rather than merged untested, and so that FR-REG-02 can resolve who returned and where they left off. **Configuration.** `API_URL` remains server-only for Route Handlers. `NEXT_PUBLIC_API_URL` remains available **only** to the direct public endpoints above, whose real client network identity is required; authenticated traffic never uses it. The API's CORS posture is unchanged and `credentials` remains `false`. Refresh rotation is server-side and replaces the cookie on every refresh; a rotated-then-reused token fails closed per FR-FND-02. Sign-out clears both cookies **and** revokes the refresh session server-side; clearing a cookie without durable revocation is never sufficient. | A user with an expired access cookie and a valid refresh cookie reaches `GET /api/v1/auth/session` through a same-origin Route Handler without re-authenticating, receives their own `userId`, `email`, `roleAssignments` and `profileState`, and the rotated refresh token replaces the cookie. Tests prove: access and refresh cookies expire after 15 minutes and 30 days respectively; no password or password-recovery path exists; granting an internal role revokes all existing refresh sessions before that role is usable; no token value appears in `localStorage`, `sessionStorage`, the DOM, an RSC payload or logs; session cookies carry `__Host-`, `HttpOnly`, `Secure` and `SameSite=Lax`; a rotated refresh token is rejected on reuse; sign-out revokes server-side so the cleared cookie value cannot be replayed; unsafe Route Handler requests are rejected both from an unrelated cross-site origin and from an untrusted sibling `*.eqourse.com` subdomain; `register/request` is still called directly and still yields a distinct fingerprint per client; and many distinct users refreshing concurrently do not trip a shared-IP limit. |
| FR-REG-02B | [P1] Profile-wizard draft slice (added v2.19; lands before the full FR-REG-02): personal, education, taxonomy skills, languages, experience, availability and rate, with save-and-resume using the authenticated FR-REG-02A session transport. The authenticated API surface is `GET /api/v1/profiles/me`, which returns the caller's persisted draft plus a computed `completionPercentage`, and `PATCH /api/v1/profiles/me`, which partially saves that draft; there is no `POST` because registration and the migration together guarantee the owning profile exists. `completionPercentage` is computed on read and never persisted, so it cannot drift from the data it describes, and client input never accepts `state`. Draft persistence and submission validation are separate contracts: a partial `DRAFT` is accepted and stored, while strict completeness validation applies only at submission; one strict schema must never be used for both. Completion percentage is `satisfied required checks / 20 × 100`, using this fixed denominator: personal first and last name (2); the first education entry's institution, qualification, field of study and start year (4); the first taxonomy skill's `taxonomySlug` and level (2); the first language's code and proficiency (2); experience total months plus the first experience entry's organization, title and start date (4); availability start date, weekly hours and time zone (3); and rate amount in integer minor units, currency code and unit (3). Optional fields and additional array entries never change the denominator. Work samples and every file upload remain in FR-REG-02; AI resume parsing remains in FR-REG-10; and the `DRAFT → SUBMITTED` transition remains in FR-REG-06 with its existing guard and audit requirement. No copy may claim review, approval or verification before it has occurred. | A user who closes the browser mid-wizard and returns through the FR-REG-02A transport resumes at the last recorded section with entered data intact; a partial draft persists without rejection for incompleteness; the displayed percentage matches the fixed 20-check denominator and never falls merely because the user adds data; every selected skill resolves to a real `skillTaxonomy.slug`; and `GET /api/v1/auth/session` exposes no profile field except `profileState`. |
| FR-REG-02C | [P1] Sign-in interface (added v2.23): a working `/login` signs an existing account in by email OTP, supports sign-out, and links to `/register` in one action; `/register` links back to `/login` in one action. It consumes the existing `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify` and `POST /api/v1/auth/logout` under FR-REG-02A's normative route matrix and session transport; no new API endpoint is introduced. After sign-in, the destination is determined in this order: first, an existing vendor or client record owned by the user determines that company's status destination; second, if the user owns neither record, a role assignment that grants access to an internal surface routes the user to that surface as defined by its owning FR; otherwise, the user reaches the registration chooser. Owned company records remain the first determinant, and `roleAssignments` never selects or overrides a company destination: a stale company role such as `VENDOR` without its corresponding record must not route the user into a company wizard that creates an empty draft record for a company they do not have. The middle step applies only to roles granting internal surfaces, because internal roles own no company by design; without it, every Verifier, Project Manager and QA Reviewer would be sent to a registration form. Unknown and known email addresses have the same visible OTP-request outcome. The platform has no passwords: the interface neither collects nor suggests one or offers password recovery. `/login` retains `robots.index:false` and remains excluded from the sitemap. Registration, the profile wizard, role-assignment management and implementation of internal surfaces are out of scope. | A registered vendor or client signs in and reaches their own company's status, which takes precedence over any role assignment; a user owning neither company record but holding a role that grants an internal surface reaches that surface; a stale company role without its corresponding record never selects a company wizard; and a user with neither an owned company record nor an internal-surface role reaches `/register`. Sign-out ends the session; no token is readable from JavaScript; an unknown address produces the same visible OTP-request outcome as a known one; `/login` and `/register` each link to the other; and the "not open yet" copy is gone. |
| FR-REG-03 | [P1] KYC capture: govt ID, selfie liveness, address proof via KYC API adapter. | ID validity + face-match score stored; raw Aadhaar never stored. |
| FR-REG-04 | [P1] Bank penny-drop verification; PAN mandatory; UPI optional. | Name-match score stored; payouts blocked until verified. |
| FR-REG-05 | [P1] In-flow e-sign of NDA + freelancer agreement. | Signed PDF stored with timestamp + IP. |
| FR-REG-06 | [P1] Profile state machine: Draft→Submitted→Under Review→Test Pending→Test Passed→Approved (+Rejected / More-Info-Needed). | All transitions audit-logged with actor + reason. |
| FR-REG-07 | [P1] Verifier console: 48h SLA queue, docs + API results side-by-side, approve/reject with reason templates, request-more-info. | Clean profile processed in <3 minutes. |
| FR-REG-07A | [P1] Company verification console (the first role-gated surface): a queue of submitted vendors and clients, an authorised single-record view, and decisions to approve, reject or request more information where the company state machine permits. Authentication alone is insufficient: only a Verifier role assignment may reach the console and its actions through the existing `RolesGuard`, regardless of business unit. Company verification is not business-unit scoped: KYB establishes a legal entity's identity across business units; clients have no capabilities from which to derive a business unit; and one business-unit field would misrepresent vendors serving both. Business-unit scoping belongs to work allocation and delivery roles. FR-REG-07A owns `SUBMITTED → UNDER_REVIEW` and `UNDER_REVIEW → MORE_INFO_NEEDED or REJECTED` for both company types, and `UNDER_REVIEW → APPROVED` for clients. It never transitions a vendor to `ACTIVE`: that state confers eligibility to bid, invite members and allocate work, so `UNDER_REVIEW → ACTIVE` remains in FR-REG-08, gated on signatory KYC and MSA e-signature per F2. Every transition is audit-logged with actor, human-written reason and server timestamp per FR-REG-06; the guarded state change and append-only audit insert commit in one MongoDB multi-document transaction, or neither occurs. Every transition, including entry into review and client approval, requires a non-empty human-written reason; rejection and more-information decisions cannot proceed without one. Queue results contain only opaque record ID, company type, state and submission time; worker and company PII appears only in the authorised single-record view. Documents open through short-lived pre-signed GET URLs issued per request through `StorageAdapter` to an authorised Verifier; the encrypted-private bucket has no public access, public development URL or custom domain, and signed URLs are credentials that are never logged. Check object existence before offering access; a valid document reference with no stored object is shown as "document not found in storage" rather than a broken link or silent 404, because saving validates key shape but not object existence. Signatory KYC, UBO declaration, sanctions screening, MSA e-signature and automated KYB provider checks remain in FR-REG-08. FR-REG-07’s 48-hour queue creates no countdown or turnaround-time promise here unless the business commits to one. | Only a Verifier reaches the console regardless of business unit, and an authenticated non-Verifier is refused. Client approval, rejection and more-information without a reason are refused; each successful decision writes an audit entry naming the actor and reason. A document opens through an expiring signed GET URL and a missing object is reported. The queue exposes no worker or company PII, and only the authorised single-record view can show identifying values or documents. A vendor cannot become `ACTIVE` through this console. |
| FR-REG-08 | [P1] Vendor KYB: GST/Udyam, company PAN, incorporation, cancelled cheque, signatory KYC, MSA e-sign, capability profile. | Vendor cannot bid until KYB approved. |
| FR-REG-08A | [P1] Vendor account sign-up and company profile capture: company legal name, trading name, country, registered address, contact person, capability profile drawn from `skillTaxonomy`, bank details and bank proof, and the identifier and document set required for the vendor's country. Country selection drives requirements through the shared company country registry, generalised by FR-REG-15 to serve vendors and clients, per Section 14 and FR-REG-13: India GST/company PAN/Udyam; US incorporation/EIN/W-9; UK Companies House/VAT; EU VIES VAT; Singapore ACRA/UEN; China unified social credit code; rest of world incorporation/tax ID/bank proof. The form never presents India-only identifiers to a non-Indian vendor, and a vendor from any supported country can complete registration without encountering an inapplicable field. Documents are collected, not verified, and upload to the encrypted-private R2 bucket through `StorageAdapter` using pre-signed URLs. Bank details and bank proof are captured, but this FR performs no bank verification or automated KYB screening. Submission transitions the vendor to `SUBMITTED` and tells them their registration is under review by the compliance team; the interface never implies automated or completed verification and states no turnaround time unless the business has committed to it. Signatory KYC, UBO declaration, sanctions screening, MSA e-signature, automated KYB provider checks and the vendor transition to `ACTIVE` remain in FR-REG-08; verifier triage, rejection and requests for more information belong to FR-REG-07A and are out of scope here. | A vendor from each of at least India, Singapore, China and one EU country can complete registration end to end and sees only identifiers valid for their country; documents land in the private bucket and are never publicly readable; the vendor record persists in `SUBMITTED` with `submittedAt`; and no copy claims verification that has not occurred. |
| FR-REG-15 | [P1] Client company registration and verification: FR-REG-15 adds the Client option to the existing `/register` chooser and the `/register/client` route for client account sign-up and company profile capture: legal name, trading name, country, registered address, website, contact person, one authorised person's government identity document, and the identifier and document set required for the client's country. FR-REG-08A's country registry is generalised to companies and shared by vendors and clients, so each country uses the same applicable identifiers for both actors — including EU VAT for a German company — and adding a country remains a registry data change. No bank account or payment instrument of any kind is collected: clients pay the platform and are not paid by it; billing identity (legal entity name, billing address and tax registration number) is captured later at NDA stage and is specified in forthcoming patch 3. Documents are collected, not verified, and upload to the encrypted-private R2 bucket through `StorageAdapter` using pre-signed URLs; this FR performs no automated KYB screening. Submission transitions the client to `SUBMITTED` and tells them registration is under review; the interface never implies automated or completed verification and states no turnaround time the business has not committed to. A requirement may be submitted while verification is pending, but no PM review occurs until the company is `APPROVED`; the requirement record is forthcoming in patch 2. The requirement record, negotiation, agreements, invoicing and client-facing delivery views are out of scope. | A client from each of at least India, Singapore, China and one EU country completes registration seeing only identifiers valid for their country; documents land in the private bucket and are never publicly readable; the client record persists in `SUBMITTED` with `submittedAt`; no bank account or payment-instrument field exists anywhere in the flow; and no copy claims verification that has not occurred. |
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
| FR-CRM-01 | [P2] Client-created accounts under FR-REG-15: contacts, contracts/NDAs, rate cards, preferred/blocked talent. | Blocked talent never auto-matched to that client. |
| FR-CRM-02 | [P2] Pipeline Lead→Qualified→Proposal→Won→Active→Renewal; Won auto-creates project shell. | Stage history reportable. |
| FR-CRM-03 | [P3] Client health page: projects, revenue, margin, SLA, renewals. | One page per client. |
| FR-CRM-04 | [P3] White-label client portal for requirement submission, agreement signing and deliverable approval. | Client never sees worker PII or costs. |

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

**F3 Project lifecycle:** {CRM Won | accepted client requirement under F6} → PM creates project → staffing mode {open board | auto-match invites | vendor RFP} →
selection pipeline → work orders e-signed → task batches distributed → execution + gold tasks + sampling QA →
QA gate (accept/rework) → deliverable → client acceptance → client invoice → payouts (TDS/GST) → scorecards archived.

**F4 Task states:** QUEUED → IN_PROGRESS → SUBMITTED → {IN_QA | AUTO_ACCEPT} ; IN_QA → {ACCEPTED | REWORK → SUBMITTED | REJECTED};
IN_PROGRESS → EXPIRED → requeue.

**F5 Finance:** Accepted work → EarningLine → cycle close → auto TDS/GST → Finance batch approval →
payout API → webhook success/fail (fail → retry queue) → worker dashboard + payslips; margin analytics fed continuously.
**F5 PayoutBatch state enum (normative):** PENDING → APPROVED → PROCESSING → SUCCEEDED | FAILED → RETRY_QUEUED → PROCESSING; CANCELLED reachable from PENDING/APPROVED only (admin action, audit-logged). EarningLine.status: ACCRUED → LOCKED_IN_BATCH → PAID | FAILED | DISPUTED.

**F6 Client onboarding and engagement:** Sign-up → company profile + KYB documents → requirement submitted (permitted while company verification is pending; requirement record forthcoming in patch 2) → Verifier approves company → PM review + structured negotiation → client selects contracting entity → NDA signed + billing identity captured → pilot invoiced → pilot payment received → pilot project delivered → client accepts pilot and its accepted output becomes the quality standard → master agreement signed → advance invoiced → advance payment received → main delivery under F3 → closeout with rework window → review → testimonial. The paid pilot and the main delivery are both projects under one engagement, so staffing, task distribution, QA and payouts are reused rather than duplicated; the engagement record is forthcoming in patch 3.
**F6 rules:** No delivery work begins before the corresponding payment is received. Service-layer transition guards enforce this at both the pilot-payment and advance-payment gates; UI state cannot bypass either guard. Nothing entered by the client is a commitment until a PM accepts it. Stated budget, volume and dates are negotiation inputs, and no interface copy may imply that a price is agreed before PM acceptance.
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
Country selector at sign-up (FR-REG-11) drives the document checklist. For freelancers and vendors, country determines the contracting entity automatically (India → eQOURSE India; rest of world → eQOURSE PTE LTD Singapore). For clients, country determines the registry-backed set of entities that may be offered, and the client selects from within that set under F6; the registry is data in the same shape as the country registry, and offering both entities everywhere may be its current data default but is not a rule. The registry also carries each entity's tax treatment, which is deliberately unspecified pending professional advice. Primary IDV: one global provider (Sumsub/Onfido/Persona/Veriff/Stripe
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
About-Trust / Login / Register (role question → Freelancer|Vendor wizard; country select; Client option added by FR-REG-15).
FREELANCER: register → verify → country → 5-step profile wizard → per-country KYC step (live status chips) →
payout setup → e-sign → under-review (SLA countdown) → Test Center (proctoring pre-check) → proctored test →
result (badge/tier or cooldown) → Dashboard (tier badge, quality ring, earnings, next payout, recommended jobs)
→ Workbench (task center, SOP side panel, timer, rework banner).
VENDOR: company register → KYB checklist → signatory KYC → capability → MSA → dashboard → Team mgmt
(email/CSV invites, member KYC/test/quality table) → allocation board (drag task groups, capacity bars) →
RFP list/detail → bid composer → tracker.
PM (delivery lead; no margin/finance visibility): My Projects, New-project wizard (budget over limit → SA approval),
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
migrate-mongo. Collections mirror Section 8 entities (users, profiles, vendors, vendorMembers,
documentsVault[files in R2], tests, testAttempts, skillTaxonomy, clients, projects, jobPosts, applications,
workOrders, taskBatches, tasks, qaReviews, earningLines[APPEND-ONLY], payoutBatches, invoices, milestones,
auditLogs[APPEND-ONLY], notifications, announcements, messages). MANDATORY: multi-document transactions for all
ledger/payout writes; state machines as enums + service-layer guards. If finance outgrows Mongo, isolate ledger
into small Postgres service later via adapter.
The `vendors`, `profiles`, `clients` and `auditLogs` collections are specified in Section 19.2.

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

**users** — one document per platform account.
```
{
  _id: ObjectId,
  email: string,                               // required, unique, lowercase, trimmed
  phone: string,                               // E.164 incl. country code; required for freelancer sign-up; unique when present; ABSENT when unknown — never stored as explicit null
  phoneVerifiedAt: Date | null,                // retained for compatibility; never populated by registration after v2.18
  countryCode: string,                         // required, ISO 3166-1 alpha-2; drives FR-REG-11 document checklist; determines the contracting entity automatically for freelancers/vendors and the registry-backed permitted entity set for clients under F6
  countryIdentifiers: Array<{                  // required, default []; country-driven individual tax identifiers
    scheme: string,                            // e.g. PAN; canonical scheme from the individual country registry
    value: string,                             // protected identifier value; never indexed in plaintext
    lookupDigest: string                       // required; sparse unique keyed digest of scheme + canonical value
  }>,
  roleAssignments: Array<{ role, businessUnit }>,   // required, default []
  deviceFingerprints: Array<{                  // append-only; never used to auto-block
    hash: string, firstSeenAt: Date, lastSeenAt: Date
  }>,
  reviewFlags: Array<{                         // raised to the FR-REG-07 verifier queue
    kind: "DUPLICATE_DEVICE", detail: string, raisedAt: Date, resolvedAt: Date | null
  }>,
  otpChallenge?: { digest, expiresAt, wrongAttempts },        // email OTP (FR-FND-02)
  refreshSessions: Array<{ digest, expiresAt, createdAt, revokedAt? }>,
  createdAt: Date, updatedAt: Date
}
```
Indexes: unique on `email`; sparse unique on `phone`; sparse unique multikey index on `countryIdentifiers.lookupDigest`; index on `deviceFingerprints.hash`.
Rules: `phone` uniqueness relies on a sparse index and on the field being absent rather than null. Every inapplicable or unknown country identifier is stored as an absent array entry, never as a placeholder or explicit BSON `null`; a sparse index skips a missing value but indexes explicit null. Each `countryIdentifiers.lookupDigest` is computed only after scheme-specific canonicalisation and is a keyed HMAC over the scheme plus canonical value using a dedicated individual-identifier server secret, so duplicates are detected without a plaintext identifier index. India requires a PAN entry at registration, canonicalised to uppercase and accepted only when it matches `^[A-Z]{5}[0-9]{4}[A-Z]$`; this is format validation only and performs no government lookup. For every other country, an identifier is optional at registration but required before payout; the registry deliberately omits jurisdiction requirements that are not yet known and is expected to grow. The former top-level `pan` field is replaced by `countryIdentifiers`, never dual-written as a second identifier mechanism, and any existing PAN value must be migrated into a `PAN` entry before the legacy field becomes inert. `countryIdentifiers[].value` is PII under Section 19's CSFLE requirement and must never appear in a list or search projection. PAN, GSTIN, UEN, CIN, LLPIN and every present or future individual tax identifier are never published: they must not appear in public page copy, meta tags or structured data. They are never logged in application logs, Sentry breadcrumbs or error context, and never placed in a URL or query string. Registration collects no document and no address. Personal names live authoritatively only at `profiles.personal.firstName` and `profiles.personal.lastName`; `users` has no name field and one must not be added for convenience. The Atlas custom application role already enumerates `users`, so this field change requires no collection-role grant. Raw OTPs are never stored, only digests. Documents that already carry `phoneVerifiedAt` or `phoneOtpChallenge` data retain it in place; the application never reads those values, and they are not migrated or cleared. A repeated `deviceFingerprints.hash` across accounts raises a `reviewFlags` entry and never blocks sign-up. `profileState` now lives only on `profiles` and must never be an active, mapped or writable field on both models at once. Legacy `users.profileState` values already present in production are retained unchanged as inert historical data after the insert-only profiles backfill described below; application code never reads or writes those legacy values after the backfill. `refreshSessions` is the only durable **server-side** session record. A refresh token lives client-side solely in a first-party `__Host-` httpOnly cookie on the web origin (FR-REG-02A) and is never placed in a JavaScript-readable store. Revoking a session means setting `revokedAt` on its `refreshSessions` entry — clearing the cookie alone is not revocation, because a copied cookie value would otherwise remain valid.

**vendors** — one document per vendor company account.
```
{
  _id: ObjectId,
  ownerUserId: ObjectId,                       // required, owning users reference
  state: VendorState,                          // required, default DRAFT
  legalName: string,                           // required before submission
  tradingName?: string,                        // absent when not supplied
  countryCode: string,                         // required, ISO 3166-1 alpha-2; drives the Section 14 / FR-REG-13 registry
  registeredAddress: {
    line1: string, line2?: string, city: string, region?: string, postalCode: string, countryCode: string
  },
  contactPerson: { name: string, email: string, phone: string },
  capabilities: Array<{ taxonomySlug: string }>,   // values must resolve to skillTaxonomy.slug
  countryIdentifiers: Array<{
    scheme: string,                             // data-driven registry code, e.g. GSTIN, UEN, EU_VAT, CN_USCC
    value: string,                              // PII protected by CSFLE; never public
    lookupDigest: string                        // keyed HMAC of scheme + scheme-canonical value; required when entry exists
  }>,
  bankDetails: {
    accountHolderName: string,
    bankCountryCode: string,
    currencyCode: string,
    accountIdentifier: { scheme: string, value: string },
    bankIdentifier?: { scheme: string, value: string }
  },
  documents: Array<{
    kind: string, objectKey: string, uploadedAt: Date   // metadata/reference only; object is in the encrypted-private R2 vault
  }>,
  submittedAt?: Date,                           // absent until first submission; never explicit null
  createdAt: Date, updatedAt: Date
}
```
Indexes: index on `ownerUserId`; index on `state`; index on `countryCode`; index on `capabilities.taxonomySlug`; sparse unique multikey index on `countryIdentifiers.lookupDigest`; index on `(state, submittedAt)` for the verifier queue.
Rules: `VendorState` is a distinct enum, never `ProfileState`: `DRAFT | SUBMITTED | UNDER_REVIEW | MORE_INFO_NEEDED | ACTIVE | REJECTED`. Legal service-layer-guarded transitions are `DRAFT → SUBMITTED`, `SUBMITTED → UNDER_REVIEW`, `UNDER_REVIEW → MORE_INFO_NEEDED | ACTIVE | REJECTED`, and `MORE_INFO_NEEDED → SUBMITTED`; FR-REG-08A performs only `DRAFT → SUBMITTED`; FR-REG-07A owns `SUBMITTED → UNDER_REVIEW` and `UNDER_REVIEW → MORE_INFO_NEEDED | REJECTED`, while `UNDER_REVIEW → ACTIVE` remains in FR-REG-08 after signatory KYC and MSA e-signature per F2. Draft persistence and submission validation are separate contracts: a partial `DRAFT` is accepted and stored, every business field may be absent while state is `DRAFT`, and completeness is enforced only by the submission guard on `DRAFT → SUBMITTED`; one strict schema must never serve both. The submission guard requires the country registry's applicable identifiers and document kinds, bank details, bank proof and taxonomy-backed capabilities, and sets `submittedAt` on first submission without later overwriting it. The same country registry maps each ISO country code to its required identifier schemes and document kinds and defines each scheme's canonical form, including case, whitespace and separator handling; adding a country or scheme is a registry data change, not a MongoDB schema migration. Each `lookupDigest` is computed only after scheme-specific canonicalisation and is a keyed HMAC over the scheme plus canonical value using a dedicated server secret, following the OTP-digest pattern; rotating that key invalidates the uniqueness index and requires recomputing the digests and rebuilding the index. Every inapplicable or unknown country identifier is stored as an absent array entry, never as a placeholder or explicit BSON `null`; a sparse index skips a missing value but indexes explicit null. `countryIdentifiers[].value` and the whole of `bankDetails` are PII under Section 19's CSFLE requirement and must never appear in any list or search projection; they may appear only in a single-record view for an authorised verifier. PAN, GSTIN, UEN, CIN, LLPIN and street addresses must never appear in public page copy or structured data. `documents` stores only R2 object metadata/references, never file contents; objects are uploaded through `StorageAdapter` with pre-signed URLs and remain in the encrypted-private bucket. FR-REG-08A records collected data only: it adds no bank-verification, automated-KYB or completed-verification result.


**profiles** — one document per platform account.
```
{
  _id: ObjectId,
  userId: ObjectId,                            // required, unique owning users reference
  state: ProfileState,                         // required, default DRAFT; existing Section 6 enum
  resumeSection?: ProfileSection,              // absent on a new profile; last section visited once navigation begins
  personal?: {
    firstName?: string, lastName?: string, headline?: string, city?: string
  },
  education?: Array<{
    institution?: string, qualification?: string, fieldOfStudy?: string,
    startYear?: number,                        // integer, 1900 through current year + 10
    endYear?: number                           // same range; when both years exist, not earlier than startYear
  }>,
  skills?: Array<{
    taxonomySlug?: string,                     // when present, must resolve to skillTaxonomy.slug
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
  }>,
  languages?: Array<{
    languageCode?: string,                     // valid BCP 47 language tag
    proficiency?: "BASIC" | "CONVERSATIONAL" | "PROFESSIONAL" | "NATIVE"
  }>,
  experience?: {
    totalMonths?: number,                      // integer, 0 through 960
    entries?: Array<{
      organization?: string, title?: string, startDate?: Date,
      endDate?: Date,                          // when both dates exist, not earlier than startDate
      summary?: string
    }>
  },
  samples?: Array<{
    title?: string, objectKey?: string, uploadedAt?: Date   // metadata/reference only; object is in the encrypted-private R2 vault
  }>,
  availability?: {
    availableFrom?: Date,
    weeklyHours?: number,                      // integer, 1 through 168
    timeZone?: string                          // valid IANA time-zone identifier
  },
  rate?: {
    amountMinor?: number,                      // integer minor units, greater than zero; never a float
    currencyCode?: string,                     // ISO 4217, exactly three uppercase letters
    unit?: "HOUR"
  },
  createdAt: Date, updatedAt: Date
}
```
Indexes: unique on `userId`; index on `state`; index on `skills.taxonomySlug`; index on `(state, updatedAt)`.
Rules: `ProfileState` and the existing `canTransitionProfile` guard owned by FR-REG-06 are reused; no second profile state machine is permitted. Every platform account owns one profile because profile state applies to every account while profile content applies only to accounts that complete the wizard; registration writes `roleAssignments: []`, so no persisted freelancer flag exists on which to branch. A vendor owner or staff user therefore correctly owns an empty `DRAFT` profile rather than representing a missing record. `ProfileSection` is one shared definition used by both the persistence schema and wizard navigation, with values `PERSONAL | EDUCATION | SKILLS | LANGUAGES | EXPERIENCE | SAMPLES | AVAILABILITY | RATE`; it must never be copied into a second UI-only list that can drift. `resumeSection` is absent on a freshly created profile and is set only after the user begins navigating the wizard. Draft persistence and submission validation are separate contracts: a partial `DRAFT` is accepted and stored, every business field may be absent while state is `DRAFT`, and completeness is enforced only by the submission guard on `DRAFT → SUBMITTED`; one strict schema must never serve both. The field bounds above apply only when their fields are present. The 168-hour weekly ceiling is the number of hours in a week and is an outer bound on absurd input, not a workload policy; a rate must be greater than zero because zero is not a rate and could accidentally allow someone to be booked for nothing; and the education-year ceiling permits an expected graduation date up to ten years ahead. Completion is computed against FR-REG-02B's fixed twenty-check denominator. The first experience entry is always required and always counted, so the denominator cannot rise when experience data is added. Optional fields and additional array entries never affect it. Every `skills[].taxonomySlug` must resolve to an existing `skillTaxonomy.slug`, including a deprecated-but-existing slug, and taxonomy labels are never duplicated here. This is deliberate because FR-FND-03A never deletes taxonomy rows: a previously selected skill remains resolvable when retired, while new selections remain constrained to ACTIVE rows because `GET /api/v1/skill-taxonomy` exposes only ACTIVE rows; filtering belongs to that read endpoint, not profile validation. Optional values are stored absent, never as explicit BSON `null`; in particular, any future optional field carrying a unique constraint must be absent when unknown because a sparse index still indexes explicit null. `samples` stores only R2 metadata/references, never file contents, and its uploads remain in FR-REG-02 through `StorageAdapter`. Identifying data — all of `personal`, `education`, `experience.entries`, and `samples` including titles and object keys — is PII under Section 19, is protected accordingly, and must never appear in a list or search projection; it may appear only in an authorised single-record view. Matching facets — `skills`, `languages`, `experience.totalMonths`, `availability` and `rate` — may be indexed or projected only for an authorised matching use case specified by its owning FR. No profile data is public.

Migration rules: moving `profileState` is a one-time, manual-gated production migration under Section 20. Before any migration write, it preflights every legacy `users.profileState`: an absent or explicit BSON `null` value normalises to `DRAFT`, exactly matching the existing authentication mapping, and a present non-null value must be a valid `ProfileState`. Any present non-null invalid value aborts the whole migration without coercing, skipping or defaulting that user and without changing any data; corruption is a data problem for a human to correct, after which the unchanged migration is safe to re-run. After a successful preflight, for every existing `users` document without a `profiles` document, the migration performs an idempotent upsert keyed by `userId` using `$setOnInsert` only, copying a valid legacy state exactly and using `DRAFT` when the legacy field was absent or null; it never updates an existing profile and never modifies, clears or deletes any user data. Re-running it is safe. The application release that precedes the migration creates the required `profiles` document directly for every new sign-up and no longer writes `users.profileState`; therefore a user who signs up between deployment and the gated migration already has a profile, and the backfill skips that user. After the migration succeeds, `profiles.state` is the sole authoritative value and legacy `users.profileState` data remains stored but is never mapped, read or written.

**clients** — one document per client company account.
```
{
  _id: ObjectId,
  ownerUserId: ObjectId,                       // required, owning users reference
  state: ClientState,                          // required, default DRAFT
  legalName?: string,
  tradingName?: string,
  countryCode?: string,                        // ISO 3166-1 alpha-2; drives the shared company country registry
  registeredAddress?: {
    line1: string, line2?: string, city: string, region?: string, postalCode: string, countryCode: string
  },
  website?: string,
  contactPerson?: { name: string, email: string, phone: string },
  authorisedPerson?: {
    name: string,
    governmentIdentityDocument: {
      kind: string, objectKey: string, uploadedAt: Date   // metadata/reference only; object is in the encrypted-private R2 vault
    }
  },
  countryIdentifiers?: Array<{
    scheme: string,                             // shared registry code, e.g. GSTIN, UEN, EU_VAT, CN_USCC
    value: string,                              // PII protected by CSFLE; never public
    lookupDigest: string                        // keyed HMAC of scheme + scheme-canonical value; required when entry exists
  }>,
  documents?: Array<{
    kind: string, objectKey: string, uploadedAt: Date   // company-document metadata/reference only; object is in the encrypted-private R2 vault
  }>,
  submittedAt?: Date,                           // absent until first submission; never explicit null
  createdAt: Date, updatedAt: Date
}
```
Indexes: index on `ownerUserId`; index on `state`; index on `countryCode`; sparse unique multikey index on `countryIdentifiers.lookupDigest`; index on `(state, submittedAt)` for the verifier queue.
Rules: `ClientState` is a distinct enum, never `VendorState` or `ProfileState`: `DRAFT | SUBMITTED | UNDER_REVIEW | MORE_INFO_NEEDED | APPROVED | REJECTED`. Legal service-layer-guarded transitions are `DRAFT → SUBMITTED`, `SUBMITTED → UNDER_REVIEW`, `UNDER_REVIEW → MORE_INFO_NEEDED | APPROVED | REJECTED`, and `MORE_INFO_NEEDED → SUBMITTED`; FR-REG-15 performs only `DRAFT → SUBMITTED`, while FR-REG-07A assigns a Verifier the `SUBMITTED → UNDER_REVIEW` and `UNDER_REVIEW → MORE_INFO_NEEDED | APPROVED | REJECTED` transitions. `ClientState` ends in `APPROVED` because it records company verification only; `VendorState` ends in `ACTIVE` because vendor approval also confers operational eligibility to bid, invite members and allocate work under F2, while a client's commercial activity belongs to the forthcoming engagement lifecycle. Draft persistence and submission validation are separate contracts: a partial `DRAFT` is accepted and stored, every business field may be absent while state is `DRAFT`, and completeness is enforced only by the submission guard on `DRAFT → SUBMITTED`; one strict schema must never serve both. The submission guard requires all applicable FR-REG-15 business fields, the shared company country registry's identifiers, the client's applicable document kinds, and one authorised person's government identity document, and sets `submittedAt` on first submission without later overwriting it. The shared company country registry serves vendors and clients and maps each ISO country code to the same required identifier schemes for both actors, while required document kinds are per-actor so vendor-only bank proof is never required or collected from a client; the registry defines each identifier scheme's canonical form, including case, whitespace and separator handling. Adding a country or scheme is a registry data change, not a MongoDB schema migration. Each `lookupDigest` is computed only after scheme-specific canonicalisation and is a keyed HMAC over the scheme plus canonical value using a client-identifier secret separate from the vendor-identifier secret. This domain separation permits independent rotation and prevents unnecessary cross-role equality correlation, but it also means the platform cannot detect from these digests that the same company registered as both a vendor and a client; if compliance later needs related-party conflict detection, it must be specified and built deliberately as a separate mechanism under its own key, used only by compliance, rather than sharing either actor's secret. Rotating the client key invalidates the client uniqueness index and requires recomputing its digests and rebuilding that index. Every inapplicable or unknown country identifier is stored as an absent array entry, never as a placeholder or explicit BSON `null`; every optional value carrying a unique constraint is stored absent when unknown because a sparse index skips a missing field but indexes explicit null. `countryIdentifiers[].value`, registered and future billing addresses, contact-person and authorised-person data, government identity documents, and any future billing identity are PII under Section 19's CSFLE requirement and must never appear in a list or search projection; they may appear only in an authorised single-record view. PAN, GSTIN, UEN, CIN, LLPIN and street addresses must never appear in public page copy or structured data. The authorised person's government identity document is subject to the same handling constraints as FR-REG-03: raw Aadhaar is never stored, and where an Indian authorised person's identity is captured, only the masked or reference form is used. This content constraint cannot be enforced at upload time because pre-signed uploads send file contents directly to R2 without passing through the API; it is enforced by the capture interface before upload and by human verification before approval. `authorisedPerson.governmentIdentityDocument` and `documents` store only R2 object metadata/references, never file contents; objects are uploaded through `StorageAdapter` with pre-signed URLs and remain in the encrypted-private bucket. No bank account, bank proof, billing identity or payment instrument exists in this schema. FR-REG-15 records collected data only: it adds no automated-KYB or completed-verification result.

**auditLogs** — one immutable entry per audited state transition; FR-REG-07A writes entries for vendor and client reviews.
```
{
  _id: ObjectId,
  actorUserId: ObjectId,                      // required, authenticated users reference
  subjectCollection: string,                 // required; vendors or clients for FR-REG-07A
  subjectId: ObjectId,                       // required, record in subjectCollection
  fromState: string,                         // required, state before the transition
  toState: string,                           // required, state after the transition
  reason: string,                            // required, human-written rationale without reviewed PII
  occurredAt: Date                           // required, server timestamp
}
```
Indexes: compound on `(subjectCollection, subjectId, occurredAt)` for one record's history; compound on `(actorUserId, occurredAt)` for one actor's actions.
Rules: Append-only is enforced today in application code by the insert-only audit repository and the absence of any update or delete path. The current `api-dev` Atlas application user has ordinary `readWrite`, which does not prevent updates or removes on `auditLogs`. Before FR-REG-07A is deployed, replace that broad grant for the application principal and configure and verify a restricted Atlas custom database role. Grant `FIND`, `INSERT`, `UPDATE`, `REMOVE` and `CREATE_INDEX` separately on each of `users`, `skillTaxonomy`, `vendors` and `clients`; grant only `FIND`, `INSERT` and `CREATE_INDEX` on `auditLogs`, with no `UPDATE` and no `REMOVE` there, ever. The custom role must not inherit the built-in `readWrite` role on `eqplus` or any other database-wide or broader privilege that covers `auditLogs`: MongoDB privileges are additive, so such inheritance would silently restore `UPDATE` and `REMOVE` on the append-only collection. `CREATE_INDEX` is permitted because the application connects with Mongoose's default `autoIndex: true` and builds each schema-declared index on connect; creating an index changes index metadata, not an existing audit entry, and is required for the two compound `auditLogs` indexes above. Do not grant `LIST_INDEXES` or `DROP_INDEX`; the automatic Mongoose initialization path requires neither. Because the role enumerates collections, adding any collection — `profiles` under FR-REG-02B is next — requires updating the Atlas custom role before deployment or the application will fail at runtime when it first accesses that collection. This database-role change is a required deployment prerequisite, with the same release-gate weight as configuring the HMAC secrets. `fromState` and `toState` provide before/after state values for these transitions; never copy whole company records, identifiers, document keys, signed URLs or other reviewed data into the log. Every state transition and audit insert use the same MongoDB session and multi-document transaction; if either write, audit validation or commit fails, neither change persists. The verifier supplies a non-empty human-written reason for every transition, including entry into review and client approval; actor and timestamp are never client-supplied. Before insertion, reject reasons containing known values from the reviewed record after normalisation, and reject email, phone and country-identifier patterns; the UI instructs verifiers to describe decisions without copying reviewed data. Free-text validation cannot prove that a reason contains no PII, so human care remains necessary; do not silently redact and persist an uncorrectable entry. Future optional fields are stored absent, never as explicit BSON `null`.

## 20. Deployment (no physical servers)
Vercel (Next.js, plus.eqourse.com CNAME, PR previews = web staging) · GCP Cloud Run asia-south1 (NestJS API + future BullMQ workers; Node 22 LTS; Docker; staging + approval-gated prod services; Workload Identity Federation from GitHub Actions) · Upstash Redis · MongoDB Atlas · Cloudflare R2 (buckets: kyc-docs encrypted-private,
project-assets, deliverables; pre-signed URLs) · Resend/SES for email. The provider-agnostic `SmsAdapter` port remains with its sandbox implementation; no SMS provider is configured, and any future provider must work globally rather than depend on a single-country registry. · Auth0 or Keycloak ·
GitHub Actions CI/CD (prod migrations manual-gated) · Secrets: Doppler → synced to Vercel/Railway; never in repo;
per-env sandbox keys (all providers have sandboxes — staging uses them) · Sentry + BetterStack + Atlas alerts.

### 20.1 Atlas connectivity decision (v2.4, conscious tradeoff)
Cloud Run egress IPs are dynamic and Atlas M0 supports neither PrivateLink nor VPC peering. Decision: the DEV
cluster's IP access list is opened to 0.0.0.0/0, accepted because it holds only seed/dev data, requires SCRAM auth
with a rotated least-privilege user over TLS, and costs nothing. This is FORBIDDEN for any cluster holding real
user data: when the production cluster (Flex/M10) is created in Phase 5, it MUST use static egress (VPC connector
+ Cloud NAT with allowlisted IP) or private networking, and this section must be updated then.

## 21. Naming & Phases (solo engineer + AI agents)
Name **eQOURSE+** at plus.eqourse.com; byline "the talent platform by eQOURSE"; Tutrain = business unit,
white-label in Phase 3. Phases (exit-criterion gated): 0 Foundation (wk1–2: repo/auth/Atlas/Doppler/pipelines) →
1 Public site+SEO (wk3–4) → 2 Freelancer onboarding REG-01..07,11,12,14 (wk5–8) → 3 Test gate TST-01..06 (wk9–11)
→ 4 Talent DB+projects TAL-01..03, PRJ-01..07 (wk12–16) → 5 QA+finance core QLT-01, FIN-01..04,08 (wk17–20) →
6 Vendors REG-08/09/13, PRJ-09, FIN-05/06 (wk21–24) → 7 Autonomy TAL-04/05, QLT-02/03, FIN-09, ADM-04..06,
open board (wk25–30) → 8 AI+CRM (31+). Never start a phase before the previous exit criterion runs on staging.

## 22. Foundation & Public-Site Requirements (Phase 0–1 FR IDs — added v2.1; FR-PUB-00 added v2.5; FR-PUB-00A added v2.6)

### 22.1 Foundation (FND) — Phase 0, in this order
| ID | Requirement | Acceptance |
|---|---|---|
| FR-FND-01 | [P1] Turborepo scaffold: apps/web (Next.js 14 App Router, TS, Tailwind, shadcn init), apps/api (NestJS Node 22 LTS, Mongoose, GET /health), packages/shared (state enums from Flows F1/F4/F5 + zod schemas), packages/adapters (KYC/ESign/Payout/Proctor/Storage/LLM interfaces + sandbox implementations only), packages/ui (tokens per DESIGN.md: primary teal hsl(170 82% 32%) #0F9B8E, accent mint hsl(165 75% 71%) #7BE8C9, navy #232145, background #F7FAF9, destructive #EF4444, radius 0.75rem, shadows soft/card/elevated, gradient-primary 135deg teal→mint; fonts Inter (body) + Plus Jakarta Sans (headings)). | `pnpm dev` runs web+api; `pnpm test` and `pnpm lint` green; /health returns 200. |
| FR-FND-02 | [P1] Auth core: email OTP sign-in, JWT access+refresh, roles enum, RBAC route guard, rate-limit on auth endpoints. | Tests prove 401 unauthenticated, 403 wrong-role, 200 correct-role. |
| FR-FND-03 | [P1] Database wiring: Atlas dev connection via env, migrate-mongo configured, seed script inserting skillTaxonomy sample tree. | Migration + seed run cleanly against the dev cluster; no credentials in repo. |
| FR-FND-03A | [P1] Skill taxonomy breadth (added v2.16; prerequisite for FR-REG-02 skill selection). The skillTaxonomy collection is seeded with production-representative rows across every active business unit and service line, sufficient for a freelancer to describe real work. Rows describe services the business genuinely offers; the taxonomy must never advertise capability that does not exist. Seeding remains idempotent, upserting by slug, and no taxonomy row is ever hard-deleted — status moves to DEPRECATED instead. | The seed runs cleanly twice with no duplicates. Every row has a unique slug and a unique (businessUnit, serviceLine, skill, specialization) compound. A freelancer can select a meaningful skill set for each business unit. |
| FR-FND-04 | [P1] CI: GitHub Actions on PR = lint + test + build; merge to main = staging deploy hook. | A failing test blocks the PR check. |
| FR-FND-05 | [P1] Deployments (v2.4 revision — Utho is PRODUCTION for eqourse.com/tutrain and is OUT OF SCOPE for this platform; never deploy to it): web on Vercel via git integration (prod = plus.eqourse.com on main, previews per PR = web staging); api as Docker container on GCP Cloud Run asia-south1, project eqplus-503212 — service `eqplus-api-staging` auto-deploys on merge to main, service `eqplus-api` (prod) deploys only behind manual approval; GitHub Actions authenticates to GCP via Workload Identity Federation (keyless — no JSON service-account keys anywhere); MONGODB_URI supplied to Cloud Run from GCP Secret Manager; health checks configured. | Deployed staging /health returns 200 on its run.app URL; prod deploy requires manual approval; no JSON keys or secrets in repo or workflow files. |
| FR-FND-06 | [P1] Observability: Sentry on web+api, structured JSON logs, request-id propagation. | A deliberately thrown error appears in Sentry from both apps. |

### 22.2 Public site (PUB) — Phase 1, after all FND
| ID | Requirement | Acceptance |
|---|---|---|
| FR-PUB-00C | [P1] Mobile navigation disclosure (added v2.17). Below the 768px breakpoint the primary navigation collapses behind a labelled toggle, so the header occupies a single row regardless of link count. The toggle is keyboard operable, exposes `aria-expanded` and `aria-controls`, has a visible focus ring and a minimum 48px target, and respects `prefers-reduced-motion`. `site-chrome.tsx` remains a server component; only the interactive toggle is a client island. No colour, easing or icon outside DESIGN.md, and no new dependency. | At 768px and below the header is one row with the navigation collapsed; the toggle opens and closes it by keyboard and pointer; home Lighthouse Performance and Accessibility do not regress from their current production values. |
| FR-PUB-00 | [P1] Public design-system foundation extending DESIGN.md (consumed by all FR-PUB-* pages), in packages/ui: **(a) Two-tier liquid glass** — (i) SSR-safe frosted-glass surfaces via CSS backdrop-filter for nav/cards/panels; (ii) a real-refraction <Glass> primitive using an SVG feDisplacementMap that bends live rendered content (R channel = horizontal bend, G = vertical, neutral outside the lens; rounded-rect lens with edge-concentrated curvature; quarter-map symmetry for perf; fresh filter ID per update for Safari cache; chromatic-fringe + specular passes), reserved for ≤3 focal elements, **progressively enhanced** with automatic fallback to frosted glass on unsupported browsers, prefers-reduced-motion, or low-end devices, and **never blocking first paint or LCP**. **(b) Motion vocabulary** — reusable entrance/scroll/hover animations built only from DESIGN.md §7 & §12 easings/durations, all gated behind prefers-reduced-motion. **(c) Dark/light theming** — CSS-variable token sets for both themes preserving eqourse.com's palette (teal #0F9B8E, mint #7BE8C9, navy #232145, light bg #F7FAF9), system-preference-aware, default light, user toggle overriding and persisted, SSR-safe with no flash-of-incorrect-theme. **(d) Responsive tokens** — mobile/tablet/desktop breakpoints for all pages. Introduces no color or easing outside DESIGN.md. | A demo route (or Storybook) renders frosted + real-refraction glass side by side, the refraction element visibly bending live content and falling back cleanly when disabled; theme toggle flips light↔dark with no FOUC on SSR reload; a motion sample is fully static under prefers-reduced-motion; all three breakpoints verified. Unit tests cover theme resolution (SSR default + toggle persistence) and glass fallback logic. The demo route scores Lighthouse Performance ≥90 and does not regress SEO. |
| FR-PUB-00A | [P1] Liquid Glass visual language + interactive glass component family, extending FR-PUB-00 and DESIGN.md §13 (consumed by all PUB pages). Adds: **(a)** an **animated ambient background layer** (GPU-cheap moving teal/mint/navy/sky-blue gradient field per DESIGN.md §13) behind the UI so refraction has colorful content to bend — pausable, fully static under prefers-reduced-motion, never blocking LCP; **(b)** a **glass component family** — GlassNav (floating frosted nav), GlassButton/CTA (illuminated, tactile press), GlassSegmentedControl (gliding/morphing selection lens refracting a highlighted backing copy, labels stay legible), optional GlassSwitch/GlassSlider/HeroLens; **(c)** **tactile interaction** — hover/press/squish/release and pointer-responsive specular using only DESIGN.md §12/§13-authorized easings; **(d)** three glass tiers — regular / clear / focal — with the **≤3 simultaneous real-refraction focal elements** budget from FR-PUB-00 preserved. Uses only colors, gradients, and easings authorized in DESIGN.md (§1, §3, §12, §13). No new external dependency without approval. | On the /design-system (noindex) route: the ambient layer animates colorful content that the focal glass visibly refracts; GlassNav, GlassButton, and GlassSegmentedControl demonstrate tactile press + gliding selection with legible labels; regular/clear/focal tiers are visually distinct; the ≤3 focal budget still forces frosted fallback on the 4th; all glass + motion is fully static/frosted under prefers-reduced-motion and on unsupported/low-end devices; light↔dark both polished with no FOUC. Unit tests cover the segmented-control selection logic and the focal-budget/fallback behavior. Three Vercel-preview Lighthouse Performance runs (desktop) ≥90; public / SEO baseline unchanged. |
| FR-PUB-00B | [P1] Liquid-glass theme architecture, optics correction & refractable substrate. Both themes expose a value ladder (page canvas / sunken plate / card / elevated) built from the existing eQOURSE brand hues, so glass surfaces read lighter and more saturated than their surround. Glass fills stay neutral (white / navy tint plus saturation amplification); brand hue reaches the eye only by transmission through the glass from the ambient and substrate layers behind it. The focal glass lens uses a convex refraction profile that samples inward, a filter region large enough to contain its maximum displacement, per-channel chromatic separation, and a map-encoded specular rim. Every glass component (nav, button primary/secondary/ghost, segmented control, card, panel, theme toggle) carries a full glass bezel (drop shadow, specular hairline, bottom bounce, 1px ring, accent rim at cap) and defined hover / press / focus-visible / disabled states. A sharp-edged, low-alpha, on-brand refractable substrate layer sits behind glass chrome so the material reads across the whole theme. | On `/design-system` in a real Chromium browser, in both themes: the focal lens visibly bulges and bends sharp content inward at its rim with a bright hairline light-catch and hairline chromatic fringe; no transparent/white tearing occurs at any focal element edge; the segmented control has no doubled label text; nav, primary button and segmented control read as glass over visible sharp substrate; every text/background token pair meets WCAG AA; theme toggling produces a coherent liquid-glass surface either way; Lighthouse desktop Performance ≥90 and Accessibility 100. |
| FR-PUB-01 | [P1] Home `/` per Section 16.1 (hero, trust strip, how-it-works, category grid, stats, testimonials, footer with eqourse.com links). | SSR; Lighthouse SEO ≥95; meta/canonical per Section 18. |
| FR-PUB-02 | [P1] `/jobs` listing + `/jobs/[slug]` detail with JobPosting JSON-LD, filters by category/language; sourced from seeded sample jobs until FR-PRJ ships. **Noindex while the data is seeded (added v2.11).** Publishing fabricated vacancies as indexable `JobPosting` markup is prohibited: it advertises openings that do not exist, invites applications and personal data for roles nobody can be hired into, and risks a Google manual action that would void Section 18. While the postings are seed data, `/jobs` carries page-metadata `robots.index:false` and sits in `EXCLUDED_ROUTES`. `/jobs/[slug]` carries the same page-metadata `robots.index:false`; it is not a registry member, because the route registries hold static paths only, and its exclusion from the sitemap follows from `sitemap.xml` being generated solely from `RESOLVING_ROUTES`. They must **not** be added to the `robots.ts` disallow list: they are linked from the site navigation, and a disallow stops the crawler fetching the page and therefore reading the `noindex`, while a linked-but-disallowed URL can still be indexed as a bare URL that cannot be removed. This is the same two-mechanism treatment `/login` and `/register` already carry. When FR-PRJ supplies real postings, the routes move from `EXCLUDED_ROUTES` to `RESOLVING_ROUTES` under a separate FR, with no other change. | `/jobs` and `/jobs/[slug]` return `robots: noindex`, are absent from `sitemap.xml`, and are absent from the `robots.ts` disallow list. The Google Rich Results test passes `JobPosting` on a job detail page served from a **preview** deployment. Route-registry and frozen-union assertions stay green. |
| FR-PUB-03 | [P1] `/freelancers` landing (earnings, tiers, testing, payout methods by country, FAQ + FAQPage schema). | Indexed-ready; meta standards met. |
| FR-PUB-04 | [P1] `/vendors` landing (RFP model, capability requirements, case-study links to eqourse.com). | Same standards. |
| FR-PUB-05 | [P1] `/about` trust page (parent-company story, certifications, security, contact). | Organization schema includes parentOrganization: eQOURSE. |
| FR-PUB-06 | [P1] `/login` + `/register` with role choice (Freelancer / Vendor) and country selector stub feeding FR-REG-11. | On `/register`, role choice routes to the correct wizard placeholder; `/login` satisfies FR-REG-02C; app routes noindex. |
| FR-SEO-01 | [P1] Programmatic SEO engine: auto-generated category×language landing pages, sitemap.xml regenerated on job publish, robots.txt blocking /app + /api, sitewide Organization + WebSite JSON-LD. | Publishing a seeded job updates sitemap.xml automatically; /app routes carry noindex. |

Ordering rule: FND-01→06 strictly sequential; PUB-00→00A→01..06 then FR-SEO-01. FR-SEO-01 must not begin before FR-FND-01/05 are done.
