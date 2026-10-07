import {
  defineNuxtModule,
  extendPages,
  extendViteConfig,
  addImportsDir,
  addComponentsDir,
  addRouteMiddleware,
  addPlugin,
  addVitePlugin,
  addPluginTemplate,
} from '@nuxt/kit'
import type { Nuxt, NuxtModule } from '@nuxt/schema'
import {
  mergeEcosystem,
  monoEcosystem,
  ecosystemSubAllowed,
  type MergeEcosystemOptions,
} from '../composables/merge-file'
import {
  monoAlias,
  monoStubAliases,
  extractConfig,
  formatMissingApps,
  assertAppSources,
  resolveFederatedRoots,
  type MonoMissingApp,
} from '../composables/mono-alias'
import { appRootDirs, pathAppRoots } from '../composables/app-roots'
import { remoteGate } from '../vite/remote-matcher'
import { parsePageMeta } from '../composables/parse-page-meta'
import { getMonoConfig } from '../composables/config-node'
import {
  resolveExtendsAppNames,
  resolveExtendsEcosystems,
  resolveMonoConfig,
  srcDirForType,
  type MonoConfig,
} from '../composables/create-config'
import { monoLayerCandidates, registerMonoNuxtLayers } from './nuxt-layers'
import {
  ecosystemFileKey,
  layoutNameFor,
  middlewareNameFor,
  nuxtEcosystemDefaults,
  ownEcosystemKeys,
  remotePageExcludes,
  topLevelFiles,
  walkFiles,
  SCRIPT_EXTENSIONS,
  type EcosystemType,
} from './nuxt-ecosystem'
import { defaultMonoExpose, sanitizeForExpose } from '../composables/expose'
import { monoRouterLinkToNuxtLink } from '../vite/mono-link'
import type { MonoHelperModuleOptions } from '@mono-lit/helper/nuxt'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'

/**
 * Which Nuxt API consumes the discovered folders (the "destination"). Defined
 * in `./nuxt-ecosystem` (which imports no `@nuxt/kit`, so the pure role
 * decisions stay unit-testable) and re-exported here as the public name.
 */
export type { EcosystemType }

/**
 * One ecosystem unit: discover folder(s) across every remote (via
 * `mergeEcosystem`) and wire each into one Nuxt API. Carries the full
 * `mergeEcosystem` discovery props (minus `dirname`, always the Nuxt rootDir,
 * and `map`, used internally) plus a `type` destination.
 */
export interface EcosystemEntry
  extends Omit<MergeEcosystemOptions<string>, 'dirname' | 'map'> {
  /**
   * Destination: auto-imports (composables/stores), components, pages ->
   * routes, or one of the shell folders a remote inherits from its host —
   * layouts, middleware, plugins.
   */
  type: EcosystemType
  /**
   * Type-aware subpath(s) relative to each remote's srcDir — e.g. `'pages'`.
   * Resolved per remote via its `type` (`vue` -> `src/<rel>`, `nuxt` ->
   * `app/<rel>`). Preferred over `dir`; the built-in defaults use it. When set,
   * `dir`/`sub` are ignored (folders come from `monoEcosystem`).
   */
  relDir?: string | string[]
  /** Toggle without removing the entry. Default true. */
  enabled?: boolean
  /** `components` only — prefix component names with their path. Default true. */
  pathPrefix?: boolean
  /**
   * `pages` / `layouts` / `middleware` / `plugins` — file globs (relative to
   * each dir) to skip.
   *
   * For `pages` the default is derived from disk rather than hardcoded: an app
   * that ships its own `pages/index.vue` owns `/`, so the federated root
   * `index.vue` is excluded; an app that does not (every remote, which takes the
   * host's login page as `/`) lets it through. Deeper `<folder>/index.vue` pages
   * are always merged in. For the other three the default is no exclusions —
   * the own-file-wins rule already covers replacement.
   */
  exclude?: string[]
}

