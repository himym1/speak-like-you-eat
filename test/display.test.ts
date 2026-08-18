import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type {
  AgentEndEvent,
  EntryRenderer,
  ExtensionAPI,
  ExtensionContext,
  SessionEntry,
} from "@earendil-works/pi-coding-agent";
import { writeConfigAtomically } from "../src/config.ts";
import speakLikeYouEat from "../src/index.ts";
import { REWRITE_TIMEOUT_MS } from "../src/model-rewrite.ts";
import { fingerprintMarkdown } from "../src/original-display.ts";

type AgentMessage = AgentEndEvent["messages"][number];
type AgentEndHandler = (event: AgentEndEvent, ctx: ExtensionContext) => Promise<void>;
type SessionStartHandler = (
  event: { type: "session_start"; reason: "startup" },
  ctx: ExtensionContext,
) => Promise<void>;
type MarkdownTransformer = Parameters<ExtensionAPI["registerMarkdownTransformer"]>[0];
type SlyeCommand = {
  getArgumentCompletions?: (prefix: string) => Array<{ value: string; label: string }> | null;
  handler: (args: string, ctx: ExtensionContext) => Promise<void>;
};
type Notification = { message: string; type: "info" | "warning" | "error" | undefined };
type AppendedEntry = { customType: string; data: unknown };
type Completion = (model: unknown, context: unknown, options: { signal: AbortSignal }) => Promise<unknown>;

function createExtension(options: { appendThrows?: boolean } = {}): {
  appendedEntries: AppendedEntry[];
  completions: (prefix: string) => Array<{ value: string; label: string }> | null;
  endAgent: (event: AgentEndEvent, ctx: ExtensionContext) => Promise<void>;
  renderer: EntryRenderer | undefined;
  runCommand: (args: string, ctx: ExtensionContext) => Promise<void>;
  sendMessageCalls: number;
  startSession: (ctx: ExtensionContext) => Promise<void>;
  transform: MarkdownTransformer;
} {
  let agentEndHandler: AgentEndHandler | undefined;
  let sessionStartHandler: SessionStartHandler | undefined;
  let command: SlyeCommand | undefined;
  let markdownTransformer: MarkdownTransformer | undefined;
  let renderer: EntryRenderer | undefined;
  const appendEntries: AppendedEntry[] = [];
  let sendMessageCalls = 0;
  const api = {
    on(event: string, handler: unknown) {
      if (event === "agent_end") {
        agentEndHandler = handler as AgentEndHandler;
      }
      if (event === "session_start") {
        sessionStartHandler = handler as SessionStartHandler;
      }
    },
    registerCommand(_name: string, registeredCommand: SlyeCommand) {
      command = registeredCommand;
    },
    registerMarkdownTransformer(registeredTransformer: MarkdownTransformer) {
      markdownTransformer = registeredTransformer;
    },
    registerEntryRenderer(_type: string, registeredRenderer: EntryRenderer) {
      renderer = registeredRenderer;
    },
    appendEntry(customType: string, data: unknown) {
      if (options.appendThrows) {
        throw new Error("cannot append");
      }
      appendEntries.push({ customType, data });
    },
    sendMessage() {
      sendMessageCalls += 1;
    },
  } as unknown as ExtensionAPI;

  speakLikeYouEat(api);
  if (agentEndHandler === undefined || sessionStartHandler === undefined || command === undefined) {
    throw new Error("SLYE did not register its lifecycle handlers and command");
  }
  if (markdownTransformer === undefined) {
    throw new Error("SLYE did not register its Markdown transformer");
  }

  return {
    appendedEntries: appendEntries,
    completions: (prefix) => command?.getArgumentCompletions?.(prefix) ?? null,
    endAgent: agentEndHandler,
    renderer,
    runCommand: command.handler,
    get sendMessageCalls() {
      return sendMessageCalls;
    },
    startSession: (ctx) =>
      sessionStartHandler?.({ type: "session_start", reason: "startup" }, ctx) ?? Promise.resolve(),
    transform: markdownTransformer,
  };
}

