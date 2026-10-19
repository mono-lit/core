# Slider

A slider with any number of thumbs, from Basecoat's range look. One number gives one thumb, and an array gives one thumb per entry: `[20, 80]` is a range, `[2, 2, 3]` is three thumbs. It also has a vertical type, discrete stops, a minimum gap between thumbs, tick marks with labels, track gaps, a value bubble per thumb, and form binding. Toggle **Vue / CSS** to switch the live demo and source together.

The look is the same as [`<mono-input type="range">`](./input#range) under every flavor, because both read the same `--mono-input-range-*` design knobs. Under **ONE** it follows the EJI guide's slider: a 4px track, a 16px navy thumb with a white rim, and the value at the end of the label row in bold navy mono figures. The guide's single slider has no fill, but a range needs its span on screen, so the slider fills with the accent.

```ts
import '@mono-lit/helper/ui/slider'          // <mono-slider>
import '@mono-lit/helper/ui/shadow/slider'   // <mono-shadow-slider> (SSR / shadow DOM)
```

## Basic

<DemoSingle name="slider" id="basic" />

## Range

An array gives one thumb per entry. The span between the first and last thumb fills. Pressing on that span and dragging moves both thumbs together, keeping their distance. A plain click on the track moves the nearest thumb there. Thumbs **block** each other, so `value[0] ≤ value[1] ≤ …` always holds.

<DemoSingle name="slider" id="range" />

## Multiple thumbs

Any length works. Thumbs may share a value. To pull a stack apart, drag up to take the top thumb, or down to take the bottom one. With the keyboard, Arrow Up/Right on a stacked thumb hands over to the top of the stack.

<DemoSingle name="slider" id="multi-thumb" />

## Vertical

`type="vertical"` runs the track from min at the bottom to max at the top. `height` sets the track length (default 200px). Mark labels sit beside the track and the value bubble to its left.

<DemoSingle name="slider" id="vertical" />

## Min gap

`min-gap` is the smallest distance kept between neighbouring thumbs. A dragged thumb stops that far from its neighbour. A value handed over too tight is spread to fit, and thumbs that cannot all fit are packed against the ends.

<DemoSingle name="slider" id="min-gap" />

## Stops

`stops` lists the only values a thumb can land on, however unevenly they are spaced. It replaces `step`. The keyboard walks the list, and PageUp/PageDown jump a tenth of it. `marks` with no value puts a tick on every stop.

<DemoSingle name="slider" id="stops" />

## Marks

- `marks` (or `marks="true"`) puts a tick at every step. On a grid denser than 26 ticks, only the two ends get one.
- A list such as `[0, 50, { value: 100, label: 'Max' }]` puts a tick, with a label under it, at each value. A mark without its own label shows the formatted value.
- Ticks inside the filled span switch to the active colour.

<DemoSingle name="slider" id="marks" />

## Track gap

`track-gap` cuts this many px of track away around each thumb, like Material 3's slider. Each stretch then becomes its own rounded bar.

<DemoSingle name="slider" id="track-gap" />

## Fill

`fill="auto"` (the default) fills from min to the thumb with one thumb, and between the thumbs with several. With three or more thumbs, every inner stretch fills. `start` fills from min to the first thumb, `end` from the last thumb to max, and `none` fills nothing.

<DemoSingle name="slider" id="fill" />

## Value tooltip

`value-tooltip` controls the bubble on each thumb. `auto` (the default) shows it on hover, keyboard focus and while dragging. `always` shows it permanently and reserves room above the track for it. `never` turns it off. This is separate from `tooltip`, which is the label ⓘ as on every other form control.

<DemoSingle name="slider" id="tooltip" />

## Formatting

`format-display` and `format-locale` work as on [mono-input](./input#formatting). They shape the label-row readout, the bubbles, the mark labels and `aria-valuetext`, never the value. Use `"{}%"`, `'"Rp "#,##0'` with `format-locale="id-ID"`, or a function: `:format-display.prop="({ value }) => …"`. `value-separator` (default `" – "`) joins the values in the readout. `show-value="false"` hides the readout.

<DemoSingle name="slider" id="format" />

## Sizes

`size` scales the track and thumb from the flavor's own geometry, so every style keeps a full `xs` to `xxl` ladder.

<DemoSingle name="slider" id="sizes" />

## Colors

<DemoSingle name="slider" id="colors" />

## States

- `disabled` fades the slider and takes it out of the tab order.
- `readonly` keeps the thumbs focusable but never moves them.
- `required` shows the asterisk and sets `aria-required`.
- `validation-state` / `validation-message` (or `error-message`, `success-message`) recolour the slider and show the message.

<DemoSingle name="slider" id="states" />

## Form

Bind with `:control-form="form"` and `key-form`, like any form control. The form owns the value, a number or an array, and renders the validation. A rule's `value` is the slider's model as is, so a custom rule can read `value[1] - value[0]`. Note that the built-in `min` / `max` rules measure an array by its **length**, not its numbers.

With a `name`, the element also writes one hidden `<input>` per thumb, so a native `<form>` submits it: `name` for one thumb, `name[]` repeated for several.

<DemoSingle name="slider" id="form" />

## Events

`input` fires while dragging and on every key press. `change` fires on release and after each key. Both carry `{ modelValue, value, oldValue, values, index }`. `values` is always an array, and `index` is the thumb that moved, or `-1` when a segment drag moved two thumbs. The `mno-input` / `mno-change` aliases fire too.

<DemoSingle name="slider" id="event-log" />

## Keyboard

| Key | Action |
| --- | --- |
| Arrow Right / Up | One step up (Right is down in RTL) |
| Arrow Left / Down | One step down |
| Page Up / Page Down | Ten steps (or a tenth of the stops) |
| Home / End | To this thumb's own lowest / highest place (its neighbours ± `min-gap`) |

Each thumb is a `role="slider"` with its own `aria-valuemin`/`max`, which are its neighbours' bounds, plus `aria-valuenow`, `aria-valuetext` and `aria-orientation`. With two thumbs they are named "(minimum)" and "(maximum)".

## CSS Variables

<DemoSingle name="slider" id="css-vars" />

Every look value first reads a `--mono-slider-*` knob, then the matching `--mono-input-range-*` knob, then vega's value. The flavors write the input-range knobs, so the slider follows every flavor with no entries of its own. Set the `--mono-slider-*` knob to restyle only sliders.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-slider-accent` | `--primary` (set by `color` / a validation state) | Fill and thumb colour |
| `--mono-slider-track-height` / `-track-radius` / `-track-bg` / `-fill` | 0.375rem / full / `--muted` / the accent | The track and its filled stretches |
| `--mono-slider-thumb-size` / `-thumb-width` / `-thumb-radius` / `-thumb-bg` | 1rem / = size / full / white | The thumb (border-box) |
| `--mono-slider-thumb-border-width` / `-border-color` / `-ring-width` / `-ring-color` / `-shadow` | 1px / the accent / 0 / – / `--mono-shadow-sm` | Rim, resting ring and shadow |
| `--mono-slider-ring-width` / `-hover-ring-width` / `-ring-color` / `-ring-alpha` | 4px / = ring width / `--ring` / `--mono-ring-alpha` | Focus / hover halo |
| `--mono-slider-height` / `-gap` / `-length` | 1.25rem / `--mono-input-gap` / 200px | Control box, label ↔ track spacing, vertical track length |
| `--mono-slider-label-color` / `-font-size` / `-line-height` / `-font-weight` | the input label's | Label |
| `--mono-slider-value-color` / `-font-family` / `-font-size` / `-font-weight` / `-min-width` | `--muted-foreground` / inherit / the label's / medium / 3ch | Readout |
| `--mono-slider-mark-size` / `-mark-color` / `-mark-active-color` | max(4px, half the track) / muted / `--primary-foreground` | Ticks |
| `--mono-slider-mark-label-font-size` / `-line-height` / `-color` / `-gap` | `--mono-text-xs` / 1rem / muted / 1.5 × spacing | Mark labels |
| `--mono-slider-tooltip-bg` / `-color` / `-radius` / `-font-family` / `-font-size` / `-offset` | `--foreground` / `--background` / `--mono-radius-md` / inherit / xs / 2 × spacing | Value bubble |

## Types

<DemoTypes name="slider" />
