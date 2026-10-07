// src/nuxt/index.ts — the `@mono-lit/helper/nuxt` Nuxt module.
//
// Wraps everything the host previously wired by hand for @mono-lit/helper SSR support:
//   - the `monoSsr()` Vite plugins (import-stub + <ClientOnly> / <LitWrapper> wrap)
//   - auto-wiring `nuxt-ssr-lit` (our own dependency) so importing a shadow build
//     (`@mono-lit/helper/ui/shadow/<c>`) is all it takes to SSR `<mono-c>`
//   - the base stylesheet `@mono-lit/helper/ui/index.css`
//   - the `mono-` `isCustomElement` compiler rule
//
// The first two are SERVER-RENDERING plumbing and follow the app's `ssr` flag: in a
// client-only app (`ssr: false`) nothing is rendered on the server, so there is nothing
// to stub and nothing to defer — the module then only ships the css, the compiler rule,
// the Vite dedupe/optimizeDeps and the ui/tooltip plugins. See `clientOnly` below.
//
// Configured under the shared `mono` config key, sub-object `helper`:
//   modules: ['@mono-lit/helper/nuxt']
//   mono: { helper: { /* MonoHelperModuleOptions */ } }
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  defineNuxtModule,
  addVitePlugin,
  extendViteConfig,
  installModule,
  hasNuxtModule,
  addPluginTemplate,
  tryResolveModule,
  useLogger,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { monoSsr, type MonoSsrOptions } from '../vite'
import type { MonoTooltipGlobalOptions } from '../components/tooltip/tooltip-types'
import type { MonoUIConfig } from '../composables/mono-ui'
import type { MonoSkeletonDefaults } from '../composables/mono-skeleton'

/** The optional peer the automatic skeleton (`pending`) renders with. */
const PHANTOM_UI = '@aejkatappaja/phantom-ui'

