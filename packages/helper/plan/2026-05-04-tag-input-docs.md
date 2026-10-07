# Tag input docs (VitePress)

## Context

The VitePress sidebar listed `Input tag → /input-tag` (label and slug both inverted from the source folder `src/components/tag-input/` and the Lit tag `mono-tag-input`). The page itself never existed. The component (sizes, 6 colors, 3 variants, validation, options array, max-tags limit, allow-custom toggle, and five events: `mno-add`, `mno-remove`, `mno-clear`, `mno-change`, `update:model-value`) is built as a separate Vite entry (`vite.config.ts:63`) but had no `./tag-input` sub-export in `package.json`, so `import('@mono-lit/helper/tag-input')` would fail at runtime.

The audit also surfaced **the same `:host` CSS bug** that was fixed for `input` / `radio` / `select` / `switch`. `tag-input.css` declared its `--tag-input-*` variables under `:host`, which never matches because `MonoTagInput.createRenderRoot()` returns `this` (light DOM) and standalone HTML demos have no host element.

This change adds the doc page and demos, fixes the `:host` bug up front, plus the two naming/wiring issues.

## Files added

- `demo/vitepress/docs/tag-input.md` — `<script setup>` import of `@mono-lit/helper/tag-input`, intro paragraph, single `<ComponentDocs name="tag-input" />`.
- `demo/vitepress/docs/manifests/tag-input.ts` — 11 `DemoEntry` items.
- `demo/vitepress/docs/demos/tag-input/vue/*.vue` — 11 Vue 3 SFCs.
- `demo/vitepress/docs/demos/tag-input/css/*.html` — 11 self-contained HTML demos.

## Files changed

- `src/components/tag-input/tag-input.css` — moved `--tag-input-*` declarations and `display: block` from `:host { ... }` onto `.mono-tag-input { ... }`, added `mono-tag-input { display: block }` for the custom-element tag, scoped descendant box-sizing reset to `.mono-tag-input *`.
- `package.json` — added `./tag-input` sub-export pointing at `./dist/tag-input.js` (the Vite lib entry already exists).
- `demo/vitepress/docs/.vitepress/config.ts` — sidebar entry was `Input tag → /input-tag`, now `Tag input → /tag-input` to match the source folder, the Lit element name, and the new sub-export.

## Demo set

`basic`, `sizes`, `variants`, `colors`, `states`, `validation`, `suggestions`, `max-tags`, `slots`, `event-log`, `customized`.

## Patterns followed

- Markdown / manifest layout copied from `select.md` / `manifests/select.ts` (`DemoEntry` shape from `manifests/types.ts`).
- **Vue binding rules** (memory-confirmed):
  - `mono-tag-input` is a custom element; Vue's `runtime-dom` excludes `onUpdate:*` from native event listeners. Two-way binding uses `:model-value` + `@mno-change="x = $event.detail.modelValue"`.
  - `:options` is `@property({ attribute: false })` of array type → bind with `:options.prop="optionsList"` so the value goes through the JS property setter rather than `setAttribute(stringified array)`.
  - `:model-value` is array-typed too. The Lit class observes `model-value` as an attribute and `_normalizeValue` parses comma-separated strings, so plain `:model-value="['a','b']"` works for simple string values, but the demos use `:model-value.prop="tags"` for consistency and to handle numeric/comma-containing tags safely.
- **CSS demos** use the standalone path documented in `tag-input.css:301-425`. For dynamic interaction (`event-log`), a small vanilla-JS IIFE wires up the native input keydown + chip remove buttons. Static demos render the chips and field directly without JS.
- **Customized via** `:css-class="{ root, label, field, chip, native, message, ... }"` (Vue) or utility classes baked directly into `.mono-tag-input*` markup (CSS).

## Verification

1. Run the VitePress dev server and open `/tag-input`.
2. Confirm 11 demos render and the **Vue / CSS** toggle swaps live preview + source.
3. Type a tag and press Enter / `,` / Tab in `basic`, `suggestions`, `max-tags`, `event-log` — chips appear, dropdown filters in `suggestions`, max limit blocks at 5 in `max-tags`.
4. For `event-log`: add, remove (× and Backspace), clear — log shows `[mno-add]`, `[mno-remove]`, `[mno-clear]`, `[mno-change]` lines with current and old arrays.
5. Visually compare each Vue variant vs its CSS variant — both render through the same `tag-input.css`.

## Not changed

- `manifests/types.ts` (existing `DemoEntry` is sufficient).
- `vite.config.ts` (the `tag-input` lib entry was already configured at line 63).
- `src/components/tag-input/mono-tag-input.ts`, `tag-input-types.ts`, `tag-input-utils.ts`, `index.ts` (no logic changes; only the stylesheet bug).
