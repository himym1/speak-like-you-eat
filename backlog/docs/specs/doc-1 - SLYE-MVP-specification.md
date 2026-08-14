---
id: doc-1
title: SLYE MVP specification
type: specification
created_date: '2026-08-13 23:14'
updated_date: '2026-08-14 00:13'
---
# SLYE MVP specification

## Status

This document defines the approved **target MVP**. Slice 2 implements typed configuration and onboarding: validated atomic `slye.json` persistence, the TUI startup warning, and `/slye model|on|off`. Rewriting and display are not implemented: there is no transcript observation, custom entry renderer, rewrite stub, model request, loading indicator, timeout, or cancellation yet.

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

- Use the selected secondary Pi model to rewrite in the user's language, inferred only from user messages.
- Preserve facts, names, numbers, paths, Markdown structure, commands, and fenced code blocks. The intent is a claudish-to-english plain-language rewrite without changing meaning.
- Send the complete target response plus at most 8,000 characters of recent natural-language context from no more than two preceding turns and relevant intermediate assistant prose.
- Exclude thinking, tool calls, and tool results from context. Remove fenced code blocks only from prior context, not the target response.

## Interaction and failures

- While the rewrite is running, show `Rewriting AI-speak…`.
- Escape cancels the rewrite without a warning.
- Cancel after 45 seconds.
- Any other provider or configuration failure leaves the original response intact and warns at most once per session.
