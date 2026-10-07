# Accordion

A single expand/collapse unit with header (icon + title + optional subtitle + optional trailing actions) and a body. Compose multiple together for a typical FAQ or settings group. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.accordion` (see [Theme](./theme)): a `p-4` row with a `text-sm font-medium` title and a `size-4` chevron that rotates when the item opens, over a `text-sm` body. **In a group** the items flatten into one flush list with a hairline between them, exactly as upstream renders `.accordion > details`; **on its own** an item keeps this component's frame (border, radius, `shadow-xs`), which upstream has no equivalent for. Dark mode is built in.

## Basic

Single accordion with a title and body.

<DemoSingle name="accordion" id="basic" />

## Title & subtitle

The header text comes from three places. When more than one is given, the most specific wins:

1. **`slot="header"`** replaces the whole left side of the row: the icon, the title and the subtitle. The `actions` slot and the chevron stay, and the row is still the toggle.
2. **`slot="title"` / `slot="subtitle"`** each replace one line.
3. **`title` / `subtitle` props** are plain text.

The old prop names `label` / `description` are still accepted (as properties and as attributes) as aliases of `title` / `subtitle`. Likewise the old slot names `slot="label"` / `slot="description"` still work as aliases of `slot="title"` / `slot="subtitle"`; when both an old and a new name are given, the new one wins. The secondary line renders `[mono-subtitle]` (and, for existing CSS, its old name `[mono-description]` too).

See the [Slots](#slots) demo for `slot="header"` in action.

## Sizes

Small, medium and large.

<DemoSingle name="accordion" id="sizes" />

## Colors

Pick a colour and both accordions take it — the accent on the active border, icon background and arrow re-paints live.

<DemoSingle name="accordion" id="colors" />

## States

Default-open, default-closed and disabled.

<DemoSingle name="accordion" id="states" />

## Icon & subtitle

Leading icon plus a subtitle under the title.

<DemoSingle name="accordion" id="icon" />

## Group

Multiple stacked items in the group helper — one flush list with a hairline between the items, which is Basecoat's `.accordion`. Four of the eight flavors (maia, mira, luma, rhea) also frame the group itself; on vega it is a bare column.

<DemoSingle name="accordion" id="group" />

## Slots

Custom title, subtitle, icon, actions and body via named slots. The second item uses `slot="header"` to replace the title and subtitle with its own markup — the icon, actions and chevron are kept.

<DemoSingle name="accordion" id="slots" />

## Event log

Live log of `toggle`, `open` and `close` events.

<DemoSingle name="accordion" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="accordion" id="customized" />

## CSS Variables

<DemoSingle name="accordion" id="css-vars" />

Every accordion is themed through `--mono-accordion-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-accordion>` and the shadow build. The `size` and `color` props set presets, but an explicit `--mono-accordion-*` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--card`, `--border`, `--muted-foreground` …) or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-accordion-accent` / `-<role>` | `--primary` / the ten roles | The colour the chevron, the focus ring and the open edge take (set by `color`) |
| `--mono-accordion-bg` (alias `-surface`) / `-text` / `-border` | `--card` / `--card-foreground` / `--border` | The item's fill, ink and edge |
| `--mono-accordion-shadow` | `--mono-shadow-xs` | The standalone item's elevation (a grouped item has none) |
| `--mono-accordion-open-bg` (alias `-head-bg`) / `-open-border-color` / `-open-shadow` | the item's own surface / the role at 32% over `--border` / a soft role glow | The open item. Four flavors set `-open-bg` to `bg-muted/50`; vega leaves it alone |
| `--mono-accordion-radius` / `-radius-<size>` | `--mono-radius-md` at md | Corner radius |
| `--mono-accordion-pad-x-<size>` / `-pad-y-<size>` | 4 × `--mono-spacing` at md (`p-4`) | Head and body padding |
| `--mono-accordion-gap` | 3 × `--mono-spacing` | Gap between the head's parts |
| `--mono-accordion-title-font-<size>` / `-title-weight` / `-title-hover-decoration` | `--mono-text-sm` / medium / `underline` | The title. Upstream underlines it on hover — set `none` to drop that |
| `--mono-accordion-head-hover-tint` / `-head-hover-bg` | `0%` / built from it | A hover fill for the row, off by default (the underline is the cue). A flavor sets the ALPHA; a consumer can set the colour outright |
| `--mono-accordion-description-font` / `-description-color` | `--mono-text-xs` / `--muted-foreground` | The second line (the subtitle) |
| `--mono-accordion-body-font-<size>` / `-body-line-height` / `-body-color` | `--mono-text-sm` / its line-height / inherit | The body |
| `--mono-accordion-arrow-size` / `-arrow-color` / `-arrow-open-color` | `size-4` / `--muted-foreground` / the role | The chevron |
| `--mono-accordion-glyph-size` / `-glyph-radius` / `-glyph-bg` / `-glyph-color` | 7 × `--mono-spacing` / `--mono-radius-sm` / the role at 14% / the role | The leading icon chip |
| `--mono-accordion-ring-color` / `-ring-width` | the role / `--mono-ring-width` | The head's focus ring |
| `--mono-accordion-group-gap` / `-group-radius` / `-group-border-width` / `-group-border-color` | `0` / `0` / `0` / `--border` | The group. maia, mira, luma and rhea frame it (`overflow-hidden rounded-2xl border`); a gap turns the list back into separate boxes, and the dividers go with it |
| `--mono-accordion-duration` | `--mono-duration` | Open/close animation duration (body collapse + chevron); set `0s` for an instant toggle |

## Performance

<DemoSingle name="accordion" id="heavy" />

An accordion body is always rendered — collapsing it is a visual state, not an unmount —
so the consumer's content is never destroyed and never has to be rebuilt on reopen. When a
body holds many components, that has two separate costs, and they have different fixes.

**Putting a long list of accordions on screen.** A collapsed body is skipped for layout and
paint entirely (`content-visibility: hidden`), so closed panels cost almost nothing no
matter what is inside them. Measured with ~320-node bodies, initial layout for 40 panels
drops from **157 ms to 18 ms**, and stops growing with the panel count. This is automatic.

**Toggling one panel open or closed.** This cost is dominated by the expand animation:
`grid-template-rows` is a layout property, so the browser re-measures the body's whole
subtree on every frame. For one open+close cycle with those same bodies, **24.8 ms animated
vs 3.6 ms** with the animation off. So if your bodies are heavy, turn it off:

```css
mono-accordion.heavy { --mono-accordion-duration: 0s; }
```

That is the single most effective change for a sluggish toggle — roughly 85% of the cost is
the animation, not the content.

Two consequences of a collapsed body being skipped, both intentional:

- Its contents are out of the tab order and the accessibility tree, so <kbd>Tab</kbd>
  no longer lands on invisible form fields inside a closed panel.
- Its contents are not matched by the browser's in-page find (<kbd>Ctrl</kbd>+<kbd>F</kbd>).

Browsers without
[`transition-behavior: allow-discrete`](https://developer.mozilla.org/docs/Web/CSS/transition-behavior)
keep collapsed bodies in layout — the accordion behaves identically, just without the
saving.

## Types

<DemoTypes name="accordion" />
