# Sidebar (navigation drawer) component + docs

## Context

Second of the three Vuetify-style **layout primitives** the user requested: `mono-nav` →
`mono-sidebar` → `mono-menu`. Builds on the layout-var coordination mechanism `mono-nav`
introduced (`--mono-nav-height` on `:root`); the sidebar adds
`--mono-sidebar-left-width` and `--mono-sidebar-right-width` so consumers can pad their
main content via the existing `.mono-layout-content` helper without prop drilling.

Mapped from Vuetify's `<v-navigation-drawer>`:

| Vuetify | mono-sidebar |
|---|---|
| `permanent` | `mode="permanent"` |
| `temporary` | `mode="temporary"` |
| `rail` | `mode="rail"` |
| (no built-in auto) | `mode="auto"` — permanent on ≥ 768 px, temporary below (CSS `matchMedia`-driven) |
| `expand-on-hover` | `expandOnHover` |
| `location` | `location` (`'left'` / `'right'`) |
| `width`, `rail-width` | `width`, `railWidth` (px) |
| `absolute` | `contained` (`position: absolute` instead of `fixed` — for in-card demos) |

Density (`compact` / `comfortable` / `default`), color (`surface` + 6 themed), and
variant (`flat` / `elevated` / `outlined`) reuse the same vocabulary as `mono-nav` so
both layout primitives feel cohesive.

## Files added

### Lib

- `src/components/sidebar/index.ts` — re-exports.
- `src/components/sidebar/mono-sidebar.ts` — Lit element. `createRenderRoot()` returns
  the host (light DOM). Slot capture in `connectedCallback` routes children into three
  buckets (`header` / `body` / `footer`) — no `slot` attribute on a child puts it in the
  body, mirroring drawer's "default goes to body" rule. `willUpdate` resolves the
  effective mode (`auto` → `permanent` ≥ 768 px / `temporary` <), writes
  `--mono-sidebar-{left,right}-width` to `:root` (skipped when `contained`), and applies
  scroll-lock + Escape listener only for the **temporary** effective mode.
  `disconnectedCallback` clears side effects and the layout var. `expand-on-hover` is a
  pure CSS rule; the toggle button only renders when the effective mode is `rail`.
- `src/components/sidebar/sidebar-types.ts` — `SidebarMode`, `SidebarLocation`,
  `SidebarDensity`, `SidebarColor`, `SidebarVariant`, `SidebarSource`,
  `SidebarCssClass`, `SidebarClickEventDetail`, plus the open/close event aliases and
  `SidebarProps` / `SidebarEvents`.
- `src/components/sidebar/sidebar-utils.ts` — `SIDEBAR_AUTO_BREAKPOINT = 768`,
  `isAutoTemporary()` (matchMedia probe), `resolveMode(mode)`,
  `generateSidebarRootClasses({…})` (single source of truth for the modifier-class set),
  `validateSidebarProps()`.
- `src/components/sidebar/sidebar.css` — variables on `.mono-sidebar` (light-DOM rule).
  Scopes: density blocks scale `--sidebar-pad-x/y` and `--sidebar-gap`; six themed color
  modifiers redirect `--sidebar-accent` and (because the sidebar is a colored surface,
  unlike nav which is a bar) paint the **panel** with the accent + white text; `surface`
  keeps the white-with-themed-border look. Variant rules toggle box-shadow / border on
  the edge facing the content. Effective-mode rules drive the visible width: permanent
  = `width`, rail = `railWidth` (or `width` when `.open`), temporary = full width with
  `transform: translateX(±100%)` until `.open`. `expand-on-hover` is a `:hover` rule
  inside rail mode. Scrim renders only in temporary mode and is shown on `.open`. Rail
  toggle is positioned at the panel edge, rotated for right location, and its arrow
  flips when expanded. Reduced-motion override.

### Docs

- `demo/vitepress/docs/sidebar.md`
- `demo/vitepress/docs/manifests/sidebar.ts` — 9 entries.
- `demo/vitepress/docs/demos/sidebar/vue/*.vue` — 9 SFCs. All wrapped in a
  `position: relative; height: ...px; overflow: hidden` preview pane and use
  `:contained="true"` so the absolute-positioned sidebar stays inside the demo card.
  Slotted content uses `<el slot="header">` / `<el slot="footer">` (per the codified
  custom-element slot rule); body content has no `slot` attribute.
- `demo/vitepress/docs/demos/sidebar/css/*.html` — 9 self-contained HTML demos. Hand-
  written `.mono-sidebar` markup with the same classes the Lit element renders
  (`mode-X effective-X location-X density color variant contained open|closed
  expand-on-hover`). Inline `<script>` tags handle the temporary open/close, rail
  toggle, and active-item state. `<label>` wrappers around any inputs (per the codified
  standalone-CSS rule).

## Files changed

- `src/entries/index.ts` — added `export * from '../components/sidebar/index'`.
- `src/entries/index.css` — added `@import '../components/sidebar/sidebar.css';`.
- `vite.config.ts` — added `sidebar: r('./src/components/sidebar/index.ts')` to
  `build.lib.entry`.
