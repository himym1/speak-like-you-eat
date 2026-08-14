# Speak like you eat

SLYE is a Pi package for plain-language companion rewrites. Slice 2 implements configuration and onboarding only: it validates and atomically saves `slye.json`, warns when configuration is needed, and provides `/slye model`, `/slye on`, and `/slye off`. Rewriting, transcript observation, display entries, and model requests are **not implemented yet**.

The authoritative MVP target is the [SLYE MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md).

## Configuration

SLYE runs only in Pi's interactive TUI. Use `/slye model` to choose an authenticated Pi model and save it for all projects or, in a trusted project, for that project only. `/slye on` restores a usable saved model or opens the same picker; `/slye off` saves an explicitly disabled configuration.

Global configuration is `slye.json` in Pi's agent directory. Trusted projects may instead use `.pi/slye.json`; a project file completely overrides the global file. An invalid trusted project file blocks global fallback, and `/slye on` and `/slye off` never overwrite an invalid effective file. See the specification for the full behavior.

## Development

Requires Node 24+ and Pi.

```sh
npm install
npm run typecheck
npm test
npm run check
```

## Sandbox

The durable sibling sandbox is `../speak_like_you_eat_sandbox`. From this repository, enter the sandbox and configure the project-local package without sending a model request:

```sh
cd ../speak_like_you_eat_sandbox
pi install --local ../speak_like_you_eat
pi list --approve
```

For the slice-specific manual checks, use the [sandbox runbook](backlog/docs/runbooks/doc-2%20-%20SLYE-sandbox-manual-checks.md).
