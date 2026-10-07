# Theme

@mono-lit/helper's look is **Basecoat UI's**. Three independent axes, all plain CSS classes on a root element, all crossing the shadow boundary through inherited custom properties:

| Axis | What it controls | Default | Options |
| --- | --- | --- | --- |
| **Flavor** (ONE, or a Basecoat *style*) | Per-component metrics — the control ladder, radius steps, paddings, text sizes, shadows | **ONE** | `one`, `vega`, `nova`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea` |
| **Theme color** (the palette) | Every colour token (light and, where the preset has one, dark) | **ONE** | `one`, `basecoat` |
| **Mode** | Light or dark values of the palette — ONE has no dark palette and stays light; Basecoat has both | light | `dark` |

They are orthogonal: **Nova** metrics with the **ONE** palette in dark mode is a valid combination. Components don't change — once a class is active, every `mono-*` component (light and shadow build alike) picks it up.

ONE (the EJI ONE design system) is the default: `index.css` applies it at `:root`, nothing to import or class. The other eight flavors are Basecoat's eight styles, mirrored 1:1: a style never touches tokens or fonts, only how each component is sized and shaped. Each ships as its own sheet — a vega base that resets what ONE sets, then the style's own overrides for the knobs ported components read (`--mono-control-height-*`, `--mono-button-<size>-radius`, `--mono-input-outline-*`, …). Ported so far: [button](./button), [input](./input), [select](./select), [date](./date), [tag-input](./tag-input), [checkbox](./checkbox), [radio](./radio), [switch](./switch), [card](./card), [textarea](./textarea). `node scripts/basecoat-styles.mjs --varying "^\.btn"` prints what a style changes for any upstream selector.

## Stylesheets

```ts
// Required — tokens, both colour presets, every component, the ONE flavor.
import '@mono-lit/helper/index.css'

// Optional — a Basecoat style. Import only the one(s) you actually use.
import '@mono-lit/helper/ui/theme/vega.css'
import '@mono-lit/helper/ui/theme/nova.css'
// … maia, lyra, mira, luma, sera, rhea

// Optional — the token layer on its own (for styling your own markup with the same vocabulary).
import '@mono-lit/helper/ui/theme/tokens.css'
```

`index.css` already contains both **colour** presets (and Basecoat's dark values), so you never need a second import for colours — only the Basecoat **flavors** live in their own opt-in files.

## Fonts

Every flavor names its own font — ONE uses Poppins, the Basecoat styles use Geist (Geist Mono for code) — but no font files ship in `index.css`. Self-hosted sheets are opt-in:

```ts
import '@mono-lit/helper/ui/font/poppins.css'    // sans — ONE's own family
import '@mono-lit/helper/ui/font/geist.css'      // sans — the Basecoat styles' own family
import '@mono-lit/helper/ui/font/inter.css'      // sans — not a flavor default, an alternative
import '@mono-lit/helper/ui/font/geist-mono.css' // mono — code, the rich-text editor's code view
```

**Importing a sheet makes that font universal.** Besides its `@font-face` rules, a sheet sets one override hook on `:root`: `--mono-font-sans` or `--mono-font-mono`. Every flavor declares its family through that hook, `--font-sans: var(--mono-font-sans, <its own stack>)`, and no flavor sets the hook itself. So:

| You import | Result |
| --- | --- |
| nothing | each flavor's own default, drawn only if the browser already has it (ONE: Poppins; Basecoat styles: "Geist Sans"), else the system font |
| `inter.css` | Inter in **every** flavor, and it stays Inter when the user switches flavor |
| `poppins.css` | Poppins in every flavor, the Basecoat styles included |
| `geist.css` | Geist in every flavor, ONE included |

The hook is plain inheritance, so it is live: loading a sheet at runtime (`await import('@mono-lit/helper/ui/font/inter.css')`, or a `<link>` you add or remove) switches the whole page, shadow components included, with nothing to call. Import one sheet per kind; with two sans sheets loaded, the later one in the cascade wins.

To use a font mono does not ship, set the hook yourself after your own `@font-face`:

```css
:root { --mono-font-sans: "Figtree", ui-sans-serif, system-ui, sans-serif; }
```

The sheets load their `.woff2` files from `node_modules/@mono-lit/helper/dist/ui/font/files/`, so a Vite dev server must be allowed to serve that path (`server.fs.allow`); otherwise it answers 403.

## How activation works

| | Default (no class) | Activate with class |
| --- | --- | --- |
| **Flavor** | ONE | `theme-vega` · `theme-nova` · `theme-maia` · `theme-lyra` · `theme-mira` · `theme-luma` · `theme-sera` · `theme-rhea` (and `theme-one` to re-apply ONE inside another flavor's subtree) |
| **Theme color** | ONE | `theme-color-one` · `theme-color-basecoat` |
| **Mode** | light | `dark` — on `<html>`, `<body>` or a `.mono-theme` wrapper (never on a component: `.mono-card.dark` is the *dark colour* variant) |

| Flavor | Basecoat style | Feel |
| --- | --- | --- |
| *(none)* / `theme-one` | — | EJI ONE design system: Poppins, 40px controls, 8px control radius, semibold labels, soft shadows |
| `theme-vega` | vega | The Basecoat default: rounded-md, h-9 controls |
| `theme-nova` | nova | Compact, rounded-lg, h-8 controls |
| `theme-maia` | maia | Pill-shaped, roomy padding, tinted outline surfaces |
| `theme-lyra` | lyra | Square corners, small type, 1px focus ring |
| `theme-mira` | mira | Dense: h-7 controls, text-xs, tight padding |
| `theme-luma` | luma | Pill-shaped and soft, 30% focus ring |
| `theme-sera` | sera | Editorial: square, uppercase, h-10 controls, wide padding |
| `theme-rhea` | rhea | Compact, rounded-2xl, 30% focus ring |

See [Color](./color) for every palette value in both modes.

## Tokens

The vocabulary is shadcn/ui's, so a [TweakCN](https://tweakcn.com) theme pastes in unchanged:

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  /* card, popover, secondary, muted, accent, destructive, border, input, ring, chart-1..5, sidebar-* */
}
.dark {
  --background: oklch(0.145 0 0);
  /* … */
}
```

