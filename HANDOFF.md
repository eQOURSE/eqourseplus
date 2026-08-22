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
- SPEC.md (v2.10, ~60 FR IDs w/ acceptance criteria, Part A core + Part B global/build guide, Section 19.2
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
**Phase 0 of 8 is complete. Phase 1 is complete except FR-SEO-01 and FR-PUB-02, both deliberately deferred. Phase 2 is in progress, with FR-REG-01 done. Completed foundation and public work: FR-FND-01..06, FR-PUB-00/00A/00B, FR-PUB-01 home, FR-PUB-03 `/freelancers`, FR-PUB-04 `/vendors`, FR-PUB-05 `/about`, and FR-PUB-06 login/register. FR-REG-01 adds the first end-to-end backend feature: dedicated freelancer-registration request and verify endpoints, dual email/phone OTP verification, sparse-unique phone/PAN handling, device-fingerprint review flags, and a two-step form at `/register/freelancer`. The form is a client island inside a server component and calls the API directly from the browser through an explicit CORS origin allowlist. The shared public design system in `packages/ui` continues to provide SSR-first frosted glass, corrected live-content refraction with automatic fallbacks and a three-element budget, DESIGN.md-only motion, light/dark themes, responsive tokens, the §13 Liquid Glass language, the ambient canvas, and the GlassNav / GlassButton / GlassSegmentedControl / GlassSubstrate family. Four public indexable routes remain live, server-rendered and crawlable at plus.eqourse.com with Section 18 SEO complete: home, `/freelancers`, `/vendors`, and `/about`. Four account-entry routes remain noindex: `/login`, `/register`, `/register/freelancer`, and `/register/vendor`; freelancer registration is now functional while vendor registration remains deferred. Route registries, content-honesty guards, canonical entity identity, and sitemap exclusions remain load-bearing. The four public pages and their specs are byte-identical to their pre-FR-PUB-06 state. 274 tests are green; lint and production build are clean on CI’s pinned Node 22.23.1. Next: FR-REG-02A session-transport prerequisite for FR-REG-02. FR-SEO-01 and FR-PUB-02 remain deliberately deferred.**

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

Entity binding by `@id`, not by renaming legal entities: one canonical Organization node per origin, described once and referenced elsewhere by identical `@id`, never a second competing declaration. The schema parent is the eQOURSE *brand* node at `https://www.eqourse.com/#organization`, named "eQOURSE" — not a legal entity. Company documents (GST REG-06 for the LLP; ACRA constitution for EQOURSE PTE. LTD., incorporated 14 Apr 2025, sole subscriber holding 1,000 of 1,000 shares) confirm the two entities are SIBLINGS under common individual ownership, with no share ownership in either direction; `parentOrganization` is therefore accurate as brand hierarchy but must never be used to assert a corporate parent/subsidiary relationship between them. Which entity contracts foreign clients is a separate commercial question gated on CA sign-off (Airwallex is held by the PTE LTD; FEMA/ODI reporting, POEM exposure and related-party transfer pricing all need professional review before the first international payout). Registration identifiers (PAN, GSTIN, UEN) and street addresses are never published in page copy or structured data.

Noindex mechanism selection. A route that must stay out of the index uses page-metadata `robots.index:false` plus `EXCLUDED_ROUTES` membership. A `robots.txt` disallow is added **only** for routes nothing links to, because a disallow stops the crawler fetching the page and therefore reading the `noindex`, and a linked-but-disallowed URL can still be indexed as a bare URL entry that cannot be removed. `/design-system` carries all three because it is unlinked; `/login` and `/register` deliberately carry two. `robots.ts` keeps a hardcoded disallow list and must never be refactored to derive it from `EXCLUDED_ROUTES` — that refactor looks like a tidy-up and would silently disallow the account-entry routes. Noindex routes never enter `RESOLVING_ROUTES`, because that registry is the sitemap source and a noindex URL in the sitemap is reported by Search Console as "Submitted URL marked 'noindex'".

Sparse unique indexes and null. A sparse index skips a *missing* field but still indexes an explicitly stored BSON `null`. Any optional field carrying a unique constraint must therefore be persisted as absent, never as null, or the second such document collides. This applies to `users.phone` and `users.pan` today and to every future optional-unique field.

Browser-to-API calls for anything fingerprinted. The device fingerprint is derived server-side from the request’s IP, user-agent and accept-language. Any route that proxies a fingerprinted call through Next.js makes every request arrive with the web server’s identity, giving every user an identical fingerprint and rendering duplicate detection useless. Fingerprinted endpoints are called directly from the browser, behind an explicit CORS origin allowlist.

## Watchlist / open items
- LAUNCH GATE (production verified clean 2026-08-03): plus.eqourse.com must never ship with Vercel Deployment Protection enabled for Production. Protection injects x-robots-tag: noindex and 302s crawlers to vercel.com/sso-api, making the site permanently unindexable and silently voiding all Section 18 SEO work. Re-verify after any Vercel settings change with curl -I on the production URL: expect 200, no redirect to vercel.com/sso-api, and no x-robots-tag: noindex. The same production check now confirms `/login`, `/register`, `/register/freelancer`, and `/register/vendor` return 200 with `meta robots="noindex, follow"` and no `x-robots-tag`, while the four indexable routes carry no robots meta. Protected previews legitimately score SEO 66 for this reason; production scores 100.
- FR-SEO-01 is deliberately deferred, for the same reason as FR-PUB-02. Two of its four parts already shipped in FR-PUB-01: `robots.txt` blocks `/app` and `/api`, and home carries sitewide `Organization` + `WebSite` JSON-LD. A third part — "sitemap regenerates on job publish" — cannot be built or demonstrated while `/jobs` is deferred, and it is half the acceptance criterion. The remaining part, auto-generated category×language landing pages, is the actual risk: the `skillTaxonomy` collection holds three rows, so category×language would emit roughly ninety near-identical pages with no unique content. Google treats mass-produced thin pages as doorway pages and the penalty is domain-wide — precisely the exposure that caused `/jobs` to be deferred rather than seeded with fake postings. Revisit FR-SEO-01 once the taxonomy holds real breadth and `/jobs` carries genuine listings. Do not build it to tick the box.
- FR-REG-01's device rule was changed in SPEC v2.7 from hard block to flag-for-review. A hard block on device fingerprint rejects legitimate users on shared computers — family machines, office desktops, cyber cafés — silently and with no appeal path, and you never see who you lost. Phone and PAN remain hard-blocked because they are strong identity signals. Device is weak, so it raises a `reviewFlags` entry for the FR-REG-07 verifier queue instead. Do not "restore" the hard block without deciding this again.
- **The Atlas `0.0.0.0/0` IP allowlist is now load-bearing.** SPEC §20.1 marks it FORBIDDEN once real user data exists, and FR-REG-01 is the FR that starts creating real people’s records — email, phone, country, and optional PAN. It is acceptable only while the data is test fixtures. Before the first genuine freelancer registers, the prod cluster needs static egress or private networking. Do not let real sign-ups open before this closes.
- `/register/freelancer` cannot work on production until the Cloud Run API deploy is fixed. The form calls the API directly from the browser and there is no production API to call. The page renders and the form validates, but submission will fail. Fix the deploy (the `SENTRY_DSN` secret-accessor hypothesis) before announcing registration to anyone.
- Rotating `JWT_SECRET` silently resets every device fingerprint, because the fingerprint HMAC derives from it with domain separation. Duplicate detection goes blind and every returning device looks new. Documented at the derivation site.
- Outstanding content: 2-3 real testimonials (name, role, company, consented quote) for apps/web/content/testimonials.ts. The component renders nothing until supplied; no code change needed. https://www.eqourse.com/clients-testimonials already publishes client testimonials — check whether any can be reused here with explicit consent and correct attribution before sourcing new ones. NOTE: the route is `clients-testimonials` with a hyphen; earlier handoffs recorded an underscore, which does not resolve.
- Google Search Console is DONE (2026-07-30): URL-prefix property `https://plus.eqourse.com/`, verified by HTML file (`apps/web/public/googlefcb9195805f39306.html`, shipped in 63fa86c). sitemap.xml submitted and read. Indexing requested on `/`, `/freelancers`, `/vendors` — all queued. Do not re-request indexing; Google's own dialog states resubmitting does not improve queue position. "Discovered – currently not indexed" is the expected state for a new subdomain and is what inbound links resolve. GSC lives under a specific Google account — if the browser shows "you don't have access to this property", stop and switch accounts rather than clicking through the account list. Remaining action: submit `/about` for indexing once it has been crawled. Do **not** submit `/login`, `/register`, `/register/freelancer`, or `/register/vendor` for indexing — they are noindex by design and are correctly absent from the sitemap.
- Flat --primary (170 82% 32%) against white measures 3.76:1 — below AA at 16px/700. Not changed in FR-PUB-00B (system-wide blast radius). FR-PUB-01 CTAs must use the deepened teal plate (hsl(170 82% 26%) to hsl(174 72% 20%)), not flat --primary, for white labels. Recorded in DESIGN.md §13.
- `--border` measures ~1.23:1 against the field fill in both themes, so the country selector's 1 px boundary is effectively invisible against its own surface. This is compliant today because WCAG 2.1 exempts disabled controls from SC 1.4.11 (and from SC 1.4.3). The moment FR-REG-11 makes the selector live and interactive, the control boundary must reach 3:1. Do not change `--border` now — it is a system-wide token with the same blast radius that left flat `--primary` alone.
- The public CTAs on `/`, `/freelancers`, `/vendors` and `/about` still do not link to `/register`. Deliberate — those pages carry exact-equality link allow-lists and nav arrays, so wiring them is its own reviewable change. Until then `/register` is reachable only by direct URL. When wiring them, remember home is at five nav links and 2 rows at 768 px; a sixth pushes it to three.
- Dark theme is the stronger liquid-glass surface and is the reference for FR-PUB-01 material quality; light is legitimately quieter (less value range) and that is physics, not a defect.
- Focal refraction initialises 12 s after an element enters the viewport (POST_LCP_INITIALIZATION_DELAY_MS). This affects `/design-system` only — public pages spend zero of the three-element focal budget, so the 15-second wait does not apply to public-page Lighthouse runs. When measuring `/design-system`, scroll into view and wait 15 s or the run measures the frosted fallback. Virtual-time headless screenshots always show frosted.
- .eq-glass-label-scrim is currently applied to every eyebrow; only the focal-card and hero-lens eyebrows actually need it. Cosmetic tidy-up, deferred.
- Production API Cloud Run deploy is failing — not user-facing. Hypothesis: the prod runtime service account `eqplus-api-runtime@eqplus-503212` lacks `secretmanager.secretAccessor` on `SENTRY_DSN`. Diagnose the failed job log and `gcloud secrets get-iam-policy SENTRY_DSN` before running any grant.
- Merged branches safe to delete on the remote: `docs/FR-PUB-06-closeout`, `docs/spec-v2.7-reg01-prep`, `feat/FR-PUB-06-login-register`, `feat/FR-REG-01-signup-api`, `feat/FR-REG-01-signup-web`. Verified against the remote 2026-08-05.
- The footer `www` alignment is DONE (FR-PUB-05): all outbound links now target `https://www.eqourse.com/`.
- Production API Cloud Run deploy remains pending approval on every merge to main and will keep appearing in the deployment-review dialog. It is not user-facing and no web FR requires it. Do not approve it to clear the dialog — diagnose first (failed job log, then `gcloud secrets get-iam-policy SENTRY_DSN`) and hand the IAM change to the human. Leaving it pending is preferred over rejecting, which marks the run failed.
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

Measurement discipline, learned the hard way in FR-PUB-05: three separate navigation questions in one session each contradicted a plausible calculation, and every one was settled by direct observation at the exact condition. Two specific traps. (1) `scrollWidth === clientWidth` cannot detect nav crowding, because `.home-nav-wrap .eq-glass-nav` is `flex-wrap: wrap` — a wrapping container never overflows horizontally, it grows taller. Measure rendered height and row count instead. (2) Never conclude a layout change is a regression without measuring the same condition on `origin/main` first; the theme-toggle wrap at 768px turned out to be pre-existing, while the extra nav row genuinely was new. A third trap: the first Lighthouse run is a cold-cache artefact. `/about` read 92, then 100, then 100, with TBT moving 190 → 50 → 60 ms while LCP and CLS never shifted. Take the median of three runs and disclose the outlier rather than cherry-picking either end. Also: after a merge, production takes ~2 minutes to deploy — the first fetch of a new route will 404. Re-check before concluding anything about production. A fourth trap, and the most expensive one so far: **check what a test actually exercises, not merely that it passes.** `auth.e2e-spec.ts` runs against an in-memory fake store, so `MongooseAuthStore` had zero coverage and a rotation bug that fails on every real request sat green for weeks. A passing suite is evidence about the code the suite runs, and nothing else.
