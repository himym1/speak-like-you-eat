# Speak like you eat

A Pi package foundation for SLYE. Slice 1 only declares and loads an intentionally no-op extension; rewriting and configuration are not implemented yet.

The authoritative MVP target is the [SLYE MVP specification](backlog/docs/specs/doc-1%20-%20SLYE-MVP-specification.md).

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

For an interactive load check, start and exit Pi without submitting a prompt:

```sh
pi --approve --offline
```
