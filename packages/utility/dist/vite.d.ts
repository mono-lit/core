import { c as MonoConfig, o as MonoAppType, w as MonoTemplate } from "./create-config-D3m6xTaQ.js";
import { r as MonoAppRootSource, t as MonoAppRoot } from "./app-roots-BJsIxzjk.js";
import { Plugin, PluginOption, ViteDevServer } from "vite";

//#region src/vite/remote-matcher.d.ts
/** The options every compat transform accepts, so they stay interchangeable. */
interface MonoRemoteGateOptions {
  /** Only transform files whose id contains this marker. Default '/.mono/apps/'. */
  appsMarker?: string;
  /**
   * Absolute roots that also count as remote source — a locally-linked app's
   * checkout. `monoRepo()` supplies these; there is nothing to pass by hand.
   */
  appsRoots?: string[];
}
//#endregion
//#region src/vite/mono-pagemeta.d.ts
interface MonoPageMetaPluginOptions extends MonoRemoteGateOptions {}
/**
 * Vite plugin: strip the Nuxt page macro `definePageMeta({ … })` from synced
 * remote `.vue` files (those under `.mono/apps/`) so it never reaches the Vue/Vite
 * host's runtime.
 *
 * The Vue host doesn't need the macro: route META (layout/title) is injected
 * separately by the host's `extendRoute` via `parsePageMetaFromFile`, which reads
 * the page from disk (and so is unaffected by this in-memory strip). Removing the
 * call outright — rather than rewriting it to unplugin-vue-router's `definePage`
 * — means we don't depend on vue-router's own macro-stripping transform (and its
 * `transform.filter`/ordering) ever running on the same module. Our single
 * `enforce: 'pre'` transform, before `@vitejs/plugin-vue` compiles the SFC, is
 * all that's required.
 *
 * `enforce: 'pre'` so it runs before the SFC is compiled — place `monoVue()`
 * before `VueRouter()` in the plugins array.
 */
declare function monoPageMetaToDefinePage(options?: MonoPageMetaPluginOptions): Plugin;
/** Clearer alias for {@link monoPageMetaToDefinePage}. */
declare const monoStripPageMeta: typeof monoPageMetaToDefinePage;
//#endregion
//#region src/vite/mono-layout-slot.d.ts
/**
 * Vite plugin: rewrite a synced remote **layout**'s default `<slot/>` (the
 * Nuxt page outlet) into `<router-view />` for the Vue/Vite host.
 *
 * `vite-plugin-vue-layouts-next`'s `setupLayouts` wraps each page as a CHILD
 * route of its layout, so the layout component must render `<router-view/>` for
 * the page to appear. Nuxt layouts instead use `<slot/>` (NuxtLayout injects the
 * page into the default slot). Without this rewrite the page renders nowhere — the
 * layout chrome shows but the page content is blank.
 *
 * Scope: `.vue` files under a remote `.mono/apps/.../layouts/` dir. Only the DEFAULT
 * slot is rewritten — named slots (`<slot name="…">`) are left untouched, since
 * those are real content slots, not the page outlet. `<router-view>` is globally
 * registered by `app.use(router)`, so no import is needed.
 *
 * Mirror of `mono-pagemeta`'s transform; the Nuxt host never runs this (it uses
 * the same layout files via `<slot/>`).
 */
declare function monoLayoutSlotToRouterView(options?: MonoPageMetaPluginOptions): Plugin;
//#endregion
//#region src/vite/mono-nuxt-state.d.ts
interface MonoNuxtStatePluginOptions extends MonoPageMetaPluginOptions {
  /**
   * Module the shims are imported from. Default `'@mono-lit/utility/runtime'` — change
   * it if the host aliases the package or wants its own implementation.
   */
  importFrom?: string;
  /**
   * Nuxt auto-imports to shim. Default `['useState', 'clearNuxtState']`. Every
   * name listed must be exported by `importFrom`.
   */
  composables?: string[];
}
/**
 * Vite plugin: make Nuxt's `useState()` work in a Vue/Vite host.
 *
 * A synced Nuxt remote writes `const msg = useState('msg', () => 'hello')` and
 * relies on Nuxt auto-importing it. Nothing provides that name in a plain Vue app,
 * so the page dies with `useState is not defined`. This plugin rewrites the
 * remote's modules to pull the name from `@mono-lit/utility/runtime`, whose
 * {@link ../composables/nuxt-state.useState | shim} is the same thing minus the
 * SSR payload: a keyed ref registry, so `useState('msg', () => 'hello')` resolves
 * to a shared `ref('hello')` and a keyless call to a plain one.
 *
 * Injecting an import (rather than textually rewriting the call to `ref(...)`)
 * keeps the KEY meaningful — two components on the same key must see one ref,
 * which a per-call `ref()` can't do — and doesn't depend on the host auto-importing
 * `ref`.
 *
 * Scope: files under `.mono/apps/` (the `appsMarker` option; pass `''` to cover the
 * host's own sources too). A file is left alone when it already binds the name
 * itself — an explicit import, a local `const`/`function`, or an aliased
 * (`useState as x`) Nuxt import. A PLAIN import from a Nuxt virtual module
 * (`#imports` / `#app`) is stripped first, since those specifiers resolve to
 * nothing outside Nuxt.
 *
 * `enforce: 'pre'` so `.vue` files are still raw SFC source — register before
 * `@vitejs/plugin-vue`, alongside the other `monoVue()` plugins.
 */
