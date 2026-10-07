# Skeleton

Loading skeletons for **every** mono component, measured from the component's real DOM — no hand-drawn placeholder per screen. Rendering comes from [phantom-ui](https://github.com/Aejkatappaja/phantom-ui), a structure-aware shimmer web component.

There is nothing to call and nothing to import in your code: every `<mono-*>` element already has a `pending` prop. Install the peer and it is on.

::: tip Install
`@aejkatappaja/phantom-ui` is an **optional peer**. It is not bundled; you install it:

```sh
pnpm add @aejkatappaja/phantom-ui
```

- **Nuxt** (`@mono-lit/helper/nuxt`): nothing else. The module sees the package, loads it in a client plugin before the app mounts, and tells mono whether the app renders on the server.
- **Vue**: one side-effect import in `main.ts`, before `app.mount()`:

  ```ts
  import '@aejkatappaja/phantom-ui'
  ```

mono activates the moment the `<phantom-ui>` element is defined — however it got there. Without the package, `pending` degrades to the [CSS-only block skeleton](#css-only-the-mono-pending-attribute) for manual values; the automatic behaviour stays off.
:::

## How it looks

While pending, the element's content is rendered inside `<phantom-ui loading>`: phantom measures every leaf (text, inputs, buttons, images) and overlays an animated block at the same coordinates, so the skeleton has the component's exact shape. When pending ends, the overlay fades and the real content is already there.

The colours and radius come from the **mono theme** — the muted surface for the blocks, a translucent foreground wash for the sweep, the theme radius for the frame — so the skeleton follows every flavor and `.dark` with no extra setup.

## `pending`

| Form | Example | Meaning |
| --- | --- | --- |
| attribute | `<mono-card pending>` / `pending="true"` | on |
| attribute | `pending="false"` | off |
| attribute | absent, or `pending="auto"` | **auto** (see below) |
| property | `:pending="busy"` | `true` / `false` follow the ref |
| property | `:pending.prop="{ active: busy, count: 6 }"` | `active` plays the boolean's part (omit it for auto); the other keys are phantom options |

```vue
<mono-card :pending="store.loading">
  …
</mono-card>

<!-- a manual busy state wider than one request -->
<mono-select :pending.prop="{ active: filtering, animation: 'pulse' }" :data-source.prop="deptSource" />
```

A manual value always wins over the automatic one.

### Phantom options

Any of phantom-ui's options can be given in the object form, in camelCase; mono applies them to the wrapper as attributes:

`animation` (`shimmer` · `pulse` · `breathe` · `solid`), `mode` (`skeleton` · `overlay`), `shimmerDirection`, `shimmerColor`, `backgroundColor`, `duration`, `stagger`, `reveal`, `count`, `countGap`, `fallbackRadius`, `loadingLabel`, `pierceShadow`, `debug`.

Resolution for each option: the element's object → the tag default → the global default → phantom's own.

## Automatic mode

With no manual value, `pending` resolves itself:

| | SSR app (Nuxt `ssr: true`) | SPA |
| --- | --- | --- |
| light `<mono-*>` | **pending on first connect**: data-driven elements until their first load, everything else until the page's data-driven elements are done | off |
| shadow `<mono-shadow-*>` | off | off |

How a light element releases itself:

- **Render-driven** elements (button, input, card, chip, tabs, …) hold their skeleton **while the page is loading** — i.e. while any data-driven element on the page is still waiting for its first load — and release together with the last of them, so the page swaps in as one. On a page with no data-driven element they release in the same microtask as their first update, **before the first paint**: nothing flashes. Held elements are drawn by the **CSS block** (`mono-pending` on the host), not by phantom: they mount once and the release is a single attribute removal, so a page switch costs no extra renders.
- **Who draws what**: phantom-ui measures the elements worth measuring — `mono-table-loading`'s placeholder rows, `mono-select` / `mono-tag-input` / `mono-chart` / `mono-dropdown-table`, and any element with a manual `pending`. The small table helpers (`mono-table-th`, `-search`, `-paging`, `-info`, …) use the CSS block (`static monoPendingDraw = 'css'`), because their measured skeleton would be one bar anyway.
- **Data-driven** elements stay pending until their **first load** has finished:
  - every `mono-table-*` helper bound to a `monoDataGrid` controller (`hasLoaded`),
  - `mono-select` / `mono-tag-input` with a `dataSource` (static `items` release immediately),
  - `mono-chart` with a controller (or until raw `data` is set),
  - `mono-dropdown-table` (its grid's first load).

  A failed first load releases too (the error is the answer), and so does a controller that is **not loading one tick after mount** — a page that fetches on mount has started by then, so that grid is waiting for a user action. `maxWait` (default 15 s) is the safety net for a load that never reports.
- `mono-modal` / `mono-drawer` are never automatic (an overlay has nothing to measure while closed); manual `pending` still works.

The SSR flag comes from `@mono-lit/helper/nuxt` (`nuxt.options.ssr`). Outside Nuxt, a server-rendered app opts in with `createMonoUI({ skeleton: { ssr: true } })`; otherwise mono sniffs Nuxt's payload marker and falls back to `false`.

::: tip Why "SSR app"?
The shell of an SSR app is already on screen when the page's light components mount, so the gap worth covering is each component's first data load — the table rows, the options of a select. In a SPA nothing was painted before the components, and the default stays off so existing apps do not change.
:::

## Tables

A mono table is a native `<table class="mono-table">` plus helper elements, so there is no single element to wrap. Instead:

- `<mono-table-loading>` has a **pending mode**: for the controller's first load it shows a block of placeholder rows that mirror the header (one bar per `<th>`, at the header's column widths, as many rows as the page size, 8 for "show all"). Afterwards it is the spinner overlay it always was, for every later reload.
- `<mono-table-th>` shimmers its caption (the sort and filter buttons are left out).

```vue
<table class="mono-table">
  <caption><mono-table-loading :control-table.prop="table" /></caption>
  …
</table>
```

Tune the placeholder per app with a tag default — `createMonoUI({ 'mono-table-loading': { pending: { count: 6 } } })`.

## Defaults

Global phantom defaults and per-tag defaults go through [`createMonoUI`](/ui/global-defaults), so they reach the light and the shadow build alike:

```ts
createMonoUI({
  // global phantom defaults (+ the ssr flag outside Nuxt); `false` disables the skeleton
  skeleton: { animation: 'pulse', duration: 1.2 },
  // per tag — `pending` inside a tag's config is a DEFAULT, merged under the element's own
  'mono-table-loading': { pending: { count: 6 } },
  'mono-chart': { pending: false }, // never automatic for charts
})
```

Nuxt: `mono: { helper: { skeleton: { animation: 'pulse' } } }` is the same thing; `skeleton: false` turns it off even when the package is installed.

## CSS-only: the `mono-pending` attribute

The JS-free half of the feature. Put `mono-pending` on **any** element and it paints as a skeleton block — no script — so it works in server HTML, during the hydration window, and anywhere phantom-ui has nothing to measure yet. The paint is phantom-ui's own: the block is `--shimmer-bg`, the sweep is phantom's `.shimmer-block::after` gradient (`90deg`, bg → color → bg, `200%` track, linear, `--shimmer-duration`), `pulse` / `breathe` / `solid` / `overlay` and the reduced-motion fallback are its rules restated, and the three knobs resolve from the same mono tokens the wrapper hands to phantom. One block per element instead of one per measured leaf — otherwise indistinguishable, so the hand-off from the CSS block to phantom's measured blocks is a change of shape, never of colour or rhythm:

```html
<div mono-pending style="height:2rem"></div>
<p mono-pending mono-pending-animation="pulse">Text that is not there yet</p>
<section mono-pending mono-pending-mode="overlay">… dimmed, swept, still laid out …</section>
```

| Attribute | Values |
| --- | --- |
| `mono-pending` | present (or anything but `"false"`) = on |
| `mono-pending-animation` | `shimmer` (default) · `pulse` · `breathe` · `solid` |
| `mono-pending-mode` | `skeleton` (default: one block, content hidden) · `overlay` (content stays, dimmed, swept) |

The mono elements use the same vocabulary: while `pending` resolves true, the element sets `mono-pending` (+ `-animation` / `-mode` from the resolved phantom options) on its **host**, so it is a block the instant it exists. Once phantom-ui is defined the host also carries `mono-pending-covered` and the CSS paint steps aside for phantom's measured blocks. **Without phantom-ui installed, this is the skeleton**: a manual `pending` still shows the block; only the automatic page/data-aware behaviour needs the peer. Shadow hosts get the same rules (`:host([mono-pending])`), and a server-rendered `<mono-shadow-x pending>` is a skeleton before hydration through `:host([pending])`.

Nuxt apps with client-only pages: render the page-slot placeholder out of `mono-pending` blocks (see the esw-ui host module `esw-routes.ts`, `pageSkeleton`) and the window between the first byte and the page mount is covered too.

## Theming

Four hooks, read by the wrapper and inherited into phantom's overlay. Set them on `:root`, a theme class, or one element:

```css
:root {
  --mono-skeleton-bg: var(--muted);        /* block colour */
  --mono-skeleton-color: rgb(0 0 0 / 8%);  /* sweep colour */
  --mono-skeleton-duration: 1.2s;
  --mono-skeleton-radius: var(--radius);   /* the wrapper's frame */
}
```

The defaults resolve from the theme tokens (`--muted`, `--foreground`, `--radius`, …), which already change per flavor and under `.dark`. The legacy compile-time bars (`client-skeleton-*`, below) use the same hooks.

## Things to know

- **The wrapper exists only while pending.** While `pending` is on, the element renders its content inside `<phantom-ui loading>`; the moment it releases, the DOM is exactly what it is without the skeleton (the component's root is the host's direct child again, slotted content re-homed, `controlMono*` refs still valid). The flip re-renders the inner DOM once — content was hidden under the shimmer anyway.
- **Load the peer before mounting.** An element that rendered before `phantom-ui` was defined paints its first frame without a skeleton; `getMonoSkeletonStatus().createdBeforeActive` counts them and the console warns once. The Nuxt plugin and a `main.ts` import both run early enough.
- **Nested pending.** A card still pending around a table still pending shows one skeleton — the outer one; the inner goes transparent.
- **Interaction.** phantom marks the measured content `inert` while loading (and sets `aria-busy`), so a control inside a pending element cannot take focus until it releases. Popups mono portals to `<body>` are not affected.
- **Shadow builds.** `pending` works there manually; the wrapper is created the first time it turns on (never on the server-rendered hydrating pass).
- **Status.** `getMonoSkeletonStatus()` → `{ active, ssr, createdBeforeActive, createdBeforeActiveTags }`; `resetMonoSkeleton()` clears defaults and counters (tests).

## Legacy: `client-skeleton-*`

Before `pending`, `@mono-lit/helper/nuxt` could render a fixed set of gray bars as the `<ClientOnly>` fallback of a wrapped light element, driven by compile-time attributes (`client-skeleton-type`, `-bar`, `-count`, `-class`). That path still exists when `mono.helper.clientOnly` is on, and its bars now use the theme hooks above. Prefer `pending`: it needs no wrap, no per-element markup, and follows the component's real shape.
