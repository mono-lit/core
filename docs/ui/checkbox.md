<!-- @unocss-includes -->

# Checkbox

A control for boolean / multi-state selection. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.input[type="checkbox"]` (see [Theme](./theme)): a 16px box (4/9 of the control step, so it stays paired with the [input](./input) beside it) with a 1px `--input` border, `rounded-[4px]`, an `xs` shadow, the 3px `--ring` focus ring, and a `--primary` fill with Basecoat's own `--check-icon` when checked; the label is Basecoat's `.label` (`text-sm font-medium leading-snug`, `gap-2`). Dark mode is built in.

## Basic

Default checkbox; optional label and sublabel.

<DemoSingle name="checkbox" id="basic" />

## Label & sublabel

`label` is the main text beside the box, and `sublabel` is the smaller second line under it. `slot="label"` and `slot="sublabel"` replace them with your own markup.

`description` / `slot="description"` still work: `description` is another name for `sublabel`, and both share one value. The same `label` + `sublabel` pair is on [radio](./radio) and [switch](./switch).

## States

Disabled, pre-checked and indeterminate states.

<DemoSingle name="checkbox" id="states" />

## Sizes

Small, medium and large.

<DemoSingle name="checkbox" id="sizes" />

## With input

Each step sits directly below a `mono-input` of the same `size`, which is where a mismatch shows up first. The box tracks the shared [`--theme-control-height-*`](./theme) token at half height, and the label, description and gap scale with it.

<DemoSingle name="checkbox" id="with-input" />

## Colors

Pick a colour and every state takes it — the checked box, the indeterminate bar and the disabled row re-paint live.

<DemoSingle name="checkbox" id="colors" />

## Group

Simple group layout.

<DemoSingle name="checkbox" id="group" />

## Slots

Custom label/sublabel via slots.

<DemoSingle name="checkbox" id="custom" />

## Event: change

Listen for change events.

<DemoSingle name="checkbox" id="event-change" />

## Controlled

Drive the value imperatively.

<DemoSingle name="checkbox" id="event-controlled" />

## Indeterminate toggle

Toggle the indeterminate flag.

<DemoSingle name="checkbox" id="event-indeterminate" />

## Select-all group

Master checkbox + members.

<DemoSingle name="checkbox" id="event-group" />

## Event log

Live log of emitted events.

<DemoSingle name="checkbox" id="event-log" />

## Customized

Custom checkbox with advanced styling.

<DemoSingle name="checkbox" id="customized" />

## CSS Variables

<DemoSingle name="checkbox" id="css-vars" />

Every checkbox is themed through `--mono-checkbox-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-checkbox>` and the shadow build. The `color` prop sets the accent, but an explicit `--mono-checkbox-accent` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--input`, `--primary`, `--ring` …) — or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-checkbox-accent` / `--mono-checkbox-icon` | `--primary` / `--primary-foreground` (set by `color`) | Box fill + border when checked / indeterminate, and the glyph on it |
| `--mono-checkbox-bg` | `--mono-mode-surface` (transparent, dark `--input`/30) | Box background when unchecked |
| `--mono-checkbox-border-color` (alias `--mono-checkbox-border`) / `--mono-checkbox-border-width` | `--input` / `--mono-border-width` (1px) | Box border |
| `--mono-checkbox-radius` | `4px` | Box corner (Basecoat's `rounded-[4px]`; a percentage still works) |
| `--mono-checkbox-shadow` | `--mono-shadow-xs` | Resting box shadow |
| `--mono-checkbox-ring-color` / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | Focus-visible ring |
| `--mono-checkbox-check-icon` / `--mono-checkbox-glyph` | `--check-icon` / `87.5%` | The default check mask and its share of the box |
| `--mono-checkbox-size-<size>` | `--mono-control-height-<size>` × 4/9 | The box, per step |
| `--mono-checkbox-gap` (or `-gap-<size>`) | 2 × `--mono-spacing` at md, 1.25 → 3.5 across the scale | Gap between box and label |
| `--mono-checkbox-label-font-<size>` / `--mono-checkbox-label-font-weight` / `--mono-checkbox-label-line-height` | `--mono-text-sm` at md / `--mono-label-font-weight` / `--mono-leading-snug` | Label |
| `--mono-checkbox-description-font-<size>` | 13px at md | Description |
| `--mono-checkbox-text` / `--mono-checkbox-description` | `--foreground` / `--muted-foreground` | Label / description ink |

Deprecated and honoured as no-ops until 2.0: `--mono-checkbox-border-hover` (Basecoat has no hover on the box), `--mono-checkbox-ring` (use `-ring-color`), `--mono-checkbox-accent-soft`.

## Types

<DemoTypes name="checkbox" />
