import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadEffectiveConfig, parseConfig, readConfig, writeConfigAtomically } from "../src/config.ts";

const enabledConfig = {
  enabled: true,
  model: { provider: "openai", id: "gpt-5" },
} as const;

test("validates the strict enabled and disabled configuration schema", () => {
  assert.deepEqual(parseConfig(enabledConfig), enabledConfig);
  assert.deepEqual(parseConfig({ enabled: false }), { enabled: false });
  assert.deepEqual(parseConfig({ enabled: false, model: enabledConfig.model }), {
    enabled: false,
    model: enabledConfig.model,
  });
  assert.deepEqual(parseConfig({ ...enabledConfig, hideOriginal: true }), {
    enabled: true,
    hideOriginal: true,
    model: enabledConfig.model,
  });
  assert.deepEqual(parseConfig({ enabled: false, hideOriginal: false }), {
    enabled: false,
    hideOriginal: false,
  });

  for (const invalid of [
    null,
    [],
    "config",
    { enabled: "true", model: enabledConfig.model },
    { enabled: true },
    { enabled: false, extra: true },
    { enabled: false, hideOriginal: "yes" },
    { enabled: true, model: { provider: "", id: "gpt-5" } },
    { enabled: true, model: { provider: "openai", id: " " } },
    { enabled: true, model: { provider: "openai", id: "gpt-5", extra: true } },
  ]) {
    assert.equal(parseConfig(invalid), undefined);
  }
});

test("uses trusted project configuration as a complete override", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "slye-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const globalPath = join(directory, "global.json");
  const projectPath = join(directory, "project.json");
  await writeConfigAtomically(globalPath, { enabled: false });
  await writeConfigAtomically(projectPath, enabledConfig);

  assert.deepEqual(await loadEffectiveConfig(globalPath, projectPath, true), {
    kind: "valid",
    path: projectPath,
    scope: "project",
    config: enabledConfig,
  });
  assert.deepEqual(await loadEffectiveConfig(globalPath, projectPath, false), {
    kind: "valid",
    path: globalPath,
    scope: "global",
    config: { enabled: false },
  });
});

test("an invalid trusted project configuration blocks global fallback", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "slye-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const globalPath = join(directory, "global.json");
  const projectPath = join(directory, "project.json");
  await writeConfigAtomically(globalPath, enabledConfig);
  await writeFile(projectPath, "{ not json", "utf8");

  assert.deepEqual(await loadEffectiveConfig(globalPath, projectPath, true), {
    kind: "invalid",
    path: projectPath,
  });
});

test("writes readable configuration atomically and retains a disabled model", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "slye-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const path = join(directory, ".pi", "slye.json");
  const config = { enabled: false, model: enabledConfig.model } as const;
  await writeConfigAtomically(path, config);

  assert.equal(
    await readFile(path, "utf8"),
    '{\n  "enabled": false,\n  "model": {\n    "provider": "openai",\n    "id": "gpt-5"\n  }\n}\n',
  );
  assert.deepEqual(await readConfig(path), { kind: "valid", path, config });
});

test("writes and reads the optional original-display preference", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "slye-config-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const path = join(directory, ".pi", "slye.json");
  const config = { enabled: true, hideOriginal: true, model: enabledConfig.model } as const;
  await writeConfigAtomically(path, config);

  assert.deepEqual(await readConfig(path), { kind: "valid", path, config });
  assert.match(await readFile(path, "utf8"), /"hideOriginal": true/);
});
