# CLI & TypeScript

The `mono` commands treat a `path` app exactly like every other consumer: `mono sync` has nothing to clone for it, `mono env` loads its `.env.<mode>` like a clone's, and `mono prepare` writes its alias into `.mono/tsconfig.json` — pointing outside the project, which is the one thing TypeScript needs a word about.

## `mono sync`

Every app is looked at before any network call:

```
==> Check esw-reports (EJI-ICT/esw-reports@mono)   ← a url-only app: cloned as always

🔗 esw-master: linked to ../esw-master — nothing to clone.
🔗 esw-project: linked to ../esw-project — nothing to clone.

===== Summary =====
✅ Success (1):
   • esw-reports (EJI-ICT/esw-reports@mono @ 3c5d768) via git
❌ Failed (0):
🔗 Linked (2):
   • esw-master (../esw-master, read in place)
   • esw-project (../esw-project, read in place)
```

- A `path` whose directory is absent **and** has a `url` is synced from GitHub with a warning (`⚠️ esw-project: path '../esw-project' not found (looked in …) — syncing from GitHub instead.`). This is the lifted-out-of-the-lith case.
- A `path` whose directory is absent and has **no** `url` fails that app (exit code 1) — there is nothing to fall back to.
- An entry with neither `url` nor `path` is rejected while parsing `apps[]`.
- Pruning is unchanged: `.mono/apps/<dir>` not named in `apps[]` is removed; a `path` app's name still protects a stale clone of it, which is shadowed and reported, never deleted. Only `url` apps contribute commit-cache and access-cache keys.

## `mono env`

`mono env -e .env.dev -- vite` loads the root `.env.dev`, then every federated app's `.env.dev` — clones **and** `path` siblings, the same list every other command sees:

```
[mono-env] Loaded root env: .env.dev
[mono-env] Loaded app:esw-master env: ../esw-master/.env.dev
[mono-env] Loaded app:esw-project env: ../esw-project/.env.dev
[mono-env] Apps: esw-master, esw-project
```

`-a <name>` picks one app by name whether it is a clone or a sibling; `MONO_APP_DIR` is that app's real directory. (The resolver lives in the built `config-node.js`; run straight from the repo's `bin/`, the script falls back to listing `.mono/apps` as it always did.)

## `mono prepare`

`.mono/tsconfig.json` maps every alias to the directory Vite reads, so for a sibling it now points **outside** the project:

```json
{
  "compilerOptions": {
    "paths": {
      "@esw-host/*":         ["../src/*"],
      "@esw-host-root/*":    ["../*"],
      "@esw-project/*":      ["../../esw-project/src/*"],
      "@esw-project-root/*": ["../../esw-project/*"]
    }
  }
}
```

### `rootDir`

TypeScript refuses a path mapping that escapes `compilerOptions.rootDir` ("File … is not under 'rootDir'") for every importer of that alias. `mono prepare` will not edit the option — only the project knows whether `"."` was deliberate — it warns once and lists the keys:

```
[mono] tsconfig.json sets rootDir "." but @esw-project/*, @esw-project-root/* map outside
the project (apps[].path siblings). Remove rootDir, or set it to the folder that contains
every sibling (e.g. "../").
```

**Recommendation: drop `rootDir`.** A Vite / vue-tsc project has `noEmit: true`, so `rootDir` buys nothing. If a project insists on one, `"../"` (the `apps/` folder) is the value that contains every sibling. `runMonoPrepare()` returns the keys as `outsideProject` for tooling.

### Each sibling runs its own prepare

`mono prepare` wires the generated tsconfig into **clones** only (`.mono/apps/<name>/tsconfig.json` gains `extends: ["../../tsconfig.json"]`). It never writes into a `path` sibling's `tsconfig.json`: that is someone's real repository, the edit would dirty their tree with a path only valid on this machine, and the host's `paths` would then resolve inside a project with its own `rootDir`.

Instead each sibling carries its own `mono.config.ts` and runs its own `mono prepare` — its `postinstall` already does — which writes the same map from its point of view (`@esw-host/*` → `../../esw-host/src/*` in `apps/esw-project/.mono/tsconfig.json`). A root `pnpm install` runs every workspace package's `postinstall`, so the whole lith is prepared in one go.

If a sibling has **not** run it yet, its `tsconfig.json` still extends a `./.mono/tsconfig.json` that is missing — Vite's esbuild plugin then fails that sibling's SFCs with "Tsconfig not found". `mono prepare` in the host detects that and says so:

```
[mono] esw-project: tsconfig.json extends ./.mono/tsconfig.json but the file is missing — run `mono prepare` in that app.
```

### `defineProps<ImportedType>()` across siblings

`@vue/compiler-sfc` resolves the type-only imports in `defineProps<T>()` through the **nearest** `tsconfig.json`'s `paths` — for `apps/esw-project/src/x.vue` that is esw-project's own tsconfig, never the host's, and Vite's `resolve.alias` is invisible to it. So a sibling's SFC importing `@esw-host/types/…` works when:

1. the sibling declares `esw-host` in **its own** `apps[]` (it does — remotes list the host back), and
2. the sibling has run `mono prepare` (see above).

### `tsconfig.build.json`

A build tsconfig that redefines `paths` (to add `@/*`, say) replaces the whole inherited map, so its mono entries have to name the siblings too:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@esw-project/*": ["../esw-project/src/*"],
      "@esw-project-root/*": ["../esw-project/*"]
    }
  }
}
```
