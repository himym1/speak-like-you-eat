---
id: TASK-4
title: Automate TypeScript quality checks before commits
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-14 14:52'
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
- [ ] #1 A single configured tool deterministically formats and lints supported source and JSON files without formatting Markdown prose
- [ ] #2 The TypeScript project declares no-emit checking in tsconfig and the typecheck command succeeds in editors and from npm
- [ ] #3 A tracked pre-commit hook formats and safely fixes staged supported files, stages those fixes, then blocks commits when linting, type checking, or tests fail
- [ ] #4 A fresh dependency install in a Git clone installs the hook without adding benchmark files or development tooling to the eight-file npm package
- [ ] #5 README development instructions document installation, manual commands, hook behavior, and bypass/recovery procedures
<!-- AC:END -->