export interface MonoModuleOptions {
  /**
   * Merge remote folders into Nuxt. Name-keyed; each entry carries full
   * `mergeEcosystem` discovery props (`dir`, `sub`, `appDir`, `appDirs`,
   * `includes`/`excludes`, `dirIncludes`/`dirExcludes`) plus a `type`
   * destination. `dirname` is always the Nuxt rootDir. Set an entry to `false`
   * to disable it.
   *
   * The built-in defaults wire pages/composables/stores/components for every
   * role, plus the shell a REMOTE inherits from its host — layouts (unless
   * `template: 'host'`) and, on an explicit `template: 'remote'`, middleware and
   * plugins. See `nuxtEcosystemDefaults`. Your entries merge with them by key,
   * so you can override one (restate its `type`), add new ones, or disable a
   * default with `false`.
   *   ecosystem: {
   *     components: false,                                   // disable a default
   *     widgets: { type: 'components', dir: 'src/widgets' }, // add a new one
   *     middleware: { type: 'middleware', relDir: 'middleware' }, // host opt-in
   *   }
   */
  ecosystem?: Record<string, EcosystemEntry | false>
  /**
   * Override/extend the auto-computed `monoAlias` map. Each entry's `dir` is
   * resolved against the Nuxt rootDir (absolute paths kept as-is). Example:
   *   alias: { '@mono-host': { dir: 'app' } }
   */
  alias?: Record<string, { dir: string }>
  /** Packages excluded from Vite dep pre-bundling (web-components dedup). Default ['@mono-lit/helper']. */
  optimizeExclude?: string[]
  /**
   * Customize the client-exposed config global `__MONO_CONFIG_EXPOSE__`.
   * Receives the resolved mono config; return the (serialisable) object to
   * expose. Defaults to a trimmed, browser-safe subset
   * (`name`/`apps`/`cookie`/`jwt`/`menu` + `fetching.auth`) — never the full
   * `fetching.api`. Spread `config` to expose everything, or pick your own keys:
   *   expose: (c) => ({ name: c.name, apps: c.apps, theme: c.theme })
   */
  expose?: (config: MonoConfig) => Record<string, unknown>
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
   * Rewrite `<RouterLink>` -> `<NuxtLink>` in synced remote templates, so a Vue
   * remote's links get Nuxt's prefetching / external-URL handling instead of
   * rendering as plain vue-router links. Default true.
   */
  nuxtLink?: boolean
  /**
   * Namespaced form. This module reads its options from `mono.utils`; the
   * sibling `@mono-lit/helper/nuxt` module reads `mono.helper`. The flat shape above
   * (`mono.alias`, `mono.ecosystem`, …) is still honored for back-compat.
   *   mono: { utils: { alias: { … } }, helper: { … } }
   */
  utils?: Omit<MonoModuleOptions, 'utils' | 'helper'>
  /**
   * Options consumed by `@mono-lit/helper/nuxt` (SSR/UI helper module). Typed via a
   * type-only import from `@mono-lit/helper/nuxt` — @mono-lit/helper is a workspace
   * devDependency of @mono-lit/utility (no runtime dependency: the import is erased,
   * and @mono-lit/helper itself doesn't import @mono-lit/utility). So the real shape
   * (`css` / `customElement` / `ssr` / `shadow` / `MonoSsrOptions`) ships in
   * `dist/nuxt.d.ts` and `mono.helper` gets full autocomplete in `nuxt.config.ts`.
   */
  helper?: MonoHelperModuleOptions
}

/**
 * Mono Nuxt module — the Nuxt equivalent of the Vite side's `mono.vite()`
 * ecosystem block, and like it, ONE module serving both roles. A Nuxt HOST
 * absorbs its remotes' features; a Nuxt REMOTE (`template: 'remote'`) absorbs
 * its host's shell. `mono.config.ts`'s `template` is what says which, exactly as
 * it does for `mono.vite()` — the file is still named `host-nuxt.ts` only
 * because the export path `@mono-lit/utility/nuxt` is public.
 *
 * At BUILD time it:
 *
 *  - builds the `monoAlias` map (`@<own>`, `@<remote>`, `@mono-apps`, …) and
 *    applies it to Nuxt + jiti, plus any `mono.alias` overrides
 *  - resolves `mono.config.ts` (incl. its `extends` chain) via c12/jiti and
 *    exposes a trimmed, serialisable subset to the client as the compile-time
 *    global `__MONO_CONFIG_EXPOSE__`
 *  - discovers folders across every federated app under `.mono/apps/<name>` (via
 *    `mergeEcosystem`) per the `ecosystem` map and wires each into Nuxt:
 *      - type 'pages'      -> routes via `extendPages` (layout/title from `definePage`)
 *      - type 'imports'    -> `addImportsDir` (composables/stores auto-import)
 *      - type 'components' -> `addComponentsDir`
 *      - type 'layouts'    -> `app.layouts` via the `app:templates` hook
 *      - type 'middleware' -> `addRouteMiddleware` (`.global` honoured)
 *      - type 'plugins'    -> `addPlugin` (`.client`/`.server` honoured)
 *    Defaults cover pages/composables/stores/components for every role, plus
 *    layouts/middleware/plugins for a remote — see `nuxtEcosystemDefaults`. A
 *    file this app ships itself always wins over the federated one of the same
 *    name.
 *  - rewrites the unplugin-vue-router macro `definePage({ meta: X })` to Nuxt's
 *    `definePageMeta(X)` for the out-of-tree remote `.vue` files
 *  - rewrites `<RouterLink>` -> `<NuxtLink>` in remote templates, so remote links
 *    prefetch and handle external URLs like the host's own
 *  - opens Vite's dev-server `fs.allow` to `.apps/` and excludes the
 *    web-components lib from dep pre-bundling (single `customElements.define`).
 *
 * Configure via the `mono` key in `nuxt.config.ts`; register with
 * `modules: ['@mono-lit/utility/nuxt']`.
 */
