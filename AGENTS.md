# AGENTS.md — Universal rules for AI coding agents (Antigravity, Codex, Cursor, any AGENTS.md-aware tool)
# This file is LAW. Read it at the start of every session.

## Project
eQOURSE+ (plus.eqourse.com) — workforce & project delivery platform for eQOURSE + Tutrain.
The full specification is in ./SPEC.md. The PDF (eQOURSE-plus-SRS-v2.pdf) is the human reference; SPEC.md is yours.

## Non-negotiable rules
1. Implement ONLY requirements that exist in SPEC.md, referenced by FR ID (e.g., FR-REG-03). If a task has no FR ID, ask the human to add one first. Never invent features, endpoints, collections, or fields not in SPEC.md Sections 8/9/19.
2. One FR (or one tightly-related FR cluster) per session. Small verified slices. After finishing, update PROGRESS.md (mark the FR done with date + notes).
3. TESTS FIRST. Write the test that encodes the FR's acceptance criterion, watch it fail, then implement. No PR/commit without passing tests. Do not weaken or delete a failing test to make it pass.
4. State machines are law: profile states (FR-REG-06), task states (Flow F4), payout states (Flow F5) must be explicit TypeScript enums + transition-guard functions in the service layer. Never ad-hoc status strings or booleans.
5. All third-party services go through the adapter layer in packages/adapters (KYCAdapter, ESignAdapter, PayoutAdapter, ProctorAdapter, StorageAdapter, LLMAdapter). Never call a provider SDK directly from a controller/component.
6. NEVER touch payments, ledger (earningLines), or KYC adapter code without the human explicitly asking for that FR. earningLines and auditLogs are APPEND-ONLY — no update/delete operations, ever.
7. All ledger/payout writes use MongoDB multi-document transactions. All money is stored as integer minor units (paise/cents) + currency code. Never floats for money.
8. Secrets: only via environment variables (.env locally, Doppler/GCP Secret Manager deployed). If you need a new secret, add it to .env.example with a comment and tell the human. Never hardcode keys, never commit .env.
9. Security defaults: validate every input with zod/class-validator; RBAC check on every API route; rate-limit auth + public endpoints; no PII in logs; signed URLs for file access.
10. New dependencies require asking the human first (one-line justification). Prefer stdlib/existing deps.
11. Public pages must follow SPEC.md Section 18 SEO standards (SSR, title/meta/canonical/JSON-LD). App routes are noindex.
12. UI: Tailwind + shadcn/ui, tokens in packages/ui — primary #F59E0B, text #1E293B, Inter/Plus Jakarta Sans, rounded-2xl cards, WCAG-AA, every empty state = illustration + one line + CTA. Match SPEC.md Section 16 screen specs exactly.
13. Git: branch feat/FR-XXX-nn-short-name; conventional commits; PR description lists FR IDs + pasted acceptance criteria checklist.
14. If SPEC.md is ambiguous, STOP and ask. Do not guess silently.

## Stack (fixed — do not substitute)
Turborepo monorepo: apps/web (Next.js 14+ App Router, TS), apps/api (NestJS, Node 20),
packages/ui, packages/adapters, packages/shared (types, enums, zod schemas).
MongoDB Atlas via Mongoose (strict schemas + collection validators, migrate-mongo).
Redis (Upstash) + BullMQ for jobs. Files on Cloudflare R2 via StorageAdapter.
Deploy: web → Vercel/Cloudflare, api → GCP Cloud Run (asia-south1), staging → Utho server (Docker + Dokploy).

## Definition of done for any FR
Code + tests green + lint clean + PROGRESS.md updated + acceptance criterion demonstrably true + no rule above violated.
