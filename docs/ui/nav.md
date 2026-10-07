# Nav

A sticky top app bar built around three named slots — `start`, default (center), and `end` — plus an optional `extension` second row. Three densities (compact / comfortable / default), three variants (flat / elevated / outlined), and eleven colors (ten palette roles + `surface`) — or any CSS color, e.g. `color="#7c3aed"`. Writes its resolved height to `--mono-nav-height` on `:root` so layout wrappers can pad themselves without prop drilling. Toggle **Vue / CSS** to switch the live demo and source together.

Basecoat ships **no nav component** — `basecoat-css@1.0.2` has dialog, drawer, sidebar, tabs and the rest, but no header bar — so this is an **extension**. What it *does* ship is a wide rectangular surface with an edge and an elevation, and that is exactly what a top bar is: **the nav's chrome tracks [`.card`](./card) value for value** — radius, ring, elevation, gutter and type — so every flavor's nav delta is its card delta. sera's bar is square, roomy and shadow-sm; maia's is `rounded-2xl` and flat; luma's is the `rounded-4xl` pill with `shadow-md`; lyra's is square, tight and `text-xs`. Put a nav above a card and the two edges line up.

The bar's own ladder — three densities, three variants, the extension row — is mono's, and `.sidebar nav` supplies the chrome ink (`--sidebar` for the fill, the bar ink at 70% for muted copy, `--sidebar-border` for the extension hairline). A coloured bar paints in the role and inks in that role's `-foreground`, the way `.btn[data-variant="primary"]` does. The two-stop brand gradients, the `--*-rgb` triples and the hand-rolled contrast maths are gone, and dark mode comes free.

::: tip A full-bleed bar wants no corners
The bar inherits the card's radius and the card's inset ring, which is right inside a page frame and wrong flush against the viewport. At the very top of a page, set `--mono-nav-radius: 0` and `--mono-nav-ring-width: 0`.
:::

## Basic

Sticky top bar with a brand on the left and an avatar on the right.

<DemoSingle name="nav" id="basic" />

## Density

`compact` (48 px), `comfortable` (56 px), `default` (64 px).

<DemoSingle name="nav" id="density" />

## Colors

Pick a colour and every variant takes it. Six themed accents plus the white surface default, across `flat` (no shadow), `elevated` (shadow) and `outlined` (bottom border).

<DemoSingle name="nav" id="colors" />

## Extension row

Second row beneath the main bar via the `extension` slot — useful for tabs or breadcrumbs.

<DemoSingle name="nav" id="with-extension" />

## Non-sticky

Inline header that scrolls with the page.

<DemoSingle name="nav" id="non-sticky" />

::: warning Sticky not sticking? Check the ancestors' `overflow`
`sticky` defaults to `true` and applies `position: sticky; top: 0` — but a sticky element
sticks to its nearest **scroll container**, not necessarily the viewport. **Any** ancestor with
`overflow` set to `hidden`, `auto` or `scroll` on *either* axis becomes that container and
captures the nav.

The usual culprit is a page wrapper with `overflow-x-hidden`. Per CSS overflow, when one axis
is not `visible` the other computes from `visible` to **`auto`** — so `overflow-x-hidden`
silently makes the `<div>` a scroll container. Its height is content-driven, so it never
scrolls internally: the nav gets zero scroll range and rides the document scroll away.

**Fix:** use `overflow-x: clip`. It suppresses horizontal overflow the same way but is *not* a
scroll container, so `overflow-y` stays `visible`. (`presetWind4` ships the `overflow-x-clip`
utility.)

```diff
-  <div class="bg-white relative overflow-x-hidden w-full">
+  <div class="bg-white relative overflow-x-clip w-full">
```

Measured in a real layout chain: with `hidden` the nav moved `top 0 → -604px` over an 800px
scroll; with `clip` it held at `top 0`.
:::

## Dashboard top bar

