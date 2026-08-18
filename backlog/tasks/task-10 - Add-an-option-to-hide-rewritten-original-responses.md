---
id: TASK-10
title: Add an option to hide rewritten original responses
status: Done
assignee:
  - '@himym1'
created_date: '2026-08-18 07:02'
updated_date: '2026-08-18 08:31'
labels: []
dependencies: []
references:
  - >-
    https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md#piregistermarkdowntransformertransformer
  - >-
    backlog/decisions/decision-3 -
    Hide-originals-with-display-only-fingerprints.md
priority: medium
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users who prefer the SLYE rewrite should be able to hide the duplicated original response in the TUI without changing the assistant message stored in the session or sent back to the model.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Existing configurations continue to show the original response by default.
- [x] #2 A persisted hide-original setting and slash commands let users hide, show, and inspect original-response display behavior.
- [x] #3 When hiding is enabled, a successful rewrite hides only the matching finalized assistant prose in the TUI while preserving the original session message and model context.
- [x] #4 Rewrite cancellation, timeout, or failure leaves the original response visible and appends no incomplete rewrite.
- [x] #5 Hidden originals remain hidden after session resume, and switching back to show mode restores them without restarting Pi.
- [x] #6 Automated tests and documentation cover the new behavior and its exact-content fingerprint limitation.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add backward-compatible `hideOriginal` configuration and `/slye original hide|show|status` commands while preserving the preference across model/on/off writes.
2. Keep the proven `agent_end` rewrite lifecycle. Persist SHA-256 fingerprints with every successful rewrite entry, then hide matching finalized Assistant Markdown only after the card append succeeds.
3. Register a display-only Markdown transformer that returns empty Markdown for matching assistant text when hiding is enabled; leave streaming, session data, and model context untouched.
4. Restore fingerprints from active-branch rewrite entries on session start and refresh Assistant components after resume or command toggles through a transient empty widget that does not take editor focus. Cancellation, timeout, provider failure, and append failure never mark an original hidden.
5. Add config, fingerprint, lifecycle, resume, command, and regression tests; update the authoritative spec, an accepted decision, README, and Unreleased changelog.
6. Run project checks and isolated TUI smoke, then complete taste/spec/docs/final reviews before committing, pushing, and installing the local fork.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research found `registerMarkdownTransformer` is display-only. The transformer lacks message IDs, so the feature will persist exact text-block SHA-256 fingerprints and document the identical-content limitation. Keeping rewrite dispatch in `agent_end` avoids message lifecycle reordering.

Implemented the pure fingerprint/transform module, the original-display runtime controller, backward-compatible config and commands, persisted rewrite fingerprints, restore/toggle behavior, and regression coverage. Baseline was 75 tests; integrated suite is now 84/84 with Biome, TypeScript, and package-contract checks passing.

Taste/spec review found that `setHiddenThinkingLabel()` changed unrelated UI state, decision-3 was empty, hide command persistence lacked direct coverage, and docs incorrectly said byte-identical. Replaced refresh with a transient empty `setWidget` factory that invalidates without taking focus or changing settings; filled decision-3 through Backlog Browser; added hide persistence assertions; documented trimmed rendered-text identity. Real TUI smoke verified hidden-only card output, immediate show restoring the original, immediate hide removing it again, and preserved editor focus.

Second taste/spec review found no must-fix, minor, unrequested, or wrong behavior. Reviewers confirmed all prior findings closed, package dry-run contains the expected 14 files, git diff check passes, and all six acceptance criteria trace to code/tests/docs.

Docs review rejected a fabricated stable 1.1.0 and fork-owned npm metadata because this fork is not being released. Restored package/release metadata to upstream-compatible 1.0.1, moved the feature to Unreleased, and documented Git-only fork installation.

Follow-up taste review found one minor wording issue: authoritative spec said the feature was only specified despite implemented code. Updated it to say implemented in this fork while delivery acceptance remains tracked in TASK-10. Spec review found no issues.

Final follow-up closed release-governance and evidence gaps: upstream-only job guards now prevent fork release/publish workflows, YAML structure is parsed in contract tests, hidden-mode cancellation/timeout/provider/non-stop/empty/append failures directly assert original visibility, runbooks are executable and self-cleaning, and historical TASK-2 is explicitly retired. The final taste reviewer's append-failure concern referred to the normal-mode test; the dedicated hidden-mode append-failure test calls startSession and directly verifies visibility.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented an opt-in display-only hide-original mode for the Git-only fork. /slye original hide|show|status persists the preference, hides only successfully rewritten finalized Assistant prose, keeps Session/model context unchanged, restores state on resume, and fails open on cancellation, exact 45-second timeout, provider/output/append errors. Added accepted decision/spec/README/changelog/runbook coverage and upstream-only release guards. Verification: Biome and TypeScript pass; 86/86 tests pass; npm audit reports 0 vulnerabilities; package dry-run is exactly 14 files; phase-one and phase-two benchmark fingerprints remain unchanged; real TUI smoke verified hide/show/hide without restart or focus loss. No npm publication or tag was created.
<!-- SECTION:FINAL_SUMMARY:END -->
