---
id: TASK-3
title: Benchmark SLYE rewrite quality across models
status: In Progress
assignee:
  - '@zambo'
created_date: '2026-08-14 01:54'
updated_date: '2026-08-14 14:46'
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

9. Based on the locked blind review, prepare a separately fingerprinted phase-two prompt follow-up with only backup-cliche, inflated-prose, and clear-control; only Terra off, GPT-OSS 120B low, and DeepSeek V4 off; and only the improved prompt calls, reusing phase-one baseline results. Keep phase-two manifest, result storage, blind mapping, and report separate from phase one. Include the exact full prompt and selected IDs in the fingerprinted manifest. Retain the same sequential completion method, isolation, 45-second deadline, 8,192-token ceiling, sanitized usage, OpenRouter-equivalent prices, resume semantics, and approval-before-runtime gate. Add no model call until the exact nine-row fingerprint and conservative budget receive separate explicit approval.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User approval remains: the canonical model list and distinct-level fallback policy; a six-fixture all-English public corpus; the current production prompt baseline; sequential calls with a 45-second deadline and 8,192-token cap; public OpenRouter-equivalent pricing; no judge calls; blind human review; and strict isolation from agent, session, project, and tool context.

Final pre-approval validation: manifest fingerprint `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759`; Budget with estimated input and maximum output: USD 1.59740162; Conservative maximum OpenRouter-equivalent cost: USD 1.63969394. `node --test test/benchmark.test.ts` passed (18 tests), `npm run check` passed (52 tests), and `npm run benchmark:dry-run` produced a deterministic 108-row manifest without runtime, network, or model/completion calls. No model/completion calls ran.

Execution approval: the user explicitly approved running the exact 108-call manifest fingerprint `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759` with conservative OpenRouter-equivalent ceiling USD 1.63969394. No prompt variant or extra judge call is approved.

Approved phase-one execution completed for the exact fingerprint: 108/108 rows were successful with stop reason `stop`; no timeout, provider error, or runner stop occurred. Provider-reported totals: 54,871 input, 41,325 output, 3,196 reasoning, 96,196 total, zero cache read/write tokens. Sum of call latency was 547,647 ms; median 3,847 ms; maximum 34,797 ms. Usage-based OpenRouter-equivalent cost was USD 0.01310292; actual provider billing or quota accounting can differ. Mechanical checks found zero literal/Markdown/fence damage signals, zero preambles, zero length-limit failures, four unchanged allowed outputs, and eight forbidden-phrase hits requiring review. The ignored blind report and stable mapping were generated under `benchmark/.work/`; identities have not been revealed. Blind human scoring remains pending. No judge-model or prompt-variant call ran.

Blind human review was completed before identity reveal and locked at SHA-256 `bbe90c535ac1a0d0e243dc3f4f0cae6bf97955eb0302e1cebf88d8a9b732979e`: 108/108 Q/F/S scores, including accepted half-points for Q. The human reported that the first three fixtures, especially backup cliché and inflated prose, carried most useful differentiation; the remaining fixtures mainly confirmed safety. All 108 safety scores were 2. The only fidelity scores below 2 were Haiku off and Gemma off on inflated prose. Highest fidelity-safe mean Q was 1.833 for Terra high, Terra off, and GPT-OSS 120B high; GPT-OSS 120B low scored 1.750 with much lower mean latency. Terra off/high and GPT-OSS 120B low/high tied on aggregate Q across the first three fixtures. No configuration earned Q=2 on the backup-cliché fixture. Higher thinking did not consistently improve quality and often increased latency or reduced quality. The local ignored aggregate is `benchmark/.work/human-aggregate.json`. No follow-up model call has run.

The user approved preparing this no-call nine-row phase-two setup. This approval covers implementation and dry-run only, not execution. The prompt variant will explicitly replace clichés/stock metaphors/corporate filler with plain meaning, keep already-clear prose close to its original form without turning it into a list, and forbid simplification by deleting claims, conditions, or instructions.

Phase-two no-call setup validation completed: exact nine-row fingerprint `59fc67e920727f25b40b1fd874cda6b51aff9f98426ae09af27275a4fda96728`; estimated-input/output-ceiling budget USD 0.15991218; conservative maximum OpenRouter-equivalent budget USD 0.16476768. Phase one remains fingerprint `80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759` with disjoint call IDs. `npm run check` passed 55 tests; both dry-runs were deterministic; the npm tarball remained exactly eight files; tests preserved an injected phase-two work sentinel; taste and spec reviewers reported no must-fix findings. No phase-two result directory, runtime, network, or model call was created. Execution still requires separate explicit approval of this exact fingerprint and conservative budget.
<!-- SECTION:NOTES:END -->