declare function monoNuxtStateToRef(options?: MonoNuxtStatePluginOptions): Plugin;
/** Clearer alias for {@link monoNuxtStateToRef}. */
declare const monoNuxtState: typeof monoNuxtStateToRef;
//#endregion
//#region src/vite/mono-link.d.ts
interface MonoLinkPluginOptions extends MonoPageMetaPluginOptions {
  /**
   * Give an external link `rel="noopener noreferrer"` when it has no `rel` of its
   * own (what `<NuxtLink external>` does). Default true; `no-rel` on the source
   * tag opts out per-link.
   */
  externalRel?: boolean;
}
/**
 * Vite plugin: `<NuxtLink>` -> `<RouterLink>` (or `<a>`) for a Vue/Vite host.
 *
 * A synced Nuxt remote links with `<NuxtLink to="/x">`, which Nuxt auto-imports.
 * The Vue host has no such component, so Vue logs `Failed to resolve component:
 * NuxtLink` and renders nothing. This rewrites the tag in remote templates:
 *
 *  - `<NuxtLink to="/x">`          -> `<RouterLink to="/x">`
 *  - `<NuxtLink external to="/x">` -> `<RouterLink to="/x" target="_blank" rel="noopener noreferrer">`
 *  - `<NuxtLink to="https://…">`   -> `<a href="https://…" rel="noopener noreferrer">`
 *
 * `external` stays a RouterLink because vue-router's `guardEvent` won't intercept
 * a click on a targeted anchor — the browser navigates for real, which is what
 * `external` means, and `to` still resolves as a route. An ABSOLUTE `to` is the
 * one case that can't: `router.resolve('https://x.dev')` treats it as a path and
 * renders `href="/https://x.dev"`, so those become a real `<a>` (with
 * `target="_blank"` too when the tag also said `external`).
 *
 * Nuxt-only props (`prefetch`, `no-rel`, `trailing-slash`, …) are dropped rather
 * than passed through, or they'd land on the DOM as literal attributes. `href` is
 * renamed to `to` (NuxtLink accepts both), and for the `<a>` form `to` becomes
 * `href`. Everything else — `class`, `target`, `@click`, `v-if`, slots — is left
 * exactly as written, and `</NuxtLink>` follows whatever its opening tag became.
 *
 * Case is preserved: `<nuxt-link>` -> `<router-link>`. `RouterLink` is registered
 * globally by `app.use(router)`, so nothing needs importing.
 *
 * LIMITS (both warn at build time rather than mis-compiling): a computed
 * `:external="cond"` can't be resolved here, so the link stays in-app (no
 * `target`); and a `custom` NuxtLink gets neither treatment, since it renders no
 * element of its own — only the `v-slot="{ href, navigate }"` content.
 *
 * `enforce: 'pre'` — the SFC must still be raw source, so register before
 * `@vitejs/plugin-vue` (`monoVue()` / `monoRepo().nuxt().hostResolver()` do).
 */
declare function monoNuxtLinkToRouterLink(options?: MonoLinkPluginOptions): Plugin;
/**
 * Vite plugin (Nuxt host): `<RouterLink>` -> `<NuxtLink>` for synced **Vue**
 * remotes — the mirror of {@link monoNuxtLinkToRouterLink}, registered by
 * `@mono-lit/utility/nuxt`.
 *
 * `<RouterLink>` does resolve under Nuxt (vue-router registers it), so this isn't
 * a fix for a broken render — it's so remote links behave like the host's own:
 * route prefetching, external/absolute-URL handling, and `trailingSlash`
 * normalisation, none of which RouterLink does. Every RouterLink prop (`to`,
 * `replace`, `active-class`, `exact-active-class`, `custom`, `aria-current-value`)
 * is a NuxtLink prop too, so this is a pure tag rename — attributes, slots and
 * `v-slot` bindings pass through untouched. Case is preserved:
 * `<router-link>` -> `<nuxt-link>`.
 */
