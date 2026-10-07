<!-- @unocss-includes -->

# Card

A surface for grouping related content with optional header and footer actions. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.card` (see [Theme](./theme)): a `--card` surface at `rounded-xl`, edged with a 1px `--foreground`/10 **ring** rather than a border (drawn inside the box, so no clipping ancestor can eat it), an `xs` shadow and `text-sm` type, with `gap-6 py-6` and every region inset `px-6` so a media band can run full-bleed between them. Dark mode is built in.

## Basic

Simple card with optional title and subtitle.
<DemoSingle name="card" id="basic" />

## Title & subtitle

The header text comes from three places. When more than one is given, the most specific wins:

1. **`slot="header"`** replaces the whole left side of the header: the icon, the title and the subtitle.
2. **`slot="title"` / `slot="subtitle"`** each replace one line.
3. **`title` / `subtitle` props** are plain text.

The old prop names `heading` / `subheading` are still accepted as aliases of `title` / `subtitle`.

<DemoSingle name="card" id="header-slot" />

## Nested

Cards stack freely inside other cards — including behind `v-if` / `v-for` and while dynamic content mounts.

<DemoSingle name="card" id="nested" />

## Colors

Pick a colour and every variant takes it. Elevated, outlined, flat, tonal and glass looks. `outlined` is Basecoat's `.card` exactly (the ring plus an `xs` shadow); `elevated` — the default — swaps that shadow for `md`. **The `gradient` variant was removed with the Basecoat port**: the design system has no colour gradients, and `tonal` is the tinted surface that replaces it.

The colour accents the ring and the title (`tonal` tints its whole surface); `neutral` — the default — leaves the card unpainted.

<DemoSingle name="card" id="colors" />

## States

Bordered, hoverable, clickable and disabled.

<DemoSingle name="card" id="states" />

## Actions

Footer actions slot with multiple buttons.

<DemoSingle name="card" id="actions" />

## Event: click

Listen for `click` on a clickable card.

<DemoSingle name="card" id="event-click" />

## Event: toggle

Use the click event to switch the card variant.

<DemoSingle name="card" id="event-toggle" />

## Event log

Live log of `click` events, distinguishing mouse vs keyboard.

<DemoSingle name="card" id="event-log" />

## Dynamic content

`v-if`, `v-else-if`, `v-for`, `<template>` blocks and `<Teleport>` work normally inside a card (including the "empty card that fills once a query resolves" shape). Wrap a bare `v-if` child in a `<template>` or a stable element, or use `@mono-lit/helper/ui/shadow/card` for no constraints.

## Customized

Override per-element styling with the `cssClass` prop (Vue) or extra utility classes (CSS).

<DemoSingle name="card" id="customized" />

## Sizes

`size` sets the **content scale** — padding, title and subtitle type, the header / actions / subtitle gaps and the header icon box — across `xs`, `sm`, `md` (default), `lg`, `xl` and `xxl`. It does **not** change the card's width — every card in the demo below is the same width, only the density inside differs. Use `width` when you want a different measure, so a compact `xs` card can still be wide. Corner radius stays with `rounded`.

::: warning Changed
`size` used to be a 3-step density scale (`compact` / `md` / `comfortable`) that only changed the padding. `compact` is roughly `sm` and `comfortable` roughly `lg`; `md` is unchanged, so cards that never set `size` look exactly the same.
:::

<DemoSingle name="card" id="sizes" />

## Width & height

Set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` — each takes a CSS string (`"320px"`, `"80%"`) or a number (px). Use `width="100%"` for a full-width card (replaces the old `fullWidth`).

<DemoSingle name="card" id="dimensions" />

## CSS Variables

<DemoSingle name="card" id="css-vars" />

Themed through `--mono-card-*` custom properties (they inherit and pierce the shadow boundary); an explicit `--mono-card-*` override wins over the `size` / `rounded` / `color` props. To re-skin globally, set the underlying [tokens](./theme) (`--card`, `--foreground`, `--primary` …) — or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-card-bg` / `--mono-card-text` / `--mono-card-subtext` | `--card` / `--card-foreground` / `--muted-foreground` | Surface, body ink, subtitle ink |
| `--mono-card-ring-color` / `-ring-width` | `--foreground`/10 / `--mono-border-width` | The card's edge. Basecoat **rings** the card rather than bordering it, but draws that ring OUTSIDE the box, where any clipping ancestor (a stage with `overflow: hidden`, a scroller, the viewport itself) eats it — so mono draws the same hairline as an `outline` with a negative offset: inside the box, painted above a full-bleed media band, and unclippable. `bordered` adds a real border on top |
| `--mono-card-border-color` / `-border-width` | `--border` / `--mono-border-width` | That extra border, when `bordered` |
| `--mono-card-divider-color` | `--border` | Header / footer divider |
| `--mono-card-radius` | `--mono-radius-xl` | Corner (set by `rounded`, **not** `size`) |
| `--mono-card-shadow` / `-shadow-elevated` / `-shadow-hover` | `xs` / `md` / `lg` | Resting, `elevated` and hover elevation |
| `--mono-card-padding-<size>` (or `-padding` for all) | 6 × `--mono-spacing` at md, 4 at sm | Block padding and every region's inset |
| `--mono-card-gap-<size>` (or `-gap`) | same as the padding | Gap between regions |
| `--mono-card-header-gap-<size>` / `-actions-gap-<size>` | 1 × / 2 × `--mono-spacing` | Title↔subtitle gap / action gap |
| `--mono-card-font-<size>` / `-title-font-<size>` / `-subtitle-font-<size>` | `--mono-text-sm` / `--mono-text-base` / `--mono-text-sm` | Body, title and subtitle type |
| `--mono-card-title-font-weight` / `-title-tracking` / `-title-transform` / `--mono-card-title-color` | `--mono-font-weight-medium` / normal / none / the accent when `color` is set | Title weight, tracking, case and ink (the `sera` flavor sets all three) |
| `--mono-card-accent` | `--neutral` (set by `color`) | Ring tint, title tint, icon box, spinner |
| `--mono-card-icon-size-<size>` / `--mono-card-icon-glyph` / `--mono-card-icon-radius` | 9 × `--mono-spacing` / `55%` / `--mono-radius-md` | Header icon box |
| `--mono-card-focus-ring-color` / `-width` / `-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | Focus-visible ring |
| `--mono-card-loading-bg` / `-loading-blur` / `-spinner-size` / `-spinner-width` / `-spinner-speed` | `--card`/58 / 2px / 22px / 2px / 0.65s | Loading veil and spinner |
| `--mono-card-glass-bg` / `-glass-border` / `-glass-blur` | `--card`/45 / `--foreground`/12 / 12px | `glass` variant |

Deprecated and honoured as no-ops until 2.0: `--mono-card-accent-rgb` and the `--mono-card-{primary,secondary,…}` palette mirrors (read the [role tokens](./theme) instead), `--mono-card-bg-soft`, `--mono-card-border-soft` (use `-divider-color`), `--mono-card-elevated-border-color`, `--mono-card-hover-lift` (Basecoat does not lift on hover), `--mono-card-focus-ring-offset`, `--mono-card-subtitle-gap` (the header is a grid with one gap), `--mono-card-icon-inner-size` (use `-icon-glyph`), and every `--mono-card-gradient-*`.

## Types

<DemoTypes name="card" />
