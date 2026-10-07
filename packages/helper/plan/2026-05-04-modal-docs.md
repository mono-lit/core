# Modal component + docs

## Context

Sixth roadmap component this week (after Accordion, Tabs, Toast, Popover, Drawer). `mono-modal` is the centered cousin of drawer — same overlay + close-button + escape + backdrop-click contract, but the panel is centered on screen instead of edge-anchored.

I mirrored every pattern drawer hardened during its session: body-portal `createRenderRoot()`, visibility-flip on close to keep shadow halos out of the viewport, `modal-title` attribute alias to dodge the global `title` tooltip clash, three-channel events (`mno-click` + `mno-open` + `mno-close`), and CSS demos that clone-and-append a `<template>` to `document.body`.

## Files added

### Lib
- `src/components/modal/index.ts`
- `src/components/modal/mono-modal.ts` — Lit element. `createRenderRoot()` returns a `<div data-mono-modal-portal>` appended to `document.body`. Slot capture happens on the host; captured nodes are placed into the portal during `updated()`. Lifecycle methods: `connectedCallback` captures slots and binds Escape listener (gated by `closeOnEscape && !persistent`); `willUpdate` applies/releases scroll-lock + Escape listener on `modelValue` flips; `disconnectedCallback` removes the portal cleanly.
- `src/components/modal/modal-types.ts` — `ModalSize`, `ModalColor`, `ModalSource`, `ModalCssClass`, `ModalClickEventDetail`, `ModalClickEvent`, `ModalOpenEventDetail`, `ModalOpenEvent`, `ModalCloseEventDetail`, `ModalCloseEvent`, `ModalProps`, `ModalEvents`.
- `src/components/modal/modal.css` — variables on `.mono-modal` (no `:host`; `mono-modal { display: contents }` since rendering happens in the body portal). Six color modifiers each redirecting `--modal-accent` and `--modal-accent-rgb` to the matching `--theme-X`. Size modifiers (`sm`/`md`/`lg`/`xl`) drive `max-width`. `.mono-modal-overlay` is `position: fixed; inset: 0` with backdrop-filter blur; `.mono-modal-panel-wrap` is a fixed flex container that centers the panel; `.mono-modal-panel` is the visible card. Visibility-flip pattern (closed: `visibility: hidden` with `transition: ..., visibility 0s linear 0.22s`; open: instant flip) keeps shadow halos out of the viewport while closed. Reduced-motion media query.

### Docs
- `demo/vitepress/docs/modal.md`
- `demo/vitepress/docs/manifests/modal.ts` — 9 entries.
- `demo/vitepress/docs/demos/modal/vue/*.vue` — 9 SFCs. All bind `:model-value="state"` and listen for `@mno-click="state = $event.detail.modelValue"` per the codified Vue v-model rule.
- `demo/vitepress/docs/demos/modal/css/*.html` — 9 self-contained demos. Each declares a `<template>` with the modal markup, then the IIFE clones the template and appends the clone to `document.body` so the standalone path also escapes the transform-hijacking trap. Vanilla-JS handlers flip `.open`/`.closed` on the portal and wire overlay-click, close-button, and Escape listeners.

## Files changed

- `src/entries/index.ts` — added `export * from '../components/modal/index'`.
- `src/entries/index.css` — added `@import '../components/modal/modal.css';`.
- `vite.config.ts` — added `modal: r('./src/components/modal/index.ts')` to `build.lib.entry`.
- `package.json` — added `./modal` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — added `Modal → /modal` to the existing `Overlay` sidebar group (alongside `Drawer`).

## Demo set (9)

`basic`, `sizes`, `colors`, `confirmation`, `with-form`, `persistent`, `no-overlay`, `event-log`, `customized`.

## Patterns followed

- **SVG-only icons**: hand-drawn Lucide-style close ✕, `viewBox="0 0 24 24"`, `stroke="currentColor"`. Same baseline as accordion / tabs / toast / popover / drawer.
- **Single binding prop**: `modelValue` only. State classes on the rendered portal still use `.open` / `.closed` because they describe a visual state.
- **Standardised event shape**: `{ modelValue, currentValue, oldValue, value, source, sourceEvent? }` with `source: 'overlay' | 'close' | 'escape' | 'manual'`. Three event names per change:
  - `mno-click` (+ `mnoClick`, `update:modelValue`, `update:model-value`) — every state change.
  - `mno-open` (+ `mnoOpen`) — only `false → true`.
  - `mno-close` (+ `mnoClose`) — only `true → false`.
- **Vue v-model rule**: `:model-value` + `@mno-click="x = $event.detail.modelValue"`.
- **Vue object-prop rule**: `customized` demo uses `:css-class.prop="{...}"`.
- **Theme integration**: every accent reads `var(--theme-X)`. The global theme switcher recolours every modal in flight.
- **`title` attribute clash**: HTML's global `title` attribute surfaces as a tooltip. The modal exposes its title prop as JS field `modalTitle` and attribute `modal-title`. Demos use `modal-title`.
- **Body portal for fixed-position robustness**: any ancestor with `transform`, `filter`, `perspective`, `will-change`, or `contain: paint` becomes the containing block for descendant `position: fixed` elements. Both Lit (via portal) and CSS demos (via `document.body.appendChild` of a `<template>` clone) sidestep it by rendering at the body level.
- **Closed-state shadow bleed**: the panel's `box-shadow` extends well beyond its border-box. With multiple modals on a docs page, even off-screen panels would bleed shadow halos into view. Fix: `.mono-modal-panel` defaults to `visibility: hidden` with a delayed visibility transition; `.mono-modal.open .mono-modal-panel` flips to instant. Net effect: closed panels (and shadows) are fully invisible.

## Verification

1. `pnpm dev`, open `/modal`.
2. All 9 demos render. **No phantom modals visible before opening** — visibility flip keeps closed-state panels off-screen.
3. Toggle Vue / CSS — both look identical.
4. `basic`: click trigger → overlay fades in, panel slides up + scales. Close via ✕, overlay click, or Escape.
5. `sizes`: max-width grows for `sm` (380) → `md` (520) → `lg` (680) → `xl` (880).
6. `colors`: head accent + close-button hover recolour per modifier.
7. `confirmation`: Cancel and Confirm both dismiss; status text below updates per which button fired.
8. `with-form`: focus jumps to the first input on open; submit closes the modal.
9. `persistent`: overlay-click and Escape do **nothing**; only the footer button or ✕ work.
10. `no-overlay`: page behind stays interactive (try scrolling or clicking text behind the panel).
11. `event-log`: each open / close path logs **two** lines per change — `mno-click` for any state change, then `mno-open` (false → true) or `mno-close` (true → false). `source` is one of `overlay` / `close` / `escape` / `manual`.
12. Switch the global theme picker — modal accents recolour with the rest of the page.
13. `pnpm build` — `dist/modal.js` and `dist/modal.d.ts` are emitted.
