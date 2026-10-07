# Global Defaults

`createMonoUI` changes the **default props** of any mono component for the whole app. For example, it can make every button `xs` or every input clearable. It applies to the light (`mono-*`) and the shadow (`mono-shadow-*`) build alike.

```ts
// main.ts
import { createApp } from 'vue'
import { createMonoUI } from '@mono-lit/helper'
import App from './App.vue'

createMonoUI({
  'mono-button': { size: 'xs', variant: 'outline' },
  'mono-input':  { size: 'sm', clearable: true },
  'mono-card':   { variant: 'outlined' },
})

createApp(App).mount('#app')
// or: createApp(App).use(createMonoUI({ … })).mount('#app')
```

## Call it first

Call `createMonoUI` **before any mono element is created**, which in practice means first in `main.ts`, before `app.mount()`. Each element picks up the defaults once, when it is constructed. That's what lets components that act on their props while connecting (sizes, `searchable`, data paging, …) see your values from the very first render.

An element created before the call keeps its built-in defaults, and the call warns you about it:

```
[mono-ui] createMonoUI() ran after 3 mono elements were created (mono-button, mono-input);
those keep their built-in defaults. Call createMonoUI() first in main.ts, before app.mount().
```

To assert it in code:

```ts
import { getMonoUIStatus } from '@mono-lit/helper'

const { configured, createdBefore } = getMonoUIStatus()
// configured: true, createdBefore: 0  → every element got the defaults
```

Importing component modules (`import '@mono-lit/helper/ui/button'`) before the call is fine. Only **creating** elements counts.

## Precedence

From weakest to strongest:

1. the component's built-in default;
2. `createMonoUI`;
3. what you write on the element: an attribute or prop (`<mono-button size="lg">`), or a value from a controller (`monoDataGrid({ props })`, `monoForm`).

So a global default never overrides a value you set explicitly.

## Light and shadow

One key configures both builds: `'mono-button'` also applies to `<mono-shadow-button>`. To give the shadow build something different, add its own key, which is merged on top:

```ts
createMonoUI({
  'mono-button':        { size: 'xs' },
  'mono-shadow-button': { size: 'sm' }, // only the shadow build
})
```

Props can be written in camelCase (`iconPosition`) or kebab-case (`'icon-position'`). Object and array values (`cssClass`, `items`, …) are copied for each element, so one element can't change another's. An unknown prop, or a key that isn't `mono-*`, logs a warning and is ignored.

The config is typed per component: `size: 'huge'` on `mono-button` is a type error, and your editor completes each component's props.

## Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@mono-lit/helper/nuxt'],
  mono: {
    helper: {
      ui: {
        'mono-button': { size: 'xs' },
        'mono-input':  { size: 'sm' },
      },
    },
  },
})
```

The module runs `createMonoUI` in an early plugin **on the server and the client**, so shadow components render on the server with the same defaults the browser hydrates with. The values must be plain JSON.

## The skeleton: `skeleton` and `pending`

Two more things travel through `createMonoUI` for the automatic skeleton ([Addons → Skeleton](../addons/skeleton)): the reserved **`skeleton`** key holds its global phantom-ui options and the `ssr` flag (`false` disables it), and **`pending`** inside a tag's config is that tag's default — parked, not assigned, so an element's own `:pending.prop="{…}"` still merges over it.

```ts
createMonoUI({
  skeleton: { ssr: true, animation: 'pulse' },        // global (Nuxt sets `ssr` for you)
  'mono-table-loading': { pending: { count: 6 } },     // per tag
  'mono-chart': { pending: false },                    // never automatic
})
```

Merge order for each phantom option: element object → tag default → global → phantom's own.

## Things to know

- **Internal mono elements are affected too.** `mono-button-dropdown` renders its entries as real `mono-button`s, and `monoModal` dialogs render their buttons as `mono-button`s. A global `mono-button` size or variant reaches them unless they set their own.
- **Removing an attribute resets to the built-in default.** Some components reset a prop to their built-in value when its attribute is removed later (`icon-position`, `validation-state`, …), not to the global one.
- **Reconfiguring:** `createMonoUI` can be called again, and the new config applies to elements created afterwards. `resetMonoUI()` clears it, and `getMonoUI()` returns the current config.

## API

| Function | Returns |
| --- | --- |
| `createMonoUI(config)` | `{ config, install }`: sets the defaults (also usable with `app.use`) |
| `getMonoUI()` | the current config, or `null` |
| `getMonoUIStatus()` | `{ configured, createdBefore, createdBeforeTags }` |
| `resetMonoUI()` | clears the config |
