//#region src/nuxt/nuxt-layers.d.ts
interface MonoNuxtLayersOptions {
  /** Project root. `apps[].path` resolves against it. @default process.cwd() */
  dirname?: string;
  /** @deprecated `apps[].path` is authoritative in every command; ignored. */
  link?: boolean;
  /** Only these app names become layers. */
  includes?: string[];
  /** These app names never become layers. */
  excludes?: string[];
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
declare function monoNuxtLayers(opts?: MonoNuxtLayersOptions): string[];
//#endregion
export { type MonoNuxtLayersOptions, monoNuxtLayers };