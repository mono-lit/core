---
description: "READ THIS FIRST. The packages were renamed: mono-helper → @mono-lit/helper, mono-utils → @mono-lit/utility (not utils), mono-devextreme → @mono-lit/devextreme, all public on npmjs. Every other page uses the new names; if the code you are working on still imports mono-*, migrate it with this guide before following any other page."
---

# Migration: `mono-*` → `@mono-lit/*`

The libraries now live under the company scope **`@mono-lit`** and are published as public
packages on [npmjs.com](https://www.npmjs.com/org/mono-lit). The old unscoped names
(`mono-helper`, `mono-utils`, `mono-devextreme`) are no longer published, so an app that
still installs them has to switch.

Only the **package names** change. Every subpath, export, component tag and config option
stays the same, so the migration is a rename plus a reinstall.

| Old name | New name |
| --- | --- |
| `mono-helper` | [`@mono-lit/helper`](https://www.npmjs.com/package/@mono-lit/helper) |
| `mono-utils` | [`@mono-lit/utility`](https://www.npmjs.com/package/@mono-lit/utility) |
| `mono-devextreme` | [`@mono-lit/devextreme`](https://www.npmjs.com/package/@mono-lit/devextreme) |

::: warning `mono-utils` becomes `utility`, not `utils`
It is the only package whose short name changes too: `mono-utils/fetching` becomes
`@mono-lit/utility/fetching`. A plain "add the scope" replacement produces
`@mono-lit/utils`, which does not exist.
:::

## 1. Remove the old registry from `.npmrc`

The packages are public on npmjs, the default registry, so no token or registry setting is
needed. Delete the old Netlify lines from your project's `.npmrc`, and delete the file if
nothing is left in it:

```diff
# .npmrc
- registry=https://mono-libs.netlify.app/npm/
- //mono-libs.netlify.app/npm/:_authToken=<REGISTRY_DOWNLOAD_TOKEN>
```

::: tip Check it resolves
`npm view @mono-lit/helper version` should print a version. If it errors, an `.npmrc`
(in the project, or in your user folder) still points `@mono-lit` somewhere else.
:::

## 2. Swap the dependencies

Remove the old packages and add the new ones. Only add the packages your app used before.

```sh
pnpm remove mono-helper mono-utils mono-devextreme
pnpm add @mono-lit/helper @mono-lit/utility @mono-lit/devextreme
```

If your workspace pins versions in a pnpm **catalog**, rename the keys there too:

```diff
# pnpm-workspace.yaml
 catalog:
-  mono-helper: 0.0.2
-  mono-utils: 0.0.3
-  mono-devextreme: 0.0.1
+  '@mono-lit/helper': ^0.0.1
+  '@mono-lit/utility': ^0.0.1
+  '@mono-lit/devextreme': ^0.0.1
```

```diff
# package.json
   "dependencies": {
-    "mono-helper": "catalog:",
-    "mono-utils": "catalog:",
+    "@mono-lit/helper": "catalog:",
+    "@mono-lit/utility": "catalog:",
   }
```

## 3. Rename every import

Subpaths are unchanged, so each specifier only needs its prefix swapped:

```diff
- import 'mono-helper/index.css'
- import 'mono-helper/ui/button'
- import { monoDataGrid } from 'mono-helper/ui/table'
- import { monoFetch } from 'mono-utils/fetching'
- import { DataSource } from 'mono-devextreme'
+ import '@mono-lit/helper/index.css'
+ import '@mono-lit/helper/ui/button'
+ import { monoDataGrid } from '@mono-lit/helper/ui/table'
+ import { monoFetch } from '@mono-lit/utility/fetching'
+ import { DataSource } from '@mono-lit/devextreme'
```

The names appear in more places than `import` lines. Check each of these:

- `.vue`, `.ts`, `.js` and `.css` imports, including `@import 'mono-helper/...'` in CSS
- `nuxt.config.ts` → `modules: ['@mono-lit/utility/nuxt', '@mono-lit/helper/nuxt']`
- `vite.config.ts` → `import { monoRepo } from '@mono-lit/utility/vite'`
- `optimizeDeps.include` / `exclude`, `ssr.noExternal`, `build.rollupOptions.external`
- `mono.config.ts` → `import { defineConfig } from '@mono-lit/utility/config'`
- type-only imports such as `import type {} from '@mono-lit/helper/vue'`
- `tsconfig.json` `types` / `paths` entries and `/// <reference types="..." />` lines

## 4. Reinstall and check

```sh
pnpm install
```

Then search for anything left over. Both commands should print nothing:

```sh
git grep -nE "['\"\`]mono-(helper|utils|devextreme)['\"\`/]"
git grep -n "@mono-lit/utils"
```

Restart the dev server (stop it and run it again) so Vite rebuilds its dependency cache
under the new names. If the browser shows an error like
`'mono-button' has already been defined`, a stale cache is still loading the old copy:
delete `node_modules/.vite` (and `.nuxt` in a Nuxt app) and start again.

## What stays the same

None of these are package names, so **do not rename them**:

| Kept as is | Example |
| --- | --- |
| Component tags | `<mono-button>`, `<mono-table-paging>`, `<mono-shadow-select>` |
| The CLI command | `mono sync`, `pnpm mono:sync` |
| The config file | `mono.config.ts` and its options |
| The Nuxt config key | `mono: { utils: {...}, helper: {...} }` in `nuxt.config.ts` |
| Storage keys and CSS classes | `mono-helper-theme`, `.theme-nova`, `--mono-*` variables |
| Subpaths and exports | `/ui/table`, `/fetching`, `monoDataGrid`, `monoRepo` |

### Renamed internals

These only matter if your code matched them by string, which is rare:

| Old | New |
| --- | --- |
| Vite plugin names `mono-helper:*` | `@mono-lit/helper:*` (e.g. `@mono-lit/helper:mono-ssr-stub`) |
| Log prefixes `[mono-utils/...]` | `[@mono-lit/utility/...]` |
| Nuxt module name `mono-helper` | `@mono-lit/helper` |
