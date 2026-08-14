---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 00:22'
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
2026-08-14. Branch main; product commit 7bac7ca (feat: add SLYE configuration onboarding), followed by the commit containing this handoff snapshot. No Git remote is configured, so nothing is pushed. Slice 1 and slice 2 are complete and committed. Slice 2 adds strict atomic slye.json configuration, trusted project-over-global precedence, TUI startup warnings, authenticated scoped model selection, and /slye model|on|off. Typecheck and 16 Node tests pass; taste and spec reviewers approved with no must-fix findings. Both global and sandbox SLYE config files were absent immediately before this handoff. No rewrite, transcript observation, custom entry, or model completion exists yet. Durable work record: TASK-1.

WHAT'S NEXT
1. Run the slice-2 manual gate from the sibling sandbox: cd ../speak_like_you_eat_sandbox && pi --approve. Confirm the yellow warning, run /slye model, choose an authenticated model, then choose This project only. Submit no prompt.
2. Exit with Ctrl+D, inspect .pi/slye.json, restart Pi, run /slye off, exit and confirm enabled is false while model remains, then restart and run /slye on; it must re-enable without opening a picker.
3. Report the result. If it passes, begin TASK-1 slice 3 only: final-response eligibility/context logic and a deterministic display companion-entry stub.

WAITING ON / GATED BY
As of 2026-08-14, slice 3 is gated only by zambo's manual slice-2 sandbox check. Backlog CLI 1.50.1 still cannot populate decision-1 after creation; its accepted rationale remains in TASK-1 implementation notes and is not blocking.

VERIFY
Run git status -sb; git log --oneline -4; npm run check; backlog task view TASK-1 --plain; backlog doc view doc-1 --plain; backlog doc view doc-2 --plain; cd ../speak_like_you_eat_sandbox && pi list --approve. Before the manual gate, both ${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/slye.json and sandbox .pi/slye.json should be absent.
<!-- SECTION:DESCRIPTION:END -->
