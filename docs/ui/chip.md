# Chip

A small status or label chip. Slot any content inside — text, count, icon. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.badge` (see [Theme](./theme)): a `h-5` `rounded-4xl` pill with `px-2`, `text-xs` and `font-medium`, in three variants — `soft` (the tonal `bg-c/10 text-c` badge, and mono's default), `solid` (`bg-c text-c-foreground`) and `outline`. Dark mode is built in: the tonal fill deepens through `--mono-mode-tint`.

## Basic

Five color variants with the default soft style.

<DemoSingle name="chip" id="basic" />

## Sizes

xs, sm, md, lg, xl, xxl.

<DemoSingle name="chip" id="size" />

## Colors

Pick a colour and every variant takes it. Soft is a tinted surface in the colour, solid fills with it, outline keeps a bare border and inks the text.

<DemoSingle name="chip" id="colors" />

## Rounded

The same corner scale every mono control uses: `none`, `xs`…`xxl`, `full`. Unset keeps the pill a chip has by default.

<DemoSingle name="chip" id="shape" />

## Dot

Status dot indicator next to the label.

<DemoSingle name="chip" id="dot" />

## Icon

Slot an icon on the left or right of the label.

<DemoSingle name="chip" id="icon" />

## Interactive

Clickable, selected, disabled and removable states.

<DemoSingle name="chip" id="interactive" />

## Link

Renders as `<a>` when `href` is set.

<DemoSingle name="chip" id="link" />

## Event: click

Listen for the `click` event on a clickable chip.

<DemoSingle name="chip" id="event-click" />

## Event: toggle

Two-way binding to a clickable chip's selected state.

<DemoSingle name="chip" id="event-toggle" />

## Event: remove

Remove items from a list when their close button fires `close`.

<DemoSingle name="chip" id="event-remove" />

## Event: group

Multi-select chip group; clicks toggle each chip.

<DemoSingle name="chip" id="event-group" />

## Event log

Live log of `click` and `close` events.

<DemoSingle name="chip" id="event-log" />

## Customized

Override per-element styling with the `cssClass` prop (Vue) or extra utility classes (CSS).

**Put box utilities on `main`, not `root`.** The root is a layout wrapper that paints nothing — it exists so a field can lay chips out — and the badge itself is `main`: the fill, the border, the corner and the padding all live there. A `rounded-*` / `shadow-*` / `px-*` utility handed to `root` lands on the wrapper and is invisible. The corner has a prop of its own (`rounded`), which is what the box actually reads.

<DemoSingle name="chip" id="customized" />

## CSS Variables

<DemoSingle name="chip" id="css-vars" />

Every chip is themed through `--mono-chip-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-chip>` and the shadow build. Override a role (e.g. `--mono-chip-primary`) and every variant derives from it. To re-skin globally, set the underlying [tokens](./theme) (`--primary`, `--destructive`, `--secondary` …) — or switch flavor.

The three variants own **separate** paint knobs, so restyling one never repaints the others; the un-scoped `--mono-chip-bg` / `-color` / `-border-color` are the blanket override that does.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-chip-<role>` / `-<role>-foreground` | `--primary`, `--destructive`, … | The ten colour roles (`primary` `secondary` `success` `danger` `warning` `info` `teal` `purple` `neutral` `dark`) |
| `--mono-chip-soft-bg` / `-soft-color` / `-soft-border-color` | role/10 (dark /20) / role / transparent | The `soft` (default) badge |
| `--mono-chip-solid-bg` / `-solid-color` / `-solid-border-color` | role / role-foreground / transparent | The `solid` badge |
| `--mono-chip-outline-bg` / `-outline-color` / `-outline-border-color` | transparent / role / role | The `outline` badge |
| `--mono-chip-bg` / `-color` / `-border-color` | — | Blanket overrides, above all three variants |
| `--mono-chip-height-<size>` / `-padding-x-<size>` / `-gap-<size>` / `-font-size-<size>` / `-glyph-size-<size>` | 5 × / 2 × / 1 × `--mono-spacing`, `--mono-text-xs`, 3 × `--mono-spacing` at md | The size ladder, per step |
| `--mono-chip-height` / `-padding-x` / `-gap` / `-font-size` / `-glyph-size` | — | The same five, for EVERY size at once (a consumer override — a flavor should write the per-size twin) |
| `--mono-chip-radius` | `--mono-radius-4xl` | Corner (the `rounded` prop writes the preset tier below it) |
| `--mono-chip-border-width` / `-font-weight` / `-letter-spacing` / `-text-transform` | `--mono-border-width` / medium / normal / none | The badge's edge and type |
| `--mono-chip-dot-size` | 1.5 × `--mono-spacing` | The leading status dot |
| `--mono-chip-remove-*` → see `mono-close` | — | The ✕ is sized by `-glyph-size-<size>` |
| `--mono-chip-ring-color` / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | Focus and `selected` rings |
| `--mono-status-dot-color` / `-size` / `-gap` / `-font-size` / `-font-weight` | per state / 2 × `--mono-spacing` / … | The standalone `<mono-status-dot>` |

Deprecated and honoured as no-ops until 2.0: `--mono-chip-<role>-soft` and `--mono-chip-<role>-lite` (the old per-role fill and border tints — use the variant knobs above, or `color-mix`), and `--status-custom-color` (now `--mono-status-dot-color`).

## Types

<DemoTypes name="chip" />
