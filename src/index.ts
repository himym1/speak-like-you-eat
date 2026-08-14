import {
  CONFIG_DIR_NAME,
  getAgentDir,
  type ExtensionAPI,
  type ExtensionCommandContext,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import {
  CONFIG_FILENAME,
  loadEffectiveConfig,
  readConfig,
  writeConfigAtomically,
  type EffectiveConfig,
  type ModelReference,
  type SlyeConfig,
} from "./config.ts";

const USAGE = "Usage: /slye model|on|off";
const MODEL_SCOPE_ALL = "All projects";
const MODEL_SCOPE_PROJECT = "This project only";

type SlyePaths = {
  global: string;
  project: string;
};

type PiModel = ReturnType<ExtensionContext["modelRegistry"]["getAvailable"]>[number];

export type ModelCandidate = {
  provider: string;
  id: string;
  label: string;
};

export function selectModelCandidates(
  scopedModels: readonly { model: PiModel }[],
  availableModels: readonly PiModel[],
  hasConfiguredAuth: (model: PiModel) => boolean,
): ModelCandidate[] {
  const models = scopedModels.length === 0 ? availableModels : scopedModels.map(({ model }) => model);
  const candidates = new Map<string, ModelCandidate>();

  for (const model of models) {
    if (!hasConfiguredAuth(model)) {
      continue;
    }

    const key = `${model.provider}\u0000${model.id}`;
    if (!candidates.has(key)) {
      candidates.set(key, {
        provider: model.provider,
        id: model.id,
        label: formatModel(model),
      });
    }
  }

  return [...candidates.values()].sort((left, right) => {
    if (left.provider !== right.provider) {
      return left.provider < right.provider ? -1 : 1;
    }
    if (left.id === right.id) {
      return 0;
    }
    return left.id < right.id ? -1 : 1;
  });
}

export default function speakLikeYouEat(pi: ExtensionAPI): void {
  let hasShownStartupWarning = false;

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") {
      return;
    }

    const effectiveConfig = await loadConfig(ctx);
    if (effectiveConfig.kind === "unconfigured") {
      notifyStartupWarning(ctx, "SLYE is not configured. Run /slye model.");
      return;
    }
    if (effectiveConfig.kind === "invalid") {
      notifyStartupWarning(ctx, `SLYE configuration is invalid at ${effectiveConfig.path}. Fix it or run /slye model.`);
      return;
    }
    if (!effectiveConfig.config.enabled) {
      return;
    }
    if (!hasUsableModel(ctx, effectiveConfig.config.model)) {
      notifyStartupWarning(ctx, "SLYE's selected model is unavailable. Run /slye model.");
    }
  });

  pi.registerCommand("slye", {
    description: "Configure Speak like you eat",
    getArgumentCompletions: (prefix) => {
      const commands = ["model", "on", "off"];
      const matches = commands.filter((command) => command.startsWith(prefix));
      return matches.length === 0 ? null : matches.map((value) => ({ value, label: value }));
    },
    handler: async (args, ctx) => {
      if (ctx.mode !== "tui") {
        return;
      }

      const command = args.trim();
      if (command === "model") {
        await chooseAndSaveModel(ctx);
        return;
      }
      if (command === "off") {
        await turnOff(ctx);
        return;
      }
      if (command === "on") {
        await turnOn(ctx);
        return;
      }

      ctx.ui.notify(USAGE, "info");
    },
  });

  function notifyStartupWarning(ctx: ExtensionContext, message: string): void {
    if (hasShownStartupWarning) {
      return;
    }

    hasShownStartupWarning = true;
    ctx.ui.notify(message, "warning");
  }
}

async function chooseAndSaveModel(ctx: ExtensionCommandContext): Promise<void> {
  const candidates = selectModelCandidates(
    ctx.scopedModels,
    ctx.modelRegistry.getAvailable(),
    (model) => ctx.modelRegistry.hasConfiguredAuth(model),
  );
  if (candidates.length === 0) {
    ctx.ui.notify("No authenticated models are available for SLYE.", "warning");
    return;
  }

  const selectedLabel = await ctx.ui.select("Choose a SLYE model", candidates.map((candidate) => candidate.label));
  if (selectedLabel === undefined) {
    return;
  }

  const selected = candidates.find((candidate) => candidate.label === selectedLabel);
  if (selected === undefined) {
    return;
  }

  const projectTrusted = ctx.isProjectTrusted();
  const scopes = projectTrusted ? [MODEL_SCOPE_ALL, MODEL_SCOPE_PROJECT] : [MODEL_SCOPE_ALL];
  const selectedScope = await ctx.ui.select("Save SLYE model for", scopes);
  if (selectedScope === undefined) {
    return;
  }

  const config: SlyeConfig = {
    enabled: true,
    model: { provider: selected.provider, id: selected.id },
  };
  const paths = getConfigPaths(ctx);

  if (selectedScope === MODEL_SCOPE_PROJECT) {
    await saveEnabledConfig(ctx, paths.project, config.model, MODEL_SCOPE_PROJECT);
    return;
  }

  if (selectedScope === MODEL_SCOPE_ALL) {
    await saveGlobalConfig(ctx, paths, projectTrusted, config, selected.label);
  }
}

