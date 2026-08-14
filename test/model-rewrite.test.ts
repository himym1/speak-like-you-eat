import assert from "node:assert/strict";
import test from "node:test";
import { REWRITE_TIMEOUT_MS, buildRewriteContext, completeRewrite } from "../src/model-rewrite.ts";

const request = {
  context: [
    { role: "user" as const, text: "Spiega in italiano." },
    { role: "assistant" as const, text: "Prior assistant prose." },
  ],
  target: "Target **Markdown** with `command` and https://example.test/path.",
};

test("builds one isolated user message with labelled context and the complete target", () => {
  const context = buildRewriteContext(request);

  assert.equal(context.messages.length, 1);
  assert.equal(context.messages[0]?.role, "user");
  assert.match(context.messages[0]?.content ?? "", /user:\nSpiega in italiano\./);
  assert.match(context.messages[0]?.content ?? "", /assistant:\nPrior assistant prose\./);
  assert.match(context.messages[0]?.content ?? "", /Target \*\*Markdown\*\* with `command` and https:\/\/example\.test\/path\./);
  assert.match(context.systemPrompt, /Copy fenced code blocks unchanged\./);
  assert.match(context.systemPrompt, /Use short, direct sentences and everyday words\./);
  assert.match(context.systemPrompt, /Output only the rewrite/);
});

test("accepts only normal-stop responses with non-blank text blocks", async () => {
  const successful = await completeRewrite(request, undefined, async () => ({
    stopReason: "stop",
    content: [text("First."), { type: "thinking", thinking: "ignored" }, text("Second.")],
  }));
  assert.deepEqual(successful, { kind: "success", display: "First.\n\nSecond." });

  for (const response of [
    { stopReason: "length", content: [text("Incomplete")] },
    { stopReason: "toolUse", content: [text("Tool request")] },
    { stopReason: "stop", content: [text("  ")] },
    { stopReason: "stop", content: [{ type: "thinking", thinking: "Only thinking" }] },
  ]) {
    assert.deepEqual(await completeRewrite(request, undefined, async () => response), { kind: "failed" });
  }
});

test("uses the user signal to cancel the local request without waiting for provider settlement", async () => {
  const userController = new AbortController();
  let requestSignal: AbortSignal | undefined;
  const result = completeRewrite(request, userController.signal, async (_context, options) => {
    requestSignal = options.signal;
    return new Promise(() => undefined);
  });

  userController.abort();

  assert.deepEqual(await result, { kind: "cancelled" });
  assert.equal(requestSignal?.aborted, true);
});

test("fails at the exact 45-second deadline and aborts a provider that does not settle", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let requestSignal: AbortSignal | undefined;
  const result = completeRewrite(request, undefined, async (_context, options) => {
    requestSignal = options.signal;
    return new Promise(() => undefined);
  });

  t.mock.timers.tick(REWRITE_TIMEOUT_MS - 1);
  await Promise.resolve();
  assert.equal(requestSignal?.aborted, false);
  t.mock.timers.tick(1);

  assert.deepEqual(await result, { kind: "failed" });
  assert.equal(requestSignal?.aborted, true);
});

function text(value: string): { type: "text"; text: string } {
  return { type: "text", text: value };
}