/**
 * Turn an `ecosystems` policy into a plain allow/deny for one custom
 * `dir`/`sub` ecosystem entry.
 *
 * `mergeEcosystem` matches the policy against each resolved directory, but a
 * custom entry's `dir` is arbitrary (`dir: 'shared/widgets'`) and carries no
 * sub name to match on. So decide per app up front, using the entry's own
 * identity as the sub, and hand `mergeEcosystem` a verdict instead: `[]` blocks
 * that app, an absent key leaves it untouched.
 *
 * Returns `undefined` when no app is blocked, so the common path stays free of
 * an empty filter object.
 */
function gateCustomEntry(
  ecosystems: Record<string, string[]>,
  sub: string,
): Record<string, string[]> | undefined {
  const blocked: Record<string, string[]> = {}

  for (const [app, allow] of Object.entries(ecosystems)) {
    if (!ecosystemSubAllowed(sub, allow)) blocked[app] = []
  }

  return Object.keys(blocked).length ? blocked : undefined
}

const monoNuxtModule: NuxtModule<MonoModuleOptions, MonoModuleOptions, false> = defineNuxtModule<MonoModuleOptions>({
  meta: { name: 'mono-nuxt', configKey: 'mono' },
  // Defaults are applied in setup (see `u`) so they also cover the `mono.utils`
  // namespace; the `mono` key is shared with `@mono-lit/helper/nuxt` (`mono.helper`).
  defaults: {},
  async setup(options, nuxt) {
    const rootDir = nuxt.options.rootDir

    // Read this module's options from `mono.utils`, falling back to the legacy
    // flat `mono.*` shape for back-compat. Defaults are merged in here.
    const u = ((options as any).utils ?? options) as MonoModuleOptions
    const optimizeExclude = u.optimizeExclude ?? ['@mono-lit/helper']
    // (`ecosystem` is built after the config loads — its defaults depend on
    // this app's `template`.)

    // --- 1. Alias map (Nuxt + jiti) ------------------------------------------
    // `@<own>` / `@<remote>` / `@mono-apps`, plus `mono.alias` overrides whose
    // `dir` is resolved against rootDir (e.g. `@mono-host` -> `app/` because the
    // Nuxt host's srcDir is `app`, not the default `src`).
    // Every command reads the same directories — a `.mono/apps` clone or the
    // directory an `apps[].path` names — so a build never differs from dev.
    assertAppSources(extractConfig(rootDir).apps, rootDir)
    const appRoots = resolveFederatedRoots({ dirname: rootDir })

    const alias = monoAlias({ dirname: rootDir })
    for (const [key, value] of Object.entries(u.alias ?? {})) {
      const dir = value?.dir
      if (!dir) continue
      alias[key] = isAbsolute(dir) ? dir : resolve(rootDir, dir)
    }
    // Host-level explicit aliases still win over our computed ones.
    nuxt.options.alias = { ...alias, ...nuxt.options.alias }

    // --- 2. Resolve mono.config.ts (c12/jiti, taught the same aliases) -------
    // A cloned host arrives importing ITS remotes' configs, which this app never
    // cloned (a clone can't carry its own `.mono/`). Stub those so the chain still
    // loads instead of dying on `Cannot find module '@<app>-root/mono.config'`.
    const { alias: stubAlias, missing } =
      u.stubMissing === false
        ? { alias: {} as Record<string, string>, missing: [] as MonoMissingApp[] }
        : monoStubAliases({ dirname: rootDir })

    if (missing.length && u.warnMissing !== false) {
      console.warn(formatMissingApps(missing))
    }

    // `cwd` must be the SAME root the aliases were computed from — Nuxt's rootDir
    // isn't necessarily `process.cwd()` (a monorepo can launch nuxt from above it).
    const rawConfig = await getMonoConfig({
      cwd: rootDir,
      jitiOptions: { alias: { ...alias, ...stubAlias } },
    })

    // `extends` is the single on/off switch for remotes: an app kept in `apps[]`
    // (so `mono sync` still clones it) but absent from `extends` must contribute
    // NO pages/routes and NO auto-imports (composables/stores/components). Gate
    // all ecosystem discovery on the extends-active name set. When there is no
    // `extends` field at all, keep the legacy behavior (all synced apps).
    //
    // Read from the RAW config, never the resolved one: `resolveMonoConfig` strips
    // `extends` (so the on/off switch would read as absent) and folds every layer's
    // `apps[]` in — including the host's OWN remotes, which this repo never cloned.
    const hasExtends = rawConfig.extends != null
    const activeNames = resolveExtendsAppNames(rawConfig)
    const activeApps = hasExtends
      ? (rawConfig.apps ?? []).filter((a) => activeNames.includes(a.name))
      : (rawConfig.apps ?? [])

    // Per-layer directory allowlists from a selective `extends` entry
    // (`{ config, ecosystems: [...] }`). Same raw-config reasoning as above.
    const extendsEcosystems = resolveExtendsEcosystems(rawConfig)

    // Everything downstream of app-activation gets the MERGED config, so
    // `__MONO_CONFIG_EXPOSE__` ships the same values `monoEnv()` reports at
    // runtime (host layers included, this repo's own values on top).
    // `apps`/`extends` are put back verbatim so the shape is otherwise unchanged.
    const monoConfig: MonoConfig = {
      ...resolveMonoConfig(rawConfig),
      apps: rawConfig.apps,
      ...(rawConfig.extends != null ? { extends: rawConfig.extends } : {}),
    }

    // --- 3. Ecosystem: discover federated folders -> wire into Nuxt ----------
    // Each entry discovers folder(s) across every federated app via
    // `mergeEcosystem` (dirname forced to rootDir) and feeds them to one Nuxt
    // API per `type`. Short-circuit when `extends` is present but resolves to
    // nothing active.
    //
    // The DEFAULTS depend on this app's role, so they are built here rather
    // than at module scope: a `remote` additionally inherits the host's shell
    // (layouts/middleware/plugins). Read `template` off the RAW config for the
    // same reason `extends` is — `resolveMonoConfig` strips it from every layer
    // by design, so a remote extending a `template: 'host'` host is never told
    // to drop the very shell it extended the host to get.
    const ownSrcDir = join(rootDir, srcDirForType(rawConfig.type ?? 'nuxt'))
    const ecosystem = {
      ...nuxtEcosystemDefaults(rawConfig.template),
      ...(u.ecosystem ?? {}),
    } as NonNullable<MonoModuleOptions['ecosystem']>

    // --- 3a. Nuxt-to-Nuxt: let NUXT do the merging -------------------------
    // A federated app that is itself a Nuxt app is registered as a native Nuxt
    // LAYER, from `mono.config.ts`, with nothing to declare in `nuxt.config.ts`
    // — a remote's config file stays identical to a host's. Nuxt then resolves
    // its pages, layouts, middleware, plugins, components, `app.vue`,
    // `error.vue` and `app/router.options.ts` across layers, with THIS app
    // winning on any same-path file. See `registerMonoNuxtLayers` for why a
    // module can still do this, and what it deliberately does not inherit.
    //
    // A Vue remote can never be a layer, and neither can an unsynced app, so
    // mono's own merge stays in charge for those — same config, same result.
    const layerCandidates = monoLayerCandidates({
      apps: activeApps,
      appRoots,
      template: rawConfig.template,
    })

    const layered = registerMonoNuxtLayers({ nuxt, candidates: layerCandidates })

    // Nuxt's own cross-layer dedupe covers layouts (`layouts[name] ||=`) and
    // middleware (`uniqueBy(..., 'name')`), so this app's file of a given name
    // already wins for both. PLUGINS are the exception: `resolveApp` dedupes them
    // by absolute `src`, which never collides across two checkouts, so every
    // layer's plugins run — the layer's first.
    //
    // That breaks the one plugin a remote is expected to replace: the host's
    // `plugins/mono.ts` calls `createMono()` with the HOST's config (its `apps`,
    // `menu` and `fetching.api`, not ours). Both would run, and the winner would
    // be whichever happened to be last. So restore own-file-wins for plugins,
    // by name, on `app:resolve` — the hook fires after `resolveApp` has filled
    // `app.plugins` and before Nuxt writes them out.
    dedupeLayerPlugins(nuxt, layerCandidates, ownSrcDir)

    // Everything Nuxt resolves lazily is now its job; merging it here too would
    // double-register. Auto-imports are the exception — `nuxt:imports` snapshots
    // its dirs in its OWN setup, which ran before this module, so it never sees
    // a layer added here. `addImportsDir` is hook-based and still open, so
    // composables/stores keep going through mono for layered apps as well.
    const mergeApps = activeApps.filter((app) => !layered.has(app.name))
    const mergeNames = activeNames.filter((name) => !layered.has(name))

    if (layered.size) {
      console.log(
        `[mono-nuxt] merged  via native Nuxt layers: ${[...layered].join(', ')}`,
      )
    }

    for (const [name, entry] of Object.entries(ecosystem)) {
      if (!entry || entry.enabled === false) continue
      if (hasExtends && activeApps.length === 0) break

      // Auto-imports still come from mono even for a layered app (see 3a), so
      // this entry's app list depends on its destination.
      const entryApps = entry.type === 'imports' ? activeApps : mergeApps
      const entryNames = entry.type === 'imports' ? activeNames : mergeNames
      if (!entryApps.length && hasExtends) continue

      // `relDir` -> type-aware discovery (each remote's srcDir from its `type`),
      // else fall back to the explicit `dir`/`sub` form for custom entries.
      // `activeApps` restricts the `relDir` path (folders absent from the list
      // contribute nothing); `includes: activeNames` restricts the `dir`/`sub`
      // path the same way when `extends` is present.
      //
      // `ecosystems` narrows it further, per layer, from a selective `extends`
      // entry. The custom branch has no sub name of its own, so the ecosystem
      // KEY stands in for one — `mono.utils.ecosystem.pages` is gated by
      // `ecosystems: ['pages']` whichever form declared it.
      const dirs = entry.relDir != null
        ? monoEcosystem({
            dirname: rootDir,
            apps: entryApps,
            subs: entry.relDir,
            appDir: entry.appDir,
            includes: entry.includes,
            excludes: entry.excludes,
            ecosystems: extendsEcosystems,
            dirIncludes: entry.dirIncludes,
            dirExcludes: entry.dirExcludes,
          })
        : mergeEcosystem<string>({
            dirname: rootDir,
            dir: entry.dir,
            sub: entry.sub,
            appDir: entry.appDir,
            appDirs: entry.appDirs,
            includes: entry.includes ?? (hasExtends ? entryNames : undefined),
            excludes: entry.excludes,
            ecosystems: gateCustomEntry(extendsEcosystems, entry.sub ?? name),
            dirIncludes: entry.dirIncludes,
            dirExcludes: entry.dirExcludes,
          })

      switch (entry.type) {
        case 'imports':
          for (const dir of dirs) {
            // The `**` glob as well as the dir itself: `addImportsDir` scans one
            // level, but a federated app may nest (mono-nuxt-host keeps its
            // stores in `stores/shared/`), and dropping those silently breaks
            // the layouts and guards that import them. Nuxt accepts glob entries
            // in `imports.dirs` — this is the same pair a host writes by hand
            // for its OWN tree.
            if (existsSync(dir)) addImportsDir([dir, join(dir, '**')])
          }
          break

        case 'components': {
          const pathPrefix = entry.pathPrefix !== false
          for (const dir of dirs) {
            if (existsSync(dir) && statSync(dir).isDirectory()) {
              addComponentsDir({ path: dir, pathPrefix })
            }
          }
          break
        }

        case 'pages':
          registerRemotePages(
            dirs,
            entry.exclude ?? remotePageExcludes(join(ownSrcDir, 'pages')),
            name,
          )
          break

        case 'layouts':
          registerRemoteLayouts(nuxt, dirs, entry.exclude ?? [], ownSrcDir, name)
          break

        case 'middleware':
          registerRemoteMiddleware(dirs, entry.exclude ?? [], ownSrcDir, name)
          break

        case 'plugins':
          registerRemotePlugins(dirs, entry.exclude ?? [], ownSrcDir, name)
          break
      }
    }

    // --- 4. Vite config: client config define + fs.allow + dep dedup ---------
    extendViteConfig((config) => {
      // Expose the mono config to the client as a compile-time global. Default
      // deep-sanitises the FULL config (everything JSON-safe, incl.
      // `fetching.api[*].type`/`url`); non-serialisable values are thrown away
      // automatically — e.g. `oDataService` (a class), DevExtreme source
      // constructors, the `extends` thunks. Override the shape via `mono.expose`.
      config.define = {
        ...config.define,
        __MONO_CONFIG_EXPOSE__: JSON.stringify(
          (sanitizeForExpose((u.expose ?? defaultMonoExpose)(monoConfig)) as Record<
            string,
            unknown
          >) ?? {},
        ),
      }

      // Stubs for apps the chain federates but that aren't synced. Kept OUT of
      // `nuxt.options.alias` (which also feeds tsconfig `paths` generation) — the
      // bundler is the only place that needs them. Prepended so they're matched
      // first; for a missing app there's no competing key anyway.
      if (Object.keys(stubAlias).length) {
        config.resolve ??= {}
        const existing = config.resolve.alias
        config.resolve.alias = Array.isArray(existing)
          ? [
              ...Object.entries(stubAlias).map(([find, replacement]) => ({ find, replacement })),
              ...existing,
            ]
          : { ...stubAlias, ...(existing as Record<string, string> | undefined) }
      }

      // Let Vite's dev server serve the synced remote files under `.mono/apps/`
      // (their page/store modules are loaded via /@fs).
      config.server ??= {}
      config.server.fs ??= {}
      config.server.fs.allow = [
        ...(config.server.fs.allow ?? []),
        rootDir,
        join(rootDir, '.mono', 'apps'),
        // A `path` sibling lives outside the project root, and Vite refuses
        // to serve anything not listed here.
        ...appRootDirs(pathAppRoots(appRoots)),
      ]

      // The host and the remotes both import the `mono-*` web components. `.mono/apps/`
      // is outside Vite's dep-optimization scan, so the two importers otherwise
      // get DIFFERENT module instances -> "mono-* already defined". Excluding the
      // lib from pre-bundling makes both resolve to the same raw module.
      config.optimizeDeps ??= {}
      config.optimizeDeps.exclude = [
        ...(config.optimizeDeps.exclude ?? []),
        ...optimizeExclude,
      ]

      // `@mono-lit/utility` inlines the shared helper surface, which drags in deps that a
      // native-ESM SSR pass can't handle: `devextreme` uses directory imports
      // (`devextreme/data/data_source`), and `exceljs`/`file-saver-es` are CommonJS
      // (no named ESM exports). Bundling them via `ssr.noExternal` lets Vite resolve
      // the directory imports and apply CJS<->ESM interop.
      config.ssr ??= {}
      config.ssr.noExternal = [
        ...(Array.isArray(config.ssr.noExternal) ? config.ssr.noExternal : []),
        '@mono-lit/utility',
        'notivue',
        'devextreme',
        'exceljs',
        'file-saver-es',
        '@odata2ts/http-client-fetch',
        'uuid',
        'tslib',
      ]
      // (yup no longer needs interop wiring here — it's bundled INTO @mono-lit/utility's
      // dist at build time, so the raw `import "yup"`/`tiny-case` chain never reaches
      // the browser. See utility/tsdown.config.ts `deps.alwaysBundle`.)
    })

    // --- 5. <RouterLink> -> <NuxtLink> --------------------------------------
    // A synced VUE remote links with `<RouterLink>`, which does render here —
    // but as a bare vue-router link: no prefetching, no external/absolute-URL
    // handling, no trailingSlash normalisation. Renaming the tag gives remote
    // links the same behaviour as the host's own (pure rename: every RouterLink
    // prop is a NuxtLink prop).
    if (u.nuxtLink !== false) {
      addVitePlugin(monoRouterLinkToNuxtLink({ appsRoots: appRootDirs(appRoots) }))
    }

    // --- 6. definePage({ meta }) -> definePageMeta(meta) ---------------------
    // Same gate as every other compat transform: the `.mono/apps/` substring
    // cannot see an app resolved to a local checkout, so match the roots too.
    const isRemoteFile = remoteGate({ appsRoots: appRootDirs(appRoots) })
    addVitePlugin({
      name: 'mono-define-page-to-pagemeta',
      enforce: 'pre',
      transform(code: string, id: string) {
        const file = id?.split('?')[0]?.replace(/\\/g, '/')
        if (!file || !file.endsWith('.vue') || !isRemoteFile(file)) return
        if (!code.includes('definePage')) return
        const out = code.replace(
          /\bdefinePage\s*\(\s*\{\s*meta\s*:\s*(\{[\s\S]*?\})\s*,?\s*\}\s*\)/g,
          'definePageMeta($1)',
        )
        return out === code ? undefined : { code: out, map: null }
      },
    })

    // --- 7. Runtime: hydrate monoState().config -----------------------------
    // The `__MONO_CONFIG_EXPOSE__` global above is build-time only; this plugin
    // runs once at app boot (SSR + client) and feeds it to `initMono`, which
    // sets `monoState().config` and best-effort hydrates cookies/JWTs. The
    // global is replaced by Vite's `define` with the sanitised object literal.
    addPluginTemplate({
      filename: 'mono-state-init.mjs',
      getContents: () => [
        'import { initMono } from "@mono-lit/utility/runtime"',
        'export default defineNuxtPlugin(() => {',
        '  initMono(__MONO_CONFIG_EXPOSE__)',
        '})',
      ].join('\n'),
    })
  },
})