export interface MonoHelperModuleOptions extends MonoSsrOptions {
  /** Auto-add `@mono-lit/helper/ui/index.css` to nuxt css. Default true. */
  css?: boolean
  /** Register `<prefix*>` tags as custom elements (composed). Default true. */
  customElement?: boolean
  /**
   * Auto-wire SSR for shadow builds: importing `@mono-lit/helper/ui/shadow/<c>` in a
   * `.vue` file makes its `<mono-c>` server-render (Declarative Shadow DOM) — no
   * manual `litElementPrefix` / `exclude` lists, and nothing for the app to
   * install (`nuxt-ssr-lit` ships as a @mono-lit/helper dependency). Default true.
   * Set false (or keep a manual `nuxt-ssr-lit` module entry) to use the legacy
   * manual wiring.
   */
  ssr?: boolean
  /**
   * Wrap every LIGHT `<prefix*>` in `<ClientOnly>`. Default: **`nuxt.options.ssr !== false`**.
   *
   * The wrap exists so the server never renders a light-DOM custom element. It has a cost:
   * Nuxt's `<ClientOnly>` renders its slot one tick AFTER it mounts, so the owning page's
   * `onMounted` runs before the `<mono-*>` element exists and a `controlMonoTable(ref)` /
   * `controlMonoForm(ref)` bound there sees `null`. Hence:
   *  - `ssr: false` app: nothing renders on the server — no wrap, no `nuxt-ssr-lit`
   *    (set `true` to force the legacy wrap anyway).
   *  - `ssr: true` app: wrapped by default. Set `false` when the pages are client-only as a
   *    WHOLE (route `mode: 'client'`, or `<ClientOnly><NuxtPage/>`) and only a shadow-built
   *    shell server-renders: light tags are then left alone (they SSR as inert tags and
   *    upgrade in the browser), while the server import-stub and the `<LitWrapper>` wrap of
   *    the shadow tags a file imports stay on.
   */
  clientOnly?: boolean
  /**
   * Tags to ALWAYS treat as shadow (SSR-wrapped) regardless of per-file imports
   * — for components registered once in a shared plugin (e.g. nav/sidebar).
   */
  shadow?: string[]
  /**
   * Packages to add to `vite.resolve.dedupe`. Defaults to the lit family, which
   * MUST resolve to one instance — @mono-lit/helper's externalized shadow build and
   * `@lit-labs/ssr` / `nuxt-ssr-lit` otherwise get separate lit-html copies and
   * hydration dies with `currentDirective._$initialize is not a function`.
   * Merged with whatever the app already lists. Pass `false` to opt out.
   */
  dedupe?: string[] | false
  /**
   * Packages to add to `vite.optimizeDeps.include`. Pre-bundling these keeps the
   * optimize-deps hash stable, so Vite doesn't discover them mid-session on the
   * first federated-route visit, re-optimize, and re-fetch @mono-lit/helper's chunks
   * under a new `?v=` — which re-evaluates its `@customElement()` side effects
   * and throws `'mono-nav' has already been defined`.
   *
   * Defaults to `['@mono-lit/devextreme']`. Entries that don't resolve from the app
   * are dropped, because Vite hard-fails on an unresolvable include. Add your
   * app's own federated-only deps here (or keep them in `vite.optimizeDeps`).
   * Pass `false` to opt out.
   */
  optimizeInclude?: string[] | false
  /**
   * The tooltip addon — the Nuxt twin of `createMonoTooltip({...})` in a Vue
   * `main.ts`. `true` (or an options object) turns on the `mono-tooltip-content`
   * attributes app-wide; the options WIN over those passed to `controlMonoTooltip`.
   * Applied by a client-only plugin, so they must be JSON (no `content` /
   * `onShow` functions, no nodes). Needs the optional peers `@floating-ui/dom` +
   * `@floating-ui/core`.
   */
  tooltip?: MonoTooltipGlobalOptions | boolean
  /**
   * App-wide default props for every mono component — the Nuxt twin of
   * `createMonoUI({...})` in a Vue `main.ts`:
   *   ui: { 'mono-button': { size: 'xs' }, 'mono-input': { size: 'sm' } }
   * One key covers the light and the shadow build. Applied by an EARLY plugin on
   * the server AND the client (shadow SSR must render with the same defaults the
   * browser hydrates with). Must be JSON.
   */
  ui?: MonoUIConfig
  /**
   * The automatic skeleton (`pending` on every mono element, drawn by phantom-ui). BUILT
   * IN and ZERO-CONFIG: when the optional peer `@aejkatappaja/phantom-ui` resolves from the
   * app, the module loads it in a client plugin before anything mounts and tells mono
   * whether this is an SSR app (`nuxt.options.ssr`, which decides the automatic default of
   * light elements). Not installed → nothing happens and `pending` is a no-op.
   * `false` turns it off even when installed; an object sets the GLOBAL phantom defaults
   * (`{ animation: 'pulse', duration: 1.2 }`) — the same as `createMonoUI({ skeleton })`.
   * Must be JSON.
   */
  skeleton?: false | MonoSkeletonDefaults
}

/** One lit instance, shared with the shadow build and @lit-labs/ssr. */
const LIT_DEDUPE = ['lit', 'lit-html', 'lit-element', '@lit/reactive-element']

/** Reached only from federated routes, so Vite won't find it in its entry scan. */
const DEFAULT_OPTIMIZE_INCLUDE = ['@mono-lit/devextreme']

