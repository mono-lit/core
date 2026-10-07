# Radio docs (VitePress)

## Context

The VitePress sidebar at `demo/vitepress/docs/.vitepress/config.ts:37` already wires `Form → Radio → /radio`, but the page itself does not exist. The `mono-radio` component (sizes, 6 colors, label + description, slot overrides, value-bound group selection) is published as the `@mono-lit/helper/radio` sub-export but has no demos. This plan adds the missing page following the established `input` / `file-upload` pattern.

The audit also surfaced the **same `:host` CSS bug fixed for input** — `radio.css` declared its `--mono-radio-*` variables under `:host`, which never matches because `MonoRadio.createRenderRoot()` returns `this` (light DOM) and standalone HTML demos have no host element. Fixed in this change by hoisting the variables onto `.mono-radio` (mirrors `button.css`/`checkbox.css`).

## Files added

- `demo/vitepress/docs/radio.md`
- `demo/vitepress/docs/manifests/radio.ts`
- `demo/vitepress/docs/demos/radio/vue/*.vue` (11 SFCs)
- `demo/vitepress/docs/demos/radio/css/*.html` (11 self-contained HTML demos)

## Files changed (CSS bug fix)

- `src/components/radio/radio.css` — moved `--mono-radio-*` custom-property declarations from `:host { ... }` onto `.mono-radio { ... }`, scoped the `*, *::before, *::after` reset to `.mono-radio *`, and consolidated the duplicate `mono-radio { display: inline-block }` blocks.

## Demo set

`basic`, `group`, `sizes`, `colors`, `states`, `description`, `card`, `slots`, `event-change`, `event-log`, `customized`.

## Patterns followed

- Markdown layout copied from `input.md` / `file-upload.md`.
- Manifest layout copied from `manifests/input.ts` (`DemoEntry` shape from `manifests/types.ts`).
- Vue v-model on Lit element: `:model-value="x"` + `@update:model-value="x = $event.detail.modelValue"` (Lit emits `CustomEvent`).
- Group binding: a single `selected` ref shared between multiple `<mono-radio>` instances; each instance has a different `value` and the wrapper updates `selected` on change.
- Event-log: ref-array + computed text + prepend pattern from `input/vue/event-log.vue`; styled `<div>` with `white-space: pre-wrap; font-family: monospace; background: #f0f0f0;`.
- Customized via `:css-class="{ root, circle, dot, label, labelText, description }"` (Vue) or utility classes baked directly into `.mono-radio*` markup (CSS).
- CSS demos are self-contained — no `<mono-radio>` tags, no Lit imports — using the standalone `<label class="mono-radio …"> <input class="mono-radio-input" type="radio"> <span class="mono-radio-circle"> <span class="mono-radio-dot"></span> </span> <span class="mono-radio-label"> … </span></label>` structure documented in `src/components/radio/radio.css:178-248`.
- The CSS uses `:has(.mono-radio-input:checked)` to drive checked styles in standalone demos (lines 222–229).

## Verification

1. Run the VitePress dev server and open `/radio`.
2. Confirm 11 demos render and the **Vue / CSS** toggle swaps live preview + source.
3. Pick options in `group` (Vue) and confirm the selected value updates in both the radios and the displayed `selected` text.
4. For `event-log`: pick options in sequence — log shows `[update:model-value]` and `[mno-change]` lines with new and old values (Vue) and equivalent `change` events (CSS, via the native `change` listener).
5. Visually compare each variant Vue vs CSS — both render through the same `radio.css` so they should match.

## Not changed

- `.vitepress/config.ts` (Radio link already present).
- `manifests/types.ts` (existing `DemoEntry` is sufficient).
- `package.json` (sub-export already shipped).
- `src/components/radio/mono-radio.ts`, `radio-types.ts`, `radio-utils.ts`, `index.ts` (no logic changes needed; only the stylesheet bug).
