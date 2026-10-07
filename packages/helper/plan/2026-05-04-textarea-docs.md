# Textarea docs (VitePress)

## Context

`demo/vitepress/docs/textarea.md` was a stub pointing to checkbox. The `mono-textarea` component (sizes, 6 colors, 3 variants, validation, label/helper slots, JS-driven autoresize, character counter, four event aliases) is published via `@mono-lit/helper/textarea` (sub-export already in `package.json:47-50`, Vite lib entry already at `vite.config.ts:61`, sidebar link already at `.vitepress/config.ts:40`). Only the page, manifest, and demos were missing.

The audit also surfaced **two pre-existing lib bugs** that we fixed up front:

1. `src/components/textarea/textarea.css:1` declared `--textarea-*` variables under `:host { ... }` — same class as the input/radio/select/switch/tag-input fixes. Light DOM (`createRenderRoot()` returns `this`) means `:host` never matches.
2. `src/components/textarea/textarea-utils.ts` imported and used a `TextareaResize` type that was **never defined** in `textarea-types.ts`. `index.ts` re-exported the missing type, breaking the type build. The component never exposes a `resize` prop, so this was dead validation logic.

## Files added

- `demo/vitepress/docs/textarea.md` (overwrites the stub).
- `demo/vitepress/docs/manifests/textarea.ts` — 11 `DemoEntry` items.
- `demo/vitepress/docs/demos/textarea/vue/*.vue` — 11 Vue 3 SFCs.
- `demo/vitepress/docs/demos/textarea/css/*.html` — 11 self-contained HTML demos.

## Files changed (lib)

- `src/components/textarea/textarea.css` — moved `--textarea-*` declarations and `display: block` from `:host { ... }` onto `.mono-textarea { ... }`, added `mono-textarea { display: block }` for the custom-element tag, scoped descendant box-sizing reset to `.mono-textarea *`.
- `src/components/textarea/textarea-utils.ts` — dropped the `TextareaResize` import, removed `resize?: TextareaResize` from the `validateTextareaProps` signature and the `validResize` array + check. Pure dead-code removal — the component never read `resize`.
- `src/components/textarea/index.ts` — dropped `TextareaResize` from the type re-exports (the type didn't exist).

## Demo set

`basic`, `sizes`, `variants`, `colors`, `states`, `validation`, `autoresize`, `counter`, `slots`, `event-log`, `customized`.

## Patterns followed

- Markdown / manifest layout copied from `input.md` / `manifests/input.ts` (`DemoEntry` shape from `manifests/types.ts`).
- **Vue binding rules** (memory-confirmed):
  - `:model-value="x"` + `@mno-input="x = $event.detail.modelValue"` for live two-way binding (Vue's `runtime-dom` excludes `onUpdate:*` from native event listeners).
  - `:css-class.prop="{...}"` in the `customized` demo. `cssClass` is `@property({ attribute: false })` of object type (`mono-textarea.ts:348`), so the `.prop` suffix forces property assignment per the codified array/object-prop rule.
- **CSS demos** use the standalone path documented in `textarea.css:223-334`. Autoresize is JS-driven and CSS alone can't grow on input — the CSS variant uses static `rows` to show the visual outcome and notes the limitation in helper text. The counter CSS demo hard-codes `123/500` as a sample; the `event-log` CSS demo uses a vanilla-JS IIFE listening on the native `<textarea>`'s `input` and `change` events.

## Verification

1. Run the VitePress dev server and open `/textarea`.
2. Confirm 11 demos render and the **Vue / CSS** toggle swaps both the live preview and the source.
3. Type into `basic`, `event-log`, `counter`, `autoresize` — model updates, log streams, counter ticks, autoresize grows from `min-rows` (2) to `max-rows` (8) and stops.
4. Inspect element on the root `<mono-textarea>` and confirm `--textarea-*` custom properties resolve (verifies the `:host` fix).
5. Run `pnpm build` — type check should now succeed (the `TextareaResize` removal unblocks it).

## Not changed

- `package.json` (sub-export already shipped).
- `vite.config.ts` (textarea lib entry already configured).
- `.vitepress/config.ts` (sidebar `Textarea → /textarea` already correct).
- `src/components/textarea/mono-textarea.ts`, `textarea-types.ts` (no logic changes).
