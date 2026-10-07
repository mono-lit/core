import type { Plugin, PluginOption } from 'vite'
import { isAbsolute, join, resolve } from 'node:path'
import {
  monoAlias,
  monoStubAliases,
  extractConfig,
  formatMissingApps,
  assertAppSources,
  resolveFederatedRoots,
  type MonoMissingApp,
} from '../composables/mono-alias'
import { getMonoConfig } from '../composables/config-node'
import { appRootDirs, pathAppRoots, type MonoAppRoot } from '../composables/app-roots'
import { createMonoLithHooks } from './mono-lith'
import { monoEcosystem } from '../composables/merge-file'
import {
  resolveExtendsAppNames,
  resolveExtendsEcosystems,
  resolveMonoConfig,
  type MonoAppType,
  type MonoConfig,
} from '../composables/create-config'
import { defaultMonoExpose as defaultExpose, sanitizeForExpose } from '../composables/expose'
import { monoExtendRoute, type MonoExtendRouteOptions } from './extend-route'
import { monoPageMetaToDefinePage } from './mono-pagemeta'
import { monoLayoutSlotToRouterView } from './mono-layout-slot'
import {
  monoNuxtStateToRef,
  type MonoNuxtStatePluginOptions,
} from './mono-nuxt-state'
import { monoNuxtLinkToRouterLink, type MonoLinkPluginOptions } from './mono-link'
import {
  monoVite,
  monoPages,
  monoPagesOptions,
  monoLayouts,
  monoLayoutsOptions,
  monoAutoImport,
  monoAutoImportOptions,
  monoComponents,
  monoComponentsOptions,
  reconcileEcoPlugins,
  ecoKeyForSub,
  type MonoEcoKey,
  type MonoAutoImportOptions,
  type MonoEcoOptions,
  type MonoViteContext,
  type MonoViteOptions,
  type MonoViteOwnDirs,
} from './mono-vite'

export { sanitizeForExpose } from '../composables/expose'

export interface MonoRepoOptions {
  /**
   * Override/extend the auto-computed `monoAlias` map. Each entry's `dir` is
   * resolved against the project root (absolute paths kept as-is). Example:
   *   alias: { '@mono-host': { dir: 'src' } }
   */
  alias?: Record<string, { dir: string }>
  /**
   * Customize the client-exposed config global `__MONO_CONFIG_EXPOSE__`.
   * Receives the resolved mono config; return the (serialisable) object to
   * expose. Defaults to the same trimmed, browser-safe subset the Nuxt module
   * ships (`name`/`apps`/`cookie`/`env`/`jwt`/`menu` + `fetching.auth`).
   */
  expose?: (config: MonoConfig) => Record<string, unknown>
  /** Packages excluded from Vite dep pre-bundling (web-components dedup). Default ['@mono-lit/helper']. */
  optimizeExclude?: string[]
  /** Project root. Defaults to `process.cwd()` (Vite's default root). */
  dirname?: string
  /** Folder scanned for remotes. Default './.mono/apps'. */
  appsDir?: string
  /**
   * Let the config chain load when a federated app isn't synced into
   * `.mono/apps/`: its `mono.config` import resolves to an empty config instead of
   * throwing `Cannot find module '@<app>-root/mono.config'`. Only that specifier is
   * stubbed — app code importing a missing app still fails. Default true.
   */
  stubMissing?: boolean
  /** Warn (once) naming the apps that were stubbed. Default true. */
  warnMissing?: boolean
  /**
   * @deprecated `apps[].path` is honoured in every command; nothing depends on
   * which one is running. Accepted so existing `monoRepo({ command })` calls
   * keep type-checking.
   */
  command?: 'serve' | 'build'
  /** @deprecated `apps[].path` is authoritative in every command; ignored. */
  link?: boolean
  /**
   * Restart the dev server when this app's or any active app's
   * `mono.config.ts` changes (see `monoLith`). Default true.
   */
  restartOnConfigChange?: boolean
  /**
   * Add every `path` sibling's source dir to the dev watcher, so a page or
   * component ADDED in a sibling reaches the ecosystem plugins. Default true.
   */
  watchSiblings?: boolean
}

