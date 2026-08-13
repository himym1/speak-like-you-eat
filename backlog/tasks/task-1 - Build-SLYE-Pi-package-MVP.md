---
id: TASK-1
title: Build SLYE Pi package MVP
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-08-13 23:04'
updated_date: '2026-08-13 23:40'
labels: []
dependencies: []
references:
  - 'https://github.com/gvzdv/claudish-to-english'
priority: high
type: feature
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create an installable Pi package that rewrites completed AI responses into clear language matching the user’s language. The original assistant response must remain unchanged and visible; the rewrite is a display-only companion entry. Every failure must fail open so SLYE can never swallow or corrupt an answer. Development must proceed in manually testable vertical slices.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The repository is an installable Pi package with strict TypeScript checks and documented development commands.
- [ ] #2 In interactive TUI sessions, a normally completed final assistant response with at least 200 non-whitespace prose characters receives an appended SLYE rewrite; intermediate, aborted, errored, truncated, tool-call, thinking, and tool-result content is not rewritten.
- [ ] #3 The rewrite uses the language of the user and preserves facts, names, numbers, paths, Markdown structure, commands, and fenced code blocks.
- [ ] #4 The selected secondary model comes from authenticated Pi scoped models, is displayed as provider / model, and is configured through /slye model with global or project-local persistence in slye.json.
- [ ] #5 /slye on and /slye off persist in slye.json; enabling without a configured model opens model selection.
- [ ] #6 When no model is configured, Pi shows a non-modal yellow startup warning directing the user to /slye model; SLYE otherwise performs no work.
- [ ] #7 While rewriting, Pi shows Rewriting AI-speak…; Escape cancels without an error warning, and a 45-second timeout or provider/configuration failure leaves only the original response and emits at most one warning per session.
- [ ] #8 The appended entry is labelled 🤌 Speak like you eat:, persists across session resume, and never enters LLM context.
- [ ] #9 The rewriter receives the complete target response plus at most 8,000 characters of recent natural-language context from up to two preceding turns and relevant intermediate assistant prose; thinking, tool calls, tool results, and fenced code blocks from prior context are excluded.
- [ ] #10 SLYE is a no-op outside interactive TUI mode.
- [ ] #11 A separate sandbox project demonstrates each vertical slice manually before the next slice is implemented, and automated tests cover meaningful pure logic and failure behavior.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Establish the repository foundation and product truth: initialize Git, create the Pi package manifest and strict TypeScript configuration, use Node’s built-in test runner to avoid an unnecessary test framework, add the minimal extension entrypoint, create the authoritative Backlog specification and the decision recording why the MVP uses a display-only companion entry, and create a separate sandbox project. Verify type checking, tests, and package loading with `pi -e <repo>` from the sandbox.
2. Implement typed configuration and onboarding: validate `slye.json`, apply complete local-over-global precedence only for trusted projects, write configuration atomically, show the non-modal startup warning when unconfigured, and implement `/slye model|on|off` with an authenticated scoped-model picker and global/project scope choice. Add automated tests and stop for a manual sandbox test.
3. Implement the first end-to-end display slice with a deterministic development stub: identify only the final normally completed assistant response, apply the 200-character prose gate, build the bounded two-turn natural-language context while stripping prior fenced code blocks, append a persistent custom entry rendered as `🤌 Speak like you eat:`, and remain a no-op outside TUI mode. Verify automated behavior and stop for a manual sandbox test of the real transcript UX.
4. Replace the stub path with the selected Pi model: call `ctx.modelRegistry.complete` with the approved rewrite prompt, complete target response, and bounded context; show `Rewriting AI-speak…`; combine Escape cancellation with a 45-second timeout; restore UI state in `finally`; and fail open with at most one warning per session for non-user failures. Add focused tests and stop for a manual sandbox test using a user-selected configured model.
5. Harden and package the integrated MVP: verify resume rendering, invalid/missing configuration, missing auth/model, cancellation, timeout, response eligibility, context limits, and non-TUI no-op behavior; finish installation/development documentation; run formatter/lint if configured, strict type checking, all tests, and a local package installation smoke test.
6. Before each non-trivial commit, run taste-reviewer and spec-reviewer together, resolve every must-fix finding, verify the diff and checks directly, then commit that runnable slice. Before completion, run docs-reviewer because authoritative behavior/docs changed, then final-reviewer against the branch as a whole.

Slice 1 tooling correction: Backlog CLI 1.50.1 can create but cannot update decisions. Keep accepted decision-1 as the governed decision record, never edit its Markdown directly, record the temporarily unrepresentable rationale in TASK-1 implementation notes, and continue the remaining slice instead of blocking package work.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Backlog CLI 1.50.1 exposes decision create/list but no decision update/edit command or MCP decision tool. decision-1 was therefore created as accepted with the approved title, but its generated Context/Decision/Consequences body cannot be populated through a supported interface. Direct editing remains prohibited.

Architecture rationale temporarily recorded here because decision-1 cannot be populated through Backlog CLI 1.50.1: the MVP uses an appended display-only companion entry because Pi exposes no public API that can asynchronously hide or collapse a normal assistant row and later toggle it while preserving the stored/model-context message. Appending a custom entry leaves the original assistant response untouched, keeps the derived rewrite out of model context, persists across resume, and fails open structurally because a failed rewrite simply appends nothing. Rejected for the MVP: replacing the stored message and restoring originals through the context hook (history/context risk), a cached Markdown transformer (no public per-message invalidation for a reliable original/rewrite toggle), and overlay or split-pane UI (unnecessary interaction and complexity for the first version). When Backlog gains decision updates, move this rationale into decision-1.

Initial repository scope: after the spec reviewer surfaced the pre-existing `.pi/`, `.pandino/`, and `AGENTS.md` workflow files as broader than the package-only slice, zambo explicitly chose on 2026-08-13 to version them in the repository so the project workflow remains reproducible.
<!-- SECTION:NOTES:END -->
