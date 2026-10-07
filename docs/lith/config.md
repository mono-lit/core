# Config: `path` and `url`

`apps[].path` names the directory an app is read from; `apps[].url` names the repository `mono sync` clones it from. An entry needs at least one, `path` wins whenever its directory exists, and — the rule that makes a lith a lith — **`path` is honoured in every command**: dev server, `vite build`, `mono prepare`, `mono sync`, `mono env`, the Nuxt module and `monoNuxtLayers`.

```ts
export interface MonoAppConfig {
  name: string
  /** Where `mono sync` clones from. Optional when `path` is set. */
  url?: string
  /** Read this app from a directory instead of a clone. Authoritative everywhere. */
  path?: string
  envToken?: string
  transport?: 'auto' | 'git' | 'token'
  type: 'vue' | 'nuxt'
}
```

## Three ways an entry can resolve

| Declared | Directory exists | Result |
|---|---|---|
| `path` + `url` | yes | read in place; `mono sync` prints 🔗 and clones nothing |
| `path` + `url` | **no** | one warning, then the `.mono/apps/<name>` clone (`mono sync` fetches it from `url`) |
| `path` only | yes | read in place |
| `path` only | **no** | **error** naming the app and the resolved directory — nothing to fall back to |
| `url` only | — | the clone, exactly as in Mono-Repo |
| neither | — | config error, reported by name before anything else runs |

The warning and the error both name the directory that was looked in:

```
[mono] esw-project: path '../esw-project' does not exist — using the synced clone instead.
[mono]   looked in C:\src\esw-ui\apps\esw-project
```

That fallback is what makes `path` safe to commit: the developer who has the sibling reads it, everyone else gets the clone.

## Writing the path

- **Relative to the declaring file** (`apps/esw-host/mono.config.ts` → `'../esw-project'`), absolute paths kept as-is.
- **A static string literal.** `mono.config.ts` is text-parsed before it can be executed (its `extends` chain imports other apps through aliases that do not exist yet), so `path: someVar` yields no alias rather than an error.
- **Forward slashes.** The literal is evaluated as JavaScript, so `'..\esw-project'` silently becomes `'..esw-project'` and reads as "path does not exist".

## Own name, siblings of siblings

Two things the resolver does that are easy to trip over:

**An app named like the running app is skipped.** In a lith the host lists the remote and the remote lists the host back. When esw-project runs, the `esw-host` entry resolves to `../esw-host`; when esw-host runs, esw-project's `esw-host` entry is *itself* and `@esw-host` keeps meaning its own `src/`.

**A sibling's own `path` entries are resolved too — one level, against that sibling's directory.** esw-host federates esw-project; esw-project's config names `esw-host` (skipped, that is us) and could name a third app `../esw-reports`. That third app gets an `@esw-reports` / `@esw-reports-root` alias in the host, so esw-project's `extends` chain can import `@esw-reports-root/mono.config` and load. One level only, never recursive, so the host ⇄ remote cycle cannot loop; a sibling's missing `path` is skipped silently — that sibling reports it when it runs.

::: warning What changes versus a clone
In Mono-Repo, a cloned host arrives *without* its `.mono/`, so its remotes' configs were **stubbed** to `{ apps: [], extends: [] }` and contributed nothing. In a lith the sibling is right there, so a remote that `extends` its host now inherits the host's *other* siblings' merged config (menu, env, mock seeds) instead of a stub. That is the correct lith behaviour; it is also a difference you will notice if you compare the two.
:::

## Stale clones

A `.mono/apps/<name>` left over from before an app got a `path` is **shadowed, never deleted**. `resolveAppRoots` skips a clone whose name has a `path` root; `mono sync` keeps the name in its prune list (so the prune never touches it) and tells you it is there:

```
🔗 esw-project: linked to ../esw-project — nothing to clone.
   ℹ️  a stale clone sits at .mono/apps/esw-project; it is shadowed by path and left alone — delete it if you want.
```

Nothing that reads a `path` ever writes to it or deletes it. `mono sync` prunes only inside `.mono/apps`, and `mono prepare` never touches a sibling's `tsconfig.json` (see [CLI & TypeScript](/lith/cli-typescript)).

## What was removed

`path` used to be **dev-only** — a build always read the clone. That split is gone, and the options that encoded it are accepted but ignored:

| Option | Was | Now |
|---|---|---|
| `monoRepo({ command })` | told the plugin whether to honour `path` | ignored; `path` is honoured in every command |
| `monoRepo({ link })`, `monoAlias({ link })`, `monoEcosystem({ link })`, `monoMissingApps({ link })`, `monoNuxtLayers({ link })` | `false` = read the clone | `@deprecated`, ignored |
| `MonoAppRoot.linked: boolean` | resolved from `path`? | `source: 'path' \| 'clone'` |

A `link: false` left in a `vite.config.ts` type-checks and does nothing. A `resolveAppRoots` call that read `.linked` needs `.source === 'path'`.