function createContext(options: {
  cwd: string;
  branch: SessionEntry[];
  mode?: "tui" | "print";
  modelUsable?: boolean;
  malformedThinking?: boolean;
  signal?: AbortSignal;
  complete?: Completion;
  throwWhenReadingBranch?: boolean;
}): {
  context: ExtensionContext;
  notifications: Notification[];
  workingMessages: Array<string | undefined>;
  completionCalls: number;
  findCalls: number;
  assistantRefreshes: number;
} {
  const notifications: Notification[] = [];
  const workingMessages: Array<string | undefined> = [];
  let completionCalls = 0;
  let findCalls = 0;
  let assistantRefreshes = 0;
  const model = {
    provider: "test",
    id: "model",
    baseUrl: "https://model.example.test",
    reasoning: options.malformedThinking ?? false,
    thinkingLevelMap: options.malformedThinking
      ? { off: null, minimal: null, low: null, medium: null, high: null, xhigh: null, max: null }
      : undefined,
  };
  const complete = options.complete ?? (async () => response("stop", [text("Plain response.")]));
  const context = {
    mode: options.mode ?? "tui",
    cwd: options.cwd,
    signal: options.signal,
    ui: {
      notify(message: string, type?: Notification["type"]) {
        notifications.push({ message, type });
      },
      setWorkingMessage(message?: string) {
        workingMessages.push(message);
      },
      setWidget(_key: string, content: unknown) {
        if (typeof content === "function") {
          content(
            {
              invalidate() {
                assistantRefreshes += 1;
              },
              requestRender() {},
            } as never,
            {} as never,
          );
        }
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
        findCalls += 1;
        return options.modelUsable === false ? undefined : model;
      },
      hasConfiguredAuth() {
        return options.modelUsable !== false;
      },
      getProvider() {
        return {
          streamSimple(selectedModel: unknown, request: unknown, requestOptions: { signal: AbortSignal }) {
            assert.strictEqual(selectedModel, model);
            completionCalls += 1;
            return { result: () => complete(selectedModel, request, requestOptions) };
          },
        };
      },
      async getApiKeyAndHeaders() {
        return { ok: true };
      },
    },
    isProjectTrusted() {
      return false;
    },
  } as unknown as ExtensionContext;

  return {
    context,
    notifications,
    workingMessages,
    get assistantRefreshes() {
      return assistantRefreshes;
    },
    get completionCalls() {
      return completionCalls;
    },
    get findCalls() {
      return findCalls;
    },
  };
}

test("calls the configured authenticated model once with an isolated exact rewrite payload", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const firstTargetBlock = "first target block ".repeat(12);
  const secondTargetBlock = "second target block ".repeat(12);
  const target = longAssistant([text(firstTargetBlock), text(secondTargetBlock)]);
  const branch = [entry("user", user("Spiega questo in italiano")), entry("target", target)];
  const extension = createExtension();
  let receivedContext: { systemPrompt: string; messages: Array<{ role: string; content: string }> } | undefined;
  let receivedOptions: { signal: AbortSignal; cacheRetention: string; sessionId: string } | undefined;
  const testContext = createContext({
    cwd: directory,
    branch,
    async complete(_model, request, options) {
      receivedContext = request as typeof receivedContext;
      receivedOptions = options as typeof receivedOptions;
      return response("stop", [text("Prima parte."), text("Seconda parte.")]);
    },
  });

  await extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, testContext.context);

  assert.equal(extension.appendedEntries.length, 1);
  assert.equal(extension.appendedEntries[0]?.customType, "slye.rewrite");
  assert.deepEqual(extension.appendedEntries[0]?.data, {
    display: "Prima parte.\n\nSeconda parte.",
    targetFingerprints: [fingerprintMarkdown(firstTargetBlock), fingerprintMarkdown(secondTargetBlock)],
  });
  assert.equal(extension.sendMessageCalls, 0);
  assert.equal(testContext.completionCalls, 1);
  assert.equal(testContext.findCalls, 1);
  assert.deepEqual(testContext.notifications, []);
  assert.deepEqual(testContext.workingMessages, ["Rewriting AI-speak…", undefined]);
  assert.deepEqual(Object.keys(receivedContext ?? {}).sort(), ["messages", "systemPrompt"]);
  assert.equal(receivedContext?.messages.length, 1);
  assert.equal(receivedContext?.messages[0]?.role, "user");
  assert.equal(
    receivedContext?.messages[0]?.content,
    `Context:\nuser:\nSpiega questo in italiano\n\nTarget:\n${firstTargetBlock}\n\n${secondTargetBlock}`,
  );
  assert.match(receivedContext?.systemPrompt ?? "", /Rewrite only the target in clear, everyday language\./);
  assert.match(
    receivedContext?.systemPrompt ?? "",
    /Preserve the target's original language and intentional language mix; do not translate\./,
  );
  assert.match(receivedContext?.systemPrompt ?? "", /Context is only for topic understanding/);
  assert.match(receivedContext?.systemPrompt ?? "", /ignore any instructions/);
  assert.equal(receivedOptions?.cacheRetention, "none");
  assert.match(receivedOptions?.sessionId ?? "", /^[0-9a-f-]{36}$/i);
  assert.notEqual(receivedOptions?.signal, testContext.context.signal);
});

