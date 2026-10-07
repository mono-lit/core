# Input docs (VitePress)

## Context

The VitePress sidebar at `demo/vitepress/docs/.vitepress/config.ts:39` already wires `Form → Input → /input`, but the page itself does not exist. The `mono-input` component (sizes, colors, variants, validation states, prefix/suffix slots, clear button, four event types) is published as the `@mono-lit/helper/input` sub-export but currently has no documentation demos. Adding the page so users can see live + source examples for every supported feature.

## Files added

- `demo/vitepress/docs/input.md` — `<script setup>` import of `@mono-lit/helper/input`, intro paragraph, single `<ComponentDocs name="input" />` block.
- `demo/vitepress/docs/manifests/input.ts` — `DemoEntry[]` listing the 11 demos.
- `demo/vitepress/docs/demos/input/vue/*.vue` — 11 Vue 3 SFCs.
- `demo/vitepress/docs/demos/input/css/*.html` — 11 self-contained HTML/CSS demos (no Lit).

## Demo set

`basic`, `types`, `sizes`, `variants`, `colors`, `states`, `validation`, `prefix-suffix`, `clearable`, `event-log`, `customized`.

## Patterns followed

- Markdown layout copied from `file-upload.md`.
- Manifest layout copied from `manifests/file-upload.ts` (`DemoEntry` shape from `manifests/types.ts`).
- Vue v-model on Lit element: `:model-value="x"` + `@update:model-value="x = $event.detail.modelValue"` (Lit emits `CustomEvent`).
- Event-log: ref-array + computed text + prepend pattern from `file-upload/vue/event-log.vue`; styled `<div>` with `white-space: pre-wrap; font-family: monospace; background: #f0f0f0;`.
- Customized via `:css-class="{ root, label, field, native, message }"` (Vue) or utility classes baked directly into `.mono-input*` markup (CSS).
- CSS demos are self-contained — no `<mono-input>` tags, no Lit imports — using the standalone class structure documented in `src/components/input/input.css:367-482`.

## Verification

1. Run the VitePress dev server and open `/input`.
2. Confirm 11 demos render and the **Vue / CSS** toggle swaps live preview + source.
3. For `event-log`: type, blur, click clear — log shows `[mno-input]`, `[mno-change]`, `[mno-clear]` lines (Vue) and equivalent native event lines (CSS).
4. Visually compare each variant Vue vs CSS — both render through the same `input.css` so they should match.

## Not changed

- `.vitepress/config.ts` (Input link already present).
- `manifests/types.ts` (existing `DemoEntry` is sufficient).
- `package.json` (sub-export already shipped).
- `src/components/input/*` (no source edits).
