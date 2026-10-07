<!-- @unocss-includes -->

# Button

A clickable button or link element. Toggle **Vue / CSS** to switch the live demo and source together.

## Basic

Default colors across the palette.

<DemoSingle name="button" id="basic" />

## Sizes

xs, sm, md, lg, xl, xxl.

<DemoSingle name="button" id="size" />

## Colors

Pick a colour and every variant takes it. Solid, outline, tonal and text — solid fills with the `color`, outline uses it for the border and text, tonal is a soft tint of the same hue, text is bare until hovered.

<DemoSingle name="button" id="colors" />

## Rounded

One prop controls corners: `none`, the `xs`…`xxl` scale, or `full`. Leave it unset and the theme's per-size radius stands.

A step is a **fixed** radius, not one scaled by the button — `rounded="md"` is the same corner on an `xs` button as on an `xxl` one. `none` is a real `0` that beats the per-size radius, and `full` is a pill on a wide button and a circle on a square one.

That last part is how you make a FAB — a fixed square plus a full radius:

```html
<mono-button width="56" height="56" rounded="full" icon-only color="primary">+</mono-button>
```

This replaced `shape`, `round`, `circle` and `fab`. The old `fab` also forced a fixed blue gradient, so it was the one button that could not take a `color` or a `variant`; the recipe above takes both.

<DemoSingle name="button" id="shape" />

## Text with icon

Icon slot with left or right position.

<DemoSingle name="button" id="text-with-icon" />

## Prepend & append

Two affix zones beside the label, holding an icon, arbitrary HTML, or a whole mono
component. Give them content with `slot="prepend"` / `slot="append"`, and configure
each side with the matching `prepend` / `append` prop:

```vue
<mono-button :append.prop="{ divider: true }">
  Download Template
  <span slot="append">⌄</span>
</mono-button>
```

