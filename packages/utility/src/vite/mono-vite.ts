/**
 * `mono.vite()` — the federated plugin stack in one entry, plus the individual
 * factories behind it.
 *
 * A Vue/Vite app that federates a mono remote used to wire its `vite.config.ts`
 * differently depending on whether that remote was a **Nuxt** app or a **Vue**
 * app. The entire difference was the Nuxt-compat spread and `extendRoute` — both
 * derivable from `apps[].type`, which `monoRepo()` has already resolved. So it
 * is derived here instead, and the two configs become the same file.
 *
 * It also closes two hazards the hand-written form had:
 *
 *  - `extendRoute` was easy to forget (the `example-vue-host` branch omitted it),
 *    yet it is what gives every route an explicit `meta.layout` so `setupLayouts`
 *    cannot wrap a page twice. Here it is always wired.
 *  - The compat transforms and `VueRouter` are BOTH `enforce: 'pre'`, so their
 *    relative array position decides which runs first — a convention a consumer
 *    could silently break. Owning the array makes it unbreakable.
 *
 * ## Two ways to use it
 *
 * All-in-one — `vite()` builds every ecosystem plugin:
 *
 *   plugins: [vue({…}), UnoCSS(), mono.vite()]
 *
 * Or keep them visible and ordered by hand. Each factory is the same plugin with
 * the federated dirs already wired, and `vite()` **skips whatever you already
 * registered through mono**, so it never double-registers:
 *
 *   plugins: [
 *     mono.pages({ … }),        // vue-router/vite         + ecosystem('pages') + extendRoute
 *     vue({…}),
 *     mono.layouts(),           // vue-layouts-next        + ecosystem('layouts')
 *     mono.composables(),       // unplugin-auto-import    + ecosystem(composables/stores)
 *     mono.components(),        // unplugin-vue-components + ecosystem('components')
 *     mono.vite(),              // ← compat + mono.plugin only; the four above are skipped
 *   ]
 *
 * ## The long-hand config still works, and composes
 *
 * Registering the raw upstream plugins yourself — `VueRouter({ routesFolder:
 * [...mono.ecosystem('pages')] })` and friends, with `mono.plugin` last — is
 * unchanged. `vite()` stays out of the way: asking for an ecosystem's dirs
 * marks it as yours, so adding `mono.vite()` to that file contributes only the
 * compat transforms and `plugin`.
 *
 * Hand an ecosystem to `vite({ components: {…} })` and mono takes it over:
 * an explicit option outranks the skip, so mono builds its own instance, and
 * `reconcileEcoPlugins` stands the hand-written one down at `configResolved`.
 * Vite fixes the plugin list before any `config()` hook, so winning means
 * neutralising the loser's hooks rather than removing it. Net effect: exactly
 * one live plugin per ecosystem, and mono.vite() wins.
 */