The nav is only layout, so everything in its three regions is a real component: two `<mono-button icon-only>`s (one badged), a `<mono-input>` with a slotted prefix icon, and a `<mono-dropdown>` whose body is a column of text buttons. The **Shadow** tab shows the mix a real app ends up with — the bar is the shadow build, its slotted children stay light, and the slot is the boundary. The **CSS** tab is the same bar in four attribute contracts at once, with no Lit on the page.

<DemoSingle name="nav" id="with-actions" />

## Layout var

Reads `--mono-nav-height` from `:root` to auto-pad the page below the bar.

<DemoSingle name="nav" id="layout-var" />

## Customized

Override per-section styling via `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="nav" id="customized" />

## CSS Variables

<DemoSingle name="nav" id="css-vars" />

Every nav is themed through `--mono-nav-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-nav>` and the shadow build. The `density`, `color` and `variant` props set presets, but an explicit `--mono-nav-*` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--sidebar`, `--border`, the role colours …) or switch flavor.

> The bar height knob is **`--mono-nav-bar-height`** — `--mono-nav-height` is the separate layout-padding value the nav writes to `:root` for `.mono-layout-content`.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-nav-surface` | `--sidebar` (which *is* `--card`) | The unpainted bar's fill |
| `--mono-nav-radius` | the card's — `--mono-radius-xl` at vega | Bar corner radius. **This is the knob each flavor moves**: 0 at lyra and sera, `2xl` at maia, `3xl` at rhea, `4xl` at luma |
| `--mono-nav-ring-color` / `-ring-width` | `--foreground`/10 / `--mono-border-width` | The card's `ring-1`, drawn INSIDE the box so nothing clips it. luma, sera and rhea fade it to /5; `0` width removes it |
| `--mono-nav-border` | the ring colour | The `outlined` variant's bottom rule — the one piece of nav chrome the card has no counterpart for |
| `--mono-nav-bg` / `-text` | the surface / `--sidebar-foreground` | The bar's fill and ink — a colour role re-points both |
| `--mono-nav-text-soft` | the bar ink at 70% | Muted / secondary ink, upstream's `text-sidebar-foreground/70` |
| `--mono-nav-border-lite` | `--sidebar-border` | The hairline above the extension row |
| `--mono-nav-accent` / `-on-accent` | `--primary` / `--primary-foreground` | The colour in play and the ink that sits on it (set by `color`) |
| `--mono-nav-<role>` | the ten role tokens | Each role's own slot — `--mono-nav-danger` defaults to `--destructive`, and so on |
| `--mono-nav-bar-height` / `-bar-height-<density>` | 14 × `--mono-spacing` (56px) at comfortable | The bar row's height. Flavors follow their card's vertical rhythm: 48 where the card is `py-4`, 52 at `py-5`, 64 at `py-8` |
| `--mono-nav-extension-height` / `-extension-height-<density>` | 11 × `--mono-spacing` (44px) | The second row's height |
| `--mono-nav-pad-x` / `-pad-x-<density>` | the card's `px-6` (24px) at comfortable | The bar's gutter. The compact and default steps **scale from the comfortable one**, so `--mono-nav-pad-x-comfortable` alone moves all three |
| `--mono-nav-gap` / `-gap-<density>` | 3 × `--mono-spacing` (12px) | The gap between items; the end region uses 70% of it |
| `--mono-nav-font` / `-font-<density>` | `--mono-text-sm` | The bar's type. lyra and mira drop it to `text-xs` |
| `--mono-nav-extension-font` / `-extension-font-<density>` | `--mono-text-sm` | The second row's type |
| `--mono-nav-shadow` | the card's — `--mono-shadow-xs` at vega | The `elevated` elevation, on top of the ring. nova, maia, lyra and mira drop it; sera and rhea take `sm`, luma `md`; ONE restores its own |
| `--mono-nav-border-width` | `--mono-border-width` | The `outlined` rule's and the extension hairline's thickness |
| `--mono-nav-backdrop-filter` | `none` | Opt back in to the pre-port translucent blurred bar |
| `--mono-nav-z` | `30` | The sticky bar's layer |

## Types

<DemoTypes name="nav" />
