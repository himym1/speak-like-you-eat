import { createHash } from "node:crypto";

export type MarkdownTransformContext = {
  messageType: "user" | "assistant" | "assistant-thinking";
  isStreaming: boolean;
};

export function fingerprintMarkdown(markdown: string): string {
  return createHash("sha256").update(markdown.trim()).digest("hex");
}

export function isMarkdownFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function fingerprintTextBlocks(content: unknown): string[] {
  const blocks = typeof content === "string" ? [content] : Array.isArray(content) ? content : [];
  const fingerprints = new Set<string>();

  for (const block of blocks) {
    const text = getText(block);
    if (text !== undefined && text.trim() !== "") {
      fingerprints.add(fingerprintMarkdown(text));
    }
  }

  return [...fingerprints];
}

export function transformOriginalMarkdown(
  markdown: string,
  context: MarkdownTransformContext,
  hiddenFingerprints: ReadonlySet<string>,
  hideOriginal: boolean,
): string {
  if (!hideOriginal || context.messageType !== "assistant" || context.isStreaming) {
    return markdown;
  }

  return hiddenFingerprints.has(fingerprintMarkdown(markdown)) ? "" : markdown;
}

function getText(block: unknown): string | undefined {
  if (typeof block === "string") {
    return block;
  }
  if (
    typeof block === "object" &&
    block !== null &&
    "type" in block &&
    block.type === "text" &&
    "text" in block &&
    typeof block.text === "string"
  ) {
    return block.text;
  }
  return undefined;
}
