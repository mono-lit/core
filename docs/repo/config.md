# Config

The mono-repo also comes with a config file that handles cookies, JWT state, and deployment.

> Apps living side by side in one repository? `apps[].path` reads a sibling folder in place — see [Mono-Lith → Config](/lith/config).

The config lives in a single file:

```
mono-vue-remote/
├── mono.config.ts
└── ...etc/
```


## Setup
Start by creating a file named `mono.config.ts` with a default config like this:
```ts
import { defineConfig } from "@mono-lit/utility/runtime";

export default defineConfig({
    name: 'mono-remote',
});
```

Then register it when your app starts. How you do that depends on the app kind — a **Vue**
app calls `createMono` in `src/main.ts`, a **Nuxt** app uses the mono modules plus a plugin.
See [Setup](./setup) for the per-kind wiring.

The rest of this page covers what you can put **inside** `mono.config.ts`.



## App type — Vue or Nuxt

`type` tells the ecosystem whether an app is **Vue** or **Nuxt**, which sets where its
source lives (`src/` or `app/`) and how the two apps reach each other's folders. The
[Setup](./setup) page explains how that drives the build; here's how you declare it in
`mono.config.ts`.

It appears in two places:

- **`type` at the config root** declares **this** app's kind.
- **`apps[].type`** declares **each synced** app's kind, so this app resolves the *other*
  app's folders to `.mono/apps/<name>/src` or `.mono/apps/<name>/app` correctly.

::: warning Declare `type` above `apps`
The alias builder (`monoAlias`, used internally by `monoRepo()` and the `@mono-lit/utility/nuxt`
module) parses the config **text** statically, before the file is executed — so `type`
must appear **above** the `apps` array. Otherwise the parser hasn't seen it yet and falls
back to `src/`.
:::

::: warning The examples below show the hybrid pairing
A Nuxt Host joined with a Vue Remote still works — mono's compat layer holds it together —
but it is **possible-but-risky** and outside the standard. The **standard is a
same-framework pair**: Vue Host ↔ Vue Remote, Nuxt Host ↔ Nuxt Remote. The hybrid appears
here only because it is the clearest way to show both `type` values in one file. See
[Setup](./setup).
:::

A Nuxt host with a Vue remote synced into it:

```ts
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
    name: 'mono-host',
    // This host is a Nuxt app -> source under `app/`. Declared above `apps`.
    type: 'nuxt',
    apps: [
        {
            name: 'mono-vue',
            url: 'https://github.com/mono-lit/templates/tree/main/vue-remote',
            envToken: 'MONO_NUXT_HOST_GITHUB_TOKEN',
            // mono-vue is a Vue app -> its synced source lives under `src/`.
            type: 'vue',
        },
    ],
});
```

And the mirror — a Vue remote whose host is Nuxt. Here `apps[0].type` is `nuxt`, so
`@mono-host` resolves into the synced host's `app/` folder:

```ts
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
    name: 'mono-vue',
    type: 'vue',
    apps: [
        {
            name: 'mono-host',
            url: 'https://github.com/mono-lit/templates/tree/main/nuxt-host',
            envToken: 'MONO_VUE_GITHUB_TOKEN',
            // mono-host is a Nuxt app -> `@mono-host` resolves to `app/…`, not `src/…`.
            type: 'nuxt',
        },
    ],
});
```

See [Sync](./sync) for how `apps` is pulled into `.mono/apps/`.

## App role — Host or Remote

`template` says which side of the federation this app is:

```ts
export default defineConfig({
  name: 'mono-host',
  type: 'vue',
  template: 'host',   // this app OWNS the shared shell
  // …
})
```

It is **orthogonal to `type`**. `type` says where the source lives (`src/` or `app/`);
`template` says whether this app owns the shared shell or consumes it.

| `template` | Layouts `mono.layouts.options()` returns |
| --- | --- |
| `'host'` | This app's own `layouts/` only. A federated app's `default.vue` must not compete with the shell's. |
| `'remote'` | This app's own (if any) **plus** every federated app's — how a Remote gets the Host's shell. |
| *omitted* | Same as `'remote'`. This is the pre-`template` behaviour, so adding the field breaks nothing. |