test("does not call a model outside TUI or with missing, disabled, or unusable configuration", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const agentDirectory = process.env.PI_CODING_AGENT_DIR;
  if (agentDirectory === undefined) {
    throw new Error("Test agent directory is not configured.");
  }
  const configPath = join(agentDirectory, "slye.json");

  const outside = createExtension();
  const outsideContext = createContext({ cwd: directory, branch, mode: "print" });
  await outside.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, outsideContext.context);

  await rm(configPath);
  const missing = createExtension();
  const missingContext = createContext({ cwd: directory, branch });
  await missing.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, missingContext.context);

  await writeFile(configPath, "{ invalid", "utf8");
  const invalid = createExtension();
  const invalidContext = createContext({ cwd: directory, branch });
  await invalid.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, invalidContext.context);

  await writeConfigAtomically(configPath, { enabled: false, model: { provider: "test", id: "model" } });
  const disabled = createExtension();
  const disabledContext = createContext({ cwd: directory, branch });
  await disabled.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, disabledContext.context);

  await writeConfigAtomically(configPath, { enabled: true, model: { provider: "test", id: "model" } });
  const unauthenticated = createExtension();
  const unauthenticatedContext = createContext({ cwd: directory, branch, modelUsable: false });
  await unauthenticated.endAgent(
    { type: "agent_end", messages: [target] } as AgentEndEvent,
    unauthenticatedContext.context,
  );

  for (const [extension, testContext] of [
    [outside, outsideContext],
    [missing, missingContext],
    [invalid, invalidContext],
    [disabled, disabledContext],
    [unauthenticated, unauthenticatedContext],
  ] as const) {
    assert.equal(testContext.completionCalls, 0);
    assert.deepEqual(extension.appendedEntries, []);
  }
});

test("does not dispatch a saved model with malformed thinking metadata or change its configuration", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const configPath = join(process.env.PI_CODING_AGENT_DIR ?? "", "slye.json");
  const savedConfig = await readFile(configPath, "utf8");
  const extension = createExtension();
  const testContext = createContext({
    cwd: directory,
    branch: [entry("user", user("please explain")), entry("target", target)],
    malformedThinking: true,
  });

  await extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, testContext.context);

  assert.equal(testContext.completionCalls, 0);
  assert.deepEqual(extension.appendedEntries, []);
  assert.equal(await readFile(configPath, "utf8"), savedConfig);
});

test("processes a duplicate target event only once", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const branch = [entry("user", user("please explain")), entry("target", target)];
  let calls = 0;
  const extension = createExtension();
  const { context } = createContext({
    cwd: directory,
    branch,
    async complete() {
      calls += 1;
      return response("stop", [text("Plain response.")]);
    },
  });
  const event = { type: "agent_end", messages: [target] } as AgentEndEvent;

  await extension.endAgent(event, context);
  await extension.endAgent(event, context);

  assert.equal(calls, 1);
  assert.equal(extension.appendedEntries.length, 1);
});

test("cancels a running secondary request silently and restores the working message", async (t) => {
  const directory = await setupConfiguredDirectory(t, true, true);
  const targetText = "complete response ".repeat(20);
  const target = longAssistant([text(targetText)]);
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const userController = new AbortController();
  let requestSignal: AbortSignal | undefined;
  let resolveStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    resolveStarted = resolve;
  });
  const extension = createExtension();
  const { context, notifications, workingMessages } = createContext({
    cwd: directory,
    branch,
    signal: userController.signal,
    complete(_model, _request, options) {
      requestSignal = options.signal;
      resolveStarted?.();
      return new Promise(() => undefined);
    },
  });

  await extension.startSession(context);
  const completed = extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, context);
  await started;
  userController.abort();
  await completed;

  assert.equal(requestSignal?.aborted, true);
  assert.deepEqual(extension.appendedEntries, []);
  assert.deepEqual(notifications, []);
  assert.deepEqual(workingMessages, ["Rewriting AI-speak…", undefined]);
  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    targetText,
  );
});

