import { remoteGate, type MonoRemoteGateOptions } from './remote-matcher'
import { parsePageMetaFromFile } from '../composables/parse-page-meta'

export interface MonoExtendRouteOptions extends MonoRemoteGateOptions {
  /**
   * Give every route an explicit `meta.layout` so `setupLayouts` wraps each page
   * exactly once. Without it, a page inside a folder that has no `index.vue`
   * renders its layout TWICE — see {@link monoExtendRoute}. Default true.
   */
  normalizeLayouts?: boolean
  /**
   * Layout for pages that declare none. MUST match the app's
   * `Layouts({ defaultLayout })`, or those pages get an unknown layout name.
   * Default 'default'.
   */
  defaultLayout?: string
}

/**
 * The narrow surface of vue-router's `EditableTreeNode` we touch in `extendRoute`.
 * `components` is a **Map** (view name -> resolved filepath) in vue-router 5;
 * `component` is the convenience getter for the `default` view's filepath.
 */
interface ExtendRouteNode {
  component?: string
  components?: Map<string, string> | Record<string, string>
  /** Readonly, and NEVER contains `definePage()` meta — parse the source for that. */
  meta?: Readonly<Record<string, unknown>>
  addToMeta(meta: Record<string, unknown>): void
}

/** Resolved default-component filepath, tolerating the Map or a plain-object shape. */
function componentFile(route: ExtendRouteNode): string | undefined {
  if (typeof route.component === 'string') return route.component
  const c = route.components
  if (!c) return undefined
  if (c instanceof Map) return c.get('default') ?? c.values().next().value
  return Object.values(c)[0]
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
export function monoExtendRoute(options: MonoExtendRouteOptions = {}) {
  const isRemote = remoteGate(options)
  const normalizeLayouts = options.normalizeLayouts !== false
  const defaultLayout = options.defaultLayout ?? 'default'

  return (route: ExtendRouteNode) => {
    const file = componentFile(route)

    // No component => a pass-through node: the folder grouping other routes. It
    // renders nothing, so it must never own a layout.
    if (!file) {
      if (normalizeLayouts) route.addToMeta({ layout: false })
      return
    }

    const meta = parsePageMetaFromFile(file)

    if (isRemote(file) && (meta.layout !== undefined || meta.title)) {
      route.addToMeta(meta as Record<string, unknown>)
    }

    if (!normalizeLayouts) return

    // `meta.layout` from a `<route>` block counts as declared too. `definePage`
    // meta isn't visible here, which is why the source was parsed above.
    const declared = meta.layout ?? route.meta?.layout
    if (declared === undefined) route.addToMeta({ layout: defaultLayout })
  }
}