export default monoNuxtModule

/**
 * Register every `.vue` under the given remote `dirs` as a Nuxt route, skipping
 * files matching any `exclude` glob and never clobbering an existing host route.
 */
function registerRemotePages(dirs: string[], exclude: string[], label: string): void {
  extendPages((pages) => {
    const existing = new Set(pages.map((p) => p.path))
    const added: string[] = []

    for (const dir of dirs) {
      if (!existsSync(dir)) continue

      for (const file of walkVue(dir)) {
        const rel = relative(dir, file).split(sep).join('/') // budget/alokasi/index.vue

        // Skip excluded pages — by default only the remote's ROOT `index.vue`,
        // since the host owns `/` (the no-clobber guard below also protects host
        // routes). Deeper pages incl. `<folder>/index.vue` (e.g. `memo/index.vue`)
        // are kept.
        if (exclude.some((pattern) => globMatch(pattern, rel))) continue

        const routePath = toRoutePath(rel)
        if (existing.has(routePath)) continue // never clobber a host route
        existing.add(routePath)

        pages.push({
          name: 'remote-' + rel.replace(/\.vue$/, '').replace(/[^a-zA-Z0-9]+/g, '-'),
          path: routePath,
          file,
          // Belt-and-suspenders: set meta from the parsed `definePage` so layout/
          // title are correct even if Nuxt doesn't run the `definePageMeta` macro
          // on these out-of-tree files. The Vite transform below covers the rest.
          meta: parsePageMeta(safeRead(file)),
        })
        added.push(routePath)
      }
    }

    if (added.length) {
      console.log(`[mono-nuxt] merged  remote route(s) [${label}]:`, added.join(', '))
    }
  })
}

