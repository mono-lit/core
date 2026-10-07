# Menu

A recursive nav list — items, collapsible groups, dividers, and subheaders — driven by a single `items` array. Single or multi-select, three densities, eleven colors (ten theme palette slots + `surface`) — or any CSS color, e.g. `color="#7c3aed"`, two style variants (`nav` for the dashboard-pill look, `plain` for a softer subtle fill), badges with status colors, and Iconify icons via `item.icon` (e.g. `i-mdi-view-dashboard`). Designed to fit straight into `<mono-sidebar>`'s body slot to compose a Vuetify-style app shell. Toggle **Vue / CSS** to switch the live demo and source together.

## Basic

Flat list of clickable items with icons and the active item highlighted.

<DemoSingle name="menu" id="basic" />

## Colors

Pick a colour; the active item and hover accent take it.

<DemoSingle name="menu" id="colors" />

## Collapsible groups

Section-style groups whose children expand and collapse on header click.

<DemoSingle name="menu" id="groups" />

## Nested children

Items can have a `children` array — auto-rendered as an indented sub-list with a guide rail.

<DemoSingle name="menu" id="nested" />

## Multi-select

Multiple items can be active at once; `modelValue` becomes a string array.

<DemoSingle name="menu" id="multiple" />

## Iconify icons

`item.icon` strings like `i-mdi-view-dashboard` resolve through UnoCSS preset-icons — works with any [icones.js.org](https://icones.js.org/) collection.

<DemoSingle name="menu" id="with-iconify-icons" />

## Badges

Numeric counts and status pills via `badge` + `badgeColor` on each item.

<DemoSingle name="menu" id="badges" />

## Dividers & subheaders

Section labels and thin rules grouped via the `divider` and `subheader` item types.

<DemoSingle name="menu" id="dividers-subheaders" />

## Plain variant

`nav={false}` for a softer fill on the active item; useful in popovers and dialogs.

<DemoSingle name="menu" id="plain-variant" />

## Customized

Override per-element styling via `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="menu" id="customized" />

## Declarative nesting

Stack `<mono-menu-list>` tags to any depth — each tag is one row, children compose its body slot.

<DemoSingle name="menu" id="nested-elements" />

## Vue Router integration

Real `<a href>` rows give status-bar URL preview, right-click "Open in new tab", and middle-click — intercepted on plain click for SPA navigation via `router.push`.

Set **`controlled`** and bind `model-value` to the current route. In controlled mode the menu emits `click` (so you can `router.push`) but does **not** move the highlight itself — the active row follows `model-value` only. This keeps the highlight in sync with the page even when navigation is slow or async (lazy routes, awaited guards), so the menu can't jump ahead of the route that's actually rendered.

<DemoSingle name="menu" id="with-vue-router" />

## Alias fallback

When an item has no `icon` (and no slot icon), the renderer emits a 1–2 character monogram derived from the title — `Dashboard` → **D**, `Post Budget` → **PB**, `Sales Order Report` → **SO**. This is what rail-mode sidebars show when labels are hidden, so iconless rows still have a visual anchor.

<DemoSingle name="menu" id="aliases" />

## CSS Variables

<DemoSingle name="menu" id="css-vars" />

Every menu is themed through `--mono-menu-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-menu>` and the shadow build. The `density` and `color` props set presets, but an explicit `--mono-menu-*` override always wins. To re-skin globally, set the underlying [`--theme-*`](./theme) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-menu-accent` | `--theme-primary` | Active / hover pill + rail (set by `color`) |
| `--mono-menu-text` | `--theme-text` | Base text color |
| `--mono-menu-text-soft` | text 72% | Row label color |
| `--mono-menu-text-faint` | text 45% | Subtitle / subheader color |
| `--mono-menu-border-lite` | border 55% | Nested-list guide rail / divider |
| `--mono-menu-radius` | `9px` | Row corner radius |
| `--mono-menu-pad-x` | `0.65rem` | Row horizontal padding (set by `density`) |
| `--mono-menu-pad-y` | `0.45rem` | Row vertical padding (set by `density`) |
| `--mono-menu-gap` | `0.6rem` | Gap between icon / label / append (set by `density`) |
| `--mono-menu-font` | `--theme-title-font-sm` | Row font size (set by `density`) |
| `--mono-menu-icon-size` | `1rem` | Icon box size (set by `density`) |
| `--mono-menu-indent` | `1rem` | Nested-list indent (set by `density`) |

## Types

<DemoTypes name="menu" />
