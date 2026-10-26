# Mini Remotes

A **mini remote** is a Remote reduced to its source. It has no `package.json`, no `nuxt.config` / `vite.config`, no `.env*`, no `mono.env.ts`, no `public/` and no `odata2ts` config. It **cannot install or run on its own**: the Host that federates it supplies the dependencies, the build, the env and the shell.

It suits teams where every developer works on **Host + Remote together**. Only the Host carries versions and config, so a module can't drift from it. The templates ship two: [`nuxt-remote-mini`](https://github.com/mono-lit/templates/tree/main/nuxt-remote-mini) and [`vue-remote-mini`](https://github.com/mono-lit/templates/tree/main/vue-remote-mini).

## What a mini contains

```
nuxt-remote-mini/            vue-remote-mini/
├── .gitignore               ├── .gitignore        # node_modules, .mono, tsconfig.json
├── mono.config.ts           ├── mono.config.ts    # name, type, template: 'remote', menu
└── app/                     └── src/
    ├── pages/                   ├── pages/
    ├── composables/             ├── composables/
    └── types/                   └── types/
```

```ts
// mono.config.ts
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
    name: 'vue-remote-mini',
    type: 'vue',
    template: 'remote',
    // The Host this mini belongs to, by its GitHub url — the same entry a full Remote declares.
    apps: [
        { name: 'vue-host', url: 'https://github.com/mono-lit/templates/tree/main/vue-host', type: 'vue', template: 'host' },
    ],
    menu: [{ title: 'Module Vue Mini', url: '/module-vue-mini', icon: 'i-mdi-vuejs', items: [] }],
})
```

The mini names its Host in `apps[]`, but has no `extends` back to it. The Host is the controller, and it already merges the mini through **its own** `extends`. So the Host's cookies, JWT and `fetching.api` entries are the ones in effect.

## How the Host knows it's a mini

**An app root with no `package.json` is a hosted (mini) app** (`isHostedApp()` in `@mono-lit/utility/config/node`). The wiring is declared on both sides, never assumed: the Host lists the mini in its `apps[]`, and the mini names the Host in its own `apps[]`, by the Host's name (its `url` entry). A `path` that lands on the Host also counts; a mono-lith adds one beside the `url`. A mini that names no Host is not prepared. `mono prepare` warns and spells out the entry to add:

```
[mono] vue-remote-mini: not prepared — its mono.config.ts does not name this host. Add { name: 'vue-host', url: '<the host repo>', type: 'vue' } to its apps[].
```

The Host's `apps[]` entry for the mini looks the same as for any Remote:

```ts
// host mono.config.ts
import miniConfig from '@vue-remote-mini-root/mono.config'

export default defineConfig({
    extends: [(): MonoConfig => miniConfig],
    template: 'host',
    apps: [
        {
            name: 'vue-remote-mini',
            path: '../vue-remote-mini', // optional: read a sibling checkout in place
            url: 'https://github.com/mono-lit/templates/tree/main/vue-remote-mini',
            type: 'vue',
        },
    ],
})
```

| Source | What happens |
|---|---|
| `url` only | `mono sync` clones it into `<host>/.mono/apps/<name>`. Bare imports resolve up to the Host's `node_modules`, so nothing extra is needed. |
| `path` (sibling) | The folder sits **outside** the Host, with no `node_modules` above it. `mono prepare` in the Host adopts it (see below). |

## What the Host's `mono prepare` does for a `path` mini

The mini can't run `mono prepare` itself, so the Host's prepare does it. It runs on the Host's `dev` and `postinstall`. For each hosted `path` app it does three things:

1. Links `<mini>/node_modules` to `<host>/node_modules`. On Windows this is a junction, which needs no admin rights. Every bare import in the mini (`vue`, `@mono-lit/utility/*`, …) then resolves in Vite, in jiti (which loads the mini's `mono.config.ts`) and in vue-tsc. The realpaths are the Host's own, so there is **one** copy of Vue. A real directory already in that spot is never replaced; prepare warns instead.
2. Writes `<mini>/.mono/tsconfig.json`, extending the Host's config: `.nuxt/tsconfig.app.json` for a Nuxt Host, `tsconfig.json` for a Vite Host. It includes the mini's source, `mono.config.ts` and the Host's generated types (`nuxt.d.ts`, or `auto-imports.d.ts` / `components.d.ts` / `typed-router.d.ts`).
3. Writes `<mini>/tsconfig.json` as `{ "extends": "./.mono/tsconfig.json" }`, only when the mini has none. This lets the editor type-check the mini against the Host.

All three are gitignored by the mini, and nothing the mini commits is edited. The CLI reports each one:

```
[mono] hosted app vue-remote-mini: node_modules created, wrote ..\vue-remote-mini\.mono\tsconfig.json
```

::: warning Don't commit the mini's tsconfig
Leave `tsconfig.json` out of the mini's git. If it extends a `.mono/tsconfig.json` that hasn't been generated yet (a fresh checkout, a clone, a test importing its config), Vite/oxc **fails every transform** of the mini's files with `Tsconfig not found`.
:::

`mono env` doesn't warn about a hosted app's missing `.env*` files, because the Host owns env.

## Host requirements

- **A menu loader that sees `path` apps.** Use `virtual:mono-apps`, not an `import.meta.glob` over `.mono/apps`. It is served by `monoRepo().vite()` and by `@mono-lit/utility/nuxt`. Reference its types with `/// <reference types="@mono-lit/utility/virtual-mono-apps" />`.
- **UnoCSS content globs that include every federated root.** `resolveFederatedRoots({ dirname })` from `@mono-lit/utility/config/node` lists the clones **and** the `path` siblings.
- **No `compilerOptions.rootDir`** in a Vite Host that reads a `path` mini: TypeScript rejects the sibling with TS6059. vue-router's typed routes take the root through the Volar plugin option instead:

```json
"vueCompilerOptions": {
  "plugins": [
    { "name": "vue-router/volar/sfc-typed-router", "options": { "rootDir": "." } },
    "vue-router/volar/sfc-route-blocks"
  ]
}
```

## Limits

- The mini can only import packages the **Host** depends on. Add new dependencies to the Host's `package.json`.
- It ships no `app.vue` / `App.vue`, router, plugins or layouts; it renders inside the Host's.
- Composables are auto-imported into the Host's single registry, so give them names the Host (and other Remotes) don't use.
- In a Nuxt Host, federated pages are registered when the dev server starts, so a **new** page file in a mini may need a restart before its route appears.