/**
 * Give this app's own plugins priority over a Nuxt LAYER's, by name.
 *
 * Nuxt gives layouts and middleware that rule for free but not plugins, which it
 * dedupes on absolute `src` — so a remote's `plugins/mono.ts` and its host's
 * both survive, and both call `createMono()` with a different config. Dropping
 * the layer's copy is the whole fix.
 *
 * Runs on `app:resolve`, the one point where `app.plugins` exists and is still
 * mutable. A no-op when this app ships no plugins of its own.
 */
function dedupeLayerPlugins(
  nuxt: Nuxt,
  candidates: { root: string }[],
  ownSrcDir: string,
): void {
  if (!candidates.length) return

  const ownKeys = ownEcosystemKeys(join(ownSrcDir, 'plugins'))
  if (!ownKeys.size) return

  const roots = candidates.map((c) => normalize(c.root).toLowerCase())
  const inLayer = (src: string) => {
    const file = normalize(src).toLowerCase()
    return roots.some((root) => file.startsWith(root + sep))
  }

  nuxt.hook('app:resolve', (app: { plugins: { src?: string }[] }) => {
    const dropped: string[] = []

    app.plugins = app.plugins.filter((plugin) => {
      const src = plugin?.src
      if (!src || !inLayer(src)) return true
      if (!ownKeys.has(ecosystemFileKey(src))) return true

      dropped.push(relative(rootOf(candidates, src), src).split(sep).join('/'))
      return false
    })

    if (dropped.length) {
      console.log(
        `[mono-nuxt] shadowed federated plugin(s) with this app's own:`,
        dropped.join(', '),
      )
    }
  })
}

