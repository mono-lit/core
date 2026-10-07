# `monoExtendRoute()` — fix remote-page layout/title injection

**Date:** 2026-06-16

## Context

Vue/Vite host `mono-vue` federates the Nuxt `mono-host` remote. `monoVue()` strips
`definePageMeta` from `.apps/*.vue` (see `2026-06-16-strip-pagemeta.md`), so a remote page's
`layout`/`title` must be injected by the host's `VueRouter({ extendRoute })` callback, which
parses the page source with `parsePageMetaFromFile` and calls `route.addToMeta(...)`.

**Symptom:** remote `/home` rendered **without its `home` layout** (no error).

**Root cause:** `extendRoute` receives a vue-router 5 `EditableTreeNode` whose `components`
getter returns a **`Map`** (view name → filepath), not a plain object. The host did
`Object.values(route.components ?? {})[0]`, and `Object.values(<Map>)` is `[]`, so `file` was
always `undefined` and the callback bailed before `addToMeta` — no meta was ever set, so
`setupLayouts` had no `meta.layout` to wrap with. `EditableTreeNode` exposes `.component`
(= `components.get('default')`) for this.

## What changed

### `src/vite/extend-route.ts` (new)
- `monoExtendRoute(options?: { appsMarker = '/.apps/' })` → returns an `extendRoute` callback.
- `componentFile()` reads the default-component filepath via `route.component`, falling back
  to `components.get('default')` / first Map value / plain-object value.
- For routes whose component path contains the marker, parse meta via `parsePageMetaFromFile`
  and `route.addToMeta({ layout, title })`. Non-remote (host) routes are skipped.

### `src/vite/index.ts`
- Re-export `monoExtendRoute` + `MonoExtendRouteOptions`.

### Consumer `mono-vue/vite.config.ts`
- `extendRoute: monoExtendRoute()` replaces the inline broken `Object.values(components)` code.
  Import changed to `import { monoVue, monoExtendRoute } from '@mono-lit/utility/vite'`.

## Verification

- Unit: calling the built `monoExtendRoute()` with a Map-based mock node for the real
  `home.vue` → `addToMeta({ layout: 'home', title: 'Home' })`; a `src/pages/*` (host) node →
  skipped (null).
- Host `vite build --mode development` (cache cleared): 285 modules, built OK, no
  `definePage`/`definePageMeta` leak.
- Generated routes contain remote-page meta: `home`→`{layout:'home',title:'Home'}`,
  index→`auth`/Login, error→`default`/Error.

## Propagation

`pnpm build` (tsdown) + sync `dist/` into the host's git-dep copy under
`node_modules/.pnpm/mono-utils@git+…/node_modules/@mono-lit/utility/dist/`. Restart the dev server
(plugin/helper code in node_modules is not hot-reloaded).
