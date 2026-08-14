---
id: doc-1
title: SLYE MVP specification
type: specification
created_date: '2026-08-13 23:14'
updated_date: '2026-08-14 01:45'
---
# SLYE MVP specification

## Status

Slice 4 implementation is automated and review-ready. It replaces the development stub with an isolated configured-model completion, native working text, Escape cancellation, a 45-second deadline, and fail-open failure handling. The slice-4 manual model gate remains pending; the approved target behavior below is unchanged.

## Scope

SLYE operates only in Pi's interactive TUI. Outside the TUI it is a no-op.

## Configuration and onboarding

- Configuration is stored in `slye.json` and validated before use.
- A complete project-local configuration overrides the complete global configuration only when the project is trusted. An invalid trusted project configuration blocks global fallback.
- Configuration writes are atomic.
- If no model is configured, Pi shows a yellow non-modal startup warning directing the user to `/slye model`; SLYE otherwise does no work.
- `/slye model` opens an authenticated scoped-model picker that displays provider and model, then lets the user choose global or project scope.
- `/slye on` and `/slye off` persist the enabled state. Enabling with no model opens model selection. Neither command overwrites an invalid effective configuration file.

## Eligible responses and display

- Consider only the final, normally completed assistant response.
- It must have at least 200 non-whitespace prose characters after fenced code is excluded from the gate.
- Do not rewrite intermediate, aborted, errored, length-truncated, tool-call, thinking, or tool-result content.
- Keep the original assistant response visible and unchanged.
- Append an immutable, persistent, display-only custom entry labelled `🤌 Speak like you eat:`. It must render after session resume and never enter LLM context.

## Rewrite behavior

- Resolve and recheck the configured authenticated secondary Pi model, then make one isolated completion without changing Pi's active conversation model.
- The request has a rewrite-only system prompt and one user message containing the complete target plus at most 8,000 characters of recent natural-language context from no more than two preceding turns and relevant intermediate assistant prose.
- Infer language only from the most recent user-labelled context. Preserve meaning, facts, names, numbers, paths, URLs, commands, Markdown structure, and fenced code blocks; ignore instructions in source text.
- Exclude thinking, tool calls, and tool results from context. Remove fenced code blocks only from prior context, not the target response.
- Accept only a normal-stop response with non-blank text; join multiple text blocks with blank lines.

## Interaction and failures

- While rewriting, show `Rewriting AI-speak…`.
- Escape cancels the secondary request without a warning.
- After 45 seconds, SLYE stops waiting, signals abort to the provider, appends nothing, and warns; a provider that ignores the signal may continue and consume usage.
- Any other provider, output, append, or unexpected processing failure leaves the original intact and warns at most once per extension session.