declare function monoRouterLinkToNuxtLink(options?: MonoLinkPluginOptions): Plugin;
/** Clearer aliases. */
declare const monoNuxtLink: typeof monoNuxtLinkToRouterLink;
declare const monoRouterLink: typeof monoRouterLinkToNuxtLink;
//#endregion
//#region src/vite/extend-route.d.ts
interface MonoExtendRouteOptions extends MonoRemoteGateOptions {
  /**
   * Give every route an explicit `meta.layout` so `setupLayouts` wraps each page
   * exactly once. Without it, a page inside a folder that has no `index.vue`
   * renders its layout TWICE — see {@link monoExtendRoute}. Default true.
   */
  normalizeLayouts?: boolean;
  /**
   * Layout for pages that declare none. MUST match the app's
   * `Layouts({ defaultLayout })`, or those pages get an unknown layout name.
   * Default 'default'.
   */
  defaultLayout?: string;
}
/**
 * The narrow surface of vue-router's `EditableTreeNode` we touch in `extendRoute`.
 * `components` is a **Map** (view name -> resolved filepath) in vue-router 5;
 * `component` is the convenience getter for the `default` view's filepath.
 */
interface ExtendRouteNode {
  component?: string;
  components?: Map<string, string> | Record<string, string>;
  /** Readonly, and NEVER contains `definePage()` meta — parse the source for that. */
  meta?: Readonly<Record<string, unknown>>;
  addToMeta(meta: Record<string, unknown>): void;
}
/**
 * Build a `VueRouter({ extendRoute })` callback that does two things.
 *
 * **1. Seeds meta for synced remote pages** (component path under `appsMarker`,
 * default `/.mono/apps/`). Remote Nuxt pages declare meta with `definePageMeta`,
 * which vue-router does not read from disk (and which `monoVue()` strips from the
 * runtime build), so it's parsed from the source and added to the route where
 * `setupLayouts` can see `meta.layout`.
 *
 * **2. Gives every route an explicit layout, so no page is wrapped twice.**
 * `setupLayouts` wraps in two independent places: every TOP-LEVEL record, and any
 * record that declares `meta.layout`. A page folder becomes a component-less GROUP
 * record (`{ path: '/module-one', children: [{ path: 'example', … }] }`), and the
 * plugin's guard against wrapping such a group only fires when the group's `''`
 * child is already a layout — i.e. only when the folder has an `index.vue` that
 * itself declares a layout. Any other shape gets the default layout around the
 * group AND the page's own layout inside it:
 *
 *     "/module-one"  L(default)      <-- group, wrapped because it is top-level
 *       ""  (group)
 *         "example"  L(home)         <-- page, wrapped because it declares a layout
 *           ""  PAGE
 *
 * So `pages/module-one/example.vue` renders two nested layouts while
 * `pages/flow/{index,create}.vue` renders one. Fixed per node, no child lookahead:
 *  - a group (no component) gets `layout: false`, which `setupLayouts` honours by
 *    leaving the record alone — killing the outer wrapper
 *  - a page that declares no layout gets `defaultLayout`, so removing that wrapper
 *    can't leave a page unwrapped
 *
 * Layout normalisation applies to EVERY route, not just remote ones: a host-owned
 * nested folder doubles exactly the same way. `meta.layout` is read from the page
 * SOURCE because `EditableTreeNode.meta` deliberately excludes `definePage()` meta.
 * A page declaring `layout: false` keeps it — never overwrite an explicit value.
 *
 * Reads the default component filepath via `route.component` — NOT
 * `Object.values(route.components)`, which yields `[]` because `components` is a `Map`.
 *
 *   import { monoExtendRoute } from '@mono-lit/utility/vite'
 *   VueRouter({ routesFolder: [...], extendRoute: monoExtendRoute() })
 */
declare function monoExtendRoute(options?: MonoExtendRouteOptions): (route: ExtendRouteNode) => void;
//#endregion
//#region src/vite/mono-vite.d.ts
/**
 * Options shared by every ecosystem key. The federated dirs are mono's job; this
 * is how you say where *this* app's own copies live.
 */
