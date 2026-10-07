<!-- @unocss-includes -->

# Alert

A callout for a short message: an optional icon, a title and a subtitle, with no header region. Alerts are meant to stack, and the optional ✕ hides one. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.alert` (see [Theme](./theme)): a card surface edged with `--border`, `rounded-lg`, `px-4 py-3` and `text-sm`, with the icon in its own column. Every theme style has its own alert (lyra and mira are compact, luma and rhea are `rounded-2xl`, sera adds a coloured bar on the start edge), and dark mode comes from the colour tokens.

```vue
<mono-alert color="danger" icon="i-mdi-alert-circle-outline"
            title="Unable to process your payment."
            subtitle="Please verify your billing information and try again." />
```

## Basic

<DemoSingle name="alert" id="basic" />

## Variants

The same four looks as the [button](./button): `outline` (the default, Basecoat's alert), `tonal`, `solid` and `text`.

<DemoSingle name="alert" id="variants" />

## Colors

`neutral` (the default) is the plain alert. `danger` is Basecoat's destructive alert, and the same recipe is applied to every other colour.

<DemoSingle name="alert" id="colors" />

## Sizes

`xs` to `xxl`. Every size is the `md` metrics (padding, type, icon, gaps) times one factor, so a theme only tunes `md` and the whole scale follows.

<DemoSingle name="alert" id="sizes" />

## Icon

`icon` takes an iconify class (`i-mdi-information-outline`) or plain text (an emoji, a letter). `slot="icon"` takes any markup.

<DemoSingle name="alert" id="icon" />

## Slots

When more than one is given, the most specific wins:

1. **`slot="body"`** replaces the icon, title and subtitle: the whole content. **Plain children (no `slot` attribute) are the body too.** The ✕ stays.
2. **`slot="title"` / `slot="subtitle"` / `slot="icon"`** each replace one part.
3. **`title` / `subtitle` / `icon` props** are plain text.

<DemoSingle name="alert" id="slots" />

## Clearable & stacking

`clearable` (or `closeable`) adds a ✕. Clicking it hides the alert by setting the element's own `hidden` attribute; no event is involved. `@click` on an alert is just the browser's click, and the ✕ does not trigger it. To show a hidden alert again, remove the `hidden` attribute or re-render it.

Stacked alerts keep a gap between them automatically, and a hidden one takes no room, so the rest move up. Wrap them in `[mono-alert-group]` to lay them out as a column with their own gap.

<DemoSingle name="alert" id="clearable" />

## Nested

Alerts nest. An inner alert is plain content of the outer one, so it is the outer alert's **body**, and the body replaces the outer icon, title and subtitle. To keep a heading on the outer alert, put it in the body next to the inner alerts, as in the demo.

- **Own props:** every inner alert keeps its own colour, size and variant. Nothing is inherited from the outer alert.
- **✕:** each inner ✕ hides only its own alert.
- **Spacing:** consecutive inner alerts get the stacking gap.

<DemoSingle name="alert" id="nested" />

## CSS Variables

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-alert-bg` / `--mono-alert-text` / `--mono-alert-subtext` | `--card` / `--card-foreground` / `--muted-foreground` | Surface, title ink, subtitle ink (neutral outline) |
| `--mono-alert-border-color` / `--mono-alert-border-width` | `--border` / `--mono-border-width` | Edge |
| `--mono-alert-radius` | `--mono-radius-lg` | Corner |
| `--mono-alert-padding-x` / `--mono-alert-padding-y` | 4 × / 3 × `--mono-spacing` | Padding at `md` (other sizes scale it) |
| `--mono-alert-gap` / `--mono-alert-icon-gap` | 0.5 × / 2.5 × `--mono-spacing` | Title↔subtitle gap / icon column gap |
| `--mono-alert-font-size` / `--mono-alert-line-height` | `--mono-text-sm` | Title type |
| `--mono-alert-subtitle-font-size` / `--mono-alert-subtitle-line-height` | `--mono-text-sm` | Subtitle type |
| `--mono-alert-title-weight` | `--mono-font-weight-medium` | Title weight |
| `--mono-alert-icon-size` / `--mono-alert-icon-offset` | 4 × / 0.5 × `--mono-spacing` | Icon box and its nudge onto the first line |
| `--mono-alert-clear-size` | 6 × `--mono-spacing` | The ✕ button |
| `--mono-alert-accent-bar-width` | `0px` (sera: `2px`) | The start-edge bar in the alert's colour |
| `--mono-alert-stack-gap` / `--mono-alert-group-gap` | 3 × `--mono-spacing` | Space between stacked alerts |

## Types

<DemoTypes name="alert" />