/** The layer root a file sits in, for a readable log line. */
function rootOf(candidates: { root: string }[], file: string): string {
  const lower = normalize(file).toLowerCase()
  return (
    candidates.find((c) => lower.startsWith(normalize(c.root).toLowerCase() + sep))?.root ??
    ''
  )
}

/**
 * Register every `.vue` under the given federated `layouts` dirs as a Nuxt
 * layout, so a remote renders inside its host's shell.
 *
 * Done through the `app:templates` hook rather than kit's `addLayout` on
 * purpose: `addLayout` routes the file through `addTemplate`, which COPIES it
 * into `.nuxt/` — a snapshot that breaks HMR on the host's shell and any
 * path-relative import inside it. Writing `app.layouts` directly is what Nuxt
 * itself does for `<srcDir>/layouts`, and it points at the real file.
 *
 * The hook runs after Nuxt has resolved this app's own layouts, so the
 * `layoutName in app.layouts` guard already gives own-file-wins; the
 * `ownEcosystemKeys` check in front of it makes the same rule explicit and
 * consistent with middleware/plugins.
 */
function registerRemoteLayouts(
  nuxt: Nuxt,
  dirs: string[],
  exclude: string[],
  ownSrcDir: string,
  label: string,
): void {
  const own = ownEcosystemKeys(join(ownSrcDir, 'layouts'))
  const found: { name: string; file: string }[] = []

  for (const dir of dirs) {
    for (const file of walkFiles(dir, ['.vue'])) {
      const rel = relative(dir, file).split(sep).join('/')
      if (exclude.some((pattern) => globMatch(pattern, rel))) continue
      if (own.has(ecosystemFileKey(file))) continue

      found.push({ name: layoutNameFor(dir, file), file })
    }
  }

  if (!found.length) return

  nuxt.hook('app:templates', (app) => {
    const added: string[] = []

    for (const { name, file } of found) {
      if (name in app.layouts) continue // never clobber a layout this app owns
      app.layouts[name] = { name, file }
      added.push(name)
    }

    if (added.length) {
      console.log(`[mono-nuxt] merged  federated layout(s) [${label}]:`, added.join(', '))
    }
  })
}

