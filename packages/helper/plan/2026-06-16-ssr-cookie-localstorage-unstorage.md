# 2026-06-16 — SSR-safe cookie/localStorage (token utils + unstorage SSR backend)

## Context

`@mono-lit/utility/src/token/index.ts` holds a cookie util (`useMyCookie`, raw `document.cookie` +
split chunks), a pure JWT util (`useMyJwt`), a storage util (`useMyStorage`), and a token
technique (`useMyToken`) — all client-only. `@mono-lit/utility` re-exports them
(`monoCookie/monoJwt/monoStorage/monoToken`) and `src/composables/state.ts`
(`initFederation`/`createMono`) reads cookies to hydrate a reactive `monoState()`. None of
it works under SSR (`document` is undefined), so the host guards reads with
`typeof document !== 'undefined'` and renders unauthenticated on the server.

## Goal

1. **Split the cookie/token concept + technique into backend-agnostic
   utils** (`createCookie(store)`, `createToken(deps, options)`, a `CookieStore` primitive,
   pure split helpers, `getByPath`, `useMyJwt`, `useMyFetch`). The token module keeps its **client
   binding** (`document.cookie`, synchronous, unchanged public API) by reusing those utils.
2. **Add an SSR cookie/storage backend in `@mono-lit/utility/src/nuxt`** built on
   [unstorage](https://unstorage.unjs.io/): its `localstorage` driver + a **custom cookie
   driver** (`defineDriver`) bridging h3 request/response cookies (server) and
   `document.cookie` (client), with **full read + write**.
3. **Add `@mono-lit/utility/src/nuxt/state.ts`** that reuses the utils to hydrate `monoState()`
   during SSR (`initFederationSsr(option, event)`), so existing synchronous guards/components
   render correctly on the server.

Confirmed decisions: unstorage + custom cookie driver; full SSR read + write.

## Layering (no dependency cycle)

The shared utils live in the lowest layer, **`@mono-lit/utility/src/token`**, which imports
nothing else from @mono-lit/utility. The pure pieces are environment-agnostic; only
the cookie IO binding differs: **sync** `document.cookie` (client) vs **async** unstorage
(server). SSR async is consumed only at init/handlers — sync guards keep reading the
server-populated `monoState()`.

## Files

- `@mono-lit/utility/src/token/`: split into `{types,cookie-core,token-core,jwt,storage,
  fetch,client}.ts`; `index.ts` is a barrel re-exporting the public API **plus** the
  new util primitives.
- `@mono-lit/utility/src/nuxt/ssr-cookie.ts` (new) — unstorage cookie driver + `monoCookieSsr`/
  `monoTokenSsr`/`monoStorageSsr` (async).
- `@mono-lit/utility/src/nuxt/state.ts` (new) — `initFederationSsr` reusing `patchStateFederation`.
- `@mono-lit/utility/pkg/nuxt-runtime.ts` (new) + `tsdown.config.ts` entry + `package.json`
  `./nuxt-runtime` export; add `unstorage` + `h3` deps.
- Host (gated on republish): universal plugin replacing `mono.client.ts`; drop
  `typeof document` guards in `mono.config.ts`.

## Verification

- Build @mono-lit/utility; the public token API (`useMyCookie`/`useMyToken`/…) is unchanged.
- Node smoke: client `useMyCookie`/`useMyToken` vs stubbed `document.cookie`; `monoCookieSsr`
  with a fake h3 event round-trips a split token through the unstorage cookie driver.
- Host SSR (after wiring): request cookie → `monoState().jwt.token` populated server-side,
  no `document is not defined`; client login/refresh/logout still work.
