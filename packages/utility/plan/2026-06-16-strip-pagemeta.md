# Strip `definePageMeta` in the Vue host (@mono-lit/utility/vite)

**Date:** 2026-06-16

## Context

`mono-vue` (Vue 3 + Vite host) federates the **Nuxt** `mono-host` remote from
`.apps/mono-host`. Remote pages declare route meta with the Nuxt macro
`definePageMeta({ layout, title })`.

Previously `monoVue()`'s `mono-pagemeta-to-definepage` plugin **rewrote**
`definePageMeta({…})` → `definePage({ meta:{…} })` and relied on **vue-router's own
transform** (`definePageTransform`, gated by its rolldown-style `transform.filter` over
`routesFolder.src` globs) to strip the resulting `definePage` macro. For Vue-as-host /
Nuxt-as-remote this didn't take effect — the macro leaked — because it depended on a second,
external transform running after ours on the same module id (fragile w.r.t. ordering,
filters, and versions). The old regex `\bdefinePageMeta\s*\(\s*(\{[\s\S]*?\})\s*\)` was also
non-greedy/brace-naive and would corrupt any meta containing nested `{}`/`[]`.

The Vue host doesn't need the macro at runtime: route meta is injected independently by
`VueRouter.extendRoute` → `parsePageMetaFromFile(file)` → `route.addToMeta(...)` in
`mono-vue/vite.config.ts`. `parsePageMetaFromFile` reads the **on-disk** source (still
containing `definePageMeta`), so it is unaffected by in-memory transforms.

## What changed

### `src/vite/mono-pagemeta.ts`
- Plugin renamed `mono-pagemeta-to-definepage` → **`mono-strip-pagemeta`** (`enforce: 'pre'`).
- Behaviour changed from *rewrite* to **strip**: removes every `definePageMeta( … )` call
  from `.apps/*.vue` runtime code via a **balanced-delimiter scan** (`matchClose` /
  `skipString`) that honours nested `(){}[]`, strings, template literals, and `//` `/* */`
  comments. Bails safely (returns `null` → file untouched) on an unterminated call.
- Gating unchanged: id `endsWith('.vue')` + `includes(marker)` (default `/.apps/`), early-out
  on `!code.includes('definePageMeta')`.
- Exported function name `monoPageMetaToDefinePage` kept for back-compat; new alias
  `monoStripPageMeta` added.

### `src/vite/index.ts`
- Re-export `monoStripPageMeta`; updated `monoVue()` docblock to say "strips … macro".

No change to `monoLayoutSlotToRouterView`, `mono-define-import-meta`, or
`src/composables/parse-page-meta.ts`. The inverse Nuxt-host transform
`mono-define-page-to-pagemeta` (Vue-remote-in-Nuxt-host) is out of scope.

## Why this fixes it

The page module contains neither `definePageMeta` nor `definePage` after our single `pre`
transform, so there is nothing left for vue-router to have to strip — the previous
leak/ordering failure mode cannot occur. Balanced scanning also removes the latent
nested-brace corruption bug.

## Verification

- `pnpm build` (tsdown) of `@mono-lit/utility`; `dist/vite.js` contains `mono-strip-pagemeta` /
  `stripDefinePageMeta`.
- Synced `dist/` into the host's git-dep copy under
  `node_modules/.pnpm/mono-utils@git+.../node_modules/@mono-lit/utility/dist/`.
- Host `vite build --mode development`: built OK; plugin timings show **`mono-strip-pagemeta`
  ran**. Grep of `dist-dev/` for `definePageMeta(` and `definePage(` → **none**; remote page
  chunks (`auth`, `error`, `home`, `index`) emitted normally.

## Propagation

`@mono-lit/utility` is consumed as a `catalog:internal` git dependency. Local edits require
`pnpm build` + syncing `dist/` into each host's installed copy (done here for `mono-vue`).
Canonical path: publish to `your-org/libs` + reinstall.
