import assert from "node:assert/strict";
import test from "node:test";
import type { ExtensionAPI, ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";
import { fingerprintMarkdown } from "../src/original-display.ts";
import { createOriginalDisplayRuntime, parseRewriteEntryData } from "../src/original-display-runtime.ts";

test("restores persisted fingerprints and refreshes hidden originals", async () => {
  let transformer: Parameters<ExtensionAPI["registerMarkdownTransformer"]>[0] | undefined;
  const api = {
    registerMarkdownTransformer(value: typeof transformer) {
      transformer = value;
    },
  } as unknown as ExtensionAPI;
  const refreshes: Array<string | undefined> = [];
  const ctx = contextWithRefresh(() => refreshes.push(undefined));
  const original = "Original response";
  const fingerprint = fingerprintMarkdown(original);
  const entries = [rewriteEntry({ display: "Plain response", targetFingerprints: [fingerprint, fingerprint] })];
  const runtime = createOriginalDisplayRuntime(api, "slye.rewrite");

  await runtime.restore(entries, true, ctx);

  assert.equal(transformer?.(original, { messageType: "assistant", isStreaming: false, availableWidth: 80 }), "");
  assert.equal(transformer?.(original, { messageType: "assistant", isStreaming: true, availableWidth: 80 }), original);
  assert.deepEqual(refreshes, [undefined]);

  await runtime.setHidden(false, ctx);
  assert.equal(transformer?.(original, { messageType: "assistant", isStreaming: false, availableWidth: 80 }), original);
  assert.deepEqual(refreshes, [undefined, undefined]);

  await runtime.setHidden(true, ctx);
  assert.equal(transformer?.(original, { messageType: "assistant", isStreaming: false, availableWidth: 80 }), "");
  await runtime.restore([], false, ctx);
  assert.equal(transformer?.(original, { messageType: "assistant", isStreaming: false, availableWidth: 80 }), original);
  assert.deepEqual(refreshes, [undefined, undefined, undefined, undefined]);
});

test("records only valid fingerprints and ignores legacy or malformed entry data", async () => {
  let transformer: Parameters<ExtensionAPI["registerMarkdownTransformer"]>[0] | undefined;
  const api = {
    registerMarkdownTransformer(value: typeof transformer) {
      transformer = value;
    },
  } as unknown as ExtensionAPI;
  let refreshCount = 0;
  const ctx = contextWithRefresh(() => {
    refreshCount += 1;
  });
  const runtime = createOriginalDisplayRuntime(api, "slye.rewrite");
  const original = "New original";
  const fingerprint = fingerprintMarkdown(original);

  await runtime.restore(
    [rewriteEntry({ display: "Legacy" }), rewriteEntry({ display: "Invalid", targetFingerprints: ["bad"] })],
    true,
    ctx,
  );
  await runtime.record(["bad", fingerprint], ctx);

  assert.equal(transformer?.(original, { messageType: "assistant", isStreaming: false, availableWidth: 80 }), "");
  assert.equal(refreshCount, 1);
  assert.deepEqual(parseRewriteEntryData({ display: "Legacy" }), { display: "Legacy" });
  assert.deepEqual(parseRewriteEntryData({ display: "Invalid", targetFingerprints: ["bad"] }), {
    display: "Invalid",
  });
});

function contextWithRefresh(onRefresh: () => void): ExtensionContext {
  return {
    ui: {
      setWidget(_key: string, content: unknown) {
        if (typeof content === "function") {
          content({ invalidate: onRefresh, requestRender() {} } as never, {} as never);
        }
      },
    },
  } as unknown as ExtensionContext;
}

function rewriteEntry(data: unknown): SessionEntry {
  return {
    type: "custom",
    id: crypto.randomUUID(),
    parentId: null,
    timestamp: "now",
    customType: "slye.rewrite",
    data,
  } as SessionEntry;
}
