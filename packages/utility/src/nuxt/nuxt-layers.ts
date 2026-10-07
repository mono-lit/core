import { existsSync } from 'node:fs'
import { join, normalize, resolve } from 'node:path'
import { extractConfig, extractTemplate } from '../composables/mono-alias'
import { resolveAppRoots, type MonoAppRoot } from '../composables/app-roots'
import type { MonoTemplate } from '../composables/create-config'

/** Config filenames Nuxt accepts at a layer root. */
const NUXT_CONFIG_FILES = [
  'nuxt.config.ts',
  'nuxt.config.mts',
  'nuxt.config.cts',
  'nuxt.config.js',
  'nuxt.config.mjs',
  'nuxt.config.cjs',
]

/** The `nuxt.config.*` at `dir`, or `null` — what makes a directory layer-able. */
export function nuxtConfigFile(dir: string): string | null {
  for (const name of NUXT_CONFIG_FILES) {
    const file = join(dir, name)
    if (existsSync(file)) return file
  }

  return null
}

/** One federated app that can be handed to Nuxt as a layer. */
export interface MonoLayerCandidate {
  /** The app's `name` in `mono.config.ts`. */
  name: string
  /** Absolute app root — the directory Nuxt will treat as the layer. */
  root: string
  /** Its `nuxt.config.*`. */
  configFile: string
}

/**
 * Which federated apps should be merged by **Nuxt's own layer machinery**
 * instead of by mono's ecosystem merge.
 *
 * When both sides are Nuxt, Nuxt already does everything that merge does, and
 * does it better: pages, layouts, middleware, plugins, components, `app.vue`,
 * `error.vue` and `app/router.options.ts` are all resolved across layers, with
 * the CONSUMING app winning on any file at the same path relative to its srcDir.
 * That last rule is the own-file-wins behaviour mono has to implement by hand —
 * here it is free, and exactly right.
 *
 * Three conditions, each load-bearing:
 *
 * - **`type: 'nuxt'`.** A Vue remote has no Nuxt srcDir convention and no
 *   `nuxt.config`; it can only go through mono's merge.
 * - **a `nuxt.config.*` on disk.** An app that has not been synced yet has an
 *   empty (or absent) directory, and mono's merge already degrades gracefully
 *   there — `monoStubAliases` stubs its config so the chain still loads.
 * - **not `template: 'host'`.** Layers are all-or-nothing, so opting a host in
 *   would hand it its remotes' `layouts/` with no way to refuse — the one thing
 *   `template` exists to prevent. Mono's merge CAN gate layouts, so a host keeps
 *   using it.
 */
export function monoLayerCandidates({
  apps,
  appRoots,
  template,
}: {
  /** `apps[]` entries still active after the `extends` gate. */
  apps: { name: string; type?: string }[]
  /** Their resolved roots, from `resolveAppRoots`. */
  appRoots: MonoAppRoot[]
  /** THIS app's role. Read from the raw config — `template` is never inherited. */
  template?: MonoTemplate | null
}): MonoLayerCandidate[] {
  if (template === 'host') return []

  const out: MonoLayerCandidate[] = []

  for (const app of apps) {
    if (app?.type !== 'nuxt' || !app.name) continue

    const root = appRoots.find((r) => r.name === app.name)?.root
    if (!root) continue

    const configFile = nuxtConfigFile(root)
    if (!configFile) continue

    out.push({ name: app.name, root, configFile })
  }

  return out
}

/**
 * A `NuxtConfigLayer` for a federated app, minimal but complete.
 *
 * Only what the LAZY layer consumers read is filled in — `getLayerDirectories`
 * (`@nuxt/kit`) wants `config.rootDir` / `config.srcDir` / `config.dir.*` /
 * `config.serverDir` / `cwd`, and that feeds `resolveApp`, the pages scan and
 * the components scan.
 *
 * Everything else in the layer's real `nuxt.config` is deliberately NOT read.
 * Nuxt merges layer config (modules, css, vite, devServer, hooks, sentry…)
 * while LOADING the config, long before any module runs, so a layer registered
 * from a module contributes files only. That is the behaviour we want: a remote
 * wants the host's shell, not its dev-server port, its Sentry DSN or a second
 * registration of every module it already lists itself.
 */
export function buildMonoNuxtLayer(candidate: MonoLayerCandidate) {
  const { root, configFile } = candidate

  return {
    cwd: root,
    configFile,
    config: {
      rootDir: root,
      // A federated app is `type: 'nuxt'`, so its source is `app/` — the same
      // convention `srcDirForType` encodes and `monoAlias` resolves `@<app>` to.
      srcDir: join(root, 'app'),
      serverDir: join(root, 'server'),
      dir: {
        pages: 'pages',
        layouts: 'layouts',
        middleware: 'middleware',
        plugins: 'plugins',
        modules: 'modules',
        public: 'public',
        shared: 'shared',
        app: 'app',
      },
    },
  }
}