async function saveGlobalConfig(
  ctx: ExtensionCommandContext,
  paths: SlyePaths,
  projectTrusted: boolean,
  config: SlyeConfig,
  label: string,
): Promise<void> {
  let removeProjectConfig = false;
  if (projectTrusted) {
    const projectConfig = await readConfig(paths.project);
    if (projectConfig.kind !== "missing") {
      const confirmed = await ctx.ui.confirm(
        "Project SLYE configuration",
        "The project file takes precedence over and blocks the global setting in this project. Remove it and use the global setting?",
      );
      if (!confirmed) {
        return;
      }
      removeProjectConfig = true;
    }
  }

  try {
    await writeConfigAtomically(paths.global, config);
  } catch {
    ctx.ui.notify("Could not save SLYE configuration.", "warning");
    return;
  }

  if (removeProjectConfig) {
    try {
      await rm(paths.project);
    } catch {
      ctx.ui.notify(
        "Global SLYE configuration was saved, but the project file could not be removed. The project file still takes precedence in this project.",
        "warning",
      );
      return;
    }
  }

  ctx.ui.notify(`SLYE enabled with ${label} for All projects.`, "info");
}

async function turnOff(ctx: ExtensionCommandContext): Promise<void> {
  const effectiveConfig = await loadConfig(ctx);
  if (effectiveConfig.kind === "invalid") {
    ctx.ui.notify(`SLYE configuration is invalid at ${effectiveConfig.path}. It was not changed.`, "warning");
    return;
  }
  const path = effectiveConfig.kind === "valid" ? effectiveConfig.path : getConfigPaths(ctx).global;
  const model = effectiveConfig.kind === "valid" ? effectiveConfig.config.model : undefined;
  const config: SlyeConfig = model === undefined ? { enabled: false } : { enabled: false, model };

  try {
    await writeConfigAtomically(path, config);
  } catch {
    ctx.ui.notify("Could not save SLYE configuration.", "warning");
    return;
  }

  ctx.ui.notify("SLYE is off.", "info");
}

async function turnOn(ctx: ExtensionCommandContext): Promise<void> {
  const effectiveConfig = await loadConfig(ctx);
  if (effectiveConfig.kind === "invalid") {
    ctx.ui.notify(`SLYE configuration is invalid at ${effectiveConfig.path}. Repair it or run /slye model.`, "warning");
    return;
  }
  if (effectiveConfig.kind === "valid" && effectiveConfig.config.model !== undefined) {
    const model = effectiveConfig.config.model;
    if (hasUsableModel(ctx, model)) {
      const scope = effectiveConfig.scope === "project" ? MODEL_SCOPE_PROJECT : MODEL_SCOPE_ALL;
      await saveEnabledConfig(ctx, effectiveConfig.path, model, scope);
      return;
    }
  }

  await chooseAndSaveModel(ctx);
}

async function saveEnabledConfig(
  ctx: ExtensionCommandContext,
  path: string,
  model: ModelReference,
  scope: string,
): Promise<void> {
  try {
    await writeConfigAtomically(path, { enabled: true, model });
  } catch {
    ctx.ui.notify("Could not save SLYE configuration.", "warning");
    return;
  }

  ctx.ui.notify(`SLYE enabled with ${formatModel(model)} for ${scope}.`, "info");
}

async function loadConfig(ctx: ExtensionContext): Promise<EffectiveConfig> {
  const paths = getConfigPaths(ctx);
  return loadEffectiveConfig(paths.global, paths.project, ctx.isProjectTrusted());
}

function getConfigPaths(ctx: ExtensionContext): SlyePaths {
  return {
    global: join(getAgentDir(), CONFIG_FILENAME),
    project: join(ctx.cwd, CONFIG_DIR_NAME, CONFIG_FILENAME),
  };
}

function hasUsableModel(ctx: ExtensionContext, reference: ModelReference): boolean {
  const model = ctx.modelRegistry.find(reference.provider, reference.id);
  return model !== undefined && ctx.modelRegistry.hasConfiguredAuth(model);
}

function formatModel(model: ModelReference): string {
  return `${model.provider} / ${model.id}`;
}
