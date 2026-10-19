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

## Tooltip

When the extra explanation is too long for `helper-text`, put it behind an info icon at the end of the label. `tooltip="…"` takes plain text; `:tooltip.prop="{ content, placement, color, … }"` takes any [tooltip](../addons/tooltip) option. The icon is keyboard-focusable and also works on a disabled field — a good place to say *why* it is disabled.

::: tip Plain text needs nothing extra
`tooltip="…"` (plain text) shows a small built-in bubble — no dependency. It sits above the icon (below when there's no room), stays on screen, and isn't clipped by an `overflow: hidden` parent. It reads the tooltip addon's `--mono-tooltip-bg` / `-color` / `-radius` / `-max-width` / `-font-size` / `-padding-x` / `-padding-y` knobs.

The **object** form is the [tooltip addon](../addons/tooltip) (`mono-tooltip`: placement, color, delay…), which needs the optional peers `pnpm add @floating-ui/dom @floating-ui/core`. Without them an object-form tooltip renders **no icon** (and nothing is logged). Either way the icon only appears beside a label.
:::

<DemoSingle name="input" id="tooltip" />

## Label position

`label-position` moves the label without touching its type or colours:

| value | look |
|---|---|
| `top` | above the box (default) |
| `notched` | outlined: on the top border, `──Label──`. filled / underlined: inset inside the top of the box, which grows by the label's line |
| `left` / `right` | beside the box, centred on its first row; helper / validation messages stay under the box |

Set it for every field at once with `createMonoUI({ 'mono-input': { labelPosition: 'notched' } })`. `--mono-input-label-width` fixes the side column so a stack of `left` fields lines up.

::: tip The notch is a background patch
The notch hides the border with `--background`. On a card or any other surface, set `--mono-input-label-notch-bg` to that surface (e.g. `var(--card)`).
:::

<DemoSingle name="input" id="label-position" />

## Validation position

`validation-position` decides where the validation message (`invalid` / `warning` / `valid` + `validation-message`) shows. The coloured border is the same in every mode.

| value | look |
|---|---|
| `bottom` | the row under the box (default) — the message replaces the helper text there |
| `icon` | a state icon inside the box; hover or tap it (or keyboard-focus the field) for the message in a state-coloured bubble |
| `float` | nothing until the field is hovered or focused; then the message floats under the box, and disappears again when you leave |

In `icon` and `float` the row under the box keeps the **helper text**, and the message stays there for screen readers only. The bubbles need no dependency (no floating-ui). Knobs: `--mono-validation-invalid-bg` / `-color` (and `warning` / `valid`), `--mono-validation-icon-size`.

<DemoSingle name="input" id="validation-position" />

## Validation

`valid`, `invalid` and `warning` states with messages. `invalid` is Basecoat's `aria-invalid` treatment — a permanent `--destructive` border and /20 ring, the label turns `--destructive` too, and the message carries `role="alert"`; the other two are the same pattern in `--success` / `--warning`.

<DemoSingle name="input" id="validation" />

## Prefix & suffix

Icon or text on either side of the native input.

<DemoSingle name="input" id="prefix-suffix" />

## Clearable

Clear button shown when the value is non-empty.

<DemoSingle name="input" id="clearable" />

## File

`type="file"` gives a classic one-line file picker. It behaves like `mono-file-upload` but has no dropzone and no file list. The field shows the picked name(s) read-only and has an upload icon (`i-mdi-cloud-upload-outline`) at the end. A click on the field or the icon, or <kbd>Enter</kbd> / <kbd>Space</kbd> while it is focused, opens the native dialog.

- **Value**: `modelValue` is the picked `File` (`null` when empty). With `multiple` it is `File[]` and the names are comma-joined. A file object cannot cross an attribute, so bind it with `:model-value.prop`. A bound `controlMonoForm` receives the `File` as is, ready for `FormData`.
- **`accept`**: passed to the native picker, e.g. `accept=".pdf,image/*"`.
- **`max-file-size`**: a size limit in bytes. Each oversized file is dropped and reported through `error` (`{ message, reason: 'max-file-size', file, maxFileSize }`, the same shape `mono-file-upload` uses). When every picked file is rejected, the previous value stays.
- **`clearable`**: the × resets the value to `null` (or `[]` with `multiple`) and emits `input`, `change` and `clear`.
- **Events**: `input` and `change` both fire on a pick. `detail.files` always holds the files as an array.

<DemoSingle name="input" id="file" />

## Range

`type="range"` is Basecoat's slider (`.field > input[type='range']`). It has no bordered box: the track fills with the `color` prop's accent, and the thumb sits on it. Each Basecoat style draws its own track and thumb, from vega's white dot on a 6px track to luma's pill or sera's square.

Under **ONE** (the default) it follows the EJI guide's `.eji-range` instead. The track is a 4px line with no fill. The thumb is a 16px navy dot with a white rim. The label row is 12px and ends in the value, shown in bold navy mono figures.

- **Value**: `modelValue` is the number as a string (`"5"`), with the native `min` (default 0), `max` (default 100) and `step` (default 1). `input` fires while dragging, `change` on release. An empty value is shown at the midpoint, as the native slider does, and the model is not rewritten.
- **Readout**: on by default, because the guide never shows a slider without its number. With a label, the value sits at the end of the label row. Without one, it follows the slider. `show-value="false"` hides it.
- **`format-display`** shapes only the readout (and `aria-valuetext`). The native value stays a bare number. Use `format-display="{}%"`, a number pattern such as `'"Rp "#,##0'` with `format-locale="id-ID"`, or a function: `:format-display.prop="({ value }) => …"`.
- `disabled` fades the slider. `readonly` keeps it focusable but puts the thumb back on any move. `clearable` has no effect.
- Restyle through `--mono-input-range-*`: `track-height`, `track-bg`, `fill`, `thumb-size`, `thumb-bg`, `thumb-border-*`, `thumb-ring-*`, `ring-width`, `value-color`, and more (see the CSS variables table). `size` scales the thumb and track.

<DemoSingle name="input" id="range" />

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
| `--mono-input-label-width` / `-label-side-gap` | auto / 3 × spacing | `label-position` left / right column |
| `--mono-input-label-notch-font-size` / `-label-notch-bg` | `--mono-text-xs` / `--background` | `label-position="notched"` |
| `--mono-input-message-font-size` / `-line-height` | `--mono-text-sm` / `--mono-leading-normal` | Message |
| `--mono-input-affix-padding` / `-gap` / `-font-size` / `-icon-size` | 2 × spacing / 1.5 × spacing / field text / 4 × spacing | Prefix / suffix inset, their gap to the text, text and glyph size |
| `--mono-input-clear-radius` | `calc(var(--radius) - 5px)` | Clear button corner |
| `--mono-input-disabled-bg` / `--mono-input-readonly-bg` | field bg / `--muted` | State surfaces |
| `--mono-input-filled-bg` | `--input`/50 | `filled` surface |
| `--mono-input-outline-{bg,border-color,side-border-color,shadow,ring-width,radius,padding-x,affix-padding}` | unset | The same knobs scoped to the `outlined` variant — what the flavors set |
| `--mono-input-color`, `--mono-input-placeholder`, `--mono-input-muted` | `--foreground`, `--muted-foreground`, `--muted-foreground` | Text, placeholder, affix / message ink |
| `--mono-input-valid` / `--mono-input-invalid` / `--mono-input-warning` | `--success` / `--destructive` / `--warning` | Validation colours |
| `--mono-input-primary` … `--mono-input-info` | the role tokens | The `color` presets |
| `--mono-input-accent` | `--primary` (set by `color` / a validation state) | `type="range"`: the fill and thumb colour |
| `--mono-input-range-track-height` / `-track-radius` / `-track-bg` / `-fill` | 0.375rem / full / `--muted` / the accent | `type="range"`: the track, and its filled part |
| `--mono-input-range-thumb-size` / `-thumb-width` / `-thumb-radius` / `-thumb-bg` | 1rem / = size / full / white | `type="range"`: the thumb (border-box) |
| `--mono-input-range-thumb-border-width` / `-border-color` / `-ring-width` / `-ring-color` / `-shadow` | 1px / the accent / 0 / – / `--mono-shadow-sm` | `type="range"`: the thumb's rim, resting ring and shadow |
| `--mono-input-range-ring-width` / `-hover-ring-width` | 4px / = ring width | `type="range"`: the focus / hover halo (colour = the ring at `--mono-ring-alpha`) |
| `--mono-input-range-height` / `-gap` | 1.25rem / `--mono-input-gap` | `type="range"`: the slider's box, and label ↔ slider spacing |
| `--mono-input-range-label-color` / `-font-size` / `-line-height` / `-font-weight` | the label's | `type="range"`: the label row |
| `--mono-input-range-value-color` / `-font-family` / `-font-size` / `-font-weight` / `-min-width` | `--muted-foreground` / inherit / the label's / medium / 3ch | `type="range"`: the value readout |

Deprecated and honoured as no-ops until 2.0: `--mono-input-focus-rgb` (alpha now comes from `--mono-input-ring-alpha`), `--mono-input-underline-glow` (the underline no longer glows — it is sera's line), the per-colour `filled` tints (a flat `--input`/50 for every colour).

## Types

<DemoTypes name="input" />
