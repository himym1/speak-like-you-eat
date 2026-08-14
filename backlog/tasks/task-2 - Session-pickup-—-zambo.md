---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 16:09'
labels:
  - continuity
  - handoff
dependencies: []
priority: high
type: task
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
WHERE WE LEFT OFF
2026-08-14. Branch `main`; production prompt commit `56d99cb` (`feat: promote benchmarked rewrite prompt`) followed by the commit containing this pickup snapshot. No Git remote is configured, so nothing is pushed. The tracked tree is clean. TASK-3 and TASK-4 are Done. Production `buildRewriteContext` now uses the exact phase-two prompt that replaces clichés/corporate filler with plain meaning, keeps already-clear prose close to its original structure, and forbids simplification by deleting claims or conditions. Benchmark-only frozen phase-one/phase-two system prompts preserve approved fingerprints `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759` and `59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728`; committed manifests remain canonical. `npm run check` passes Biome, tsc, and 56 tests; the pre-commit hook itself passed on the prompt commit; the npm package remains exactly eight files. Public spec/runbook/README contain current prompt behavior and benchmark guidance. Measured phase-one means: Terra off 4,064 ms versus DeepSeek off 1,321 ms, so Terra was about 3.1× slower; with the promoted prompt on phase two, Terra was 2,973 ms versus DeepSeek 1,031 ms, about 2.9× slower. GPT-OSS 20B was tested at low and high across all six fixtures: Q 1.417 at 1,667 ms mean for low, Q 1.583 at 17,246 ms mean for high; it was not shortlisted. GPT-OSS 120B low's phase-two regression was stylistic only: Q 1.667→1.500, caused by a 2→1.5 inflated-prose score with awkward/clichéd English; fidelity and safety stayed 2.

WHAT'S NEXT
1. Resume TASK-1 final closure: read the finalization guide, re-run integrated/package/sandbox no-request verification, objectively check all acceptance criteria, and update the task through Backlog CLI.
2. Run docs-reviewer once because authoritative specs/runbooks/README changed, resolve findings, then run final-reviewer once against the whole branch and resolve any must-fix findings.
3. Mark TASK-1 Done only after those branch-level reviews and final checks, commit the closure record, and report the finished MVP. No Git push is possible until a remote is configured.
4. If zambo remembers the forgotten side note, assess it separately before or after closure according to scope; do not infer it.

WAITING ON / GATED BY
As of 2026-08-14, no technical or benchmark gate remains. TASK-1 needs only final integrated verification and branch-level docs/final reviews. No additional model call is approved or needed. The forgotten side note is not treated as a blocker unless zambo says it is.

VERIFY
Run `git status -sb`; `git log --oneline -6`; `npm run check`; `npm run benchmark:dry-run | tail -4`; `npm run benchmark:phase-2:dry-run | tail -4`; `npm pack --dry-run --json`; `backlog task view TASK-3 --plain`; `backlog task view TASK-4 --plain`; and inspect TASK-1 before finalization.
<!-- SECTION:DESCRIPTION:END -->
