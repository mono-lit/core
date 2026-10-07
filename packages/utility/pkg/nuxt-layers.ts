/**
 * Config-time escape hatch for `nuxt.config.ts`.
 *
 * You normally need NONE of this: `@mono-lit/utility/nuxt` registers federated Nuxt
 * apps as Nuxt layers by itself, from `mono.config.ts`, so a remote's
 * `nuxt.config.ts` is identical to a host's. Reach for `monoNuxtLayers()` only
 * when a layer's own `nuxt.config` has to be merged too (its `modules`, `css`,
 * `vite` options) — Nuxt only does that for an `extends` declared at
 * config-load time.
 *
 * Kept out of `@mono-lit/utility/nuxt` so evaluating `nuxt.config` doesn't drag in
 * `@nuxt/kit` and the whole module: this entry touches nothing but `node:fs`
 * and mono's static config parser.
 */
export { monoNuxtLayers } from '../src/nuxt/nuxt-layers'
export type { MonoNuxtLayersOptions } from '../src/nuxt/nuxt-layers'