interface MonoViteOwnDirs {
  /**
   * This app's own dir(s) for that ecosystem, placed BEFORE the federated ones.
   *
   * Defaults to the type-aware convention (`src/pages` in a `vue` app,
   * `app/components` in a `nuxt` one) and is **skipped when it does not exist**,
   * so an app that simply has no `layouts/` needs no configuration. Pass `false`
   * for federated dirs only.
   */
  own?: string | string[] | false;
}
/**
 * Options for the underlying plugin, merged OVER mono's defaults. Left loose on
 * purpose: @mono-lit/utility does not depend on these packages (see
 * `./resolve-from-root`), so importing their option types would drag them into
 * the install graph for the sake of autocomplete.
 */
type PluginOpts = Record<string, any>;
/** One option object per ecosystem plugin. */
type MonoEcoOptions = PluginOpts & MonoViteOwnDirs;
/** The ecosystem plugins mono can build. */
type MonoEcoKey = 'pages' | 'layouts' | 'composables' | 'components';
/** Upstream plugin name for each key — used for the duplicate warning. */
declare const MONO_ECO_PLUGIN_NAMES: Record<MonoEcoKey, string>;
interface MonoViteOptions {
  /** `vue-router/vite`. `false` to register it yourself. */
  pages?: false | MonoEcoOptions;
  /** `unplugin-vue-components/vite`. */
  components?: false | MonoEcoOptions;
  /** `vite-plugin-vue-layouts-next`. */
  layouts?: false | MonoEcoOptions;
  /** `unplugin-auto-import/vite` — this key carries the plugin's options. */
  composables?: false | MonoEcoOptions;
  /** The stores half of the same auto-import plugin: dirs only. */
  stores?: false | MonoViteOwnDirs;
  /**
   * Force the Nuxt-compat transforms on or off, or pass their options.
   * Default: **auto** — on iff some extends-active app has `type: 'nuxt'`.
   *
   * These are NOT flattened onto the top level, because
   * `MonoRepoNuxtHostOptions` already carries a `composables` key (which Nuxt
   * composables `useState` should be shimmed from) that would collide with the
   * ecosystem key of the same name.
   */
  nuxtCompat?: boolean | MonoRepoNuxtHostOptions;
  /** `false` to skip `extendRoute`. You almost certainly do not want to. */
  extendRoute?: false | MonoExtendRouteOptions;
}
/** Everything the builders need from the `monoRepo()` closure. */
interface MonoViteContext {
  rootDir: string;
  /** This app's own kind, from `mono.config.ts` `type`. */
  ownType: MonoAppType;
  /**
   * This app's own role, from `mono.config.ts` `template`. Leaf-only — never
   * inherited through `extends`. `undefined` behaves as `'remote'`, which is
   * what this file did before the field existed.
   */
  template?: MonoTemplate;
  apps: {
    name: string;
    type: MonoAppType;
    path?: string;
  }[];
  ecosystem: (subs: string | string[]) => string[];
  extendRoute: (options?: MonoExtendRouteOptions) => unknown;
  hostResolver: (options?: MonoRepoNuxtHostOptions) => Plugin[];
  plugin: Plugin;
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
  built: Set<MonoEcoKey | 'compat' | 'plugin'>;
}
/**
 * Which ecosystem a `mono.ecosystem(sub)` call belongs to, by first path
 * segment — `composables/shared` and `stores/shared` both feed auto-import.
 */
declare const MONO_ECO_SUB_KEYS: Record<string, MonoEcoKey>;
/** Map one ecosystem subpath to the plugin that consumes it, if any. */
declare function ecoKeyForSub(sub: string): MonoEcoKey | undefined;
/** `VueRouter()` options: own + federated page folders, plus `extendRoute`. */
declare function monoPagesOptions(ctx: MonoViteContext, opts?: MonoEcoOptions, extendRouteOpts?: false | MonoExtendRouteOptions): PluginOpts;
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
declare function monoLayoutsOptions(ctx: MonoViteContext, opts?: MonoEcoOptions): PluginOpts;
/**
 * Per-ecosystem controls for the auto-import plugin.
 *
 * `unplugin-auto-import` is the one plugin that serves TWO ecosystems, because
 * it has a single `dirs` array. So it is named after the plugin rather than an
 * ecosystem, and each ecosystem is a named sub-key — rather than the positional
 * second argument this used to take, or two plugin instances, which would both
 * transform every module and race on the same `auto-imports.d.ts`.
 */
interface MonoAutoImportOptions extends PluginOpts {
  /** This app's own `composables/` dir, or `false` to take only federated ones. */
  composables?: false | MonoViteOwnDirs;
  /** This app's own `stores/` dir, or `false` to leave stores out entirely. */
  stores?: false | MonoViteOwnDirs;
}
/**
 * `AutoImport()` options: own + federated composables AND stores dirs.
 *
 * `imports` covers only the preset NAMES that resolve from this app. The object
 * presets (`unheadVueComposablesImports`, `VueRouterAutoImports`) need a module
 * load, which cannot happen synchronously — import them in your config and pass
 * your own `imports`, or use `mono.autoImport()`, which resolves them for you.
 */
