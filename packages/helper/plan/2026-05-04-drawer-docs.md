# Drawer component + docs

## Context

Fifth widget extracted from `widgets-starterkit.html` and the next item on the
`2026-05-04-template-componentization-roadmap.md` roadmap (after accordion,
tabs, toast, modal). `mono-drawer` is a side-anchored overlay panel that
slides in from any of the four edges. Use it for detail views, filter rails,
or contextual forms that don't deserve a full route.

The template version (`drawer` / `drawer-overlay` in
`template/widgets-starterkit.html`) is right-anchored only and uses the
hardcoded cobalt palette. The Lit version is theme-aware (`var(--theme-X)`),
re-anchorable, and follows the same `modelValue` + `mno-click` event shape
the rest of the library uses (tabs, switch, etc.) so it plays nicely with
Vue, plain HTML, and the existing component conventions.

## Files added

### Lib
- `src/components/drawer/index.ts`
- `src/components/drawer/mono-drawer.ts` — Lit element. Single binding prop
  `modelValue` (with `model-value` attribute alias). Other props: `position`
  ('left' | 'right' | 'top' | 'bottom'), `size` ('sm' | 'md' | 'lg' | 'xl'
  | 'full'), `color` (six theme accents), `title` (mapped to the
  `drawer-title` attribute to avoid colliding with the global `title`
  attribute), `dismissible`, `persistent`, `overlay`, `closeOnEscape`,
  `closeOnOverlay`, `lockScroll`, `cssClass`, `cssClassName`. Methods:
  `show()`, `hide()`, `toggle()`. Body-scroll lock + Escape listener attach
  on open and tear down on close / disconnect.

  **Portal rendering** — `createRenderRoot()` returns a fresh `<div
  data-mono-drawer-portal>` appended to `document.body`. The Lit template
  (overlay + panel) lives in that portal so `position: fixed` always anchors
  to the viewport even if the host's ancestors have `transform`, `filter`,
  or other properties that would otherwise hijack the containing block (a
  well-known CSS gotcha that broke the prior version inside VitePress demo
  cards). `disconnectedCallback` removes the portal so reactive frameworks
  can mount/unmount the host without leaks. Slot capture still happens on
  the host element; captured nodes are placed into the portal during
  `updated()`.

- `src/components/drawer/drawer-types.ts` — `DrawerPosition`, `DrawerSize`,
  `DrawerColor`, `DrawerSource` ('overlay' | 'close' | 'escape' | 'manual'),
  `DrawerCssClass`, `DrawerClickEventDetail` (`{ modelValue, currentValue,
  oldValue, value, source, sourceEvent? }` — same shape tabs/toast emit),
  `DrawerClickEvent`, plus transition-specific aliases
  `DrawerOpenEventDetail` / `DrawerOpenEvent` and
  `DrawerCloseEventDetail` / `DrawerCloseEvent`. `DrawerProps`,
  `DrawerEvents` (which lists `mno-click`, `mno-open`, `mno-close`, and
  their camelCase + `update:*` aliases).
- `src/components/drawer/drawer.css` — variables on `.mono-drawer` (no
  `:host`, per the codified rule); `mono-drawer { display: contents }` so
  the host doesn't introduce extra layout (everything renders in the
  body-portal); six colour modifiers each redirecting `--drawer-accent` and
  `--drawer-accent-rgb` to the matching `--theme-X`; size modifiers split by
  axis (`position-left.sm` / `position-top.sm` map to width vs height);
  overlay and panel use `position: fixed` + `inset` / corner anchors so
  they tile correctly to the viewport regardless of where the portal lives;
  transform-based slide animation per edge; reduced-motion media query.