/** Options for {@link MonoRepoNuxt.hostResolver} (mirrors `monoNuxtHost`'s options). */
export interface MonoRepoNuxtHostOptions
  extends MonoNuxtStatePluginOptions,
    MonoLinkPluginOptions {
  /**
   * Define the Nuxt compile-time constants `import.meta.server` / `import.meta.client`
   * for synced remote code that branches on them (a Vite SPA client is
   * `client: true`, `server: false`). Default true.
   */
  defineImportMeta?: boolean
  /**
   * Resolve Nuxt's `useState()` (and `clearNuxtState()`) to the `@mono-lit/utility/runtime`
   * shim in synced remote code. Default true.
   */
  nuxtState?: boolean
  /**
   * Rewrite `<NuxtLink>` in synced remote templates to `<RouterLink>` — plus
   * `target="_blank"` when the link is `external`, or a plain `<a>` when `to` is
   * an absolute URL vue-router can't resolve. Default true.
   */
  nuxtLink?: boolean
}

/**
 * Nuxt-host compatibility helpers — used when a federated **remote is a Nuxt
 * app** rendered inside this Vue/Vite host. Returned by {@link MonoRepoResult.nuxt}.
 */
export interface MonoRepoNuxt {
  /**
   * The Vite plugins that resolve unsupported Nuxt code in a Vue/Vite host
   * (= `monoNuxtHost()`): strips the `definePageMeta({…})` macro from
   * `.mono/apps/*.vue`, rewrites a remote layout's default `<slot/>` ->
   * `<router-view/>`, points Nuxt's auto-imported `useState()` at the
   * `@mono-lit/utility/runtime` shim, rewrites `<NuxtLink>` -> `<RouterLink>` (plus
   * `target="_blank"` when `external`), and defines `import.meta.server`/`import.meta.client`.
   * Spread BEFORE `VueRouter()`:
   *   plugins: [...mono.nuxt().hostResolver(), VueRouter({...})]
   */
  hostResolver: (options?: MonoRepoNuxtHostOptions) => Plugin[]
  /**
   * A `VueRouter({ extendRoute })` callback (= `monoExtendRoute()`) that injects
   * `{ layout, title }` parsed from a synced remote page's source so
   * `setupLayouts` can wrap it. Host pages (which use `definePage`) are skipped.
   *   VueRouter({ extendRoute: mono.nuxt().extendRoute() })
   */
  extendRoute: (options?: MonoExtendRouteOptions) => ReturnType<typeof monoExtendRoute>
}

/**
 * Result of {@link monoRepo} — a Vite plugin plus the resolved mono values.
 *
 * `plugin` wires `resolve.alias`, `__MONO_CONFIG_EXPOSE__`, `server.fs.allow` and
 * dep dedup; `ecosystem(subs)` discovers remote dirs (type-aware) to feed the
 * ecosystem plugins AT REGISTRATION TIME; `nuxt()` exposes the nuxt-host compat
 * helpers (`hostResolver`, `extendRoute`) for when a remote is a Nuxt app.
 */
