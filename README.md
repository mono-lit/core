# mono-lit

Libraries for the mono ecosystem, published to npmjs.com and to a private npm registry on Netlify.

| Package | What it is |
|---|---|
| `@mono-lit/helper` | Lit web components (tables, forms, inputs, …) for Vue / Nuxt |
| `@mono-lit/utility` | Mono config, fetching, auth/token, and shared helpers |
| `@mono-lit/devextreme` | The DevExtreme data layer (`DataSource`, stores) from one place |

## Install in your project

There are two ways to install the packages. Pick one per project.

### Option A: npmjs (public)

No setup needed, the packages are public on [npmjs.com](https://www.npmjs.com/org/mono-lit):

```bash
pnpm add @mono-lit/helper @mono-lit/utility @mono-lit/devextreme
```

### Option B: Netlify registry

**1. Point the `@mono-lit` scope at the registry.** Add this to your project's `.npmrc`:

```ini
@mono-lit:registry=https://mono-libs.netlify.app/npm/
//mono-libs.netlify.app/npm/:_authToken=<REGISTRY_DOWNLOAD_TOKEN>
```

Ask a maintainer for the download token. Only `@mono-lit/*` packages come from this registry; everything else still installs from npmjs as usual.

**2. Install the packages you need:**

```bash
pnpm add @mono-lit/helper @mono-lit/utility @mono-lit/devextreme
```

Each package's own README covers its setup.

## Work on this repo

Run everything from the repo root. One install covers every package.

```bash
pnpm install       # install the whole workspace
pnpm build         # build all libraries (cached by Vite+)
pnpm dev           # build the libraries, then run the docs site
pnpm test          # run the tests
```

Run any script of one package from the root with `pnpm <helper|utility|devextreme|site> <script>`, e.g. `pnpm helper build` or `pnpm site dev`.

## Releasing

Publish with **pnpm**, never `npm publish` (pnpm rewrites `workspace:` ranges to real versions). Order matters: devextreme → utility → helper.

```bash
pnpm build
pnpm devextreme publish   # then: pnpm utility publish, pnpm helper publish
```

`publishConfig` targets npmjs (`access: public`). The Netlify registry is published separately with `REGISTRY_PUBLISH_TOKEN=… pnpm registry:publish` (versions listed in `version.json`).

## Maintainers

> [!IMPORTANT]
> **Maintainership is not open right now.** This project is fully managed by its owner together with an AI coding agent. Outside contributions and releases are not accepted at the moment. **Use these libraries at your own risk.**

---

> [!WARNING]
> **These libraries depend on DevExtreme**, a commercial product of DevExpress. Installing `@mono-lit/devextreme` from the registry downloads `devextreme` for you, but it does **not** give you a DevExtreme license. You need your own license and must register its key in your app. Without one, DevExtreme shows its own license warning.
>
> See **[packages/devextreme/README.md](packages/devextreme/README.md)** for how to get your key and set it up after installing via the registry.
