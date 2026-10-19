# OTP

A one-time-code field: a row of single-character boxes that behaves as **one** input. Typing fills a box and moves to the next one. Backspace clears a box and steps back. A paste, or a phone's SMS autofill, fills every box from the focused one on. It has the same props as [`<mono-input>`](./input) (size, color, variant, label, label position, validation position, tooltip, messages and states) and binds to `controlMonoForm` like any form control. Toggle **Vue / CSS** to switch the live demo and source together.

Each box uses the input's look, and every `--mono-otp-*` knob falls back to the matching `--mono-input-*` knob, so the field follows every flavor with no entries of its own.

```ts
import '@mono-lit/helper/ui/otp'          // <mono-otp>
import '@mono-lit/helper/ui/shadow/otp'   // <mono-shadow-otp> (SSR / shadow DOM)
```

## Basic

The value is always a string with no gaps: box *i* holds `value[i]`. Focus never lands past the first empty box, and deleting a character moves the ones after it left. The first box carries `autocomplete="one-time-code"`, so phones offer the code from an incoming SMS.

<DemoSingle name="otp" id="basic" />

## Types

`type` sets which characters a box accepts. A rejected character is dropped and fires no event.

| `type` | Accepts | Keyboard |
| --- | --- | --- |
| `numeric` (default) | `0-9` | numeric keypad (`inputmode="numeric"`) |
| `alphanumeric` | `A-Z`, `0-9`; letters are uppercased | text |
| `text` | any character except a space | text |

<DemoSingle name="otp" id="types" />

## Mask

`mask` draws each box as a password input, so the characters show as dots. The value is still the real code.

<DemoSingle name="otp" id="mask" />

## Groups

- `length` sets the number of boxes (default 6).
- `groups` splits the boxes into groups:
  - one size repeats: `3` gives 3-3;
  - a list is taken as given: `[2, 2, 2]`, or `"2,2,2"` from markup.
- `separator` is the text drawn between groups (default `-`). An empty string leaves only the gap.
- `placeholder` sets one character for every empty box. A string exactly `length` long sets one character per box.

<DemoSingle name="otp" id="groups" />

## Sizes

Each box is a square at the shared control height of its size, so a code field lines up with the inputs and buttons beside it.

<DemoSingle name="otp" id="sizes" />

## Colors

`color` is the focus colour (the focused box's border and ring), as on mono-input.

<DemoSingle name="otp" id="colors" />

## Variants

<DemoSingle name="otp" id="variants" />

## States

- `disabled` disables every box and fades the row.
- `readonly` keeps the boxes focusable but blocks every edit.
- `required` shows the asterisk and sets `aria-required` on the group.
- `validation-state` / `validation-message` (or `error-message`, `success-message`) recolour every box and show the message.
- `clearable` adds a × after the boxes once a code has been typed.

<DemoSingle name="otp" id="states" />

## Label position

`label-position="left | right"` puts the label beside the row, on the same grid as the other field controls. Knobs: `--mono-otp-label-width` and `--mono-otp-label-side-gap`. `notched` renders as `top`, because there is no single box to cut the label into.

<DemoSingle name="otp" id="label-position" />

## Validation position

Works as on [mono-input](./input#validation-position). `icon` puts a state icon after the boxes, and hovering or focusing it shows the message. `float` shows the message under the boxes while the field is hovered or focused. In both modes the row under the boxes keeps the helper text.

<DemoSingle name="otp" id="validation-position" />

## Tooltip

<DemoSingle name="otp" id="tooltip" />

## Form

Bind with `:control-form="form"` and `key-form`, like any form control. The form owns the value, which is a string, and renders the validation.

- `input` runs the `live` rules.
- `change` runs the `change` rules and marks the field touched. It fires when focus **leaves the boxes**, not on every box.
- The built-in `min` / `max` rules measure the string length, so `{ type: 'min', value: 6 }` means "all six digits".

With a `name`, the element also writes a hidden `<input>` holding the joined code, so a native `<form>` submits it. This only works in the light build.

<DemoSingle name="otp" id="form" />

## Events

All four events carry `{ modelValue, value, oldValue, complete, index }`. `index` is the box that was edited, or `-1` for a clear or a blur commit. The `mno-*` aliases fire too.

| Event | Fires |
| --- | --- |
| `input` | On every edit (a typed character, a Backspace or Delete, a paste) |
| `complete` | Each time an edit fills the last empty box |
| `change` | When focus leaves the boxes and the code differs from when focus entered |
| `clear` | From the × button or `el.clear()` (with `input` and `change`) |

<DemoSingle name="otp" id="event-log" />

## Keyboard

| Key | Action |
| --- | --- |
| A character | Fill this box, move to the next |
| Backspace | Clear this box; on an empty box, clear the one before and move there |
| Delete | Remove this box's character; the boxes after it move left |
| Arrow Left / Right (Up / Down) | Previous / next box (never past the first empty one) |
| Home / End | First box / first empty box |
| Ctrl/⌘ + V | Fill from this box on; rejected characters such as spaces or dashes are dropped |

The row is a `role="group"` named by the label. Each box reads "*label* – Digit *i* of *n*". Methods: `focus(index?)` (by default the first empty box), `blur()` and `clear()`. The getter `complete` is `true` once every box is filled.

## CSS Variables

<DemoSingle name="otp" id="css-vars" />

Each knob first reads `--mono-otp-*`, then the matching `--mono-input-*`, then vega's value.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-otp-cell-size-<size>` / `--mono-otp-cell-width` | `--mono-control-height-<size>` / = size | Box height and width |
| `--mono-otp-font-<size>` / `--mono-otp-font-weight` | xs → `--mono-text-xs`, md → `--mono-text-base`, xl → `--mono-text-xl` / semibold | Character type |
| `--mono-otp-gap` / `--mono-otp-group-gap` | 2 × spacing | Between boxes / between groups |
| `--mono-otp-radius` | `--mono-input-radius` → `--mono-radius-md` | Box corners |
| `--mono-otp-bg` / `--mono-otp-filled-bg` / `--mono-otp-border-color` / `--mono-otp-shadow` | the input's | Box surface |
| `--mono-otp-ring-color` / `-ring-width` / `-ring-alpha` | the `color` / `--mono-ring-width` / `--mono-ring-alpha` | Focus ring |
| `--mono-otp-separator-color` / `--mono-otp-placeholder` | muted foreground | Separator and placeholder text |
| `--mono-otp-readonly-bg` / `--mono-otp-disabled-bg` | `--muted` / the box surface | State surfaces |
| `--mono-otp-label-*` / `--mono-otp-message-*` | the input's | Label and message type |
| `--mono-otp-<color>` (`primary` … `dark`, `valid`, `invalid`) | the input's palette | Palette slots |

## Types

<DemoTypes name="otp" />
