import assert from "node:assert/strict";
import test from "node:test";
import { fingerprintMarkdown, fingerprintTextBlocks, transformOriginalMarkdown } from "../src/original-display.ts";

test("fingerprints rendered text blocks deterministically", () => {
  const fingerprints = fingerprintTextBlocks([
    { type: "text", text: "  Same response  " },
    { type: "thinking", thinking: "private" },
    { type: "text", text: "Same response" },
    { type: "text", text: "Second block" },
  ]);

  assert.deepEqual(fingerprints, [fingerprintMarkdown("Same response"), fingerprintMarkdown("Second block")]);
  assert.match(fingerprints[0] ?? "", /^[a-f0-9]{64}$/);
  assert.equal(fingerprintMarkdown(" repeated "), fingerprintMarkdown("repeated"));
});

test("hides only matching finalized assistant Markdown", () => {
  const original = "Original response";
  const hidden = new Set([fingerprintMarkdown(original)]);

  assert.equal(transformOriginalMarkdown(original, { messageType: "assistant", isStreaming: false }, hidden, true), "");
  assert.equal(
    transformOriginalMarkdown(original, { messageType: "assistant", isStreaming: true }, hidden, true),
    original,
  );
  assert.equal(
    transformOriginalMarkdown(original, { messageType: "user", isStreaming: false }, hidden, true),
    original,
  );
  assert.equal(
    transformOriginalMarkdown(original, { messageType: "assistant-thinking", isStreaming: false }, hidden, true),
    original,
  );
  assert.equal(
    transformOriginalMarkdown(original, { messageType: "assistant", isStreaming: false }, hidden, false),
    original,
  );
  assert.equal(
    transformOriginalMarkdown("Another response", { messageType: "assistant", isStreaming: false }, hidden, true),
    "Another response",
  );
});

test("identical Markdown has the same display identity", () => {
  const fingerprint = fingerprintMarkdown("Repeated response");
  const hidden = new Set([fingerprint]);

  assert.equal(
    transformOriginalMarkdown("Repeated response", { messageType: "assistant", isStreaming: false }, hidden, true),
    "",
  );
  assert.equal(
    transformOriginalMarkdown("Repeated response", { messageType: "assistant", isStreaming: false }, hidden, true),
    "",
  );
});
