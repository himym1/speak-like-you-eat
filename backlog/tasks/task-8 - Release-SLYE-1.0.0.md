---
id: TASK-8
title: Release SLYE 1.0.0
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-08-16 00:31'
updated_date: '2026-08-16 01:05'
labels: []
dependencies: []
references:
  - 'https://github.com/wtfzambo/speak-like-you-eat/releases'
  - backlog/docs/runbooks/doc-5 - SLYE-release-procedure.md
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Promote the completed and publicly verified SLYE response-rewrite contract to stable 1.0.0 through the new Release Please and npm trusted-publishing pipeline. This release stabilizes current behavior only; SLYE Markdown remains separate future work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The current response-rewrite behavior, isolation, model controls, fail-open guarantees, and 12-file package contract are explicitly treated as the stable 1.0 scope without adding Markdown file rewriting.
- [ ] #2 Release Please creates a reviewed v1.0.0 release PR from the current 0.1.1 baseline, updates package and lock versions plus manifest/changelog consistently, and hosted no-call checks pass on the exact release branch.
- [ ] #3 Merging the release PR creates v1.0.0 and a non-prerelease GitHub Release without moving or rewriting v0.1.0 or v0.1.1.
- [ ] #4 The exact v1.0.0 tag publishes automatically to npm latest through the registered publish.yml OIDC trusted publisher, with provenance and no npm token.
- [ ] #5 Registry metadata, exact 12-file artifact, README, provenance, and a clean Pi installation of npm:speak-like-you-eat@1.0.0 are verified without model or benchmark execution calls.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Commit the paused TASK-7 design record and this release task with the exact conventional commit footer `Release-As: 1.0.0`; do not manually edit package versions or publish anything.
2. Push main and verify Release Please creates one release PR targeting 1.0.0 while leaving existing v0.1.0/v0.1.1 tags and releases untouched.
3. Inspect the generated PR's package.json, package-lock.json, release manifest, and CHANGELOG changes. Run the hosted no-call workflow on the exact release branch and review the complete release diff before merging.
4. Merge the reviewed release PR. Verify Release Please creates the exact stable v1.0.0 tag and non-prerelease GitHub Release, then verify repository_dispatch starts publish.yml at that tag.
5. Observe the OIDC publish workflow end to end. If it fails, preserve the immutable tag/release and use only the documented exact-tag recovery after fixing the cause; never publish manually with a token.
6. Verify npm latest is 1.0.0, registry metadata and source links match, provenance points to this repository/workflow, the registry tarball contains the exact 12 files and current README, and a clean temporary Pi project installs npm:speak-like-you-eat@1.0.0 without a model request.
7. Finalize TASK-8 with objective URLs/hashes and update the session pickup to point at the paused TASK-7 design questions. Commit and push only chore records after v1.0.0; confirm they create no further release.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The user approved promoting the current response-rewrite contract directly from 0.1.1 to stable 1.0.0. Use the one-time Release-As commit footer; SLYE Markdown remains paused in TASK-7 and is not part of this release.
<!-- SECTION:NOTES:END -->
