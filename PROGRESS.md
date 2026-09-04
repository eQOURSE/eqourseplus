# PROGRESS.md — FR completion tracker (agents update this; human owns it)
Current phase: 2 — Freelancer onboarding (next: FR-REG-02 profile wizard)
Last completed FR: FR-REG-02A — 2026-09-04 — Authenticated session transport now runs through same-origin Next.js Route Handlers for registration verification, sign-in verification, refresh, logout and session read. The web origin owns `__Host-` httpOnly/Secure/SameSite=Lax cookies, with access and refresh Max-Age values imported from the same shared TTL constants used by API token issuance. `GET /api/v1/auth/session` is proven through the cookie transport, including one refresh and one retry for an expired access token and rotation of both cookies. Exact `APP_URL` Origin validation rejects missing, cross-site and untrusted sibling origins; Fetch Metadata rejects `same-site` and `cross-site` when present while remaining compatible with clients that omit it. Failed refreshes return 401 without clearing cookies, preventing a losing concurrent tab from overwriting a winning tab's rotated pair; the losing request itself may still observe one transient 401, but its next request uses the winning cookies. Only explicit sign-out clears cookies, after server-side revocation. `register/request` remains direct from the browser so device fingerprints retain the real client network identity. The staged IP throttlers are removed only from `otp/verify` and `register/verify`; per-identifier verification limits and direct-request IP limits remain. Real MongoDB coverage continues to prove refresh rotation and reuse rejection. 308 tests are green locally; lint and production build are clean. CI's pinned Node 22.23.1 check remains the authoritative gate.

## Phase 0 — Foundation (wk 1–2) — SPEC.md Section 22.1, strictly in order
- [x] FR-FND-01 scaffold (2026-07-17)  - [x] FR-FND-02 auth core (2026-07-20)  - [x] FR-FND-03 db wiring (2026-07-21)
- [x] FR-FND-04 CI (2026-07-21)  - [x] FR-FND-05 deployments (2026-07-23; deployment-config defect fixed 2026-09-04 — explicit per-service `CORS_ORIGINS` plus fail-fast workflow preflight; 309 tests green, lint and production build clean)  - [x] FR-FND-06 observability (2026-07-23)
## Phase 1 — Public site + SEO (wk 3–4) — SPEC.md Section 22.2
- Watchlist: FR-PUB-02 `/jobs` is deliberately deferred; keep `/jobs` out of `RESOLVING_ROUTES`, public navigation, and the sitemap until its listing and detail `page.tsx` routes exist.
- [x] FR-PUB-00 public design-system foundation (2026-07-24)
- [x] FR-PUB-00A Liquid Glass visual language (2026-07-24) — visual-intensity pass same day; rim/fringe polish 2026-07-25. Superseded on optics by FR-PUB-00B: the concave displacement profile and undersized filter region shipped here were the cause of the grey rim collar and the focal-panel edge tearing. Lighthouse re-run and merged with FR-PUB-00B on 2026-07-25.
- [x] FR-PUB-00B Liquid-glass theme architecture, optics correction & refractable substrate (2026-07-25) — convex inward-sampling profile; filter region >= max displacement + 8 px (tearing fixed); three per-channel displacement passes at 4.5% stagger replacing the painted fringe; specular encoded in the map's blue channel replacing feSpecularLighting on a flat SourceAlpha; 256 px softened map. Light/dark value ladders on the existing brand hues with #F7FAF9 kept as --paper; dark --card/--muted-foreground collision defects fixed. Neutral glass fills with hue by transmission only; deepened teal plate behind primary buttons for AA. Sharp refractable substrate (alphas <=0.08, mask floor 0.34) + full bezel and five interaction states across the glass family; segmented backing changed from a duplicated label copy to a teal-to-mint highlight fill. Round-2 rebalance: per-theme ambient opacity tokens, blur 80 px, blobs <=30 rem, and the ambient composite added to the contrast model including primary-as-eyebrow. 129 tests green, lint and build clean. Lighthouse 99 Perf / 100 A11y. Brand and ambient colour tokens byte-identical to 69f67d4.
- [x] FR-PUB-01 home (2026-07-25) — SSR home per SPEC 16.1; SPEC 18 SEO complete; Organization + WebSite JSON-LD only; robots.ts + sitemap.ts added; CI claims allow-list blocks invented statistics; testimonials empty by design. Production Lighthouse 100 Perf / 100 A11y / 100 BP / 100 SEO. Zero focal refraction; LCP 0.6s.
- [x] FR-PUB-03 /freelancers (2026-07-27) — SSR landing on normative Flow F1; SPEC 18 SEO complete; FAQPage + BreadcrumbList only; native details/summary keeps FAQ answers in the SSR DOM and schema matches visible text exactly; zero digits and zero earnings/provider claims; honest "registration not open yet" FAQ; shared public chrome extracted from home with home assertions preserved; route registries prevent sitemap-before-route. Lighthouse 98/100/100/100.
- [ ] FR-PUB-02 jobs pages (deferred — see HANDOFF watchlist)
- [x] FR-PUB-04 /vendors (2026-07-28) — SSR vendor-model landing; honest later-phase caveat; Flow F2 plus clearly separated F3/FR-FIN-05 continuation; SPEC 18 SEO; clean Chrome Lighthouse 95/100/100/66 on protected preview.
- [x] FR-PUB-05 /about (2026-08-01) — SSR trust page; single canonical Organization node shared by `@id` between `/` and `/about`; reciprocal parent binding to eqourse.com completed; three-way route registry with `EXCLUDED_ROUTES`; allow-list digit guard; nav simplified and measured at 768. Production verified 200, no noindex, sitemap updated.
- [x] FR-PUB-06 login/register (2026-08-03) — Four SSR placeholder-only account-entry routes; exact role routing; noindex metadata plus exclusion registry guards; disabled country selector stub; production verified.
- [ ] FR-SEO-01 programmatic SEO engine (deferred — see HANDOFF watchlist)
- [x] Manual (not code): GSC property + links from eqourse.com live (2026-07-30)
## Phase 2 — Freelancer onboarding (wk 5–8)
- [x] FR-REG-01 freelancer sign-up (2026-08-05) — Dedicated dual-OTP API, sparse-unique migration, device-review flags, and two-step `/register/freelancer` browser flow; 274 tests green.
- [x] FR-REG-02A authenticated session transport (2026-09-04) — API session read plus same-origin web cookie transport, CSRF checks, refresh rotation/retry and server-side logout; proven against `GET /api/v1/auth/session`.
- [ ] FR-REG-02  - [ ] FR-REG-03  - [ ] FR-REG-04  - [ ] FR-REG-05
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
