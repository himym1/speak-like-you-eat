---
id: TASK-3
title: Benchmark SLYE rewrite quality across models
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-08-14 01:54'
updated_date: '2026-08-14 03:27'
labels: []
dependencies: []
references:
  - backlog/docs/specs/doc-1 - SLYE-MVP-specification.md
  - doc-3
priority: medium
type: spike
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a reproducible evaluation of SLYE rewrite quality across several authenticated Pi models and representative inputs. The benchmark should reveal when a model simplifies AI-speak, leaves already-clear prose unchanged, or damages language, facts, Markdown, commands, or fenced code. Model calls can consume quota or money, so execution must wait for an explicitly approved candidate matrix and request budget.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A versioned public all-English corpus contains six fixed fixtures with explicit expectations: inflated prose, mostly-clear prose with one isolated cliché, an already-clear control, technical literals, Markdown with fenced code, and bounded recent context/prompt-injection resistance.
- [ ] #2 Before any benchmark call, the exact approved model/thinking-level matrix, 108-call count, and matching public OpenRouter-equivalent per-token budget are recorded.
- [ ] #3 Every candidate uses the exact production SLYE prompt and an isolated production buildRewriteContext payload containing only the selected chat context and target, with no AGENTS, project, session, or tool context.
- [ ] #4 Final outputs, elapsed latency, provider-reported usage, requested and actual thinking levels, and stop data are retained reproducibly without chain-of-thought, credentials, response IDs, or headers.
- [ ] #5 Deterministic objective checks and anonymized blind human review assess simplification, semantic and factual fidelity, English-language fidelity, Markdown/code preservation, unwanted preambles, and unchanged-output rate; they yield model and thinking-level recommendations plus evidence-backed prompt changes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Version six English fixtures and explicit expectations.
2. Build an isolated sequential runner using the exact production `buildRewriteContext` payload and only selected chat context/target, with no agent/session/project context.
3. Use exactly the seven canonical models approved by the user and their distinct supported levels—DeepSeek/Gemma off/high/provider-max, Luna/Terra off/high/max, Haiku off/high, GPT-OSS 120B/20B low/high—18 configurations per fixture, 108 calls total.
4. Enforce 8,192 max output tokens and the production 45-second deadline, persist each incremental/resumable result with requested and actual thinking levels, stop data, elapsed time, and all provider-reported usage.
5. Snapshot exact matching public OpenRouter per-token prices and compute clearly labelled equivalent estimates only.
6. Generate deterministic objective checks and an anonymized blind-review report while excluding reasoning text and provider identifiers.
7. Run a no-call dry run, show exact 108-call manifest and final budget to user, and make zero benchmark calls until explicit approval.
8. After execution and blind review, publish recommendations and test an improved prompt only as a separately budgeted phase if evidence warrants it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User approval remains: the canonical model list and distinct-level fallback policy; a six-fixture all-English public corpus; the current production prompt baseline; sequential calls with a 45-second deadline and 8,192-token cap; public OpenRouter-equivalent pricing; no judge calls; blind human review; and strict isolation from agent, session, project, and tool context.

Final pre-approval validation: manifest fingerprint `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759`; Budget with estimated input and maximum output: USD 1.59740162; Conservative maximum OpenRouter-equivalent cost: USD 1.63969394. `node --test test/benchmark.test.ts` passed (18 tests), `npm run check` passed (52 tests), and `npm run benchmark:dry-run` produced a deterministic 108-row manifest without runtime, network, or model/completion calls. No model/completion calls ran.
<!-- SECTION:NOTES:END -->
