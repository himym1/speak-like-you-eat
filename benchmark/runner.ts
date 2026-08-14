import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAgentSession, type ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";
import { BENCHMARK_CORPUS, type BenchmarkFixture } from "./corpus.ts";
import {
  type BenchmarkManifest,
  buildManifest,
  type CompletionReasoning,
  calculateOpenRouterCost,
  type ManifestRow,
  type OpenRouterPrice,
  type RewriteContextBuilder,
  writeManifest,
} from "./manifest.ts";
import type { ActualThinking, ProviderThinking, RequestedThinking } from "./matrix.ts";
import { buildPhaseOneContext } from "./prompt-variants.ts";

export const PRODUCTION_WORK_DIRECTORY = fileURLToPath(new URL("./.work/", import.meta.url));

export type CompletionOptions = {
  signal: AbortSignal;
  cacheRetention: "none";
  sessionId: string;
  reasoning?: CompletionReasoning;
  maxTokens: number;
  thinkingBudgets?: { high: number };
};

type CompletionResponse = {
  stopReason: string;
  content: unknown;
  usage?: unknown;
};

type ModelRuntimeLike = Pick<ModelRuntime, "getModel" | "completeSimple" | "hasConfiguredAuth">;

export type BenchmarkResult = {
  callId: string;
  fixture: string;
  canonicalModel: string;
  requestedThinking: RequestedThinking;
  actualPiThinking: ActualThinking;
  expectedProviderThinking: ProviderThinking;
  elapsedMs: number;
  outcome: "success" | "error" | "timeout" | "cancelled";
  stopReason: string | null;
  textBlocks: string[];
  usage?: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    cacheWrite1h?: number;
    reasoning?: number;
    total: number;
  };
  openRouterEquivalentCost?: string;
  errorCategory?: "aborted" | "authentication" | "rate_limit" | "provider_error" | "unknown";
};

export type RuntimeFactory = (cwd: string) => Promise<{ runtime: ModelRuntimeLike; dispose(): void }>;

export type BenchmarkSuite = {
  corpus: readonly BenchmarkFixture[];
  buildContext: RewriteContextBuilder;
  buildManifest(): Promise<BenchmarkManifest>;
  writeManifest(manifest: BenchmarkManifest): Promise<void>;
};

export const PHASE_ONE_SUITE: BenchmarkSuite = {
  corpus: BENCHMARK_CORPUS,
  buildContext: buildPhaseOneContext,
  buildManifest,
  writeManifest,
};

export type RunBenchmarkOptions = {
  workDirectory: string;
  runtimeFactory?: RuntimeFactory;
  suite?: BenchmarkSuite;
};

export async function runBenchmark(
  approval: string | undefined,
  options: RunBenchmarkOptions,
): Promise<{
  manifest: BenchmarkManifest;
  results: BenchmarkResult[];
  stopped: boolean;
}> {
  const suite = options.suite ?? PHASE_ONE_SUITE;
  const runtimeFactory = options.runtimeFactory ?? createIsolatedRuntime;
  const manifest = await suite.buildManifest();
  await suite.writeManifest(manifest);
  if (approval !== manifest.fingerprint) {
    throw new Error("Refusing to create a Pi runtime: pass --approve with the current manifest fingerprint.");
  }

  const temporaryCwd = await mkdtemp(join(tmpdir(), "slye-benchmark-"));
  let runtimeHandle: { runtime: ModelRuntimeLike; dispose(): void } | undefined;
  const interrupt = new AbortController();
  let interrupted = false;
  const onSigint = () => {
    interrupted = true;
    interrupt.abort();
  };
  process.once("SIGINT", onSigint);

  try {
    runtimeHandle = await runtimeFactory(temporaryCwd);
    validateRuntimeSupport(runtimeHandle.runtime, manifest);
    const results: BenchmarkResult[] = [];

    for (const row of manifest.rows) {
      if (interrupted) {
        return { manifest, results, stopped: true };
      }
      const price = manifest.pricing.prices[row.priceModel];
      if (price === undefined) throw new Error(`No price for ${row.priceModel}`);
      const saved = await readResult(options.workDirectory, row.callId);
      if (saved !== undefined && isSettledResult(saved)) {
        const currentPriceResult = recomputeStoredCost(saved, price);
        await writeResult(options.workDirectory, currentPriceResult);
        results.push(currentPriceResult);
        continue;
      }

      const fixture = findFixture(suite.corpus, row.fixture);
      const result = await executeRow(row, fixture, runtimeHandle.runtime, interrupt.signal, price, suite.buildContext);
      await writeResult(options.workDirectory, result);
      results.push(result);
      if (shouldStopAfterResult(result)) {
        return { manifest, results, stopped: true };
      }
    }

    return { manifest, results, stopped: false };
  } finally {
    process.removeListener("SIGINT", onSigint);
    runtimeHandle?.dispose();
    await rm(temporaryCwd, { recursive: true, force: true });
  }
}