- `package.json` — added `./sidebar` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — added `Sidebar → /sidebar` to the
  existing `Layout` sidebar group (alongside `Nav`).

## Demo set (9)

`permanent`, `temporary`, `rail`, `rail-on-hover`, `location` (left + right), `colors`,
`variants`, `with-menu` (full app-shell composition with brand header, themed nav list,
section labels, badges, and user-card footer — placeholder for the future `mono-menu`
that will replace the hand-rolled list), `customized`.

## Patterns followed

- **Light DOM render**: `createRenderRoot() { return this }`. Variables on
  `.mono-sidebar`, never `:host`. Per the codified light-DOM rule.
- **Slot routing**: capture direct children once in `connectedCallback`; place into
  `data-mono-slot` targets on `updated()`. Default-slot (unattributed children) goes to
  the body container — mirrors `mono-drawer`'s convention.
- **Vue named-slot rule**: demos use `<el slot="header">` / `<el slot="footer">`, never
  `<template #name>` (per the codified custom-element slot rule the nav session
  surfaced).
- **Theme integration**: every accent reads `var(--theme-X)`. Six themed colors paint
  the panel directly with white text; `surface` uses the white background with themed
  border + accent for focus rings. Global theme switcher recolors active states.
- **Layout-var coordination**: nav writes `--mono-nav-height`; sidebar writes
  `--mono-sidebar-left-width` / `--mono-sidebar-right-width` to
  `document.documentElement`. Skipped when `contained="true"` so demo cards don't
  clobber the docs site's own layout. Both vars are read by the
  `.mono-layout-content` helper class shipped in `nav.css`.
- **`contained` mode**: `position: absolute` instead of `fixed`. Lets demos render the
  sidebar inside a card without it floating across the whole viewport. In production,
  consumers leave `contained` off and let the sidebar sit at the document level.
- **Drawer-derived event shape**: `mno-click` (every change) + `mno-open` (false→true)
  + `mno-close` (true→false), each with `{ modelValue, oldValue, value, source }`.
  `source` is `'manual'` / `'scrim'` / `'escape'` / `'rail-toggle'` / `'rail-hover'`.
  `update:modelValue` aliases also fire (Vue silently filters them per the codified
  v-model rule, so demos use `@mno-click="x = $event.detail.modelValue"`).
- **Temporary-only side effects**: scroll-lock, Escape listener, and scrim only apply
  when the **effective** mode is `temporary`. Switching `mode="auto"` from temporary →
  permanent on viewport resize releases all three automatically via the `mql` listener.

## Verification

1. `pnpm dev` from `demo/vitepress/`, open `/sidebar`.
2. All 9 demos render. Vue / CSS tabs look identical.
3. **permanent**: sidebar is always visible at 220 px; main content padded 220 px from
   the left.
4. **temporary**: scrim + sidebar slide in on click; scrim-click, close button, and
   Escape (when not `contained`) dismiss.
5. **rail**: panel sits at 64 px; toggle button on the rail edge expands to 220 px;
   click again collapses. Arrow rotates per state.
6. **rail-on-hover**: panel widens to 220 px on hover, returns to 64 px on leave. No
   click required.
7. **location**: left and right side-by-side. Right anchored sidebar pushes content with
   `padding-right` instead of `padding-left`. Box-shadow flips to the inside edge.
8. **colors**: 7 panes — `surface` keeps white panel; the 6 themed paint the panel with
   the accent + white text.
9. **variants**: `flat` (no shadow), `elevated` (edge shadow), `outlined` (border on
   edge facing content).
10. **with-menu**: full app shell — brand header with logo, two nav groups with section
    labels, badges (numeric + "NEW"), user-card footer with avatar. Click items to
    update active state.
11. **customized**: `:css-class.prop="{ panel, header, body, footer }"` overrides apply
    per-element in Vue; matching utility classes apply in CSS demo.
12. **Theme switcher**: cycle the global theme — every sidebar's accent recolors with
    the rest of the page; themed colors stay themed.
13. `pnpm build` (lib) — `dist/sidebar.js`, `dist/sidebar.d.ts` emitted; type check
    passes; `dist/index.css` includes sidebar rules.
14. `pnpm build` (vitepress) — all demo SFCs compile; SSR build succeeds.

## Out of scope for this session

- **`mono-menu`** — third and final layout primitive. Will provide the recursive nav
  list (items + groups + dividers + subheaders) that fills `<mono-sidebar>`'s body slot
  in the next session, replacing the hand-rolled lists in this session's demos.
- **Permanent → temporary transition smoothing for `auto`** — when the viewport crosses
  768 px, the sidebar snaps between modes. A future enhancement could fade the panel
  during the transition; currently relies on the existing CSS transitions.
- **Push vs. shift behavior toggle** — sidebar always **pushes** content via the layout
  vars + `.mono-layout-content`. A future `pushContent: boolean` could opt into shift
  (overlay) for permanent mode, but no concrete use case yet.
- **RTL support beyond `location="right"`** — current rules anchor by left/right; full
  RTL (where the writing direction flips) hasn't been audited.