That is the only thing it changes today. Everything else that used to differ between a Host
and a Remote is derived — the Nuxt-compat transforms from `apps[].type`, the source dir from
`type`, and the federated root-`index.vue` exclusion from whether this app ships its own
`pages/index.vue`. Layouts are the one case nothing on disk can settle: an app with no
`layouts/` folder looks identical in either role.

::: warning `template` is never inherited through `extends`
A Remote normally extends its Host. If `template` were inherited, a Remote that omits it
would silently become a `'host'` — dropping the very layouts it extends the Host to get, with
no error to notice. So, like `name` and `type`, it is read from **this file only** and is
excluded from the `merges` allowlist described below.
:::

To override for one call, use the plugin’s own option — it replaces the whole list:

```ts
Layouts(mono.layouts.options({ layoutsDirs: ['src/layouts', ...mono.ecosystem('layouts')] }))
```

## Skills repository

`skill` (optional) names the git repository where `mono skills` reads this app's knowledge
and saves AI session history — see [Skills (for AI)](../ai/skills). Its **presence is the
switch**: leave it out and the whole workflow is a no-op.

```ts
export default defineConfig({
  name: 'gallery-apps',
  type: 'vue',
  skill: {
    url: 'https://github.com/my-org/app-knowledge.git',   // any git host; or a GitHub
    //   deep URL to write into a folder on a branch:
    //   'https://github.com/my-org/monorepo/tree/mono/knowledge'
    envToken: 'APP_KNOWLEDGE_TOKEN',   // optional: env var NAME, same idea as apps[].envToken
  },
  apps: [/* … */],
})
```

| Key | Meaning |
| --- | --- |
| `url` | Plain clone URL (`https://…/repo.git`, `git@host:org/repo.git`) → default branch, repo root. GitHub `…/tree/<ref>/<dir>` → branch `<ref>`, everything under `<dir>`. |
| `envToken` | The **name** of an env var holding a PAT. Only read when this machine's own git credentials can't reach the repo (not invited / no credential). HTTPS URLs only. |

Both must be **static string literals** — the CLI text-parses this file, like `apps[]`.

::: warning `skill` is never inherited through `extends`
Like `template`, it describes **this** app: which repository its session history belongs
to. A Remote extending a Host that declares `skill` does not start filing sessions into the
Host's repo — each app declares its own (the same repo, if that's what you want). It is
excluded from the `merges` allowlist below.
:::

## Extends

`apps` says which remotes to **clone**; `extends` says which of them are **switched
on**. An app kept in `apps` but absent from `extends` is still synced, yet it
contributes no config and no directories — that is the on/off switch.

Each entry is a thunk. The thunk (rather than the config object directly) is what
lets two configs extend each other without hitting the ESM circular-import trap:

```ts
import monoHostConfig from '@mono-host-root/mono.config'

export default defineConfig({
    name: 'gallery-apps',
    type: 'vue',
    extends: [
        (): MonoConfig => monoHostConfig,
    ],
    // …
});
```

Your own config always wins. Layers only fill in what you did not declare, and
name-keyed arrays (`apps`, `menu`, `cookie`) merge per key with your entry leading
the list.

### Taking only part of a layer

A bare thunk merges everything the layer has — its `menu`, `env`, `cookie`,
`fetching`, `jwt`, `mockIndexedDB`, **and** every directory it owns. To take less,
swap the thunk for an options object:

```ts
extends: [
    (): MonoConfig => flowAppConfig,                      // everything
    {
        config: (): MonoConfig => galleryAppConfig,
        merges: ['menu', 'mockIndexedDB'],                // only these config keys
        ecosystems: ['pages', 'composables', 'stores'],   // only these directories
    },
],
```

| | Omitted | Listed | `[]` |
| --- | --- | --- | --- |
| `merges` | every config key | only those keys | no config at all |
| `ecosystems` | every directory | only those directories | no directories at all |

Omitting a key means "no restriction", so `{ config }` on its own behaves exactly
like the bare thunk — selectivity is opt-in and nothing existing changes.

::: tip `ecosystems` outranks your build config
The allowlist is applied inside `mono.ecosystem()` and inside the Nuxt module's own
discovery, not at the call site. So a layer that did not list `components`
contributes nothing to `...mono.ecosystem('components')`, however that call is
written. Your **own** `'./src/components'` is untouched — only what the layer
contributes is filtered.
:::

