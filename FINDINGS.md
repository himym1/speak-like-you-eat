# Findings

## 2026-08-14 — Phase-two aggregate cost

**Hypothesis.** The recorded USD 0.00041840 represented the nine-row usage-priced total.

**Evidence.** Recomputing all nine stored sanitized usages against frozen manifest price models gives Terra USD 0.00212100 + GPT-OSS 120B low USD 0.00007589 + DeepSeek USD 0.00018522 = USD 0.00238211.

**Practical consequence.** Use USD 0.00238211 in publications; per-candidate numbers, the GPT-vs-DeepSeek percentage, tokens, latency, scores, and fingerprints are unaffected; sum per-row decimal costs rather than applying one blended rate.

**Links.** [TASK-3](backlog/tasks/task-3%20-%20Benchmark-SLYE-rewrite-quality-across-models.md), [doc-3](backlog/docs/runbooks/doc-3%20-%20SLYE-benchmark-procedure.md), and [doc-4](backlog/docs/specs/doc-4%20-%20SLYE-benchmark-results.md).

## 2026-08-14 — Phase-one aggregate cost and median

**Hypothesis.** Human-aggregate cost fields and the previously recorded phase-one aggregate cost and median were exact.

**Evidence.** A 108-row per-row frozen-price recomputation gives USD 0.06482709; sorted middle latencies 3,754ms and 3,847ms give a 3,800.5ms median. Thirteen of 18 human aggregate candidate cost fields differ. All 18 local human-aggregate candidate median fields used the upper-middle value rather than averaging the middle pair.

**Practical consequence.** doc-4 uses raw-row recomputation for costs and recomputes candidate medians from raw rows. Use decimal per-row sums and the average of the two middle values for an even-count median; Q/F/S, token counts, latency sum and maximum, and fingerprints are unaffected.

**Links.** [TASK-3](backlog/tasks/task-3%20-%20Benchmark-SLYE-rewrite-quality-across-models.md) and [doc-4](backlog/docs/specs/doc-4%20-%20SLYE-benchmark-results.md).
