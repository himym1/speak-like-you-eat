---
id: TASK-6
title: Automate GitHub and npm releases
status: Done
assignee:
  - '@zambo'
created_date: '2026-08-15 17:25'
updated_date: '2026-08-15 21:29'
labels: []
dependencies: []
references:
  - 'https://github.com/wtfzambo/speak-like-you-eat/actions/runs/31909502993'
  - 'https://github.com/wtfzambo/speak-like-you-eat/actions/runs/31909521574'
documentation:
  - doc-5
modified_files:
  - test/package-contract.test.ts
  - release-please-config.json
  - .release-please-manifest.json
  - .github/workflows/pr.yml
  - .github/workflows/release.yml
  - .github/workflows/publish.yml
  - backlog/docs/runbooks/doc-5 - SLYE-release-procedure.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a reviewed release pipeline analogous to SpotMe: Release Please manages versions, changelog PRs, tags, and GitHub Releases; GitHub Actions publishes the released package to npm through trusted publishing without a long-lived npm token. Preserve the existing manual v0.1.0/v0.1.1 history and exact package checks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Release Please starts from version 0.1.1 and creates conventional version/changelog release PRs without rewriting existing tags or releases.
- [x] #2 Pull requests run npm ci, Biome, TypeScript, all Node tests, benchmark dry-run fingerprint checks, and exact npm package inspection without model calls.
- [x] #3 A created GitHub Release triggers npm publication through OIDC trusted publishing with no repository npm token, and manual dispatch provides a documented recovery path.
- [x] #4 Workflow permissions, concurrency, release metadata, and npm tags are explicit; documentation explains Conventional Commits and the one-time npm trusted-publisher setup.
- [x] #5 Workflow configuration is validated locally where possible and reviewed without publishing an unplanned package version.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Make the package-contract version assertion release-compatible: require stable SemVer and equality among package.json, the lockfile root version, and the lockfile root package version, while preserving the exact 12-file public allowlist.
2. Bootstrap stable Release Please from the existing v0.1.1 release with release-please-config.json and .release-please-manifest.json. Keep package.json and package-lock.json at 0.1.1, use v-prefixed component-free tags, and add no prerelease/next behavior.
3. Add .github/workflows/pr.yml for pull requests and manual dispatch. With least permissions and cancellable per-ref concurrency, run Node 24, npm ci, npm run check, both no-call benchmark dry-runs, fingerprint/manifest cleanliness checks, and exact package inspection.
4. Add .github/workflows/release.yml for main pushes and manual dispatch. Run googleapis/release-please-action@v5 with the explicit config/manifest and GITHUB_TOKEN. Configure the one-time GitHub Actions setting that allows GITHUB_TOKEN to create Release Please PRs while keeping default workflow permissions read-only. When and only when a stable release is created, send a repository_dispatch containing its exact vX.Y.Z tag. Never dispatch merely because a release PR exists.
5. Add .github/workflows/publish.yml for that repository_dispatch and a required manual recovery tag. Grant only contents:read and id-token:write, serialize publication, reject non-stable or ambiguous tags, require an existing non-draft, non-prerelease GitHub Release whose returned tag exactly matches, check out the exact tag, verify its commit is on main and its version matches package.json and both lockfile versions, install and verify npm 11.19.0, rerun all no-call release gates, stop if the version already exists without checkout artifacts, and publish only npm latest through OIDC. Do not reference NPM_TOKEN/NODE_AUTH_TOKEN or support next/prerelease.
6. Create a governed release runbook through Backlog CLI. Document Conventional Commits, stable-only release flow, the one-time read-only-default GitHub Actions PR-creation setting, the exact npm 11.19.0 trusted-publisher registration for owner wtfzambo/repository speak-like-you-eat/workflow publish.yml, setup ordering, normal verification, immutable npm versions, and exact-tag manual recovery.
7. Validate JSON/YAML/workflows locally where possible, run the complete no-call gate, prove the npm tarball remains exactly 12 files and the benchmark manifests/fingerprints remain unchanged, and confirm package/lock versions remain 0.1.1. Do not dispatch a workflow, create a release, move a tag, or publish a package before the reviewed automation is committed.
8. After review and commit/push, verify the release workflow creates no release from the chore-only history, run the hosted no-call checks, then configure npm trusted publishing once through npm's 2FA flow. Preserve the unrelated dirty TASK-2 pickup file throughout.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The user chose the simplest stable-only policy on 2026-08-15: no npm prereleases and no next tag. Keep SpotMe's repository_dispatch bridge, but pass and validate the exact release tag instead of publishing the current main branch implicitly.

Implemented stable Release Please, PR/release/publish workflows, package-version contract coverage, and the governed release runbook. Validated JSON/YAML, npm ci/check, both no-call dry-run fingerprints, manifest cleanliness, and the 12-file package artifact without publishing.

Correction pass: publish.yml now pins and verifies npm 11.19.0, fetches main directly into refs/remotes/origin/main, requires a matching existing non-draft, non-prerelease GitHub Release through gh with read-only contents access, and stores npm version-check files under RUNNER_TEMP. The runbook records the one-time GitHub Actions PR-creation setting while retaining read-only default workflow permissions and workflow-level least permissions.

Hosted GitHub run 31909381756 passed all checks but warned about Node 20 action runtimes. Corrected the workflows to actions/checkout@v6 and actions/setup-node@v6; publish.yml explicitly disables setup-node package-manager caching for the release build, and release.yml now uses googleapis/release-please-action@v5. YAML validation and npm run check pass.

External activation verified on 2026-08-15. Repository workflow defaults remain read-only and GitHub Actions may create release PRs. Release run https://github.com/wtfzambo/speak-like-you-eat/actions/runs/31909502993 passed with release-please-action v5 and correctly skipped repository dispatch because the post-v0.1.1 history is chore-only; no PR, tag, GitHub Release, or npm version was created. Hosted no-call check run https://github.com/wtfzambo/speak-like-you-eat/actions/runs/31909521574 passed npm ci, 73 tests, Biome, TypeScript, both benchmark dry-run fingerprints, manifest cleanliness, and exact package inspection using checkout/setup-node v6 without runtime warnings. npm trusted publishing now lists GitHub repository wtfzambo/speak-like-you-eat and workflow publish.yml with publish permission; no npm token exists. npm latest and Git tags remain unchanged at 0.1.1/v0.1.1.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added stable-only Release Please automation, hosted PR/no-call release gates, and exact-tag npm OIDC publishing with manual recovery. Bootstrapped from v0.1.1, enabled the required least-privilege GitHub settings, registered publish.yml as npm's trusted publisher, documented the procedure, and verified hosted workflows without creating or publishing a new version.
<!-- SECTION:FINAL_SUMMARY:END -->