`divider` draws a line between that affix and the button body; `disabled`
deactivates just that side (it follows the button's own `disabled` by default).

**Clicking an affix does not run the button.** The zones render as *siblings* of
the native control rather than inside it — a `<button>` may not contain interactive
content, and anything nested in one has its clicks bubble into the button's own
handler. Sitting outside is what lets an affix hold a real control and be clicked
on its own, with no `stopPropagation` needed on your side. The affix's click also
stops at the affix boundary, so the button's own `@click` never hears it — a split
button's caret opens its menu without running the main action.

A `loading` button keeps its affixes live, so a busy main action can still have a
working menu beside it; a `disabled` one dims them along with it.

::: warning These prop names shadow two DOM methods
`prepend` and `append` are methods on every element (`ParentNode.append()`).
Declaring props with those names shadows them, so **`monoButtonEl.append(node)` is
no longer callable** — reading it returns the config object instead.

Nothing inside @mono-lit/helper calls them (slot placement uses `appendChild`), so the
component itself is unaffected. But consumer code or a third-party helper that
does `buttonEl.append(...)` will break on a `<mono-button>`; use
`buttonEl.appendChild(node)` there instead.
:::

<DemoSingle name="button" id="prepend-append" />

## States

Disabled, loading and full width (`width="100%"`).

<DemoSingle name="button" id="state" />

## Badges

Notification badge in four colors.

<DemoSingle name="button" id="badge" />

## Link buttons

Renders as `<a>` when `href` is set.

<DemoSingle name="button" id="link" />

## Button type

`button`, `submit`, `reset`.

<DemoSingle name="button" id="type" />

## Icon buttons

Icon-only buttons with optional badge or tooltip.

<DemoSingle name="button" id="icon-only" />

## Button with input

Buttons share the `xs`–`xxl` heights of the form controls, so they line up when paired inline.

<DemoSingle name="button" id="button-with-input" />

## Throttle & debounce

Rate-limit clicks without writing a timer in your handler. `throttle` and `debounce` are backed by [`p-throttle`](https://github.com/sindresorhus/p-throttle) and [`p-debounce`](https://github.com/sindresorhus/p-debounce), and each emits its own event when it actually executes.

<DemoSingle name="button" id="rate-limit" />

Both take the option object or a bare number shorthand (`debounce="300"`); a spinning button blocks, but a debounce still re-arms on repeat clicks so it runs once you stop.

## Async loading

Bind the click's work as `handler` — its promise drives the button's own spinner, so there's no loading flag to manage. `loading` stays a read-only override, and `loading-change` reports the self-driven state.

However it is triggered, the spinner is drawn **in the icon's place** — a leading icon spins on the left, `icon-position="right"` spins on the right, and a button with no icon grows a leading one. The caption always stays readable, so a label you swap to "Saving..." is still there to read.

<DemoSingle name="button" id="async-loading" />

### Where the spinner goes

It replaces the icon rather than joining it, on whichever side the icon sits — so a busy button never shows an icon and a spinner at once. A button with no icon grows a leading spinner in the slot an icon would have used, and an `icon-only` button simply swaps its icon for the ring.

<DemoSingle name="button" id="loading-icon" />

## Customized

Override per-element styling with the `cssClass` prop (Vue) or extra utility classes on the wrapper's `class` (CSS) — the `mono-*` attributes carry the props, `class` stays free for your own.

<DemoSingle name="button" id="customized" />

## Width & height

Set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` — each takes a CSS string (`"220px"`, `"80%"`) or a number (px). Use `width="100%"` for a full-width button (replaces the old `fullWidth`).

<DemoSingle name="button" id="dimensions" />

## CSS Variables

<DemoSingle name="button" id="css-vars" />

Themed through `--mono-button-*` custom properties (apply them on the element / inline — they win over the color×variant matrix and pierce the shadow boundary). Re-skin globally via the Basecoat [tokens](./theme) (`--primary`, `--ring`, `--radius`, …).

The button is a port of Basecoat's `.btn` — every size and variant rule cites the upstream block it mirrors (`/* basecoat@1.0.2 styles/vega.css .btn[data-size='sm'] */` in `button.css`).

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-button-primary` / `-primary-foreground` | `--primary` / `--primary-foreground` | Primary colour (the default fill) and its ink |
| `--mono-button-secondary` / `-secondary-foreground` | `--secondary` / `--secondary-foreground` | The `secondary` surface (shadcn's muted surface, not a second hue) |
| `--mono-button-success` / `-danger` / `-warning` / `-info` / `-teal` / `-purple` / `-neutral` / `-dark` (+ `-foreground`) | matching token (`--success`, `--destructive`, …) | Per-colour fill and ink |
| `--mono-button-text` / `-background` / `-muted` / `-border` | `--foreground` / `--background` / `--muted` / `--border` | The neutral surfaces `light` and `text` paint with |
| `--mono-button-bg` | `--primary` | Resolved background |
| `--mono-button-color` | `--primary-foreground` | Resolved text colour |
| `--mono-button-border-color` | `transparent` | Resolved border colour |
| `--mono-button-shadow` | none (`--mono-shadow-xs` on `light` / outline) | Resolved shadow |
| `--mono-button-radius` | `--mono-radius-md` (`xs`/`sm` clamp to 8px / 10px) | Corner radius — wins over a `rounded` step |
| `--mono-button-ring-color` | `--ring` (the hue for outline / tonal) | Focus ring colour (3px at 50%) |
| `--mono-button-hover-bg` | resting bg at 80% | Hover background |
| `--mono-button-hover-color` / `-hover-border-color` / `-hover-shadow` | resting values | Hover ink / border / shadow |
| `--mono-button-tint` / `-tint-hover` | `--mono-mode-tint` (10% / 20%, dark 20% / 30%) | Tonal and text-hover alpha |
| `--mono-button-<color>-soft` / `-soft-hover` | the colour at the tint alphas | Tonal fill at rest / on hover |
| `--mono-button-font-weight` / `-text-transform` | `--mono-font-weight-medium` / `none` | Label treatment (a flavor's uppercase reaches the shadow build through these) |
| `--mono-button-plain-hover-bg` / `-plain-hover-border-color` | the tint / `transparent` | Hover of `variant="text"` |
| `--mono-button-width` / `-justify` | `auto` / `center` | How much room the control takes and where its content sits. They exist so a component that EMBEDS buttons can turn one into a list row — [button-dropdown](./button-dropdown) sets `100%` / `flex-start` on the `<li>`, which is the only route that also reaches the control in the shadow build |
| `--mono-button-press-translate` | `0 1px` | The `:active` nudge. `0 0` removes it — right for a row in a menu, wrong for a standalone button |

Deprecated since the Basecoat port (accepted, no effect): `--mono-button-<color>-lite(-hover)` (tonal has no border), `--mono-button-shadow-<color>` (no glows), `--mono-button-<color>-dark` / `-dark-deep`, `--mono-button-accent`, `--mono-button-light-bg(-2)` (were gradient stops).

## Types

<DemoTypes name="button" />
