# Setup

The mono ecosystem has two roles: a **Host** and one or more **Remotes** (see
[Getting Started](./getting-started)). The Host owns the shared shell; a Remote adds its
own pages and plugs into it.

A **Host is Vue or Nuxt** — and the **Host and its Remote must have the same framework**.
A Vue pair (Vue Host + Vue Remote) is joined by mono's own merge; a Nuxt pair (Nuxt Host +
Nuxt Remote) by Nuxt's own layer system. Those two choices are the only things that change
between setups.

::: warning The hybrid pairing — possible, but at your own risk
Joining a **Nuxt Host** with a **Vue Remote** is still possible: mono's compat layer
(`mono.nuxt()`) rewrites the host's Nuxt code so the Remote's Vite build can run it, so
nothing blocks the combination. It is **outside the standard** — the Remote ships as a
client-rendered island inside a server-rendered shell, and the seams that compat layer
papers over (SSR, layouts, routing, state) remain your risk. Prefer the same-framework
pairing; take the hybrid only when you knowingly accept those risks.
:::

## Build config

This page covers one file per app: `vite.config.ts` for a Vue app, `nuxt.config.ts` for a
Nuxt one. Pick your Host kind below — its file opens, then the Remote that pairs with it.
The [templates](./getting-started#install) already ship these.

Nothing in these files says whether an app is a Host or a Remote, or which other app it
federates. That is declared in [`mono.config.ts`](./config) — the build config only wires
mono into the bundler.

<SetupWiring>

<template v-slot:vue-host>

<div class="setup-file">

**vite.config.ts** — the whole mono wiring is one call

```ts
import { defineConfig, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import UnoCSS from 'unocss/vite'
import { unheadVueComposablesImports } from '@unhead/vue'
import dotenv from 'dotenv'
import { monoRepo } from '@mono-lit/utility/vite'

dotenv.config()

// Dev-server port. Hardcoded here (a dev-only knob) rather than read from `.env`.
const PORT = 7100

export default defineConfig(async ({ mode, command }) => {
  // Awaited: it reads mono.config.ts and resolves the apps cloned under `.mono/apps/`.
  const mono = await monoRepo({ command })

  return {
    // `MONO_` keys have to reach import.meta.env alongside your own `VITE_` ones.
    envPrefix: ['VITE_', 'MONO_'],
    server: { port: PORT },
    preview: { port: PORT + 1 },
    plugins: [
      // Each `mono.<x>.options()` merges the federated app's directories into that
      // plugin's own scan paths, so a cloned app's pages, components and layouts
      // are picked up exactly like your own.
      VueRouter(mono.pages.options()),
      vue({
        template: {
          compilerOptions: {
            // `<mono-*>` are custom elements, not Vue components.
            isCustomElement: (tag) => [ 'mono-'].some((p) => tag.startsWith(p)),
          },
        },
      }),
      UnoCSS(),
      AutoImport(mono.autoImport.options({
        imports: [
          'vue',
          'vue-router',
          '@vueuse/core',
          'pinia',
          VueRouterAutoImports,
          unheadVueComposablesImports,
        ],
      })),
      Components(mono.components.options()),
      Layouts(mono.layouts.options()),

      mono.vite(), // ← must be LAST
    ] as PluginOption[],
    build: {
      minify: true,
      ...(mode === 'development' && { outDir: 'dist-dev' }),
    },
  }
})
```

</div>

</template>

<template v-slot:vue-remote-vue-host>

<div class="setup-file">

**vite.config.ts** — the same file as the Host's, on its own port

```ts
import { defineConfig, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import UnoCSS from 'unocss/vite'
import { unheadVueComposablesImports } from '@unhead/vue'
import dotenv from 'dotenv'
import { monoRepo } from '@mono-lit/utility/vite'

dotenv.config()

// Deliberately NOT the Host's 7100, so both can run side by side.
const PORT = 7200

export default defineConfig(async ({ mode, command }) => {
  // Same call as the Host. On a Remote it also resolves the Host clone under
  // `.mono/apps/`, which is where the shell's layouts come from.
  const mono = await monoRepo({ command })

  return {
    envPrefix: ['VITE_', 'MONO_'],
    server: { port: PORT },
    preview: { port: PORT + 1 },
    plugins: [
      VueRouter(mono.pages.options()),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => ['mono-'].some((p) => tag.startsWith(p)),
          },
        },
      }),
      UnoCSS(),
      AutoImport(mono.autoImport.options({
        imports: [
          'vue',
          'vue-router',
          '@vueuse/core',
          'pinia',
          VueRouterAutoImports,
          unheadVueComposablesImports,
        ],
      })),
      Components(mono.components.options()),
      Layouts(mono.layouts.options()),

      mono.vite(), // ← must be LAST
    ] as PluginOption[],
    build: {
      minify: true,
      ...(mode === 'development' && { outDir: 'dist-dev' }),
    },
  }
})
```

</div>

</template>

<template v-slot:nuxt-host>

<div class="setup-file">

**nuxt.config.ts** — a Nuxt app has no `vite.config.ts`; the two modules do the wiring

```ts
// Dev-server port. Hardcoded here (a dev-only knob) rather than read from `.env`.
const PORT = 7100

export default defineNuxtConfig({
  ssr: true,
  // Shared `mono` key: `utils` -> @mono-lit/utility/nuxt, `helper` -> @mono-lit/helper/nuxt.
  mono: {
    // Aliases and the federated app dirs are derived from mono.config.ts —
    // nothing to repeat here.
    utils: {},
    // SSR wrapping is automatic: @mono-lit/helper/nuxt auto-installs nuxt-ssr-lit
    // (which ships as a @mono-lit/helper dependency — your app declares neither it nor
    // @lit-labs/ssr) and wraps a `<mono-*>` in <LitWrapper> when the .vue file
    // imports its shadow build (`@mono-lit/helper/ui/shadow/<c>`). Everything else
    // stays client-only. The automatic skeleton (`pending`) is built in: install
    // `@aejkatappaja/phantom-ui` in the app and it is on (`helper: { skeleton: false }`
    // turns it off, an object sets its global defaults).
    helper: {},
  },
  modules: [
    '@mono-lit/utility/nuxt',
    '@mono-lit/helper/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  devServer: { port: PORT },

  // Nuxt scans only the top level of `composables/` and `stores/`. The shared
  // ones are nested, so opt the whole tree in. Paths resolve against `app/`.
  imports: {
    dirs: ['composables', 'composables/**', 'stores', 'stores/**'],
  },
  dir: {
    middleware: 'app/middleware',
  },

  vite: {
    // Keeps `import.meta.env.MONO_*` working. `server.fs.allow`,
    // `optimizeDeps.exclude` and the __MONO_CONFIG_EXPOSE__ define are injected
    // by @mono-lit/utility/nuxt; the SSR Vite plugins by @mono-lit/helper/nuxt.
    envPrefix: ['VITE_', 'MONO_'],
    // Deps reached only from FEDERATED routes. Without this, Vite first discovers
    // them on the first federated navigation, re-optimizes mid-session, and
    // re-fetches @mono-lit/helper under a new `?v=` — re-running its
    // `@customElement('mono-nav')` side effect and throwing
    // `'mono-nav' has already been defined`.
    optimizeDeps: {
      include: [
        '@odata2ts/odata-query-objects',
        '@odata2ts/odata-service',
      ],
    },
  },
})
```

</div>

</template>

<template v-slot:vue-remote-nuxt-host>

<div class="setup-file">

**vite.config.ts** — a Vue Remote is a Vite app whatever the Host is. Under a Nuxt Host this is the **hybrid** pairing — possible, but risky (see the warning above)

```ts
import { defineConfig, PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueRouter from 'vue-router/vite'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import UnoCSS from 'unocss/vite'
import { unheadVueComposablesImports } from '@unhead/vue'
import dotenv from 'dotenv'
import { monoRepo } from '@mono-lit/utility/vite'

dotenv.config()

// Deliberately NOT the Nuxt Host's 7100, so both can run side by side.
const PORT = 7200

export default defineConfig(async ({ mode, command }) => {
  // The Host being Nuxt changes nothing here: `monoRepo()` reads that from
  // mono.config.ts and points the aliases at the clone's `app/` instead of `src/`.
  const mono = await monoRepo({ command })

  return {
    envPrefix: ['VITE_', 'MONO_'],
    server: { port: PORT },
    preview: { port: PORT + 1 },
    plugins: [
      VueRouter(mono.pages.options()),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => ['mono-'].some((p) => tag.startsWith(p)),
          },
        },
      }),
      UnoCSS(),
      AutoImport(mono.autoImport.options({
        imports: [
          'vue',
          'vue-router',
          '@vueuse/core',
          'pinia',
          VueRouterAutoImports,
          unheadVueComposablesImports,
        ],
      })),
      Components(mono.components.options()),
      Layouts(mono.layouts.options()),

      mono.vite(), // ← must be LAST
    ] as PluginOption[],
    build: {
      minify: true,
      ...(mode === 'development' && { outDir: 'dist-dev' }),
    },
  }
})
```

</div>

</template>

<template v-slot:nuxt-remote-nuxt-host>

<div class="setup-file">

**nuxt.config.ts** — the Host's file with `ssr: false`. Nothing here says "remote"

```ts
// Deliberately NOT the Host's 7100, so both can run side by side.
const PORT = 7200

export default defineNuxtConfig({
  // The Host renders the shell and this app compiles into it. Run on its own it
  // is a plain SPA, which is all a Remote needs standalone.
  ssr: false,
  mono: {
    utils: {},
    // With `ssr: false` @mono-lit/helper/nuxt skips its SSR plumbing on its own: no
    // nuxt-ssr-lit, and light `<mono-*>` are NOT wrapped in <ClientOnly> (that wrap
    // would defer them past the page's `onMounted`, breaking `controlMono*(ref)`
    // bindings). It still ships the css, the `mono-` compiler rule, the lit dedupe
    // and the ui/tooltip plugins. `helper: { clientOnly: true }` forces the wrap.
    helper: {},
  },
  modules: [
    '@mono-lit/utility/nuxt',
    '@mono-lit/helper/nuxt',

    '@unocss/nuxt',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  devServer: { port: PORT },
  // Only this app's OWN composables and stores. The Host's are registered by
  // @mono-lit/utility/nuxt, which passes the same globs for the federated dirs.
  imports: {
    dirs: ['composables', 'composables/**', 'stores', 'stores/**'],
  },

  vite: {
    envPrefix: ['VITE_', 'MONO_'],
    // Same reason as the Host: pre-bundle what only federated code reaches, or a
    // mid-session re-optimization re-registers `mono-nav` and throws.
    optimizeDeps: {
      include: [
        '@odata2ts/odata-query-objects',
        '@odata2ts/odata-service',
      ],
    },
  },
})
```

</div>

</template>

</SetupWiring>

## Next steps

- [Config](./config) — `mono.config.ts`: the `type` field, cookies, JWT, and the deploy menu.
- [Sync](./sync) — how the other app is pulled into `.mono/apps/`.
- [Environment](./env) — secrets and the shared `MONO_` prefix.
- [Template Rules](../ai/template) — the full rules the AI follows in a Host or Remote.
