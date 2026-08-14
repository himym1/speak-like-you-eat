---
id: TASK-1.1
title: Enforce minimum thinking and expand SLYE model selection
status: Done
assignee:
  - '@zambo'
created_date: '2026-08-14 19:24'
updated_date: '2026-08-14 20:31'
labels: []
dependencies: []
references:
  - backlog/docs/specs/doc-1 - SLYE-MVP-specification.md
  - >-
    backlog/decisions/decision-2 -
    Automatically-use-minimum-thinking-and-local-scoped-all-model-selection.md
  - doc-2
  - doc-4
documentation:
  - doc-1
  - doc-2
  - doc-4
modified_files:
  - src/index.ts
  - src/model-completion.ts
  - src/model-picker.ts
  - test/display.test.ts
  - test/model-completion.test.ts
  - test/model-picker.test.ts
  - test/onboarding.test.ts
  - test/package-contract.test.ts
  - test/picker-driver.ts
  - README.md
  - backlog/docs/specs/doc-1 - SLYE-MVP-specification.md
  - backlog/docs/specs/doc-4 - SLYE-benchmark-results.md
  - backlog/docs/runbooks/doc-2 - SLYE-sandbox-manual-checks.md
parent_task_id: TASK-1
priority: high
type: enhancement
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Harden SLYE's secondary-model path after the benchmark. Every rewrite must automatically use the selected model's lowest supported thinking level, expose that enforced level to the user, keep the direct request isolated from Pi resources and project context, and let the model picker switch between session-scoped and all authenticated Pi models without changing Pi's active conversation model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each rewrite derives and uses the selected model's lowest currently supported thinking level in order off, minimal, low, medium, high, xhigh, max; off is represented without a reasoning option, no level is persisted, and Pi's active model/thinking remain unchanged.
- [x] #2 The SLYE model picker opens on authenticated eligible scoped models when present, supports search, and uses Tab to switch non-persistently between scoped and all authenticated eligible Pi models.
- [x] #3 The picker and save confirmation display provider, model, and the automatically selected thinking level; saved configurations keep the existing strict schema and re-resolve capabilities before use.
- [x] #4 The translator request remains a direct isolated completion containing only SLYE's system prompt, bounded selected chat context, and target, with no AgentSession, AGENTS.md, resource loader, tools, project files, or additional session history supplied by SLYE.
- [x] #5 Missing authentication, provider failures, cancellation, timeout, or malformed model capability metadata preserve the original response and follow existing fail-open warning behavior.
- [x] #6 Automated tests cover thinking selection, provider-neutral completion options/auth forwarding, exact request isolation, scoped/all Tab switching, search, cancellation, persistence, and non-TUI behavior; documentation and the packed package describe the resulting behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a small typed model-policy/completion module using the public model metadata already exposed through ModelRegistry. Select the first supported level in the fixed order off, minimal, low, medium, high, xhigh, max, matching Pi's documented null/omitted/extended-level semantics without adding a duplicate pi-ai runtime dependency. Treat an impossible empty capability set as unusable; derive the level from current metadata instead of persisting it.
2. Add a provider-neutral isolated completion adapter using only public ModelRegistry provider/auth APIs plus the effective provider's streamSimple method. Mirror resolved API key, headers, environment, and auth-selected base URL; omit the reasoning property for off and pass the chosen non-off level otherwise. Preserve SLYE's exact rewrite Context, cache-none session, cancellation, timeout, output validation, and fail-open behavior; do not create an AgentSession or ResourceLoader.
3. Replace the simple model dialog with a dedicated searchable TUI picker that starts with eligible authenticated scoped models when present and uses Tab to switch non-persistently between scoped and all eligible authenticated models. Display provider/model and the automatically enforced thinking level. Keep cancellation write-free and retain global/project save behavior.
4. Re-resolve model capabilities before each rewrite and when validating saved models. Ignore any thinking level pinned by Pi's scoped-model entry because SLYE enforces its own minimum. Warn and perform no work for malformed models exposing no supported level.
5. Add focused tests for capability holes and extended levels, off omission versus non-off reasoning, resolved auth/base URL forwarding, provider completion failure, exact one-message isolated payload, absence of AgentSession/resource/tool/file inputs, selector search/scope toggle/default/cancellation, labels and notifications, saved-model behavior, and unchanged configuration schema.
6. Update README and governed product/benchmark documentation through Backlog CLI to state automatic minimum thinking, the Tab scope switch, and the exact isolation boundary SLYE controls. Do not promise control over other installed extensions or provider-side behavior.
7. Run Biome, type checking, all Node tests, both no-call benchmark dry-runs, exact package verification, a fresh npm install/tarball smoke, and a no-model-call sandbox picker check. Run taste/spec review before committing; later include this change in TASK-1's docs/final branch reviews.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation correction: adding a direct pi-ai dependency caused thousands of lockfile lines of duplicate dependency churn solely to call a small capability helper. The revised plan uses the same documented model metadata semantics through ModelRegistry-inferred types, preserving behavior without a new runtime dependency. The new coherent source module remains intentional, so the packed allowlist changes from nine to ten files.

