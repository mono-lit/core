# Drawer

A side-anchored overlay panel that slides in from any of the four edges. Use it for detail views, filter panels, or contextual forms that don't deserve a full route. Bind `open` (or use the `model-value` alias) to control visibility, listen to `toggle` for state changes, and pick the slide direction with `position`. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.drawer` (see [Theme](./theme)): a `bg-popover` sheet pinned to one viewport edge that rounds and borders **only the edge facing the content**, with `p-4` header / body / footer regions, over a `bg-black/10 backdrop-blur-xs` scrim, sliding on `duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]`. Two things changed with the port: the tinted gradient header bar and the tinted footer are **gone** (`--mono-drawer-header-bg` / `-footer-bg` and the matching `-border` / `-border-width` put them back), and the footer is now a **stacked column**, upstream's mobile-sheet idiom, which `--mono-drawer-footer-direction: row` reverses. The default ONE flavor sets that row back, so the pre-port action row survives; the tinted bars are restored nowhere, because dropping them is a decision of the port rather than a flavor's. Dark mode is built in.

## Basic

Default right-side drawer with a title, a `subtitle` (the muted description line under it — hidden when empty), a body, and the close button.

<DemoSingle name="drawer" id="basic" />

## Positions

Slide in from left, right, top, or bottom.

<DemoSingle name="drawer" id="positions" />

## Stacked

Set `stackable` to let drawers stack — open a drawer from inside another, any depth. Each new drawer sits above the previous, only one backdrop dims the screen (a stacked one with `overlay="false"` leaves the dim of the one beneath it in place), and <kbd>Esc</kbd> / overlay-click affect only the topmost. Without `stackable` a drawer is **exclusive**: opening one closes any other open drawer.

<DemoSingle name="drawer" id="stacked" />

## Z-index

By default the drawer takes its stacking level from mono's shared popup stack, so the newest layer is always on top. Set `z-index` to pin it instead — for sitting above (or below) something the host app already positions, like a sticky header or a third-party widget. The value is the overlay's level; the panel renders one above it. Accepts `z-index="1500"`, `:z-index="1500"` and `:zIndex="1500"`.

Popups opened *inside* a pinned drawer — a `mono-select`, a `mono-button-dropdown`, a table menu — stack above it automatically: the shared stack resumes its chain from the pinned level rather than from its base. The lower-level `--mono-drawer-z` CSS variable does **not** get that treatment; set it and you own the whole chain.

<DemoSingle name="drawer" id="z-index" />

## Sizes

