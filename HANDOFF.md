# HANDOFF.md — eQOURSE+ Project Context (paste/attach at the start of any new advisor chat)

## What this is
I (the user, "bhau23", solo engineer) am building **eQOURSE+** — an Outlier.ai/DataPlus-style workforce &
project-delivery platform (freelancers + vendor agencies: KYC/KYB verification, proctored skill tests, tiered
talent pool, project staffing, task/QA engine, finance with TDS/GST + global payouts) for my companies
**eQOURSE** (eqourse.com — AI data services + content services) and **Tutrain**. I vibe-code with AI agents;
**Codex** (in the IDE) writes all code; **Claude in Chrome** does supervised browser tasks; **Claude (you)** is my
senior advisor: you write my Codex prompts, review Codex's verdicts before I approve, author SPEC patches,
guide infra/dashboard work, and flag security issues. Assume that role and rhythm immediately.

## Source of truth (all in repo: github.com/eQOURSE/eqourseplus, branch main)
- SPEC.md (v2.4+, ~60 FR IDs w/ acceptance criteria, Part A core + Part B global/build guide, Section 19.2
  grows one collection schema at a time, Section 22 = FND/PUB foundation FRs) — spec is LAW; agents may not
  build unnumbered work; ambiguity → stop and ask → we patch spec (version bump each time).
- AGENTS.md (14 rules: one FR per session, tests-first, state machines as enums+guards, adapters for all
  providers, append-only ledger w/ Mongo transactions, money as integer minor units, no new deps w/o approval,
  no secrets in repo/chat, design per DESIGN.md). CLAUDE.md/.cursorrules/.kiro mirror it.
- DESIGN.md = eqourse.com design system (canonical): primary teal #0F9B8E, accent mint #7BE8C9, navy #232145,
  bg #F7FAF9, Inter + Plus Jakarta Sans, defined animations/easings. (NOT orange — that was replaced in v2.2.)
- PROGRESS.md = FR tracker, agent updates only after acceptance truly passes.
- PROMPTS.md = my prompt templates (master pattern: read AGENTS+SPEC, implement FR-XXX, acceptance criterion,
  plan first + wait for "go", tests first, update PROGRESS). SETUP.md = accounts/costs/deploy guide.

## Current position (update this line as things change)
**Phase 0 of 8 complete; Phase 1 has begun. Done: FR-FND-01..06 and FR-PUB-00/00A. The shared public design
system in `packages/ui` now includes SSR-first frosted glass; progressive live-content SVG refraction with
automatic fallbacks and a three-element budget; DESIGN.md-only motion, light/dark theme, responsive tokens, and
the §13 Liquid Glass language; a post-load five-color ambient canvas; GlassNav, GlassButton, and
GlassSegmentedControl; event-driven pointer specular without an animation-frame loop; real-label roving keyboard
focus over an aria-hidden/nonfocusable backing copy; and fully static/frosted reduced-motion and low-end paths.
The noindex `/design-system` proof route is the only content surface. Tests were written red first; the final
repository result is 86 passing tests, clean lint/build, desktop Lighthouse Performance scores of 99, 97, and
97, and a desktop accessibility score of 100 with no contrast or aria-hidden-focus failures. No FR-PUB-01 page
content was built. Next: FR-PUB-01, then FR-PUB-02..06 and FR-SEO-01.**

## Infrastructure inventory (no credentials here, ever)
- GitHub org eQOURSE / repo eqourseplus; my admin account bhau23. Node 22.23.1 + pnpm 11.9.0 pinned.
- Vercel: project `eqourseplus-web` (team "tutrain's projects"), root apps/web, auto-deploys; domain
  plus.eqourse.com added (CNAME target ee6876edb5cf5d40.vercel-dns-017.com). PR previews = web staging.
- GCP: project `eqplus-503212` (eqourse@gmail.com, billing linked), region asia-south1, APIs enabled: Cloud Run,
  Artifact Registry, Secret Manager, Cloud Build. Cloud Run services: `eqplus-api-staging`, `eqplus-api`.
  Artifact Registry repository: `eqplus-api`. GitHub Actions deploys through keyless WIF using separate deploy
  and runtime service accounts; no JSON service-account keys. Runtime secrets: `MONGODB_URI`, `JWT_SECRET`.
- MongoDB Atlas: org "Eqourse's Org", project eqplus-dev, cluster eqplus-dev M0 free GCP Mumbai; user api-dev
  readWrite@eqplus only (admin user deleted; password was rotated after a leak incident); IP list = my home IP
  + 0.0.0.0/0 (conscious documented tradeoff, SPEC §20.1 — dev/seed data only; FORBIDDEN once real user data
  exists → then static egress/private networking on the prod cluster, Phase 5).
- DNS: GoDaddy hosts eqourse.com zone (vendor-configured; Google Workspace MX for som@eqourse.com lives there —
  zone is ADD-ONLY, extreme caution). CNAME plus → Vercel added. Cloudflare account exists but empty/dormant
  (R2 buckets in Phase 2; possible full DNS migration "Path A" as a careful later mini-project).
- Utho server = PRODUCTION hosting for eqourse.com + tutrain (vendor-deployed). OUT OF SCOPE — no agent or
  deploy ever touches it (SPEC v2.4).

## Decisions log (don't relitigate without cause)
Name eQOURSE+ at plus.eqourse.com (subdomain SEO strategy; parentOrganization schema; never "eQOUSE").
MongoDB (not Postgres) w/ mandatory transactions on ledger + append-only earningLines/auditLogs; ledger may
split to Postgres later via adapter if finance outgrows it. Proctoring-lite self-built (MediaPipe + snapshots +
fullscreen/tab locks + server face-match + human flag review) instead of paid SDK; ProctorAdapter = upgrade path.
Staging = Vercel previews + eqplus-api-staging (no Utho). WIF keyless (JSON SA keys banned). India entity for
Indian talent w/ TDS; Singapore entity for foreign talent (CA sign-off pending before first intl payout).
Free-first cost posture (~₹0 build phase). GCP over AWS (existing billing). Codex behaviors we prize: refuses
unnumbered work, asks on ambiguity, plans-first, honest PROGRESS gating.

## Watchlist / open items
- GCP red banner "administrator must verify this account" — I must verify personally (urgent-ish).
- Vercel 2FA — enable personally if not done.
- Long-lead accounts to start early (Phase 1–2): RazorpayX/Cashfree company KYC (2–4 wks), IDfy/HyperVerge +
  Sumsub sales-assisted KYC sandboxes, Digio e-sign.
- SPEC patches now delivered as targeted Codex instructions (not full-file replacements) after a Node 20/22
  regression near-miss; Codex diff-checks every docs change.
- Security incidents to remember: Atlas password once leaked and was rotated immediately; rule = secrets never
  appear in any chat, even masked; browser agents told "never display secrets."
- Claude-in-Chrome standing rules: add-only on DNS/security pages; never click access-control confirms itself;
  never display tokens; confirm before saving.

## How to advise me (the rhythm that works)
One FR per fresh Codex session. You draft the exact prompt (with constraints closing common agent traps),
I run it, paste Codex's plan/verdict back, you review and give me either "go" additions or the close-out
(commit message + PR + merge steps + my manual verification ritual). You patch SPEC via instructions when Codex
hits ambiguity. You warn me before any risky dashboard/terminal step and sanity-check gcloud commands I paste.
Be honest, flag risks bluntly, keep costs near zero, and never let an agent (or me) skip the acceptance proof.
