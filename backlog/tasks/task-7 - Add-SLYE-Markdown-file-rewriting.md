---
id: TASK-7
title: Add SLYE Markdown file rewriting
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-15 17:25'
updated_date: '2026-08-16 00:31'
labels: []
dependencies: []
references:
  - backlog/docs/specs/doc-1 - SLYE-MVP-specification.md
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let a user explicitly run SLYE against a Markdown file, producing a plain-language Markdown rewrite while preserving the source language, document structure, code, frontmatter, links, literals, and the existing response-rewrite isolation/fail-open principles. The source file must never be damaged or silently overwritten.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An explicit interactive SLYE command accepts a Markdown file path and rejects missing, non-Markdown, unsafe, oversized, or otherwise unsupported inputs with a clear non-destructive result.
- [ ] #2 The rewrite preserves frontmatter, headings, lists, tables, links, URLs, inline code, fenced code, commands, names, numbers, and source language while simplifying prose with the selected authenticated model and automatic minimum thinking.
- [ ] #3 File-mode completion receives only the dedicated SLYE prompt and explicitly selected file content; it does not add chat history, automatic project context, tools, or unrelated files.
- [ ] #4 The approved output/confirmation policy prevents accidental data loss, writes atomically, handles existing outputs deliberately, and fails open on cancellation, timeout, malformed output, or filesystem/provider errors.
- [ ] #5 Automated tests cover path validation, Markdown preservation, request isolation, cancellation/failures, and file writes; current specification, README, runbook, package contract, and manual sandbox procedure are updated.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-6 release automation is complete. Starting product design for the explicit Markdown rewrite feature; no implementation begins until the user approves the fully grilled plan.

Design paused by the user on 2026-08-15 for reconsideration in the following days. Open questions and current recommendations:

1. Interface: Pi command such as `/slye markdown README.md` versus standalone CLI. Recommendation: Pi command, reusing authentication, configuration, picker, cancellation, and TUI.
2. Initial scope: one `.md` file versus directories, globs, and MDX. Recommendation: one `.md` file per invocation.
3. Destination: overwrite, confirm overwrite, or sibling output. Recommendation: write `<name>.slye.md`, refuse if it already exists, and provide no force mode in the first version.
4. Markdown fidelity: prompt-only best effort versus programmatic protection/validation. Recommendation: protect and validate frontmatter, code, URLs, commands, and literals programmatically.
5. Language: preserve source language versus translation support. Recommendation: preserve source language only.
6. Model: reuse the configured SLYE model versus choose per file. Recommendation: reuse the current SLYE configuration and automatic minimum thinking.

No implementation plan is approved. Reopen the design tree from these root questions before changing code.
<!-- SECTION:NOTES:END -->