declare function monoAutoImportOptions(ctx: MonoViteContext, opts?: MonoAutoImportOptions): PluginOpts;
/** `Components()` options: own + federated component dirs. */
declare function monoComponentsOptions(ctx: MonoViteContext, opts?: MonoEcoOptions): PluginOpts;
/** `vue-router/vite` + `ecosystem('pages')` + `extendRoute`. `enforce: 'pre'`. */
declare function monoPages(ctx: MonoViteContext, opts?: MonoEcoOptions, extendRouteOpts?: false | MonoExtendRouteOptions): Promise<PluginOption>;
/** `vite-plugin-vue-layouts-next` + `ecosystem('layouts')`. `enforce: 'pre'`. */
declare function monoLayouts(ctx: MonoViteContext, opts?: MonoEcoOptions): Promise<PluginOption>;
/**
 * `unplugin-auto-import/vite` + the federated composables AND stores dirs.
 * `enforce: 'post'`. One plugin covers both ecosystems, so `stores` is a
 * dirs-only companion option rather than its own factory.
 */
declare function monoAutoImport(ctx: MonoViteContext, opts?: MonoAutoImportOptions): Promise<PluginOption>;
/** `unplugin-vue-components/vite` + `ecosystem('components')`. `enforce: 'post'`. */
declare function monoComponents(ctx: MonoViteContext, opts?: MonoEcoOptions): Promise<PluginOption>;
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
declare function monoVite(ctx: MonoViteContext, opts?: MonoViteOptions): Promise<PluginOption[]>;
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
declare function reconcileEcoPlugins(plugins: unknown): {
  won: string[];
  conflicting: string[];
};
//#endregion
//#region src/composables/expose.d.ts
/**
 * Deep-clone `value` keeping ONLY JSON-safe leaves: strings, numbers, booleans,
 * null, plain objects and arrays. Everything else is thrown away automatically —
 * functions & class constructors (e.g. `oDataService: DefaultService`, DevExtreme
 * `DataSource`/`ODataStore`/`CustomStore`), class instances, symbols, `undefined`,
 * `bigint`, `Date`, `Map`, `Set`. Cycles and runaway depth are guarded, so it
 * never throws and never leaks non-serialisable values into a client bundle.
 *
 * The single source of truth for the `__MONO_CONFIG_EXPOSE__` global shared by
 * the Vite host (`monoRepo`) and the Nuxt host (`@mono-lit/utility/nuxt`).
 *
 * Exported so a custom `expose` can opt into the same sanitisation:
 *   expose: (c) => sanitizeForExpose({ ...c, extra: customInstance })
 */
