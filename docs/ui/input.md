# Input

A single-line text input with sizes, color and visual variants, validation states, prefix/suffix slots and a clearable button. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.field` / `.input-group` / `.label` (see [Theme](./theme)): a 1px `--input` border, an `xs` shadow, a 3px `--ring` focus ring, `--muted-foreground` placeholder and affixes, and `text-sm` label / message text. Dark mode is built in.

## Basic

Default text input with label, placeholder and helper text.

<DemoSingle name="input" id="basic" />

## Types

`text`, `email`, `password`, `number`, `tel`, `url`, `date`, `time` and `search`.

<DemoSingle name="input" id="types" />

## Formatting

`format-display` changes what the field SHOWS; `format-value` changes what it REPORTS. They are separate props on purpose — a money field shows `10.000.000` and reports `10000000`, so nothing downstream has to know a format was involved.

Each takes a **pattern** or a **function**. A pattern containing `{}` is a text template; anything else is a number pattern in the familiar spreadsheet syntax:

| token | meaning |
| --- | --- |
| `#` | an optional digit |
| `0` | a required digit — pads on commit |
| `,` | turn grouping on |
| `.` | the decimal point |
| `"…"` | a literal, as in `"Rp"#,##0` |
| `{}` | (template) where the typed text goes |

A pattern is a **shape**, not the characters: `#,##0.##` prints `10,000.25` under `en-US` and `10.000,25` under `id-ID`. `format-locale` picks which — leave it unset and you get the runtime default, which is rarely what a business app wants.

`format-value` **normalises** rather than decorates. A number pattern yields a plain numeric string (`"10000000.25"`), so `Number(value)` works; a template yields the assembled string, because there the decoration is the value.

::: warning A numeric format needs `type="text"`
A native `type="number"` input rejects any value that is not a bare number, so the moment a grouping separator appears the browser blanks the field. Use `type="text"` with `inputmode="numeric"` — the demo below does.
:::

<DemoSingle name="input" id="format-number" />

### Bounds

On a field with a **number** format, `min` and `max` clamp the value rather than just annotating it:

```html
<mono-input type="text" inputmode="decimal" max="100"
  format-display="#,##0.##" format-value="#,##0.##" format-locale="id-ID" />
```

`max` applies **as you type** — type `1000` into the field above and it is cut to `100` on the
keystroke, so the field can never be pushed past the ceiling. `min` applies **on commit** only: a
lower bound is crossed on the way to almost every legal value, so clamping it live would make
`min="10"` rewrite your first `1` into `10` and put `15` out of reach.

This is the one place those two props do anything here. Elsewhere they are forwarded to the native
input, and the platform honours them only on `number`, `range` and the date types — never on
`type="text"`, which is exactly what a numeric format requires. Values arriving from outside (a
`model-value` binding, a form write-back) are not clamped; this bounds typing, not data.

`format-on="blur"` holds the raw text while you type and formats on commit. It is the escape hatch for fields where live rewriting fights the typist — the decimal separator being the usual case, since it can be typed freely when nothing reformats underneath.

### Templates and functions

A `{}` template puts the typed text in the hole and keeps the rest literal. The function form — `(ctx) => string`, receiving `{ value, type, locale }` — covers anything the grammar cannot say, and needs a `.prop` binding since a function cannot cross an attribute.

<DemoSingle name="input" id="format-template" />

The event detail carries both: `detail.modelValue` is the value, `detail.displayValue` is the text on screen. A `controlMonoForm` reads `modelValue`, so a bound form stores the normalised value while the field shows the formatted one.

## Sizes

`xs` … `xxl` on the shared control ladder (`--mono-control-height-*`). Text follows the button's steps: `xs` is `text-xs`, `sm`/`md`/`lg` are `text-sm`, `xl` `text-base`, `xxl` `text-lg`. The default size is `text-base` under 48rem (Basecoat's `text-base md:text-sm` — no iOS zoom on focus).

<DemoSingle name="input" id="sizes" />

## Colors

Pick a colour and every variant takes it. `color` sets the **focus** colour — the ring and the focused border. A resting field is always on `--input`, whatever its colour (Basecoat idiom); `primary` focuses with `--ring`, `secondary` with `--muted-foreground`, the rest with their role token.

`outlined` is Basecoat's `.input-group`. The other two borrow their look from two of Basecoat's own styles: `filled` is luma's field (a transparent border on an `--input`/50 surface, no shadow) and `underlined` is sera's (square, only the bottom edge painted, no ring — focus and validation recolour the line). Under the sera flavor the default variant *is* the underline.

<DemoSingle name="input" id="colors" />

## States

Disabled, readonly and required.

<DemoSingle name="input" id="states" />

## Validation

