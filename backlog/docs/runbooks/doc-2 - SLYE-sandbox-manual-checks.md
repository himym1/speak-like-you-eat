---
id: doc-2
title: SLYE sandbox manual checks
type: guide
created_date: '2026-08-13 23:14'
updated_date: '2026-08-18 08:26'
---
# SLYE sandbox manual checks

## Purpose

This runbook validates both upstream-compatible package behavior and the Git-only `himym1` fork. npm publication steps apply only to upstream `wtfzambo/speak-like-you-eat`; never publish or tag the fork.

Use the durable sibling sandbox at `../speak_like_you_eat_sandbox` from this repository to manually verify each completed SLYE slice before starting the next one. From inside the sandbox, the package source is `../speak_like_you_eat`; Pi may persist that source relative to `.pi/settings.json` as `../../speak_like_you_eat`. Expected product behavior belongs in the [SLYE MVP specification](../specs/doc-1%20-%20SLYE-MVP-specification.md).

## One-time setup

From this repository, enter the sandbox and configure the local package with Pi's project-local package mechanism. Do not add secrets or change global Pi settings.

```sh
cd ../speak_like_you_eat_sandbox
pi install -l ../speak_like_you_eat
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
(
  set -e
  agent_dir="$(mktemp -d)"
  trap 'rm -rf "$agent_dir"' EXIT
  cd ../speak_like_you_eat_sandbox
  PI_CODING_AGENT_DIR="$agent_dir" pi --approve
)
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

### TASK-1.1 — model picker and automatic thinking (no model call)

Run this check in the normal authenticated sandbox, not the isolated agent-directory run. Do not submit a prompt or make a model request at any point in this section.

```sh
cd ../speak_like_you_eat_sandbox
before="$(mktemp)"
had_project_config=0
if test -f .pi/slye.json; then
  cp .pi/slye.json "$before"
  had_project_config=1
  cat "$before"
else
  printf '%s\n' '.pi/slye.json is absent'
fi
pi --approve
if test "$had_project_config" -eq 1; then
  cmp "$before" .pi/slye.json
else
  test ! -e .pi/slye.json
