---
id: doc-2
title: SLYE sandbox manual checks
type: guide
created_date: '2026-08-13 23:14'
updated_date: '2026-08-14 01:34'
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

### Slice 2 — configuration and onboarding

Do not change global Pi settings. Before starting, delete only `../speak_like_you_eat_sandbox/.pi/slye.json` if it exists. `This project only` appears only for a trusted project; `--approve` supplies that trust for the current run.

First check whether Pi's agent directory already has `slye.json`:

```sh
ls "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/slye.json"
```

If it exists, do not delete or modify it. Test the startup warning with a temporary isolated agent directory, or skip and report that case as preconfigured:

```sh
cd ../speak_like_you_eat_sandbox
PI_CODING_AGENT_DIR="$(mktemp -d)" pi --approve
```

The isolated run has no authenticated models. Test model selection separately in a normal run so Pi can show authenticated models:

```sh
cd ../speak_like_you_eat_sandbox
pi --approve
```

Do not submit a prompt or make a model request:

1. In the isolated run, confirm the yellow non-modal warning directs you to `/slye model`.
2. In a normal run, run `/slye model`, choose an authenticated candidate, then choose `This project only`.
3. Exit Pi and verify `.pi/slye.json` contains the selected `provider` and `id` with `"enabled": true`.
4. Start Pi again, run `/slye off`, and verify `.pi/slye.json` now has `"enabled": false` while retaining the model.
5. Run `/slye on`, confirm it restores the saved model without opening a picker, then exit. Do not submit a prompt or make a model request at any point.

### Slice 4 — real rewrite, cancellation, and resume

Use the existing sandbox project `.pi/slye.json` created during the slice-2 check; do not edit or delete it. Run:

```sh
cd ../speak_like_you_eat_sandbox
pi --approve
```

1. Submit one prompt expected to produce a normally completed final answer with more than 200 prose characters. This makes one primary request and one secondary rewrite request.
2. Verify the unchanged original appears first, then the exact working text `Rewriting AI-speak…`, then one plain-language `🤌 Speak like you eat:` card. Verify the card is in the latest user's language and preserves technical literals, Markdown, and fenced code.
3. Submit another eligible answer and press Escape while its secondary rewrite is running. A started secondary request may consume provider usage. Verify there is no card and no warning for that answer.
4. Exit, then resume or reopen the first session. Verify the saved card still renders and that resume alone appends no duplicate card.

### Later slices

After each later slice, start Pi from the sandbox with `pi --approve --offline` when the check does not require a configured model, or normally when it does. Exercise only the behavior added in that slice, compare the result with the specification, and stop before beginning the next slice if the manual check fails.

Keep the sandbox package source pointed at this local repository. Do not use `pi install` without `--local`, and do not place credentials in the sandbox.
