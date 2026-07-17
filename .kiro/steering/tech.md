# Tech steering (Kiro)
Fixed stack (see AGENTS.md for full rules): Turborepo — apps/web Next.js 14 App Router TS + Tailwind + shadcn/ui;
apps/api NestJS Node 20; MongoDB Atlas + Mongoose strict; Upstash Redis + BullMQ; Cloudflare R2;
adapters in packages/adapters for KYC/e-sign/payout/proctor/storage/LLM. Tests-first (vitest/jest + supertest).
Money = integer minor units + currency. Ledger writes = Mongo transactions. earningLines/auditLogs append-only.
