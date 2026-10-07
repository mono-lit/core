# Environment

Each app keeps its own environment variables. **mono-env** is a small wrapper
(shipped with **@mono-lit/utility**) that loads a *root* env file first, then layers each
app's env file from `.mono/apps/` on top, and finally runs your real command (`vite`,
`vue-tsc`, …) with the merged environment.

You don't call it directly — it's already wired into every script in the
[templates](../ai/template), so day to day you just run `pnpm dev` / `pnpm build`.

```
mono env -e .env.dev -- vite
```

That single line means: *load `.env.dev` (root, then every app), then run `vite`*.

## Where env values live

There are two homes for "environment" values, and in a federation picking the
right one matters — because the **host consumes its remotes' config**, so what you
*expose* versus *hide* is a real decision:

- **`.env` files** — normally *not* pushed. For secrets and per-machine values.
- **A committed `mono.env.ts` module** — an `env` object shared across the app.
  For non-secret values (like an API base URL) the host and its remotes all consume.

A base URL doesn't need hiding, so declare it in
[`mono.env.ts`](#config-env-object-non-secret-values) and read it with
`monoEnv()` / `resolveEnv()` instead of pushing a `.env` a dev might forget.

## File layout

The `.mono/apps/` folder is produced by [Sync](./sync). Each app brings its own env
file, alongside the root env files:

```
mono-vue-remote/
├── .mono/
│   └── apps/
│       └── mono-host/
│           └── .env.dev      # app env (overrides root)
├── .env.dev                  # root env (loaded first)
├── .env
└── package.json
```

## How it loads

mono-env loads env files in order, and **later files override earlier ones**:

1. **Root** — the file you pass with `-e`, resolved from the app you're running
   (e.g. `.env.dev`).
2. **Per app** — for every folder inside `.mono/apps/`, the file with the **same name**
   inside it (e.g. `.mono/apps/mono-host/.env.dev`).

::: tip Matched by file name
Per-app files are matched by the **basename** of your `-e` value. `-e .env.dev`
loads `.mono/apps/<app>/.env.dev`; `-e .env` loads `.mono/apps/<app>/.env`. Missing files
are skipped with a warning — they don't stop the command.
:::

## Naming convention

mono-env loads **every** key into the environment of the command it runs — but
not every key reaches your client code. Vite only exposes variables matching the
prefixes set in `vite.config.ts`:

```ts
// vite.config.ts
envPrefix: ['VITE_', 'MONO_'],
```

That gives two prefixes with different roles, plus everything else:

| Prefix | Read with | Use for |
| --- | --- | --- |
| `MONO_` | `import.meta.env.MONO_*` | **The only shared vars.** Cross-app / mono-repo config exposed to the client bundle. |
| `VITE_` | `import.meta.env.VITE_*` | App-local client config (standard Vite). |
| *(no prefix)* | not exposed | Build/tooling-only secrets (tokens, generators). Stays in `process.env` for the running command, never shipped to the browser. |

::: tip Standard: shared = `MONO_`
Treat `MONO_` as the contract between apps. Anything an app needs to read from
another app — or anything the Host shares with Remotes — gets a `MONO_` prefix so
it's exposed via `import.meta.env`. Keep app-private values on `VITE_`, and keep
secrets prefix-less so they never end up in the client bundle.
:::

```ts
// Shared, exposed to the client because of the MONO_ prefix
const port = import.meta.env.MONO_NUXT_HOST_PORT
```

## Config env object (non-secret values)

Declare non-secret, per-environment values in a small **`mono.env.ts`** at the app
root, keyed by `NODE_ENV`. This is the official home for shared, committed config.
Unlike a `.env` file it's checked in — nothing for each dev to remember to push,
and none of the flat-namespace collisions you hit when many apps' `.env` files
merge:

```ts
// mono.env.ts
import { resolveEnv } from '@mono-lit/utility/config'

export const env = {
  default:     { API_BASE: 'https://api.dev.example.com' }, // shared fallback
  development: { API_BASE: 'https://api.dev.example.com' },
  production:  { API_BASE: 'https://api.example.com' },
}

// Flattened active-environment values (`env.default` + the active NODE_ENV block).
export const appEnv = resolveEnv({ env })
```

::: tip Why a separate file, not inline in `mono.config.ts`?
Because more than the browser config reads these values — the OData codegen
(`odata2ts.config.ts`) runs in a **bare Node context** and must import them too,
and it **can't** import `mono.config.ts`. That file pulls in the `@mono-host`
alias (unresolved in Node), `@mono-lit/devextreme` (a browser package), and the
generated `DefaultService` DTO — which is `odata2ts`'s *own* output, a bootstrap
cycle. `mono.env.ts` imports **only** `@mono-lit/utility/config`, so every consumer —
browser and Node — can safely read one source of truth.
:::

Wire it into `mono.config.ts`: pass `env` through (so it merges + is exposed) and
build `fetching` URLs from `appEnv` — resolved **at load time**, so no
`import.meta.env` and nothing to push in a `.env`:

```ts
// mono.config.ts
import { defineConfig } from '@mono-lit/utility/config'
import { env, appEnv } from './mono.env'

export default defineConfig({
  name: 'mono-host',
  type: 'nuxt',
  // ...
  env,
  fetching: {
    api: { main: { type: 'odata', url: String(appEnv.API_BASE) } },
  },
})
```

Any other consumer imports `appEnv` the same way — including the Node codegen,
which is exactly why the file stays alias-free:

```ts
// odata2ts.config.ts
import { appEnv } from './mono.env'
const sourceUrl = String(appEnv.API_BASE)
```

It **merges across the whole host+remote `extends` chain** like the rest of the
config — each remote can contribute values and the current app wins on conflicts.
Because it merges *structurally* (not in one flat namespace like `.env`), it
scales cleanly as you add apps.

Read the active environment's values **at runtime** — in a component, store, or
composable — with **`monoEnv()`**:

```ts
import { monoEnv } from '@mono-lit/utility/runtime'

monoEnv()            // → the whole flattened object for the active NODE_ENV
monoEnv('API_BASE')  // → a single value
```

`monoEnv` merges `env.default` first, then the block matching the active
`NODE_ENV` on top (the active block wins, key by key).

::: warning `appEnv`/`resolveEnv` at load time, `monoEnv()` at runtime
`fetching.api[].url` is captured when `mono.config.ts` is imported — *before* mono
initializes its state — so a bare `url: monoEnv('API_BASE')` there resolves to
empty and the fetcher throws *"url is missing"*. Use `appEnv` (i.e.
`resolveEnv({ env })`, computed in `mono.env.ts`) at load time; keep `monoEnv()`
for reading **at runtime**, where state is live. Note `appEnv` at load time
captures the app's own `env` — values a remote contributes via `extends` merge
later, at runtime.
:::

::: tip `.env` must set `NODE_ENV`
Selection is keyed on `NODE_ENV`. Follow the convention that each env file sets
it — `.env.dev` → `NODE_ENV=development`, `.env` → `NODE_ENV=production`. `mono
env` loads that file into `process.env` before Vite starts, so the right block is
picked at build **and** in the browser (Vite statically replaces `NODE_ENV`). If
`NODE_ENV` is ever absent, `monoEnv` falls back to Vite's `import.meta.env.MODE`.
:::

::: warning Scalars only, non-secret only
Keep `env` values to scalars (string / number / boolean) — an array would
concatenate across `extends` layers instead of overriding. And it's exposed to
the browser bundle, so **never put secrets here** — those stay in prefix-less
`.env` keys (see above).
:::

## package.json scripts

The templates already route every command through mono-env. The relevant lines
from `mono-vue` / `mono-host`:

```json
{
  "scripts": {
    "postinstall": "mono sync && mono prepare",
    "mono:prepare": "mono prepare",
    "dev": "mono prepare && mono env -e .env.dev -- vite",
    "dev:h": "mono prepare && mono env -e .env.dev -- vite --host",
    "build": "mono env -e .env -- vue-tsc && mono env -e .env -- vite build --emptyOutDir",
    "preview": "mono env -e .env -- vite preview"
  }
}
```

Everything after `--` is the command to run. Dev scripts use `.env.dev`; build
and preview use `.env`. The leading `mono prepare` on the dev scripts regenerates
`.mono/tsconfig.json` first — it's idempotent and fast, so it's safe to run every
time (see [Prepare](./sync#run-sync)).

## Flags

| Flag | Alias | Description |
| --- | --- | --- |
| `-e <file>` | `--env` | Env file to load. Repeatable — pass `-e` multiple times to load several. |
| `-a <name>` | `--app` | Load only `.mono/apps/<name>` instead of every app folder. |
| `-r <dir>` | `--app-root` | Folder to scan for apps. Defaults to `.mono/apps`. |
| `--` | | Everything after this is the command to run. |

Example — load env for a single app only:

```
mono env -e .env.dev -a mono-host -- vite
```

## Injected variables

mono-env also exposes which app(s) it loaded, so your command can read them:

| Variable | When | Value |
| --- | --- | --- |
| `MONO_APP_NAME` | one app loaded | the app folder name (e.g. `mono-host`) |
| `MONO_APP_DIR` | one app loaded | absolute path to that app folder |
| `MONO_APP_NAMES` | multiple apps loaded | comma-joined list of app names |

## Multiple apps

When no `-a` is given and `.mono/apps/` has more than one folder, mono-env loads them
all. Because each app's env layers on top of the previous one, keys with the same
name collide — the last app wins.

::: warning Use unique keys per app
If two apps both define `MONO_API_URL`, whichever loads last overrides the other.
Since shared vars use the `MONO_` prefix, keep them unique per app — e.g.
`MONO_NUXT_HOST_API_URL`, `MONO_NUXT_REMOTE_API_URL` — or scope each run to one app with `-a`.
:::

See [Sync](./sync) for how the `.mono/apps/` folder gets populated.