export async function executeRow(
  row: ManifestRow,
  fixture: BenchmarkFixture,
  runtime: ModelRuntimeLike,
  externalSignal?: AbortSignal,
  price?: OpenRouterPrice,
  buildContext: RewriteContextBuilder = buildPhaseOneContext,
): Promise<BenchmarkResult> {
  if (externalSignal?.aborted) {
    return baseResult(row, 0, "cancelled", null);
  }

  const model = runtime.getModel(row.provider, row.model);
  if (model === undefined) {
    throw new Error(`Configured model is unavailable: ${row.canonicalModel}`);
  }

  const controller = new AbortController();
  const startedAt = Date.now();
  const options = completionOptions(row, controller.signal);
  let completion: Promise<CompletionResponse>;
  try {
    completion = runtime.completeSimple(model, buildContext(fixture.request), options) as Promise<CompletionResponse>;
  } catch (error) {
    return { ...baseResult(row, Date.now() - startedAt, "error", null), errorCategory: sanitizeError(error) };
  }
  const settled = completion.then(
    (response) => ({ kind: "response" as const, response }),
    (error: unknown) => ({ kind: "error" as const, error }),
  );
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let removeAbortListener: (() => void) | undefined;
  const timeout = new Promise<{ kind: "timeout" }>((resolve) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      resolve({ kind: "timeout" });
    }, row.deadlineMs);
  });
  const cancelled = new Promise<{ kind: "cancelled" }>((resolve) => {
    if (externalSignal === undefined) {
      return;
    }
    const abort = () => {
      controller.abort();
      resolve({ kind: "cancelled" });
    };
    externalSignal.addEventListener("abort", abort, { once: true });
    removeAbortListener = () => externalSignal.removeEventListener("abort", abort);
  });

  try {
    const result = await Promise.race([settled, timeout, cancelled]);
    const elapsedMs = Date.now() - startedAt;
    if (result.kind === "timeout") {
      return baseResult(row, elapsedMs, "timeout", null);
    }
    if (result.kind === "cancelled") {
      return baseResult(row, elapsedMs, "cancelled", null);
    }
    if (result.kind === "error") {
      return { ...baseResult(row, elapsedMs, "error", null), errorCategory: sanitizeError(result.error) };
    }

    const textBlocks = finalTextBlocks(result.response.content);
    if (result.response.stopReason !== "stop" || textBlocks.length === 0) {
      return { ...baseResult(row, elapsedMs, "error", result.response.stopReason), errorCategory: "provider_error" };
    }
    const usage = sanitizeUsage(result.response.usage);
    return {
      ...baseResult(row, elapsedMs, "success", result.response.stopReason),
      textBlocks,
      usage,
      ...(price === undefined || usage === undefined
        ? {}
        : { openRouterEquivalentCost: calculateOpenRouterCost(usage, price) }),
    };
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    removeAbortListener?.();
  }
}

export function completionOptions(row: ManifestRow, signal: AbortSignal): CompletionOptions {
  const options: CompletionOptions = {
    signal,
    cacheRetention: row.cacheRetention,
    sessionId: randomUUID(),
    maxTokens: row.requestMaxTokens,
  };
  if (row.reasoning !== null) {
    options.reasoning = row.reasoning;
  }
  if (row.haikuHighThinkingBudget !== null) {
    options.thinkingBudgets = { high: row.haikuHighThinkingBudget };
  }
  return options;
}

export function isSettledResult(result: BenchmarkResult): boolean {
  if (result.outcome === "success" || result.outcome === "timeout") {
    return true;
  }
  return (
    result.outcome === "error" && (result.errorCategory === "provider_error" || result.errorCategory === "unknown")
  );
}

export function shouldStopAfterResult(result: BenchmarkResult): boolean {
  if (result.outcome === "timeout" || result.outcome === "cancelled") {
    return true;
  }
  return (
    result.outcome === "error" &&
    (result.errorCategory === "aborted" ||
      result.errorCategory === "authentication" ||
      result.errorCategory === "rate_limit")
  );
}

