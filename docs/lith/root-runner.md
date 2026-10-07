# Root runner (Vite+)

The lith's root folder runs the apps; it is not an app itself. One `pnpm install` gives every sibling the same `node_modules`, and [Vite+](https://viteplus.dev) (`vp`) dispatches `dev`, `build` and `test` to the app you mean — the host by default.

## Why one install

A host compiles its siblings' files. If `apps/esw-host` and `apps/esw-project` each had their own `node_modules`, a sibling page importing `vue` or `@mono-lit/helper` would resolve from *its* folder and the host would get a second copy of every runtime — two Vue instances, `mono-*` custom elements "already defined", Pinia stores that do not share state. In a single pnpm workspace every `apps/*/node_modules/vue` is a link into the same store entry, so Vite sees one module.

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*

catalogs:
  internal:
    "@mono-lit/devextreme": 0.0.1
    "@mono-lit/utility": 0.0.1
    "@mono-lit/helper": 0.0.1
  build: { vite: 8.0.16, … }
  frontend: { vue: 3.5.24, pinia: 3.0.4, … }
```

```ini
# .npmrc — only the @mono-lit scope comes from the mono-libs registry;
# every other package installs from npmjs as usual.
@mono-lit:registry=https://mono-libs.netlify.app/npm/
//mono-libs.netlify.app/npm/:_authToken=<download token>
```

```json
// package.json
{
  "packageManager": "pnpm@10.7.0",
  "pnpm": {
    "overrides": { "vue": "3.5.33", "pinia": "3.0.4", "devextreme": "25.1.6" }
  }
}
```

Three things worth knowing:

- **Each app keeps its own `pnpm-workspace.yaml`** (the same catalogs). pnpm ignores the nested file while installing from the root, and it is what lets a folder be lifted out and installed on its own.
- **Catalogs need pnpm ≥ 9.5.** `packageManager` must not name an older pnpm — pnpm 10 would silently switch to it and the `catalog:` specs would fail.
- **Only `apps/*` is in the workspace.** Never add a checkout of the libs themselves (or any package that ships its own `vite.config.ts`) — `vp run` loads every workspace package's Vite config to build its task graph.

## The libs

`@mono-lit/utility`, `@mono-lit/helper` and `@mono-lit/devextreme` are **versioned releases** on the mono-libs registry (`.npmrc` above; the versions live in `catalogs.internal`). A lith app therefore installs exactly like a Mono-Repo app — no local `libs` checkout is involved.

Shipping a lib change is a release: in the `libs` repo bump the package's `package.json` and append the version to `version.json`, run `REGISTRY_PUBLISH_TOKEN=… pnpm registry:publish` (versions are immutable; devextreme → utility → helper), then raise the version in the catalog here and `pnpm install`. `apps[].path` works with every `@mono-lit/utility` release.

::: tip Iterating on a lib without publishing
Point the root overrides at a local checkout for the duration — `"@mono-lit/utility": "link:../../libs/packages/utility"` — and remove the override before committing. A rebuild in `libs` is then live in every sibling.
:::

## Scripts

```json
{
  "scripts": {
    "dev":          "vp run --filter esw-host dev",
    "dev:master":   "vp run --filter esw-master dev",
    "dev:project":  "vp run --filter esw-project dev",
    "build":        "vp run --filter esw-host build",
    "build:dev":    "vp run --filter esw-host build:dev",
    "build:all":    "vp run -r build",
    "test":         "vp test",
    "mono:prepare": "vp run -r mono:prepare"
  }
}
```

`vp run --filter <name> <script>` runs that package's own `package.json` script (pnpm filter syntax: by name, `"./apps/esw-*"` by directory, `"esw-host..."` with dependents), so each app's `dev` is still `mono prepare && mono env -e .env.dev -- vite` with the app's own Vite — Vite+'s bundled core never enters the picture. `-r` runs a script in every workspace package in dependency order; `vp -C apps/esw-project dev` runs any command as if you had `cd`'d there.

```ts
// vite.config.ts (root, vite-plus)
import { defineConfig } from 'vite-plus'

export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
  test: { projects: ['apps/*'] },   // vp test runs every app's tests with its own vite.config
})
```

## Day to day

```bash
pnpm dev                 # host on :7100 — edit apps/esw-project, the host hot-updates
pnpm dev:project         # esw-project on :1010, wearing the host's shell from ../esw-host
pnpm build               # host bundle, remotes compiled in from the siblings
pnpm test                # every apps/* vitest project
pnpm mono:prepare        # regenerate every app's .mono/tsconfig.json (postinstall does this too)
```

Develop and build through the host — that is the artefact that ships, and it is where a broken cross-app import shows up first. Run a remote alone to work on it in isolation; it reads the real host next door, so its shell is never stale.
