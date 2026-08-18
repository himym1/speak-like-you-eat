---
id: decision-3
title: Hide originals with display-only fingerprints
date: '2026-08-18 07:21'
status: accepted
---
## Context

SLYE keeps the original Assistant response in the Session and appends a display-only rewrite card. Showing both responses can double transcript clutter, but replacing the stored message would make later model turns and memory systems depend on a lossy rewrite. Pi's display-only Markdown transformer preserves the stored message but exposes text and rendering state, not a stable message ID.

## Decision

Add an opt-in `hideOriginal` setting, defaulting to `false`. Persist SHA-256 fingerprints of each non-empty target text block with the rewrite entry. After the rewrite entry is appended successfully, hide matching finalized Assistant Markdown through `registerMarkdownTransformer`. Keep streaming content visible. Restore fingerprints from the active branch on Session start and expose `/slye original hide|show|status`.

Use a transient empty extension widget to obtain Pi's public TUI handle without taking editor focus. Its factory invalidates the TUI, then removes the widget in the next microtask; both widget updates request rendering. Do not mutate themes, thinking labels, tool expansion, the original Assistant message, or LLM context.

## Consequences

- The original response remains authoritative in the Session, model context, Magic Context, exports, and recovery paths.
- Cancellation, timeout, provider failure, invalid output, or append failure leaves the original visible.
- Hiding is display-only and reversible without restarting Pi.
- Fingerprints use the same leading/trailing whitespace trim Pi applies before rendering. Text blocks that differ only in surrounding whitespace share an identity and can be hidden together.
- A Markdown transformer loaded before SLYE can prevent matching if it changes the text first.
- Old rewrite entries without fingerprints remain visible until rewritten by this fork.
