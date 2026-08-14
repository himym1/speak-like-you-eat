# Speak like you eat

SLYE is a Pi package for plain-language companion rewrites. For an eligible completed response in Pi's interactive TUI, it keeps the original visible and automatically appends a `🤌 Speak like you eat:` display-only card created by the configured authenticated Pi model. The secondary request receives the complete target and bounded prior context, is isolated from the active conversation, and never changes Pi's active model.

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

For the slice-4 rewrite check, use the existing sandbox project configuration and run:

```sh
cd ../speak_like_you_eat_sandbox
pi --approve
```

An eligible answer submits one primary-model request and one isolated secondary rewrite request. For the slice-specific manual checks, including cancellation and resume, use the [sandbox runbook](backlog/docs/runbooks/doc-2%20-%20SLYE-sandbox-manual-checks.md).
