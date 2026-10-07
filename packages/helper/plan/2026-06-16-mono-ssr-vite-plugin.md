# 2026-06-16 — `@mono-lit/helper/vite` SSR plugin (`monoSsr`)

## Context

Mono UI components are Lit custom elements. Their `@mono-lit/helper/ui/*` entries register
the elements at module-load time (`class extends HTMLElement` + `customElements.define`).
When a consuming Nuxt/Vite app runs with SSR, evaluating those side-effect imports on the
server throws **`HTMLElement is not defined`**, and `<mono-*>` tags must not render on the
server at all.

The working fix previously lived as two ad-hoc files in the consuming host
(`mono-nuxt-host/build/mono-client-only.ts` and `mono-nuxt-host/build/mono-ssr-stub.ts`).
That logic belongs to `@mono-lit/helper` so every consumer gets it for free behind one import.

## Deliverable

A new package entry **`@mono-lit/helper/vite`** exposing a single combined factory:

```ts
import { monoSsr } from '@mono-lit/helper/vite'

// nuxt.config.ts / vite.config.ts
vite: { plugins: [monoSsr()] }                 // zero-config defaults
// or
vite: { plugins: [monoSsr({ prefix: 'mono-', wrapper: 'ClientOnly', ssrStubPrefix: '@mono-lit/helper/ui/' })] }
```

`monoSsr(options)` returns BOTH plugins, configured from one `MonoSsrOptions` props object:

- **mono-ssr-stub** — SSR-only `resolveId` that maps `@mono-lit/helper/ui/*` (non-`.css`) imports
  to an empty virtual module, so the registration code never evaluates on the server.
- **mono-client-only** — `transform` that wraps every `<mono-*>` template tag in
  `<ClientOnly>` with a `mono-client-skeleton` fallback.

## Files

- `src/vite/mono-client-only.ts` — ported plugin; AST node types imported from
  `@vue/compiler-dom` (re-exports `@vue/compiler-core`) to avoid a direct dep.
- `src/vite/mono-ssr-stub.ts` — ported plugin, unchanged logic.
- `src/vite/index.ts` — `monoSsr` factory + `MonoSsrOptions`; re-exports the individual
  plugins and their option types.
- `package.json` — add `./vite` export; add `@vue/compiler-dom`, `@vue/compiler-sfc`,
  `magic-string` to `dependencies`; add `vite` to `peerDependencies`.
- `vite.config.ts` — add `'vite': src/vite/index.ts` lib entry; change
  `rollupOptions.external` to externalize `vite`, `@vue/*`, `magic-string`, `node:*`
  (component bundles unaffected — they don't import these).

## Verification

- `pnpm build` → emits `dist/vite.js` (with vite/@vue/magic-string left external) and
  `dist/src/vite/index.d.ts`; `dist/ui/*.js` unchanged.
- Consumer SSR build: no `HTMLElement is not defined`; `/` returns 200 with the
  `mono-client-skeleton` fallback; elements hydrate and render on the client.

## Notes

- `monoSsr()` returns `Plugin[]`; Vite flattens nested plugin arrays.
- SSR-build detection (`options.ssr` / `environment.name === 'ssr'`) is the single
  adjustment point if a future Vite changes this.
