import { fileURLToPath } from "node:url";
import { buildRewriteContext } from "../src/model-rewrite.ts";
import type { RewriteRequest } from "../src/rewrite.ts";
import { BENCHMARK_CORPUS, type BenchmarkFixture } from "./corpus.ts";
import { type BenchmarkManifest, type BenchmarkSuiteMetadata, buildManifestFor, writeManifest } from "./manifest.ts";
import { BENCHMARK_CANDIDATES, type BenchmarkCandidate } from "./matrix.ts";
import type { BenchmarkSuite } from "./runner.ts";

export const PHASE_ONE_BASELINE_FINGERPRINT = "80d7d401fe9862d3d558efc4ba8b674014dd3e7e975f02d77cc3b37c30fbd759";
export const PHASE_TWO_PROMPT_VARIANT_ID = "phase-2-evidence-based-plainness-v1";
export const PHASE_TWO_FIXTURE_IDS = ["backup-cliche", "inflated-prose", "clear-control"] as const;
export const PHASE_TWO_CANDIDATE_IDS = [
  "openai-codex/gpt-5.6-terra#off",
  "ollama-cloud/gpt-oss:120b#low",
  "ollama-cloud/deepseek-v4-flash:0731#off",
] as const;
const ADDITIONAL_INSTRUCTIONS = [
  "Replace clichés, stock metaphors, corporate jargon, slogans, filler, and repetition with their plain meaning; do not preserve or lightly paraphrase them.",
  "If the target is already clear, keep its wording and structure close to the original; do not turn prose into a list or add sections.",
  "Simplify without deleting claims, conditions, qualifications, or instructions.",
] as const;

export const PHASE_TWO_FIXTURES = selectFixtures(PHASE_TWO_FIXTURE_IDS);
export const PHASE_TWO_CANDIDATES = selectCandidates(PHASE_TWO_CANDIDATE_IDS);
export const PHASE_TWO_WORK_DIRECTORY = fileURLToPath(new URL("./.work/phase-2/", import.meta.url));

export function buildPhaseTwoContext(request: RewriteRequest): ReturnType<typeof buildRewriteContext> {
  const productionContext = buildRewriteContext(request);
  return {
    ...productionContext,
    systemPrompt: addPhaseTwoInstructions(productionContext.systemPrompt),
  };
}

export function phaseTwoSystemPrompt(): string {
  return buildPhaseTwoContext({ context: [], target: "" }).systemPrompt;
}

export function addPhaseTwoInstructions(productionSystemPrompt: string): string {
  const finalInstructionStart = productionSystemPrompt.lastIndexOf("\n");
  if (finalInstructionStart === -1) {
    throw new Error("Production rewrite prompt has no final output-only instruction.");
  }

  const finalInstruction = productionSystemPrompt.slice(finalInstructionStart + 1);
  if (!finalInstruction.startsWith("Output only the rewrite")) {
    throw new Error("Production rewrite prompt no longer ends with the output-only instruction.");
  }

  return [productionSystemPrompt.slice(0, finalInstructionStart), ...ADDITIONAL_INSTRUCTIONS, finalInstruction].join("\n");
}

export async function buildPhaseTwoManifest(): Promise<BenchmarkManifest> {
  return buildManifestFor({
    fixtures: PHASE_TWO_FIXTURES,
    candidates: PHASE_TWO_CANDIDATES,
    buildContext: buildPhaseTwoContext,
    suiteMetadata: phaseTwoSuiteMetadata(),
  });
}

export async function writePhaseTwoManifest(manifest: BenchmarkManifest, path: URL = phaseTwoManifestUrl()): Promise<void> {
  await writeManifest(manifest, path);
}

export const PHASE_TWO_SUITE: BenchmarkSuite = {
  corpus: PHASE_TWO_FIXTURES,
  buildContext: buildPhaseTwoContext,
  buildManifest: buildPhaseTwoManifest,
  writeManifest: writePhaseTwoManifest,
};

function phaseTwoSuiteMetadata(): BenchmarkSuiteMetadata {
  return {
    id: "phase-2",
    promptVariantId: PHASE_TWO_PROMPT_VARIANT_ID,
    systemPrompt: phaseTwoSystemPrompt(),
    phaseOneBaselineFingerprint: PHASE_ONE_BASELINE_FINGERPRINT,
    fixtureIds: PHASE_TWO_FIXTURE_IDS,
    candidateIds: PHASE_TWO_CANDIDATE_IDS,
  };
}

function selectFixtures(ids: readonly string[]): readonly BenchmarkFixture[] {
  return ids.map((id) => {
    const fixture = BENCHMARK_CORPUS.find((entry) => entry.id === id);
    if (fixture === undefined) {
      throw new Error(`Unknown phase-two fixture: ${id}`);
    }
    return fixture;
  });
}

function selectCandidates(ids: readonly string[]): readonly BenchmarkCandidate[] {
  return ids.map((id) => {
    const candidate = BENCHMARK_CANDIDATES.find((entry) => entry.id === id);
    if (candidate === undefined) {
      throw new Error(`Unknown phase-two candidate: ${id}`);
    }
    return candidate;
  });
}

function phaseTwoManifestUrl(): URL {
  return new URL("./phase-2-manifest.json", import.meta.url);
}
