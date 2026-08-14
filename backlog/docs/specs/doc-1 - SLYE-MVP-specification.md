---
id: doc-1
title: SLYE MVP specification
type: specification
created_date: '2026-08-13 23:14'
updated_date: '2026-08-14 15:59'
---
# SLYE MVP specification

## Status

All implementation slices and the sandbox gates have passed. Package hardening, the public two-phase benchmark, and the evidence-based prompt promotion are complete. Final acceptance verification and branch-level documentation/final review remain before MVP closure.

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
- Replace clichés, stock metaphors, corporate jargon, slogans, filler, and repetition with their plain meaning instead of preserving or lightly paraphrasing them.
- If the target is already clear, keep its wording and structure close to the original; do not turn prose into a list or add sections.
- Simplify without deleting claims, conditions, qualifications, or instructions.
- Exclude thinking, tool calls, and tool results from context. Remove fenced code blocks only from prior context, not the target response.
- Accept only a normal-stop response with non-blank text; join multiple text blocks with blank lines.

## Benchmark guidance

- Quality-first recommendation: `openai-codex/gpt-5.6-terra` with reasoning off. Low-latency recommendation: `ollama-cloud/deepseek-v4-flash:0731` with reasoning off. Across both prompt phases, measured DeepSeek latency was about one-third of Terra latency.
- `ollama-cloud/gpt-oss:20b` was tested at low and high thinking across all six fixtures. Low was fast but lower quality; high improved quality only slightly while increasing mean latency from about 1.7 seconds to about 17.2 seconds, so neither configuration is recommended.
- `ollama-cloud/gpt-oss:120b` low was fast and competitive under the original prompt but regressed slightly under the promoted prompt. Higher thinking across the matrix did not reliably improve rewrite quality.
- SLYE configuration selects a model, not a thinking level. Thinking labels here describe benchmark evidence rather than a SLYE configuration control. The corpus is deliberately small, so these are practical recommendations rather than universal provider guarantees.

## Interaction and failures

- While rewriting, show `Rewriting AI-speak…`.
- Escape cancels the secondary request without a warning.
- After 45 seconds, SLYE stops waiting, signals abort to the provider, appends nothing, and warns; a provider that ignores the signal may continue and consume usage.
- Any other provider, output, append, or unexpected processing failure leaves the original intact and warns at most once per extension session.
