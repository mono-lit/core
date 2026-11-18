# Sidebar

A Vuetify-style navigation drawer with four modes — `permanent` (always visible, pushes content), `temporary` (overlay drawer with scrim + Escape), `rail` (mini collapsed, optional `expandOnHover`), and `auto` (responsive: permanent on ≥ 768 px viewports, temporary below). Anchors `left` or `right`, three densities, three variants, eleven colors (ten theme palette slots + `surface`) — or any CSS color, e.g. `color="#7c3aed"`. Three named slots — `header`, default (body), `footer` — designed to host a future `<mono-menu>` in the body. Publishes the width it pushes as `--mono-sidebar-{left,right}-push` on the layout content (`.mono-layout-content`, `[mono-layout-content]` or `[mono-sidebar-push]`) so it can pad itself — see [Layout padding](#layout-padding). Demos use the `contained` prop to position absolutely inside a scoped preview pane. Toggle **Vue / CSS** to switch the live demo and source together.

## Permanent

Always-visible sidebar that pushes the main content area to the side.

<DemoSingle name="sidebar" id="permanent" />

## Temporary

Drawer-style sidebar with scrim — Escape, scrim-click, or close button dismiss.

<DemoSingle name="sidebar" id="temporary" />

## Rail

Mini collapsed sidebar (icons only); toggle expands to full width.

<DemoSingle name="sidebar" id="rail" />

## Rail · expand on hover

Rail mode that auto-expands while the cursor is over it.

<DemoSingle name="sidebar" id="rail-on-hover" />

## Rail · manual control

Bind `:rail` to your own state and toggle it from any external button. The default chevron is hidden when the prop is provided.

<DemoSingle name="sidebar" id="manual-rail" />

## Location

Anchor `left` or `right`.

<DemoSingle name="sidebar" id="location" />

## Colors

Pick a colour and every variant takes it — `flat` (no shadow), `elevated` (shadow), `outlined` (border). The picker offers all ten theme roles plus the unpainted `surface` default; each follows the active color preset. `color` also takes any CSS color (`#7c3aed`, `rgb(58, 170, 140)`): the value is painted as-is and the ink on it is derived from its own luminance.

<DemoSingle name="sidebar" id="colors" />

## With nav list

Sidebar housing a brand header, nav list, and footer — the typical app-shell composition.

<DemoSingle name="sidebar" id="with-menu" />

## With iconify icons

Sidebar nav using `mono-menu` with `i-mdi-*` iconify classes — paints SVG masks via `currentColor`.

<DemoSingle name="sidebar" id="iconify" />

## Customized

Override per-element styling via `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="sidebar" id="customized" />

## CSS Variables

<DemoSingle name="sidebar" id="css-vars" />

Every sidebar is themed through `--mono-sidebar-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-sidebar>` and the shadow build. The `density` and `color` props set presets, but an explicit `--mono-sidebar-*` override always wins. To re-skin globally, set the underlying [`--theme-*`](./theme) tokens. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

> `width` / `rail-width` are usually set via the props (they're also exposed as `--mono-sidebar-width` / `--mono-sidebar-rail-width`). The separate `--mono-sidebar-{left,right}-push` are the layout-padding values the sidebar writes for content wrappers — see [Layout padding](#layout-padding).

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-sidebar-accent` | `--theme-primary` | Accent (rail toggle, painted bg); set by `color` |
| `--mono-sidebar-bg` | `--theme-surface` | Panel background (painted by non-`surface` colors) |
| `--mono-sidebar-on-accent` | `--theme-<color>-contrast` | Ink on a painted panel; every softened tint is mixed from it |
| `--mono-sidebar-surface` | `--theme-surface` | Panel / rail-toggle surface |
| `--mono-sidebar-text` | `--theme-text` | Panel text color |
| `--mono-sidebar-text-soft` | text 62% | Muted text / rail-toggle color |
| `--mono-sidebar-border` | `--theme-border` | `outlined` border + rail-toggle border |
| `--mono-sidebar-border-lite` | border 55% | Header/footer/topbar dividers |
| `--mono-sidebar-width` | `264px` | Expanded width (usually via `width` prop) |
| `--mono-sidebar-rail-width` | `64px` | Collapsed rail width (usually via `rail-width` prop) |
| `--mono-sidebar-pad-x` | `0.85rem` | Section horizontal padding (set by `density`) |
| `--mono-sidebar-pad-y` | `0.85rem` | Section vertical padding (set by `density`) |
| `--mono-sidebar-gap` | `0.4rem` | Rail-bar gap (set by `density`) |
| `--mono-sidebar-shadow` | accent glow | `elevated` shadow |
| `--mono-sidebar-scrim-bg` | `--theme-dark` 42% | `temporary` overlay scrim |
| `--mono-sidebar-z` | `50` (`2` when `contained`) | Panel z-index. A `contained` sidebar drops to a local value so it cannot paint over page chrome |

## Types

<DemoTypes name="sidebar" />

## Layout padding

The sidebar publishes the width it pushes the page by as `--mono-sidebar-left-push` / `--mono-sidebar-right-push` (`width` when open, `rail-width` when a rail is collapsed, `0` while it is a temporary overlay). The value is set **only on the layout content**: elements with class `mono-layout-content`, attribute `mono-layout-content`, or attribute `mono-sidebar-push`. `.mono-layout-content` pads itself with it already; on your own wrapper, mark it and read the variable:

```html
<main mono-sidebar-push style="padding-left: var(--mono-sidebar-left-push, 0px)">…</main>
```

The property is **non-inheriting**, so the wrapper's children do not see it — a child that needs it (a seam drawn at the content edge) takes it with `--mono-sidebar-left-push: inherit`. That is the point: a collapse or expand restyles the wrapper, not the whole page. The pre-0.1.3 `--mono-sidebar-{left,right}-width` on `:root` was inherited by every element, so on a page with a large table every toggle made the browser restyle thousands of elements (measured ~1.1–1.6s in Chrome). Set `publish-root-width` to keep writing it for code that still reads it.
