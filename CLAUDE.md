# CLAUDE.md — Claude Code instructions
Read AGENTS.md and follow every rule in it — it is the contract for this repo.
Then read SPEC.md for the requirement being implemented (the human will give you an FR ID).
Workflow each session: 1) restate the FR + acceptance criterion, 2) list files you'll touch, 3) write failing test, 4) implement, 5) run tests/lint, 6) update PROGRESS.md, 7) summarize what a reviewer should check.
Useful commands: pnpm dev · pnpm test · pnpm lint · pnpm build · pnpm db:migrate
Never run destructive DB commands against non-dev databases.
