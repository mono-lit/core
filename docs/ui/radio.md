# Radio

A single radio option used standalone or as part of a group sharing the same `model-value`. Sizes, color variants, an optional sublabel, and slot-overridable label and sublabel text. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.input[type="radio"]` (see [Theme](./theme)): a 16px circle (4/9 of the control step, so it stays paired with the [checkbox](./checkbox) and [input](./input) beside it) with a 1px `--input` border, the 3px `--ring` focus ring, and — when selected — a `--primary` fill carrying a `--primary-foreground` dot at half its width. The label is Basecoat's `.label` (`text-sm font-medium leading-snug`, `gap-2`). Dark mode is built in.

## Basic

Single radio option with a label.

<DemoSingle name="radio" id="basic" />

## Group

Multiple radios sharing one `model-value`.

<DemoSingle name="radio" id="group" />

## Sizes

Small, medium and large.

<DemoSingle name="radio" id="sizes" />

## With input

Each step sits directly below a `mono-input` of the same `size`, which is where a mismatch shows up first. The circle tracks the shared [`--theme-control-height-*`](./theme) token at half height — identical to `mono-checkbox` at every step — and the label, description and gap scale with it.

<DemoSingle name="radio" id="with-input" />

## Colors

Pick a colour and the group takes it — the selected dot re-paints live; the disabled option shows it dimmed.

<DemoSingle name="radio" id="colors" />

## States

Disabled and pre-selected.

<DemoSingle name="radio" id="states" />

## Sublabel

`sublabel` adds a smaller second line under the `label`. `description` still works as another name for it, and both share one value.

<DemoSingle name="radio" id="description" />

## Slots

Custom label and sublabel via named slots: `slot="label"` and `slot="sublabel"` (the older `slot="description"` still works).

<DemoSingle name="radio" id="slots" />

## Event: change

Listen to `change` to react to selection.

<DemoSingle name="radio" id="event-change" />

## Event log

Live log of `change` events.

<DemoSingle name="radio" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="radio" id="customized" />

## Card recipe

Compose a card-style radio with your own CSS — the library ships no helper, but Basecoat has the recipe: `.field > label:has(input[type="radio"])` is `rounded-md border p-3`, and a label holding a checked control takes `bg-primary/5 border-primary/30` (dark `/10` and `/20`, which the `--mono-mode-checked-bg` / `-border` tokens carry). Both demo tabs below are exactly that.

<DemoSingle name="radio" id="card" />

## CSS Variables

<DemoSingle name="radio" id="css-vars" />

Every radio is themed through `--mono-radio-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-radio>` and the shadow build. The `color` prop sets the accent, but an explicit `--mono-radio-accent` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--input`, `--primary`, `--ring` …) — or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-radio-accent` / `--mono-radio-dot-color` | `--primary` / `--primary-foreground` (set by `color`) | Circle fill + border when selected, and the dot on it |
| `--mono-radio-checked-bg` | `--mono-radio-accent` | Circle background when selected — set it `transparent` for a hollow circle (what the `sera` flavor does) |
| `--mono-radio-bg` | `--mono-mode-surface` (transparent, dark `--input`/30) | Circle background when unselected |
| `--mono-radio-border-color` (alias `--mono-radio-border`) / `--mono-radio-border-width` | `--input` / `--mono-border-width` (1px) | Circle border |
| `--mono-radio-radius` / `--mono-radio-dot-radius` | `--mono-radius-full` | Circle / dot corner (the `rhea` flavor squares the circle off to `2xl`) |
| `--mono-radio-shadow` | none (Basecoat gives the radio no `shadow-xs`, unlike the checkbox) | Resting circle shadow |
| `--mono-radio-ring-color` / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | Focus-visible ring |
| `--mono-radio-dot` | `50%` (Basecoat's `size-2` on a `size-4` circle) | The dot's share of the circle |
| `--mono-radio-size-<size>` | `--mono-control-height-<size>` × 4/9 | The circle, per step |
| `--mono-radio-gap` (or `-gap-<size>`) | 2 × `--mono-spacing` at md, 1.25 → 3.5 across the scale | Gap between circle and label |
| `--mono-radio-label-font-<size>` / `--mono-radio-label-font-weight` / `--mono-radio-label-line-height` | `--mono-text-sm` at md / `--mono-label-font-weight` / `--mono-leading-snug` | Label |
| `--mono-radio-description-font-<size>` | 13px at md | Description |
| `--mono-radio-text` / `--mono-radio-description` | `--foreground` / `--muted-foreground` | Label / description ink |

Every metric is [checkbox](./checkbox)'s: the two sit side by side in a form, so circle ≡ box, gap ≡ gap and label ≡ label at every step — a perf spec asserts it.

Deprecated and honoured as no-ops until 2.0: `--mono-radio-border-hover` (Basecoat has no hover on the circle), `--mono-radio-ring` (use `-ring-color`), `--mono-radio-accent-soft`.

## Types

<DemoTypes name="radio" />