/**
 * Append federated Nuxt apps to `nuxt.options._layers`, returning the names now
 * handled by Nuxt.
 *
 * **Appended, never prepended.** `getLayerDirectories` preserves `_layers`
 * order, and every consumer treats earlier layers as higher priority —
 * `layouts[name] ||= …` keeps the first, `app.mainComponent ||= findPath(…)`
 * takes the first hit, pages dedupe on the first route. Layer 0 is the
 * consuming app, so appending is what makes ITS files win.
 *
 * **Why this works from inside a module at all.** Nuxt reads `_layers` lazily
 * for everything that matters here: `resolveApp` (layouts, middleware, plugins,
 * app.vue, error.vue), the pages scan and the components scan all run on
 * `app:resolve`, well after modules are installed. The one early reader is the
 * `nuxt:imports` module, which snapshots composables dirs in its own `setup()` —
 * so composables and stores are NOT covered here and keep going through
 * `addImportsDir`, which is hook-based and therefore still open.
 */
export function registerMonoNuxtLayers({
  nuxt,
  candidates,
}: {
  nuxt: { options: { _layers?: readonly unknown[] } }
  candidates: MonoLayerCandidate[]
}): Set<string> {
  if (!candidates.length) return new Set()

  // `_layers` is declared `readonly NuxtConfigLayer[]` — readonly to consumers,
  // but a plain array at runtime, and appending to it is the only way a module
  // can contribute a layer at all (Nuxt itself only ever fills it while loading
  // the config). Hence one narrow cast here rather than a loose parameter type,
  // which would stop this accepting a real `Nuxt`.
  const layers = (nuxt.options._layers ?? []) as unknown[]
  if (!nuxt.options._layers) {
    ;(nuxt.options as { _layers?: readonly unknown[] })._layers = layers
  }

  const known = new Set(
    layers.map((layer) =>
      normalize(String((layer as { cwd?: string }).cwd ?? '')).toLowerCase(),
    ),
  )

  const added = new Set<string>()

  for (const candidate of candidates) {
    // The config may ALSO have been extended by hand (`extends:
    // monoNuxtLayers()`), in which case Nuxt already has it — and that copy is
    // the better one, since it was merged at config-load time.
    if (known.has(normalize(candidate.root).toLowerCase())) {
      added.add(candidate.name)
      continue
    }

    layers.push(buildMonoNuxtLayer(candidate))
    added.add(candidate.name)
  }

  return added
}

export interface MonoNuxtLayersOptions {
  /** Project root. `apps[].path` resolves against it. @default process.cwd() */
  dirname?: string
  /** @deprecated `apps[].path` is authoritative in every command; ignored. */
  link?: boolean
  /** Only these app names become layers. */
  includes?: string[]
  /** These app names never become layers. */
  excludes?: string[]
}

/**
 * The same federated Nuxt apps as absolute directories, for a `nuxt.config`
 * that wants to declare them by hand:
 *
 * ```ts
 * export default defineNuxtConfig({ extends: monoNuxtLayers() })
 * ```
 *
 * **You do not need this.** `@mono-lit/utility/nuxt` registers the layers itself, from
 * `mono.config.ts`, so a remote's `nuxt.config.ts` is identical to a host's.
 * This exists for the case where a layer's own `nuxt.config` must be merged too
 * (its `modules`, `css`, `vite` options) — declaring `extends` at config-load
 * time is the only way to get that, and the module then detects the layer and
 * stands down rather than adding it twice.
 *
 * It is deliberately synchronous and argument-free: `extends` is resolved while
 * the config is still loading, so `mono.config.ts` cannot be imported yet (its
 * own `extends` chain reaches for `@mono-host-root/mono.config`, an alias mono
 * has not installed at that point). Hence the static parse.
 */
export function monoNuxtLayers(opts: MonoNuxtLayersOptions = {}): string[] {
  const { dirname = process.cwd(), includes, excludes } = opts

  const root = resolve(dirname)

  const apps = extractConfig(root).apps.filter((app) => {
    if (!app?.name) return false
    if (includes?.length && !includes.includes(app.name)) return false
    if (excludes?.length && excludes.includes(app.name)) return false
    return true
  })

  if (!apps.length) return []

  return monoLayerCandidates({
    apps,
    appRoots: resolveAppRoots({ dirname: root, apps }),
    template: extractTemplate(root),
  }).map((candidate) => candidate.root)
}
