# mono-lit

Internal libraries for the mono ecosystem, published to a private npm registry on Netlify.

> [!NOTE]
> **Publishing to npm is a work in progress.** For now the packages are available **only** from the private Netlify registry below, not from npmjs.com.

| Package | What it is |
|---|---|
| `@mono-lit/helper` | Lit web components (tables, forms, inputs, …) for Vue / Nuxt |
| `@mono-lit/utility` | Mono config, fetching, auth/token, and shared helpers |
| `@mono-lit/devextreme` | The DevExtreme data layer (`DataSource`, stores) from one place |

## Install in your project

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

## Publish a release (maintainers)

> [!IMPORTANT]
> **Maintainership is not open right now.** This project is fully managed by its owner together with an AI coding agent. Outside contributions and releases are not accepted at the moment. **Use these libraries at your own risk.**

Releases are published automatically when the `deploy` branch is deployed to production on Netlify.

1. Bump the package's `version` in its `package.json`.
2. Add that version to `version.json` (the list of versions the registry should hold):
   ```json
   { "@mono-lit/helper": ["0.0.1", "0.0.2"] }
   ```
   - Remove a version from the list → the next deploy deletes it from the registry.
   - Prefix a version with `!` (e.g. `"!0.0.2"`) → the next deploy deletes and re-publishes it with the current code.
3. Merge into `deploy` and push:
   ```bash
   git switch deploy && git merge main && git push && git switch main
   ```

Check locally before pushing with `pnpm registry:check` (versions) and `pnpm registry:verify` (full local registry test). The Netlify site needs the `REGISTRY_PUBLISH_TOKEN` and `REGISTRY_DOWNLOAD_TOKEN` environment variables.

---

> [!WARNING]
> **These libraries depend on DevExtreme**, a commercial product of DevExpress. Installing `@mono-lit/devextreme` from the registry downloads `devextreme` for you, but it does **not** give you a DevExtreme license. You need your own license and must register its key in your app. Without one, DevExtreme shows its own license warning.
>
> See **[packages/devextreme/README.md](packages/devextreme/README.md)** for how to get your key and set it up after installing via the registry.
