# Textarea

A multi-line text input with sizes, color and visual variants, validation states, slot-overridable label and helper, JS-driven auto-resize, and an optional character counter. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.textarea` inside a `.field` (see [Theme](./theme)): a `rounded-md` box with a 1px `--input` border, an `xs` shadow, `px-2.5 py-2` and `text-sm`, with the 3px `--ring` focus ring the [input](./input) uses. Where upstream pins a flat `min-h-16`, mono derives the height from the control step — `T + (rows - 1) x line` — so a textarea starts its first line on the same baseline as an input beside it and reads as "one input tall, plus N-1 lines". Dark mode is built in.

## Basic

Default textarea with label, placeholder and helper text.

<DemoSingle name="textarea" id="basic" />

## Sizes

Small, medium and large.

<DemoSingle name="textarea" id="sizes" />

## Colors

Pick a colour and every variant takes it — all built-in colours, combined with `outlined`, `filled` and `underlined`.

`underlined` focuses with a soft glow under the line rather than a ring around the field — tune it with `--mono-textarea-underline-glow` (default `0 5px 6px -6px`).

<DemoSingle name="textarea" id="colors" />

## States

Disabled, readonly and required.

<DemoSingle name="textarea" id="states" />

## Validation

`valid`, `invalid` and `warning` states with messages.

<DemoSingle name="textarea" id="validation" />

## Auto resize

Grow with content between `min-rows` and `max-rows`.

<DemoSingle name="textarea" id="autoresize" />

## Counter

Live character count via `show-counter` and `max-length`.

<DemoSingle name="textarea" id="counter" />

## Slots

Custom label and helper content via named slots.

<DemoSingle name="textarea" id="slots" />

## Event log

Live log of `input` and `change` events.

<DemoSingle name="textarea" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or extra utility classes (CSS).

<DemoSingle name="textarea" id="customized" />

## Width & height

Set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` — each takes a CSS string (`"320px"`, `"80%"`) or a number (px). Fields are full width by default; set `width` to constrain.

<DemoSingle name="textarea" id="dimensions" />

## CSS Variables

<DemoSingle name="textarea" id="css-vars" />

Every textarea is themed through `--mono-textarea-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-textarea>` and the shadow build. The `color` prop sets the focus colour, but an explicit `--mono-textarea-ring-color` (or the legacy `-focus-color`) always wins. To re-skin globally, set the underlying [tokens](./theme) (`--input`, `--ring`, `--destructive` …) — or switch flavor. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-textarea-ring-color` (alias `-focus-color`) / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | The focus ring (set by `color`) |
| `--mono-textarea-border-color` (alias `-rest-border`) / `-border-width` | `--input` / `--mono-border-width` | Field border |
| `--mono-textarea-bg` (alias `-surface`) | `--mono-mode-surface` (transparent, dark `--input`/30) | Field background |
| `--mono-textarea-shadow` / `--mono-textarea-radius` | `--mono-shadow-xs` / `--mono-radius-md` | Field shadow and corner |
| `--mono-textarea-padding-x-<size>` / `--mono-textarea-padding-y` | 2.5 × `--mono-spacing` at md / derived | Field padding (the Y is `(T - line) / 2 - border`) |
| `--mono-textarea-font-<size>` / `--mono-textarea-line-height` | `--mono-text-sm` at md / `--mono-leading-normal` | Field type |
| `--mono-textarea-rows-<size>` (or `-rows`) | 4 at md, 3 at xs/sm | How many lines the resting box shows |
| `--mono-textarea-height-<size>` / `--mono-textarea-min-height` | `--mono-control-height-<size>` / derived | The `T` in the derivation, or an outright override |
| `--mono-textarea-resize` | `vertical` (`none` while `auto-resize`) | The resize grip |
| `--mono-textarea-gap` | 3 × `--mono-spacing` | Label ↔ field ↔ footer |
| `--mono-textarea-label-*` / `--mono-textarea-message-*` / `--mono-textarea-counter-font-size` | `--mono-text-sm` / `--mono-text-sm` / `--mono-text-xs` | Label, message and counter type |
| `--mono-textarea-text` / `-placeholder` / `-muted` | `--foreground` / `--muted-foreground` | Ink |
| `--mono-textarea-valid` / `-invalid` / `-warning` | `--success` / `--destructive` / `--warning` | Validation colours |
| `--mono-textarea-filled-bg` / `-disabled-bg` / `-readonly-bg` | `--input`/50 / — / `--muted` | The `filled` variant and the two read-only-ish states |

Deprecated and honoured as no-ops until 2.0: `--mono-textarea-focus-rgb` and every other `*-rgb` (use `color-mix`), `--mono-textarea-underline-glow` (the `underlined` variant rides the bottom edge now), `--mono-textarea-background` (use `-bg`), `--mono-textarea-border` (use `-border-color`).

## Types

<DemoTypes name="textarea" />