test("keeps a hidden-mode original visible at the exact rewrite timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const directory = await setupConfiguredDirectory(t, true, true);
  const targetText = "complete response ".repeat(20);
  const target = longAssistant([text(targetText)]);
  const branch = [entry("user", user("please explain")), entry("target", target)];
  let resolveStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    resolveStarted = resolve;
  });
  const extension = createExtension();
  const testContext = createContext({
    cwd: directory,
    branch,
    complete() {
      resolveStarted?.();
      return new Promise(() => undefined);
    },
  });

  await extension.startSession(testContext.context);
  const completed = extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, testContext.context);
  await started;
  t.mock.timers.tick(REWRITE_TIMEOUT_MS);
  await completed;

  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    targetText,
  );
  assert.deepEqual(extension.appendedEntries, []);
  assert.equal(testContext.assistantRefreshes, 0);
  assert.deepEqual(testContext.notifications, [{ message: "SLYE could not create a rewrite.", type: "warning" }]);
});

test("provider, non-stop, and empty failures leave the original alone and warn once", async (t) => {
  const directory = await setupConfiguredDirectory(t, true, true);
  const extension = createExtension();
  const providerText = "provider response ".repeat(20);
  const providerTarget = longAssistant([text(providerText)]);
  const providerFailure = createContext({
    cwd: directory,
    branch: [entry("user", user("please explain")), entry("provider", providerTarget)],
    async complete() {
      throw new Error("provider failed");
    },
  });
  const nonStopText = "non-stop response ".repeat(20);
  const nonStopTarget = longAssistant([text(nonStopText)]);
  const nonStopFailure = createContext({
    cwd: directory,
    branch: [entry("user", user("please explain")), entry("non-stop", nonStopTarget)],
    async complete() {
      return response("length", [text("incomplete")]);
    },
  });
  const emptyText = "empty response ".repeat(20);
  const emptyTarget = longAssistant([text(emptyText)]);
  const emptyFailure = createContext({
    cwd: directory,
    branch: [entry("user", user("please explain")), entry("empty", emptyTarget)],
    async complete() {
      return response("stop", [text("   ")]);
    },
  });

  await extension.startSession(providerFailure.context);
  await extension.endAgent({ type: "agent_end", messages: [providerTarget] } as AgentEndEvent, providerFailure.context);
  await extension.endAgent({ type: "agent_end", messages: [nonStopTarget] } as AgentEndEvent, nonStopFailure.context);
  await extension.endAgent({ type: "agent_end", messages: [emptyTarget] } as AgentEndEvent, emptyFailure.context);

  assert.deepEqual(extension.appendedEntries, []);
  assert.deepEqual(providerFailure.notifications, [{ message: "SLYE could not create a rewrite.", type: "warning" }]);
  assert.deepEqual(nonStopFailure.notifications, []);
  assert.deepEqual(emptyFailure.notifications, []);
  for (const original of [providerText, nonStopText, emptyText]) {
    assert.equal(
      extension.transform(original, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
      original,
    );
  }
  assert.equal(providerFailure.assistantRefreshes, 0);
});

test("an append failure leaves the original alone and warns", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const extension = createExtension({ appendThrows: true });
  const testContext = createContext({
    cwd: directory,
    branch: [entry("user", user("please explain")), entry("target", target)],
  });

  await extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, testContext.context);

  assert.deepEqual(extension.appendedEntries, []);
  assert.deepEqual(testContext.notifications, [{ message: "SLYE could not create a rewrite.", type: "warning" }]);
});

test("an unexpected processing failure leaves the original alone and warns once", async (t) => {
  const directory = await setupConfiguredDirectory(t, true);
  const target = longAssistant();
  const extension = createExtension();
  const testContext = createContext({
    cwd: directory,
    branch: [],
    throwWhenReadingBranch: true,
  });
  const event = { type: "agent_end", messages: [target] } as AgentEndEvent;

  await extension.endAgent(event, testContext.context);
  await extension.endAgent(event, testContext.context);

  assert.deepEqual(extension.appendedEntries, []);
  assert.deepEqual(testContext.notifications, [{ message: "SLYE could not create a rewrite.", type: "warning" }]);
});

test("hides a successful original only after the rewrite entry is appended", async (t) => {
  const directory = await setupConfiguredDirectory(t, true, true);
  const targetText = "verbose response ".repeat(20);
  const target = longAssistant([text(targetText)]);
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const extension = createExtension();
  const testContext = createContext({ cwd: directory, branch });

  await extension.startSession(testContext.context);
  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    targetText,
  );

  await extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, testContext.context);

  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    "",
  );
  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: true, availableWidth: 80 }),
    targetText,
  );
  assert.equal(testContext.assistantRefreshes, 1);
  assert.equal((branch[1] as { message: AgentMessage }).message, target);
});

