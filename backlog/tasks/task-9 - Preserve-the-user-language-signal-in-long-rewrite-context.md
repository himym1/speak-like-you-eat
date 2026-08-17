---
id: TASK-9
title: Prevent rewrites from switching away from the user's language
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-17 00:14'
updated_date: '2026-08-17 00:19'
labels: []
dependencies: []
references:
  - src/rewrite.ts
  - src/model-rewrite.ts
  - test/rewrite.test.ts
  - test/model-rewrite.test.ts
type: bug
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent a rewrite model from changing the output to the wrong language when the latest user message clearly establishes another language. The observed Pandino session used `ollama-cloud/deepseek-v4-flash:0731`: the latest user message was Italian, the retained context was 896 serialized characters and entirely Italian, and the 1,978-character target response was Italian, but SLYE returned an English rewrite. This incident is therefore a model/prompt adherence failure, not context-budget eviction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A sanitized regression fixture records the observed all-Italian Pandino payload and English DeepSeek rewrite without retaining unrelated session data.
- [ ] #2 For an unambiguous latest user language, SLYE strongly enforces that output language even when the system prompt, target, or earlier assistant prose uses another language; it does not merely mirror the target because cross-language rewriting remains intentional.
- [ ] #3 The solution preserves one-message direct-completion isolation, the 8,000-character context ceiling, automatic minimum thinking, cancellation, timeout, and fail-open behavior.
- [ ] #4 Automated tests cover the chosen prompt or output-validation behavior and the wrong-language failure path; any provider call or live DeepSeek verification requires explicit user approval.
- [ ] #5 The production prompt/serialization, governed specification, and benchmark claims remain internally consistent; changed benchmark evidence is not claimed without a newly approved benchmark.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed evidence from Pi session `2026-08-16T22-50-31-775Z_01a00cc4-fddf-749e-b38b-39ff35621c35.jsonl` in `/Users/wtfzambo/mystuff/projects/pandino`: latest user text was `ok, prossima domanda: se in un repo... adesso come funzionerebbe?`; selected model was `ollama-cloud/deepseek-v4-flash:0731`; reconstructed context roles were user (28 chars), assistant (670 chars), user (171 chars), totaling 896 serialized characters; target was 1,978 Italian characters; generated companion began `Right now there is no separate pandino update command`. No new model call was made during diagnosis.

The earlier hypothesis that the 8,000-character limiter removed the user language source is falsified for this incident. The limiter can independently produce assistant-only context, as the existing long-context unit test demonstrates, but that is not why this specific rewrite changed to English and must not be presented as its root cause.
<!-- SECTION:NOTES:END -->
