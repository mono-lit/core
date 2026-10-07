# Template Changelog

Changes to the starter templates, grouped by change. Each shows the commit and
the exact lines to remove (red) / add (green).

## One `vite.config.ts` for Host and Remote · 2026-08-23

Both templates used to hand-write their entire mono plugin block, and the two files
differed in ways that looked meaningful but mostly were not. They now ship the **same
file**: the `.options()` builders plus **`mono.vite()`**, with one new `mono.config.ts`
field — **`template`** — carrying the only difference that turned out to be real.

::: tip Nothing here forces a migration
The long-hand style — `...mono.ecosystem([...])` spreads with `mono.plugin` last — still
works unchanged, and so does the older pre-`monoRepo()` style (`monoAlias()` /
`getMonoConfig()` / `monoEcosystem()` / `monoNuxtHost()`). Both were rebuilt against the
current library and produce **byte-identical** output. This entry is a simplification you
can adopt when it suits you, not a breaking change to chase.
:::

Almost everything the two configs disagreed on was already derivable from `mono.config.ts`
and from disk:

| Used to be hand-written | Now |
| --- | --- |
| `...mono.nuxt().hostResolver()` + `extendRoute:` | derived from `apps[].type === 'nuxt'` |
| the root-`index.vue` exclusion on federated pages | derived from whether this app has `pages/index.vue` |
| `src/` vs `app/` dirs, `dts` paths | derived from `type` |
| `composables/shared` / `stores/shared` dirs | included on both sides automatically |

Auditing what was left found exactly **one** real difference — layouts. A Host renders its
own `layouts/` and takes no federated ones; a Remote consumes the Host's. Nothing on disk
can tell the two apart (an app with no `layouts/` looks identical either way), so that one
is declared:

```diff
# mono.config.ts
   type: 'vue',
+  template: 'host',      // or 'remote'; omitted behaves as 'remote'
```

