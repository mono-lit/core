// src/nuxt/ssr-lit/index.ts — the Lit SSR bridge, vendored from nuxt-ssr-lit 1.6.33 (MIT,
// see ./LICENSE.md).
//
// Why vendored: nuxt-ssr-lit still declares `@nuxt/kit ^3`, so installing it in a Nuxt 4
// app puts a SECOND kit copy in the tree (and `useNuxt()` breaks across copies) unless
// every app overrides `@nuxt/kit` / `@nuxt/schema`. Owning the ~10 runtime files lets this
// package depend on Nuxt 4's kit directly, so an app only installs `nuxt`.
//
// What is kept is exactly what @mono-lit/helper used: the `<LitWrapper>` components
// (server-render a Lit element to Declarative Shadow DOM, defer its hydration on the
// client), the hydrate-support / DSD-polyfill / anti-FOUC plugins, and the Nitro/Vite SSR
// settings. Dropped: upstream's `litElementPrefix` template transform and its
// `isCustomElement` rule — helper always installed it with an EMPTY prefix (our own
// import-driven `monoSsr` transform decides what gets wrapped), so both were no-ops.
//
// The runtime files under ./runtime ship verbatim (copied to dist/ssr-lit/runtime by
// tsdown.config.ts) and are compiled by the app's Nuxt build, like any module runtime.
import { addComponent, addPlugin, createResolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

export async function installSsrLit(nuxt: Nuxt): Promise<void> {
  // `import.meta.url` is dist/nuxt.js once built; the runtime sits next to it.
  const { resolve } = createResolver(import.meta.url)
  const runtimeDir = resolve('./ssr-lit/runtime')

  // The runtime imports `#imports` and ships `.vue` files: it must be transpiled by the
  // app's build even though it lives in node_modules.
  nuxt.options.build.transpile.push(runtimeDir)

  // `@lit-labs/ssr`'s lit-html renderer installs itself by side effect. (Nuxt 4.6's
  // schema types `nitro` fully only when `nitropack` sits next to it, hence the cast.)
  const nitro = nuxt.options.nitro as { moduleSideEffects?: string[] }
  nitro.moduleSideEffects ||= []
  nitro.moduleSideEffects.push('@lit-labs/ssr/lib/render-lit-html.js')

  // LitWrapperServer renders through Vue's own server renderer — keep it external so
  // it is the same instance Nuxt renders the page with.
  nuxt.options.vite.ssr ||= {}
  const ssrExternal = nuxt.options.vite.ssr.external
  if (Array.isArray(ssrExternal)) {
    if (!ssrExternal.includes('@vue/server-renderer')) ssrExternal.push('@vue/server-renderer')
  } else if (ssrExternal === undefined) {
    nuxt.options.vite.ssr.external = ['@vue/server-renderer']
  }

  addPlugin(resolve(runtimeDir, 'plugins/antiFouc.server'))
  addPlugin(resolve(runtimeDir, 'plugins/polyfill.client'))
  addPlugin(resolve(runtimeDir, 'plugins/hydrateSupport.client'))

  await addComponent({ name: 'LitWrapper', filePath: resolve(runtimeDir, 'components/LitWrapper.vue') })
  await addComponent({ name: 'LitWrapperClient', filePath: resolve(runtimeDir, 'components/LitWrapperClient.vue') })
  await addComponent({ name: 'LitWrapperServer', filePath: resolve(runtimeDir, 'components/LitWrapperServer.vue') })
}
