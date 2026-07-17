# SETUP.md — Solo-engineer setup: accounts, infra, costs, MongoDB, deployment, proctoring-lite
(Companion to SPEC.md. Do Phase 0 top-to-bottom; everything below is free unless marked.)

## 1. Accounts to create (in this order)
| # | Account | Plan | Cost | Notes |
|---|---|---|---|---|
| 1 | GitHub org `eqourse` + private repo `eqourseplus` | Free | ₹0 | 2,000 Actions min/mo free |
| 2 | MongoDB Atlas | M0 (dev) | ₹0 | Later: Flex ~$8–30/mo for early prod |
| 3 | Cloudflare (you have) | Free | ₹0 | DNS for plus.eqourse.com, R2 (10 GB free), Pages/Workers |
| 4 | GCP (you have billing) | Pay-as-you-go | ~₹0–800/mo early | Cloud Run api (asia-south1) + Secret Manager |
| 5 | Upstash Redis | Free | ₹0 | BullMQ queues |
| 6 | Resend (email) | Free 3k/mo | ₹0 → $20 | OTPs + notifications; verify a subdomain like mail.eqourse.com |
| 7 | Sentry | Free dev | ₹0 | FE+BE error tracking |
| 8 | Doppler (secrets) | Free | ₹0 | Or use GCP Secret Manager only |
| 9 | Vercel | Hobby → Pro | ₹0 dev → $20/mo | Hobby is NON-COMMERCIAL: fine while building; at public launch either pay Pro OR deploy web free on Cloudflare Workers (OpenNext) |
| 10 | KYC sandbox: IDfy or HyperVerge (India) + Sumsub (global) | Pay-per-verification | ₹0 until real users | ~₹20–60/verification India; ~$1–2 global. Sales-assisted signup — start the conversation early |
| 11 | E-sign sandbox: Digio (India), Dropbox Sign (intl) | Per-doc | ~₹5–20/doc; intl ~$15/mo plan | |
| 12 | RazorpayX / Cashfree Payouts (needs company KYC) | Per-payout fee | ₹3–10/payout | Wise/Payoneer later for international |
| 13 | Anthropic/OpenAI API key | Pay-per-use | ~₹0–500/mo early | Parsing, semantic match, later AI-QA |
| 14 | Google Search Console + GA4 | Free | ₹0 | Separate property for plus.eqourse.com |

