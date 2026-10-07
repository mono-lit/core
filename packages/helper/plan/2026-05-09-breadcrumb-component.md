# Breadcrumb component + docs

## Context

`<mono-breadcrumb>` is a wayfinding component for page hierarchies. It mirrors the
existing app-shell layout primitives (`mono-nav` + `mono-sidebar` + `mono-menu`) — a
standalone Lit element that renders a flat list of items with separators, theme-aware
accents, and the same dual-render pattern menu uses (driven by `items` array OR by a
slotted body of `<mono-breadcrumb-list>` children). Reference markup lives in
`template/widgets-starterkit.html` (the `.breadcrumb` / `.bc-item` / `.bc-sep` block) —
the new component reuses that visual language but with the project's `.mono-*` class
prefix and theme tokens.

The breadcrumb manifest at `demo/vitepress/docs/manifests/breadcrumb.ts` and the page
stub at `demo/vitepress/docs/breadcrumb.md` already exist, plus a `vite.config.ts`
entry for `ui/breadcrumb` — the implementation just needs to land alongside.

## Files to add

### Lib

- `src/components/breadcrumb/index.ts` — re-exports.
- `src/components/breadcrumb/breadcrumb-types.ts`:
  - `BreadcrumbVariant = 'default' | 'contained' | 'underlined'`
  - `BreadcrumbSize = 'sm' | 'md' | 'lg'`
  - `BreadcrumbColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'surface'`
  - `BreadcrumbBadgeColor = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info'`
  - `BreadcrumbItem` — `{ id, title?, href?, icon?, badge?, badgeColor?, current?, disabled? }`.
  - `BreadcrumbCssClass` — `root | list | item | itemCurrent | itemDisabled | action | icon | badge | separator`.
  - `BreadcrumbClickEventDetail`, `BreadcrumbChangeEventDetail`, `BreadcrumbEvents`,
    `BreadcrumbProps`, `BreadcrumbListProps`.
- `src/components/breadcrumb/breadcrumb-utils.ts`:
  - `isIconifyClass`, `findItem`, `findItemIndex`,
    `resolveCurrentId(items, modelValue)` (last item is default current),
    `generateBreadcrumbRootClasses({ variant, size, color, truncate, disabled, … })`,
    `validateBreadcrumbProps`.
- `src/components/breadcrumb/breadcrumb-render.ts`:
  - `BreadcrumbRenderContext` (cssClass, isCurrent, getSlotIconNodes, onItemClick).
  - `renderBreadcrumbIcon`, `renderBreadcrumbBadge`, `renderBreadcrumbItemRow`,
    `renderBreadcrumbSeparator`, `renderBreadcrumbList(items, ctx, separator,
    separatorSlotName?)` — emits `<li class="mono-breadcrumb-item">` rows interleaved
    with `<li class="mono-breadcrumb-sep" aria-hidden="true">` separators.
- `src/components/breadcrumb/breadcrumb.css` — light-DOM tokens on `.mono-breadcrumb`.
  Density blocks for `sm`/`md`/`lg` scale `--bc-font`, `--bc-pad-x/y`, `--bc-gap`,
  `--bc-icon-size`, `--bc-radius`. Six themed color modifiers + `surface` redirect
  `--bc-accent`. Variants:
    - `default` — text-only, hover underlines accent (closest to template).
    - `contained` — pill background per item, accent on current.
    - `underlined` — bottom-border underline on current/hover.
  `.truncate` collapses overflow into ellipsis on each item; otherwise the whole list
  wraps. Reduced-motion override.
- `src/components/breadcrumb/mono-breadcrumb.ts` — Lit element. Same shape as
  `mono-menu`:
  - `createRenderRoot()` returns `this`.
  - `defineHybridPropAliases(this, ['modelValue', 'cssClass'])`.
  - Props: `items`, `modelValue` (the active id; defaults to last item or
    `current: true` item), `variant`, `size`, `color`, `separator` (default `›`),
    `truncate`, `disabled`, `cssClass`, `cssClassName`.
  - Captures `slot="icon-${id}"`, `slot="separator"` (custom SVG / chevron used
    between every pair), and `slot="body"` (which replaces the default items
    rendering with whatever the consumer drops in — typically nested
    `<mono-breadcrumb-list>` children).
  - Public hooks for descendant lists: `requestItemActivation(item, event)`,
    `isItemCurrent(id)`, `getSlotIconNodes(id)`, `getSeparatorSlotNodes()`,
    `_registerListChild`, `_unregisterListChild`.
  - Dispatches `mno-click` (every click) and `mno-change` (only when modelValue
    actually changes, i.e. consumer-driven highlighting). Both are fired in
    kebab + camel form like all other components.