/**
 * Register the top-level files of the given federated `middleware` dirs as Nuxt
 * route middleware, honouring the `.global` suffix.
 *
 * TOP LEVEL ONLY, deliberately: Nuxt treats every file in `middleware/` as a
 * middleware, but a federated app nests plain helper modules underneath —
 * mono-nuxt-host keeps its guard dispatcher in `middleware/run-guards.ts` and
 * the guards themselves in `middleware/guards/`, imported BY the global
 * middleware rather than registered alongside it. Recursing would register four
 * guards as four independent middlewares.
 *
 * `addRouteMiddleware` matches on `name`, so a name this app already defines is
 * left alone (it warns rather than overwrites); the `ownEcosystemKeys` check
 * skips it before that happens.
 */
function registerRemoteMiddleware(
  dirs: string[],
  exclude: string[],
  ownSrcDir: string,
  label: string,
): void {
  const own = ownEcosystemKeys(join(ownSrcDir, 'middleware'))
  const added: string[] = []

  for (const dir of dirs) {
    for (const file of topLevelFiles(dir, SCRIPT_EXTENSIONS)) {
      const rel = relative(dir, file).split(sep).join('/')
      if (exclude.some((pattern) => globMatch(pattern, rel))) continue
      if (own.has(ecosystemFileKey(file))) continue

      const { name, global } = middlewareNameFor(file)
      addRouteMiddleware({ name, path: file, global })
      added.push(global ? `${name} (global)` : name)
    }
  }

  if (added.length) {
    console.log(`[mono-nuxt] merged  federated middleware [${label}]:`, added.join(', '))
  }
}

