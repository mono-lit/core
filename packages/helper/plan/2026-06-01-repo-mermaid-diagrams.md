# Mermaid diagrams for the repo concept docs

**Date:** 2026-06-01
**Area:** `demo/vitepress/docs/repo`

## Problem

The Host/Remote concept pages were text-only. The architecture, the sync flow, and
the provide/inject data flow are all easier to grasp as diagrams. `mermaid` and
`vitepress-plugin-mermaid` were already in `demo/vitepress/package.json` (plus the
`@braintree/sanitize-url` pnpm override), but the plugin was never wired into the
VitePress config, so ` ```mermaid ` fences rendered as plain code.

## Change

1. **Wire the plugin** — `docs/.vitepress/config.ts` now exports
   `withMermaid(defineConfig({ ... }))` (import added from
   `vitepress-plugin-mermaid`). Nothing else in the config changed.
2. **getting-started.md** — added a `graph TD` under `## Visual Example`: one Host
   (owning the shell) fanning out to five finance Remotes (Budgeting, Invoicing,
   Payroll, General Ledger, Financial Reports). The folder-tree blocks are kept
   below it as structural detail.
3. **sync.md** — added a horizontal `graph LR` after the intro showing the
   bidirectional flow through GitHub: Remote → GitHub → Host (`pnpm mono:sync`,
   gets new module) and Host → GitHub → Remote (pushes shell updates — layout,
   login, navbar).
4. **provide-inject.md** — added a `graph LR` after the intro: Host and Remote on
   the sides with a center "shared reactive state" node, double-headed arrows on
   both edges to show data can flow either direction.

## Notes

- No new dependencies. Mermaid fences are plain markdown, so the llms-text
  transform (`patch-llms-demo-source.ts`) needs no change — the diagram source is
  preserved verbatim in `llms-full.txt`.
- Site is light-only (`appearance: false`); the default mermaid theme is used.

## Verification

1. `pnpm build` in `demo/vitepress` succeeds with the `withMermaid` wrapper.
2. `repo/getting-started`, `repo/sync`, `repo/provide-inject` each render an SVG
   diagram (not a code block).
3. `grep -c '```mermaid' docs/.vitepress/dist/llms-full.txt` → 3.