export interface MonoRepoResult {
  /**
   * Everything mono-specific, in one entry. Register it LAST.
   *
   * ```ts
   * plugins: [vue({…}), UnoCSS(), mono.vite()]
   * ```
   *
   * **The same call in a host and in a remote.** It is named after Vite, not
   * after a role, because that is what it is: the mono half of *this app's*
   * `vite.config.ts`, whichever side of the federation the app is on.
   * Everything that used to differ between the two templates is derived —
   * the Nuxt-compat transforms from `apps[].type`, `src/` vs `app/` from
   * `type`, the root-`index.vue` exclusion from whether this app ships its own
   * `pages/index.vue`. The one thing that cannot be derived is layouts, and
   * `template: 'host' | 'remote'` in `mono.config.ts` declares it.
   *
   * Always contributes:
   * - **The Nuxt-remote compat transforms** — strips `definePageMeta`, rewrites
   *   a remote layout's `<slot/>` to `<router-view/>`, shims `useState`, turns
   *   `<NuxtLink>` into `<RouterLink>`. Added **only when a federated remote is
   *   `type: 'nuxt'`**, read from `mono.config.ts` — so one config file serves a
   *   Nuxt remote and a Vue remote unchanged, with nothing to switch by hand.
   * - **`plugin`** — `resolve.alias`, `__MONO_CONFIG_EXPOSE__`,
   *   `server.fs.allow`, dep dedup. Skipped if you list `mono.plugin` yourself.
   *
   * Plus any ecosystem you hand it. Each gets one flat key — `pages`,
   * `components`, `layouts`, `composables`, `stores` — carrying that plugin's
   * options over mono's defaults (see {@link MonoViteOptions}):
   *
   * | you write | result |
   * | --- | --- |
   * | nothing for that key | whatever YOU registered runs; `vite()` stays out |
   * | `{ components: {…} }` | mono builds it and **wins** — your instance is stood down |
   * | `{ components: false }` | yours runs, explicitly |
   *
   * "Stays out" is not guesswork: taking an ecosystem's options or dirs from
   * mono — `mono.components.options()`, `mono.ecosystem('components')` — marks
   * it as yours. And winning means neutralising the loser's hooks rather than
   * removing it, because Vite fixes the plugin list before any `config()` hook
   * runs; mono logs which ones it took over.
   *
   * Position-independent in both directions: Vite buckets plugins by `enforce`
   * before running any hook, and the compat transforms declare a hook-level
   * `order: 'pre'`, so they run ahead of `VueRouter` and `vue()` no matter
   * where this sits.
   */
  vite: (options?: MonoViteOptions) => Promise<PluginOption[]>
  /**
   * `vue-router/vite`, federated.
   *
   * `mono.pages()` is the ready-made plugin; **`mono.pages.options()`** is just
   * its options, synchronously, for the `VueRouter` you construct:
   *
   * ```ts
   * VueRouter(mono.pages.options())
   * ```
   *
   * What the options carry:
   * - `routesFolder` — this app's own `src/pages` (`app/pages` in a Nuxt app),
   *   plus every federated remote's pages, type-driven. Dirs that do not exist
   *   are dropped.
   * - `extendRoute` — seeds `{ layout, title }` onto every route, so
   *   `setupLayouts` cannot wrap a page twice. Overriding it replaces that;
   *   leave it alone unless you mean to.
   * - When this app has its own `pages/index.vue` it owns `/`, so each remote's
   *   root `index.vue` is excluded automatically.
   *
   * Anything you pass wins: `mono.pages.options({ importMode: 'sync' })`.
   * `own` sets this app's dir (`false` = federated only); `routesFolder`
   * REPLACES the whole list, federated entries included.
   *
   * Taking either form marks pages as yours, so `vite()` will not register a
   * second `VueRouter`.
   */
  pages: ((options?: MonoEcoOptions) => Promise<PluginOption>) & {
    /** The `VueRouter()` options — see {@link MonoRepoResult.pages}. */
    options: (options?: MonoEcoOptions) => Record<string, any>
  }
  /**
   * `vite-plugin-vue-layouts-next`, federated.
   *
   * ```ts
   * Layouts(mono.layouts.options())
   * ```
   *
   * `layoutsDirs` is this app's own `src/layouts` when it exists, plus every
   * federated app's layouts — so an app that ships none resolves to the other
   * app's alone, with nothing hardcoded. `defaultLayout` defaults to
   * `'default'`.
   *
   * **The one ecosystem `template` changes.** A `template: 'host'` app owns the
   * shared shell, so it takes its own layouts and NO federated ones; anything
   * else (including no `template` at all) takes both. Nothing on disk can tell
   * the two apart, which is why this is declared rather than derived.
   *
   * Anything you pass wins: `mono.layouts.options({ defaultLayout: 'blank' })`.
   * `own` sets this app's dir (`false` = federated only); `layoutsDirs`
   * REPLACES the whole list.
   *
   * Taking either form marks layouts as yours, so `vite()` skips its own copy.
   */
  layouts: ((options?: MonoEcoOptions) => Promise<PluginOption>) & {
    /** The `Layouts()` options — see {@link MonoRepoResult.layouts}. */
    options: (options?: MonoEcoOptions) => Record<string, any>
  }
  /**
   * `unplugin-auto-import/vite`, federated.
   *
   * ```ts
   * AutoImport(mono.autoImport.options())
   * ```
   *
   * **This one is named after the plugin, not an ecosystem** — it is the only
   * 2:1 case, serving composables AND stores from a single `dirs` array. So
   * both are named sub-keys of one call, rather than two plugin instances
   * (which would each transform every module and race on the same
   * `auto-imports.d.ts`):
   *
   * ```ts
   * AutoImport(mono.autoImport.options({
   *   composables: { own: 'src/use' },
   *   stores: false,          // leave stores out entirely
   *   imports: [ … ],
   * }))
   * ```
   *
   * `dirs` is this app's own `composables/` and `stores/` plus every federated
   * remote's `composables`, `composables/shared`, `stores` and `stores/shared`.
   * Dirs that do not exist are dropped.
   *
   * The one asymmetry in this API: **`options()` fills `imports` with the
   * preset NAMES only** (`vue`, `vue-router`, `@vueuse/core`, `pinia` — each
   * only if resolvable from this app). The object presets
   * (`unheadVueComposablesImports`, `VueRouterAutoImports`) need a module load,
   * which cannot happen synchronously — import them in your config and pass
   * your own `imports`, or use the async `mono.autoImport()`, which resolves
   * them for you.
   *
   * Taking either form marks this ecosystem as yours, so `vite()` skips its own.
   */
  autoImport: ((options?: MonoAutoImportOptions) => Promise<PluginOption>) & {
    /** The `AutoImport()` options — see {@link MonoRepoResult.autoImport}. */
    options: (options?: MonoAutoImportOptions) => Record<string, any>
  }
  /**
   * Alias of {@link MonoRepoResult.autoImport}, kept because this ecosystem is
   * named `composables` everywhere else (`vite({ composables })`,
   * `ecosystem('composables')`). Prefer `autoImport` — the name says which
   * plugin you get, and that stores come with it.
   */
  composables: ((options?: MonoAutoImportOptions) => Promise<PluginOption>) & {
    options: (options?: MonoAutoImportOptions) => Record<string, any>
  }
  /**
   * `unplugin-vue-components/vite`, federated.
   *
   * ```ts
   * Components(mono.components.options())
   * ```
   *
   * `dirs` is this app's own `src/components` (`app/components` in a Nuxt app)
   * plus every federated remote's, type-driven; dirs that do not exist are
   * dropped. Defaults also cover `dts`, `directoryAsNamespace`,
   * `collapseSamePrefixes`, `extensions` and `include`.
   *
   * Anything you pass wins:
   * `mono.components.options({ directoryAsNamespace: false })`. `own` sets this
   * app's dir (`false` = federated only); `dirs` REPLACES the whole list, so to
   * ADD one, spread first:
   *
   * ```ts
   * Components(mono.components.options({
   *   dirs: [...mono.components.options().dirs, 'src/widgets'],
   * }))
   * ```
   *
   * Taking either form marks components as yours, so `vite()` skips its own.
   */
  components: ((options?: MonoEcoOptions) => Promise<PluginOption>) & {
    /** The `Components()` options — see {@link MonoRepoResult.components}. */
    options: (options?: MonoEcoOptions) => Record<string, any>
  }
  /** Vite plugin — register LAST. Wires alias, define, server.fs, optimizeDeps. */
  plugin: Plugin
  /**
   * Discover remote folders across every extends-active app for the given
   * subpath(s). Type-aware: a `nuxt` remote resolves to `app/<sub>`, a `vue`
   * remote to `src/<sub>`. Equivalent to
   * `monoEcosystem({ dirname, apps, subs })` — centralised here so the config
   * is loaded only once.
   *
   * Pass the result into the ecosystem plugins when you register them:
   *   AutoImport({ dirs: ['src/composables', ...mono.ecosystem(['composables/shared', 'composables'])] })
   *   Components({ dirs: ['./src/components', ...mono.ecosystem('components')] })
   *   Layouts({ layoutsDirs: mono.ecosystem('layouts') })
   *   VueRouter({ routesFolder: [{ src: 'src/pages' }, ...mono.ecosystem('pages')] })
   */
  ecosystem: (subs: string | string[]) => string[]
  /**
   * A `VueRouter({ extendRoute })` callback (= `monoExtendRoute()`). Wire it in
   * EVERY federated app, Nuxt remote or not: besides seeding meta for synced Nuxt
   * pages, it gives every route an explicit `meta.layout` so `setupLayouts` can't
   * wrap a page twice (a page in a folder with no `index.vue` otherwise renders
   * its layout nested inside the default one).
   *   VueRouter({ routesFolder: [...], extendRoute: mono.extendRoute() })
   */
  extendRoute: (options?: MonoExtendRouteOptions) => ReturnType<typeof monoExtendRoute>
  /**
   * Nuxt-host compatibility helpers (`hostResolver`, `extendRoute`) for when a
   * federated remote is a Nuxt app rendered in this Vue/Vite host. See
   * {@link MonoRepoNuxt}.
   */
  nuxt: () => MonoRepoNuxt
  /** The resolved mono config (post `extends`-chain merge). */
  config: MonoConfig
  /** The computed `monoAlias` map (also applied by `plugin`). */
  alias: Record<string, string>
  /** The extends-active apps `{ name, type }` that `ecosystem()` discovers over. */
  apps: { name: string; type: MonoAppType; path?: string }[]
  /**
   * Every federated app resolved to the directory it is read from — a
   * `.mono/apps` clone or an `apps[].path` sibling (`source`). For anything
   * that needs the directories themselves, e.g. UnoCSS `content.filesystem`
   * globs over sibling sources.
   */
  appRoots: MonoAppRoot[]
}

