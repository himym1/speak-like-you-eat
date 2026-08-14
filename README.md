# Speak like you eat

SLYE is a Pi package for plain-language companion rewrites. Slice 3 adds final-response selection, bounded prior-context preparation, and a temporary display-only development stub. Set `SLYE_STUB=1` to append a `🤌 Speak like you eat:` card after an eligible response; the card repeats the complete target under a development marker. Real rewriting and secondary-model calls are **not implemented yet**.

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

For the slice-3 display check, use the existing sandbox project configuration and run:

```sh
cd ../speak_like_you_eat_sandbox
SLYE_STUB=1 pi --approve
```

This submits one primary-model request and no secondary-model request. For the slice-specific manual checks, use the [sandbox runbook](backlog/docs/runbooks/doc-2%20-%20SLYE-sandbox-manual-checks.md).
