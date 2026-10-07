# Switch

A boolean toggle with sizes, color variants, optional loading state, and slot-overridable label and sublabel text. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.input[type="checkbox"][role="switch"]` (see [Theme](./theme)): a 32 × 18.4px pill with a 1px transparent border and an `xs` shadow, `--input` when off and `--primary` when on, carrying a 16px `--background` thumb that travels `calc(100% - 2px)`. That thumb is exactly the [checkbox](./checkbox) box (the control step × 4/9), so a switch, a checkbox and a radio in one column share one scale — and every size derives from it. Dark mode is built in (the thumb flips to `--foreground` when off, `--primary-foreground` when on).

## Basic

Single switch with a label.

<DemoSingle name="switch" id="basic" />

## Sizes

Small, medium and large.

<DemoSingle name="switch" id="sizes" />

## Colors

Pick a colour and every state takes it — the on-track re-paints live; the disabled switch shows it dimmed.

<DemoSingle name="switch" id="colors" />

## States

Disabled, loading and pre-checked.

<DemoSingle name="switch" id="states" />

## Sublabel

`sublabel` adds a smaller second line under the `label`. `description` still works as another name for it, and both share one value.

<DemoSingle name="switch" id="description" />

## Slots

Custom label and sublabel via named slots: `slot="label"` and `slot="sublabel"` (the older `slot="description"` still works).

<DemoSingle name="switch" id="slots" />

## Event: change

Listen to `change` to react to toggling.

<DemoSingle name="switch" id="event-change" />

## Event log

Live log of `change` events.

<DemoSingle name="switch" id="event-log" />

## Customized

Compose a card-style switch with your own CSS — the library ships no helper. The
`.switch-card` class is applied to the root via `cssClass` (Vue) / directly (CSS).

<DemoSingle name="switch" id="customized" />

## CSS Variables

<DemoSingle name="switch" id="css-vars" />

Every switch is themed through `--mono-switch-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-switch>` and the shadow build. The `color` prop sets the accent, but an explicit `--mono-switch-accent` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--input`, `--primary`, `--ring` …) — or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-switch-accent` | `--primary` (set by `color`) | Track colour when ON |
| `--mono-switch-track-off` | `--mono-mode-surface-strong` (`--input`, dark `--input`/80) | Track colour when OFF |
| `--mono-switch-thumb` / `--mono-switch-thumb-checked` | `--background` (dark: `--foreground` / `--primary-foreground`) | Thumb colour off / on |
| `--mono-switch-thumb-shadow` / `--mono-switch-shadow` | none / `--mono-shadow-xs` | Thumb / track shadow |
| `--mono-switch-radius` / `--mono-switch-thumb-radius` | `--mono-radius-full` | Track / thumb corner (`sera` squares both off, `rhea` uses `2xl`) |
| `--mono-switch-border-width` / `-border-color` / `-checked-border-color` | `--mono-border-width` / `transparent` / same | Track border — `currentColor` resolves to the accent, which is how `luma`, `sera` and `rhea` outline the ON track |
| `--mono-switch-ring-color` / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | Focus-visible ring |
| `--mono-switch-track-height-<size>` (or `-track-height` for all) | `--mono-control-height-<size>` × 23/45 (18.4px at md) | Track height — everything else derives from it |
| `--mono-switch-track-ratio` / `--mono-switch-track-width` | `1.7391` (32 / 18.4) | Track width, as a multiple of its height or outright |
| `--mono-switch-thumb-ratio` | `0.8696` (16 / 18.4) | Thumb size, as a share of the track height |
| `--mono-switch-gap` (or `-gap-<size>`) | 2 × `--mono-spacing` at md, 1.25 → 3.5 across the scale | Gap between track and label |
| `--mono-switch-label-font-<size>` / `-label-font-weight` / `-label-line-height` | `--mono-text-sm` at md / `--mono-label-font-weight` / `--mono-leading-snug` | Label |
| `--mono-switch-description-font-<size>` | 13px at md | Description |
| `--mono-switch-text` / `--mono-switch-description` | `--foreground` / `--muted-foreground` | Label / description ink |

Label metrics and the cap-band alignment are [checkbox](./checkbox)'s, and the thumb is its box — a perf spec asserts both, plus the 1.15 track ratio that makes the pair read as one scale.

Deprecated and honoured as no-ops until 2.0: `--mono-switch-track-off-hover` (Basecoat has no hover on the track), `--mono-switch-ring` (use `-ring-color`), `--mono-switch-thumb-inset-ratio` (the thumb parks flush inside the border).

## Types

<DemoTypes name="switch" />
