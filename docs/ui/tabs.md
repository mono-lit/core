# Tabs

A tab strip with sizes, color variants, three visual styles (underline / pill / ghost), optional count badges, optional SVG icons via slot, and per-item disabled state. Content panes live outside the strip — drive them off the bound `model-value`. Toggle **Vue / CSS** to switch the live demo and source together.

The strip IS Basecoat's `[role="tablist"]` (see [Theme](./theme)). `pill` is upstream's default — a `bg-muted` track, `rounded-lg p-[3px] h-9`, with the selected tab lifted onto `bg-background shadow-sm` — and `underline` is its `[data-variant="line"]`: a bare track where the selected tab is marked by a 2px bar. Tabs are `text-sm font-medium`, inked `foreground/60` until hovered or selected. Dark mode is built in.

## Basic

Three tabs with text panes that swap on click.

<DemoSingle name="tabs" id="basic" />

## Sizes

Small, medium and large.

<DemoSingle name="tabs" id="sizes" />

## Colors

Pick a colour and every variant takes it. All built-in colors across `underline`, `pill` and `ghost`.

<DemoSingle name="tabs" id="colors" />

## Badges

Tabs with trailing count badges.

<DemoSingle name="tabs" id="badges" />

## Icons

Leading SVG icons via the `icon-{id}` slot.

<DemoSingle name="tabs" id="icons" />

## Disabled

Whole-strip disabled, plus per-item disabled.

<DemoSingle name="tabs" id="disabled" />

## Event log

Live log of `change` events.

<DemoSingle name="tabs" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="tabs" id="customized" />

## CSS Variables

<DemoSingle name="tabs" id="css-vars" />

Every tab strip is themed through `--mono-tabs-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-tabs>` and the shadow build. The `size` and `color` props set presets, but an explicit `--mono-tabs-*` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--muted`, `--foreground`, `--background` …) or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-tabs-accent` / `-<role>` | `--primary` / the ten roles | The colour the selected tab and the bar take (set by `color`) |
| `--mono-tabs-text` / `-muted` | `--foreground` / `--mono-mode-tab-inactive-fg` (`foreground/60`, dark `--muted-foreground`) | Hovered / selected ink, and the idle ink |
| `--mono-tabs-bg` (alias `-background`) | `--muted` | The pill track's fill |
| `--mono-tabs-height-<size>` / `-radius-<size>` / `-padding-<size>` | `h-9` / `--mono-radius-lg` / `3px` at md | The track's box (`rounded-lg p-[3px] h-9`) |
| `--mono-tabs-strip-gap` | `0` pill, `--mono-spacing` line | Gap between tabs |
| `--mono-tabs-tab-radius-<size>` / `-tab-pad-x-<size>` (alias `-pad-x`) / `-tab-pad-y-<size>` (alias `-pad-y`) | `--mono-radius-md` / `px-2` / `py-1` | A tab's box |
| `--mono-tabs-tab-font-<size>` (alias `-font`) / `-tab-font-weight` (alias `-font-weight`) / `-tab-text-transform` (alias `-text-transform`) / `-tab-letter-spacing` | `--mono-text-sm` / medium / none / normal | A tab's label |
| `--mono-tabs-tab-gap-<size>` (alias `-gap`) | 1.5 × `--mono-spacing` | Gap between icon / label / badge |
| `--mono-tabs-active-bg` (alias `-surface`) / `-active-border` / `-active-shadow` / `-active-color` | `--mono-mode-tab-active-bg` / … / `--mono-shadow-sm` / the role | The selected PILL |
| `--mono-tabs-line-color` / `-line-size` / `-line-offset` | the role / `2px` / `-5px` | The selected tab's bar in the line variant |
| `--mono-tabs-line-track-color` / `-line-track-size` | `transparent` / the bar's size | A full-width rule under the line strip. Upstream has none — this is how the pre-port baseline is restored (and how ONE keeps it) |
| `--mono-tabs-ghost-hover-bg` / `-ghost-active-bg` | `--mono-mode-ghost-hover` / the role at `--mono-mode-tint` | The ghost variant |
| `--mono-tabs-icon-size-<size>` / `-tab-icon-pad` | `size-4` / 1.5 × `--mono-spacing` | The glyph box, and the tuck-in on the side a tab leads or trails with one |
| `--mono-tabs-badge-size` / `-badge-font` / `-badge-bg` / `-badge-color` / `-badge-active-bg` / `-badge-active-color` | 4.5 × `--mono-spacing` / `--mono-text-xs` / `foreground`/10 / the idle ink / the role / `--primary-foreground` | The count badge (EXTENSION — upstream has none) |
| `--mono-tabs-ring-color` / `-ring-width` | `--ring` / `--mono-ring-width` | The focus ring |

## Types

<DemoTypes name="tabs" />
