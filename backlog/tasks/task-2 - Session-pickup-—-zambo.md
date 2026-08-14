---
id: TASK-2
title: Session pickup — zambo
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-14 01:47'
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
2026-08-14. Branch main; product commit ed1f26d (feat: add real SLYE model rewriting), followed by the commit containing this handoff snapshot. No Git remote is configured, so nothing is pushed. Slices 1-4 are implemented and committed. Slice 3's sandbox card/resume gate passed. Slice 4 removes SLYE_STUB, calls the configured authenticated model with an isolated rewrite-only request, shows Rewriting AI-speak…, supports silent Escape cancellation, stops waiting after 45 seconds, validates normal-stop nonblank output, and appends only display text. The model-picker NUL composite key was replaced by explicit provider/id comparison. Typecheck and 33 Node tests pass; taste/spec reviewers found no must-fix issues. A non-cooperative provider may continue and consume usage after local cancellation/timeout. Durable work record: TASK-1.

WHAT'S NEXT
1. Run the slice-4 manual gate: cd ../speak_like_you_eat_sandbox && pi --approve. Submit one Italian prompt that produces more than 200 prose characters and includes fixed technical literals, Markdown, and fenced code.
2. Verify the unchanged original appears first, the exact working text Rewriting AI-speak… appears while the secondary request runs, then exactly one 🤌 Speak like you eat: card appears in Italian and preserves every fixed literal, Markdown structure, command, and fenced block.
3. Submit another eligible long prompt; once Rewriting AI-speak… appears, press Escape. Verify the original remains, no SLYE card is appended for that answer, and no warning appears. The started secondary request may consume provider usage.
4. Exit with Ctrl+D, then run pi --continue --approve. Verify the saved successful card renders and resume alone appends no duplicate.
5. Report the result. If it passes, begin TASK-1 slice 5 only: integrated hardening/package checks, final documentation, acceptance verification, docs-reviewer, and final-reviewer.

WAITING ON / GATED BY
As of 2026-08-14, slice 5 is gated only by zambo's manual slice-4 success/cancellation/resume check. The success path makes one primary request plus one secondary rewrite request. The cancellation path makes another primary request and starts a secondary request that may consume usage. Backlog CLI 1.50.1 still cannot populate decision-1 after creation; its rationale remains in TASK-1 notes and is not blocking.

VERIFY
Run git status -sb; git log --oneline -6; npm run check; backlog task view TASK-1 --plain; backlog doc view doc-1 --plain; backlog doc view doc-2 --plain; cd ../speak_like_you_eat_sandbox && pi list --approve; jq '{enabled, model}' .pi/slye.json.
<!-- SECTION:DESCRIPTION:END -->
