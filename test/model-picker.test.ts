import assert from "node:assert/strict";
import test from "node:test";
import type { ExtensionCommandContext, ModelRegistry } from "@earendil-works/pi-coding-agent";
import {
  filterModelCandidates,
  formatModelCandidate,
  type ModelCandidate,
  pickModel,
  selectModelCandidates,
} from "../src/model-picker.ts";
import { createModelPickerDriver } from "./picker-driver.ts";

type PiModel = NonNullable<ReturnType<ModelRegistry["find"]>>;

function model(overrides: Partial<PiModel>): PiModel {
  return {
    provider: "test",
    id: "model",
    name: "Test model",
    reasoning: false,
    ...overrides,
  } as PiModel;
}

function candidate(provider: string, id: string, name: string): ModelCandidate {
  return {
    provider,
    id,
    name,
    thinkingLevel: "off",
  };
}

async function runPicker(scoped: ModelCandidate[], all: ModelCandidate[], inputs: string[]) {
  const driver = createModelPickerDriver(inputs);
  const context = {
    ui: {
      custom(factory: Parameters<ExtensionCommandContext["ui"]["custom"]>[0]) {
        return driver.run(factory);
      },
    },
  } as unknown as ExtensionCommandContext;

  return {
    result: await pickModel(context, scoped, all),
    renders: driver.renders,
    completionCount: driver.completionCount,
  };
}

test("filters authenticated candidates, excludes malformed metadata, ignores scoped pinned thinking, and sorts by provider and id", () => {
  const unusable = model({
    provider: "alpha",
    id: "unusable",
    reasoning: true,
    thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: null, xhigh: null, max: null },
  });
  const low = model({ provider: "alpha", id: "low", reasoning: true, thinkingLevelMap: { off: null, minimal: null } });
  const off = model({ provider: "beta", id: "off", reasoning: false });

  const candidates = selectModelCandidates([off, low, off, unusable], (current) => current !== unusable);

  assert.deepEqual(candidates.map(formatModelCandidate), ["alpha / low · thinking: low", "beta / off · thinking: off"]);
  assert.equal(candidates[0]?.thinkingLevel, "low");
  assert.equal(
    candidates.some((current) => current.id === "unusable"),
    false,
  );
  assert.deepEqual(filterModelCandidates(candidates, "beta off"), [candidates[1]]);
});

test("starts scoped, switches in both Tab directions, preserves search and selection, and resets its default next time", async () => {
  const shared = candidate("openai", "shared", "Shared model");
  const allOnly = candidate("anthropic", "outside", "Outside model");

  const selected = await runPicker([shared], [allOnly, shared], [..."shared", "\t", "\t", "\r"]);
  assert.deepEqual(selected.result, shared);
  assert.match(selected.renders[0] ?? "", /Scope: Scoped models \(Tab to switch\)/);
  assert.match(selected.renders[0] ?? "", /Tab scope/);
  assert.ok(selected.renders.some((render) => /Scope: All authenticated models/.test(render)));
  assert.match(selected.renders.at(-2) ?? "", /Scope: Scoped models/);
  assert.match(selected.renders.at(-2) ?? "", /shared/);

  const reset = await runPicker([shared], [allOnly, shared], ["\u001b"]);
  assert.equal(reset.result, undefined);
  assert.match(reset.renders[0] ?? "", /Scope: Scoped models/);
});

test("keeps the all scope when Tab has no scoped candidates", async () => {
  const allOnly = candidate("anthropic", "outside", "Outside model");

  const selected = await runPicker([], [allOnly], ["\t", "\r"]);
  assert.deepEqual(selected.result, allOnly);
  assert.match(selected.renders[0] ?? "", /Scope: All authenticated models/);
  assert.doesNotMatch(selected.renders[0] ?? "", /Tab to switch|Tab scope/);
  assert.match(selected.renders[1] ?? "", /Scope: All authenticated models/);
  assert.doesNotMatch(selected.renders[1] ?? "", /Tab to switch|Tab scope/);
});

test("keeps the picker open when Enter has no filtered candidate, renders empty state, and cancels with Ctrl-C", async () => {
  const onlyCandidate = candidate("openai", "gpt-5", "Codex");

  const cancelled = await runPicker([], [onlyCandidate], ["z", "\r", "\u0003"]);
  assert.equal(cancelled.result, undefined);
  assert.equal(cancelled.completionCount, 1);
  assert.match(cancelled.renders[1] ?? "", /No matching authenticated models\./);
  assert.match(cancelled.renders[2] ?? "", /No matching authenticated models\./);
});

test("searches provider, id, and model name, wraps arrow navigation, and handles Enter and cancel", async () => {
  const providerMatch = candidate("openai", "gpt-5", "Codex");
  const idMatch = candidate("anthropic", "claude-4", "Sonnet");
  const nameMatch = candidate("google", "gemini-3", "Flash Preview");
  const all = [providerMatch, idMatch, nameMatch];

  assert.deepEqual(filterModelCandidates(all, "openai"), [providerMatch]);
  assert.deepEqual(filterModelCandidates(all, "claude-4"), [idMatch]);
  assert.deepEqual(filterModelCandidates(all, "preview"), [nameMatch]);

  const wrapped = await runPicker([], all, ["\u001b[A", "\r"]);
  assert.deepEqual(wrapped.result, nameMatch);
  assert.match(wrapped.renders[0] ?? "", /thinking: off/);

  const cancelled = await runPicker([], all, ["\u001b"]);
  assert.equal(cancelled.result, undefined);
});
