# Breadcrumb

A wayfinding component for page hierarchies — pair it with a page header above the title and subtitle. Items render as `<a>` when they include `href`, as `<button>` otherwise; the last item (or any item with `current: true`) becomes the unclickable current marker. Three variants (`default`, `contained`, `underlined`), ten accent colors, six sizes (`xs`–`xxl`), optional truncation, and per-item icon slots cover the v1 surface.

The look is Basecoat's `.breadcrumb` (see [Theme](./theme)): a `flex flex-wrap` `<ol>` stripped of every list default, inked `text-muted-foreground` at `text-sm`, whose segments are **bare links** — `rounded-sm` exists only to shape the focus ring. Two things changed with the port. The **default variant lost its chip**: the pre-port sheet padded every segment into a 5px pill, and that look now lives in `variant="contained"` (`--mono-breadcrumb-pad-x` / `-y` are still the knobs, they just start at 0). And the **current segment is `font-normal`**, as upstream has it, rather than bold. The gradient-and-glow on the contained current crumb is gone too — it is the flat role fill now. Dark mode is built in.

One deliberate deviation: upstream inks hover and the current segment in `--foreground`, full stop. mono's breadcrumb has a `color` prop, so it inks them in the **role** instead — and `color="surface"` resolves the accent back to `--foreground`, which is upstream exactly.

## Basic

Three items separated by ›. Last item is the current page.

<DemoSingle name="breadcrumb" id="basic" />

## Colors

Pick a colour and every variant takes it. `default` / `contained` / `underlined` side-by-side, same items; ten theme colors plus surface, applied to the current item and hover state.

<DemoSingle name="breadcrumb" id="colors" />

## Sizes

`xs` / `sm` / `md` / `lg` / `xl` / `xxl` — affects font, padding, and gap.

<DemoSingle name="breadcrumb" id="sizes" />

## With icons

Items with leading SVG icons (`slot="icon-{id}"` for the Lit element).

<DemoSingle name="breadcrumb" id="with-icons" />

## Separators

Custom separator strings (›, /, •) and a slotted SVG chevron.

<DemoSingle name="breadcrumb" id="separators" />

## Interactive

Clicks emit `click`; the demo logs each click and prevents anchor navigation.

<DemoSingle name="breadcrumb" id="interactive" />

## Truncation

Long path with the `truncate` flag — items overflow to ellipsis instead of wrapping.

<DemoSingle name="breadcrumb" id="truncation" />

## Customized

Per-element overrides via `cssClass` (Vue) or extra utility classes (CSS).

<DemoSingle name="breadcrumb" id="customized" />

## Slot-body composition

Wrap with `<mono-breadcrumb>` for nav semantics + theming, slot a `<mono-breadcrumb-list>` as the body.

<DemoSingle name="breadcrumb" id="composition" />

## Standalone list

`<mono-breadcrumb-list>` used directly with no wrapper — themes itself via modifier attributes.

<DemoSingle name="breadcrumb" id="standalone-list" />

## CSS Variables

<DemoSingle name="breadcrumb" id="css-vars" />

Every breadcrumb is themed through `--mono-breadcrumb-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-breadcrumb>` and the shadow build. The `size`, `color` and `variant` props set presets, but an explicit `--mono-breadcrumb-*` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--muted-foreground`, `--foreground`, the role colours …) or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-breadcrumb-text` / `-text-strong` | `--muted-foreground` / `--foreground` | The row's ink, and the ink `color="surface"` resolves to |
| `--mono-breadcrumb-accent` / `-on-accent` | `--primary` / `--primary-foreground` | Hover, the current segment and the contained fill (set by `color`) |
| `--mono-breadcrumb-<role>` | the ten role tokens | Each role's own slot — `--mono-breadcrumb-danger` defaults to `--destructive`, and so on |
| `--mono-breadcrumb-gap` / `-gap-<size>` | 1.5 × `--mono-spacing` (6px) | The gap between segments |
| `--mono-breadcrumb-gap-wide` / `-gap-wide-<size>` | 2.5 × `--mono-spacing` (10px) | …and what it widens to at `sm:` and above (upstream's `sm:gap-2.5`). nova, lyra and mira drop the step |
| `--mono-breadcrumb-font` / `-font-<size>` / `-line-height` | `--mono-text-sm` | The label type. lyra and mira go `text-xs` |
| `--mono-breadcrumb-font-weight` / `-current-weight` / `-current-transform` / `-current-tracking` | normal / normal / none / normal | Upstream does **not** bold the current segment. ONE restores the bold it had; sera wears its own chrome-label style — `uppercase tracking-wider font-semibold` |
| `--mono-breadcrumb-pad-x` / `-pad-y` | `0` | The segment's padding — 0 because upstream's links are bare |
| `--mono-breadcrumb-contained-pad-x` / `-contained-pad-y` | 2 × / 1 × `--mono-spacing` | …and what the `contained` chip uses instead. maia, luma, sera and rhea widen it to the `px-3` their chrome rows use |
| `--mono-breadcrumb-radius` / `-radius-<size>` | `--mono-radius-sm` | The segment's corner, which the focus ring and the `contained` chip follow. **This is the knob each flavor moves**: 0 at lyra and sera, `lg` at maia, `xl` at luma and rhea |
| `--mono-breadcrumb-icon-size` / `-icon-size-<size>` | 4 × `--mono-spacing` (16px) | The leading-icon box. mira shrinks it |
| `--mono-breadcrumb-sep-font` / `-sep-size` / `-sep-color` | `--mono-text-sm` / 3.5 × `--mono-spacing` / the row ink | The separator. `-sep-size` is upstream's `size-3.5` box — the slot keeps that width even for a text glyph like `›`, which is only ~4px wide and would otherwise leave the labels touching |
| `--mono-breadcrumb-badge-*` | `.badge`'s own shape — h-5, `--mono-radius-4xl`, `text-xs`, `--secondary` | `-height`, `-pad-x`, `-radius`, `-font`, `-weight`, `-bg`, `-color`. Each flavor follows its own badge; sera's is a bare uppercase label |
| `--mono-breadcrumb-surface` / `-border` | `--background` / `--border` | The `contained` segment's fill and edge |
| `--mono-breadcrumb-truncate-width` / `-truncate-width-current` | `12ch` / `18ch` | The ceiling `truncate` clamps a label to. It clamps only — the row still wraps, so a short label is never squeezed to make room |

## Types

<DemoTypes name="breadcrumb" />
