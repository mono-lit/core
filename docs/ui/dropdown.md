# Dropdown

A flexible floating overlay that pairs any activator (`slot="main"`) with any body content (`slot="body"`). Twelve placements (`top`/`bottom`/`left`/`right` × bare, `-start`, `-end`), three trigger modes (click / hover / manual), ten theme colours, sm/md/lg sizes. The panel **auto-flips** to the opposite side when the requested side runs out of viewport space and **shifts** along the cross-axis to stay on-screen. Outside-click and Escape both close (configurable). Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.popover` + `[data-popover]` (see [Theme](./theme)): a `bg-popover` panel with a `ring-1 ring-foreground/10` edge, `rounded-md`, `shadow-md`, `p-4`, `gap-4` and `text-sm`, opening with upstream's scale-and-slide. Dark mode is built in.

## Basic

Click an activator button to open a dropdown panel below it.

<DemoSingle name="dropdown" id="basic" />

## Placements

All 12 placements: top/bottom/left/right combined with -start, -end and bare (centered).

<DemoSingle name="dropdown" id="placements" />

## Auto-flip + shift

Triggers placed near each viewport edge — the panel flips to the side with more room and shifts inward to stay on-screen.

<DemoSingle name="dropdown" id="auto-flip" />

## Sizes

Small, medium and large.

<DemoSingle name="dropdown" id="sizes" />

## Colors

Pick a colour, then open the dropdown: the panel's ring takes it and re-paints live, so re-pick while it is open.

<DemoSingle name="dropdown" id="colors" />

## Triggers

Click vs hover modes side-by-side.

<DemoSingle name="dropdown" id="triggers" />

## With mono-button

Use a real `<mono-button>` as the activator inside `slot="main"`.

<DemoSingle name="dropdown" id="with-mono-button" />

## Rich content

The body slot can host any HTML — including other mono components like input, checkbox, and button.

<DemoSingle name="dropdown" id="rich-content" />

## Disabled

The activator does nothing on click.

<DemoSingle name="dropdown" id="disabled" />

## Event log

Live log of `toggle` / `open` / `close` with the `source` field and `resolvedSide`.

<DemoSingle name="dropdown" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="dropdown" id="customized" />

## CSS Variables

<DemoSingle name="dropdown" id="css-vars" />

Every dropdown is themed through `--mono-dropdown-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-dropdown>` and the shadow build. To re-skin globally, set the underlying [tokens](./theme) (`--popover`, `--foreground`, `--primary` …) — or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-dropdown-bg` (alias `-surface`) / `-text` | `--popover` / `--popover-foreground` | The panel's fill and ink |
| `--mono-dropdown-ring-base` / `-ring-width` / `-ring-color` (alias `-border`) | `--foreground`/10 / `--mono-border-width` / the base with the role mixed in | The `ring-1` edge. A flavor changes `-ring-base`; `-ring-color` replaces the whole thing, role included |
| `--mono-dropdown-shadow` | `--mono-shadow-md` | The panel's elevation |
| `--mono-dropdown-radius` / `-radius-<size>` | `--mono-radius-md` at md | Panel corner (the size-agnostic knob wins over every size) |
| `--mono-dropdown-pad-x-<size>` / `-pad-y-<size>` / `-gap-<size>` | 4 × `--mono-spacing` at md | Panel padding, and the gap between its children |
| `--mono-dropdown-font-<size>` / `-line-height` | `--mono-text-sm` at md | Panel type |
| `--mono-dropdown-min-width-<size>` / `-max-width-<size>` | 200px / 280px at md | The panel's width floor (applied to `mono-body`, so content that cannot shrink still sizes the panel) and cap |
| `--mono-dropdown-offset-<size>` | `--mono-spacing` (4px) | Gap between activator and panel — keep in step with the `offset` prop |
| `--mono-dropdown-accent` / `-<role>` | `--primary` / the ten roles | The colour mixed into the ring |

Each of the per-size knobs has a size-agnostic twin (`--mono-dropdown-pad-x`, `-font`, …) that applies to **every** size — that one is the consumer's override; a flavor should write the per-size form.

Deprecated and honoured as no-ops until 2.0: every `--mono-dropdown-*-rgb` (use `color-mix`).

## Types

<DemoTypes name="dropdown" />