Plus mono's extension roles — `--success`, `--warning`, `--info`, `--teal`, `--purple`, `--neutral`, `--dark`, each with a `-foreground` — and the engine subset ported components read: `--mono-spacing`, `--mono-text-*`, `--mono-radius-sm|md|lg|xl` (derived from `--radius`), `--mono-shadow-*`, `--mono-ring-width` / `--mono-ring-alpha`, `--mono-control-height-xs…xxl`.

Override tokens on `:root` / `.dark`, or on a wrapper that carries `class="mono-theme"` — that class is what lets the derived tokens (the radius ladder, the ring, the legacy `--theme-*` aliases) re-derive below the root.

::: details The pre-Basecoat `--theme-*` names
Every `--theme-*` variable still resolves (`--theme-primary` → `var(--primary)`, the `-rgb` triplets are generated per mode) through `ui/theme/legacy.css`, which `index.css` bundles until 2.0 and which is an opt-in import until 3.0. Prefer the Basecoat names in new code.
:::

---

## Manual (CSS classes)

```html
<html>
  <!-- ONE + ONE palette -->
</html>

<html class="theme-nova theme-color-basecoat">
  <!-- nova metrics, Basecoat palette (import nova.css) -->
</html>

<html class="theme-vega theme-color-basecoat dark">
  <!-- vega + Basecoat palette, dark (ONE's palette has no dark and would stay light) -->
</html>

<div class="mono-theme theme-sera theme-color-basecoat dark">
  <!-- only this subtree is sera + Basecoat + dark -->
</div>
```

---

## Automatic (Vue app)

@mono-lit/helper exports a small theming API so you can switch at runtime. It applies the right classes for you.

> **Naming note:** for backwards-compatibility the API calls the **color** axis `theme` (`applyTheme`, `themes`, `ThemeName`) and the **flavor** axis `flavor` (`applyFlavor`, `flavors`, `FlavorName`). `applyTheme({ color, flavor })` is the clearest entry point.

### 1. Set a theme on app start

```ts
// main.ts
import '@mono-lit/helper/index.css'
import '@mono-lit/helper/ui/theme/nova.css'        // only if you use nova
import { applyTheme } from '@mono-lit/helper'

applyTheme({ color: 'basecoat', flavor: 'nova' })   // defaults are { color: 'one', flavor: 'one' }
```

Shortcuts:

```ts
import { applyTheme, applyFlavor } from '@mono-lit/helper'

applyTheme('basecoat')     // change only the colour palette
applyFlavor('sera')        // change only the flavor (needs sera.css imported)
applyFlavor('one')         // back to the default flavor
```

### 2. A settings toggle with `<mono-select>`

`themes` / `flavors` give you the option lists (with display names), and `getCurrentTheme` / `getCurrentFlavor` read the active values; `flavorPresets[name].summary` is a one-line description of each style.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { applyTheme, getAllFlavors, getCurrentFlavor, type FlavorName } from '@mono-lit/helper'
import '@mono-lit/helper/ui/select'

const flavor = ref<FlavorName>(getCurrentFlavor())
const flavorOptions = computed(() => getAllFlavors())
function onFlavor(e: CustomEvent) {
  flavor.value = e.detail.value
  applyTheme({ flavor: flavor.value })
}
</script>

