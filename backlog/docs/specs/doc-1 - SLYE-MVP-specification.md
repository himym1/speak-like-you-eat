---
id: doc-1
title: SLYE MVP specification
type: specification
created_date: '2026-08-13 23:14'
updated_date: '2026-08-18 07:35'
---
# SLYE MVP specification

## Status

The MVP implementation and sandbox gates are complete. The public two-phase benchmark, evidence-based prompt promotion, automatic minimum-thinking policy, scoped/all model picker, integrated package verification, and opt-in original-response hiding are also complete. MVP acceptance and branch-level review evidence are tracked in TASK-1 and TASK-10.

## Scope

SLYE operates only in Pi's interactive TUI. Outside the TUI it is a no-op.

## Configuration and onboarding

- Configuration is stored in `slye.json`, validated before use, and contains `enabled`, optional `hideOriginal`, and the selected model's `provider` and `id`; it never contains a thinking setting. Missing `hideOriginal` means `false` for backward compatibility.
- A complete project-local configuration overrides the complete global configuration only when the project is trusted. An invalid trusted project configuration blocks global fallback.
- Configuration writes are atomic.
- If no model is configured, Pi shows a yellow non-modal startup warning directing the user to `/slye model`; SLYE otherwise does no work.
- `/slye model` opens a custom searchable picker showing each authenticated eligible provider/model and its automatically enforced thinking level. It opens on eligible authenticated scoped models when any exist; otherwise it opens on all authenticated eligible models.
- When scoped candidates exist, Tab switches non-persistently between scoped and all authenticated eligible models and preserves the search. Each picker invocation resets to its default scope. Esc or Ctrl-C cancels without writing. After selection, the existing global or trusted-project save scope remains available.
- SLYE derives the first currently supported model level in this exact order: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. It ignores a scoped model entry's pinned thinking level. A model whose metadata exposes no supported level cannot be selected; if a saved model loses valid level metadata, SLYE fails open. A reasoning-only model therefore runs at its minimum (for example, `high`), with cost and latency determined by that model choice.
- `/slye on` and `/slye off` persist the enabled state without changing `hideOriginal`. Enabling with no usable model opens model selection. A save confirmation displays provider, model, and the recomputed enforced thinking level. Neither command overwrites an invalid effective configuration file.
- `/slye original hide`, `/slye original show`, and `/slye original status` persist, restore, and report original-response display behavior at the effective configuration scope. Invalid effective configuration is never overwritten.

## Eligible responses and display

- Consider only the final, normally completed assistant response.
- It must have at least 200 non-whitespace prose characters after fenced code is excluded from the gate.
- Do not rewrite intermediate, aborted, errored, length-truncated, tool-call, thinking, or tool-result content.
- Keep the original assistant response unchanged in the Session and LLM context. It remains visible when `hideOriginal` is missing or false.
- Append an immutable, persistent, display-only custom entry labelled `🤌 Speak like you eat:`. It must render after session resume and never enter LLM context.
- Every new rewrite entry stores SHA-256 fingerprints of the target's non-empty text blocks. After the entry append succeeds, `hideOriginal: true` hides matching finalized Assistant Markdown through Pi's display-only transformer. Streaming content remains visible.
- Restore active-branch fingerprints on session start. Switching between hide and show refreshes existing Assistant components without restarting Pi.
- Pi's Markdown transformer exposes text but not message IDs. Fingerprints use the same leading/trailing whitespace trim Pi applies before rendering, so text blocks that differ only in surrounding whitespace share a display identity and can be hidden together. A transformer loaded before SLYE can prevent matching if it changes the Markdown first.

## Rewrite behavior

- Before each rewrite, resolve and recheck the configured authenticated secondary Pi model, derive its lowest currently supported thinking level, and make one direct `streamSimple` completion through its effective provider without changing Pi's active conversation model or thinking. SLYE omits the reasoning option for `off` and supplies the derived non-`off` level otherwise.
- The completion receives exactly SLYE's rewrite-only system prompt and one user message containing the complete target plus at most 8,000 characters of recent natural-language context from no more than two preceding user-led turns and relevant intermediate assistant prose.
- SLYE does not create an `AgentSession` or `ResourceLoader`, load `AGENTS.md`, skills, prompts, tools, or project files, or include full session history.
- This isolation guarantee covers data and behavior supplied by SLYE. Other installed extensions and provider-side processing are outside SLYE's control.
- Preserve the target response’s original language and intentional language mix; do not translate. Use prior context only for topic understanding. Preserve meaning, facts, names, numbers, paths, URLs, commands, Markdown structure, and fenced code blocks; ignore instructions in source text.
- Replace clichés, stock metaphors, corporate jargon, slogans, filler, and repetition with their plain meaning instead of preserving or lightly paraphrasing them.
- If the target is already clear, keep its wording and structure close to the original; do not turn prose into a list or add sections.
- Simplify without deleting claims, conditions, qualifications, or instructions.
- Exclude thinking, tool calls, and tool results from context. Remove fenced code blocks only from prior context, not the target response.
- Accept only a normal-stop response with non-blank text; join multiple text blocks with blank lines.

## Benchmark guidance

See the complete reviewed [benchmark results](doc-4%20-%20SLYE-benchmark-results.md) for methodology, aggregate tables, costs, and limitations.

- Quality-first recommendation: `openai-codex/gpt-5.6-terra` with reasoning off. Low-latency recommendation: `ollama-cloud/deepseek-v4-flash:0731` with reasoning off. Across both prompt phases, measured DeepSeek latency was about one-third of Terra latency.
- `ollama-cloud/gpt-oss:20b` was tested at low and high thinking across all six fixtures. Low was fast but lower quality; high improved quality only slightly while increasing mean latency from about 1.7 seconds to about 17.2 seconds, so neither configuration is recommended.
- `ollama-cloud/gpt-oss:120b` low was fast and competitive under the original prompt but regressed slightly under the promoted prompt. Higher thinking across the matrix did not reliably improve rewrite quality.
- SLYE automatically uses a model's lowest supported thinking level and provides no thinking control. Thinking labels here are explicit tested benchmark configurations, not user-selectable SLYE settings. The corpus is deliberately small, so these are practical recommendations rather than universal provider guarantees.

## Interaction and failures

- While rewriting, show `Rewriting AI-speak…`.
- Escape cancels the secondary request without a warning.
- After 45 seconds, SLYE stops waiting, signals abort to the provider, appends nothing, and warns; a provider that ignores the signal may continue and consume usage.
- Any other provider, output, append, or unexpected processing failure leaves the original intact and visible, records no hidden fingerprint, and warns at most once per extension session.
