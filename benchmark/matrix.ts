export type RequestedThinking = "off" | "low" | "high" | "max";
export type ActualThinking = "off" | "low" | "high" | "xhigh" | "max";
export type ProviderThinking = "none" | "disabled" | "omitted" | "low" | "high" | "max";

export type BenchmarkCandidate = {
  id: string;
  provider: "ollama-cloud" | "anthropic" | "openai-codex";
  model: string;
  canonicalModel: string;
  priceModel: string;
  requestedThinking: RequestedThinking;
  actualThinking: ActualThinking;
  providerThinking: ProviderThinking;
};

type CandidateDefinition = Omit<
  BenchmarkCandidate,
  "id" | "requestedThinking" | "actualThinking" | "providerThinking"
> & {
  levels: readonly {
    requestedThinking: RequestedThinking;
    actualThinking: ActualThinking;
    providerThinking: ProviderThinking;
  }[];
};

const CANDIDATE_DEFINITIONS: readonly CandidateDefinition[] = [
  {
    provider: "ollama-cloud",
    model: "deepseek-v4-flash:0731",
    canonicalModel: "ollama-cloud/deepseek-v4-flash:0731",
    priceModel: "deepseek/deepseek-v4-flash-0731",
    levels: [
      { requestedThinking: "off", actualThinking: "off", providerThinking: "none" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
      { requestedThinking: "max", actualThinking: "xhigh", providerThinking: "max" },
    ],
  },
  {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    canonicalModel: "anthropic/claude-haiku-4-5",
    priceModel: "anthropic/claude-haiku-4.5",
    levels: [
      { requestedThinking: "off", actualThinking: "off", providerThinking: "disabled" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
    ],
  },
  {
    provider: "openai-codex",
    model: "gpt-5.6-luna",
    canonicalModel: "openai-codex/gpt-5.6-luna",
    priceModel: "openai/gpt-5.6-luna",
    levels: [
      { requestedThinking: "off", actualThinking: "off", providerThinking: "omitted" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
      { requestedThinking: "max", actualThinking: "max", providerThinking: "max" },
    ],
  },
  {
    provider: "openai-codex",
    model: "gpt-5.6-terra",
    canonicalModel: "openai-codex/gpt-5.6-terra",
    priceModel: "openai/gpt-5.6-terra",
    levels: [
      { requestedThinking: "off", actualThinking: "off", providerThinking: "omitted" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
      { requestedThinking: "max", actualThinking: "max", providerThinking: "max" },
    ],
  },
  {
    provider: "ollama-cloud",
    model: "gemma4:31b",
    canonicalModel: "ollama-cloud/gemma4:31b",
    priceModel: "google/gemma-4-31b-it",
    levels: [
      { requestedThinking: "off", actualThinking: "off", providerThinking: "none" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
      { requestedThinking: "max", actualThinking: "xhigh", providerThinking: "max" },
    ],
  },
  {
    provider: "ollama-cloud",
    model: "gpt-oss:120b",
    canonicalModel: "ollama-cloud/gpt-oss:120b",
    priceModel: "openai/gpt-oss-120b",
    levels: [
      { requestedThinking: "low", actualThinking: "low", providerThinking: "low" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
    ],
  },
  {
    provider: "ollama-cloud",
    model: "gpt-oss:20b",
    canonicalModel: "ollama-cloud/gpt-oss:20b",
    priceModel: "openai/gpt-oss-20b",
    levels: [
      { requestedThinking: "low", actualThinking: "low", providerThinking: "low" },
      { requestedThinking: "high", actualThinking: "high", providerThinking: "high" },
    ],
  },
];

export const BENCHMARK_CANDIDATES: readonly BenchmarkCandidate[] = CANDIDATE_DEFINITIONS.flatMap((definition) =>
  definition.levels.map((level) => ({
    id: `${definition.canonicalModel}#${level.requestedThinking}`,
    provider: definition.provider,
    model: definition.model,
    canonicalModel: definition.canonicalModel,
    priceModel: definition.priceModel,
    requestedThinking: level.requestedThinking,
    actualThinking: level.actualThinking,
    providerThinking: level.providerThinking,
  })),
);

export function validateCandidateMatrix(): void {
  if (BENCHMARK_CANDIDATES.length !== 18) {
    throw new Error("The benchmark matrix must contain exactly 18 configurations.");
  }

  const ids = new Set<string>();
  for (const candidate of BENCHMARK_CANDIDATES) {
    if (ids.has(candidate.id)) {
      throw new Error(`Duplicate benchmark candidate: ${candidate.id}`);
    }
    ids.add(candidate.id);
  }
}