`valid`, `invalid` and `warning` states with messages. `invalid` is Basecoat's `aria-invalid` treatment — a permanent `--destructive` border and /20 ring, the label turns `--destructive` too, and the message carries `role="alert"`; the other two are the same pattern in `--success` / `--warning`.

<DemoSingle name="input" id="validation" />

## Prefix & suffix

Icon or text on either side of the native input.

<DemoSingle name="input" id="prefix-suffix" />

## Clearable

Clear button shown when the value is non-empty.

<DemoSingle name="input" id="clearable" />

## Field alignment

`--mono-control-height-*` is the painted outer height of a control, so `mono-input`,
`mono-select`, `mono-date`, `mono-tag-input` and `mono-button` are exactly the same
height at the same `size` and line up in a form row without any per-field tweaking.

<DemoSingle name="input" id="field-alignment" />

## Event log

Live log of `input`, `change` and `clear` events.

<DemoSingle name="input" id="event-log" />

## Customized

Override per-element styling with the `cssClass` prop (Vue) or extra utility classes (CSS).

<DemoSingle name="input" id="customized" />

## Width & height

Set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` — each takes a CSS string (`"260px"`, `"80%"`) or a number (px). Fields are full width by default; set `width` to constrain.

<DemoSingle name="input" id="dimensions" />

## CSS Variables

<DemoSingle name="input" id="css-vars" />

Every input is themed through `--mono-input-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-input>` and the shadow build. The `color` prop sets the focus colour, but an explicit `--mono-input-ring-color` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--input`, `--ring`, `--radius` …) — or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-input-ring-color` (alias `--mono-input-focus-color`) | `--ring` | Focus colour: the ring and the focused border (set by `color`) |
| `--mono-input-ring-width` / `--mono-input-ring-alpha` | `--mono-ring-width` (3px) / `--mono-ring-alpha` (50%) | Ring geometry |
| `--mono-input-border-color` (alias `--mono-input-rest-border`) | `--input` | Resting border |
| `--mono-input-side-border-color` | = border | The top / left / right edges only (sera and `underlined` set `transparent`) |
| `--mono-input-bg` (alias `--mono-input-surface`) | `--mono-mode-surface` (transparent, dark `--input`/30) | Field background |
| `--mono-input-shadow` | `--mono-shadow-xs` (outlined) | Resting shadow |
| `--mono-input-radius` / `--mono-input-radius-<size>` | `--mono-radius-md` | Corner radius, for every size / one step |
| `--mono-input-height-<size>` | `--mono-control-height-<size>` | Field height per step |
| `--mono-input-padding-x-<size>` | 2.5 × `--mono-spacing` (xs 2, xl 3, xxl 4) | Text inset |
| `--mono-input-font-<size>` / `--mono-input-line-height` (`-<size>`) | `--mono-text-sm` / its line height | Field text |
| `--mono-input-gap` | 3 × `--mono-spacing` | Label ↔ field ↔ message spacing |
| `--mono-input-label-font-size` / `-font-weight` / `-line-height` / `-text-transform` / `-letter-spacing` / `-gap` | `--mono-text-sm` / `--mono-label-font-weight` / 1 / none / normal / 2 × spacing | Label |
| `--mono-input-message-font-size` / `-line-height` | `--mono-text-sm` / `--mono-leading-normal` | Message |
| `--mono-input-affix-padding` / `-gap` / `-font-size` / `-icon-size` | 2 × spacing / 1.5 × spacing / field text / 4 × spacing | Prefix / suffix inset, their gap to the text, text and glyph size |
| `--mono-input-clear-radius` | `calc(var(--radius) - 5px)` | Clear button corner |
| `--mono-input-disabled-bg` / `--mono-input-readonly-bg` | field bg / `--muted` | State surfaces |
| `--mono-input-filled-bg` | `--input`/50 | `filled` surface |
| `--mono-input-outline-{bg,border-color,side-border-color,shadow,ring-width,radius,padding-x,affix-padding}` | unset | The same knobs scoped to the `outlined` variant — what the flavors set |
| `--mono-input-color`, `--mono-input-placeholder`, `--mono-input-muted` | `--foreground`, `--muted-foreground`, `--muted-foreground` | Text, placeholder, affix / message ink |
| `--mono-input-valid` / `--mono-input-invalid` / `--mono-input-warning` | `--success` / `--destructive` / `--warning` | Validation colours |
| `--mono-input-primary` … `--mono-input-info` | the role tokens | The `color` presets |

Deprecated and honoured as no-ops until 2.0: `--mono-input-focus-rgb` (alpha now comes from `--mono-input-ring-alpha`), `--mono-input-underline-glow` (the underline no longer glows — it is sera's line), the per-colour `filled` tints (a flat `--input`/50 for every colour).

## Types

<DemoTypes name="input" />
