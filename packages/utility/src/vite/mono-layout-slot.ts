import { remoteGate, type MonoRemoteGateOptions } from './remote-matcher'
import type { Plugin } from 'vite'
import type { MonoPageMetaPluginOptions } from './mono-pagemeta'

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
export function monoLayoutSlotToRouterView(
  options: MonoPageMetaPluginOptions = {},
): Plugin {
  const isRemote = remoteGate(options)

  return {
    name: 'mono-layout-slot-to-router-view',
    enforce: 'pre',
    transform(code: string, id: string) {
      const file = id?.split('?')[0]?.replace(/\\/g, '/')
      if (
        !file ||
        !file.endsWith('.vue') ||
        !isRemote(file) ||
        !file.includes('/layouts/')
      )
        return
      if (!code.includes('<slot')) return

      // Default slot only — negative lookahead skips `<slot name="…">`.
      const out = code
        .replace(/<slot(?![^>]*\bname=)\b[^>]*\/>/g, '<router-view />')
        .replace(/<slot(?![^>]*\bname=)\b[^>]*>\s*<\/slot>/g, '<router-view />')

      return out === code ? undefined : { code: out, map: null }
    },
  }
}
