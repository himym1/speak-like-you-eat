import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { AgentEndEvent, EntryRenderer, ExtensionAPI, ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";
import { writeConfigAtomically } from "../src/config.ts";
import speakLikeYouEat from "../src/index.ts";

type AgentMessage = AgentEndEvent["messages"][number];
type AgentEndHandler = (event: AgentEndEvent, ctx: ExtensionContext) => Promise<void>;
type Notification = { message: string; type: "info" | "warning" | "error" | undefined };
type AppendedEntry = { customType: string; data: unknown };

function createExtension(): {
  endAgent: (event: AgentEndEvent, ctx: ExtensionContext) => Promise<void>;
  appendedEntries: AppendedEntry[];
  renderer: EntryRenderer | undefined;
  sendMessageCalls: number;
} {
  let agentEndHandler: AgentEndHandler | undefined;
  let renderer: EntryRenderer | undefined;
  const appendedEntries: AppendedEntry[] = [];
  let sendMessageCalls = 0;
  const api = {
    on(event: string, handler: unknown) {
      if (event === "agent_end") {
        agentEndHandler = handler as AgentEndHandler;
      }
    },
    registerCommand() {},
    registerEntryRenderer(_type: string, registeredRenderer: EntryRenderer) {
      renderer = registeredRenderer;
    },
    appendEntry(customType: string, data: unknown) {
      appendedEntries.push({ customType, data });
    },
    sendMessage() {
      sendMessageCalls += 1;
    },
  } as unknown as ExtensionAPI;

  speakLikeYouEat(api);
  if (agentEndHandler === undefined) {
    throw new Error("SLYE did not register its agent-end handler");
  }

  return {
    endAgent: agentEndHandler,
    appendedEntries,
    renderer,
    get sendMessageCalls() {
      return sendMessageCalls;
    },
  };
}

function createContext(options: {
  cwd: string;
  branch: SessionEntry[];
  mode?: "tui" | "print";
  modelUsable?: boolean;
  throwWhenReadingBranch?: boolean;
}): { context: ExtensionContext; notifications: Notification[] } {
  const notifications: Notification[] = [];
  const model = { provider: "test", id: "model" };
  const context = {
    mode: options.mode ?? "tui",
    cwd: options.cwd,
    ui: {
      notify(message: string, type?: Notification["type"]) {
        notifications.push({ message, type });
      },
    },
    sessionManager: {
      getBranch() {
        if (options.throwWhenReadingBranch) {
          throw new Error("session unavailable");
        }
        return options.branch;
      },
    },
    modelRegistry: {
      find() {
        return options.modelUsable === false ? undefined : model;
      },
      hasConfiguredAuth() {
        return options.modelUsable !== false;
      },
    },
    isProjectTrusted() {
      return false;
    },
  } as unknown as ExtensionContext;

  return { context, notifications };
}

test("does not append without stub mode or outside the TUI", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const extension = createExtension();
  const previousStub = process.env.SLYE_STUB;
  t.after(() => restoreEnvironment("SLYE_STUB", previousStub));

  delete process.env.SLYE_STUB;
  await extension.endAgent({ type: "agent_end", messages: [target] }, createContext({ cwd: directory, branch }).context);
  process.env.SLYE_STUB = "1";
  await extension.endAgent(
    { type: "agent_end", messages: [target] },
    createContext({ cwd: directory, branch, mode: "print" }).context,
  );

  assert.deepEqual(extension.appendedEntries, []);
});

test("appends one display-only stub entry for an eligible configured response and ignores duplicates", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const extension = createExtension();
  const { context } = createContext({ cwd: directory, branch });
  const previousStub = process.env.SLYE_STUB;
  process.env.SLYE_STUB = "1";
  t.after(() => restoreEnvironment("SLYE_STUB", previousStub));

  const event = { type: "agent_end", messages: [target] } as AgentEndEvent;
  await extension.endAgent(event, context);
  await extension.endAgent(event, context);

  assert.equal(extension.appendedEntries.length, 1);
  assert.equal(extension.appendedEntries[0]?.customType, "slye.rewrite");
  assert.deepEqual(Object.keys(extension.appendedEntries[0]?.data as object), ["display"]);
  assert.equal(
    (extension.appendedEntries[0]?.data as { display: string }).display,
    `Development stub — no secondary model called.\n\n${target.content[0]?.text}`,
  );
  assert.equal(extension.sendMessageCalls, 0);
});

