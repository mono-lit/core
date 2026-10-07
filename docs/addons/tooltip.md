# Tooltip

Tooltips for **any** element: plain HTML, light `<mono-*>` components, and shadow `<mono-shadow-*>` hosts. Positioning comes from [Floating UI](https://floating-ui.com/).

Turn the addon on once, then write the attribute. No component needs any tooltip code:

```ts
// main.ts
import { createMonoTooltip } from '@mono-lit/helper'
app.use(createMonoTooltip())
```

```vue
<mono-button mono-tooltip-content="Save changes">Save</mono-button>
<button mono-tooltip-content="Works on plain HTML too">…</button>
```

For tooltips set up from code (content computed per element, a ref, manual show/hide), use [`controlMonoTooltip`](#controller).

::: tip Install
`@floating-ui/dom` and `@floating-ui/core` are **optional peers**. They aren't bundled, and you install them yourself:

```sh
pnpm add @floating-ui/dom @floating-ui/core
```

They load the first time a tooltip opens, not on import, so registering tooltips costs nothing until someone hovers. If the packages are missing, the tooltip doesn't open, and the console names the packages and the install command.
:::

## Basic

<ClientOnly><DemoSingle name="tooltip" id="basic" /></ClientOnly>

`mono-tooltip-content` holds the text; `mono-tooltip-message` is an alias for it. Bind it like any attribute (`:mono-tooltip-content="msg"`). If the value changes while the tooltip is open, the tooltip updates in place. An empty value shows nothing, so `:mono-tooltip-content="''"` turns one element's tooltip off.

The attributes only work after `createMonoTooltip()` has run: in `main.ts`, or through `mono.helper.tooltip` in Nuxt (see [Global options](#global-options)). Nothing is looked up in advance. One shared set of `document` listeners checks each hover, focus or click against the attribute, so elements added later by `v-if`, `v-for` or a route change work automatically.

## Attribute options

<ClientOnly><DemoSingle name="tooltip" id="attribute-options" /></ClientOnly>

Every option has a `mono-tooltip-<option>` attribute. An element's attributes **beat the global options** for that element, because they are the most specific setting there is.

| Attribute | Value |
| --- | --- |
| `mono-tooltip-content` / `mono-tooltip-message` | the text |
| `mono-tooltip-placement` | `top`, `bottom-start`, `right-end`, … |
| `mono-tooltip-variant` | `inverted`, `popover` |
| `mono-tooltip-color` | `primary`, `danger`, … |
| `mono-tooltip-size` | `sm`, `md`, `lg` |
| `mono-tooltip-trigger` | `hover`, `focus`, `click`, `manual`; several separated by spaces or commas |
| `mono-tooltip-delay` | `300`, or `300 100` for show and hide |
| `mono-tooltip-offset` / `mono-tooltip-padding` | a number (px) |
| `mono-tooltip-max-width` / `mono-tooltip-class` | a CSS length / class names |
| `mono-tooltip-arrow`, `-flip`, `-shift`, `-interactive`, `-html`, `-disabled`, `-hide-on-click` | on when present; `="false"` turns it off |

`mono-tooltip-html` renders the text as HTML. **Only use it with trusted strings.**

## Controller

<ClientOnly><DemoSingle name="tooltip" id="controller" /></ClientOnly>

`controlMonoTooltip(target, options)` attaches one set of options to every element that matches `target`. It doesn't need `createMonoTooltip()`. Use it when the content comes from code: a function per element, a `Node`, or manual `show()`/`hide()`. The call can go in `<script setup>`, before the elements exist, or in `onMounted`; both work.

```ts
import { controlMonoTooltip } from '@mono-lit/helper'

const tip = controlMonoTooltip('.row-action', { content: (el) => el.dataset.help, placement: 'bottom' })
onBeforeUnmount(() => tip.destroy())
```

Don't point a controller at an element that also has `mono-tooltip-content`, or both tooltips open.

### Target

| `target` | Matches |
| --- | --- |
| `'.class'`, `'#id'`, `'[data-x]'`, `'mono-button'` | any CSS selector |
| `element` | that element |
| `[a, b]`, `NodeList` | each element |
| `ref(null)`, `() => el` | whatever the ref / getter holds **when the event fires** |

### Content

If `content` is omitted, the anchor provides the text. The first of these that is set wins:

1. `mono-tooltip-content` / `mono-tooltip-message`
2. `title`
3. `aria-label`

While our tooltip is open, a native `title` is moved aside so the browser's own tooltip doesn't appear on top of it.

`content` can also be a string, a `Node`, or a function `(anchor) => string | Node`. The function is called on every show, so one controller can show different text for each row. If it returns `null` or `''`, the tooltip doesn't open.

## Placement

<ClientOnly><DemoSingle name="tooltip" id="placement" /></ClientOnly>

`placement` is the preferred side. If there isn't room there, `flip` moves the tooltip to the other side, and `shift` slides it along the anchor to keep it on screen. `padding` sets how far it stays from the viewport edge. The position is recalculated while the page scrolls or resizes, and the tooltip hides if the anchor scrolls out of view.

## Triggers

<ClientOnly><DemoSingle name="tooltip" id="triggers" /></ClientOnly>

| `trigger` | Opens on | Closes on |
| --- | --- | --- |
| `'hover'` | pointer enters (mouse and pen; a touch tap counts as a click) | pointer leaves |
| `'focus'` | **keyboard** focus (`:focus-visible`) | blur |
| `'click'` | click on the anchor | a second click, or a click outside |
| `'manual'` | `tip.show()` | `tip.hide()` |

The default is `['hover', 'focus']`. `Escape` closes the tooltip; if a modal is open underneath, the next `Escape` closes the modal. With `hideOnClick` (on by default), clicking the anchor closes a hover tooltip, and it stays closed until the pointer leaves the anchor.

## Mono components (light + shadow)

<ClientOnly><DemoSingle name="tooltip" id="components" /></ClientOnly>

Matching uses the event's **composed path**, so it crosses shadow boundaries:
- An attribute or selector on a `<mono-shadow-button>` host works just like on a light `<mono-button>`.
- A ref can also point at a node inside an open shadow root.
- Put `mono-tooltip-*` on the component's own tag. The attribute stays there, and it is never copied onto a component's dropdown panel.

The tooltip element itself is added to `<body>`, outside every shadow root. That means the global `@mono-lit/helper/ui/index.css` styles it the same way for both builds. It also joins the shared popup stack, so a tooltip on a button inside an open modal appears above the modal.

## Interactive and HTML content

<ClientOnly><DemoSingle name="tooltip" id="interactive" /></ClientOnly>

With `interactive: true`, the tooltip stays open while the pointer is over it, so links and buttons inside it can be clicked. `allowHTML: true` renders string content as HTML. **Only pass trusted HTML.** Without it, strings are set as plain text.

## Variants, colours, sizes

<ClientOnly><DemoSingle name="tooltip" id="variants" /></ClientOnly>

## Global options

`createMonoTooltip` does two things:
- it turns on the `mono-tooltip-*` attributes;
- it sets options for every tooltip in the app.

**Global options override per-call options**, so a single `controlMonoTooltip` call can't drift from the app-wide design. An element's own `mono-tooltip-*` attributes still override the global options for that element. Keys a layer leaves unset fall through to the layer below.

Precedence: defaults ← `controlMonoTooltip(target, options)` ← `createMonoTooltip(options)` ← the element's `mono-tooltip-*` attributes.

`createMonoTooltip({ attributes: false })` keeps the global options but turns the attributes off.

::: code-group

```ts [Vue — main.ts]
import { createApp } from 'vue'
import { createMonoTooltip } from '@mono-lit/helper'
import App from './App.vue'

createApp(App)
  .use(createMonoTooltip({ delay: [300, 0], variant: 'popover' })) // or just call it
  .mount('#app')
```

```ts [Nuxt — nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@mono-lit/helper/nuxt'],
  mono: {
    helper: {
      tooltip: { delay: [300, 0], variant: 'popover' }, // or `true` for no options
    },
  },
})
```

:::

In Nuxt, the options are passed to a **client-only** plugin that calls `createMonoTooltip`. That means they must be plain JSON: a `content` function, `onShow`/`onHide` callbacks or DOM nodes won't survive. The module also pre-bundles `@floating-ui/dom`, so the first hover doesn't make Vite re-optimize and reload the page.

On the server, `controlMonoTooltip` does nothing, so calling it in `<script setup>` under SSR is safe.

## Options

| Option | Type | Default |
| --- | --- | --- |
| `content` | `string \| Node \| (anchor) => string \| Node \| null` | from the anchor |
| `allowHTML` | `boolean` | `false` |
| `placement` | `'top' \| 'top-start' \| 'top-end' \| 'right…' \| 'bottom…' \| 'left…'` | `'top'` |
| `offset` | `number` (px gap) | `6` |
| `padding` | `number` (px kept from the viewport edge) | `8` |
| `flip` / `shift` | `boolean` | `true` |
| `arrow` | `boolean` | `true` |
| `trigger` | `'hover' \| 'focus' \| 'click' \| 'manual'` or an array | `['hover', 'focus']` |
| `delay` | `number \| [show, hide]` (ms) | `[100, 0]` |
| `interactive` | `boolean` | `false` |
| `maxWidth` | CSS length | `--mono-tooltip-max-width` → `20rem` |
| `variant` | `'inverted' \| 'popover'` | `'inverted'` |
| `color` | `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `teal`, `purple`, `neutral`, `dark` | — |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `class` | extra class(es) on the tooltip element | — |
| `appendTo` | `Element \| () => Element` | `document.body` |
| `disabled` | `boolean` | `false` |
| `hideOnClick` | `boolean` | `true` |
| `onShow` / `onHide` | `(anchor, tooltip) => void \| false` (return `false` to cancel) | — |

## Controller API

```ts
const tip = controlMonoTooltip('.x', options)

await tip.show(el?)     // open on el (default: the first element matching the target)
tip.hide()
await tip.toggle(el?)
tip.update({ placement: 'left' })  // merge into this call's options
tip.setContent('New text')         // re-renders an open tooltip in place
tip.enable() / tip.disable()
tip.isOpen; tip.anchor; tip.tooltip
tip.destroy()           // call from onBeforeUnmount
```

`monoTooltip` is an alias for `controlMonoTooltip`. `destroyAllMonoTooltips()` closes every tooltip and releases every controller.

## Theme

Every colour comes from theme tokens:
- `--foreground` and `--background` for the default inverted bubble;
- `--popover` and `--popover-foreground`, with the select panel's ring and shadow, for `variant: 'popover'`;
- the palette pairs for `color`.

Because of this, flavours, colour presets and `.dark` all apply automatically. The corner radius follows each flavour's `--mono-tooltip-radius`.

A section with its own theme, such as `<div class="mono-theme dark theme-color-rose">`, is handled too: the tooltip copies the nearest such wrapper's theme classes, so it matches the section even though the element itself sits on `<body>`.

## Customising

| Variable | Default |
| --- | --- |
| `--mono-tooltip-bg` / `--mono-tooltip-color` | `--foreground` / `--background` |
| `--mono-tooltip-radius` | per flavour, else `--mono-radius-md` |
| `--mono-tooltip-ring` / `--mono-tooltip-shadow` | none (inverted), dropdown ring/shadow (popover) |
| `--mono-tooltip-max-width` | `20rem` |
| `--mono-tooltip-arrow-size` | `calc(var(--mono-spacing) * 2.5)` |
| `--mono-tooltip-font-size`, `-line-height`, `-padding-x`, `-padding-y` | `text-xs`, `1.5 × 3` spacing |
| `--mono-tooltip-font-family` | `--font-sans` |

The element is `<div class="mono-tooltip" role="tooltip" mono-tooltip data-side="top">`. Its attributes are:
- `mono-variant`, `mono-color`, `mono-size`, `mono-interactive`, `mono-arrow`;
- `data-open` while shown.

Target those attributes (or your own `class` option) for anything the variables above don't cover.

## Accessibility

- The tooltip has `role="tooltip"`, and the anchor gets `aria-describedby` pointing at it while it is open. The attribute is restored afterwards.
- Keyboard focus opens it; `Escape` closes it (WCAG 1.4.13).
- A mouse click that moves focus does **not** reopen it.

## Optional dependency

`@floating-ui/*` is left external in both the light and the shadow builds, so your bundler resolves and splits it. `@mono-lit/helper/tooltip` (and the same exports from `@mono-lit/helper`) contain no custom elements, so importing them registers nothing.
