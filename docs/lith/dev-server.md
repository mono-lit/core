# Dev Server & HMR

Running the host reads every sibling live: an edit in `apps/esw-project` hot-updates the host in the browser, a page **added** to the sibling appears as a route, and a change to any `mono.config.ts` restarts the server. Vite does none of that for a directory outside its root on its own — `monoLith()` is the plugin that adds it, and `monoRepo().vite()` carries the same hooks.

## What Vite watches, and what it does not

Vite watches its **root** (plus its own config dependencies and env files). A file outside the root enters the watcher only when it enters the module graph — so a sibling page that is already imported hot-updates fine, but:

- a **new** `src/pages/*.vue`, `src/components/*.vue` or `src/composables/*.ts` in the sibling emits no `add` event, so unplugin-vue-router, unplugin-vue-components and unplugin-auto-import never learn of it;
- `mono.config.ts` is loaded through c12/jiti at config time, outside Vite's config tracking, so the aliases, `__MONO_CONFIG_EXPOSE__`, the `extends` gate and every ecosystem dir go stale until you restart by hand;
- anything outside the root is refused with a 403 unless `server.fs.allow` lists it.

## `monoLith()`

```ts
// vite.config.ts (long-hand config: monoAlias + monoEcosystem by hand)
import { monoLith } from '@mono-lit/utility/vite'

export default defineConfig(async () => ({
  plugins: [
    VueRouter({ … }),
    vue(),
    // …
    monoLith({ dirname: fileURLToPath(new URL('.', import.meta.url)) }),
  ],
}))
```

It resolves the same roots every other command uses and:

| Hook | Does |
|---|---|
| `config` | adds every `path` root to `server.fs.allow` (restating the project root, since listing anything replaces Vite's default) |
| `configureServer` | `server.watcher.add(<sibling>/src)` for every `path` root, so new files reach the ecosystem plugins; watches this app's and every active app's `mono.config.ts` and calls `server.restart()` on change |
| `resolveId` / `load` | provides [`virtual:mono-apps`](#virtual-mono-apps) |

```ts
monoLith({
  dirname,                       // project root; default process.cwd()
  restartOnConfigChange: true,   // false = never restart
  watchSiblings: true,           // false = do not add sibling src dirs to the watcher
  activeNames: ['esw-project'],  // narrow virtual:mono-apps + the config watch list
})
```

`monoRepo().vite()` and `mono.plugin` already include these hooks — do not register `monoLith()` beside them. The `monoRepo` options `restartOnConfigChange` / `watchSiblings` are the same switches, and `mono.appRoots` exposes the resolved roots with their `source`.

## `virtual:mono-apps`

A host merges its remotes' menus by loading each remote's `mono.config`. The glob that did this in Mono-Repo cannot see a sibling:

```ts
// before — only ever saw clones
const modules = import.meta.glob('../../.mono/apps/*/mono.config.ts')
```

`virtual:mono-apps` is one lazy import per federated app — sibling or clone — keyed by app name:

```ts
// after
import monoApps from 'virtual:mono-apps'
// { 'esw-master': () => import('…/apps/esw-master/mono.config.ts'), 'esw-project': … }

for (const [name, load] of Object.entries(monoApps)) {
  const { default: cfg } = await load()
  merge(cfg.menu)
}
```

Types come from `@mono-lit/utility/virtual-mono-apps` — add to the app's `env.d.ts`:

```ts
/// <reference types="@mono-lit/utility/virtual-mono-apps" />
```

The module lists the **other** apps, never the running one (its own config is `monoConfig()`), and only the `extends`-active ones under `monoRepo()`. Two notes:

- The generated imports are absolute paths (the virtual module has no directory to be relative to). Vite serves them through `/@fs/` in dev and bundles them in a build.
- Vite's dependency scanner does not crawl a virtual module, so a dependency reached *only* through one of these configs is discovered late ("new dependencies optimized, reloading"). In practice the same configs are also reached through the `extends` chain from `main.ts`, so this rarely shows.

## UnoCSS and other scanners

Anything that scans files by glob needs the sibling directories. Get them from the resolver rather than hardcoding `.mono/apps`:

```ts
// uno.config.ts
import { resolveFederatedRoots } from '@mono-lit/utility/config/node'

const remoteRoots = resolveFederatedRoots({ dirname }).map((r) => r.root.replace(/\\/g, '/'))

export default defineConfig({
  content: {
    filesystem: remoteRoots.flatMap((root) => [
      `${root}/src/**/*.{js,ts,vue,html}`,
      `${root}/mono.config.ts`, // menu icon classes
    ]),
  },
})
```

(Under `monoRepo()`, `mono.appRoots` is the same list.)

## Nuxt

The Nuxt module follows the same rule — a `path` app is read in place in `nuxt dev` and `nuxt build` alike. A `type: 'nuxt'` sibling becomes a native Nuxt layer, and Nuxt watches every layer's `srcDir`, so Nuxt-to-Nuxt siblings get file-add HMR for free. A Vue sibling merged into a Nuxt host through `extendPages` is static, exactly as a clone was.
