# Switch docs (VitePress)

## Context

The VitePress sidebar at `demo/vitepress/docs/.vitepress/config.ts:38` already wires `Form → Switch → /switch`, but the page itself does not exist. The `mono-switch` component (sizes, 6 colors, label + description, slot overrides, loading state, two-event API) is published as the `@mono-lit/helper/switch` sub-export but has no demos. Adding the page so users can see live + source examples for every feature.

The audit also surfaced **two pre-existing lib issues** that the previous component sessions taught us to look for:

1. `switch.css` declared its `--mono-switch-*` variables under `:host`, which never matches because `MonoSwitch.createRenderRoot()` returns `this` (light DOM) and standalone HTML demos have no host element. Same class as the input/radio/select fix.
2. `switch.css` shipped a `.mono-switch.switch-card` helper class — a too-specific composition that the user removed from `radio.css` last session for the same "lib should feel generalist and customizable" reason.

Both are corrected in this change.

## Files added

- `demo/vitepress/docs/switch.md` — `<script setup>` import of `@mono-lit/helper/switch`, intro paragraph, single `<ComponentDocs name="switch" />`.
- `demo/vitepress/docs/manifests/switch.ts` — 10 `DemoEntry` items.
- `demo/vitepress/docs/demos/switch/vue/*.vue` — 10 Vue 3 SFCs.
- `demo/vitepress/docs/demos/switch/css/*.html` — 10 self-contained HTML demos.

## Files changed (lib)

- `src/components/switch/switch.css`
  - Hoisted `--mono-switch-*` declarations and `display: inline-block` from `:host { ... }` onto `.mono-switch { ... }`, with `mono-switch { display: inline-block }` for the custom-element tag, scoped descendant box-sizing reset to `.mono-switch *`.
  - Removed the `.mono-switch.switch-card { ... } / :hover / .mono-switch-checked` block (≈30 lines). The card recipe lives in the demo page only.

## Demo set

`basic`, `sizes`, `colors`, `states`, `description`, `slots`, `event-change`, `event-log`, `customized`, `card` (recipe — last, alongside `customized`).

## Patterns followed

- Markdown / manifest layout copied from `input.md` / `radio.md` / `manifests/radio.ts` (`DemoEntry` shape from `manifests/types.ts`).
- **Vue binding rule** (memory-confirmed): `mono-switch` is a custom element; Vue's `runtime-dom` excludes `onUpdate:*` from native event listeners. Use `:model-value` + `@mno-change="x = $event.detail.modelValue"` (NOT `@update:model-value`).
- **Boolean coercion**: `model-value` accepts boolean attribute values via `booleanStringConverter`; demos pass either `:model-value="bool"` (Vue) or omit the attribute when `false` / set it `model-value="true"` for `true` (CSS).
- **CSS demos** use the standalone structure documented in `switch.css:217-309`: a `<label class="mono-switch md primary">` wrapping `<input class="mono-switch-input" type="checkbox" role="switch">` plus `.mono-switch-track` and `.mono-switch-thumb`. The lib's `:has(.mono-switch-input:checked)` selector drives the checked styling — no JS needed for the basic, sizes, colors, states, description, and slots demos.
- The `event-change` and `event-log` CSS demos use a small vanilla-JS IIFE listening on the native `change` event.
- **Customized via** `:css-class="{ root, track, thumb, label, labelText, description }"` (Vue) or utility classes baked directly into `.mono-switch*` markup (CSS).
- **`card` recipe** (per the radio precedent): lib ships no helper; the Vue demo declares a `<style scoped>` block with `:deep(.switch-card) { ... }`, the HTML demo declares a `<style>` block at the top. Users copy the recipe into their app.

## Verification

1. Run the VitePress dev server and open `/switch`.
2. Confirm 10 demos render and the **Vue / CSS** toggle swaps live preview + source.
3. Toggle the switch in `basic`, `event-change`, and `event-log` (Vue) — `selected` updates and the log entries fire on `mno-change`.
4. Toggle the CSS variant of the same demos — `:has(.mono-switch-input:checked)` should drive the visual toggle and the IIFE log lines.
5. Visually compare each variant Vue vs CSS — both render through the same `switch.css` so they should match (sizes, colors, description spacing, loading pulse).
6. The `card` demo should look identical Vue vs CSS — both pull the recipe from the demo file, not the lib.

## Not changed

- `.vitepress/config.ts` (Switch link already present).
- `manifests/types.ts` (existing `DemoEntry` is sufficient).
- `package.json` (`./switch` sub-export already shipped).
- `src/components/switch/mono-switch.ts`, `switch-types.ts`, `switch-utils.ts`, `index.ts` (no logic changes; only the stylesheet bug + helper-class removal).