const monoHelperModule: NuxtModule = defineNuxtModule({
  meta: { name: '@mono-lit/helper', configKey: 'mono' },
  async setup(options, nuxt) {
    const helper = ((options as any).helper ?? {}) as MonoHelperModuleOptions
    const prefix = helper.prefix ?? 'mono-'
    const logger = useLogger('@mono-lit/helper')

    // Does this app render on the server at all? `ssr: false` = a plain SPA: no
    // server pass evaluates `@mono-lit/helper/ui/*` and there is no first paint to
    // protect, so the SSR plumbing below (nuxt-ssr-lit + the <ClientOnly> /
    // <LitWrapper> wrap) is skipped unless the app opts in with `clientOnly: true`.
    const ssrApp = nuxt.options.ssr !== false
    const clientOnlyWrap = helper.clientOnly ?? ssrApp

    // Resolve from the APP, not from us: optional peers are the app's dependencies.
    const appAnchor = pathToFileURL(join(nuxt.options.rootDir, 'index.js')).href
    // The automatic skeleton activates on the peer's presence alone (see the option doc).
    const phantom = helper.skeleton === false ? null : await tryResolveModule(PHANTOM_UI, appAnchor)
    if (!phantom && helper.skeleton !== false) {
      logger.debug(
        `skeleton: "${PHANTOM_UI}" is not installed in the app — \`pending\` stays a no-op. Install it to turn the automatic skeleton on.`,
      )
    }

    // 0) Auto-wire nuxt-ssr-lit for import-driven SSR wrapping. We ship it as a
    //    real dependency, so the consuming app doesn't declare anything.
    // - If the host still lists `nuxt-ssr-lit` itself → legacy mode: it manages
    //   `litElementPrefix` (and the host keeps `helper.exclude`); we stay out of
    //   the way so the two transforms don't double-wrap.
    // - Else auto-install it with an EMPTY prefix (we do the wrapping via the
    //   import-driven `litWrapper` transform) and enable the LitWrapper branch.
    // - If it can't be resolved at all → degrade to client-only (no SSR).
    // - In an `ssr: false` app there is no server render for <LitWrapper> to feed,
    //   so it is not installed; the shadow builds then run as ordinary custom
    //   elements in the browser.
    let litWrapper = false
    if (helper.ssr !== false && !ssrApp) {
      logger.debug(
        'ssr:false — skipping nuxt-ssr-lit; shadow builds render client-side as plain custom elements.',
      )
    } else if (helper.ssr !== false) {
      if (hasNuxtModule('nuxt-ssr-lit')) {
        logger.info(
          'nuxt-ssr-lit is configured by the host — using legacy manual SSR wiring (litElementPrefix). Remove that module entry to enable @mono-lit/helper auto-wrap, or set mono.helper.ssr:false to silence.',
        )
      } else {
        try {
          // Resolve OUR copy explicitly. `installModule` resolves a bare specifier
          // only against `nuxt.options.modulesDir` (the app's rootDir) — never from
          // the calling module — and a module's own directory is added to that list
          // only AFTER its setup() returns. So under pnpm, where our dependency sits
          // in a nested node_modules the app can't see, the bare string would fail.
          // An absolute path is fully supported and keeps the metadata identical:
          // `parseNodeModulePath` still yields entryPath 'nuxt-ssr-lit', so
          // build.transpile and dist/module.json behave exactly as before.
          // NOTE: use tryResolveModule, not createRequire — the latter resolves via
          // the `require` condition and hands back module.cjs instead of module.mjs.
          const ssrLit = await tryResolveModule('nuxt-ssr-lit', import.meta.url)
          // Install with an empty prefix: we only want its <LitWrapper> component
          // + hydration/@lit-labs/ssr renderer; OUR transform decides what wraps.
          // Fall back to the bare specifier for hoisted / npm / Yarn layouts.
          await installModule(ssrLit ?? 'nuxt-ssr-lit', { litElementPrefix: [] })
          litWrapper = true
        } catch {
          logger.info(
            'nuxt-ssr-lit could not be loaded — mono shadow components fall back to client-only. It ships as a @mono-lit/helper dependency, so this usually means a broken or deduped install; try reinstalling, or set mono.helper.ssr:false to silence.',
          )
        }
      }
    }

    // 1) SSR plugins — monoSsr returns an array (the server import-stub + the template
    //    transform). An SSR app always gets both: the stub keeps `@mono-lit/helper/ui/*` (light
    //    builds) from evaluating on the server, the transform wraps the SHADOW tags a file
    //    imports in <LitWrapper>. Whether the transform ALSO wraps light `<mono-*>` in
    //    <ClientOnly> is `clientOnly` (see the option doc). A client-only app registers
    //    neither, unless `clientOnly: true` forces the legacy wrap.
    // Cast at the boundary: @mono-lit/helper builds against vite@8 while @nuxt/kit's
    // `addVitePlugin` is typed against the vite version nitro pins — the `Plugin`
    // shapes differ (hotUpdate hook `this`), but they're runtime-compatible.
    if (ssrApp || clientOnlyWrap) {
      for (const plugin of monoSsr({
        prefix,
        wrapper: helper.wrapper,
        ssrStubPrefix: helper.ssrStubPrefix,
        exclude: helper.exclude,
        lightWrap: clientOnlyWrap,
        litWrapper,
        shadowOverride: helper.shadow,
      })) {
        addVitePlugin(plugin as any)
      }
      if (!clientOnlyWrap) {
        logger.debug(
          'mono.helper.clientOnly:false — light <mono-*> are not wrapped in <ClientOnly>; the server stub and the shadow <LitWrapper> wrap stay on.',
        )
      }
    } else {
      logger.debug(
        'ssr:false — <mono-*> are not wrapped in <ClientOnly> (nothing renders on the server). Set mono.helper.clientOnly:true to force it.',
      )
    }

    // 2) base stylesheet
    if (helper.css !== false) {
      nuxt.options.css ||= []
      if (!nuxt.options.css.includes('@mono-lit/helper/ui/index.css')) {
        nuxt.options.css.push('@mono-lit/helper/ui/index.css')
      }
    }

    // 3) isCustomElement — compose with any existing rule, don't clobber it.
    if (helper.customElement !== false) {
      const vue = ((nuxt.options as any).vue ||= {})
      vue.compilerOptions ||= {}
      const prev = vue.compilerOptions.isCustomElement
      vue.compilerOptions.isCustomElement = (tag: string) =>
        (typeof prev === 'function' && prev(tag)) || tag.startsWith(prefix)
    }

    // 4) Tooltip global options → a client-only plugin calling createMonoTooltip.
    //    Client-only because the tooltip is pointer/focus-driven and the store
    //    is module state — setting it on the server would leak across requests.
    //    `@mono-lit/helper/tooltip` (not the root) so the plugin pulls in no elements.
    // 4a) createMonoUI — UNIVERSAL (server + client) and early (`order: -50`, so it
    //    runs before any plugin or page that renders a mono element). Unlike the
    //    tooltip store, it is safe on the server: it holds the same static JSON
    //    for every request, and a shadow component rendered there must use the
    //    defaults the client hydrates with.
    //    The skeleton's `ssr` flag + global defaults ride along under the reserved
    //    `skeleton` key — ONE `createMonoUI` call (a second would replace the first).
    const uiConfig: Record<string, unknown> = {
      ...((helper.ui && typeof helper.ui === 'object' ? helper.ui : {}) as Record<string, unknown>),
    }
    if (phantom) {
      uiConfig.skeleton = {
        ssr: ssrApp,
        ...(typeof helper.skeleton === 'object' ? helper.skeleton : {}),
      }
    }
    if (Object.keys(uiConfig).length) {
      addPluginTemplate({
        filename: 'mono-ui.mjs',
        order: -50,
        getContents: () =>
          [
            "import { createMonoUI } from '@mono-lit/helper'",
            'export default defineNuxtPlugin({',
            "  name: '@mono-lit/helper:ui',",
            '  enforce: \'pre\',',
            '  setup() {',
            `    createMonoUI(${JSON.stringify(uiConfig)})`,
            '  },',
            '})',
          ].join('\n'),
      })
    }

    // 4b) The skeleton peer itself — a client plugin whose only job is to load the module
    //    that defines `<phantom-ui>` (mono activates on that definition). Client only:
    //    phantom injects a stylesheet into document.head, and light elements never render
    //    on the server anyway.
    //    A DYNAMIC import inside `setup`, deliberately: phantom is a Lit element, so loading
    //    it pulls in `lit-element`, and that must not happen while the plugin MODULES are
    //    still evaluating — nuxt-ssr-lit's hydrate-support hook is installed by one of them,
    //    and a `lit-element` evaluated before it never honours `defer-hydration` (every
    //    server-rendered shadow element would then render ahead of Vue's hydration). Plugins
    //    run sequentially, so the element is defined before anything mounts all the same.
    if (phantom) {
      addPluginTemplate({
        filename: 'mono-skeleton.client.mjs',
        mode: 'client',
        getContents: () =>
          [
            'export default defineNuxtPlugin({',
            "  name: '@mono-lit/helper:skeleton',",
            '  async setup() {',
            `    await import('${PHANTOM_UI}')`,
            '  },',
            '})',
          ].join('\n'),
      })
    }

    const tooltip = helper.tooltip === true ? {} : helper.tooltip
    if (tooltip && typeof tooltip === 'object') {
      addPluginTemplate({
        filename: 'mono-tooltip.client.mjs',
        mode: 'client',
        getContents: () =>
          [
            "import { createMonoTooltip } from '@mono-lit/helper/tooltip'",
            'export default defineNuxtPlugin({',
            "  name: '@mono-lit/helper:tooltip',",
            '  setup() {',
            `    createMonoTooltip(${JSON.stringify(tooltip)})`,
            '  },',
            '})',
          ].join('\n'),
      })
    }

    // 5) Vite: lit dedupe + pre-bundled federated deps, so the app doesn't have
    //    to hand-maintain either in its own `vite` block.
    const dedupe = helper.dedupe === false ? [] : (helper.dedupe ?? LIT_DEDUPE)
    const wanted = [
      ...(helper.optimizeInclude === false
        ? []
        : (helper.optimizeInclude ?? DEFAULT_OPTIMIZE_INCLUDE)),
      // pre-bundle the lazily imported peers too, or Vite discovers them on the
      // first hover and reloads the page mid-session (dropped when not installed)
      ...(tooltip ? ['@floating-ui/dom'] : []),
    ]
    // The skeleton peer is EXCLUDED from pre-bundling instead: a pre-bundle would inline
    // its own copy of lit ("Multiple versions of Lit loaded"), while served as source its
    // `import 'lit'` lands on the single deduped instance the mono elements use.
    const exclude = phantom ? [PHANTOM_UI] : []

    // Resolve from the APP (`appAnchor`, above): these are the app's dependencies, not
    // @mono-lit/helper's. Vite hard-fails on an unresolvable `optimizeDeps.include`
    // entry, so an app that doesn't use one must not inherit it.
    const include: string[] = []
    for (const id of wanted) {
      if (await tryResolveModule(id, appAnchor)) include.push(id)
      else logger.debug(`optimizeDeps: skipping "${id}" — not resolvable from the app.`)
    }

    if (dedupe.length || include.length || exclude.length) {
      extendViteConfig((config) => {
        if (dedupe.length) {
          config.resolve ||= {}
          config.resolve.dedupe = [...new Set([...(config.resolve.dedupe ?? []), ...dedupe])]
        }
        if (include.length) {
          config.optimizeDeps ||= {}
          config.optimizeDeps.include = [
            ...new Set([...(config.optimizeDeps.include ?? []), ...include]),
          ]
        }
        if (exclude.length) {
          config.optimizeDeps ||= {}
          config.optimizeDeps.exclude = [
            ...new Set([...(config.optimizeDeps.exclude ?? []), ...exclude]),
          ]
        }
      })
    }
  },
})

export default monoHelperModule
