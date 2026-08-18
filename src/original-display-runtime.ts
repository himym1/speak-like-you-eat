import type { ExtensionAPI, ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { isMarkdownFingerprint, transformOriginalMarkdown } from "./original-display.ts";

export type RewriteEntryData = {
  display: string;
  targetFingerprints?: string[];
};

export type OriginalDisplayRuntime = {
  record(targetFingerprints: readonly string[], ctx: ExtensionContext): Promise<void>;
  restore(entries: readonly SessionEntry[], hideOriginal: boolean, ctx: ExtensionContext): Promise<void>;
  setHidden(hideOriginal: boolean, ctx: ExtensionContext): Promise<void>;
};

export function createOriginalDisplayRuntime(pi: ExtensionAPI, rewriteEntryType: string): OriginalDisplayRuntime {
  const hiddenFingerprints = new Set<string>();
  let hideOriginal = false;

  pi.registerMarkdownTransformer((markdown, context) =>
    transformOriginalMarkdown(markdown, context, hiddenFingerprints, hideOriginal),
  );

  return {
    async record(targetFingerprints, ctx) {
      addFingerprints(hiddenFingerprints, targetFingerprints);
      if (hideOriginal) {
        await refreshAssistantMessages(ctx);
      }
    },
    async restore(entries, hidden, ctx) {
      const oldStateCouldHideMessages = hideOriginal && hiddenFingerprints.size > 0;
      hiddenFingerprints.clear();
      for (const entry of entries) {
        if (entry.type !== "custom" || entry.customType !== rewriteEntryType) {
          continue;
        }
        const data = parseRewriteEntryData(entry.data);
        if (data?.targetFingerprints !== undefined) {
          addFingerprints(hiddenFingerprints, data.targetFingerprints);
        }
      }
      hideOriginal = hidden;
      if (oldStateCouldHideMessages || (hideOriginal && hiddenFingerprints.size > 0)) {
        await refreshAssistantMessages(ctx);
      }
    },
    async setHidden(hidden, ctx) {
      if (hideOriginal === hidden) {
        return;
      }
      hideOriginal = hidden;
      await refreshAssistantMessages(ctx);
    },
  };
}

export function parseRewriteEntryData(data: unknown): RewriteEntryData | undefined {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return undefined;
  }
  if (!("display" in data) || typeof data.display !== "string") {
    return undefined;
  }

  const targetFingerprints = parseFingerprints("targetFingerprints" in data ? data.targetFingerprints : undefined);
  return targetFingerprints === undefined ? { display: data.display } : { display: data.display, targetFingerprints };
}

function parseFingerprints(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every(isMarkdownFingerprint)) {
    return undefined;
  }
  return [...new Set(value)];
}

function addFingerprints(target: Set<string>, fingerprints: readonly string[]): void {
  for (const fingerprint of fingerprints) {
    if (isMarkdownFingerprint(fingerprint)) {
      target.add(fingerprint);
    }
  }
}

async function refreshAssistantMessages(ctx: ExtensionContext): Promise<void> {
  await new Promise<void>((resolve) => {
    ctx.ui.setWidget("slye.original-display-refresh", (tui) => {
      tui.invalidate();
      queueMicrotask(() => {
        ctx.ui.setWidget("slye.original-display-refresh", undefined);
        resolve();
      });
      return new Text("");
    });
  });
}
