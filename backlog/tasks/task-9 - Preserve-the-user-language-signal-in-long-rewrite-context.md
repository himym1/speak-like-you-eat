---
id: TASK-9
title: Preserve the user language signal in long rewrite context
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-17 00:14'
labels: []
dependencies: []
references:
  - src/rewrite.ts
  - src/model-rewrite.ts
  - test/rewrite.test.ts
  - test/model-rewrite.test.ts
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix SLYE context budgeting so the most recent user message used as the output-language source cannot be evicted by long or mixed assistant prose. The current 8,000-character suffix policy can leave assistant-only context while the system prompt requires language to come only from user-labelled context, causing models such as DeepSeek to fall back to the target or dominant assistant language.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Context budgeting always retains a bounded most-recent user language source whenever one exists, including when later intermediate assistant prose alone exceeds the 8,000-character budget.
- [ ] #2 The rewrite request remains one isolated API user message containing only SLYE's system prompt, bounded selected context, and target; no chat/session/tool/project context is added.
- [ ] #3 Long and mixed-language regression tests prove the latest user language source remains present and salient while total serialized context stays at or below 8,000 characters.
- [ ] #4 Relevant assistant prose is retained only with remaining budget and cannot displace the latest user language source; ambiguous user messages are handled without claiming deterministic language detection.
- [ ] #5 Any production prompt or serialization change is reconciled with the frozen benchmark evidence and governed specification before release; no benchmark/model call runs without explicit approval.
<!-- AC:END -->