<template>
  <mono-select :model-value="flavor" :options.prop="flavorOptions" key-value="name" display-value="displayName" @change="onFlavor" />
</template>
```

### 3. Persist the choice

```ts
import { applyTheme, isValidTheme, isValidFlavor, DEFAULT_THEME, DEFAULT_FLAVOR, type ThemeName, type FlavorName } from '@mono-lit/helper'

export function restoreTheme() {
  if (typeof document === 'undefined') return     // SSR guard
  const savedColor = localStorage.getItem('app-theme-color')
  const savedFlavor = localStorage.getItem('app-theme')
  applyTheme({
    color: isValidTheme(savedColor ?? '') ? (savedColor as ThemeName) : DEFAULT_THEME,
    flavor: isValidFlavor(savedFlavor ?? '') ? (savedFlavor as FlavorName) : DEFAULT_FLAVOR,
  })
}
```

### 4. React to changes

Every change dispatches a `theme-changed` event on `window`:

```ts
window.addEventListener('theme-changed', (e) => {
  const { color, themeData, flavor, flavorData } = (e as CustomEvent).detail
})
```

> **SSR note:** the API touches `document`, so call it on the client only.

---

## Scrollbar

Every mono scroll area — dialog bodies, dropdown panels, the table's horizontal scroller,
the filter builder — paints the same scrollbar in place of the browser's own: an **8px
pill thumb on a transparent track**. It is one design shared by every theme and flavor, so
switching palette or structure never changes it.

The thumb colour derives from `currentColor` — the text colour of the panel the scroll area
sits in. That is what keeps it right everywhere with no configuration: dark on a white
modal, pale on a panel a flavor paints in a brand colour, and correct on a theme that does
not exist yet.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-scrollbar-size` | `8px` | Rail width (and height, for horizontal bars) |
| `--mono-scrollbar-radius` | `999px` | Thumb corner radius |
| `--mono-scrollbar-thumb` | `currentColor` at 22% | Thumb fill |
| `--mono-scrollbar-thumb-hover` | `currentColor` at 38% | Thumb fill under the pointer |
| `--mono-scrollbar-track` | `transparent` | The groove behind the thumb |

Set them on any ancestor to retheme a subtree, or on `:root` for the whole app:

```css
:root {
  --mono-scrollbar-size: 6px;
  --mono-scrollbar-thumb: color-mix(in oklab, var(--primary) 30%, transparent);
}
```

### On your own elements

Add `class="mono-scrollbar"` to any scrollable element of your own to give it the same bar:

```html
<div class="mono-scrollbar" style="max-height: 12rem; overflow-y: auto">…</div>
```

> **Firefox** exposes no numeric scrollbar width — `thin` is all it has — so
> `--mono-scrollbar-size` and `--mono-scrollbar-radius` apply in Chrome, Edge and Safari,
> while Firefox gets a thin bar in the same thumb colour.
>
> Note also that Chrome ignores **all** `::-webkit-scrollbar` styling on an element that
> sets `scrollbar-width` or `scrollbar-color`. If you want a different scrollbar, override
> the tokens above rather than writing those properties yourself — setting them would
> switch Chrome back to its own bar.

---

## API reference

| Export | Purpose |
| --- | --- |
| `applyTheme(name \| { color?, flavor? })` | Set the colour palette and/or the flavor |
| `applyFlavor(name)` | Set only the flavor |
| `themes` / `flavors` | Records of `{ name, displayName }` for colour presets / flavors |
| `themePresets` / `flavorPresets` | The authored palettes (hex, light + dark) / each flavor's `summary` and control ladder |
| `DEFAULT_THEME` / `DEFAULT_FLAVOR` | `'one'` / `'one'` |
| `getCurrentTheme()` / `getCurrentFlavor()` | Read the active colour / flavor |
| `getAllThemes()` / `getAllFlavors()` | Arrays of the configs (for dropdowns) |
| `isValidTheme(s)` / `isValidFlavor(s)` | Type-guards for stored strings |
| `resetTheme()` / `resetFlavor()` | Reset to the defaults |
| `createThemeClass(name)` / `createFlavorClass(name)` | Build the CSS class string (e.g. for SSR markup) |
| `ThemeName` / `FlavorName` / `ThemeMode` | `'one' \| 'basecoat'` / `'one' \| 'vega' \| … \| 'rhea'` / `'light' \| 'dark' \| 'system'` |

> The API applies classes to `<body>` and mirrors the state on `<html>` via `data-theme-color` / `data-theme`. If you only ever theme statically, skip the API and use the CSS classes from the **Manual** section.