/**
 * Register the top-level files of the given federated `plugins` dirs as Nuxt
 * plugins. `normalizePlugin` reads the `.client` / `.server` suffix off the
 * path itself, so no `mode` is passed.
 *
 * `append: true` keeps discovery order — `addPlugin` unshifts by default, which
 * would reverse a whole directory.
 *
 * This is the one destination where own-file-wins is load-bearing rather than
 * belt-and-braces: `addPlugin` dedupes on the absolute `src`, which never
 * matches across two checkouts. A remote shipping its own `plugins/mono.ts`
 * (pointing `createMono` at ITS config instead of the host's) relies on this.
 */
function registerRemotePlugins(
  dirs: string[],
  exclude: string[],
  ownSrcDir: string,
  label: string,
): void {
  const own = ownEcosystemKeys(join(ownSrcDir, 'plugins'))
  const added: string[] = []

  for (const dir of dirs) {
    for (const file of topLevelFiles(dir, SCRIPT_EXTENSIONS)) {
      const rel = relative(dir, file).split(sep).join('/')
      if (exclude.some((pattern) => globMatch(pattern, rel))) continue
      if (own.has(ecosystemFileKey(file))) continue

      addPlugin({ src: file }, { append: true })
      added.push(rel)
    }
  }

  if (added.length) {
    console.log(`[mono-nuxt] merged  federated plugin(s) [${label}]:`, added.join(', '))
  }
}

/** Recursively collect `.vue` files under a directory. */
function walkVue(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkVue(full))
    else if (entry.name.endsWith('.vue')) out.push(full)
  }
  return out
}

/** `budget/alokasi/index.vue` -> `/budget/alokasi`, `budget/[id].vue` -> `/budget/:id`. */
function toRoutePath(rel: string): string {
  let p = rel
    .replace(/\.vue$/, '')
    .replace(/\/index$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
  p = '/' + p
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p
}

function safeRead(file: string): string {
  try {
    return readFileSync(file, 'utf-8')
  } catch {
    return ''
  }
}

/**
 * Minimal glob matcher for a `/`-joined relative path. Supports `**` (any path
 * segments), `*` (any chars within a segment) and `?` (single char). No
 * dependency — enough for page-exclude patterns like `index.vue` (root only).
 */
function globMatch(pattern: string, input: string): boolean {
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex specials (keep * ?)
    .replace(/\*\*/g, ' ') // placeholder for **
    .replace(/\*/g, '[^/]*') // * -> within-segment
    .replace(/ /g, '.*') // ** -> across segments
    .replace(/\?/g, '[^/]')
  return new RegExp(`^${re}$`).test(input)
}