### Docs
- `demo/vitepress/docs/drawer.md`
- `demo/vitepress/docs/manifests/drawer.ts` — 9 entries.
- `demo/vitepress/docs/demos/drawer/vue/*.vue` — 9 SFCs. All bind
  `:model-value="state"` and listen for
  `@mno-click="state = $event.detail.modelValue"` per the codified Vue
  v-model rule (`runtime-dom` filters `onUpdate:modelValue` on custom
  elements, so `v-model` doesn't work).
- `demo/vitepress/docs/demos/drawer/css/*.html` — 9 self-contained demos.
  Each one declares a `<template>` with the drawer markup, then the IIFE
  clones the template and **appends the clone to `document.body`** so the
  CSS demo escapes the same transform-hijacking that bit the Lit version.
  Vanilla-JS handlers flip `.open` / `.closed` on the root and wire
  overlay-click, close-button, and Escape listeners.

## Files changed

- `src/entries/index.ts` — added `export * from '../components/drawer/index'`.
- `src/entries/index.css` — added `@import '../components/drawer/drawer.css';`.
- `vite.config.ts` — added `drawer: r('./src/components/drawer/index.ts')` to
  `build.lib.entry`.
- `package.json` — added `./drawer` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — new "Overlay" sidebar group
  with `Drawer → /drawer`.

## Demo set (9)

`basic`, `positions`, `sizes`, `colors`, `slots`, `persistent`, `no-overlay`,
`event-log`, `customized`.

## Patterns followed

- **SVG-only icons**: hand-drawn Lucide-style close ✕ inside the head,
  `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="2"`. Same
  baseline as accordion / tabs / toast.
- **Single binding prop**: `modelValue` is the only state input. The `open`
  prop from the first iteration was dropped so the surface matches the rest
  of the library (tabs, switch, input). State classes on the rendered root
  still use the `.open` / `.closed` class names because they describe a
  visual state, not a prop.
- **Standardised event shape**: every state change emits
  `{ modelValue, currentValue, oldValue, value, source, sourceEvent? }` —
  identical detail layout to tabs and toast. Three event names fire per
  change so consumers can subscribe at whichever granularity they need:
    - `mno-click` (+ `mnoClick`, `update:modelValue`, `update:model-value`
      aliases) — every state change.
    - `mno-open` (+ `mnoOpen`) — only on `false → true`.
    - `mno-close` (+ `mnoClose`) — only on `true → false`.
- **Vue v-model rule**: per the codified memory, use `:model-value` +
  `@mno-click="x = $event.detail.modelValue"` instead of `v-model`.
- **Vue object-prop rule**: per the codified memory, `cssClass` is
  `attribute: false`, so the customized demo uses `:css-class.prop="{...}"`.
- **Theme integration**: every accent reads `var(--theme-X)`. The global
  VitePress theme switcher recolours every drawer in flight.
- **`title` attribute clash**: HTML's global `title` attribute surfaces as
  a tooltip. The drawer exposes its title prop as the JS field `title` and
  the attribute `drawer-title`. Demos use `drawer-title`.
- **Body portal for fixed-position robustness**: any ancestor with
  `transform`, `filter`, `perspective`, `will-change`, or
  `contain: paint` becomes the containing block for descendant
  `position: fixed` elements (CSS spec, not a bug). VitePress demo cards
  trip this. Both the Lit element (via `createRenderRoot()` portal) and the
  CSS demos (via `document.body.appendChild` in the IIFE) sidestep it by
  rendering at the body level.
- **Closed-state shadow bleed**: the panel's `box-shadow` (48px blur)
  extends ~50–100px beyond the panel's border-box. Even with
  `transform: translateX(±100%)` pushing the panel fully off-screen, the
  shadow halo would still bleed back into the viewport — and with multiple
  drawers per demo (4 in `positions`, 5 in `sizes`, 6 in `colors`), each
  contributes a band of stacked shadow on the corresponding edge. Fix:
  `.mono-drawer-panel` defaults to `visibility: hidden` with
  `transition: ..., visibility 0s linear 0.28s` (delayed flip), and
  `.mono-drawer.open .mono-drawer-panel` overrides to
  `visibility: visible` with `visibility 0s linear 0s` (instant flip). On
  open, visibility flips visible immediately and the slide-in animates; on
  close, the slide-out animates first, then visibility flips hidden after
  the transform finishes. Net effect: closed panels (and their shadows) are
  fully invisible.
- **CSS demos are self-contained**: per the codified memory, no Lit needed.
  The shared `drawer.css` from `@mono-lit/helper/index.css` drives both.

## Verification

1. `pnpm dev` and open `/drawer`.
2. All 9 demos render. **No phantom drawer panels stack on the left/right
   edges before opening** — they're hidden in the body portal, off-screen,
   and `pointer-events: none` until the trigger fires.
3. Toggle Vue / CSS — both look identical.
4. `basic`: click trigger — drawer slides in from the right, overlay fades
   in. Close via ✕, overlay click, or Escape.
5. `positions`: each direction button slides the panel in from that edge.
6. `sizes`: width grows for `sm` → `md` → `lg` → `xl`; `full` covers the
   viewport.
7. `colors`: head accent and scrollbar thumb recolour per theme variable.
8. `persistent`: clicking the overlay or pressing Escape does **not** close;
   only the footer button or the ✕ button work.
9. `no-overlay`: page behind stays interactive (try scrolling or clicking
   text behind the panel).
10. `event-log`: each open / dismiss path logs **two** lines per change —
    `mno-click` for any state change, then `mno-open` (false → true) or
    `mno-close` (true → false). Source is one of
    `overlay` / `close` / `escape` / `manual`.
11. Switch the global theme picker — drawer accents recolour with the rest
    of the page.
12. `pnpm build` — `dist/drawer.js` and `dist/drawer.d.ts` are emitted.
