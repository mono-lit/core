import type { Plugin } from 'vite'
import {
  monoPageMetaToDefinePage,
  monoStripPageMeta,
  type MonoPageMetaPluginOptions,
} from './mono-pagemeta'
import { monoLayoutSlotToRouterView } from './mono-layout-slot'
import {
  monoNuxtStateToRef,
  type MonoNuxtStatePluginOptions,
} from './mono-nuxt-state'
import { monoNuxtLinkToRouterLink, type MonoLinkPluginOptions } from './mono-link'

export interface MonoVueOptions extends MonoNuxtStatePluginOptions, MonoLinkPluginOptions {
  /**
   * Define the Nuxt compile-time constants `import.meta.server` /
   * `import.meta.client` for synced remote code that branches on them
   * (a Vite SPA client is `client: true`, `server: false`). Default true.
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
function monoVue(options: MonoVueOptions = {}): Plugin[] {
  const plugins: Plugin[] = [
    monoPageMetaToDefinePage(options),
    monoLayoutSlotToRouterView(options),
  ]

  if (options.nuxtState !== false) {
    plugins.push(monoNuxtStateToRef(options))
  }

  if (options.nuxtLink !== false) {
    plugins.push(monoNuxtLinkToRouterLink(options))
  }

  if (options.defineImportMeta !== false) {
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
}

export { monoVue, monoVue as monoNuxtHost }

export { monoPageMetaToDefinePage, monoStripPageMeta, monoLayoutSlotToRouterView }
export {
  monoNuxtStateToRef,
  monoNuxtState,
  type MonoNuxtStatePluginOptions,
} from './mono-nuxt-state'
export {
  monoNuxtLinkToRouterLink,
  monoRouterLinkToNuxtLink,
  monoNuxtLink,
  monoRouterLink,
  type MonoLinkPluginOptions,
} from './mono-link'
export { monoExtendRoute, type MonoExtendRouteOptions } from './extend-route'
export { monoRepo, sanitizeForExpose, type MonoRepoOptions, type MonoRepoResult, type MonoRepoNuxt, type MonoRepoNuxtHostOptions } from './mono-repo'
export type { MonoPageMetaPluginOptions }
export {
  parsePageMeta,
  parsePageMetaFromFile,
  type MonoPageMeta,
} from '../composables/parse-page-meta'
export {
  monoVite,
  monoPages,
  monoLayouts,
  monoAutoImport,
  monoComponents,
  reconcileEcoPlugins,
  MONO_ECO_PLUGIN_NAMES,
  type MonoViteOptions,
  type MonoViteOwnDirs,
  type MonoViteContext,
  type MonoAutoImportOptions,
  type MonoEcoOptions,
  type MonoEcoKey,
} from './mono-vite'
export { createRootLoader, canResolveFromRoot, type RootLoader } from './resolve-from-root'
export {
  monoPagesOptions,
  monoLayoutsOptions,
  monoAutoImportOptions,
  monoComponentsOptions,
} from './mono-vite'
export { ecoKeyForSub, MONO_ECO_SUB_KEYS } from './mono-vite'
export {
  monoLith,
  createMonoLithHooks,
  MONO_APPS_VIRTUAL_ID,
  type MonoLithOptions,
  type MonoLithHooks,
} from './mono-lith'
export type { MonoAppRoot, MonoAppRootSource } from '../composables/app-roots'
