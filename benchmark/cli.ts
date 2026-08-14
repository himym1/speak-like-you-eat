import { buildManifest, writeManifest } from "./manifest.ts";
import { readLocalResults, writeBlindReport } from "./report.ts";
import { PRODUCTION_WORK_DIRECTORY, runBenchmark } from "./runner.ts";

const [command, ...arguments_] = process.argv.slice(2);

if (command === "dry-run") {
  const manifest = await buildManifest();
  await writeManifest(manifest);
  for (const row of manifest.rows) {
    console.log(
      `${row.callId} ${row.fixture} ${row.canonicalModel} method=${row.completionMethod} cache=${row.cacheRetention} requested=${row.requestedThinking} actual=${row.actualPiThinking} provider-thinking=${row.expectedProviderThinking} reasoning=${row.reasoning ?? "null"} request-max-tokens=${row.requestMaxTokens} haiku-high-thinking-budget=${row.haikuHighThinkingBudget ?? "null"} output-ceiling=${row.outputTokenCeiling} deadline-ms=${row.deadlineMs} input-estimate=${row.inputTokenEstimate} input-upper=${row.inputTokenUpperBound}`,
    );
  }
  console.log(`Rows: ${manifest.callCount}`);
  console.log(`Fingerprint: ${manifest.fingerprint}`);
  console.log(`Budget with estimated input and maximum output: $${manifest.pricing.estimatedInputAtOutputCeilingCost}`);
  console.log(`Conservative maximum OpenRouter-equivalent cost: $${manifest.pricing.conservativeMaximumCost}`);
} else if (command === "run") {
  const approval = approvalArgument(arguments_);
  const result = await runBenchmark(approval, { workDirectory: PRODUCTION_WORK_DIRECTORY });
  console.log(`Completed ${result.results.length} rows; stopped=${result.stopped}`);
} else if (command === "report") {
  const manifest = await buildManifest();
  const allowedCallIds = new Set(manifest.rows.map((row) => row.callId));
  const report = await writeBlindReport(await readLocalResults(PRODUCTION_WORK_DIRECTORY, allowedCallIds), PRODUCTION_WORK_DIRECTORY);
  console.log(`Blind report: ${report.reportPath}`);
  console.log(`Local mapping: ${report.mappingPath}`);
} else {
  console.error("Usage: benchmark/cli.ts <dry-run|run|report> [--approve <fingerprint>]");
  process.exitCode = 1;
}

function approvalArgument(arguments_: readonly string[]): string | undefined {
  const index = arguments_.indexOf("--approve");
  return index === -1 ? undefined : arguments_[index + 1];
}