fi
comparison_status=$?
rm "$before"
test "$comparison_status" -eq 0
```

1. Record the command output above before changing anything. Run `/slye model`. Confirm each candidate row shows provider, model, and `thinking: <level>`, then search by provider, model ID, or model name.
2. When the normal session has eligible authenticated scoped candidates, confirm the picker starts at Scoped models. Press Tab to show All authenticated models, then press Tab again to return to Scoped models; confirm the search remains. If there are no scoped candidates, confirm it starts at All authenticated models and Tab does not offer a scope switch.
3. Press Esc or Ctrl-C to cancel, then exit Pi. The remaining shell commands compare `.pi/slye.json` with its pre-launch state, remove the temporary copy, and return a failure status if cancellation wrote anything.
4. Reopen Pi, run `/slye model`, select a candidate, choose `This project only`, then exit. Inspect `.pi/slye.json` and confirm it contains `enabled`, optional `hideOriginal`, and model `provider`/`id`, with no `thinking` field.
5. Reopen Pi, run `/slye off`, then `/slye on`. Confirm the enable notification repeats the selected provider/model and its recomputed `thinking: <level>`. Exit without submitting a prompt or making a model request.

A terminal check cannot observe SLYE's provider payload. Automated evidence is `test/display.test.ts`'s `calls the configured authenticated model once with an isolated exact rewrite payload` and `test/model-rewrite.test.ts`'s `builds one isolated user message with labelled context, the complete target, and the promoted prompt`; run `npm test` to exercise them.

### Slice 4 — real rewrite, cancellation, and resume

Use the existing sandbox project `.pi/slye.json` created during the slice-2 check; do not edit or delete it. Run:

```sh
cd ../speak_like_you_eat_sandbox
pi --approve
```

1. Submit one prompt expected to produce a normally completed final answer with more than 200 prose characters. This makes one primary request and one secondary rewrite request.
2. Verify the unchanged original appears first, then the exact working text `Rewriting AI-speak…`, then one plain-language `🤌 Speak like you eat:` card. Verify the card preserves the original target response's language, not the latest user's language, and preserves technical literals, Markdown, and fenced code.
3. Submit another eligible answer and press Escape while its secondary rewrite is running. A started secondary request may consume provider usage. Verify there is no card and no warning for that answer.
4. Exit, then resume or reopen the first session. Verify the saved card still renders and that resume alone appends no duplicate card.

### TASK-10 — original-response display

1. Run `/slye original status`; an existing configuration without `hideOriginal` must report that originals are shown.
2. Run `/slye original hide`, then submit an eligible prompt. The original may stream while the model responds, but after the rewrite succeeds only the `🤌 Speak like you eat:` card remains visible.
3. Run `/slye original show`. The original must reappear immediately without restarting Pi, and the rewrite card must remain. Run `/slye original hide` again and confirm the original disappears without losing editor focus.
4. While hide mode is active, press Escape during a rewrite and confirm the original remains visible with no card or warning. Run `node --test test/display.test.ts test/model-rewrite.test.ts` for deterministic provider/append failure and exact 45-second timeout evidence; those tests require the original to remain visible, append no incomplete card, and warn once for non-cancellation failures. Do not alter credentials to manufacture a manual failure.
5. Exit and resume the Session. Confirm successfully rewritten originals are hidden again from persisted fingerprints. If a Session created with upstream 1.0.1 before TASK-10 is available, resume it and confirm both its original and old card remain visible because the entry has no fingerprint; otherwise record the legacy manual case as not applicable and rely on `registers a safe persistent entry renderer` for automated compatibility evidence.

### Slice 5 — final package verification

Run this package procedure without starting Pi interactively or submitting a prompt/model request.

```sh
npm ci
npm run check
npm pack --dry-run --json
```

The dry run must contain exactly 14 files: `LICENSE`, `README.md`, `package.json`, `imgs/front.png`, the packaged specification and benchmark-results documents (`doc-1` and `doc-4`), and the eight shipped `src/` TypeScript files, including `original-display.ts` and `original-display-runtime.ts`. It must exclude `test/`, `backlog/tasks/`, `backlog/decisions/`, the sandbox runbook (`doc-2`), `AGENTS.md`, `.pi/`, `.pandino/`, and sandbox data.

After an upstream publication, check the public package from a fresh temporary project without submitting a prompt or making a model request:

```sh
(
  set -e
  project_dir="$(mktemp -d)"
  trap 'rm -rf "$project_dir"' EXIT
  (cd "$project_dir" && pi install -l npm:speak-like-you-eat)
  (cd "$project_dir" && pi list --approve)
)
```

For this Git-only fork, push the commit under test, then run the independent smoke below from this repository. It pins the current commit (or `SLYE_FORK_REF`), isolates both project and Pi agent directories, and asserts that `pi list --approve` reports the exact Git source:

```sh
(
  set -e
  agent_dir="$(mktemp -d)"
  project_dir="$(mktemp -d)"
  trap 'rm -rf "$agent_dir" "$project_dir"' EXIT
  fork_ref="${SLYE_FORK_REF:-$(git rev-parse HEAD)}"
  source="git:github.com/himym1/speak-like-you-eat@$fork_ref"
  (cd "$project_dir" && PI_CODING_AGENT_DIR="$agent_dir" pi install -l "$source" --approve)
  listing="$(cd "$project_dir" && PI_CODING_AGENT_DIR="$agent_dir" pi list --approve)"
  printf '%s\n' "$listing"
  printf '%s\n' "$listing" | grep -F "$source"
)
```

For an isolated tarball smoke before upstream publication, create temporary package, agent, and project directories. Install the tarball beneath the temporary Pi agent npm root, write the exact package source to temporary agent settings, list it from the empty temporary project, then remove all temporary directories on success or failure:

```sh
(
  set -e
  package_dir=""
  agent_dir=""
  project_dir=""

  cleanup() {
    rm -rf "$package_dir" "$agent_dir" "$project_dir"
  }

  trap cleanup EXIT
  package_dir="$(mktemp -d)"
  agent_dir="$(mktemp -d)"
  project_dir="$(mktemp -d)"
  mkdir -p "$agent_dir/npm"
  printf '{\n  "name": "temporary-pi-agent-npm"\n}\n' > "$agent_dir/npm/package.json"
  tarball="$(npm pack --silent --pack-destination "$package_dir")"
  npm install --prefix "$agent_dir/npm" --legacy-peer-deps --ignore-scripts --no-audit --no-fund "$package_dir/$tarball"
  printf '{\n  "packages": ["npm:speak-like-you-eat@1.0.1"]\n}\n' > "$agent_dir/settings.json"
  (cd "$project_dir" && PI_CODING_AGENT_DIR="$agent_dir" pi list --approve)
)
```

The list must find `npm:speak-like-you-eat@1.0.1` and no temporary files may remain.

### Later slices

After each later slice, start Pi from the sandbox with `pi --approve --offline` when the check does not require a configured model, or normally when it does. Exercise only the behavior added in that slice, compare the result with the specification, and stop before beginning the next slice if the manual check fails.

Keep the sandbox package source pointed at this local repository. Use `pi install -l` for the project-local package, and do not place credentials in the sandbox.