export function validateRuntimeSupport(runtime: ModelRuntimeLike, manifest: BenchmarkManifest): void {
  const authenticatedProviders = new Set<string>();
  const validatedModels = new Set<string>();

  for (const row of manifest.rows) {
    if (!authenticatedProviders.has(row.provider)) {
      if (!runtime.hasConfiguredAuth(row.provider)) {
        throw new Error(`Configured authentication is unavailable: ${row.provider}`);
      }
      authenticatedProviders.add(row.provider);
    }

    const modelKey = `${row.provider}\n${row.model}\n${row.actualPiThinking}\n${row.expectedProviderThinking}`;
    if (validatedModels.has(modelKey)) {
      continue;
    }
    validatedModels.add(modelKey);

    const model = runtime.getModel(row.provider, row.model);
    if (model === undefined) {
      throw new Error(`Configured model is unavailable: ${row.canonicalModel}`);
    }
    if (row.actualPiThinking !== "off" && !model.reasoning) {
      throw new Error(`Configured model does not support thinking: ${row.canonicalModel}`);
    }

    const mappedThinking = model.thinkingLevelMap?.[row.actualPiThinking];
    if (mappedThinking === null) {
      throw new Error(`Configured model does not support ${row.actualPiThinking}: ${row.canonicalModel}`);
    }

    // Ollama off and Pi xhigh/max need explicit mappings so they cannot be silently dropped or clamped.
    const needsExplicitMapping =
      (row.provider === "ollama-cloud" && row.actualPiThinking === "off") ||
      row.actualPiThinking === "xhigh" ||
      row.actualPiThinking === "max";
    if (mappedThinking === undefined && needsExplicitMapping) {
      throw new Error(
        `Configured model does not map ${row.actualPiThinking} to ${row.expectedProviderThinking}: ${row.canonicalModel}`,
      );
    }
    if (mappedThinking !== undefined && mappedThinking !== row.expectedProviderThinking) {
      throw new Error(`Configured model maps ${row.actualPiThinking} unexpectedly: ${row.canonicalModel}`);
    }
  }
}

export function finalTextBlocks(content: unknown): string[] {
  if (!Array.isArray(content)) {
    return [];
  }
  return content.flatMap((block) =>
    typeof block === "object" &&
    block !== null &&
    "type" in block &&
    block.type === "text" &&
    "text" in block &&
    typeof block.text === "string"
      ? [block.text]
      : [],
  );
}

export function sanitizeError(error: unknown): NonNullable<BenchmarkResult["errorCategory"]> {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("abort")) return "aborted";
    if (message.includes("auth") || message.includes("credential") || message.includes("unauthorized"))
      return "authentication";
    if (message.includes("rate") || message.includes("429")) return "rate_limit";
    if (message.includes("provider") || message.includes("http") || message.includes("network"))
      return "provider_error";
  }
  return "unknown";
}

async function createIsolatedRuntime(cwd: string): Promise<{ runtime: ModelRuntimeLike; dispose(): void }> {
  const { session } = await createAgentSession({
    cwd,
    sessionManager: SessionManager.inMemory(),
    noTools: "all",
  });
  return { runtime: session.modelRuntime, dispose: () => session.dispose() };
}

function baseResult(
  row: ManifestRow,
  elapsedMs: number,
  outcome: BenchmarkResult["outcome"],
  stopReason: string | null,
): BenchmarkResult {
  return {
    callId: row.callId,
    fixture: row.fixture,
    canonicalModel: row.canonicalModel,
    requestedThinking: row.requestedThinking,
    actualPiThinking: row.actualPiThinking,
    expectedProviderThinking: row.expectedProviderThinking,
    elapsedMs,
    outcome,
    stopReason,
    textBlocks: [],
  };
}

function recomputeStoredCost(result: BenchmarkResult, price: OpenRouterPrice): BenchmarkResult {
  const { openRouterEquivalentCost: _storedCost, ...withoutStoredCost } = result;
  if (result.usage === undefined) {
    return withoutStoredCost;
  }
  return { ...withoutStoredCost, openRouterEquivalentCost: calculateOpenRouterCost(result.usage, price) };
}

function sanitizeUsage(usage: unknown): BenchmarkResult["usage"] | undefined {
  if (typeof usage !== "object" || usage === null) {
    return undefined;
  }
  const value = usage as Record<string, unknown>;
  if (!["input", "output", "cacheRead", "cacheWrite", "totalTokens"].every((key) => typeof value[key] === "number")) {
    return undefined;
  }
  const result: NonNullable<BenchmarkResult["usage"]> = {
    input: value.input as number,
    output: value.output as number,
    cacheRead: value.cacheRead as number,
    cacheWrite: value.cacheWrite as number,
    total: value.totalTokens as number,
  };
  if (typeof value.cacheWrite1h === "number") result.cacheWrite1h = value.cacheWrite1h;
  if (typeof value.reasoning === "number") result.reasoning = value.reasoning;
  return result;
}

async function readResult(workDirectory: string, callId: string): Promise<BenchmarkResult | undefined> {
  try {
    return JSON.parse(await readFile(workPath(workDirectory, callId), "utf8")) as BenchmarkResult;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function writeResult(workDirectory: string, result: BenchmarkResult): Promise<void> {
  await mkdir(workDirectory, { recursive: true });
  const path = workPath(workDirectory, result.callId);
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(result)}\n`, "utf8");
  await rename(temporary, path);
}

function workPath(workDirectory: string, callId: string): string {
  return join(workDirectory, `${callId}.json`);
}

function findFixture(corpus: readonly BenchmarkFixture[], id: string): BenchmarkFixture {
  const fixture = corpus.find((entry) => entry.id === id);
  if (fixture === undefined) throw new Error(`Unknown fixture: ${id}`);
  return fixture;
}
