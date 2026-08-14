---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 01:12'
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
2026-08-14. Branch main; product commit d4bb371 (feat: add SLYE companion entry stub), followed by the commit containing this handoff snapshot. No Git remote is configured, so nothing is pushed. Slices 1-3 are complete and committed. Slice 3 adds agent_end final-response eligibility, 200-character fenced-prose gating, bounded two-turn natural-language context preparation, and a persistent display-only slye.rewrite card under temporary SLYE_STUB=1. It makes no secondary-model call. Typecheck and 27 Node tests pass; taste and spec reviewers approved with no must-fix findings. Sandbox project config is enabled with ollama-cloud/deepseek-v4-flash:0731. Real rewriting, loading text, cancellation, timeout, and provider completion are not implemented. Durable work record: TASK-1.

WHAT'S NEXT
1. Run the slice-3 manual gate: cd ../speak_like_you_eat_sandbox && SLYE_STUB=1 pi --approve. Submit one prompt that produces a normally completed answer with more than 200 prose characters.
2. Verify the original remains visible and exactly one card headed 🤌 Speak like you eat: appears, beginning with Development stub — no secondary model called. and repeating the complete target.
3. Exit with Ctrl+D, then run SLYE_STUB=1 pi --continue --approve. Verify the persisted card renders and resume alone creates no duplicate.
4. Report the result. If it passes, begin TASK-1 slice 4 only: replace the development stub with the configured model call, native loading text, Escape cancellation, 45-second timeout, and fail-open provider handling.

WAITING ON / GATED BY
As of 2026-08-14, slice 4 is gated only by zambo's manual slice-3 transcript/resume check. That check makes one primary-model request and zero secondary-model requests. Backlog CLI 1.50.1 still cannot populate decision-1 after creation; its rationale remains in TASK-1 notes and is not blocking.

VERIFY
Run git status -sb; git log --oneline -6; npm run check; backlog task view TASK-1 --plain; backlog doc view doc-1 --plain; backlog doc view doc-2 --plain; cd ../speak_like_you_eat_sandbox && pi list --approve; jq '{enabled, model}' .pi/slye.json.
<!-- SECTION:DESCRIPTION:END -->