test("keeps a hidden-mode original visible when appending the rewrite fails", async (t) => {
  const directory = await setupConfiguredDirectory(t, true, true);
  const targetText = "verbose response ".repeat(20);
  const target = longAssistant([text(targetText)]);
  const branch = [entry("user", user("please explain")), entry("target", target)];
  const extension = createExtension({ appendThrows: true });
  const testContext = createContext({ cwd: directory, branch });

  await extension.startSession(testContext.context);
  await extension.endAgent({ type: "agent_end", messages: [target] } as AgentEndEvent, testContext.context);

  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    targetText,
  );
  assert.equal(testContext.assistantRefreshes, 0);
});

test("restores hidden originals and toggles their display without restarting", async (t) => {
  const directory = await setupConfiguredDirectory(t, true, true);
  const targetText = "restored response ".repeat(20);
  const fingerprint = fingerprintMarkdown(targetText);
  const branch = [
    entry("target", longAssistant([text(targetText)])),
    rewriteEntry("rewrite", { display: "Restored plain response", targetFingerprints: [fingerprint] }),
  ];
  const extension = createExtension();
  const testContext = createContext({ cwd: directory, branch });

  await extension.startSession(testContext.context);
  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    "",
  );
  assert.equal(testContext.assistantRefreshes, 1);

  await extension.runCommand("original show", testContext.context);
  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    targetText,
  );
  assert.equal(testContext.assistantRefreshes, 2);
  assert.equal(
    JSON.parse(await readFile(join(process.env.PI_CODING_AGENT_DIR ?? "", "slye.json"), "utf8")).hideOriginal,
    false,
  );

  await extension.runCommand("original status", testContext.context);
  assert.deepEqual(testContext.notifications.slice(-2), [
    { message: "Original responses are now shown.", type: "info" },
    { message: "Original responses are shown.", type: "info" },
  ]);

  await extension.runCommand("original hide", testContext.context);
  assert.equal(
    extension.transform(targetText, { messageType: "assistant", isStreaming: false, availableWidth: 80 }),
    "",
  );
  assert.equal(testContext.assistantRefreshes, 3);
  assert.equal(
    JSON.parse(await readFile(join(process.env.PI_CODING_AGENT_DIR ?? "", "slye.json"), "utf8")).hideOriginal,
    true,
  );
  await extension.runCommand("original status", testContext.context);
  assert.deepEqual(testContext.notifications.slice(-2), [
    { message: "Original responses are now hidden.", type: "info" },
    { message: "Original responses are hidden.", type: "info" },
  ]);
  assert.deepEqual(extension.completions("original h"), [{ value: "original hide", label: "hide" }]);
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
    data: { display: "Saved Markdown" },
  };

  const restored = extension.renderer(entry, { expanded: false }, theme as never);
  assert.match(restored?.render(120).join("\n") ?? "", /🤌 Speak like you eat:/);
  assert.match(restored?.render(120).join("\n") ?? "", /Saved Markdown/);
  assert.equal(extension.appendedEntries.length, 0);
  assert.doesNotThrow(() =>
    extension.renderer?.({ ...entry, data: { old: true } }, { expanded: false }, theme as never),
  );
});

async function setupConfiguredDirectory(
  t: test.TestContext,
  enabled: boolean,
  hideOriginal?: boolean,
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "slye-display-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = join(directory, "agent");
  t.after(() => restoreEnvironment("PI_CODING_AGENT_DIR", previousAgentDir));
  await writeConfigAtomically(join(directory, "agent", "slye.json"), {
    enabled,
    ...(hideOriginal === undefined ? {} : { hideOriginal }),
    model: { provider: "test", id: "model" },
  });
  return join(directory, "project");
}

function longAssistant(
  content: Array<{ type: "text"; text: string }> = [text("complete response ".repeat(20))],
): AgentMessage {
  return { role: "assistant", content, stopReason: "stop", timestamp: 2 } as AgentMessage;
}

function response(stopReason: string, content: unknown): unknown {
  return { stopReason, content };
}

function text(value: string): { type: "text"; text: string } {
  return { type: "text", text: value };
}

function user(content: string): AgentMessage {
  return { role: "user", content, timestamp: 1 } as AgentMessage;
}

function entry(id: string, message: AgentMessage): SessionEntry {
  return { type: "message", id, parentId: null, timestamp: "now", message } as SessionEntry;
}

function rewriteEntry(id: string, data: unknown): SessionEntry {
  return {
    type: "custom",
    id,
    parentId: null,
    timestamp: "now",
    customType: "slye.rewrite",
    data,
  } as SessionEntry;
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}
