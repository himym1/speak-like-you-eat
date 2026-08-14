---
id: doc-3
title: SLYE benchmark procedure
type: guide
created_date: '2026-08-14 02:50'
updated_date: '2026-08-14 03:27'
---
# SLYE benchmark procedure

## Purpose and safety

This procedure evaluates the fixed six-fixture SLYE corpus across 18 approved configurations (108 calls). It uses the exact production `buildRewriteContext` system prompt and one user message containing only the selected context and target. No AGENTS, project/session history, tools, or normal agent prompt is sent to a completion.

`benchmark:dry-run` is safe: it only regenerates `benchmark/manifest.json` and prints the rows, fingerprint, and OpenRouter-equivalent budgets. It does not create the Pi SDK runtime, refresh providers, use the network, or make a model call.

## Review and approve the manifest

From the repository root, run:

```sh
npm run benchmark:dry-run
```

Confirm the output says `Rows: 108`. Review the exact model/thinking rows, the SHA-256 fingerprint, and both budgets. Every row explicitly records `completeSimple`, cache retention `none`, reasoning (`null` when off), Pi `request-max-tokens`, any Haiku high thinking budget, the 8,192 total-output ceiling, and the 45,000 ms deadline. Haiku high has `request-max-tokens=1024` and `haiku-high-thinking-budget=7168`, which total 8,192; every other row has `request-max-tokens=8192` and no custom thinking budget.

`Budget with estimated input and maximum output` uses `ceil(exact Context UTF-8 bytes / 4) + 16` input tokens plus the 8,192 output-token ceiling for every row; it is a ceiling budget, not an expected completion cost. `Conservative maximum OpenRouter-equivalent cost` uses `exact Context UTF-8 bytes + 256` input tokens plus that same output ceiling. Neither estimate invents a typical output or reasoning-token usage.

Do not run the benchmark until the responsible person explicitly approves that exact fingerprint. A changed corpus, matrix, payload, completion option, output cap, deadline, thinking mapping, price model, or price snapshot changes the reviewed manifest; execution-relevant row changes create new call IDs.

## Execute the approved run

Only after approval, run:

```sh
npm run benchmark:run -- --approve <fingerprint>
```

The runner regenerates the manifest and rejects a missing or mismatched approval before it creates a Pi runtime. After approval it obtains the authenticated public Pi `session.modelRuntime` from an empty temporary cwd, `SessionManager.inMemory()`, and `noTools: "all"`; it never calls a Pi agent prompt, sends a session message, or starts an interactive request. Before the first completion, it verifies configured authentication for every provider, every configured model, and the exact thinking mapping without clamping. Calls are sequential. Each has a local 45-second deadline and an 8,192 total-output ceiling.

A timeout is a final recorded result: it proves that candidate missed the product deadline, aborts the current request, and stops this process so no overlapping next request starts. On the next run with the same approved fingerprint, normal resume skips that timeout and advances the matrix. Normal resume also skips every other settled row: a successful row, a non-stop or truncated response recorded as a provider error, and a provider or unknown error. To manually rerun any settled row, delete that exact local result file in `benchmark/.work/`; do not expect normal resume to retry it.

A user cancellation remains retryable and stops the current process. Thrown aborted, authentication, and rate-limit failures also stop and remain retryable on resume. Provider and unknown errors remain recorded and allow later rows to run. Settled saved usage is priced again using the current manifest price snapshot rather than trusting a stored cost. Results, the blind report, and the candidate mapping are local ignored files under `benchmark/.work/`. They contain final text and sanitized usage only; do not add credentials, request/response IDs, headers, provider diagnostics, or reasoning content.

## Blind review, reveal, and publication

Create the local blind review after results exist:

```sh
npm run benchmark:report
```

The report rebuilds the current manifest and loads only local result filenames whose call IDs belong to that manifest before parsing them. Old ignored result files from earlier fingerprints are excluded, so removed fixtures cannot enter or break the report. The first report cryptographically shuffles candidate labels in the local ignored mapping. Later reports preserve those labels and only add labels for new candidates.

The report is grouped by corpus fixture in corpus order. Each fixture shows its selected context and exact source target once, then its outputs in anonymized Candidate-label order with elapsed time, available token usage, OpenRouter-equivalent cost, and mechanical checks. It contains no model, provider, or thinking identity. Source and output are isolated in fences so model Markdown cannot change report structure.

Review the anonymized outputs against the rubric: simplification, cliché removal, semantic and factual fidelity, English fidelity, Markdown/code preservation, and unwanted preambles. Mechanical checks are evidence only; they do not prove semantic quality. Keep the mapping hidden until all human scoring is complete. Then reveal `benchmark/.work/blind-map.json`, summarize the evidence and recommendations, and publish only the reviewed aggregate findings. Any prompt change or follow-up benchmark needs separate approval and budget review.
