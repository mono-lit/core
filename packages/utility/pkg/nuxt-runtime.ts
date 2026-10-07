// pkg/nuxt-runtime.ts — runtime helpers for the Nuxt host.
// Exposed as `@mono-lit/utility/nuxt-runtime` (distinct from `./nuxt`, the build-time module).
//
// The isomorphic cookie/token/jwt/storage utils live in `@mono-lit/utility/runtime`
// (monoCookie/monoToken/monoJwt/monoStorage). Here we expose:
//   - `setMonoEventResolver` so the host can wire `() => useRequestEvent()` once,
//   - the OPTIONAL unstorage cookie driver/storage for advanced async use.

export { setMonoEventResolver, type MonoRequestEvent } from '../src/composables/universal'
export { monoCookieDriver, monoCookieStorage, type MonoCookieDriverOptions } from '../src/nuxt/ssr-cookie'
