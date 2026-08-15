---
id: TASK-5
title: Publish SLYE publicly on GitHub and npm
status: Done
assignee:
  - '@zambo'
created_date: '2026-08-15 13:51'
updated_date: '2026-08-15 17:24'
labels: []
dependencies: []
references:
  - 'https://github.com/wtfzambo/spotme'
  - 'https://www.npmjs.com/package/spotme'
documentation:
  - doc-1
  - doc-2
  - doc-4
modified_files:
  - README.md
  - .markdownlint.yaml
  - LICENSE
  - imgs/front.png
  - package.json
  - package-lock.json
  - test/package-contract.test.ts
  - backlog/docs/runbooks/doc-2 - SLYE-sandbox-manual-checks.md
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prepare the completed SLYE package for its first public release, resolve the author's README review comments, publish the source repository under wtfzambo, publish speak-like-you-eat@0.1.0 to npm, and verify installation through Pi from the public artifact. Preserve the user's current README/image/markdownlint work and do not expose credentials, ignored benchmark evidence, or local machine state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README is concise and public-facing, contains the approved artwork, has no MARK comments or stale unpublished/local-clone instructions, and documents npm installation plus essential configuration and behavior.
- [x] #2 package.json contains accurate public-release metadata, an explicit license policy, public npm access, GitHub links, useful Pi gallery metadata, and an allowlist whose dry-run tarball contains every required README asset and no private/development artifacts.
- [x] #3 A public github.com/wtfzambo/speak-like-you-eat repository exists with main pushed, accurate description/topics, and no secrets or ignored benchmark evidence.
- [x] #4 The initial speak-like-you-eat@0.1.0 release remains public, and a 0.1.1 patch is published as latest with the user-approved small-benchmark prompt-sensitivity wording and registry metadata matching its committed source.
- [x] #5 A clean temporary Pi environment installs or runs the latest npm:speak-like-you-eat successfully, and automated checks, benchmark fingerprints, package inspection, documentation review, and final release review pass without additional benchmark/model calls.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create a temporary release/v0.1.0 branch while preserving the user's uncommitted README, .markdownlint.yaml, and imgs/front.png work. Publish the complete tracked project and full Git history; keep the approved image unchanged.
2. Rewrite README as a concise public landing page: bridge the Italian phrase directly to the product, keep the Claudish to English credit, replace local-clone instructions with pi install npm:speak-like-you-eat and project-local syntax, reduce configuration to a short numbered flow plus essential safety/cost behavior, move specification/benchmark links to a compact evidence section, replace the private sibling-sandbox paragraph with pi -e . local testing, and remove every MARK comment.
3. Add an MIT LICENSE for wtfzambo and release metadata to package.json: author, license, public publishConfig, repository/homepage/bugs URLs, stronger keywords, and Pi gallery image URL. Include imgs/front.png and the README-linked product specification/benchmark report in the npm artifact, stop shipping the internal sandbox runbook, update package-lock and the exact package-contract test, and version .markdownlint.yaml only as repository editor configuration. Keep version 0.1.0 and the verified Node >=24 requirement.
4. Update governed package/runbook documentation through Backlog CLI wherever the public install command or exact tarball contents changed. Run Biome, TypeScript, 73 tests, both no-call benchmark dry-runs, markdown/comment/link checks, exact npm pack inspection, a clean tarball Pi discovery smoke, and the pre-publication secret/privacy audit. Run taste/spec review before the release-prep commit, then the release documentation/final review on the release branch.
5. Fast-forward the reviewed release branch onto main. Create public github.com/wtfzambo/speak-like-you-eat with origin, description and topics; push main and verify repository visibility/content.
6. Publish speak-like-you-eat@0.1.0 with npm publish --access public. Verify npm registry metadata and install/run npm:speak-like-you-eat@0.1.0 in a clean temporary Pi environment without making a model request.
7. Finalize TASK-5 with objective evidence, commit and push the release record, tag the final source as v0.1.0, create the GitHub Release, and verify clean local/remote state. Do not add Release Please or trusted-publishing automation in this task.

8. Apply the user-approved narrow README correction: describe GPT-OSS 120B as cheapest of the three with good overall results but more sensitive to prompt wording in this small benchmark; normalize model names without expanding claims. Bump package/lock/contract to 0.1.1, review and push, publish the patch, verify latest installation, and create matching v0.1.0/v0.1.1 tags and GitHub releases.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the approved release-preparation slice: rewrote the public README, added MIT and npm/Pi metadata, constrained the npm artifact to 12 files, and updated doc-2 through Backlog CLI. Verified `npm run check` (73 passing tests), both no-call benchmark fingerprints (phase one `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759`; phase two `59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728`), exact 12-file npm pack output, and a temporary tarball Pi list smoke. `imgs/front.png` SHA-256 remained `9dbc2dce1da41f3066bb6f1dbe515111aec382e042209ef646076e05d12556d9`.

External release progress on 2026-08-15: created public `https://github.com/wtfzambo/speak-like-you-eat`, set `origin/main`, pushed the reviewed full history, set description/topics, and verified the raw Pi gallery image returns HTTP 200. The first npm publish attempt built the correct 12-file public tarball but stopped with EOTP before publication; no package was created by that failed attempt.

npm publication was then verified: `speak-like-you-eat@0.1.0` became the initial public release with an exact 12-file registry artifact and a clean temporary `pi install -l npm:speak-like-you-eat@0.1.0` / `pi list` check passed without a model request. The user committed an additional Recommended models README section before publishing; targeted review found that its GPT-OSS 120B bullet needed the small-benchmark prompt-sensitivity caveat. Because npm versions are immutable, the user approved a narrow 0.1.1 documentation patch.

Release completed on 2026-08-15. `npm:speak-like-you-eat@0.1.1` is latest and contains the user-approved small-benchmark prompt-sensitivity wording. Registry 0.1.1 shasum is `70042f5491f8dbe799c31155cb4da6e1050972a5`; its exact 12-file README/artifact matches commit `47f7e04` and installs successfully through Pi in a clean temporary project without a model request. GitHub releases `v0.1.0` and `v0.1.1` exist, with `v0.1.1` marked Latest. Release preparation passed 73 tests, Biome, TypeScript, both unchanged benchmark fingerprints, npm publish dry-run, tarball load/discovery, privacy audit, taste/spec review, docs review, and final release review with no remaining must-fix findings. No benchmark/model call ran during release work.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Published SLYE publicly with a concise reviewed README, MIT license, complete GitHub/npm/Pi metadata, approved artwork, and an exact 12-file package. Created the public GitHub repository and v0.1.0/v0.1.1 releases, published npm 0.1.0 followed by the small README clarification in latest 0.1.1, and verified the registry artifact installs cleanly through Pi. Runtime and benchmark manifests remained unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