Slice 1 complete: added a provider-neutral direct completion adapter and automatic lowest-thinking policy without a new runtime dependency. The fixed order is off, minimal, low, medium, high, xhigh, max; standard omitted map entries remain supported, null entries are excluded, and xhigh/max require explicit mappings. The adapter uses public provider/auth APIs, omits reasoning for off, forwards non-off reasoning plus resolved auth/headers/environment/base URL, and never creates an AgentSession or mutates Pi's active model. Saved malformed models fail open and remain unchanged. Taste/spec reviewers found no must-fix issues. Verification passed Biome, type checking, 65 tests, both no-call benchmark dry-runs with unchanged fingerprints/budgets, unchanged config/lock/benchmark files, and the intentional exact ten-file package.

Slice 2 code is complete; the required documentation slice (plan step 6) must follow before TASK-1.1 finalization. AC #6 remains open.

Slice 2 verification complete: `/slye model` now uses a searchable custom TUI picker, defaults to eligible authenticated scoped models, and uses Tab in both directions to show all authenticated eligible models while preserving search. It displays the automatically selected thinking level in rows and enable notifications, ignores scoped pinned thinking, keeps config schema unchanged, and handles empty results, no-scope Tab, wrapped navigation, Escape, and Ctrl-C without writes. Taste/spec review must-fixes were resolved through a shared plain test driver and simpler single-index picker state. Documentation remains the required next slice before finalization. Verification passed Biome, type checking, 73 tests, both no-call dry-runs with unchanged fingerprints/budgets, unchanged config/lock/benchmark files, and the intentional exact eleven-file package.

Accepted decision-2 records the user-approved policy. Rationale is retained here because Backlog CLI 1.50.1 cannot populate decision bodies: SLYE derives the first supported level in order off, minimal, low, medium, high, xhigh, max so the behavior is deterministic without stale configuration; users retain cost/latency responsibility through model choice. The picker mirrors Pi's scoped-first Tab convention without persisting a transient view. Direct provider streamSimple preserves a narrow request boundary and avoids creating a resource-loading agent session. Rejected: exposing manual thinking config, silently inheriting a scoped high level, importing private Pi internals, or creating a second AgentSession.

Documentation slice complete: README and doc-1 now describe searchable scoped/all picker behavior, automatic minimum thinking, malformed-metadata fail-open, and SLYE's direct isolation boundary. Doc-2 adds the no-model-call picker procedure and package guidance; doc-4 distinguishes explicit benchmark thinking labels from SLYE's automatic policy. No acceptance criteria were checked and TASK-1.1 remains in progress.

Final validation on 2026-08-14 passed: npm run check completed Biome, TypeScript, and 73/73 Node tests; phase-one and phase-two no-call dry-runs retained fingerprints 80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759 and 59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728; npm pack produced the exact intentional 11-file allowlist; a fresh tarball install was discovered by offline pi list. A scripted trusted-sandbox TUI check rendered scoped and all authenticated views with thinking labels, switched Tab in both directions, then cancelled without changing the pre-existing .pi/slye.json hash; no prompt or model request was submitted. Taste/spec reviewers reported no remaining must-fix findings after the runbook no-write proof was made a single-shell procedure. Benchmark code/manifests, package-lock.json, and the strict configuration schema remain unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SLYE now derives and sends each translator model's minimum supported thinking level through an isolated direct provider completion, offers a searchable scoped/all picker with visible effective thinking and write-free cancellation, rechecks saved capabilities fail-open, and documents the controlled isolation boundary. Verified with 73 tests, Biome, TypeScript, unchanged benchmark fingerprints, exact 11-file packaging, fresh tarball discovery, and a no-request sandbox picker check.
<!-- SECTION:FINAL_SUMMARY:END -->