test("does not append for missing or invalid configuration", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const previousStub = process.env.SLYE_STUB;
  process.env.SLYE_STUB = "1";
  t.after(() => restoreEnvironment("SLYE_STUB", previousStub));

  const configPath = join(process.env.PI_CODING_AGENT_DIR!, "slye.json");
  await rm(configPath);
  const missingExtension = createExtension();
  await missingExtension.endAgent(
    { type: "agent_end", messages: [target] },
    createContext({ cwd: directory, branch }).context,
  );

  await writeFile(configPath, "{ invalid", "utf8");
  const invalidExtension = createExtension();
  await invalidExtension.endAgent(
    { type: "agent_end", messages: [target] },
    createContext({ cwd: directory, branch }).context,
  );

  assert.deepEqual(missingExtension.appendedEntries, []);
  assert.deepEqual(invalidExtension.appendedEntries, []);
});

test("does not append for disabled or unusable configuration", async (t) => {
  const directory = await setupConfiguredDirectory(t, false);
  const target = longAssistant();
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const previousStub = process.env.SLYE_STUB;
  process.env.SLYE_STUB = "1";
  t.after(() => restoreEnvironment("SLYE_STUB", previousStub));

  const disabledExtension = createExtension();
  await disabledExtension.endAgent(
    { type: "agent_end", messages: [target] },
    createContext({ cwd: directory, branch }).context,
  );

  await writeConfigAtomically(join(process.env.PI_CODING_AGENT_DIR!, "slye.json"), {
    enabled: true,
    model: { provider: "test", id: "model" },
  });
  const unusableExtension = createExtension();
  await unusableExtension.endAgent(
    { type: "agent_end", messages: [target] },
    createContext({ cwd: directory, branch, modelUsable: false }).context,
  );

  assert.deepEqual(disabledExtension.appendedEntries, []);
  assert.deepEqual(unusableExtension.appendedEntries, []);
});

test("fails open and warns once when stub processing unexpectedly fails", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const extension = createExtension();
  const { context, notifications } = createContext({
    cwd: directory,
    branch: [],
    throwWhenReadingBranch: true,
  });
  const previousStub = process.env.SLYE_STUB;
  process.env.SLYE_STUB = "1";
  t.after(() => restoreEnvironment("SLYE_STUB", previousStub));

  const event = { type: "agent_end", messages: [target] } as AgentEndEvent;
  await extension.endAgent(event, context);
  await extension.endAgent(event, context);

  assert.deepEqual(extension.appendedEntries, []);
  assert.deepEqual(notifications, [{ message: "SLYE could not prepare the development rewrite.", type: "warning" }]);
});

test("registers a safe persistent entry renderer", () => {
  const extension = createExtension();
  if (extension.renderer === undefined) {
    throw new Error("SLYE did not register its entry renderer");
  }
  const theme = {
    bg(_name: string, text: string) {
      return text;
    },
    bold(text: string) {
      return text;
    },
  };
  const entry = {
    type: "custom" as const,
    id: "saved",
    parentId: null,
    timestamp: "now",
    customType: "slye.rewrite",
    data: { display: "Development stub — no secondary model called.\n\nSaved Markdown" },
  };

  const restored = extension.renderer(entry, { expanded: false }, theme as never);
  assert.match(restored?.render(120).join("\n") ?? "", /🤌 Speak like you eat:/);
  assert.match(restored?.render(120).join("\n") ?? "", /Saved Markdown/);
  assert.equal(extension.appendedEntries.length, 0);
  assert.doesNotThrow(() => extension.renderer?.({ ...entry, data: { old: true } }, { expanded: false }, theme as never));
});

async function setupConfiguredDirectory(
  t: test.TestContext,
  enabled: boolean,
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "slye-display-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = join(directory, "agent");
  t.after(() => restoreEnvironment("PI_CODING_AGENT_DIR", previousAgentDir));
  await writeConfigAtomically(join(directory, "agent", "slye.json"), {
    enabled,
    model: { provider: "test", id: "model" },
  });
  return join(directory, "project");
}

function longAssistant(): AgentMessage & { content: Array<{ type: "text"; text: string }> } {
  return {
    role: "assistant",
    content: [{ type: "text", text: "complete response ".repeat(20) }],
    stopReason: "stop",
    timestamp: 2,
  } as AgentMessage & { content: Array<{ type: "text"; text: string }> };
}

function user(content: string): AgentMessage {
  return { role: "user", content, timestamp: 1 } as AgentMessage;
}

function entry(id: string, message: AgentMessage): SessionEntry {
  return { type: "message", id, parentId: null, timestamp: "now", message } as SessionEntry;
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