declare function sanitizeForExpose(value: unknown, depth?: number, seen?: WeakSet<object>): unknown;
//#endregion
//#region src/vite/mono-repo.d.ts
interface MonoRepoOptions {
  /**
   * Override/extend the auto-computed `monoAlias` map. Each entry's `dir` is
   * resolved against the project root (absolute paths kept as-is). Example:
   *   alias: { '@mono-host': { dir: 'src' } }
   */
  alias?: Record<string, {
    dir: string;
  }>;
  /**
   * Customize the client-exposed config global `__MONO_CONFIG_EXPOSE__`.
   * Receives the resolved mono config; return the (serialisable) object to
   * expose. Defaults to the same trimmed, browser-safe subset the Nuxt module
   * ships (`name`/`apps`/`cookie`/`env`/`jwt`/`menu` + `fetching.auth`).
   */
  expose?: (config: MonoConfig) => Record<string, unknown>;
  /** Packages excluded from Vite dep pre-bundling (web-components dedup). Default ['@mono-lit/helper']. */
  optimizeExclude?: string[];
  /** Project root. Defaults to `process.cwd()` (Vite's default root). */
  dirname?: string;
  /** Folder scanned for remotes. Default './.mono/apps'. */
  appsDir?: string;
  /**
   * Let the config chain load when a federated app isn't synced into
   * `.mono/apps/`: its `mono.config` import resolves to an empty config instead of
   * throwing `Cannot find module '@<app>-root/mono.config'`. Only that specifier is
   * stubbed — app code importing a missing app still fails. Default true.
   */
  stubMissing?: boolean;
  /** Warn (once) naming the apps that were stubbed. Default true. */
  warnMissing?: boolean;
  /**
   * @deprecated `apps[].path` is honoured in every command; nothing depends on
   * which one is running. Accepted so existing `monoRepo({ command })` calls
   * keep type-checking.
   */
  command?: 'serve' | 'build';
  /** @deprecated `apps[].path` is authoritative in every command; ignored. */
  link?: boolean;
  /**
   * Restart the dev server when this app's or any active app's
   * `mono.config.ts` changes (see `monoLith`). Default true.
   */
  restartOnConfigChange?: boolean;
  /**
   * Add every `path` sibling's source dir to the dev watcher, so a page or
   * component ADDED in a sibling reaches the ecosystem plugins. Default true.
   */
  watchSiblings?: boolean;
}
/** Options for {@link MonoRepoNuxt.hostResolver} (mirrors `monoNuxtHost`'s options). */
interface MonoRepoNuxtHostOptions extends MonoNuxtStatePluginOptions, MonoLinkPluginOptions {
  /**
   * Define the Nuxt compile-time constants `import.meta.server` / `import.meta.client`
   * for synced remote code that branches on them (a Vite SPA client is
   * `client: true`, `server: false`). Default true.
   */
  defineImportMeta?: boolean;
  /**
   * Resolve Nuxt's `useState()` (and `clearNuxtState()`) to the `@mono-lit/utility/runtime`
   * shim in synced remote code. Default true.
   */
  nuxtState?: boolean;
  /**
   * Rewrite `<NuxtLink>` in synced remote templates to `<RouterLink>` — plus
   * `target="_blank"` when the link is `external`, or a plain `<a>` when `to` is
   * an absolute URL vue-router can't resolve. Default true.
   */
  nuxtLink?: boolean;
}
/**
 * Nuxt-host compatibility helpers — used when a federated **remote is a Nuxt
 * app** rendered inside this Vue/Vite host. Returned by {@link MonoRepoResult.nuxt}.
 */
interface MonoRepoNuxt {
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
  hostResolver: (options?: MonoRepoNuxtHostOptions) => Plugin[];
  /**
   * A `VueRouter({ extendRoute })` callback (= `monoExtendRoute()`) that injects
   * `{ layout, title }` parsed from a synced remote page's source so
   * `setupLayouts` can wrap it. Host pages (which use `definePage`) are skipped.
   *   VueRouter({ extendRoute: mono.nuxt().extendRoute() })
   */
  extendRoute: (options?: MonoExtendRouteOptions) => ReturnType<typeof monoExtendRoute>;
}
/**
 * Result of {@link monoRepo} — a Vite plugin plus the resolved mono values.
 *
 * `plugin` wires `resolve.alias`, `__MONO_CONFIG_EXPOSE__`, `server.fs.allow` and
 * dep dedup; `ecosystem(subs)` discovers remote dirs (type-aware) to feed the
 * ecosystem plugins AT REGISTRATION TIME; `nuxt()` exposes the nuxt-host compat
 * helpers (`hostResolver`, `extendRoute`) for when a remote is a Nuxt app.
 */
