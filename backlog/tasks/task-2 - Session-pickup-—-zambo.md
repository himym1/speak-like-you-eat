---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 14:47'
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
2026-08-14. Branch `main`; phase-two setup commit `2ce99b0` (`feat: add gated phase two prompt benchmark`) followed by the commit containing this pickup snapshot. No Git remote is configured, so nothing is pushed. The tracked tree is clean. Phase one completed 108/108 calls, blind human scores were locked at SHA-256 `bbe90c535ac1a0d0e243dc3f4f0cae6bf97955eb0302e1cebf88d8a9b732979e`, and aggregate findings are recorded in TASK-3. Based on those scores, the user approved preparing—but not executing—a phase-two improved-prompt comparison. The reviewed no-call setup uses only backup-cliche, inflated-prose, and clear-control with Terra off, GPT-OSS 120B low, and DeepSeek V4 off: nine rows, fingerprint `59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728`, estimated-input/output-ceiling budget USD 0.15991218, and conservative maximum OpenRouter-equivalent budget USD 0.16476768. Phase-one fingerprint remains `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759`; call IDs are disjoint. The complete improved prompt and subsets are fingerprinted in `benchmark/phase-2-manifest.json`. `npm run check` passes 55 tests, the tarball remains eight files, reviewers found no must-fix issues, and `benchmark/.work/phase-2/` does not exist. No phase-two runtime, network, or model call has run.

WHAT'S NEXT
1. Obtain zambo's explicit approval for phase-two fingerprint `59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728` and conservative OpenRouter-equivalent budget USD 0.16476768.
2. Only after approval, run `npm run benchmark:phase-2:run -- --approve 59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728`.
3. Verify nine settled rows, record usage/cost, run `npm run benchmark:phase-2:report`, create a separate scored copy with nine placeholders, and keep `benchmark/.work/phase-2/blind-map.json` hidden until human scores are locked.
4. Reveal and compare each phase-two result against its matching phase-one baseline. If the prompt variant wins without fidelity/safety regressions, apply the three instructions to the production prompt with focused tests and manual sandbox verification; otherwise retain the phase-one prompt.
5. Publish aggregate recommendations, finalize TASK-3 through the Backlog finalization workflow, then complete TASK-1 docs/final reviews and MVP closure.

WAITING ON / GATED BY
As of 2026-08-14, phase-two execution is gated only by zambo's explicit approval of the exact fingerprint and USD 0.16476768 conservative budget. The prior approval covered setup and dry-run only. No judge-model or additional matrix call is approved.

VERIFY
Run `git status -sb`; `git log --oneline -5`; `npm run check`; `npm run benchmark:dry-run | tail -4`; `npm run benchmark:phase-2:dry-run | tail -13`; `test ! -e benchmark/.work/phase-2`; and `npm pack --dry-run --json` to confirm the eight-file package. Both dry-runs are no-call operations.
<!-- SECTION:DESCRIPTION:END -->
