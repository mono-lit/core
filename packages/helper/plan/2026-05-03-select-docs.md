# Select docs (VitePress)

## Context

`demo/vitepress/docs/select.md` exists only as a stub pointing readers to checkbox. The `mono-select` component (custom button + dropdown UI, sizes/colors/variants/validation, slot-overridable label/helper/prefix/suffix, clearable, options array prop) is published as `@mono-lit/helper/select` but has no demos. This plan replaces the stub with a full live demo page following the established `input` / `radio` pattern.

The audit also surfaced **the same `:host` CSS bug** that was fixed for `input` and `radio`. `select.css` declared its `--select-*` variables under `:host`, which never matches because `MonoSelect.createRenderRoot()` returns `this` (light DOM) and standalone HTML demos have no host element. Fixed in this change by hoisting the variables onto `.mono-select` and scoping the `*, *::before, *::after` reset to `.mono-select *`.

## Files added

- `demo/vitepress/docs/select.md` (overwrites the stub) — `<script setup>` import of `@mono-lit/helper/select`, intro paragraph, single `<ComponentDocs name="select" />`.
- `demo/vitepress/docs/manifests/select.ts` — 11 `DemoEntry` items.
- `demo/vitepress/docs/demos/select/vue/*.vue` (11 SFCs).
- `demo/vitepress/docs/demos/select/css/*.html` (11 self-contained HTML demos using the native `<select>` fallback path).

## Files changed (CSS bug fix)

- `src/components/select/select.css` — moved `--select-*` custom-property declarations and `display: block` from `:host { ... }` onto `.mono-select { ... }` (with `mono-select { display: block }` for the custom-element tag), and scoped the descendant box-sizing reset to `.mono-select *`.

## Demo set

`basic`, `sizes`, `variants`, `colors`, `states`, `validation`, `clearable`, `slots`, `event-change`, `event-log`, `customized`.

## Patterns followed

- Markdown / manifest layout copied from `input.md` / `manifests/input.ts` (`DemoEntry` shape from `manifests/types.ts`).
- **Vue binding rule** (memory-confirmed): `mono-select` is a custom element; Vue's `runtime-dom` excludes `onUpdate:*` from native event listeners. Use `:model-value` + `@mno-change="x = $event.detail.modelValue"` (NOT `@update:model-value`). Confirmed in `checkbox/vue/event-change.vue` and applied to all radio/input demos earlier this session.
- **Options prop** is bound as a JS array via Vue property binding: `:options="[{ label, value, disabled? }, ...]"`. The Lit prop is `@property({ attribute: false })`, so Vue sets the JS property directly.
- **CSS demos** use the native `<select>` fallback already shipped in `select.css:380-401` (`.mono-select-native` with `appearance: none`). Wrapped by `.mono-select-trigger` for border/padding and `.mono-select` parent for sizing/color/variant. No JS needed — native browser dropdown handles the picker. The `.mono-select-arrow` ▾ glyph is decorative.
- **Customized via** `:css-class="{ root, label, trigger, value, arrow, dropdown, option, message }"` (Vue) or utility classes baked directly into `.mono-select*` markup (CSS).

## Verification

1. Run the VitePress dev server and open `/select`.
2. Confirm 11 demos render and the **Vue / CSS** toggle swaps live preview + source.
3. Open the dropdown in `basic`/`sizes`/`variants`/`colors` (Vue) — selecting an option should close the dropdown and show the selected label.
4. For `event-log`: change the selection a few times and use the clear button — log shows `[mno-change]` and `[mno-clear]` lines with new and old values.
5. Visually compare each Vue variant vs its CSS variant — both render through the same `select.css` so they should match.

## Not changed

- `.vitepress/config.ts` (Select link already at line 41).
- `manifests/types.ts` (existing `DemoEntry` is sufficient).
- `package.json` (`./select` sub-export already shipped).
- `src/components/select/mono-select.ts`, `select-types.ts`, `select-utils.ts`, `index.ts` (no logic changes; only the stylesheet bug).
