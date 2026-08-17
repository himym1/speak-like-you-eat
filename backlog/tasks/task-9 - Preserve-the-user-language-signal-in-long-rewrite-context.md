---
id: TASK-9
title: Preserve the target response language during rewriting
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-08-17 00:14'
updated_date: '2026-08-17 00:34'
labels: []
dependencies: []
references:
  - src/rewrite.ts
  - src/model-rewrite.ts
  - test/rewrite.test.ts
  - test/model-rewrite.test.ts
modified_files:
  - src/model-rewrite.ts
  - test/model-rewrite.test.ts
  - test/benchmark.test.ts
  - test/display.test.ts
  - README.md
  - backlog/docs/specs/doc-1 - SLYE-MVP-specification.md
  - backlog/docs/runbooks/doc-2 - SLYE-sandbox-manual-checks.md
  - backlog/docs/specs/doc-4 - SLYE-benchmark-results.md
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Change only the production rewrite prompt's language policy: keep the target in its original language, preserve intentional mixed-language passages, forbid translation, and state that prior context is only for topic understanding. Add no detector, retry, extra request, language block, or context-selection change.
2. Update exact payload tests with Italian and intentionally mixed-language target cases under English context pressure. Preserve the single API user message, complete target, timeout, cancellation, fail-open behavior, and all completion options.
3. Decouple the production-prompt assertion from the frozen phase-two benchmark prompt while continuing to assert identical benchmark message serialization and exact immutable historical prompt/manifests/fingerprints. Do not modify either benchmark prompt snapshot or manifest JSON.
4. Update authoritative doc-1 through Backlog CLI, the manual sandbox check in doc-2, README's public guarantees, and doc-4's benchmark scope/caveat. State that SLYE preserves target language and that the post-1.0 language hardening was not separately benchmarked; do not claim new quality evidence.
5. Run Biome, TypeScript, all tests, both no-call benchmark dry-runs, manifest cleanliness, exact 12-file pack, and diff checks. Make no provider/model or benchmark execution call.
6. Run taste/spec review, integrated verification, docs review, and final review. Commit as `fix: preserve target response language` so Release Please generates a stable 1.0.1 release PR.
7. Inspect and run hosted no-call checks on the generated 1.0.1 branch, review and merge it, then verify exact-tag OIDC publication, provenance, exact 12-file registry artifact, and clean Pi installation without a model request.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed evidence from Pi session `2026-08-16T22-50-31-775Z_01a00cc4-fddf-749e-b38b-39ff35621c35.jsonl` in `/Users/wtfzambo/mystuff/projects/pandino`: selected model was `ollama-cloud/deepseek-v4-flash:0731`; reconstructed context totaled 896 serialized Italian characters; target was 1,978 Italian characters; generated companion began `Right now there is no separate pandino update command`. No new model call was made during diagnosis.

The user clarified the product rule on 2026-08-17: output language comes from the target response, not the latest user message. SLYE is a same-language rewriter, not a translator. If the assistant answers in English to an Italian user, SLYE should keep English; if the target intentionally mixes languages, SLYE should not translate either passage. Therefore use no dedicated user-language block, language detector, or retry. The prompt should state that the target language must be preserved and that context is for topic understanding only.

The earlier context-eviction hypothesis is not the cause of this incident. The limiter can independently produce assistant-only context, as an existing unit test demonstrates, but that is separate work and must not be presented as this bug's root cause.

Implementation approved as a prompt-only patch. The user explicitly rejected a language detector and retry as excessive; no dedicated user-language block is needed because the target itself is authoritative.

Implemented the prompt-only target-language policy, exact Italian and mixed-language payload-contract regressions, and historical phase-two prompt divergence assertions. Updated doc-1, doc-2, doc-4, README, and the stale display integration expectation; no provider/model call or benchmark execution ran.

Validation passed: npm run check (75 tests); both no-call benchmark dry-runs (phase-one fingerprint 80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759; phase-two fingerprint 59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728); unchanged manifest diff; and npm pack --dry-run --json with 12 files.
<!-- SECTION:NOTES:END -->
