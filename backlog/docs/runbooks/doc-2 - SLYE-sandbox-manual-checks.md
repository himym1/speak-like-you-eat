---
id: doc-2
title: SLYE sandbox manual checks
type: guide
created_date: '2026-08-13 23:14'
updated_date: '2026-08-13 23:28'
---
# SLYE sandbox manual checks

## Purpose

Use the durable sibling sandbox at `../speak_like_you_eat_sandbox` from this repository to manually verify each completed SLYE slice before starting the next one. From inside the sandbox, the package source is `../speak_like_you_eat`; Pi may persist that source relative to `.pi/settings.json` as `../../speak_like_you_eat`. Expected product behavior belongs in the [SLYE MVP specification](../specs/doc-1%20-%20SLYE-MVP-specification.md).

## One-time setup

From this repository, enter the sandbox and configure the local package with Pi's project-local package mechanism. Do not add secrets or change global Pi settings.

```sh
cd ../speak_like_you_eat_sandbox
pi install --local ../speak_like_you_eat
```

This writes the sandbox's `.pi/settings.json`. Use `--approve` only for the current verification command when Pi needs to trust the sandbox.

## Slice checks

### Slice 1 — package foundation

From this repository, `npm test` verifies the manifest-to-module import. From inside the sandbox, run:

```sh
pi list --approve
```

This confirms the project-local package registration and path; it does not confirm extension factory execution. This command must not submit a prompt or request a model. For the manual Pi loader/startup check, run the following command, inspect startup for extension load errors, then exit without submitting a prompt:

```sh
pi --approve --offline
```

### Later slices

After each later slice, start Pi from the sandbox with `pi --approve --offline` when the check does not require a configured model, or normally when it does. Exercise only the behavior added in that slice, compare the result with the specification, and stop before beginning the next slice if the manual check fails.

Keep the sandbox package source pointed at this local repository. Do not use `pi install` without `--local`, and do not place credentials in the sandbox.
