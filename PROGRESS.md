# PROGRESS.md — FR completion tracker (agents update this; human owns it)
Current phase: 1 — Public site + SEO in progress (next: FR-PUB-04 /vendors)
Last completed FR: FR-PUB-01 — 2026-07-25 — Public home route / , fully server-rendered per SPEC 16.1: hero, trust strip, how-it-works, service-line grid, verified stats band, conditional testimonials and an eqourse.com footer. SEO per SPEC 18: title 44 chars keyword-first, description 136, self-canonical, hreflang en + x-default, Organization with parentOrganization EQOURSE ONLINE EDUCATIONERS LLP and sameAs twitter.com/EQourse plus WebSite JSON-LD only, build-time OG image with alt text, robots.ts disallowing /app /api /design-system, sitemap.ts listing only routes that resolve. Content honesty enforced in CI: no invented testimonials, statistics or logos; a claims allow-list test asserts every digit-bearing visible claim is one of 500+, 30+, 9001, 27001; testimonials ship as a typed empty collection that renders nothing until real quotes exist. Page and all sections are Server Components; client islands limited to ThemeToggle and AmbientCanvas. Zero focal-refraction elements — the frosted tier, bezel and substrate carry the theme. 154 tests green, 129 existing plus 25 new, lint and build clean. Lighthouse on production plus.eqourse.com: Performance 100, Accessibility 100, Best Practices 100, SEO 100. LCP 0.6s on the server-rendered h1, TBT 0ms, CLS 0. The protected Vercel preview reports SEO 66 purely from Vercel's x-robots-tag: noindex header; production is clean. Advisor verified the rendered DOM, metadata, JSON-LD and both themes in a real browser.

## Phase 0 — Foundation (wk 1–2) — SPEC.md Section 22.1, strictly in order
- [x] FR-FND-01 scaffold (2026-07-17)  - [x] FR-FND-02 auth core (2026-07-20)  - [x] FR-FND-03 db wiring (2026-07-21)
- [x] FR-FND-04 CI (2026-07-21)  - [x] FR-FND-05 deployments (2026-07-23)  - [x] FR-FND-06 observability (2026-07-23)
## Phase 1 — Public site + SEO (wk 3–4) — SPEC.md Section 22.2
- Watchlist: FR-PUB-02 `/jobs` is deliberately deferred; keep `/jobs` out of `RESOLVING_ROUTES`, public navigation, and the sitemap until its listing and detail `page.tsx` routes exist.
- [x] FR-PUB-00 public design-system foundation (2026-07-24)
- [x] FR-PUB-00A Liquid Glass visual language (2026-07-24) — visual-intensity pass same day; rim/fringe polish 2026-07-25. Superseded on optics by FR-PUB-00B: the concave displacement profile and undersized filter region shipped here were the cause of the grey rim collar and the focal-panel edge tearing. Lighthouse re-run and merged with FR-PUB-00B on 2026-07-25.
- [x] FR-PUB-00B Liquid-glass theme architecture, optics correction & refractable substrate (2026-07-25) — convex inward-sampling profile; filter region >= max displacement + 8 px (tearing fixed); three per-channel displacement passes at 4.5% stagger replacing the painted fringe; specular encoded in the map's blue channel replacing feSpecularLighting on a flat SourceAlpha; 256 px softened map. Light/dark value ladders on the existing brand hues with #F7FAF9 kept as --paper; dark --card/--muted-foreground collision defects fixed. Neutral glass fills with hue by transmission only; deepened teal plate behind primary buttons for AA. Sharp refractable substrate (alphas <=0.08, mask floor 0.34) + full bezel and five interaction states across the glass family; segmented backing changed from a duplicated label copy to a teal-to-mint highlight fill. Round-2 rebalance: per-theme ambient opacity tokens, blur 80 px, blobs <=30 rem, and the ambient composite added to the contrast model including primary-as-eyebrow. 129 tests green, lint and build clean. Lighthouse 99 Perf / 100 A11y. Brand and ambient colour tokens byte-identical to 69f67d4.
- [x] FR-PUB-01 home (2026-07-25) — SSR home per SPEC 16.1; SPEC 18 SEO complete; Organization + WebSite JSON-LD only; robots.ts + sitemap.ts added; CI claims allow-list blocks invented statistics; testimonials empty by design. Production Lighthouse 100 Perf / 100 A11y / 100 BP / 100 SEO. Zero focal refraction; LCP 0.6s.
- [ ] FR-PUB-02 jobs pages  - [ ] FR-PUB-03 /freelancers
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
