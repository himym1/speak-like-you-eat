---
id: TASK-6
title: Automate GitHub and npm releases
status: To Do
assignee:
  - '@zambo'
created_date: '2026-08-15 17:25'
labels: []
dependencies: []
references:
  - 'https://github.com/wtfzambo/spotme/tree/main/.github/workflows'
  - 'https://github.com/googleapis/release-please-action'
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a reviewed release pipeline analogous to SpotMe: Release Please manages versions, changelog PRs, tags, and GitHub Releases; GitHub Actions publishes the released package to npm through trusted publishing without a long-lived npm token. Preserve the existing manual v0.1.0/v0.1.1 history and exact package checks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Release Please starts from version 0.1.1 and creates conventional version/changelog release PRs without rewriting existing tags or releases.
- [ ] #2 Pull requests run npm ci, Biome, TypeScript, all Node tests, benchmark dry-run fingerprint checks, and exact npm package inspection without model calls.
- [ ] #3 A created GitHub Release triggers npm publication through OIDC trusted publishing with no repository npm token, and manual dispatch provides a documented recovery path.
- [ ] #4 Workflow permissions, concurrency, release metadata, and npm tags are explicit; documentation explains Conventional Commits and the one-time npm trusted-publisher setup.
- [ ] #5 Workflow configuration is validated locally where possible and reviewed without publishing an unplanned package version.
<!-- AC:END -->