Matching is segment-wise, so `'composables'` also admits `'composables/shared'`,
while `'composables/shared'` admits only itself.

The common use is a remote declining part of its host while developing:

```ts
// in the remote — use the host's pages, but not its layouts or components
extends: [
    { config: (): MonoConfig => monoHostConfig, ecosystems: ['pages'] },
],
```

Because `merges` and `ecosystems` are independent, that remote still receives the
host's `fetching`, `cookie` and `jwt` in full. Drop `ecosystems` again for
production and the remote consumes everything the host provides.

Two things `merges` deliberately cannot change: `name` and `type` identify a config
rather than describe shared state, so they are never taken from a layer. And listing
`apps` is not required to keep a remote registered — the Vite and Nuxt integrations
both restore `apps` from your own config after merging.

## Cookie

Handling a cookie is simple. Say you have a cookie called `JWT_Token` that's already set, and you want to use it across your app — here's a small example.

```ts
import { defineConfig, JWTCompleteTokenTypes } from "@mono-lit/utility/runtime";

export default defineConfig({
    name: 'mono-remote',
    cookie: [
        {
            name: 'JWT_Token',
        },
    ],
});
```

Then use it like this — it returns the exact value of your token:

```ts
import { monoState } from '@mono-lit/utility/state';

const token = monoState().cookie.JWT_Token

console.log(token)
```

An entry may also declare `split: true`, for a token too large for one cookie (it's stored across
numbered chunks). Declare it here once: `fetching.auth` refers to these cookies **by name** and
inherits the flag, so nothing else has to restate it. See
[Data Fetching](./data-fetching#adding-a-jwt-token) for how a cookie declared here becomes the
token on every request.

## JWT

What if you need to decode the `JWT_Token` cookie to read the JWT payload inside? Set it up like this:

```ts
//@unocss-include
import { defineConfig, JWTCompleteTokenTypes } from "@mono-lit/utility/runtime";

export default defineConfig({
    name: 'mono-remote', // your app name
    jwt: {
        token: {
            name: 'JWT_Token',
        },
    },
});
```

Then use it like this — the token returns the decoded value:

```ts
import { monoState } from '@mono-lit/utility/state';

const { jwt } = monoState()

console.log(jwt.token)
```

### More than two tokens

`token` and `refreshToken` are just the two keys mono knows by name. The block takes **any**
key, so an app carrying a third JWT — a vendor token, an impersonation token, a second
identity provider — has somewhere to put it. Each key decodes its cookie and hydrates into
`monoState().jwt.<key>`:

```ts
jwt: {
    token:        { name: 'JWT_Token', split: true },
    refreshToken: { name: 'JWT_RefreshToken' },
    // any key you like:
    vendorToken:  { name: 'VENDOR_jwt', split: true },
},
```

```ts
const { jwt } = monoState()

jwt.token.USER_NAME   // typed — `token` and `refreshToken` have known claims
jwt.vendorToken       // Record<string, any>
```

A custom key reads as an untyped claims bag. To give it real types, pass them through the
`monoState` generic:

```ts
interface VendorClaims { vendor: string; scope: 'read' | 'write' }

const { jwt } = monoState<{ jwt: { vendorToken: VendorClaims } }>()

jwt.vendorToken.scope   // 'read' | 'write'
```

::: warning A mis-cased key is not a compile error
Accepting any key means TypeScript can't flag `refreshtoken` (lowercase `t`) as a typo — it's
a perfectly valid custom key. It would hydrate under *that* name and leave
`monoState().jwt.refreshToken` empty, so every guard reading it sees a logged-out user. mono
warns in the console when a key looks like a mis-cased known one, since the type system no
longer can.
:::

## Deployment

Deployment is fully handled by the Host, so the Host needs to know which Remote pages to deploy.

For example, a Remote has a page called `budget.vue`:

```
mono-vue-remote/
└── src/
    └── pages/
        └── budget.vue
```

To have the Host deploy it, define it in the config. You can use any icon from [Icones](https://icones.js.org).

```ts
import { defineConfig, JWTCompleteTokenTypes } from "@mono-lit/utility/runtime";

export default defineConfig({
    name: 'mono-remote',
    menu: [
        {
            title: 'Budget',
            url: '/budget',
            icon: 'i-mdi-wallet-bifold',
        }
    ]
});
```