/** Default `__MONO_CONFIG_EXPOSE__` shape — kept in sync with `host-nuxt.ts`. */
// `defaultExpose` (alias of `defaultMonoExpose`) + `sanitizeForExpose` are
// imported from `../composables/expose` — the single source of truth shared with
// the Nuxt host module.

/**
 * Merge the computed `monoAlias` UNDER the host's own `resolve.alias` so the
 * host's explicit aliases always win (mirrors `nuxt.options.alias = { ...alias,
 * ...nuxt.options.alias }` in `host-nuxt.ts`). Handles both the object and the
 * `[{ find, replacement }]` array forms Vite accepts.
 */
function composeAlias(
  userAlias: unknown,
  mono: Record<string, string>,
): Record<string, string> | Array<{ find: string; replacement: string }> {
  if (Array.isArray(userAlias)) {
    // User entries first so they match before ours.
    return [
      ...userAlias,
      ...Object.entries(mono).map(([find, replacement]) => ({ find, replacement })),
    ]
  }
  if (userAlias && typeof userAlias === 'object') {
    return { ...mono, ...(userAlias as Record<string, string>) }
  }
  return mono
}

/**
 * Mono Vite host helper — the single-call Vite equivalent of the Nuxt host's
 * `@mono-lit/utility/nuxt` module.
 *
 * Loads `mono.config.ts` ONCE (c12/jiti, taught the `monoAlias` map), resolves
 * the `extends`-active apps, and returns:
 *  - `plugin`: a Vite plugin (register LAST) wiring `resolve.alias`,
 *    `__MONO_CONFIG_EXPOSE__`, `server.fs.allow` and dep dedup
 *  - `ecosystem(subs)`: type-aware remote dir discovery (`nuxt` -> `app/<sub>`,
 *    `vue` -> `src/<sub>`) to feed AutoImport / Components / Layouts / VueRouter
 *    `routesFolder` at registration time
 *  - `config` / `alias` / `apps`: the resolved values, for advanced use
 *
 * Why async + explicit dirs (not post-registration injection): current
 * `unplugin-auto-import` exposes no `api`, `unplugin-vue-components`' `api` has
 * no `options`, and `vue-router` / `vite-plugin-vue-layouts-next` capture their
 * dirs option in a closure — so none of them can be mutated after registration.
 * Passing dirs at registration is the only reliable path; this helper just
 * centralises the config load so you discover them with one-liner
 * `mono.ecosystem(...)` instead of repeating `monoAlias` / `getMonoConfig` /
 * `activeApps` / `define` / `server.fs` in every host.
 *
 *   import { monoRepo } from '@mono-lit/utility/vite'
 *
 *   export default defineConfig(async ({ mode }) => {
 *     const mono = await monoRepo()
 *     return {
 *       plugins: [
 *         vue({ template: { compilerOptions: { isCustomElement } } }),
 *         UnoCSS(),
 *         mono.vite(), // ← VueRouter + layouts + auto-import + components + plugin
 *       ],
 *     }
 *   })
 *
 * The same file works whether the federated remote is a Nuxt app or a Vue one —
 * `vite()` reads `apps[].type` and adds the Nuxt-compat transforms only when one
 * is a Nuxt remote. `ecosystem()` stays public for anything `vite()` does not
 * own, and any ecosystem key can be turned off to register it by hand:
 *
 *   mono.vite({ layouts: false }),
 *   Layouts({ layoutsDirs: mono.ecosystem('layouts') }),
 */