`size` sets the **content scale** — title type, body type, padding and the close icon — across `xs`, `sm`, `md` (default), `lg`, `xl` and `xxl`. The panel keeps the same width at every step; [`width` / `height`](#width-height) take the same tokens when you want the measure to change too.

::: warning Changed
`size` used to be a dimension preset (`sm` 280px … `full` 100vw) and only partly affected typography. Use `width` / `height` for the panel measure; `size="full"` is now `width="100%"` (left/right) or `height="100%"` (top/bottom).
:::

<DemoSingle name="drawer" id="sizes" />

## Width & height

Set `width` on a left/right drawer, or `height` on a top/bottom one — the other axis is pinned to the viewport edge by `position`. Each accepts a **preset token** (`xs`…`xxl`, below), a CSS length (`"32rem"`, `"60%"`, `"100vw"`), or a number read as `px`.

### Dimension presets

| token | `width` (left / right) | `height` (top / bottom) |
| --- | --- | --- |
| `xs` | `220px` | `22vh` |
| `sm` | `280px` | `30vh` |
| `md` | `420px` — the default | `50vh` — the default |
| `lg` | `560px` | `70vh` |
| `xl` | `720px` | `85vh` |
| `xxl` | `900px` | `95vh` |

These are the drawer's long-standing dimensions, now reachable by name. The tokens are spelled the same as [`size`](#sizes) but are a **different axis**: `size` scales the content, these name a measure — `<mono-drawer size="sm" width="xl">` is a compact, wide drawer. A token on the pinned axis is simply inert.

They are applied as `--mono-drawer-width` / `--mono-drawer-height`, the same channel the resize handle writes to, so `resizeable` keeps working on top of them.

<DemoSingle name="drawer" id="dimensions" />

## Auto full-screen

Set `auto-fullscreen` and the drawer fills the screen on small viewports. It defaults to `sm` (under 640px); pass `md`, `lg`, `xl` or `2xl` to move the boundary. The drawer keeps its `position`, and a `resizeable` one hides its handle while full-screen.

<ClientOnly>
<DemoSingle name="drawer" id="auto-fullscreen" />
</ClientOnly>

## Scroll lock

While open, a drawer locks page scroll — `lock-scroll`, default `true`. Opt out with `:lock-scroll="false"` when the page behind should stay scrollable.

```vue
<mono-drawer v-model="open" :lock-scroll="false" />
```

The lock is shared, not per-instance: overlapping overlays (a modal opened from a drawer, stacked modals, a sidebar) all draw on one lock, so scroll is released only when the **last** one that wanted it closes. `mono-sidebar` takes the same prop.

It is the document **root** that gets `overflow: hidden` (the body too, but that is not the part
that matters). The body's overflow only reaches the viewport while the root's computed overflow is
`visible` — CSS Overflow §3.5 — so any reset that gives `html` an overflow of its own cancels the
propagation and a body-only lock does nothing at all. Vuetify's reset ships
`html { overflow-y: scroll }`; ress and sanitize.css do the same. Locking the root is immune to it.

The declaration is written `!important` on the element itself, because a normal inline style loses
to a stylesheet that claims the root's overflow with `!important` — and apps do that: Vuetify's own
scroll block is `.v-overlay-scroll-blocked:not(html) { overflow-y: hidden !important }`, and a
layout that drives `<html class>` (`.overflow-auto { overflow: auto !important }`) pins it for the
life of the page. That failure is silent in the worst way: `documentElement.style.overflow` reads
`"hidden"`, so every style assertion passes while the page keeps scrolling, because the *computed*
value never changed. An important declaration in the style attribute outranks an important one from
a selector, so it cannot be out-cascaded. Whatever was there before — value and priority — is put
back exactly on close.

The scrollbar goes away with it, and its width is handed back to the body as `padding-right` so
nothing shifts sideways — measured first, because a system with overlay scrollbars has no width to
give back and compensating there would itself be the shift. Deliberately not
`scrollbar-gutter: stable`, which reserves the space in one declaration but leaves Chrome painting
the empty scrollbar track: the page then still looks like it has a scrollbar, which is usually the
whole complaint.

::: warning iOS
`overflow: hidden` does not stop touch scrolling in iOS Safari. Locking there needs
`position: fixed` plus scroll-position save/restore, which brings its own problems (lost position,
focus jumps), so the drawer does not attempt it.
:::


## Resizable

Set `resizeable` to let users resize the drawer by dragging the handle on the panel's inner edge — width for left/right drawers, height for top/bottom. The size is clamped between a minimum and the viewport.

<DemoSingle name="drawer" id="resizeable" />

## Colors

Pick a colour, then open the drawer: the panel's edge and a faint glow under it take the colour, as do the resizer and the close-button hover — it re-paints live, so re-pick while it is open. Without `color` the edge stays neutral and there is no glow.

<DemoSingle name="drawer" id="colors" />

## Header & footer slots

The header is a row: a **heading column** (title over subtitle) and the close ✕ beside it — the same model as `mono-modal`. The slots are:

| Slot | Alias | Renders |
| --- | --- | --- |
| `header` | — | Replaces the whole heading column — title **and** subtitle. Beats the `title` / `subtitle` slots and props. The ✕ stays |
| `title` | — | Replaces the title line (beats the `title` prop) |
| `subtitle` | — | Replaces the subtitle line (beats the `subtitle` prop) |
| `body` | *(default slot)* | Main content — unslotted children land here |
| `footer` | `foot` | Action area under the body |

The header shows whenever there is a title, a subtitle, a `header` slot or the ✕; `:dismissible="false"` drops the ✕.

::: warning Changed
In the light build `slot="title"` used to be a second spelling of `header`. It is now the real title slot — it replaces only the title line, so a `subtitle` still shows under it. The shadow build now supports `title` and `subtitle` too (it only knew `header` before).
:::

<DemoSingle name="drawer" id="slots" />

## Persistent

Overlay click and Escape are ignored — only the close button or programmatic `hide()` will dismiss.

<DemoSingle name="drawer" id="persistent" />

## No overlay

Side panel without a backdrop — page behind stays interactive. A click outside the panel still closes the drawer (`close-on-overlay`, on by default) and reaches the page; `:close-on-overlay="false"` keeps it open.

<DemoSingle name="drawer" id="no-overlay" />

## Event log

Live log of `toggle`, `open` and `close` events with source (overlay / close / escape / manual).

<DemoSingle name="drawer" id="event-log" />

## Customized

Per-element overrides via `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="drawer" id="customized" />

## CSS Variables

<DemoSingle name="drawer" id="css-vars" />

Every drawer is themed through `--mono-drawer-*` custom properties. Because the panel renders through a `<body>` portal, `--mono-drawer-*` set **inline on the `<mono-drawer>` element are forwarded to the portal** (per-instance theming); you can also set them on `:root` to theme every drawer, and they **pierce the shadow-DOM boundary** for the shadow build. The `size` / `position` / `color` props set presets, but an explicit `--mono-drawer-*` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--popover`, `--border`, `--mono-mode-backdrop` …) or switch flavor. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-drawer-bg` (alias `-surface`) / `-text` | `--popover` / `--popover-foreground` | The panel's fill and ink |
| `--mono-drawer-border` / `-border-width` | `--border` / `--mono-border-width` | The one edge that faces the content |
| `--mono-drawer-shadow` | `--mono-shadow-lg` | The panel's elevation. luma and rhea raise it to `--mono-shadow-xl` |
| `--mono-drawer-accent-border` / `--mono-drawer-glow` | accent 35% on `--border` / a 24px halo of the accent at 45% | Only while `color` is set: the edge becomes a thin line of the colour and a faint glow of it sits under the elevation |
| `--mono-drawer-radius` / `-radius-<size>` | `--mono-radius-xl` at md | The two corners on the content-facing edge. lyra and sera square them off |
| `--mono-drawer-inset` / `-inset-radius` / `-inset-border-width` / `-panel-pad` | `0` / inherit / `0` / `0` | Float the panel as a CARD inset from the viewport edge. maia, mira, luma and rhea are exactly this |
| `--mono-drawer-pad-<size>` | 4 × `--mono-spacing` at md (`p-4`) | The padding each of the three regions brings |
| `--mono-drawer-body-pad` | follows `-pad-<size>` | The body alone — set it to `0` for upstream's bare `> section` |
| `--mono-drawer-width` / `-height` / `-max-height` | `min(75%, --mono-container-sm)` / `auto` / `80vh` | The measure — **not** set by `size`; use the `width` / `height` props (a length, or an `xs`…`xxl` token) |
| `--mono-drawer-title-font-<size>` / `-title-weight` / `-title-tracking` / `-title-line-height` / `-title-transform` / `-title-color` | `--mono-text-lg` / semibold / `-0.015em` / `--mono-leading-none` / none / the panel ink | The title. lyra and mira drop it to `text-sm font-medium`; sera sets it `uppercase tracking-wider` |
| `--mono-drawer-subtitle-font` / `-subtitle-color` / `-subtitle-line-height` | the body font (`--mono-text-sm` at md) / `--muted-foreground` / `--mono-leading-normal` | The subtitle — Basecoat's drawer description (`text-muted-foreground text-sm`) |
| `--mono-drawer-body-font-<size>` / `-body-line-height` | `--mono-text-sm` at md | The body copy. lyra and mira use `text-xs/relaxed` |
| `--mono-drawer-header-gap-<size>` / `-footer-gap-<size>` | 1.5 × / 2 × `--mono-spacing` at md | Inside the header row and the footer stack |
| `--mono-drawer-heading-gap` | the header gap | Between the title and the subtitle |
| `--mono-drawer-footer-direction` / `-footer-align` / `-footer-justify` | `column` / `stretch` / `flex-start` | The footer is upstream's STACKED sheet. `row` / `center` / `flex-end` is the pre-port action row, which ONE sets |
| `--mono-drawer-header-bg` (alias `-head-bg`) / `-header-border` / `-header-border-width` | transparent / transparent / `0` | The header BAR — off, because upstream has none. Set the three to bring the pre-port bar back |
| `--mono-drawer-footer-bg` (alias `-foot-bg`) / `-footer-border` / `-footer-border-width` | all off | Likewise for the footer bar |
| `--mono-drawer-close-size-<size>` / `-close-glyph` / `-close-radius` / `-close-bg` / `-close-color` / `-close-opacity` / `-close-hover-opacity` / `-close-hover-bg` | 7 × `--mono-spacing` / `size-4` / `--mono-radius-sm` / transparent / the panel ink / `0.7` / `1` / transparent | The ✕ (an EXTENSION — upstream's drawer has no close button; it borrows the dialog's) |
| `--mono-drawer-overlay-bg` / `-overlay-backdrop-filter` | `--mono-mode-backdrop` (`black/10`) / `blur(--mono-blur-xs)` | The scrim |
| `--mono-drawer-accent` / `-<role>` | `--primary` / the ten roles | The colour the resizer, a restored bar and the ✕ hover draw from (set by `color`) |
| `--mono-drawer-duration` / `-ease` | `500ms` / `cubic-bezier(0.32, 0.72, 0, 1)` | The slide; `0s` for an instant, animation-free drawer |
| `--mono-drawer-z` | `9990` | Base z-index (the popup stack overwrites this per level; prefer the `z-index` prop, and note an inline var still wins over it) |

## Types

<DemoTypes name="drawer" />
