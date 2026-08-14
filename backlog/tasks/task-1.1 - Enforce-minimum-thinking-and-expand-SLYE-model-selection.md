---
id: TASK-1.1
title: Enforce minimum thinking and expand SLYE model selection
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-08-14 19:24'
updated_date: '2026-08-14 20:09'
labels: []
dependencies: []
references:
  - backlog/docs/specs/doc-1 - SLYE-MVP-specification.md
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
- [ ] #1 Each rewrite derives and uses the selected model's lowest currently supported thinking level in order off, minimal, low, medium, high, xhigh, max; off is represented without a reasoning option, no level is persisted, and Pi's active model/thinking remain unchanged.
- [ ] #2 The SLYE model picker opens on authenticated eligible scoped models when present, supports search, and uses Tab to switch non-persistently between scoped and all authenticated eligible Pi models.
- [ ] #3 The picker and save confirmation display provider, model, and the automatically selected thinking level; saved configurations keep the existing strict schema and re-resolve capabilities before use.
- [ ] #4 The translator request remains a direct isolated completion containing only SLYE's system prompt, bounded selected chat context, and target, with no AgentSession, AGENTS.md, resource loader, tools, project files, or additional session history supplied by SLYE.
- [ ] #5 Missing authentication, provider failures, cancellation, timeout, or malformed model capability metadata preserve the original response and follow existing fail-open warning behavior.
- [ ] #6 Automated tests cover thinking selection, provider-neutral completion options/auth forwarding, exact request isolation, scoped/all Tab switching, search, cancellation, persistence, and non-TUI behavior; documentation and the packed package describe the resulting behavior.
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
<!-- SECTION:NOTES:END -->
