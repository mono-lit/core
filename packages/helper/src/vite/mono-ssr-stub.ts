// src/vite/mono-ssr-stub.ts
import type { Plugin } from 'vite'


export interface MonoSsrStubOptions {
  /**
   * Import prefix whose side-effect (web component registration) modules
   * should be stubbed during the server build. CSS entries are never stubbed.
   */
  packagePrefix?: string
}

const VIRTUAL_ID = '\0mono-helper-ssr-stub'

/**
 * `@mono-lit/helper/ui/*` entries register Lit custom elements at module load
 * (`class extends HTMLElement` + `customElements.define(...)`), which throws
 * `HTMLElement is not defined` when evaluated in the Node SSR context.
 *
 * Every `<mono-*>` tag is already wrapped in `<ClientOnly>` and declared via
 * `isCustomElement`, so nothing on the server needs these elements registered.
 * This plugin resolves those side-effect imports to an empty module in the
 * server build only — the client build keeps the real modules, so the elements
 * still register and render after hydration.
 */
export function monoSsrStubPlugin(
  options: MonoSsrStubOptions = {},
): Plugin {
  const packagePrefix = options.packagePrefix ?? '@mono-lit/helper/ui/'

  return {
    name: '@mono-lit/helper:mono-ssr-stub',
    enforce: 'pre',

    resolveId(source, _importer, resolveOptions) {
      const isServerBuild =
        resolveOptions?.ssr === true ||
        // Vite environment API (newer versions) where `ssr` may be absent.
        (this as any)?.environment?.name === 'ssr'

      if (!isServerBuild) {
        return null
      }

      if (
        source.startsWith(packagePrefix) &&
        // Do NOT stub the shadow-DOM/SSR builds (`@mono-lit/helper/ui/shadow/*`):
        // those are designed to render on the server (via @lit-labs/ssr /
        // nuxt-ssr-lit), so they MUST evaluate and register their custom
        // elements. Only the light `ui/*` builds (which throw on the server)
        // are stubbed.
        !source.startsWith(`${packagePrefix}shadow/`) &&
        !source.endsWith('.css')
      ) {
        return VIRTUAL_ID
      }

      return null
    },

    load(id) {
      if (id === VIRTUAL_ID) {
        // Originals are pure side-effect imports (no bindings) — empty is safe.
        return 'export {}'
      }

      return null
    },
  }
}
