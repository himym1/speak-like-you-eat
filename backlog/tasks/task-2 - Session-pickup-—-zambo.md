---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 17:56'
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
2026-08-14. Branch `main`; report commit `e55f85b` (`docs: publish SLYE benchmark results`) followed by the commit containing this pickup snapshot. No Git remote is configured, so nothing is pushed. The tracked tree is clean. The new governed report is `backlog/docs/specs/doc-4 - SLYE-benchmark-results.md`, linked from README/doc-1/doc-3 and included in the exact nine-file package. Adversarial raw-row review corrected historical aggregate errors: phase one costs USD 0.06482709 with overall median 3,800.5ms and mathematically correct per-candidate medians; phase two costs USD 0.00238211. FINDINGS.md and TASK-3 preserve the falsified old values and corrections. `npm run check` passes 56 tests, both dry-runs retain approved fingerprints/budgets, and the package allowlist is nine files. Zambo then requested three follow-ups: enforce low/off thinking for the translator, guarantee it does not load AGENTS.md or other automatic Pi context, and let `/slye model` switch between scoped and all authenticated Pi models. Pi docs and real code were inspected. Current SLYE already makes a direct `ctx.modelRegistry.complete` call with only its rewrite Context and does not create an AgentSession/ResourceLoader or load tools/files; exact payload tests exist. Current picker uses scoped models whenever nonempty and all authenticated available models only when scope is empty. Pi's built-in selector convention uses Tab to switch scoped/all. Current SLYE completion does not explicitly select thinking.

WHAT'S NEXT
1. Wait for zambo's answers to the active design round: Q1 prefer off, fall back to low, and reject models supporting neither; Q2 open scoped by default and use Tab for a non-persistent switch to all authenticated eligible models; Q3 document/test the isolation boundary SLYE controls while acknowledging other installed extensions/provider-side behavior is outside its control.
2. After those prerequisites settle, ask only dependent questions if any (for example read-only thinking labels and unsupported saved-model behavior), confirm shared understanding, then create/plan a normal Backlog task before implementation. Do not implement until grilling is complete.
3. Keep feature work separate from `e55f85b`. Likely code areas are `src/index.ts`, `src/model-rewrite.ts`, a small dedicated picker module if custom TUI is needed, onboarding/model-rewrite tests, README/doc-1/doc-4, and package smoke tests. Use the Pi custom TUI SelectList/Input pattern and public APIs only; do not import internal `dist/modes/interactive/components/model-selector`.
4. TASK-1 remains In Progress and still needs final docs-reviewer/final-reviewer/finalization after these user-requested hardening changes.

WAITING ON / GATED BY
As of 2026-08-14, implementation of the three follow-ups is gated only by zambo's answers to Q1-Q3. No model call is approved or needed. A provider-neutral way to enforce thinking must use supported public Pi APIs and model capability metadata; do not rely on a private ModelRegistry runtime field. The forgotten earlier side note is no longer presumed separate because these three items may be it, but do not assume that unless zambo confirms.

VERIFY
Run `git status -sb`; `git log --oneline -5`; `npm run check`; `npm pack --dry-run --json`; `backlog doc view doc-4 --plain`; `backlog task view TASK-1 --plain`; and inspect `src/index.ts`, `src/model-rewrite.ts`, `test/onboarding.test.ts`, and Pi's current models/extensions/TUI docs before planning implementation.
<!-- SECTION:DESCRIPTION:END -->
