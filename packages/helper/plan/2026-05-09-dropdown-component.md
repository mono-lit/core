# Dropdown component + docs

## Context

`mono-dropdown` is a flexible floating overlay built as a Lit element. Unlike `mono-popover` (a visually-anchored helper bubble with an arrow), it's a chrome-light container designed to wrap arbitrary content via a `body` slot and any activator via a `main` slot. It supports 12 placements (`top | bottom | left | right` × bare / `-start` / `-end`), three trigger modes (click / hover / manual), six theme colours, sm/md/lg sizes, and **auto-flips + shifts** the panel to keep it inside the viewport. Visual language follows `template/dashboardV2.html`'s `.dd-panel`: rounded panel, soft accent-tinted shadow, slide-in entrance, no arrow.

## Files added

### Lib

- `src/components/dropdown/index.ts`
- `src/components/dropdown/mono-dropdown.ts` — Lit element. Light-DOM render (`createRenderRoot()` returns `this`); host-class management via `_updateHostClasses`; slot capture for `main` (activator) and `body` (panel content); document-level click + keydown listeners gated by `open` and `closeOnOutsideClick` / `closeOnEscape`; trigger event listeners (click/keyboard/hover) attached to the captured `main` nodes; window scroll/resize re-position. Uses `defineHybridPropAliases` + `booleanStringConverter` + `numberStringConverter` from `composables/hybird-prop`. Adds props `flip` (default true), `shift` (default true), `offset` (default 8). Tracks the resolved main-axis side as `@state() _resolvedSide` and applies it as the host class `.is-bottom | .is-top | .is-left | .is-right`, plus `.is-fixed` whenever the element is mounted (panel uses `position: fixed` + inline top/left written by `_positionPanel`). The positioning routine measures the activator + panel rects and:
  1. Auto-flips the main axis side if the requested side does not have enough room and the opposite side has more.
  2. Computes a cross-axis position from the alignment suffix (`start` / `end` / center).
  3. Shifts cross-axis inward to keep the panel inside the viewport (with a 4px breathing margin) when `shift` is true.
- `src/components/dropdown/dropdown-types.ts` — `DropdownPlacement` (12 values), `DropdownSide`, `DropdownAlign`, `DropdownTrigger`, `DropdownSize`, `DropdownColor`, `DropdownSource`, `DropdownCssClass`, `DropdownClickEventDetail` (extends popover's payload with `resolvedSide`), `DropdownClickEvent`, `DropdownOpenEvent(Detail)`, `DropdownCloseEvent(Detail)`, `DropdownProps`, `DropdownEvents`.
- `src/components/dropdown/dropdown.css` — variables on `.mono-dropdown` (no `:host`, per repo memory); per-color accent (`--dropdown-accent`/`-rgb`) from `--theme-X`; sm/md/lg sizing (panel padding, font, min/max-width, offset); 12 class-based static placement rules used by the CSS-only demos; resolved-side enter animations (`@keyframes mono-dropdown-in-down|up|left|right`) keyed off the `is-X` host class; panel uses `visibility/opacity/pointer-events` (always laid out) so the JS positioner can measure it pre-paint.

### Docs

- `demo/vitepress/docs/dropdown.md`
- `demo/vitepress/docs/manifests/dropdown.ts` — 11 entries.
- `demo/vitepress/docs/demos/dropdown/vue/*.vue` — 11 SFCs.
- `demo/vitepress/docs/demos/dropdown/css/*.vue` — 11 standalone HTML/CSS demos using the class API + vanilla refs (no Lit registration).

## Files changed

- `src/entries/index.ts` — added `export * from '../components/dropdown/index';` (alphabetical, between `drawer` and `file-upload`).
- `src/entries/index.css` — added `@import '../components/dropdown/dropdown.css';`.
- `vite.config.ts` — added `'ui/dropdown': r('./src/components/dropdown/index.ts')` to `build.lib.entry`.
- `package.json` — added `./ui/dropdown` sub-export pair.
- `demo/vitepress/docs/.vitepress/config.ts` — added `Dropdown → /dropdown` to the `Overlay` sidebar group (alongside `Drawer` and `Modal`).

## Demo set (11)

`basic`, `placements` (12 placement variants in a 3×4 grid), `auto-flip` (triggers near each viewport-card edge demonstrating flip + shift), `sizes`, `colors`, `triggers` (click vs hover), `with-mono-button` (real `<mono-button>` as the activator), `rich-content` (`<mono-input>` + `<mono-checkbox>` + `<mono-button>` inside `slot="body"`), `disabled`, `event-log`, `customized`.

## Patterns followed

- **Standardized event detail**: `mno-click` emits `{ modelValue, currentValue, oldValue, value, source, sourceEvent?, resolvedSide }` with `source` ∈ `'trigger' | 'outside' | 'escape' | 'manual' | 'hover'` and `resolvedSide` ∈ `'top' | 'bottom' | 'left' | 'right'`.
- **Vue v-model rule**: `:model-value` + `@mno-click="open = $event.detail.modelValue"`. Customized demo uses `:css-class.prop="{...}"`.
- **Host-as-wrapper**: the host element directly carries `mono-dropdown` + modifiers. Vue and CSS demos render with the same DOM depth → `.mono-dropdown.open .mono-dropdown-panel` and click-outside detection both work uniformly.
- **CSS demos** drive open/close via Vue refs that toggle `.open` on the wrapper and listen for outside clicks + Escape. The class-based static placement rules (`.bottom-start`, `.top-end`, etc.) are what make the CSS demos render correctly without the JS positioner.
- **Slot naming**: `main` (activator — replaces popover's `trigger`) and `body`. `<el slot="main">` / `<el slot="body">` — never `<template #main>` (would crash the Vue compiler on a custom element).

## Verification

From `C:\Users\VCT-DEV\Desktop\libs\packages\@mono-lit/helper\demo\vitepress\`:

```
pnpm dev
```

1. Open `/dropdown`. All 11 demos render. Toggle Vue ↔ CSS — both look identical for static demos; `auto-flip` only flips in Vue mode (CSS demo is annotated to that effect).
2. Click the activator in `basic` — panel slides in from above, points downward. Click outside or press Escape → closes.
3. `placements`: each of the 12 variants opens on the labelled side with the labelled alignment.
4. `auto-flip`: each corner trigger opens with the panel kept inside the viewport — bottom-row triggers flip to top; right-column triggers shift left.
5. Resize the window with a panel open — the panel re-positions on resize.
6. `with-mono-button`: clicking the `<mono-button>` toggles the dropdown. No regressions in the button's own hover/active styling.
7. `rich-content`: focus moves into the form fields; outside-click on a focused input does NOT close the panel (composedPath includes the panel).
8. `event-log` shows `[mno-click] modelValue=true source="trigger" resolvedSide="bottom"` (or whichever side after flip), and `source="outside" / "escape" / "trigger"` on each close.
9. Switch the global theme (theme-opsi-a → opsi-d) — every dropdown's border tint and shadow tint follow the theme.
10. `pnpm build` from the package root succeeds and emits `dist/ui/dropdown.js` + `dist/ui/dropdown.d.ts`.