import type { Plugin, PluginOption } from 'vite'
import { existsSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import {
  srcDirForType,
  type MonoAppType,
  type MonoTemplate,
} from '../composables/create-config'
import type { MonoExtendRouteOptions } from './extend-route'
import type { MonoRepoNuxtHostOptions } from './mono-repo'
import {
  canResolveFromRoot,
  createRootLoader,
  interopDefault,
  interopNamed,
} from './resolve-from-root'

/**
 * Options shared by every ecosystem key. The federated dirs are mono's job; this
 * is how you say where *this* app's own copies live.
 */
export interface MonoViteOwnDirs {
  /**
   * This app's own dir(s) for that ecosystem, placed BEFORE the federated ones.
   *
   * Defaults to the type-aware convention (`src/pages` in a `vue` app,
   * `app/components` in a `nuxt` one) and is **skipped when it does not exist**,
   * so an app that simply has no `layouts/` needs no configuration. Pass `false`
   * for federated dirs only.
   */
  own?: string | string[] | false
}

/**
 * Options for the underlying plugin, merged OVER mono's defaults. Left loose on
 * purpose: @mono-lit/utility does not depend on these packages (see
 * `./resolve-from-root`), so importing their option types would drag them into
 * the install graph for the sake of autocomplete.
 */
type PluginOpts = Record<string, any>

/** One option object per ecosystem plugin. */
export type MonoEcoOptions = PluginOpts & MonoViteOwnDirs

/** The ecosystem plugins mono can build. */
export type MonoEcoKey = 'pages' | 'layouts' | 'composables' | 'components'

/** Upstream plugin name for each key — used for the duplicate warning. */
export const MONO_ECO_PLUGIN_NAMES: Record<MonoEcoKey, string> = {
  pages: 'vue-router',
  layouts: 'vite-plugin-vue-layouts-next',
  composables: 'unplugin-auto-import',
  components: 'unplugin-vue-components',
}

export interface MonoViteOptions {
  /** `vue-router/vite`. `false` to register it yourself. */
  pages?: false | MonoEcoOptions
  /** `unplugin-vue-components/vite`. */
  components?: false | MonoEcoOptions
  /** `vite-plugin-vue-layouts-next`. */
  layouts?: false | MonoEcoOptions
  /** `unplugin-auto-import/vite` — this key carries the plugin's options. */
  composables?: false | MonoEcoOptions
  /** The stores half of the same auto-import plugin: dirs only. */
  stores?: false | MonoViteOwnDirs
  /**
   * Force the Nuxt-compat transforms on or off, or pass their options.
   * Default: **auto** — on iff some extends-active app has `type: 'nuxt'`.
   *
   * These are NOT flattened onto the top level, because
   * `MonoRepoNuxtHostOptions` already carries a `composables` key (which Nuxt
   * composables `useState` should be shimmed from) that would collide with the
   * ecosystem key of the same name.
   */
  nuxtCompat?: boolean | MonoRepoNuxtHostOptions
  /** `false` to skip `extendRoute`. You almost certainly do not want to. */
  extendRoute?: false | MonoExtendRouteOptions
}

/** Everything the builders need from the `monoRepo()` closure. */
export interface MonoViteContext {
  rootDir: string
  /** This app's own kind, from `mono.config.ts` `type`. */
  ownType: MonoAppType
  /**
   * This app's own role, from `mono.config.ts` `template`. Leaf-only — never
   * inherited through `extends`. `undefined` behaves as `'remote'`, which is
   * what this file did before the field existed.
   */
  template?: MonoTemplate
  apps: { name: string; type: MonoAppType; path?: string }[]
  ecosystem: (subs: string | string[]) => string[]
  extendRoute: (options?: MonoExtendRouteOptions) => unknown
  hostResolver: (options?: MonoRepoNuxtHostOptions) => Plugin[]
  plugin: Plugin
  /**
   * What the consumer has already wired themselves this config-load, so
   * `vite()` does not register a second copy. Marked SYNCHRONOUSLY, because a
   * `vite.config.ts` array literal evaluates left to right and `vite()` runs in
   * that same pass. Three things mark it:
   *
   *  - the plugin factories (`mono.pages()`) and their `.options()` siblings
   *  - `mono.ecosystem('pages' | 'components' | 'layouts' | 'composables' |
   *    'stores')` — asking mono for an ecosystem's dirs means you are feeding
   *    them to your own plugin, which is exactly the long-hand config
   *  - `mono.nuxt().hostResolver()`, which marks `'compat'`
   *
   * An explicit option (`vite({ components: {…} })`) overrides the skip.
   */
  built: Set<MonoEcoKey | 'compat' | 'plugin'>
}

/**
 * Which ecosystem a `mono.ecosystem(sub)` call belongs to, by first path
 * segment — `composables/shared` and `stores/shared` both feed auto-import.
 */
export const MONO_ECO_SUB_KEYS: Record<string, MonoEcoKey> = {
  pages: 'pages',
  layouts: 'layouts',
  components: 'components',
  composables: 'composables',
  stores: 'composables',
}

/** Map one ecosystem subpath to the plugin that consumes it, if any. */
export function ecoKeyForSub(sub: string): MonoEcoKey | undefined {
  return MONO_ECO_SUB_KEYS[String(sub).split('/')[0]!]
}

/**
 * Resolve `own` to absolute, existing dirs. `undefined` falls back to
 * `fallback`, which may name several dirs — auto-import wants both
 * `composables/` and `composables/shared/`, the same pair it already asks every
 * federated app for. Non-existent dirs are dropped, so naming one an app does
 * not have costs nothing.
 */
function ownDirs(
  rootDir: string,
  own: string | string[] | false | undefined,
  fallback: string | string[],
): string[] {
  if (own === false) return []
  const list =
    own === undefined
      ? Array.isArray(fallback)
        ? fallback
        : [fallback]
      : Array.isArray(own)
        ? own
        : [own]
  return list
    .map((dir) => (isAbsolute(dir) ? dir : resolve(rootDir, dir)))
    .filter((dir) => existsSync(dir))
}

/**
 * The auto-import presets worth defaulting. Each is gated on being resolvable
 * from the app root — an app without `pinia` must not have its dev server die
 * because mono assumed the template's dependency list.
 */
async function defaultAutoImports(
  rootDir: string,
  load: ReturnType<typeof createRootLoader>,
): Promise<unknown[]> {
  const presets: unknown[] = ['vue', 'vue-router', '@vueuse/core', 'pinia'].filter((id) =>
    canResolveFromRoot(rootDir, id),
  )
  if (canResolveFromRoot(rootDir, '@unhead/vue')) {
    const preset = interopNamed(await load('@unhead/vue'), 'unheadVueComposablesImports')
    if (preset) presets.push(preset)
  }
  if (canResolveFromRoot(rootDir, 'vue-router/unplugin')) {
    const preset = interopNamed(await load('vue-router/unplugin'), 'VueRouterAutoImports')
    if (preset) presets.push(preset)
  }
  return presets
}

/**
 * Make the compat transforms beat `vue-router`'s own macro transform no matter
 * where they land in the array.
 *
 * `enforce: 'pre'` only buckets them WITH vue-router (which is also `pre`);
 * within a bucket, array order decides. That was fine while `vite()` owned the
 * whole array, but the moment a consumer writes `mono.pages()` above
 * `mono.vite()` the compat rewrites would run *after* vue-router had already
 * transformed the module — and `mono-strip-pagemeta` has to get there first.
 *
 * Vite re-partitions on the HOOK-level `order` field globally
 * (`getSortedPluginsByHook`), so promoting `transform` to its object form makes
 * the ordering intrinsic rather than positional. Applied here rather than in
 * each plugin file so `monoVue()`'s existing standalone behaviour is untouched.
 */
function transformFirst(plugins: Plugin[]): Plugin[] {
  return plugins.map((plugin) => {
    const hook = plugin.transform
    if (typeof hook !== 'function') return plugin
    return { ...plugin, transform: { order: 'pre', handler: hook } } as Plugin
  })
}

// --- options builders ------------------------------------------------------
// For consumers who want the REAL plugin imports in their config. mono cannot
// inject into a plugin you construct — vue-router copies its options into a
// private object, unplugin captures `dirs` in a closure — but it can hand you
// the options to construct it WITH:
//
//   VueRouter(mono.pages.options({ importMode: 'sync' }))
//   Layouts(mono.layouts.options())
//
// All synchronous, so they drop straight into the call. Each marks `ctx.built`,
// so `vite()` still knows not to add a second copy.

/** `VueRouter()` options: own + federated page folders, plus `extendRoute`. */
export function monoPagesOptions(
  ctx: MonoViteContext,
  opts: MonoEcoOptions = {},
  extendRouteOpts?: false | MonoExtendRouteOptions,
): PluginOpts {
  ctx.built.add('pages')
  const { rootDir, ownType, ecosystem, extendRoute } = ctx
  const { own, ...pass } = opts
  const pagesDirs = ownDirs(rootDir, own, `${srcDirForType(ownType)}/pages`)

  // A host that ships its own `index.vue` owns `/`, so a federated remote's root
  // `index.vue` would clobber it. `mono-vue-host` wrote this exclusion by hand;
  // the condition is visible on disk, so derive it instead of asking.
  const ownsRoot = pagesDirs.some((dir) => existsSync(join(dir, 'index.vue')))
  const remote = ownsRoot ? { exclude: ['*/index.vue'] } : {}

  return {
    routesFolder: [
      ...pagesDirs.map((dir) => ({ src: dir })),
      ...ecosystem('pages').map((dir) => ({ src: dir, ...remote })),
    ],
    ...(extendRouteOpts !== false && {
      extendRoute: extendRoute(extendRouteOpts || undefined),
    }),
    ...pass,
  }
}

/**
 * `Layouts()` options: own layout dirs, plus the federated ones unless this app
 * is the host.
 *
 * Layouts are the one ecosystem where the two roles genuinely disagree. A HOST
 * ships the shared shell, so it renders its own `layouts/` and must not adopt a
 * remote's — a remote's `default.vue` would otherwise compete with the shell's.
 * A REMOTE is the opposite: it has no shell of its own and consumes the host's.
 * `template` in `mono.config.ts` is what says which, and it is the only thing
 * that can — the distinction is not visible on disk (an app with no `layouts/`
 * looks the same either way, and `ownDirs` already drops it).
 *
 * `template` sets a DEFAULT, not a lock: `layoutsDirs` replaces the whole list,
 * so one call can always opt out without a mono-specific knob.
 */
export function monoLayoutsOptions(
  ctx: MonoViteContext,
  opts: MonoEcoOptions = {},
): PluginOpts {
  ctx.built.add('layouts')
  const { rootDir, ownType, ecosystem, template } = ctx
  const { own, ...pass } = opts
  return {
    // Always an ARRAY: a bare string makes the plugin silently swap in its
    // completely different `ClientSideLayout` implementation (single dir,
    // hardcoded import.meta.glob), which cannot see federated layouts at all.
    layoutsDirs: [
      ...ownDirs(rootDir, own, `${srcDirForType(ownType)}/layouts`),
      // No `template` reads as `'remote'`, so this is unchanged for every
      // config written before the field existed.
      ...(template === 'host' ? [] : ecosystem('layouts')),
    ],
    defaultLayout: 'default',
    ...pass,
  }
}

/**
 * Per-ecosystem controls for the auto-import plugin.
 *
 * `unplugin-auto-import` is the one plugin that serves TWO ecosystems, because
 * it has a single `dirs` array. So it is named after the plugin rather than an
 * ecosystem, and each ecosystem is a named sub-key — rather than the positional
 * second argument this used to take, or two plugin instances, which would both
 * transform every module and race on the same `auto-imports.d.ts`.
 */
export interface MonoAutoImportOptions extends PluginOpts {
  /** This app's own `composables/` dir, or `false` to take only federated ones. */
  composables?: false | MonoViteOwnDirs
  /** This app's own `stores/` dir, or `false` to leave stores out entirely. */
  stores?: false | MonoViteOwnDirs
}

/**
 * `AutoImport()` options: own + federated composables AND stores dirs.
 *
 * `imports` covers only the preset NAMES that resolve from this app. The object
 * presets (`unheadVueComposablesImports`, `VueRouterAutoImports`) need a module
 * load, which cannot happen synchronously — import them in your config and pass
 * your own `imports`, or use `mono.autoImport()`, which resolves them for you.
 */
export function monoAutoImportOptions(
  ctx: MonoViteContext,
  opts: MonoAutoImportOptions = {},
): PluginOpts {
  ctx.built.add('composables')
  const { rootDir, ownType, ecosystem } = ctx
  const { composables = {}, stores = {}, ...pass } = opts
  const src = srcDirForType(ownType)
  const wantComposables = composables !== false
  const wantStores = stores !== false

  return {
    imports: ['vue', 'vue-router', '@vueuse/core', 'pinia'].filter((id) =>
      canResolveFromRoot(rootDir, id),
    ),
    dts: `${src}/auto-imports.d.ts`,
    vueTemplate: true,
    dirs: [
      // Own dirs mirror what the federated half below asks for: the ecosystem
      // dir AND its `shared/` sub-dir. Scanning `composables/` but not
      // `composables/shared/` in this app, while pulling BOTH from every other
      // app, is the kind of asymmetry that loses `useAuthStore` with no error.
      ...(wantComposables
        ? ownDirs(rootDir, (composables || {}).own, [
            `${src}/composables`,
            `${src}/composables/shared`,
          ])
        : []),
      ...(wantStores
        ? ownDirs(rootDir, (stores || {}).own, [`${src}/stores`, `${src}/stores/shared`])
        : []),
      // The union of both templates' shapes. `monoEcosystem` filters to dirs
      // that exist, so naming one an app does not have costs nothing.
      ...ecosystem([
        ...(wantComposables ? ['composables/shared', 'composables'] : []),
        ...(wantStores ? ['stores/shared', 'stores'] : []),
      ]),
    ],
    ...pass,
  }
}

/** `Components()` options: own + federated component dirs. */
export function monoComponentsOptions(
  ctx: MonoViteContext,
  opts: MonoEcoOptions = {},
): PluginOpts {
  ctx.built.add('components')
  const { rootDir, ownType, ecosystem } = ctx
  const { own, ...pass } = opts
  const src = srcDirForType(ownType)
  return {
    extensions: ['vue'],
    include: [/\.vue$/, /\.vue\?vue/],
    dts: `${src}/components.d.ts`,
    directoryAsNamespace: true,
    collapseSamePrefixes: true,
    dirs: [...ownDirs(rootDir, own, `${src}/components`), ...ecosystem('components')],
    ...pass,
  }
}

// --- plugin builders -------------------------------------------------------
// The same options, already applied to the plugin. Each returns a promise but
// marks `ctx.built` SYNCHRONOUSLY (inside the options builder it calls first),
// so `mono.pages()` earlier in the same array literal is visible to `vite()`.

/** `vue-router/vite` + `ecosystem('pages')` + `extendRoute`. `enforce: 'pre'`. */
export function monoPages(
  ctx: MonoViteContext,
  opts: MonoEcoOptions = {},
  extendRouteOpts?: false | MonoExtendRouteOptions,
): Promise<PluginOption> {
  const options = monoPagesOptions(ctx, opts, extendRouteOpts)
  return (async () => {
    const VueRouter = interopDefault<(o: PluginOpts) => PluginOption>(
      await createRootLoader(ctx.rootDir)('vue-router/vite'),
    )
    return tagEco(VueRouter(options), 'pages')
  })()
}

/** `vite-plugin-vue-layouts-next` + `ecosystem('layouts')`. `enforce: 'pre'`. */
export function monoLayouts(
  ctx: MonoViteContext,
  opts: MonoEcoOptions = {},
): Promise<PluginOption> {
  const options = monoLayoutsOptions(ctx, opts)
  return (async () => {
    const Layouts = interopDefault<(o: PluginOpts) => PluginOption>(
      await createRootLoader(ctx.rootDir)('vite-plugin-vue-layouts-next'),
    )
    return tagEco(Layouts(options), 'layouts')
  })()
}

/**
 * `unplugin-auto-import/vite` + the federated composables AND stores dirs.
 * `enforce: 'post'`. One plugin covers both ecosystems, so `stores` is a
 * dirs-only companion option rather than its own factory.
 */
export function monoAutoImport(
  ctx: MonoViteContext,
  opts: MonoAutoImportOptions = {},
): Promise<PluginOption> {
  const options = monoAutoImportOptions(ctx, opts)
  return (async () => {
    const load = createRootLoader(ctx.rootDir)
    const AutoImport = interopDefault<(o: PluginOpts) => PluginOption>(
      await load('unplugin-auto-import/vite'),
    )
    return tagEco(
      AutoImport({
        ...options,
        // The plugin form can afford the module loads the sync options builder
        // cannot, so it upgrades `imports` with the object presets
        // (`unheadVueComposablesImports`, `VueRouterAutoImports`) — unless the
        // consumer supplied their own list.
        imports: opts.imports ?? (await defaultAutoImports(ctx.rootDir, load)),
      }),
      'composables',
    )
  })()
}

/** `unplugin-vue-components/vite` + `ecosystem('components')`. `enforce: 'post'`. */
export function monoComponents(
  ctx: MonoViteContext,
  opts: MonoEcoOptions = {},
): Promise<PluginOption> {
  const options = monoComponentsOptions(ctx, opts)
  return (async () => {
    const Components = interopDefault<(o: PluginOpts) => PluginOption>(
      await createRootLoader(ctx.rootDir)('unplugin-vue-components/vite'),
    )
    return tagEco(Components(options), 'components')
  })()
}

/**
 * Build the federated plugin stack.
 *
 * Returned order matters only WITHIN each `enforce` bucket, and that is exactly
 * what this controls: compat transforms before `VueRouter` (both `pre`), and
 * `mono.plugin` after auto-import/components (both `post`).
 *
 * Any ecosystem plugin already built via its own factory earlier in the same
 * `plugins` array is skipped, so mixing the two styles never double-registers.
 */
export async function monoVite(
  ctx: MonoViteContext,
  opts: MonoViteOptions = {},
): Promise<PluginOption[]> {
  const { apps, hostResolver, plugin, built } = ctx
  const out: PluginOption[] = []

  // --- Nuxt-remote compat (enforce: 'pre') --------------------------------
  // Gated on the one field that already distinguishes the two example branches.
  // These MUST precede VueRouter: they rewrite raw SFC source that VueRouter and
  // @vitejs/plugin-vue then read.
  const compat = opts.nuxtCompat
  const wantCompat =
    typeof compat === 'boolean'
      ? compat
      : compat != null ||
        // Skipped when the consumer already spread `...mono.nuxt().hostResolver()`
        // themselves — the long-hand config does exactly that.
        (!built.has('compat') && apps.some((app) => app.type === 'nuxt'))
  if (wantCompat) {
    out.push(...transformFirst(hostResolver(typeof compat === 'object' ? compat : {})))
  }

  /**
   * Should `vite()` build this ecosystem's plugin?
   *
   *  - `false`        never
   *  - an object      always — an explicit option outranks the skip, so
   *                   `vite({ components: {…} })` wins even if something else
   *                   marked it
   *  - `undefined`    only if the consumer has not already wired it (via a mono
   *                   factory, `.options()`, or `mono.ecosystem(<that sub>)`)
   */
  const wanted = (key: MonoEcoKey, value: unknown) =>
    value !== false && (value != null || !built.has(key))

  if (wanted('pages', opts.pages)) {
    out.push(await monoPages(ctx, opts.pages || {}, opts.extendRoute))
  }
  if (wanted('layouts', opts.layouts)) {
    out.push(await monoLayouts(ctx, opts.layouts || {}))
  }
  // One plugin, two ecosystems: build it if EITHER was handed over, and pass
  // both keys through so `{ stores: false }` still narrows what it scans.
  if (wanted('composables', opts.composables) || wanted('composables', opts.stores)) {
    const { own, ...rest } = (opts.composables === false ? {} : opts.composables) ?? {}
    out.push(
      await monoAutoImport(ctx, {
        ...rest,
        composables: opts.composables === false ? false : own === undefined ? {} : { own },
        stores: opts.stores,
      }),
    )
  }
  if (wanted('components', opts.components)) {
    out.push(await monoComponents(ctx, opts.components || {}))
  }

  // --- LAST (enforce: 'post'): alias / define / server.fs / optimizeDeps ---
  // Skipped when the consumer already listed `mono.plugin` themselves (reading
  // that property marks it), so the long-hand config does not carry the same
  // object twice. Its hooks are guarded anyway, so a `mono.vite()` written
  // ABOVE `mono.plugin` still behaves — it is just listed twice.
  if (!built.has('plugin')) out.push(plugin)
  return out
}

/** Marks a plugin instance mono built, and for which ecosystem. */
const MONO_ECO_TAG = '__monoEco'
/** Marks an instance mono has already stood down. */
const MONO_NEUTRALIZED = '__monoNeutralized'

/** Tag every plugin object a builder produced (a factory may return an array). */
function tagEco<T>(built: T, key: MonoEcoKey): T {
  const walk = (entry: unknown): void => {
    if (Array.isArray(entry)) return entry.forEach(walk)
    if (entry && typeof entry === 'object') (entry as Record<string, unknown>)[MONO_ECO_TAG] = key
  }
  walk(built)
  return built
}

/** A hook that does nothing. `transform`/`resolveId`/`load` must return null. */
function noopHook(name: string) {
  return ['transform', 'resolveId', 'load'].includes(name) ? () => null : () => undefined
}

/**
 * Stand a plugin instance down without removing it.
 *
 * Vite fixes the plugin list before any `config()` hook runs, so a duplicate
 * cannot be spliced out. Its hooks CAN be replaced, though. Hooks are replaced with
 * no-ops rather than deleted, because `getSortedPluginsByHook` may already have
 * captured this plugin as a hook owner, and it would then call `undefined`.
 */
function neutralize(plugin: Record<string, any>): void {
  if (plugin[MONO_NEUTRALIZED]) return
  plugin[MONO_NEUTRALIZED] = true

  // unplugin's own per-id gate — the cheapest way to make it skip everything.
  if (plugin.transformInclude) plugin.transformInclude = () => false

  for (const name of [
    'transform',
    'resolveId',
    'load',
    'buildStart',
    'buildEnd',
    'configureServer',
    'closeBundle',
    'writeBundle',
    'generateBundle',
  ]) {
    const hook = plugin[name]
    if (hook == null) continue
    plugin[name] =
      typeof hook === 'object' ? { ...hook, handler: noopHook(name) } : noopHook(name)
  }
}

/**
 * Make `mono.vite()` win when an ecosystem is registered twice.
 *
 * The long-hand config registers `VueRouter`/`AutoImport`/`Components`/`Layouts`
 * by hand. Passing that ecosystem to `vite({ components: {…} })` says "mono owns
 * this one now" — so mono's instance stays live and the hand-written one is
 * stood down, leaving exactly one active plugin per ecosystem.
 *
 * When neither instance is mono's, nothing is touched: that is the consumer's
 * own duplicate, and silently disabling one would be worse than saying so.
 */
export function reconcileEcoPlugins(plugins: unknown): {
  won: string[]
  conflicting: string[]
} {
  const known = new Set<string>(Object.values(MONO_ECO_PLUGIN_NAMES))
  const byName = new Map<string, Record<string, any>[]>()

  const walk = (entry: unknown): void => {
    if (Array.isArray(entry)) return entry.forEach(walk)
    const plugin = entry as Record<string, any> | null
    if (!plugin || typeof plugin !== 'object') return
    const name = plugin.name
    if (!name || !known.has(name)) return
    byName.set(name, [...(byName.get(name) ?? []), plugin])
  }
  walk(plugins)

  const won: string[] = []
  const conflicting: string[] = []

  for (const [name, list] of byName) {
    if (list.length < 2) continue
    const mine = list.find((plugin) => plugin[MONO_ECO_TAG])
    if (!mine) {
      conflicting.push(name)
      continue
    }
    for (const plugin of list) if (plugin !== mine) neutralize(plugin)
    won.push(name)
  }

  if (won.length) {
    console.info(
      `[mono] ${won.join(', ')}: mono.vite() options given, so mono's instance is` +
        ` active and the hand-written one was stood down.`,
    )
  }
  if (conflicting.length) {
    console.warn(
      `[mono] ${conflicting.join(', ')} registered more than once, neither by mono.\n` +
        `[mono] Two unplugin-auto-import instances race on one auto-imports.d.ts and two\n` +
        `[mono] vue-router instances scan every page twice. Remove one, or hand the\n` +
        `[mono] ecosystem to mono.vite({ … }) and let it own the plugin.`,
    )
  }
  return { won, conflicting }
}