It is **never inherited through `extends`** — a Remote extending its Host would otherwise be
told it was a Host and drop the shell it exists to consume, silently. See
[Config → App role](./config#app-role-host-or-remote).

### mono-vue-remote

`example-nuxt-host` · `fee69e8`

The whole plugin block collapses into the `.options()` builders. You keep the real plugin
imports — `vue-router` and the unplugins capture their dirs in a closure, so mono cannot
inject after construction; it hands you the object to construct **with**.

```diff
-export default defineConfig(async ({ mode }) => {
-  const mono = await monoRepo()
+export default defineConfig(async ({ mode, command }) => {
+  const mono = await monoRepo({ command })
```

`command` is passed so an app's dev-only `path` (a local checkout) is honoured in `serve`
and ignored in `build`. Without it that is inferred from `process.argv`, which covers the
CLI but not a programmatic `build()`.

```diff
     plugins: [
-      ...mono.nuxt().hostResolver(),
-      VueRouter({
-        routesFolder: [
-          { src: 'src/pages' },
-          ...mono.ecosystem('pages'),
-        ],
-        extendRoute: mono.nuxt().extendRoute(),
-      }),
+      VueRouter(mono.pages.options()),
-      AutoImport({
+      AutoImport(mono.autoImport.options({
         imports: [ /* … unchanged … */ ],
-        dts: 'src/auto-imports.d.ts',
-        dirs: [
-          'src/composables',
-          'src/stores',
-          ...mono.ecosystem(['composables/shared','stores/shared','composables']),
-        ],
-        vueTemplate: true,
-      }),
-      Components({
-        extensions: ['vue'],
-        include: [/\.vue$/, /\.vue\?vue/],
-        dts: 'src/components.d.ts',
-        directoryAsNamespace: true,
-        collapseSamePrefixes: true,
-        dirs: ['./src/components', ...mono.ecosystem('components')],
-      }),
-      Layouts({
-        layoutsDirs: mono.ecosystem('layouts'),
-        defaultLayout: 'default'
-      }),
+      })),
+      Components(mono.components.options()),
+      Layouts(mono.layouts.options()),
-      mono.plugin,
+      mono.vite(),
     ]
```

The Nuxt-compat spread and `extendRoute` disappear because `mono-host` is already declared
`type: 'nuxt'` in `apps[]`. They are not lost — `mono.vite()` adds them, and they now declare
a hook-level `order: 'pre'`, so they beat `VueRouter` wherever the call sits in the array.
The old "spread it BEFORE VueRouter" convention is no longer something you can get wrong.

```diff
# mono.config.ts
     type: 'vue',
+    // This app CONSUMES the shared shell rather than owning it, so it takes the
+    // host's layouts as well as any of its own.
+    template: 'remote',
```

Verified: route table, `auto-imports.d.ts` and `components.d.ts` come out **identical** to
the hand-written config, and the built bundle still contains zero `definePageMeta` or
`<NuxtLink>`.

### mono-vue-host

`main` · `bb89b27`

Same file, same shape. The host-specific lines all turn out to be derivable:

```diff
-            VueRouter({
-                routesFolder: [
-                    { src: "src/pages" },
-                    // host owns `/`, so skip each remote's root index.vue
-                    ...mono.ecosystem('pages').map((dir) => ({
-                        src: dir,
-                        exclude: ['*/index.vue'],
-                    })),
-                ]
-            }),
+            VueRouter(mono.pages.options()),
-            AutoImport({
+            AutoImport(mono.autoImport.options({
                 imports: [ /* … unchanged … */ ],
-                dts: true,
-                dirs: [
-                    "./src/composables/**",
-                    "./src/stores/**",
-                    ...mono.ecosystem(['composables', 'stores']),
-                ],
-                vueTemplate: true,
-            }),
-            Components({
-                dirs: ["./src/components", ...mono.ecosystem('components')],
-                dts: true,
-                directoryAsNamespace: true
-            }),
-            //@ts-ignore
-            Layouts({
-                // The host ships its own layout shell — no remote layouts here.
-                layoutsDirs: 'src/layouts',
-                defaultLayout: 'default'
-            }),
+            })),
+            Components(mono.components.options()),
+            Layouts(mono.layouts.options()),
-            mono.plugin,
+            mono.vite(),
```

```diff
# mono.config.ts
     type: 'vue',
+    // This app OWNS the shared shell, so it renders its own `src/layouts` and
+    // takes none from the apps it federates.
+    template: 'host',
```

The federated-page exclusion goes away because this host ships `src/pages/index.vue`, so
mono can see that it owns `/` and excludes each federated app's root page on its own.
(`mono-vue-remote` has no `index.vue`, so it correctly keeps the Host's `/`.) The
`//@ts-ignore` above `Layouts` goes with it.

**That `Layouts` line was also a latent bug.** `layoutsDirs` was a bare **string**, which
silently switches `vite-plugin-vue-layouts-next` to its `ClientSideLayout` implementation —
a different code path with a single hardcoded `import.meta.glob` that cannot see federated
dirs at all. It was harmless only because this host federates nothing today.
`mono.layouts.options()` always returns an array.

Two migration notes, both specific to a Host on the old defaults:

- **The generated `.d.ts` files move from the repo root to `src/`** (`dts: true` → mono's
  `src/auto-imports.d.ts`). Both were tracked at the root; delete them in the same commit,
  or TypeScript sees two sets of the same globals. `tsconfig.json` needs no change if it
  already has `include: ["**/*"]`.
- **`mono.autoImport.options()` scans `composables/shared` and `stores/shared` in *this*
  app**, not just federated ones. That was a gap in mono, fixed for this migration: a Host
  keeping code under `src/stores/shared/` was reaching it only through its own
  `"./src/stores/**"` glob, so adopting mono's defaults would otherwise have dropped
  `useAuthStore`, `useHostMenuStore` and `useHostHelper` — silently, since a missing
  auto-import only errors at the use site.

Verified by a clean A/B — both configs built from scratch with the generated files deleted
first, so neither inherits stale entries: **648 auto-import lines either way, zero symbols
gained or lost, zero components renamed** by `collapseSamePrefixes`. `vue-tsc` reports the
same three pre-existing errors and no new ones.

::: warning Delete the generated files before comparing
The committed `auto-imports.d.ts` in both templates had drifted — it still declared symbols
from apps the repo no longer federates and from files that were since deleted. Worse,
`unplugin-auto-import` **carries existing entries forward** when its `dts` file already
exists, so a fresh build does not clear them. If you diff your new output against the
committed file you will see losses that are not real. Delete it first.
:::

::: tip Mixing the two styles is safe
Adding `mono.vite()` to a config that already wires the plugins by hand contributes
**nothing** — each manual call marks that ecosystem as yours, so it fills only the gaps.
`template` does not affect the hand-wired path either: when you pass the dirs, mono does not
second-guess you. That makes this adoptable one plugin at a time.
:::


## Simplify Config · 2026-08-02

The mono wiring scattered through `vite.config.ts` is consolidated under one
`await monoRepo()` call — the Vite twin of `@mono-lit/utility/nuxt`. The `monoAlias` +
`getMonoConfig` + `activeApps` block at the top of `defineConfig(async …)` and
every repeated `monoEcosystem({ dirname, apps: activeApps, subs })` call site
collapse into the one `mono` handle, alongside the nuxt-host compat helpers.
(`mono.plugin`'s alias / `__MONO_CONFIG_EXPOSE__` / `server.fs.allow` / dep-dedup
wiring is documented separately.)

### mono-vue-remote

`example-nuxt-host` — `monoRepo()` lands in `5e5923df`, the nuxt-host helpers in
`e9f62e89`. `mono.plugin` stays registered **last** to wire `resolve.alias` /
`__MONO_CONFIG_EXPOSE__` / `server.fs.allow` / dep dedup from the same single
config load.

**`mono.ecosystem(subs)` — dir discovery.** The whole extends-aware setup used to
be hand-written in every host:

```diff
-import { monoEcosystem } from '@mono-lit/utility'
-import { getMonoConfig, monoAlias } from '@mono-lit/utility/config/node'
-import { resolveExtendsAppNames } from '@mono-lit/utility/config'
+import { monoRepo } from '@mono-lit/utility/vite'
```

```diff
-const alias = monoAlias({ dirname: fileURLToPath(new URL('.', import.meta.url)) })
-const monoConfig = await getMonoConfig({ jitiOptions: { alias } })
-const hasExtends = monoConfig.extends != null
-const activeNames = resolveExtendsAppNames(monoConfig)
-const activeApps = hasExtends
-  ? (monoConfig.apps ?? []).filter((a) => activeNames.includes(a.name))
-  : (monoConfig.apps ?? [])
+const mono = await monoRepo()
```

`monoRepo()` loads `mono.config.ts` (c12/jiti, taught the alias map) and resolves
the `extends`-active apps **once**; `mono.ecosystem(subs)` is then a one-liner over
those apps — type-aware, so a `nuxt` remote resolves to `app/<sub>` and a `vue`
remote to `src/<sub>`. Each of the four call sites shrinks to it (the `dirname` /
`apps` args are baked in):

```diff
   // pages
-  ...monoEcosystem({ dirname: __dirname, apps: activeApps, subs: 'pages' })
+  ...mono.ecosystem('pages')
   // composables / stores
-  ...monoEcosystem({ dirname: __dirname, apps: activeApps, subs: ['composables/shared','stores/shared','composables'] })
+  ...mono.ecosystem(['composables/shared','stores/shared','composables'])
   // components
-  ...monoEcosystem({ dirname: __dirname, apps: activeApps, subs: ['components'] })
+  ...mono.ecosystem('components')
   // layouts
-  layoutsDirs: monoEcosystem({ dirname: __dirname, apps: activeApps, subs: 'layouts' }),
+  layoutsDirs: mono.ecosystem('layouts'),
+  // ← last
+  mono.plugin,
```

**`mono.nuxt()` — nuxt-host compat helpers (only when the remote is a Nuxt app).**
`monoNuxtHost()` and `monoExtendRoute()` — the helpers a Vue/Vite host needs when a
federated **remote is a Nuxt app** — used to be standalone imports from
`@mono-lit/utility/vite`. They now hang off the same `mono` handle as `mono.nuxt()`:

> **Only for a Nuxt remote.** Add these when the app you extend (`extends`) is a
> **Nuxt** host (its source lives under `app/`, its pages declare `definePageMeta`,
> its layouts use `<slot/>`). A **Vue** host federation (e.g. `example-vue-host`)
> needs none of this — its pages use `definePage` natively and its layouts already
> render `<router-view/>` — so it omits `mono.nuxt()` entirely.

  - `mono.nuxt().hostResolver()` — the `Plugin[]` (= `monoNuxtHost()`) that rewrites
    unsupported Nuxt code for Vue: strips the `definePageMeta({…})` macro from
    `.mono/apps/*.vue`, rewrites a remote layout's default `<slot/>` →
    `<router-view/>` (so `setupLayouts`' nested routes render the page), and defines
    `import.meta.server`/`import.meta.client` for federated code that branches on
    them. Spread **before** `VueRouter()` so the rewrite runs first.
  - `mono.nuxt().extendRoute()` — the `VueRouter({ extendRoute })` callback (=
    `monoExtendRoute()`) that injects `{ layout, title }` parsed from a synced
    remote page's source, so `setupLayouts` wraps it. Host pages (which use
    `definePage`, read natively by vue-router) are skipped.

```diff
-import { monoNuxtHost, monoExtendRoute } from '@mono-lit/utility/vite'
+// (now on the `mono` handle above — Nuxt remote only)
```

```diff
     plugins: [
       // Nuxt remote only — omit these two for a Vue host federation.
-      ...monoNuxtHost(),
+      ...mono.nuxt().hostResolver(),
       VueRouter({
         routesFolder: [...],
-        extendRoute: monoExtendRoute(),
+        extendRoute: mono.nuxt().extendRoute(),
       }),
```

The standalone `monoNuxtHost` / `monoExtendRoute` exports stay for back-compat;
`mono.nuxt()` is the public surface going forward. Both still take the same options
(`appsMarker`, `defineImportMeta`) if you need to override the `/.mono/apps/` marker.

### mono-vue-host

`main` · `bc5d914`. The host shell gets the same `monoRepo()` treatment. It's a
pure **Vue** host (no Nuxt remote), so `mono.nuxt()` is **not** used — only
`mono.ecosystem(...)` for dir discovery and `mono.plugin` for the alias / define /
server.fs wiring. The host ships its **own** layout shell, so `Layouts` keeps
`layoutsDirs: 'src/layouts'` (no remote layouts). Per-page `exclude: ['*/index.vue']`
on the federated routes is preserved — the host owns `/`, so each remote's root
`index.vue` is skipped to avoid clobbering it.

```diff
-import { monoEcosystem } from '@mono-lit/utility'
-import { getMonoConfig, monoAlias } from '@mono-lit/utility/config/node'
-import { resolveExtendsAppNames, type MonoConfig } from '@mono-lit/utility/config'
+import { monoRepo } from '@mono-lit/utility/vite'
```

```diff
-declare global {
-    const __MONO_CONFIG_EXPOSE__: Pick<MonoConfig, …> & { … }
-}
-const alias = monoAlias({ dirname: fileURLToPath(new URL('.', import.meta.url)) })
-const monoConfig = await getMonoConfig({ jitiOptions: { alias } })
-const hasExtends = monoConfig.extends != null
-const activeNames = resolveExtendsAppNames(monoConfig)
-const activeApps = hasExtends
-    ? (monoConfig.apps ?? []).filter((a) => activeNames.includes(a.name))
-    : (monoConfig.apps ?? [])
+const mono = await monoRepo()
```

```diff
   // pages — host owns `/`, skip each remote's root index.vue
-  ...monoEcosystem({ dirname: __dirname, apps: activeApps, subs: 'pages' }).map((dir) => ({
-      src: dir, exclude: ['*/index.vue'],
-  })),
+  ...mono.ecosystem('pages').map((dir) => ({ src: dir, exclude: ['*/index.vue'] })),
   // composables / stores
-  ...monoEcosystem({ dirname: __dirname, apps: activeApps, subs: ['composables', 'stores'] }),
+  ...mono.ecosystem(['composables', 'stores']),
   // components
-  ...monoEcosystem({ dirname: __dirname, apps: activeApps, subs: ['components'] }),
+  ...mono.ecosystem('components'),
   // ← last
+  mono.plugin,
```

The inline `define.__MONO_CONFIG_EXPOSE__`, `server.fs.allow` and `resolve.alias`
blocks all drop out (owned by `mono.plugin`); `vueDevTools()`, the `IS_SENTRY`
sourcemap flag and the commented `sentryVitePlugin` are untouched.

## Sticky Nav Fix · 2026-07-29

`<mono-nav>` refused to stick to the top of the page: it scrolled away with the
content. The component was fine — `sticky` defaults to `true`, reflects to a
`sticky` attribute, and `mono-nav[sticky] { position: sticky; top: 0 }` applied.
The layout wrapper was the problem.

Per CSS overflow, when one axis is **not** `visible` the other computes from
`visible` to **`auto`**. So `overflow-x-hidden` on the page wrapper silently made
that `<div>` a **scroll container**, and it — not the viewport — became the sticky
element's scrollport. Its height is content-driven (the child is `min-h-screen`),
so it never scrolls internally: the nav had zero scroll range and just rode the
document scroll away.

`overflow-x: clip` suppresses horizontal overflow exactly the same way but is not
a scroll container, so `overflow-y` stays `visible`. Both templates run
`presetWind4`, which ships the `overflow-x-clip` utility.

Measured with the real element inside this layout chain: with `hidden` the nav
moved `top 0 → -604px` over an 800px scroll (wrapper computed `hidden/auto`);
with `clip` it stayed at `top 0` (wrapper computed `clip/visible`).

`mono-vue-host` `src/layouts/home.vue` (`main` · 2100d49) and `mono-nuxt-host`
`app/layouts/home.vue` (`main` · 00662a3, `example` · fa232f0):

```diff
-  <div class="bg-white relative overflow-x-hidden w-full">
+  <div class="bg-white relative overflow-x-clip w-full">
```

Watch for this whenever a sticky element is nested: **any** ancestor with
`overflow` set to `hidden`, `auto` or `scroll` on either axis captures it.

## UnoCSS scans federated `.mono/apps` · 2026-07-28

Federated remotes live under `.mono/apps/` at the project root. The old
`content.pipeline.include` used **relative globs** (`./.mono/apps/*/src/**`) as the
UnoCSS pipeline filter — but UnoCSS resolves those against Vite's `root`, and they
don't match the (absolute / virtual) module ids Vite actually hands it. Under
**Nuxt's Vite** it is worse than unreliable: `root` is the srcDir (`app/`), so
`./.mono/apps/**` resolves to a non-existent `app/.mono/apps` and matches nothing at
all. Either way the failure is silent — no error, just missing CSS. So federated
`.ts` data modules that carry classes (e.g. `datas/flow.ts` node-card colors) and each
remote's `mono.config.ts` menu `icon` classes were dropped → federated routes
rendered unstyled / icons missing.

Fix: anchor an **absolute** `content.filesystem` scan of `.mono/apps` (eager, so
federated classes land in `uno.css` upfront) and restore the default `include` regex,
adding a second regex that admits federated `.ts/.js` — a regex matches module ids
where a relative glob cannot. The app's **own** files keep flowing through the default
pipeline (`.vue` via the default regex, `.ts` via their `//@unocss-include` comment);
this block is scoped to `.mono/apps` only.

`uno.config.ts` in `mono-vue-host` (`main` · 29a88c8), `mono-nuxt-host` (`main` ·
3c18735, `example` already had it) and `mono-vue-remote` (`example-nuxt-host` ·
9e2db8e, `example-vue-host` · 3011a7b, `gallery-apps` · e68aa27, `memo-apps` ·
5d3380f, `refactor/ERP_CONCEPT` already had it):

```diff
+import { fileURLToPath } from "node:url";
+const monoApps = fileURLToPath(new URL("./.mono/apps", import.meta.url)).replace(/\\/g, "/");
 content: {
-    pipeline: { include: [
-        './src/**/*.{js,ts,vue,html}',
-        './.mono/apps/*/src/**/*.{js,ts,vue,html}',
-        './.mono/apps/*/mono.config.ts',
-    ] },
+    filesystem: [
+        `${monoApps}/*/src/**/*.{js,ts,vue,html}`,
+        `${monoApps}/*/app/**/*.{js,ts,vue,html}`,
+        `${monoApps}/*/mono.config.ts`,
+    ],
+    pipeline: { include: [
+        /\.(vue|svelte|[jt]sx|vine.ts|mdx?|astro|elm|php|phtml|marko|html)($|\?)/,
+        /[\\/]\.mono[\\/]apps[\\/].*\.(ts|js)($|\?)/,
+    ] },
 },
```

Two wrinkles behind that diff. The removed `'./src/**'` glob gets **no** replacement —
the app's own files go back to UnoCSS's default include, which the first added regex
restores. And `mono-nuxt-host` had no `content` block to remove at all, only a comment
explaining why it had gone without one; that comment's diagnosis was right (a relative
glob stops matching under Nuxt's Vite) but its conclusion was to drop `content` rather
than switch to an absolute base.

Watch for this whenever a scanned path sits outside the Vite root: a relative
`content` glob resolves against that root, so it fails by matching **nothing** rather
than by erroring.

## Self-healing `pnpm i` · 2026-07-27

`postinstall` runs `mono sync && mono prepare && nuxt prepare`. The `mono sync` is
there on purpose — see "Bootstrap order" below; without it `pnpm i` cannot recover
from an empty `.mono/apps/`. After changing `mono.config.ts` `apps[]` you can still
run `pnpm mono:sync` explicitly (it uses `.env.dev`), but a plain `pnpm i` now picks
the new remote up on its own.

### mono-nuxt-host

`main` `b115033` · `example` `c4ef78d`

```diff
# package.json
-    "postinstall": "mono prepare && nuxt prepare",
+    "postinstall": "mono sync && mono prepare && nuxt prepare",
```

Since pnpm auto-runs `install` before any script (verify-deps), a broken `.mono/`
makes **every** `pnpm` command fail — including `pnpm mono:sync`, the one that would
fix it. That is why `mono sync` now runs first in `postinstall`.

To break the deadlock by hand, bypass pnpm:

```bash
node node_modules/@mono-lit/utility/dist/mono.mjs sync   # reads .env itself via dotenv
```

## Picking between non-safe and safe env · 2026-07-26

Decide what belongs in `.env` vs the config. **Safe (non-secret)** values — API
base URLs, the public Picsum endpoint — don't need hiding, and in a federation the
host consumes its remotes' config, so they go in a committed, shared **`env`
object**. **Non-safe (secret)** values — GitHub PATs, Sentry token/DSN — stay in
`.env` only. The base URLs move into a standalone **`mono.env.ts`** (read via
`resolveEnv`) imported by every consumer (`mono.config` fetching, `odata2ts`
codegen, and — on the Nuxt host — `sentry.client.config`), so nothing breaks when
a dev forgets to push `.env`. See [Environment](./env#config-env-object-non-secret-values).

**Dev-only knobs out of `.env` too.** `PORT` and `VITE_HTTPS` are dev-server-only,
so they move to a hardcoded `const PORT` in `vite.config.ts` / `nuxt.config.ts`
(with `mkcert` forced off), and drop out of every `.env`. `mono-vue-remote`'s
`example-*` branches already did this — the rest now match.

```diff
# vite.config.ts   (nuxt.config.ts uses devServer.port: PORT)
+const PORT = 2020            // 7100 on the hosts
-    server:  { port: Number(process.env.MONO_VUE_PORT) },
+    server:  { port: PORT },
-    preview: { port: Number(process.env.MONO_VUE_PORT) },
+    preview: { port: PORT + 1 },
-      process.env.VITE_HTTPS == 'true' && mkcert({ … }),
+      false && mkcert({ … }),
```

```diff
# .env / .env.dev / .env.example
-VITE_HTTPS="false"
-MONO_HOST_PORT="7100"        # MONO_VUE_PORT on the remote
```

Follow-up commits: `mono-nuxt-host` `e140457` (main) · `52aaf3c` (example) ·
`mono-vue-host` `7e6a90d` · `mono-vue-remote` `gallery-apps` `89565f2` ·
`memo-apps` `d0f0fa3` · `module/purchasing` `206e93a` (the `example-*` branches
already hardcoded `PORT`).

### mono-nuxt-host

`main` `0629563` · `example` `d184423`

```diff
+ // mono.env.ts (new) — single source, no @mono-host/devextreme imports
+ import { resolveEnv } from '@mono-lit/utility/config'
+ export const env = {
+     default: {
+         MONO_HOST_API_BASE_URL: 'https://dev-ppl-project.phoenix-squad.eu.org',
+         MONO_HOST_ODATA_BASE_URL: 'https://dev-ppl-project.phoenix-squad.eu.org/odata',
+     },
+ }
+ export const appEnv = resolveEnv({ env })
```

```diff
# mono.config.ts
+import { env, appEnv } from './mono.env'
 ...
+    env,
     fetching: {
         api: {
-            monoHostRest: { type: 'restful', url: String(import.meta.env.MONO_HOST_API_BASE_URL) },
+            monoHostRest: { type: 'restful', url: String(appEnv.MONO_HOST_API_BASE_URL) },
```

```diff
# odata2ts.config.ts               # sentry.client.config.ts does the same swap
-import dotenv from 'dotenv'
-dotenv.config()
-const sourceUrl = `${String(process.env.MONO_HOST_ODATA_BASE_URL)}`
+import { appEnv } from './mono.env'
+const sourceUrl = String(appEnv.MONO_HOST_ODATA_BASE_URL)
```

```diff
# .env / .env.dev / .env.example
+NODE_ENV="development"   # ("production" in .env)
-MONO_HOST_API_BASE_URL="https://dev-ppl-project.phoenix-squad.eu.org"
-MONO_HOST_ODATA_BASE_URL="https://dev-ppl-project.phoenix-squad.eu.org/odata"
```

### mono-vue-host

`main` `41a8f92`

Same pattern with `MONO_HOST_*` vars. Consumers: `mono.config.ts` (fetching) and
`odata2ts.config.ts` (no `sentry.client.config.ts` — this host gates Sentry in
`vite.config.ts`). Base URLs removed from `.env` / `.env.dev`.

### mono-vue-remote

`example-vue-host` `90b1f8d` · `example-nuxt-host` `f9b75b0` ·
`gallery-apps` `a80ddbf` · `memo-apps` `5eb381b` · `module/purchasing` `59eb308`

Same pattern across all 5 branches with `MONO_VUE_*` vars. Per-branch specifics:

- **example-vue-host / example-nuxt-host**: the base URLs were hardcoded in
  `src/datas/appConfig.ts` and selected by a `NODE_ENV`→`MODE` switch — both are
  removed; `appConfig` now holds only the JWT cookie names.
  ```diff
  # mono.config.ts
  -const MODE = import.meta.env.NODE_ENV == 'development' ? 'dev' : …
  -    url: appConfig.api[MODE ?? 'dev'],
  +    url: String(appEnv.MONO_VUE_API_BASE_URL),
  ```
- **gallery-apps**: also moves the public Picsum literal into `env.default`
  (`PHOTOS_API: 'https://picsum.photos/v2'`), read as `appEnv.PHOTOS_API`.
- **gallery-apps / memo-apps / module/purchasing**: base URLs removed from
  `.env.dev` / `.env.example`; `NODE_ENV="development"` added.

## Minimize Deps · 2026-07-26

Drop the direct `devextreme` dependencies — they now come transitively through
`@mono-lit/utility` — and **pin** the remaining shared versions exactly (remove the `^`
caret) so pnpm dedupes to the single copy `@mono-lit/utility` / `@mono-lit/helper` bundle.
The shared helpers, notification component and types are imported from
`@mono-lit/utility/runtime` under their `Mono*` names. Update your own imports the
same way.

The helper surface is **`useMonoUtility()`**. `useUtils` is still exported from
`@mono-lit/utility/runtime`, but `useMonoUtility` is the public name.

### mono-nuxt-host

`github.com/your-org/mono-nuxt-host` · branch `main` · `4b6a0ec`

```diff
# package.json
-    "devextreme": "catalog:frontend",
-    "devextreme-vue": "catalog:frontend",
```

```diff
# pnpm-workspace.yaml (catalogs)
   nuxt:
-    nuxt: ^4.5.0
+    nuxt: 4.5.0
-    "@nuxt/kit": ^4.5.0
+    "@nuxt/kit": 4.5.0
   frontend:
-    devextreme: 25.1.6
-    devextreme-vue: 25.1.6
-    yup: ^1.7.1
+    yup: 1.7.1
+  lit:
+    "nuxt-ssr-lit": "1.6.33"
+    "@lit-labs/ssr": "3.2.2"
```

```ts
import {useMonoUtility} from '@mono-lit/utility/runtime'

import { MonoNotifAction } from '@mono-lit/utility/runtime'

import type { MonoValidateError as ValidateError } from '@mono-lit/utility/runtime'

import { type MonoOdataMapTypes } from '@mono-lit/utility/runtime'

export {MonoSchemaObject as SchemaObject} from '@mono-lit/utility/runtime'
```

```vue
<MonoNotifAction v-if="item.props.isAction" :item="item" />
```

### mono-vue-host

`github.com/your-org/mono-vue-host` · branch `main` · `049e72d`

```diff
# package.json
-    "devextreme": "catalog:frontend",
-    "devextreme-vue": "catalog:frontend",
```

```diff
# pnpm-workspace.yaml (catalogs → frontend)
-    devextreme: 25.1.6
-    devextreme-vue: 25.1.6
-    yup: ^1.7.1
+    yup: 1.7.1
```

```ts
import {useMonoUtility} from '@mono-lit/utility/runtime'

import { MonoNotifAction } from '@mono-lit/utility/runtime'

import { MonoValidateError as ValidateError } from '@mono-lit/utility/runtime'

import { type MonoOdataMapTypes } from '@mono-lit/utility/runtime'

export {MonoSchemaObject as SchemaObject} from '@mono-lit/utility/runtime'
```

```vue
<MonoNotifAction v-if="item.props.isAction" :item="item" />
```

### mono-vue-remote

`github.com/your-org/mono-vue-remote` · `example-vue-host` `21dd12d` ·
`example-nuxt-host` `66e192a`

```diff
# package.json
-    "devextreme": "catalog:frontend",
-    "devextreme-vue": "catalog:frontend",
```

```diff
# pnpm-workspace.yaml (catalogs → frontend)
-    devextreme: 25.1.6
-    devextreme-vue: 25.1.6
-    yup: ^1.7.1
+    yup: 1.7.1
```

```ts
import { useMonoUtility } from '@mono-lit/utility/runtime'

import type { MonoOdataMapTypes } from '@mono-lit/utility/runtime'

import {
  MonoSchemaObject as SchemaObject,
  MonoValidateError as ValidateErrorComplex,
  MonoValidateErrorSingle as ValidateErrorSingle,
} from '@mono-lit/utility/runtime'

export type DTO_BrandTypes = MonoOdataMapTypes<typeof QDTO_Brand>
```
