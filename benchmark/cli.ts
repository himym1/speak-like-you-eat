import { type BenchmarkManifest, buildManifest, writeManifest } from "./manifest.ts";
import {
  buildPhaseTwoManifest,
  PHASE_TWO_PROMPT_VARIANT_ID,
  PHASE_TWO_SUITE,
  PHASE_TWO_WORK_DIRECTORY,
  writePhaseTwoManifest,
} from "./phase-2.ts";
import { readLocalResults, writeBlindReport } from "./report.ts";
import { type BenchmarkSuite, PHASE_ONE_SUITE, PRODUCTION_WORK_DIRECTORY, runBenchmark } from "./runner.ts";

const [command, ...arguments_] = process.argv.slice(2);

if (command === "dry-run") {
  const manifest = await buildManifest();
  await writeManifest(manifest);
  printManifest(manifest);
} else if (command === "run") {
  const approval = approvalArgument(arguments_);
  const result = await runBenchmark(approval, { workDirectory: PRODUCTION_WORK_DIRECTORY });
  console.log(`Completed ${result.results.length} rows; stopped=${result.stopped}`);
} else if (command === "report") {
  await writeReport(PHASE_ONE_SUITE, PRODUCTION_WORK_DIRECTORY);
} else if (command === "phase-2-dry-run") {
  const manifest = await buildPhaseTwoManifest();
  await writePhaseTwoManifest(manifest);
  console.log(`Prompt variant: ${PHASE_TWO_PROMPT_VARIANT_ID}`);
  console.log("System prompt:");
  console.log(manifest.suite?.systemPrompt ?? "unavailable");
  printManifest(manifest);
} else if (command === "phase-2-run") {
  const approval = approvalArgument(arguments_);
  const result = await runBenchmark(approval, { workDirectory: PHASE_TWO_WORK_DIRECTORY, suite: PHASE_TWO_SUITE });
  console.log(`Completed ${result.results.length} rows; stopped=${result.stopped}`);
} else if (command === "phase-2-report") {
  await writeReport(PHASE_TWO_SUITE, PHASE_TWO_WORK_DIRECTORY);
} else {
  console.error(
    "Usage: benchmark/cli.ts <dry-run|run|report|phase-2-dry-run|phase-2-run|phase-2-report> [--approve <fingerprint>]",
  );
  process.exitCode = 1;
}

function printManifest(manifest: BenchmarkManifest): void {
  for (const row of manifest.rows) {
    console.log(
      `${row.callId} ${row.fixture} ${row.canonicalModel} method=${row.completionMethod} cache=${row.cacheRetention} requested=${row.requestedThinking} actual=${row.actualPiThinking} provider-thinking=${row.expectedProviderThinking} reasoning=${row.reasoning ?? "null"} request-max-tokens=${row.requestMaxTokens} haiku-high-thinking-budget=${row.haikuHighThinkingBudget ?? "null"} output-ceiling=${row.outputTokenCeiling} deadline-ms=${row.deadlineMs} input-estimate=${row.inputTokenEstimate} input-upper=${row.inputTokenUpperBound}`,
    );
  }
  console.log(`Rows: ${manifest.callCount}`);
  console.log(`Fingerprint: ${manifest.fingerprint}`);
  console.log(`Budget with estimated input and maximum output: $${manifest.pricing.estimatedInputAtOutputCeilingCost}`);
  console.log(`Conservative maximum OpenRouter-equivalent cost: $${manifest.pricing.conservativeMaximumCost}`);
}

async function writeReport(suite: BenchmarkSuite, workDirectory: string): Promise<void> {
  const manifest = await suite.buildManifest();
  const allowedCallIds = new Set(manifest.rows.map((row) => row.callId));
  const report = await writeBlindReport(
    await readLocalResults(workDirectory, allowedCallIds),
    workDirectory,
    undefined,
    suite.corpus,
  );
  console.log(`Blind report: ${report.reportPath}`);
  console.log(`Local mapping: ${report.mappingPath}`);
}

function approvalArgument(arguments_: readonly string[]): string | undefined {
  const index = arguments_.indexOf("--approve");
  return index === -1 ? undefined : arguments_[index + 1];
}
