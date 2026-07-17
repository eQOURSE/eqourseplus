# Structure steering (Kiro)
apps/web        → Next.js (public SEO pages SSR/SSG; app routes noindex)
apps/api        → NestJS modules: auth, onboarding, kyb, tests(proctor), talent, projects, tasks, qa, finance, crm, admin, notifications, audit
packages/shared → enums (states from Flows F1–F5), zod schemas, types shared web/api
packages/adapters → provider adapters (never import provider SDKs elsewhere)
packages/ui     → design tokens + shadcn components
infra/          → Dockerfiles, GitHub Actions, migrate-mongo
Branch: feat/FR-XXX-nn-name. PROGRESS.md tracks FR completion.