export async function monoRepo(options: MonoRepoOptions = {}): Promise<MonoRepoResult> {
  const rootDir = options.dirname ?? process.cwd()

  // --- alias map (own + remotes + overrides) ------------------------------
  // Every command reads the same directories: a `.mono/apps` clone, or the
  // directory an `apps[].path` names (a mono-lith sibling). An entry with
  // neither is rejected here, by name, before it can surface as a missing
  // alias three plugins later.
  assertAppSources(extractConfig(rootDir).apps, rootDir)

  const alias = monoAlias({
    dirname: rootDir,
    ...(options.appsDir ? { appsDir: options.appsDir } : {}),
  })

  // Resolved once and shared: the compat transforms need them to recognise a
  // sibling's files, and `server.fs.allow` needs them or Vite refuses to
  // serve anything outside the project root.
  const appRoots = resolveFederatedRoots({
    dirname: rootDir,
    ...(options.appsDir ? { appsDir: options.appsDir } : {}),
  })
  const linked = pathAppRoots(appRoots)

  if (linked.length && options.warnMissing !== false) {
    console.info(
      `[mono] reading ${linked.map((a) => a.name).join(', ')} from apps[].path — ` +
        'the same directories are used by build, prepare and sync.',
    )
  }
  for (const [key, value] of Object.entries(options.alias ?? {})) {
    const dir = value?.dir
    if (!dir) continue
    alias[key] = isAbsolute(dir) ? dir : resolve(rootDir, dir)
  }

  // --- stub apps the chain federates but that aren't synced ---------------
  // A cloned host arrives importing ITS remotes' configs, which this app never
  // cloned (a clone can't carry its own `.mono/`). Without a key for those the
  // whole config fails to load and `vite dev` never starts.
  const { alias: stubAlias, missing } =
    options.stubMissing === false
      ? { alias: {} as Record<string, string>, missing: [] as MonoMissingApp[] }
      : monoStubAliases({
          dirname: rootDir,
          ...(options.appsDir ? { appsDir: options.appsDir } : {}),
        })

  if (missing.length && options.warnMissing !== false) {
    console.warn(formatMissingApps(missing))
  }

  // --- resolve mono.config.ts (c12/jiti, taught the same aliases) ---------
  // `cwd` must be the SAME root the aliases were computed from. Without it c12
  // falls back to `process.cwd()`, so an explicit `dirname` would alias one
  // directory while loading another app's config — or, finding none, silently
  // return c12's defaults (`name: 'mono-app'`, no apps).
  const rawConfig = await getMonoConfig({
    cwd: rootDir,
    jitiOptions: { alias: { ...alias, ...stubAlias } },
  })

  // `extends` is the single on/off switch for which remotes contribute. An app
  // kept in `apps[]` (so `mono sync` still clones it) but absent from `extends`
  // contributes NO pages/routes, composables, components or layouts. No
  // `extends` field ⇒ legacy behaviour (every synced app is active).
  //
  // Read from the RAW config, never the resolved one: `resolveMonoConfig` strips
  // `extends` (so the on/off switch would read as absent) and folds every layer's
  // `apps[]` in — including the host's OWN remotes, which this repo never cloned
  // and whose folders `monoEcosystem` would then scan for in vain.
  const hasExtends = rawConfig.extends != null
  const activeNames = resolveExtendsAppNames(rawConfig)
  const apps = (rawConfig.apps ?? [])
    .filter((a) => (hasExtends ? activeNames.includes(a.name) : true))
    // `path` rides along: it is what lets a locally-linked app resolve to its
    // checkout instead of its clone. Dropping it here silently disables the
    // feature for ecosystem discovery.
    .map((a) => ({ name: a.name, type: a.type, ...(a.path ? { path: a.path } : {}) }))

  // Everything downstream of app-activation gets the MERGED config, so build-time
  // consumers and `__MONO_CONFIG_EXPOSE__` see the same values `monoEnv()` will
  // report at runtime (host layers included, this repo's own values on top).
  // `apps`/`extends` are put back verbatim so the returned shape is unchanged.
  const monoConfig: MonoConfig = {
    ...resolveMonoConfig(rawConfig),
    apps: rawConfig.apps,
    ...(rawConfig.extends != null ? { extends: rawConfig.extends } : {}),
  }

  // A selective `extends` entry (`{ config, ecosystems: [...] }`) narrows which
  // directories that layer may contribute. Applied HERE rather than at the call
  // sites, so it outranks whatever a `vite.config.ts` asks for: every
  // `mono.ecosystem('components')` in the repo funnels through this one closure.
  const ecosystems = resolveExtendsEcosystems(rawConfig)

  // What the consumer has wired by hand. Declared before `ecosystem` because
  // that closure records into it — see the note on `MonoViteContext.built`.
  const built = new Set<MonoEcoKey | 'compat' | 'plugin'>()

  const ecosystem = (subs: string | string[]): string[] => {
    // Asking mono for an ecosystem's dirs means you are feeding them to your own
    // plugin — which is precisely the long-hand config, where `VueRouter`,
    // `AutoImport`, `Components` and `Layouts` are registered by hand with
    // `...mono.ecosystem(...)` spreads. Recording it here is what lets that
    // config gain a `mono.vite()` without registering anything twice.
    for (const sub of Array.isArray(subs) ? subs : [subs]) {
      const key = ecoKeyForSub(sub)
      if (key) built.add(key)
    }
    return monoEcosystem({ dirname: rootDir, apps, subs, ecosystems })
  }

  // Nuxt-host compat helpers (for when a remote is a Nuxt app rendered in this
  // Vue/Vite host). Composed from the transform pieces directly (rather than
  // `monoVue`/`monoNuxtHost` from `./index`) to avoid a circular import on
  // `./index`, which re-exports `monoRepo` from this file.
  const nuxt = (): MonoRepoNuxt => ({
    hostResolver: (userOpts: MonoRepoNuxtHostOptions = {}) => {
      // Spreading these yourself is the long-hand config; `vite()` then adds
      // only `plugin`, instead of a second set of compat transforms.
      built.add('compat')
      // Every gate below tests "is this file a remote's source?". The default
      // `'/.mono/apps/'` substring cannot see an app resolved to a local
      // checkout, so hand each transform the resolved roots. Miss this and the
      // rewrites silently stop applying to a linked app — no error, just Nuxt
      // syntax reaching the compiler.
      const opts: MonoRepoNuxtHostOptions = {
        ...userOpts,
        appsRoots: userOpts.appsRoots ?? appRootDirs(appRoots),
      }
      const plugins: Plugin[] = [
        monoPageMetaToDefinePage(opts),
        monoLayoutSlotToRouterView(opts),
      ]
      if (opts.nuxtState !== false) {
        plugins.push(monoNuxtStateToRef(opts))
      }
      if (opts.nuxtLink !== false) {
        plugins.push(monoNuxtLinkToRouterLink(opts))
      }
      if (opts.defineImportMeta !== false) {
        plugins.push({
          name: 'mono-define-import-meta',
          config() {
            return {
              define: {
                'import.meta.server': 'false',
                'import.meta.client': 'true',
              },
            }
          },
        })
      }
      return plugins
    },
    extendRoute: (opts: MonoExtendRouteOptions = {}) => extendRoute(opts),
  })

  // The long-hand config registers `mono.plugin`, and `vite()` appends the same
  // object — so a config using both has ONE plugin object listed twice, and Vite
  // calls its hooks once per listing. `config()` is not idempotent under that:
  // `mergeConfig` CONCATENATES arrays, so `server.fs.allow` and
  // `optimizeDeps.exclude` would each gain a duplicate entry. These guards are
  // per `monoRepo()` call, which is per config load, so a later `resolveConfig`
  // (dev then build in one process) gets a fresh closure and is unaffected.
  let didConfig = false
  let didConfigResolved = false

  // The lith hooks ride on THIS plugin object rather than a second one: the
  // long-hand config registers `mono.plugin` alone, and a separate plugin
  // returned from `vite()`'s promise would never reach it.
  const lith = createMonoLithHooks({
    dirname: rootDir,
    appRoots,
    activeNames: apps.map((a) => a.name),
    restartOnConfigChange: options.restartOnConfigChange,
    watchSiblings: options.watchSiblings,
  })

  const plugin: Plugin = {
    name: 'mono-repo',
    enforce: 'post',
    configureServer: lith.configureServer,
    resolveId: lith.resolveId,
    load: lith.load,
    // `config.plugins` is the RAW user array — Vite flattens into a separate
    // array and never reassigns it. So a plugin returned from a PROMISE (which
    // is what `vite()` is) is invisible to a walk that cannot await.
    // `configResolved` gets the fully flattened list, and still runs before any
    // module is transformed.
    configResolved(resolved) {
      if (didConfigResolved) return
      didConfigResolved = true
      // This lives here rather than in `config`: only the resolved list is
      // flattened, so a plugin arriving from `vite()`'s promise is
      // countable. Two `unplugin-auto-import` instances race on one
      // `auto-imports.d.ts`; two `vue-router` instances scan every page twice.
      reconcileEcoPlugins(resolved.plugins)
    },
    config(config) {
      if (didConfig) return
      didConfig = true

      return {
        // Host's explicit aliases win over the computed ones. Stubs go FIRST: the
        // browser graph resolves the same config chain (an app's `main.ts` does
        // `import monoConfig from '../mono.config'`), so a jiti-only stub would
        // start the dev server and then die on the first page load.
        resolve: { alias: composeAlias(config.resolve?.alias, { ...stubAlias, ...alias }) },
        define: {
          __MONO_CONFIG_EXPOSE__: JSON.stringify(
            // Always sanitise so a custom `expose` can't accidentally ship a
            // function/class/instance into the client bundle (mirrors JSON's own
            // behaviour, but also drops class instances JSON.stringify would
            // otherwise serialise enumerable props of).
            (sanitizeForExpose((options.expose ?? defaultExpose)(monoConfig)) as Record<
              string,
              unknown
            >) ?? null,
          ),
        },
        server: {
          // Sibling roots are outside the project root, and Vite refuses to serve
          // anything not listed here — without them a `path` app 403s.
          fs: { allow: [rootDir, join(rootDir, '.mono', 'apps'), ...appRootDirs(linked)] },
        },
        optimizeDeps: {
          exclude: [...(options.optimizeExclude ?? ['@mono-lit/helper'])],
        },
      }
    },
  }

  // Same gate as the compat transforms: without the resolved roots, a page in a
  // locally-linked app is not recognised as remote and its `definePageMeta`
  // never reaches the route — the page renders with no layout and no title.
  const extendRoute = (opts: MonoExtendRouteOptions = {}) =>
    monoExtendRoute({ appsRoots: appRootDirs(appRoots), ...opts })

  // The builders share the same resolved values every other helper closes over,
  // so they are handed them rather than reloading the config. `ownType` falls
  // back to `vue`: `type` is required by `MonoConfig`, but a stubbed/partial
  // chain can still arrive without one, and `src/` is the safe assumption for a
  // Vite host.
  //
  // `built` is ONE set per `monoRepo()` call, shared by the standalone factories
  // and `vite()`. A `vite.config.ts` plugins array evaluates left to right, and
  // each factory marks itself synchronously, so a `mono.pages()` written above
  // `mono.vite()` is already recorded by the time `vite()` runs — which is how
  // vite() knows not to register a second copy.
  const viteCtx: MonoViteContext = {
    rootDir,
    ownType: monoConfig.type ?? 'vue',
    // Safe to read off the RESOLVED config: `resolveMonoConfig` strips
    // `template` from every layer it merges, so what survives is this file's
    // own or nothing. (See the strip in `resolveLayer` — inheriting it would
    // tell a remote it is a host and cost it the shell.)
    ...(monoConfig.template ? { template: monoConfig.template } : {}),
    apps,
    ecosystem,
    extendRoute,
    hostResolver: nuxt().hostResolver,
    plugin,
    built,
  }

  const vite = (opts: MonoViteOptions = {}) => monoVite(viteCtx, opts)

  // Each factory returns the ready-made plugin; its `.options` sibling returns
  // just the options object, synchronously, for consumers who want the real
  // plugin import in their config: `VueRouter(mono.pages.options())`. Both mark
  // the same `built` set, so `vite()` skips the plugin either way.
  const pages = Object.assign(
    (opts: MonoEcoOptions = {}) => monoPages(viteCtx, opts),
    { options: (opts: MonoEcoOptions = {}) => monoPagesOptions(viteCtx, opts) },
  )
  const layouts = Object.assign(
    (opts: MonoEcoOptions = {}) => monoLayouts(viteCtx, opts),
    { options: (opts: MonoEcoOptions = {}) => monoLayoutsOptions(viteCtx, opts) },
  )
  const autoImport = Object.assign(
    (opts: MonoAutoImportOptions = {}) => monoAutoImport(viteCtx, opts),
    { options: (opts: MonoAutoImportOptions = {}) => monoAutoImportOptions(viteCtx, opts) },
  )
  const components = Object.assign(
    (opts: MonoEcoOptions = {}) => monoComponents(viteCtx, opts),
    { options: (opts: MonoEcoOptions = {}) => monoComponentsOptions(viteCtx, opts) },
  )

  const result = {
    vite,
    pages,
    layouts,
    autoImport,
    // The same object under the ecosystem name it carries everywhere else
    // (`vite({ composables })`, `ecosystem('composables')`).
    composables: autoImport,
    components,
    plugin,
    ecosystem,
    extendRoute,
    nuxt,
    config: monoConfig,
    alias,
    apps,
    appRoots,
  }

  // `plugin` is read, not called, so a getter is the only place to notice that
  // the consumer registered it themselves — the long-hand config ends with
  // `mono.plugin`. `vite()` then appends nothing, instead of listing the SAME
  // object twice and having Vite run its hooks twice. (Those hooks are guarded
  // anyway, so a `mono.vite()` written ABOVE `mono.plugin` is still correct —
  // just listed twice.)
  Object.defineProperty(result, 'plugin', {
    enumerable: true,
    configurable: true,
    get() {
      built.add('plugin')
      return plugin
    },
  })

  return result
}
