export * from '../src/composables/state'

// Nuxt's `useState()` for a Vue/Vite host — a keyed ref registry. Injected into
// synced remote code by the `monoNuxtStateToRef()` Vite plugin (part of
// `monoVue()` / `monoRepo().nuxt().hostResolver()`); import it directly, or add it
// to `unplugin-auto-import`'s `imports`, to share the registry from host code.
export {
    useState,
    monoUseState,
    clearNuxtState,
    nuxtStateKeys,
} from '../src/composables/nuxt-state'

export * from '../src/composables/combine-layout'
export * from '../src/composables/host-provider'

// Isomorphic (client + SSR) cookie/token/jwt/storage utils — SAME names work in
// the Nuxt client, the `.mono/apps/mono-vue` SPA, and during Nuxt SSR.
export {
    monoCookie,
    monoToken,
    monoJwt,
    monoStorage,
    setMonoEventResolver,
    type MonoRequestEvent,
} from '../src/composables/universal'

// Raw client-only primitives, still available for explicit document.cookie use.
export {
    useMyToken,
    useMyCookie,
    useMyJwt,
    useMyStorage,
    useMyFetch,
} from '../src/token'

// Shared helper surface (validation / notif / data / OData / JSON) + the drop-in
// notification renderer — from the in-repo core (src/core) so apps import them from here.
export { useMonoUtility, useMonoUtility as useMonoUtils } from '../src/composables/use-mono-utility'
export { default as MonoNotivue } from '../src/components/MonoNotivue.vue'

// The shared helper surface (bundled in) is re-exported here so everything comes
// from `@mono-lit/utility/runtime`.
export { useUtils } from '../src/core'
// The raw action-card component (use `MonoNotivue` for the full renderer).
export { MonoNotifAction } from '../src/core'
export type * from '../src/core'