interface MonoRepoResult {
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
  vite: (options?: MonoViteOptions) => Promise<PluginOption[]>;
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
    /** The `VueRouter()` options — see {@link MonoRepoResult.pages}. */options: (options?: MonoEcoOptions) => Record<string, any>;
  };
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
    /** The `Layouts()` options — see {@link MonoRepoResult.layouts}. */options: (options?: MonoEcoOptions) => Record<string, any>;
  };
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
    /** The `AutoImport()` options — see {@link MonoRepoResult.autoImport}. */options: (options?: MonoAutoImportOptions) => Record<string, any>;
  };
  /**
   * Alias of {@link MonoRepoResult.autoImport}, kept because this ecosystem is
   * named `composables` everywhere else (`vite({ composables })`,
   * `ecosystem('composables')`). Prefer `autoImport` — the name says which
   * plugin you get, and that stores come with it.
   */
  composables: ((options?: MonoAutoImportOptions) => Promise<PluginOption>) & {
    options: (options?: MonoAutoImportOptions) => Record<string, any>;
  };
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
    /** The `Components()` options — see {@link MonoRepoResult.components}. */options: (options?: MonoEcoOptions) => Record<string, any>;
  };
  /** Vite plugin — register LAST. Wires alias, define, server.fs, optimizeDeps. */
  plugin: Plugin;
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
  ecosystem: (subs: string | string[]) => string[];
  /**
   * A `VueRouter({ extendRoute })` callback (= `monoExtendRoute()`). Wire it in
   * EVERY federated app, Nuxt remote or not: besides seeding meta for synced Nuxt
   * pages, it gives every route an explicit `meta.layout` so `setupLayouts` can't
   * wrap a page twice (a page in a folder with no `index.vue` otherwise renders
   * its layout nested inside the default one).
   *   VueRouter({ routesFolder: [...], extendRoute: mono.extendRoute() })
   */
  extendRoute: (options?: MonoExtendRouteOptions) => ReturnType<typeof monoExtendRoute>;
  /**
   * Nuxt-host compatibility helpers (`hostResolver`, `extendRoute`) for when a
   * federated remote is a Nuxt app rendered in this Vue/Vite host. See
   * {@link MonoRepoNuxt}.
   */
  nuxt: () => MonoRepoNuxt;
  /** The resolved mono config (post `extends`-chain merge). */
  config: MonoConfig;
  /** The computed `monoAlias` map (also applied by `plugin`). */
  alias: Record<string, string>;
  /** The extends-active apps `{ name, type }` that `ecosystem()` discovers over. */
  apps: {
    name: string;
    type: MonoAppType;
    path?: string;
  }[];
  /**
   * Every federated app resolved to the directory it is read from — a
   * `.mono/apps` clone or an `apps[].path` sibling (`source`). For anything
   * that needs the directories themselves, e.g. UnoCSS `content.filesystem`
   * globs over sibling sources.
   */
  appRoots: MonoAppRoot[];
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
declare function monoRepo(options?: MonoRepoOptions): Promise<MonoRepoResult>;
//#endregion
//#region src/composables/parse-page-meta.d.ts
/**
 * Page meta mono cares about: `layout` (which layout wraps the page)
 * and `title` (route title). Both optional.
 */
interface MonoPageMeta {
  /** Layout name, or `false` for a page that opts out of layouts entirely. */
  layout?: string | false;
  title?: string;
}
/**
 * Extract `{ layout, title }` from a page's `<script setup>` source, supporting
 * BOTH macro forms:
 *  - Nuxt:    `definePageMeta({ layout: 'home', title: 'Home' })`
 *  - vue-router (unplugin-vue-router): `definePage({ meta: { layout, title } })`
 *
 * String-literal values only (layout/title are always literals in these apps).
 * Used by the Nuxt host module (to seed remote route meta) and by the Vite
 * host's `extendRoute` (since unplugin-vue-router reads page files from disk and
 * never sees the `definePageMeta -> definePage` Vite transform).
 */
declare function parsePageMeta(code: string): MonoPageMeta;
/** {@link parsePageMeta} for a file path (build-time, Node). Returns `{}` on read error. */
declare function parsePageMetaFromFile(file: string): MonoPageMeta;
//#endregion
//#region src/vite/resolve-from-root.d.ts
/** A loader that imports bare specifiers as the app at `rootDir` would. */
type RootLoader = <T = any>(id: string) => Promise<T>;
/**
 * Build a {@link RootLoader} anchored at `rootDir`.
 *
 * `createRequire` needs a *file* to resolve from — `noop.js` never has to exist,
 * it only fixes the directory the walk starts in.
 */
declare function createRootLoader(rootDir: string): RootLoader;
/** `true` when `id` can be resolved from the app root. Never throws. */
declare function canResolveFromRoot(rootDir: string, id: string): boolean;
//#endregion
//#region src/vite/mono-lith.d.ts
declare const MONO_APPS_VIRTUAL_ID = "virtual:mono-apps";
interface MonoLithOptions {
  /** Project root. Defaults to `process.cwd()`. */
  dirname?: string;
  /** Folder scanned for clones. @default './.mono/apps' */
  appsDir?: string;
  /**
   * Pre-resolved roots (what `monoRepo` already computed). Resolved from
   * `mono.config.ts` when omitted.
   */
  appRoots?: MonoAppRoot[];
  /**
   * Names of the apps that contribute — the `extends`-gated set. Every
   * resolved root when omitted. Drives `virtual:mono-apps` and the config
   * watch list; siblings are served and watched regardless.
   */
  activeNames?: string[];
  /**
   * Restart the dev server when any active app's `mono.config.ts` changes.
   * @default true
   */
  restartOnConfigChange?: boolean;
  /**
   * Add every `path` sibling's source dir to the dev watcher so new files are
   * picked up by the ecosystem plugins.
   * @default true
   */
  watchSiblings?: boolean;
}
/** The hooks, shared by {@link monoLith} and `monoRepo`'s own plugin. */
interface MonoLithHooks {
  /** Extra `server.fs.allow` entries: every `path` root. */
  fsAllow: string[];
  /** The resolved roots this instance works from. */
  appRoots: MonoAppRoot[];
  configureServer: (server: ViteDevServer) => void;
  resolveId: (id: string) => string | undefined;
  load: (id: string) => string | undefined;
}
declare function createMonoLithHooks(options?: MonoLithOptions): MonoLithHooks;
/**
 * Standalone plugin for a long-hand `vite.config.ts`. `monoRepo().vite()` /
 * `mono.plugin` already include these hooks — do not register both.
 *
 * ```ts
 * import { monoLith } from '@mono-lit/utility/vite'
 * plugins: [VueRouter({ … }), vue(), monoLith({ dirname: __dirname })]
 * ```
 */
