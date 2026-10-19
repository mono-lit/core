# Date

A rich date / datetime / time picker built on [flatpickr](https://flatpickr.js.org/). Set `type` to `date` (default), `datetime`, or `time`. The common flatpickr options are exposed as named props, and the **`options`** prop passes through *any* other flatpickr option — so the picker is completely featured.

`model-value` is the **formatted string** (flatpickr's `dateStr`); the `change` event also carries the raw `Date[]` in `detail.dates`. It shares mono-input's look: sizes, colors, variants, validation, `clearable`, `cssClass`, and the width/height sizing props.

The field is Basecoat's `.input-group` with a leading icon (see [Theme](./theme) and [Input](./input)); the calendar is flatpickr restyled in Basecoat's popover idiom — a `--popover` surface with a 1px `--foreground`/10 ring and an `md` shadow, `--accent` for hover / today / the range middle, `--primary` (or the `color` prop's role token) for the selected day. Dark mode is built in, calendar included.

## Basic

Default date picker with label, placeholder, and value binding.

<DemoSingle name="date" id="basic" />

## Sizes

The `size` prop scales the field from `xs` to `xxl` — the same scale as the other form controls, defaulting to `md`.

<DemoSingle name="date" id="sizes" />

## Colors

Pick a colour and every variant takes it. Every built-in `color` sets the focus ring and the calendar's selected-day accent; a resting field is always on `--input`, like the other ported controls. `primary` focuses with `--ring` and selects with `--primary`.

`outlined` (default), `filled` and `underlined` — the same three field styles as `<mono-input>`. The variant and the colour **combine**: outlined = coloured border, filled = coloured tint, underlined = coloured underline. `filled` is luma's field (transparent border on an `--input`/50 surface) and `underlined` is sera's (square, bottom edge only, no ring).

<DemoSingle name="date" id="colors" />

## States

`disabled` (no open, no selection), `readonly` (display only), and `required` (a `*` next to the label).

<DemoSingle name="date" id="states" />

## Tooltip

When the extra explanation is too long for `helper-text`, put it behind an info icon at the end of the label. `tooltip="…"` takes plain text; `:tooltip.prop="{ content, placement, color, … }"` takes any [tooltip](../addons/tooltip) option. The icon is keyboard-focusable and also works on a disabled field — a good place to say *why* it is disabled.

::: tip Plain text needs nothing extra
`tooltip="…"` (plain text) shows a small built-in bubble — no dependency. It sits above the icon (below when there's no room), stays on screen, and isn't clipped by an `overflow: hidden` parent. It reads the tooltip addon's `--mono-tooltip-bg` / `-color` / `-radius` / `-max-width` / `-font-size` / `-padding-x` / `-padding-y` knobs.

The **object** form is the [tooltip addon](../addons/tooltip) (`mono-tooltip`: placement, color, delay…), which needs the optional peers `pnpm add @floating-ui/dom @floating-ui/core`. Without them an object-form tooltip renders **no icon** (and nothing is logged). Either way the icon only appears beside a label.
:::

<DemoSingle name="date" id="tooltip" />

## Label position

`label-position` moves the label without touching its type or colours:

| value | look |
|---|---|
| `top` | above the box (default) |
| `notched` | outlined: on the top border, `──Label──`. filled / underlined: inset inside the top of the box, which grows by the label's line |
| `left` / `right` | beside the box, centred on its first row; helper / validation messages stay under the box |

Set it for every field at once with `createMonoUI({ 'mono-date': { labelPosition: 'notched' } })`. `--mono-date-label-width` fixes the side column so a stack of `left` fields lines up.

::: tip The notch is a background patch
The notch hides the border with `--background`. On a card or any other surface, set `--mono-date-label-notch-bg` to that surface (e.g. `var(--card)`).
:::

<DemoSingle name="date" id="label-position" />

## Validation position

`validation-position` decides where the validation message (`error` / `success` + `validation-message`) shows. The coloured border is the same in every mode.

| value | look |
|---|---|
| `bottom` | the row under the box (default) — the message replaces the helper text there |
| `icon` | a state icon inside the box; hover or tap it (or keyboard-focus the field) for the message in a state-coloured bubble |
| `float` | nothing until the field is hovered or focused; then the message floats under the box, and disappears again when you leave |

In `icon` and `float` the row under the box keeps the **helper text**, and the message stays there for screen readers only. The bubbles need no dependency (no floating-ui). Knobs: `--mono-validation-invalid-bg` / `-color` (and `warning` / `valid`), `--mono-validation-icon-size`.

<DemoSingle name="date" id="validation-position" />

## Validation

`validation-state` — `error` or `success` (mono-date has no warning/invalid state) — with a `validation-message`. The `error` / `success` booleans + `error-message` / `success-message` work too. `error` is Basecoat's `aria-invalid` treatment: a permanent `--destructive` border and /20 ring, the label turns `--destructive`, the message carries `role="alert"`.

<DemoSingle name="date" id="validation" />

## Clearable

With `clearable`, a clear (✕) button appears whenever a date is selected.

<DemoSingle name="date" id="clearable" />

## Datetime

`type="datetime"` adds a time picker beside the calendar.

<DemoSingle name="date" id="datetime" />

## Time

`type="time"` is a time-only picker (no calendar). `time-24hr` switches to 24-hour mode.

<DemoSingle name="date" id="time" />

## Range

`mode="range"` lets the user pick a start and end date.

<DemoSingle name="date" id="range" />

## Inline

`inline` renders the calendar always-visible, without a popup.

<DemoSingle name="date" id="inline" />

## Typeable

`typeable` lets the user type into the field. mono-date live-parses as you type — the calendar navigates to the value and auto-selects it once a complete date (in `dateFormat`) is entered.

<DemoSingle name="date" id="typeable" />

## Options passthrough

Pass any flatpickr option via the `options` prop (here: week numbers, a custom `dateFormat`, and `minDate`).

<DemoSingle name="date" id="options" />

## Customized

The `cssClass` prop appends a class to each field part (`root` / `label` / `field` / `native` / `message`).

<DemoSingle name="date" id="customized" />

## CSS Variables

<DemoSingle name="date" id="css-vars" />

Themed through `--mono-date-*` custom properties (they inherit and pierce the shadow boundary; the element copies the accent onto the body-level calendar as `--cal-accent`); an explicit `--mono-date-primary` override wins over the `color` prop. The field takes the same knobs as [input](./input#css-variables), renamed `--mono-date-*`; re-skin globally via the [tokens](./theme) or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-date-primary` (+ `--mono-date-primary-foreground`) | `--ring` / `--primary-foreground` (set by `color`) | The accent: focus ring, and the calendar's selected day through `--mono-date-calendar-accent` |
| `--mono-date-ring-color` (alias `--mono-date-focus-color`) / `-ring-width` / `-ring-alpha` | the accent / `--mono-ring-width` / `--mono-ring-alpha` | Focus ring |
| `--mono-date-border-color` (aliases `--mono-date-border`, `--mono-date-rest-border`) / `--mono-date-side-border-color` | `--input` / = border | Resting border; the three non-bottom edges |
| `--mono-date-bg` (alias `--mono-date-surface`) / `--mono-date-shadow` | `--mono-mode-surface` / `--mono-shadow-xs` | Field surface and shadow |
| `--mono-date-radius` / `-radius-<size>`, `--mono-date-height-<size>`, `--mono-date-padding-x(-<size>)`, `--mono-date-padding-y`, `--mono-date-font-<size>`, `--mono-date-line-height(-<size>)`, `--mono-date-gap` | as input | Geometry and text |
| `--mono-date-affix-padding` / `-affix-gap` / `-affix-icon-size` | 2 / 1.5 / 4 × `--mono-spacing` | The leading icon's inset, its gap to the text, its size |
| `--mono-date-clear-radius`, `--mono-date-disabled-bg`, `--mono-date-readonly-bg`, `--mono-date-filled-bg`, `--mono-date-outline-*`, `--mono-date-label-*`, `--mono-date-message-*` | as input | Clear button, state surfaces, variant knobs, label, message |
| `--mono-date-color` (alias `--mono-date-text`), `--mono-date-placeholder`, `--mono-date-muted` | `--foreground`, `--muted-foreground`, `--muted-foreground` | Text, placeholder, icon / message ink |
| `--mono-date-danger` / `--mono-date-success` | `--destructive` / `--success` | Validation colours |
| `--mono-date-calendar-bg` / `-color` / `-radius` / `-shadow` / `-ring` / `-day-radius` | `--popover` / `--popover-foreground` / `--mono-radius-md` / `--mono-shadow-md` / 1px `--foreground`/10 / `--mono-radius-md` | The calendar frame and its day cells |

Deprecated and honoured as no-ops until 2.0: `--mono-date-primary-rgb`, `--mono-date-underline-glow`, `--mono-date-soft`, the per-colour `filled` tints.

## Types

<DemoTypes name="date" />
