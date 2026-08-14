# Speak like you eat

SLYE is a Pi package that adds a plain-language companion rewrite after an eligible completed response. It runs only in Pi's interactive TUI: the original response stays visible and unchanged, and the `🤌 Speak like you eat:` card is display-only and never enters LLM context.

The authoritative behavior is in the [SLYE MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md). For hands-on checks, use the [sandbox runbook](backlog/docs/runbooks/doc-2%20-%20SLYE-sandbox-manual-checks.md).

## Install from a local clone

SLYE is not published to npm, and this repository does not assume a Git remote. After obtaining a local clone, install its path with Pi:

```sh
# Available to all projects
pi install /absolute/path/to/speak_like_you_eat

# Available only in the current trusted project
pi install --local /absolute/path/to/speak_like_you_eat
```

Run the project-local command only in a trusted project; after reviewing and trusting the package, you may add `--approve` when Pi requires approval. Pi extensions execute with your user permissions.

## Configure and use

Run `/slye model` once to choose an authenticated Pi model and save it globally or, for a trusted project, locally. `/slye on` restores a usable saved model or opens that picker; `/slye off` saves an explicitly disabled configuration.

The global configuration is `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/slye.json`. In a trusted project, `.pi/slye.json` completely overrides it; an invalid trusted project file blocks global fallback.

SLYE rewrites only normally completed final assistant responses with at least 200 non-whitespace prose characters after fenced code is excluded. It skips intermediate, aborted, errored, truncated, tool-call, thinking, and tool-result content.

Each eligible response makes one isolated secondary request. Model quality can vary, and already-clear prose may be returned unchanged.

While the secondary request runs, Pi shows `Rewriting AI-speak…`. Escape cancels it silently. SLYE stops waiting after a local 45-second deadline, leaves the original response alone, and shows at most one fail-open warning per session for timeout or other failures. A non-cooperative provider may continue and consume usage after local cancellation or timeout.

## Development and sandbox

Requires Node 24+ and Pi. In a Git clone, `npm ci` installs the development dependencies and Lefthook's pre-commit hook.

```sh
npm ci
npm run format       # write Biome formatting
npm run lint         # run Biome linting
npm run biome:check  # run Biome checks without writing
npm run typecheck    # run TypeScript checks
npm test             # run Node tests
npm run check        # run Biome checks, TypeScript checks, and tests
npm pack --dry-run --json  # inspect the package
```

Pre-commit runs Biome on staged supported files, re-stages its fixes, then runs the full typecheck and Node test suite. The hook stops at the first failure. If install scripts were disabled, recover it with `npx lefthook install`. In an emergency, bypass the hook with `git commit --no-verify`.

Hooks complement, rather than replace, manual checks and any checks run elsewhere; use `npm run check` before sharing changes.

The durable sibling sandbox is `../speak_like_you_eat_sandbox`. Its package listing and manual TUI checks are documented in the sandbox runbook; the no-request listing command is:

```sh
cd ../speak_like_you_eat_sandbox
pi list --approve
```