- `src/components/breadcrumb/mono-breadcrumb-list.ts` — companion. Same dual mode as
  `mono-menu-list`:
  - List mode: `<mono-breadcrumb-list :items.prop="items" />`.
  - Direct single-row mode: `<mono-breadcrumb-list id title href icon badge current
    disabled />` — for use under `v-for` when each row is a separate component
    instance (reads its own props, normalizes into a one-element list).
  - Standalone (no parent): renders its own `<nav class="mono-breadcrumb …">`
    wrapper with the same modifier attributes (`variant`, `size`, `color`,
    `separator`, `truncate`, `color`).
  - Inside a `<mono-breadcrumb>` wrapper: registers itself with the parent and
    delegates clicks / current-state lookups upward, so the consumer can mix
    items-driven and v-for–driven content under one wrapper.

### Docs

- `demo/vitepress/docs/manifests/breadcrumb.ts` — already in place (11 entries).
- `demo/vitepress/docs/breadcrumb.md` — already in place.
- `demo/vitepress/docs/demos/breadcrumb/vue/*.vue` — 11 Vue SFCs that bind
  `:items.prop` (per the codified array-prop-on-Lit rule) and use `:model-value`
  + `@mno-change="x = $event.detail.modelValue"` for v-model (per the codified
  v-model rule).
- `demo/vitepress/docs/demos/breadcrumb/css/*.vue` — 11 self-contained Vue SFCs
  that hand-write `.mono-breadcrumb` markup (no Lit dependency) using the exact
  classes the Lit element emits, so Lit and standalone CSS produce identical DOM.

## Files to change

- `src/entries/index.ts` — add `export * from '../components/breadcrumb/index'`.
- `src/entries/index.css` — add `@import '../components/breadcrumb/breadcrumb.css';`.
- `package.json` — add `./ui/breadcrumb` sub-export (mirrors the others).
- (`vite.config.ts` already has the `ui/breadcrumb` entry — no change.)
- (`config.ts` sidebar already has `Breadcrumb → /breadcrumb` — no change.)

## Demo set (11)

`basic`, `variants`, `sizes`, `colors`, `with-icons`, `separators`, `interactive`,
`truncation`, `customized`, `composition` (`<mono-breadcrumb>` + slotted
`<mono-breadcrumb-list>` body), `standalone-list` (`<mono-breadcrumb-list>` used
on its own with no wrapper).

## Patterns followed

- **Light-DOM render** (`createRenderRoot() { return this }`) — variables go on
  `.mono-breadcrumb`, not `:host`. Per the codified light-DOM rule.
- **`modelValue` over `value`** — `model-value` attribute / `modelValue` JS prop
  with hybrid-prop aliases (`modelvalue`, `model-value`). `mno-change` event emits
  `{ modelValue, oldValue, value, item, sourceEvent }`. Per the codified Vue
  v-model rule, demos read `$event.detail.modelValue`, never `@update:model-value`.
- **`.prop` array binding** — array/object props (`items`, `cssClass`) require
  `:items.prop="…"` in Vue. Per the codified array-prop-on-Lit rule.
- **`slot="name"` on custom elements** — never `<template #name>` because Vue's
  compiler crashes on those for custom elements. Per the codified slots rule.
- **Iconify CSS classes for icons** — `item.icon` strings prefixed `i-mdi-…`,
  `i-tabler-…` resolve through UnoCSS preset-icons; everything else (raw SVG) goes
  through the `slot="icon-${id}"` slot. SVG-only fallback inside the chevron /
  default separator (no emoji on production rows).
- **Theme variables** — `--bc-primary`, `--bc-secondary`, `--bc-success`, …,
  `--bc-text`, `--bc-border` all derive from `--theme-*` tokens defined in
  `src/data/theme/index.css`, so swapping `theme-opsi-a` → `theme-opsi-b` recolors
  every breadcrumb without re-mounting.

## Out of scope

- Auto-collapse with overflow menu (the `…` ellipsis menu pattern). v1 ships
  per-item ellipsis via `truncate`; the overflow-menu flow is a v2 add-on that can
  reuse the existing slotted `<mono-breadcrumb-list>` for the dropdown body.
- Schema.org `BreadcrumbList` JSON-LD output. The DOM emits semantic `<nav
  aria-label="Breadcrumb"><ol>…</ol></nav>`; consumers can wrap or post-process.
