# Getting started

Mono UI is a small set of [Lit](https://lit.dev)-powered web components — `<mono-button>`, `<mono-input>`, `<mono-card>`, etc. They're standard custom elements, so they work in Vue, React, Svelte, plain HTML, or anywhere custom elements run.

## Install
Place below code inside your `package.json` after that just install with `pnpm i`. You'll need a [GitHub token](https://github.com/settings/tokens), `lit` is a peer dependency — it ships separately so you can share one copy across the components and your own code.


```json
{
    "devDependencies": {
        "lit": "^3.3.2",
        "@mono-lit/helper": "git+https://<GITHUB_CLASSIC_TOKEN>@github.com/Nemure231/mono#path:/packages/helper"
    }
}
```

## Load the styles

Import the global stylesheet once, near the top of your app entry. It registers the CSS variables every component reads (colors, spacing, density, light/dark) and the scoped rules that paint each element.

```ts
import '@mono-lit/helper/ui/index.css'
```

## Tree-shakeable imports

Each component lives at its own subpath. Import only the ones you use — the rest never enter your bundle.

```ts
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/card'
```

Importing the module is enough — the file calls `customElements.define('mono-…', …)` as a side effect, and the tag becomes available everywhere.

## Use in Vue

Two pieces of one-time setup are needed in `vite.config.ts` (or your VitePress config). Tell Vue to skip its component resolver for `mono-*` tags so it leaves them alone for the browser to handle:

```ts
import vue from '@vitejs/plugin-vue'

export default {
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag.startsWith('mono-'),
                },
            },
        }),
    ],
}
```

Then any component renders just like an HTML element:

```vue
<script setup>
import { ref } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/button'

const name = ref('')
</script>

<template>
    <mono-input
        label="Name"
        :model-value="name"
        @input="name = $event.detail.modelValue"
    ></mono-input>

    <mono-button color="primary" @click="alert(`Hello ${name}`)">
        Say hi
    </mono-button>
</template>
```

### TypeScript suggestions

Every `<mono-*>` tag is typed for Vue — start typing inside one and your editor lists its real props with their real types:

```vue
<mono-button co⌶
             │ color        ButtonColor
             │ circle       boolean
             │ css-class    ButtonCssClass
```

This is **automatic**. `@mono-lit/helper` ships a generated `GlobalComponents` augmentation (`dist/vue.d.ts`) that maps all 77 registered tags — light and `mono-shadow-*` — to the prop interfaces the components already declare, and the package's types entry references it. Importing anything from `@mono-lit/helper` activates it; there is nothing to install or configure. It covers native attributes (`id`, `class`, `style`, `data-*`), directives, `key`/`ref`, and `.prop` bindings.

To also turn a **typo into an error**, switch on Volar's strict template checking — without it you get completions but unknown attributes pass silently:

```jsonc
// tsconfig.json
{
  "vueCompilerOptions": { "strictTemplates": true }
}
```

```vue
<mono-button color="primary" id="save" />  <!-- ✓ -->
<mono-button colr="primary" />             <!-- ✗ Did you mean to write 'color'? -->
```

::: tip Non-Vue projects
`vue` is an **optional** peer dependency, so nothing breaks if you don't use Vue. If you'd rather wire the types explicitly than have them arrive with the main import, `@mono-lit/helper/vue` exposes the same augmentation: `import type {} from '@mono-lit/helper/vue'`.
:::

::: warning No suggestions? Check for two copies of `vue`
The augmentation is `declare module 'vue'`, so it only applies to the **exact `vue` package `@mono-lit/helper` resolves**. If your app has a second copy — common with pnpm, a monorepo, or a git/`file:` dependency where `@mono-lit/helper` is symlinked outside your `node_modules` — the augmentation lands on the other copy and `GlobalComponents` stays empty, with no error to tell you.

Check with `pnpm why vue` (or `npm ls vue`); if more than one version shows up, dedupe to a single one. That was exactly the symptom in this docs site until `@mono-lit/helper` and the demo were pinned to the same `vue`.
:::

#### Events

Every component reports what happened under the **plain** event name — `@change`, `@input`, `@click`, `@open` / `@close` / `@toggle`, `@clear`, … — with the payload on `$event.detail`, the same in the light-DOM and the shadow-DOM build:

```vue
<mono-select :model-value="fruit" @change="fruit = $event.detail.modelValue" />
<mono-modal :model-value="open" @close="open = false" />
<mono-button @click="e => e.detail.waitUntil(save())">Save</mono-button>
```

Two things worth knowing:

- Where the browser already sends the host a native event of that name — `input` and `change` from a text control, `click` from a button, card, chip or item — the plain event **is** that native event, carrying `detail`. There is never a second one, so `$event.target` is the inner control in the light build and the element itself in the shadow build (where the event is retargeted), exactly as before. Everything else (`open`, `close`, `toggle`, `clear`, a shadow `change`, …) is dispatched by the element.
- The `mno-` prefixed names (`@mno-change`, and the camel `@mnoChange`) are the same events under their old names. They still fire, with the same `detail`, so existing code keeps working — new code should use the plain names.

Where a component's event is a state change rather than a press, its plain name says so: tabs emit `change` when the selection moves; accordion, modal, drawer, dropdown and the table detail emit `toggle` (plus `open` / `close`) when they open or close. A real click inside them is still just `click`.

A component driven by a controller (`controlMonoForm`, `controlMonoTable`, `controlMonoModal`, …) can take its listeners from the controller's `props` instead — `props: { onChange, onToggle, onOpen }` — see [form › events from the controller](./form#events-from-the-controller).

#### Typed events

Handlers are typed, including `$event.detail`:

```vue
<!-- detail is InputModelEventDetail — modelValue completes -->
<mono-input @input="name = $event.detail.modelValue" />

<!-- multi-word names work; so does the camel spelling @loadingChange -->
<mono-button @loading-change="e => console.log(e.detail.phase)" />

<mono-input @inputt="…" />                    <!-- ✗ no such event -->
<mono-button @change="…" />               <!-- ✗ mono-button doesn't emit it -->
<mono-input @input="e => e.detail.modelValu" />  <!-- ✗ Did you mean 'modelValue'? -->
```

Each component's events come from its `*Events` interface (`ButtonEvents`, `InputEvents`, …), so a component that declares one is typed automatically. **45 of 77 tags** carry events today; the rest — the `mono-table-*` controls, chart and dropdown-table — emit nothing at all, because they're driven through their controller rather than DOM events. Their props are still fully typed.

A few Vue-specific gotchas:

- `v-model` on Lit elements silently misses the dispatched events. Bind `:model-value` and listen for `@change` / `@input` instead, reading from `$event.detail.modelValue`.
- For object/array props (`mono-menu` items, `mono-select` options, `cssClass`), use the `.prop` modifier: `:items.prop="x"`. A plain `:items="x"` only sets a stringified attribute that Lit ignores.
- For named slots, write `<el slot="name">…</el>`. Vue's `<template #name>` shorthand crashes the compiler on custom elements.
