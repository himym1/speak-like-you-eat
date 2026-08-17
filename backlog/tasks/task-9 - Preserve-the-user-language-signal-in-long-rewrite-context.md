---
id: TASK-9
title: Preserve the target response language during rewriting
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-17 00:14'
updated_date: '2026-08-17 00:24'
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
Prevent SLYE from translating a response while simplifying it. The rewrite must preserve the language or intentional mix of languages already present in the target assistant response; prior context is only for topic understanding. In the observed Pandino session, the 1,978-character target was Italian but `ollama-cloud/deepseek-v4-flash:0731` returned English because the production prompt incorrectly told the model to choose language from user context and never from the target.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The production prompt explicitly requires preserving the target response's original language or intentional language mix and forbids translating it.
- [ ] #2 Prior user and assistant context is described and used only for topic understanding, never as the output-language authority.
- [ ] #3 The fix preserves one-message direct-completion isolation, the 8,000-character context ceiling, automatic minimum thinking, cancellation, timeout, and fail-open behavior; it adds no language detector, retry, or extra model call.
- [ ] #4 Automated tests cover an Italian target with English prompt/context pressure and a deliberately mixed-language target at the exact completion payload boundary.
- [ ] #5 Historical phase-one/phase-two benchmark prompts and fingerprints remain immutable evidence; the production prompt divergence and unbenchmarked language-preservation fix are documented without claiming new benchmark results.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed evidence from Pi session `2026-08-16T22-50-31-775Z_01a00cc4-fddf-749e-b38b-39ff35621c35.jsonl` in `/Users/wtfzambo/mystuff/projects/pandino`: selected model was `ollama-cloud/deepseek-v4-flash:0731`; reconstructed context totaled 896 serialized Italian characters; target was 1,978 Italian characters; generated companion began `Right now there is no separate pandino update command`. No new model call was made during diagnosis.

The user clarified the product rule on 2026-08-17: output language comes from the target response, not the latest user message. SLYE is a same-language rewriter, not a translator. If the assistant answers in English to an Italian user, SLYE should keep English; if the target intentionally mixes languages, SLYE should not translate either passage. Therefore use no dedicated user-language block, language detector, or retry. The prompt should state that the target language must be preserved and that context is for topic understanding only.

The earlier context-eviction hypothesis is not the cause of this incident. The limiter can independently produce assistant-only context, as an existing unit test demonstrates, but that is separate work and must not be presented as this bug's root cause.
<!-- SECTION:NOTES:END -->
