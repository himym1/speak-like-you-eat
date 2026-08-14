---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 15:37'
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
2026-08-14. Branch `main`; tooling commit `b1fa73d` (`chore: automate pre-commit quality checks`) and phase-two comparison record `4d4ef71` (`chore: record phase two prompt comparison`), followed by the commit containing this pickup snapshot. No Git remote is configured, so nothing is pushed. The tracked tree is clean. TASK-4 is Done: Biome 2.5.8 formats/lints 24 explicitly scoped TypeScript/JSON files, `tsc` uses tsconfig `noEmit`, Lefthook 2.1.10 auto-installs and runs staged Biome safe fixes/re-stage → typecheck → 55 Node tests, docs-only commits pass, real failures block, and partial unstaged hunks remain unstaged. The eight-file npm package and canonical benchmark manifests remain unchanged. Phase-two blind scores were locked before reveal at SHA-256 `87381478f7a4fefb409b75bf720b599dda31328dcdf43a8e79c9f8a58e85e585`. On the three matched fixtures, Terra off mean Q changed 1.667→2.000, GPT-OSS 120B low 1.667→1.500, and DeepSeek V4 off 1.333→1.500; every F and S remained 2. Across all nine rows, mean Q changed 1.556→1.667. Terra alone fully fixed backup-cliche. TASK-3 records the comparison; no further call ran.

WHAT'S NEXT
1. Obtain zambo's product decision on promoting the evidence-based prompt variant into production. Recommendation: promote it because aggregate Q improved and no fidelity/safety score regressed, while documenting that the quality effect was model-dependent.
2. If approved, add the exact three tested instructions to the production system prompt immediately before output-only, add focused tests that prove exact prompt order and unchanged isolated payload, run the integrated hook/checks, and manually verify one real sandbox rewrite without expanding the benchmark matrix.
3. Publish final model guidance: quality-first Terra off; fast/value option GPT-OSS 120B low under the baseline prompt but phase-two regression noted; fast baseline DeepSeek off; avoid higher thinking because it did not reliably help.
4. Finalize TASK-3 with aggregate evidence and any production prompt decision, then complete TASK-1 acceptance checks, docs-reviewer, final-reviewer, and MVP closure.

WAITING ON / GATED BY
As of 2026-08-14, TASK-3 and TASK-1 are gated by zambo's decision to promote or reject the tested prompt variant. Zambo also mentioned a forgotten side note; no work is inferred until it is remembered. No further benchmark/model call is approved or needed.

VERIFY
Run `git status -sb`; `git log --oneline -6`; `npm run check`; `npx --no-install lefthook check-install`; `backlog task view TASK-4 --plain`; `backlog task view TASK-3 --plain`; and inspect `benchmark/.work/phase-2/human-comparison.json` against locked score hash `87381478f7a4fefb409b75bf720b599dda31328dcdf43a8e79c9f8a58e85e585`.
<!-- SECTION:DESCRIPTION:END -->