declare function monoLith(options?: MonoLithOptions): Plugin;
//#endregion
//#region src/vite/index.d.ts
interface MonoVueOptions extends MonoNuxtStatePluginOptions, MonoLinkPluginOptions {
  /**
   * Define the Nuxt compile-time constants `import.meta.server` /
   * `import.meta.client` for synced remote code that branches on them
   * (a Vite SPA client is `client: true`, `server: false`). Default true.
   */
  defineImportMeta?: boolean;
  /**
   * Resolve Nuxt's `useState()` (and `clearNuxtState()`) to the `@mono-lit/utility/runtime`
   * shim in synced remote code. Default true.
   */
  nuxtState?: boolean;
  /**
   * Rewrite `<NuxtLink>` in synced remote templates to `<RouterLink>` — plus
   * `target="_blank"` when the link is `external`, or a plain `<a>` when `to` is
   * an absolute URL vue-router can't resolve. Default true.
   */
  nuxtLink?: boolean;
}
/**
 * Vite-host compatibility layer for running a **Nuxt remote** inside a plain
 * Vue 3 + Vite host. Returns the plugins needed for the narrow Nuxt surface the
 * synced remote code uses:
 *  - strips the Nuxt `definePageMeta({…})` macro from `.mono/apps/*.vue` (route meta is
 *    injected separately by the host's `extendRoute` via `parsePageMetaFromFile`)
 *  - rewrites a remote layout's default `<slot/>` -> `<router-view/>` (so Nuxt
 *    `<slot>` layouts render the page under `setupLayouts`' nested routes)
 *  - points Nuxt's auto-imported `useState()` at the `@mono-lit/utility/runtime` shim
 *    (a keyed ref registry — `useState('k', () => 'hello')` -> a shared `ref('hello')`)
 *  - rewrites `<NuxtLink>` -> `<RouterLink>` (`external` adds `target="_blank"`,
 *    so the browser navigates for real; an absolute-URL `to` becomes an `<a>`)
 *  - defines `import.meta.server`/`import.meta.client` (SPA client constants)
 *
 * Mirrors `@mono-lit/helper/vite`'s `monoSsr()` shape. Register before `VueRouter()`:
 *   import { monoVue } from '@mono-lit/utility/vite'
 *   plugins: [ ...monoVue(), VueRouter({...}), vue(), ... ]
 */
declare function monoVue(options?: MonoVueOptions): Plugin[];
//#endregion
export { MONO_APPS_VIRTUAL_ID, MONO_ECO_PLUGIN_NAMES, MONO_ECO_SUB_KEYS, type MonoAppRoot, type MonoAppRootSource, type MonoAutoImportOptions, type MonoEcoKey, type MonoEcoOptions, type MonoExtendRouteOptions, type MonoLinkPluginOptions, type MonoLithHooks, type MonoLithOptions, type MonoNuxtStatePluginOptions, type MonoPageMeta, type MonoPageMetaPluginOptions, type MonoRepoNuxt, type MonoRepoNuxtHostOptions, type MonoRepoOptions, type MonoRepoResult, type MonoViteContext, type MonoViteOptions, type MonoViteOwnDirs, MonoVueOptions, type RootLoader, canResolveFromRoot, createMonoLithHooks, createRootLoader, ecoKeyForSub, monoAutoImport, monoAutoImportOptions, monoComponents, monoComponentsOptions, monoExtendRoute, monoLayoutSlotToRouterView, monoLayouts, monoLayoutsOptions, monoLith, monoVue as monoNuxtHost, monoVue, monoNuxtLink, monoNuxtLinkToRouterLink, monoNuxtState, monoNuxtStateToRef, monoPageMetaToDefinePage, monoPages, monoPagesOptions, monoRepo, monoRouterLink, monoRouterLinkToNuxtLink, monoStripPageMeta, monoVite, parsePageMeta, parsePageMetaFromFile, reconcileEcoPlugins, sanitizeForExpose };