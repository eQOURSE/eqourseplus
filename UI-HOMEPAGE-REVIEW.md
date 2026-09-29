# Homepage presentation review — 2026-09-29

Branch: `ui-bhavesh`, based on `develop`. Homepage only; no merge to develop or main.

The user's pasted "Complete eQOURSE+ Homepage Content Architecture" is the copy source in `apps/web/content/approved-home.ts`. The supplied title, description, H1, subheadline, audience names, three pillars, eight specialization tracks, comparison statements, governance statements, seven FAQs, conversion names, and footer notice are retained. Header registration uses the supplied "Apply as an Expert" wording.

## Presentation

Teal green and white/mint in light mode; deep green with mint and warm white text in dark mode. Open alternating sections, sticky pillar introductions and a specialization reading pane replace the previous home-page cockpit mockup and repeating card grids. The earlier paper/serif/photo direction was abandoned before any commit. Its changes to other public pages were reverted.

Glass is concentrated in the frosted navigation, refractive audience selection, bounded animated artwork, tactile conversion controls, and certification motif. Regular surfaces carry longer copy. No new dependencies, remote images, fabricated dashboard metrics, routes or authentication behavior.

Reference: [Aave — Building Glass for the Web](https://aave.com/design/building-glass-for-the-web). The existing UI package supplies generated displacement maps, bounded SVG SourceGraphic filtering, chromatic edge passes and foreground text separation. Content remains readable outside the refracted artwork. CSS drift, floating lenses and existing selection motion are disabled under prefers-reduced-motion. Browser verification was in Chromium; Safari and Firefox were not independently tested.

## Homepage audit

| Page | H1 | H2 | H3 | FAQ questions | JSON-LD |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | 1 | 8 | 29 | 7 | FAQPage, Organization, WebSite |

H3 count includes the eight specialization headings present in SSR markup, with one visible at a time.

- Canonical: `https://plus.eqourse.com/`
- Hreflang en and x-default: `https://plus.eqourse.com/`, unchanged.
- Organization: exactly one top-level `https://plus.eqourse.com/#organization` node, unchanged, including the `https://www.eqourse.com/#organization` parent binding. About-page JSON-LD and every other page's metadata are untouched.
- Home had seven native FAQs but no FAQPage schema on develop. Added one FAQPage generated from the same supplied seven question/answer pairs.
- Broken CTA routes: 0. All nine internal destinations tested returned HTTP 200; home fragment targets exist.
- Remote images: 0. Existing self-hosted logo uses next/image with explicit dimensions, meaningful alt and priority. Decorative artwork is inline SVG; optical maps are generated locally.
- 375px and 1440px: no horizontal page overflow in either theme.
- Verified audience click and arrow-key selection, specialization selection, native FAQ expansion, and reduced-motion mode with zero active CSS animations.

## Validation

- `pnpm lint`: all five package tasks green.
- Full web suite: **41 files, 344 tests passed.** Command: `pnpm --filter @eqourse/web test -- --no-file-parallelism`. Every existing test is retained. Sequential file execution avoids resource contention without changing timeout limits or skipping tests.
- Extra `tsc --noEmit`: remaining errors occur only in unchanged authenticated/dashboard/design-system/HomeChrome/session-transport test fixtures. No errors remain in new homepage files. Those baseline errors were not modified because this branch is presentation only. A production/Vercel build is not claimed verified.

Legal footer labels remain plain text because the baseline has no implemented legal-page routes; no placeholder links were introduced. Enterprise consultation CTAs resolve to the existing client registration route.

Local preview: run `pnpm --filter @eqourse/web exec next dev --port 3100` from this worktree.

