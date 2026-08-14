---
id: TASK-4
title: Automate TypeScript quality checks before commits
status: Done
assignee:
  - '@zambo'
created_date: '2026-08-14 14:52'
updated_date: '2026-08-14 15:35'
labels: []
dependencies: []
priority: medium
type: chore
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a fast, reproducible TypeScript developer-quality toolchain analogous to Ruff plus basedpyright: one formatter/linter, the existing TypeScript compiler for type checking, and an automatically installed pre-commit hook. Keep the published Pi package unchanged, avoid formatting governed Markdown or hard-wrapping prose, and make the same checks available as explicit npm scripts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A single configured tool deterministically formats and lints supported source and JSON files without formatting Markdown prose
- [x] #2 The TypeScript project declares no-emit checking in tsconfig and the typecheck command succeeds in editors and from npm
- [x] #3 A tracked pre-commit hook formats and safely fixes staged supported files, stages those fixes, then blocks commits when linting, type checking, or tests fail
- [x] #4 A fresh dependency install in a Git clone installs the hook without adding benchmark files or development tooling to the eight-file npm package
- [x] #5 README development instructions document installation, manual commands, hook behavior, and bypass/recovery procedures
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add pinned Biome 2.5.8 and Lefthook 2.1.10 development dependencies. Configure Biome as the single formatter/linter for tracked TypeScript and selected JSON only, with Git ignore integration, explicit exclusion of Markdown, package-lock, and benchmark/.work, two-space indentation, a readability-oriented line width, recommended lint rules, and import organization. 2. Add manual npm scripts for format, lint, Biome check, typecheck, tests, and the integrated check; rely on tsconfig noEmit rather than a CLI-only flag. 3. Add a tracked piped Lefthook pre-commit configuration that safely fixes only staged supported files, re-stages formatter fixes, then runs whole-project type checking and the fast Node test suite, stopping on failure. Use Lefthook's npm postinstall integration so a normal dependency install activates the hook, and document manual reinstall and --no-verify recovery. 4. Apply the one-time deterministic Biome baseline to supported files and fix real recommended-rule findings without unrelated refactors or Markdown formatting. 5. Update README development guidance, then verify a clean dependency install in an isolated Git clone installs and runs the hook, partial/staged behavior is safe, all explicit checks pass, the package remains exactly eight files, and no ignored benchmark results or governed Markdown change.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The user explicitly approved Biome plus tsc plus Lefthook, including the approximately 1.3-second Node test suite in pre-commit. Current selected package versions from npm are @biomejs/biome 2.5.8 and lefthook 2.1.10. The tsconfig noEmit editor fix is already committed as ae3afeb.

Final verification: Biome 2.5.8 checks exactly 24 configured TypeScript/JSON files and force-excludes Markdown, package-lock, canonical generated manifests, and benchmark/.work; `npm run check` passed Biome, `tsc`, and 55 Node tests. In an isolated fresh Git copy, `npm ci` installed Lefthook 2.1.10; docs-only commits continued through typecheck/tests; a staged TS file was formatted and re-staged; a partially staged unstaged hunk remained unstaged; and TS2322 blocked before tests. Lefthook validation and installation checks passed. Both benchmark manifests remained canonical with their approved fingerprints. `npm pack --dry-run --json` contained exactly the approved eight files. Taste/spec reviewers confirmed the docs-only fix and reported no remaining must-fix findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added pinned Biome formatting/linting, tsconfig-backed TypeScript checking, and an automatically installed Lefthook pre-commit pipeline that fixes supported staged files before typecheck and tests. Applied the deterministic baseline, documented commands and recovery, and verified clean-install hook behavior, partial staging safety, all 55 tests, canonical benchmark manifests, and the unchanged eight-file npm package.
<!-- SECTION:FINAL_SUMMARY:END -->