NOT needed: AWS (you have GCP), paid proctoring SDK (Section 5 below), paid search engine (Atlas Search included), Auth0 (build email-OTP + JWT yourself — it's FR-REG-01 anyway).

## 2. Infrastructure layout (uses what you already own)
- **Production API** → GCP **Cloud Run** (asia-south1): Docker container of apps/api; scale-to-zero; free tier ~2M req/mo. Store secrets in GCP Secret Manager.
- **Production Web** → Vercel Pro at launch, OR Cloudflare Workers/Pages via OpenNext for ₹0. Either way `plus.eqourse.com` CNAME in Cloudflare DNS.
- **Staging (everything)** → your **Utho server**: install Docker + **Dokploy** (free, open-source Vercel-like panel). Deploy web+api+worker there as staging.plus.eqourse.com behind Cloudflare (orange-cloud = free SSL + protection). Uses hardware you already pay for.
- **Files** → Cloudflare R2 buckets: `eqplus-kyc-docs` (private, encrypted, signed URLs only), `eqplus-project-assets`, `eqplus-deliverables`. R2 has NO egress fees.
- **Queues/workers** → BullMQ worker as a second Cloud Run service (min-instances=0) or on the Utho box; Upstash Redis free tier.
- **DB** → MongoDB Atlas on GCP asia-south1 (Section 4).
- **CI/CD** → GitHub Actions: PR = lint+test; merge to main = deploy staging (Utho via Dokploy webhook); manual approval job = deploy prod (Cloud Run + Vercel).

## 3. Realistic monthly cost curve
| Stage | Monthly cost | What you're paying for |
|---|---|---|
| Building (months 0–3) | **~₹0** | Everything on free tiers + Utho you already pay |
| Private beta | ~₹700–1,500 (~$8–18) | Atlas Flex, small Cloud Run usage |
| Public launch | ~₹3,000–6,000 (~$35–70) | + Vercel Pro (or ₹0 on CF), Resend paid, Atlas Flex→M10 as data grows |
| Growth (1000s of users) | ~₹12,000–25,000 | Atlas M10/M20, Cloud Run always-on min-instance, email/SMS volume |
| Per-use on top | variable | KYC ~₹20–60/user (India), e-sign ~₹5–20/doc, payout fee ₹3–10/txn — these scale WITH revenue, which is healthy |

## 4. MongoDB Atlas setup (do once, 20 minutes)
1. atlas → create Organization `eQOURSE` → Projects: `eqplus-dev`, `eqplus-staging`, `eqplus-prod`.
2. In eqplus-dev: Build a Database → **M0 Free** → Provider **GCP**, Region **Mumbai (asia-south1)**.
3. Database Access → create user `api-dev` with readWrite on db `eqplus` only (not atlasAdmin).
4. Network Access: dev = your IP; staging = Utho server IP; prod = Cloud Run egress (attach a Serverless VPC connector w/ static NAT IP, or use Atlas private endpoint later). Never 0.0.0.0/0 on prod.
5. Copy connection string → `.env` `MONGODB_URI` (and Doppler/Secret Manager for deployed envs).
6. Enable **Atlas Search** index on `freelancerProfiles` (skills, languages, tier) and later a **Vector Search** index (semantic match) — no separate search infra ever.
7. In code: Mongoose strict schemas + collection JSON-schema validators; `migrate-mongo` for migrations; seed script for skillTaxonomy.
8. Turn on backups when you create the prod cluster (Flex/M10). Set Atlas alerts → your email.
Rules that keep Mongo safe for finance: transactions on every ledger write; money as integer minor units; earningLines & auditLogs append-only (no update/delete in code, enforced by repository layer).

## 5. Proctoring-lite (strict, camera-on, ₹0 — replaces paid SDK for MVP)
Client (test page):
- `getUserMedia` webcam stream, MUST stay on; recording indicator shown; consent screen (versioned) before start.
- **MediaPipe Face Detection** (runs in-browser, free): every ~2s check → events: NO_FACE, MULTIPLE_FACES, FACE_LEFT.
- Snapshot JPEG every 15–30s + on every violation → upload to R2 via signed URL.
- Fullscreen API enforced; `visibilitychange`/`blur` = TAB_SWITCH event; copy/paste/contextmenu blocked; `getDisplayMedia` detection for screen sharing; devtools-open heuristic.
- Violation counter visible to candidate; N violations (config) = auto-terminate attempt.
Server:
- Ingest event stream (FR-TST-02/03) → attempt report with timeline.
- Face-match batch job: compare snapshots vs KYC selfie embedding (open-source face embedding model on the worker, or a per-image cloud face-compare API ~₹0.1/image) → mismatch flag.
- Flags → human review queue (FR-TST-04). Reviewer sees timeline + snapshots + video-less evidence, approves/rejects.
Honest limits: won't stop a second laptop off-camera or a phone. Mitigate with randomized question banks (FR-TST-01), tight timers, practical tasks (hard to google), gold tasks after onboarding (FR-QLT-02). Upgrade path: swap ProctorAdapter to Mettl/AutoProctor when a client contract requires certified proctoring — nothing else changes.

## 6. First-hour checklist in Antigravity (or any IDE)
1. Put in the `eqourseplus` folder: SPEC.md, AGENTS.md, CLAUDE.md, .cursorrules, .kiro/, PROMPTS.md, PROGRESS.md, SETUP.md, .env.example, .gitignore. `git init`, first commit, push to GitHub.
2. Open the folder in Antigravity → it auto-reads AGENTS.md. (Claude Code reads CLAUDE.md; Cursor reads .cursorrules; Kiro reads .kiro/steering/.)
3. Run the Session-start prompt from PROMPTS.md.
4. First build prompt: "Read AGENTS.md + SPEC.md. Scaffold the Turborepo exactly per .kiro/steering/structure.md: apps/web (Next.js 14 TS + Tailwind + shadcn init), apps/api (NestJS + Mongoose + health endpoint), packages/shared (state enums from Flows F1/F4/F5), packages/adapters (interfaces + sandbox implementations only), packages/ui (tokens: #F59E0B primary, #1E293B text). CI workflow lint+test+build. Plan first, wait for my go."
5. Verify locally (`pnpm dev`), commit, then wire deploys (Cloud Run + Vercel/CF + Dokploy on Utho) before writing features — deploy pain is cheapest on hello-world.
