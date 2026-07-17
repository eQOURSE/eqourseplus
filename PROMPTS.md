# PROMPTS.md — Copy-paste prompt templates (vibe-coding playbook)

## The one prompt pattern you use 90% of the time (any IDE)
> Read AGENTS.md, then SPEC.md.
> Implement **FR-XXX-nn** ("<paste the requirement text>").
> Acceptance criterion: "<paste it from SPEC.md>".
> Relevant context: Sections <5.x>, Flow <F#>, collections <names> (Section 19.2), screens (Section 16.x if UI).
> Plan first: list the files you will create/modify and the test cases. Wait for my "go".
> Then: write the failing tests, implement, make tests pass, run lint, update PROGRESS.md.
> Do not touch anything outside this FR.

Why "plan first, wait for go": it catches an agent about to do something dumb BEFORE it writes 40 files.

## Session-start prompt (new chat, any day)
> Read AGENTS.md, SPEC.md and PROGRESS.md. Tell me: current phase, last completed FR,
> and the next 3 FRs in phase order with a one-line plan each. Do not write code yet.

## Bug-fix prompt
> Bug in FR-XXX: <symptom + steps + expected vs actual + error/logs>.
> First write a failing test that reproduces it, then fix. Do not refactor unrelated code.

## UI screen prompt
> Build the "<screen name>" screen exactly per SPEC.md Section 16.<x> and rule 12 of AGENTS.md
> (tokens, empty states, responsive, WCAG-AA). Use mock data behind the existing API types from
> packages/shared. Show me a component tree plan first.

## Review prompt (run after every 3–4 FRs, in a FRESH session)
> Act as a strict senior reviewer. Read AGENTS.md. Review the diff of the last N commits for:
> rule violations (state machines, adapters, money-as-integers, append-only ledger, secrets, RBAC on routes),
> missing tests, and drift from SPEC.md. Output a numbered list of issues with file:line. Change nothing.

## Kiro specifically
Point Kiro's spec at one FR cluster: "Create a spec for FR-TST-01..06 from SPEC.md Section 5.2 + Flow F1.
Requirements/design/tasks must reference the FR IDs; flag anything you add that has no FR ID."
Approve requirements.md/design.md yourself before letting it execute tasks.

## Antigravity specifically
Antigravity reads AGENTS.md automatically from the workspace root. Work in Agent mode with the
plan/artifacts view on; approve the plan before execution; keep one FR per task. If it proposes a browser
verification step for UI FRs, allow it — screenshot verification catches layout drift cheaply.

## Golden habits
1. One FR per session/chat. New FR = new chat (fresh context beats polluted context).
2. Commit after every green FR. Never let 2 FRs share one commit.
3. If the agent goes sideways twice on the same FR, stop prompting harder — the FR is probably
   ambiguous. Rewrite the FR in SPEC.md more precisely, then retry in a fresh session.
4. Friday ritual: run the Review prompt + `pnpm test` on the whole repo + read PROGRESS.md.
