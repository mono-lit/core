# Template Rules (for AI)

This project is built to be maintained largely by an AI assistant. This page is the
contract the AI follows when it writes code in a **Host** or a **Remote**. An app is written
in one of the ecosystem's **template languages** — **Vue** or **Nuxt** — declared by
the `type` field in its `mono.config.ts`, and part of these rules depends on which one you're
in. The rules are grouped into:

- **Common Rules: General** — language-neutral; apply to every app, Host or Remote.
- **Common Rules: Vue / Nuxt** — one section per template language. Read **only** the
  one matching your app's `type`.
- **Host template** — what the AI may / may not do in the Host.
- **Remote template** — what the AI may / may not do in a Remote.

Start here and follow the General rules on every change, plus your language's section.

> New to the repo? [Setup](../repo/setup) shows how a Host (Vue or Nuxt) and a Remote are wired
> together. This page is the day-to-day contract for writing code **inside** them.

The General rules are ordered as a learning path: **understand the machine** (1–4) →
**shared config** (5) → **naming conventions** (6) → **environment** (7) → **where code &
data live** (8–10) → **capabilities: pick a component flavor, fetch, type, and build UI** (11–15) →
**put it together and build a feature** (16) → **remember what you learned** (17). Read top-to-bottom
once, then read your language section top-to-bottom once; after that, route by the tables below.

## How to use these rules

Don't read everything every time. **Identify your language first**, then route by what you're
doing, obey the hard prohibitions, and stop to ask at the marked decision points. Every rule
below also opens with a **When / Do / Don't** lead so you can scan it in one line.

### Pick your language first

Open `mono.config.ts` and read the top-level `type`. It decides which second section you read
— and where this app's source lives:

| `type` in `mono.config.ts` | The app is | Source | Read |
| --- | --- | --- | --- |
| `'vue'` | a Vue + Vite app — a Vue **Host**, or a Vue **Remote** | `src/` | **General** + [**Vue**](#common-rules-vue) |
| `'nuxt'` | a Nuxt app — a Nuxt **Host**, or a Nuxt **Remote** | `app/` | **General** + [**Nuxt**](#common-rules-nuxt) |

Which of the two a Nuxt app is comes from `template` in the same file: `'host'` owns the
shared shell, `'remote'` consumes one. An **absent** `template` reads as `'remote'` — so a
Host must say so explicitly, or it will adopt its Remotes' layouts.

Rules are numbered by section: **General** rules are plain numbers (`Rule 12`), **Vue** rules
are `V`-prefixed (`Rule V1`), **Nuxt** rules `N`-prefixed (`Rule N5`). A bare "Rule _n_"
anywhere on this page always means a General rule.

::: warning Don't read the wrong language section
The Vue and Nuxt sections contradict each other on purpose — different build config, different
source folder, different `mono-*` component build. Applying a Nuxt rule in a Vue app (or the
reverse) will produce code that doesn't build. Check `type` before you start.
:::

### Start here — intent → rule

| You're about to… | Read |
| --- | --- |
| Build a feature / page | **16** (+ 8, 11, 12, 14) |
| Name a variable, function, or handler args | **6** |
| Consume an OData URL / entity | **13** |
| Fetch data (REST or OData) | **12** |
| Get one record / detail from a DataSource | **12** (reuse the source — `store().load({ take: 1 })`, no 2nd fetcher) |
| Import across apps, or from `datas` / `types` / `odata` | **2** |
| Create a store or composable | **8** |
| Add static / constant data | **9** |
| Add a global helper | **10** |
| Need validation / notif / Excel / JSON helpers | **15** |
| Add an API endpoint, cookie, JWT, or menu entry | **5** |
| Handle a secret / base URL / port | **7** (+ **V6** / **N6** for the port & `envPrefix`) |
| Pick a light-DOM vs shadow `mono-*` component | **11** (+ **V5** / **N5**) |
| Build UI | **14** |
| Start complex work, or just finished meaningful work | **17** (when `skill` is configured) |
| Touch the build config (`vite.config.ts` / `nuxt.config.ts`) | **1** (+ **V1** / **N1**) — and ask first |
| Work out where a folder lives (`src/` vs `app/`) | **V2** / **N2** (+ 2) |
| Register `createMono` / bootstrap the app | **V4** / **N4** |

### Never do

- **Install an external HTTP library** (axios, ofetch, ky, raw `fetch` wrapper) — Rule 12.
- **Build a second fetcher for a row you already hold a DataSource for** — reuse the source (`source.store().load({ take: 1 })`), don't call a fresh `monoFetchOdata` — Rule 12.
- **Edit anything in `.mono/apps/`** — Rule 3.
- **Hand-edit generated files** (`odata/DTO/`, `.mono/tsconfig.json`, and your language's
  generated output — Vue: `auto-imports.d.ts` / `components.d.ts` / `typed-router.d.ts`;
  Nuxt: `.nuxt/`) — Rules 4, V3, N3.
- **Hand-write OData entity types** — generate them — Rule 13.
- **Reuse a `defineStore` key or an export name** across apps — Rule 8.
- **Use `dataSource.store().byKey()`** for a single row (`load({ take: 1 })` instead) — Rule 12.
- **Manage the theme from a Remote** — don't import the theme CSS or call `applyTheme` / `applyFlavor` in a Remote; the **Host** owns the theme — Host template & [Theme](/ui/theme).
- **Rewire `vite.config.ts` / `nuxt.config.ts` aliases**, or hand-edit `tsconfig.json` paths (they're generated by `mono prepare`) — Rules 1, 2, V1, N1.
- **Mix the two component builds** — don't ship light-DOM `mono-*` as the primary UI of a Nuxt
  host (skeleton delay + reflow on hydration), and don't reach for the shadow build in a Vue
  app — Rules 11, V5, N5.
- **Apply another language's section** — a Vue rule in a Nuxt app (or the reverse) — read the
  section that matches `type`.

### When to stop and ask the user

- Starting in a freshly-cloned app still using a default template name (`mono-host` / `mono-vue` / `mono-nuxt-host` / `mono-vue-remote`) — confirm whether to rename it (Rule 1).
- Editing `vite.config.ts` / `nuxt.config.ts` or the `@app-name` alias paths (Rules 1, 2, V1, N1).
- Touching `mono.config.ts` `extends` / `apps` (Rule 5).
- Naming a new page/route (Rule 16).
- Whether a new page should be in the menu / deployable to the other app (Rule 12).

### Glossary

| Term | What it is |
| --- | --- |
| `@mono-lit/utility` | Core ecosystem package — repo wiring (`monoRepo`), config, env, fetching. |
| `@mono-lit/utility/fetching` | The **only** sanctioned fetch layer (`monoFetch`, `monoCreateFetcher`, …). Rule 12. |
| `@mono-lit/utility/runtime` | Runtime helpers: `useMonoUtility` (validation, notif, data, OData, JSON) + `MonoNotivue`; plus `useUtils`, `MonoOdataMapTypes` + all validation / OData types; plus cookie/token/jwt/state. Rules 13, 15. |
| `@mono-lit/utility/config` | `defineConfig` for `mono.config.ts`. Rule 5. |
| `@mono-lit/helper` | Shared UI + table helpers (`controlMonoTable`). |
| `@mono-lit/helper/ui` | The `<mono-*>` Lit web components — light-DOM build. Rules 14, V5. |
| `@mono-lit/helper/ui/shadow` | The shadow-DOM (SSR) build of the same components → `<mono-shadow-*>`. Rules 11, N5. |
| `@mono-vue` / `@mono-host` (+ `-root`) | Role-based import aliases — own source dir vs the other app's. Rule 2. |
| `monoRepo` | `@mono-lit/utility/vite` — **one call** (`const mono = await monoRepo({ command })`) carrying all mono wiring in a Vue app: the `.options()` builders, `mono.vite()`, `mono.ecosystem(subs)`, `mono.nuxt()`. The Vite twin of `@mono-lit/utility/nuxt`. Rules V1, V7. |
| `mono.plugin` / `mono.ecosystem()` | The long-hand surface, still supported: `plugin` (register **last**) wires alias / config-expose / `server.fs.allow` / dep dedup; `ecosystem(subs)` discovers the other app's dirs, type-aware. `mono.vite()` folds `plugin` in, and taking dirs via `ecosystem()` tells it that plugin is yours. Rules 1, V1. |
| `monoEcosystem` / `mergeEcosystem` | The older standalone dir-discovery helpers that `mono.ecosystem()` replaces (still exported for back-compat). Rule V1. |
| **template language** | Which framework an app is written in — **Vue** or **Nuxt** — set by `type`. Decides which second Common Rules section applies. |
| `type` | `'vue' \| 'nuxt'` in `mono.config.ts` — the app's template language, which also decides whether its source is `src/` or `app/`. Rules 2, 5, V2, N2. |
| `@mono-lit/utility/nuxt` / `@mono-lit/helper/nuxt` | Nuxt modules that replace `vite.config.ts` wiring for a Nuxt **Host** — aliases, `server.fs.allow`, config-expose, ecosystem merge (`@mono-lit/utility/nuxt`); SSR + base CSS + `mono-*` custom-element rule (`@mono-lit/helper/nuxt`). Rule N1. |
| `mono.nuxt()` | Compat helpers for federating a **Nuxt** app — `hostResolver()` strips `definePageMeta`, fixes layout `<slot/>`, shims `useState` / `<NuxtLink>`; `extendRoute()` injects page meta. `mono.vite()` adds them automatically from `apps[].type`, so you rarely call this. Rule V7. |
| `mono.vite()` | The whole mono side of a `vite.config.ts`, in one entry — register it **last**. Named after Vite, not a role: the same call in a Host and a Remote. Rule V1. |
| `template` | `'host'` or `'remote'` in `mono.config.ts`. The one role difference: a Host renders its own layouts and takes no federated ones; a Remote consumes the Host's. Never inherited through `extends`. Rule V1. |
| `mono.config.ts` | Shared cookie / JWT / API / menu config + sync source. Rule 5. |
| `mono.env.ts` | Committed non-secret, per-environment config (base URLs, flags), read via `resolveEnv` / `monoEnv`. Rule 7. |
| `.mono/apps/` | Synced copy of the other app. Read-only. Rule 3. |
| `mono prepare` | CLI that generates `.mono/tsconfig.json` (the `@mono-*` TypeScript `paths`) and wires the root `tsconfig.json` `extends`. Runs on `dev` / `postinstall`. Rule 2. |
| `.mono/` | One gitignored folder for everything mono generates — `apps/` (synced remotes), `tsconfig.json` (aliases), sync cache, `skills/` (session staging). |
| `mono skills` | CLI for **MONO Skills**: read app knowledge/skills and save AI session history to the git repo set as `skill` in `mono.config.ts`. Opt-in by adding that key. Rule 17, [Skills](./skills). |
| DataSource | A live, reactive handle to an OData endpoint (paging/filter/sort). Rule 12, [DataSource](../odata/datasource). |

## Common Rules: General

These rules apply to **every** app, whatever its template language. After them, read the one
section that matches your `type` — [Vue](#common-rules-vue) or [Nuxt](#common-rules-nuxt).

### 1. The build config is the core — ask before changing it

> **When:** always be aware of it; act only when a change to build wiring seems needed.
> **Do:** treat your app's build config as read-only, and know which file that is — `vite.config.ts` in a Vue app (Rule V1), `nuxt.config.ts` in a Nuxt app (Rule N1).
> **Don't:** add/remove/rewire the ecosystem discovery, `resolve.alias`, or `server.fs.allow` without asking.

Every app has **one build config** that wires its whole source tree. It is **fixed
infrastructure** — the programmer (and the AI) rarely touches it. Almost every
convenience you rely on in your source folder is set up here, which is exactly _why_ you don't
edit it casually: a small change can silently break auto-imports, routing, or the
link between Host and Remote.

Which file it is depends on your template language:

| `type` | Build config | What's in it |
| --- | --- | --- |
| `'vue'` | `vite.config.ts` | plugins + `resolve.alias` + `server.fs.allow` — **Rule V1** |
| `'nuxt'` | `nuxt.config.ts` | `modules` + the `mono` key (there is **no** `vite.config.ts`) — **Rule N1** |

::: warning
Treat the build config as read-only. If a change there seems necessary — **ask the
user first**, especially for the three Host ↔ Remote settings below.
:::

#### The Host ↔ Remote connection (do not touch without asking)

The Host and Remote are only joined in **three** places. These are the
core of the whole mono-repo — changing them wrongly breaks the link between apps:

1. **Ecosystem discovery** — merges the *other* app's `pages`, `components`,
   `stores/shared`, and `composables/shared` into this app's routing, auto-import, and
   component registration. This is how a Host sees the Remote's modules (and a Remote sees
   the Host's shared code). It is **type-aware**: each app's folders resolve to `src/` or
   `app/` from its `type`, so no path is hardcoded. In a Vue app you call
   `mono.ecosystem(subs)` (Rule V1); in a Nuxt app the `@mono-lit/utility/nuxt` module does the
   discovery for you (Rule N1). _(Older Vue configs call the standalone `monoEcosystem({ … })`
   — or `mergeEcosystem`, the primitive it wraps.)_
2. **`resolve.alias`** — an alias for the **Host**'s source and one for the **Remote**'s
   source (each with a project-root variant), **generated for you** (Rule 2) —
   not hand-listed. Inside either app, the
   role it _is_ points at its own source folder, and the role it _isn't_ points into the
   synced `./.mono/apps/<other>/`. So you import by role from anywhere — the Host alias
   always reaches Host code and the Remote alias always reaches Remote code, no
   matter which app you're working in. **This is the import connection — see Rule 2.**
3. **`server.fs.allow`** — grants the dev server filesystem access to `./.mono/apps` so it
   can actually read the synced other app's source (see [Sync](../repo/sync)).

You don't hand-write any of the three any more: a Vue app gets them from `mono.vite()` out
of one `await monoRepo({ command })` call (Rule V1), a Nuxt app from the `@mono-lit/utility/nuxt`
module (Rule N1). The link is the same either way.

Everything else (`server.port`, `build`, `dotenv`) is plumbing. **Do not add,
remove, or rewire any of the above on your own — confirm with the user first.**

#### Styling crosses apps too — `uno.config.ts` must scan `.mono/apps`

The three links above wire **modules** (routes, imports, components). **Styling has a
parallel requirement, in a separate file — `uno.config.ts`.** UnoCSS only generates the
utility classes it finds in the files it scans, and that scan **must cover the synced other
app**, or none of its classes land in the CSS.

The scan is anchored on an **absolute** `content.filesystem` base, not a relative glob:

```ts
// uno.config.ts
import { fileURLToPath } from 'node:url'
const monoApps = fileURLToPath(new URL('./.mono/apps', import.meta.url)).replace(/\\/g, '/')

content: {
  // absolute + eager, so federated classes land in uno.css upfront
  filesystem: [
    `${monoApps}/*/src/**/*.{js,ts,vue,html}`,   // vue remotes
    `${monoApps}/*/app/**/*.{js,ts,vue,html}`,   // nuxt remotes
    `${monoApps}/*/mono.config.ts`,              // menu `icon` classes
  ],
  pipeline: {
    include: [
      // UnoCSS's default include, restored
      /\.(vue|svelte|[jt]sx|vine.ts|mdx?|astro|elm|php|phtml|marko|html)($|\?)/,
      // …plus federated .ts/.js — a regex matches module ids where a glob cannot
      /[\\/]\.mono[\\/]apps[\\/].*\.(ts|js)($|\?)/,
    ],
  },
}
```

Note there is **no entry for this app's own source** — it flows through UnoCSS's default
include, which the first regex restores (`.vue` by default, `.ts` via an `//@unocss-include`
comment). This block is scoped to `.mono/apps` only.

::: warning Relative `.mono/apps` globs fail silently ⇒ the Host shell renders unstyled
A **relative** glob (`'./.mono/apps/*/src/**'`) is resolved against Vite's `root` and then
matched against the absolute / virtual module ids Vite actually hands UnoCSS — so it matches
nothing. Under **Nuxt's Vite** it's worse: `root` is the srcDir (`app/`), so `./.mono/apps/**`
points at a non-existent `app/.mono/apps`. Either way there is **no error**, just missing CSS.

The symptom is misleading: a Remote loads the Host's `home` layout but every `flex` /
`min-h-screen` / `bg-*` is gone, so the **shell looks broken** — while `mono-*` components
still look fine (they ship their own CSS), making the breakage look partial.

**Symptom → fix:** Host layout/sidebar unstyled (or federated menu icons missing) while
`mono-*` components render styled → open `uno.config.ts` and move the `.mono/apps` scan to the
absolute `content.filesystem` form above. Correcting this is a plain fix (the value is
known-correct) — it's *not* one of the ask-first cross-app links, which actually rewire how the
apps connect.

**The rule behind it:** whenever a scanned path sits **outside the Vite root**, a relative
`content` glob fails by matching nothing rather than by erroring. Anchor it absolutely.
:::

#### First — confirm the app name (don't keep the template default)

> **When:** the very first thing you do in a freshly-cloned app, before writing code.
> **Do:** check `name` in `mono.config.ts`; if it's still a template placeholder, **ask the user** whether to rename it, and suggest one or let them pick a custom name.
> **Don't:** keep a placeholder name without asking, rename silently, or change one file but not the other.

Apps are cloned from templates that ship with **default names** — `mono-host` /
`mono-vue` (the `name` in `mono.config.ts`), and `mono-host` / `mono-nuxt-host` /
`mono-vue` in `package.json`. Teams keep these placeholders by accident. So **before you
build anything**, look at `name` in `mono.config.ts`. If it's still one of the defaults
(`mono-host`, `mono-vue`, `mono-nuxt-host`, `mono-vue-remote`), **stop and ask the user**:

> _"This app is still using the template name `mono-host`. Do you want to rename it to
> something project-specific (e.g. `acme-host` / `acme-portal`), or keep it as-is?"_

Suggest a name based on the project, but let the user give their own or keep the default —
it's their call.

**If the user renames**, change the name in **both** files:

1. **`mono.config.ts`** → the top-level `name`. This is the app's identity: `monoAlias()`
   derives the `@<name>` / `@<name>-root` import aliases from it (Rule 2), so renaming
   `mono-host` → `acme-host` turns `@mono-host` into `@acme-host`.
2. **`package.json`** → the `"name"` field, so the package identity matches.

Then re-run `mono prepare` so `.mono/tsconfig.json` regenerates against the new alias.

::: warning A rename cascades — do it at project start
Because the `@<name>` aliases come from `mono.config.ts` `name`, a rename changes **every
`@<name>` import**, and the **other app's `apps[].name`** (and its `extends` import path)
must match the new name (Rule 5). That's why you do this **first**, before code piles up on
the old alias — and why you confirm with the user instead of guessing. See
[Config](../repo/config) for the `name` field and Rule 2 for how the aliases are derived.
:::

### 2. Import connection — the `@app-name` aliases

> **When:** importing across apps, or from `datas` / `types` / `odata` (anything not auto-imported).
> **Do:** import by role — `@mono-vue/...` / `@mono-host/...`; let `monoRepo()` generate the bundler side and `mono prepare` generate the TypeScript side.
> **Don't:** hand-write the Vite alias paths or the `tsconfig.json` `paths` (both are generated); or assume `datas`/`types`/`odata` are auto-imported.

::: danger Very important — without this, apps can't reach each other's files
The `@app-name` aliases are **how a Host and a Remote import each other's code**, and how
an app reaches its own folders that aren't auto-imported. If they're missing or wrong,
cross-app imports — and even your own `@mono-vue/types` imports — stop resolving and the
app won't build. Treat them as core infrastructure (part of Rule 1): **don't rewire them
without asking.**
:::

The same alias names live in **two places**, and **both are generated** — you never
hand-write either:

- **The bundler alias** — `resolve.alias` (plus the matching jiti alias used to parse
  `mono.config.ts`), so the import actually *works* at runtime. **Generated automatically**
  and applied for you — by `mono.plugin` from `await monoRepo()` in a Vue app (Rule V1), by
  the `@mono-lit/utility/nuxt` module in a Nuxt app (Rule N1). In neither case is it written in a
  config file.
- **`tsconfig.json` → `compilerOptions.paths`** — used by TypeScript and your editor so the
  types *resolve* (type-checking, go-to-definition). **Generated by [`mono prepare`](../repo/sync#run-sync)**
  into `.mono/tsconfig.json`, which the root `tsconfig.json` `extends`. Because both sides
  come from the same source (`mono.config.ts` + the `.mono/apps/` scan), they can't drift.

#### `monoRepo()` builds the aliases for you

_(Vue apps — a Nuxt app gets the same map injected by `@mono-lit/utility/nuxt` instead, Rule N1.)_

`vite.config.ts` no longer hand-lists the alias map. One call derives it — the **own** name
from `mono.config.ts` (`name`), the **remotes** by scanning `.mono/apps/` — and `mono.plugin`
applies it:

```ts
import { monoRepo } from '@mono-lit/utility/vite'

export default defineConfig(async () => {
  const mono = await monoRepo()

  return {
    // no `resolve.alias` block — mono.plugin sets it (along with server.fs.allow
    // and __MONO_CONFIG_EXPOSE__) from the same single config load
    plugins: [/* … */ mono.plugin], // ← last
  }
})
```

It emits, for an app named `mono-host` with `mono-vue` synced into `.mono/apps/`:

| Alias | Points at |
| --- | --- |
| `@mono-host` / `@mono-host-root` | own `./src` / `./` |
| `@mono-vue` / `@mono-vue-root` | `./.mono/apps/mono-vue/src` / `./.mono/apps/mono-vue` |
| `@mono-apps` | `./.mono/apps` |

So adding or renaming a remote needs **no build-config edit** — sync it into
`.mono/apps/` (Rule 3) and the alias appears on its own. The matching `tsconfig.json`
paths are equally hands-off: `mono prepare` regenerates `.mono/tsconfig.json` (it runs on
`dev` / `postinstall`, or run it yourself) so TypeScript stays in sync without an edit.

#### What the aliases point at (role-based)

Each app aliases **its own** role to its own `./src`, and the **other** app's role into the
synced `./.mono/apps/<other>/src` (see [Sync](../repo/sync)). So you always import by role, from
either app:

| Alias | In the Remote (`mono-vue`) | In the Host (`mono-host`) |
| --- | --- | --- |
| `@mono-vue` | `./src` _(its own)_ | `./.mono/apps/mono-vue/src` _(synced)_ |
| `@mono-host` | `./.mono/apps/mono-host/src` _(synced)_ | `./src` _(its own)_ |
| `@mono-vue-root` / `@mono-host-root` | the matching **project-root** variants | the matching **project-root** variants |

(The Host also exposes `@mono-apps` → `./.mono/apps`.) The upshot: `@mono-host/...` always reaches
Host code and `@mono-vue/...` always reaches Remote code, no matter which app you're in.

> **Repo name vs app name:** the GitHub repos are `mono-vue-host` (Host) and `mono-vue-remote` (Remote), but the internal app `name` in `mono.config.ts` stays `mono-host` / `mono-vue` — and the `@mono-host` / `@mono-vue` aliases are derived from that `name`, so they're unchanged.

#### `src/` or `app/` is decided by the app's `type`

The tables above assume every app keeps its source under `src/` — true for a **Vue** app
(Rule V2). A **Nuxt** app keeps its source under `app/` (Rule N2), and `monoAlias()` accounts
for this automatically: it reads each app's `type` from `mono.config.ts` (`vue` → `src/`,
`nuxt` → `app/`, see [Config](../repo/config)) and points the alias at the right folder. **You
never encode the folder yourself — the alias already resolved it**, which is why the same
`@mono-host/...` import works from either kind of app. So in a Vue Remote synced to a **Nuxt**
Host (the hybrid pairing — possible but risky, see [Setup](../repo/setup)):

| Alias | Points at |
| --- | --- |
| `@mono-host` | `./.mono/apps/mono-host/app` _(Nuxt host → `app/`)_ |
| `@mono-vue` | `./src` _(its own, Vue → `src/`)_ |

`mono prepare` mirrors this on the TypeScript side automatically — it reads each app's
`type` and points `@mono-host/*` at `app/*` (not `src/*`) when the host is Nuxt, in the
generated `.mono/tsconfig.json`. Nothing to edit by hand.

#### Why aliases at all — what auto-import doesn't cover

Auto-import (Rules V1 / N1) only wires up `stores`, `composables`, and `components`.
Everything else you reach with an explicit import. Folders like **`datas`,
`types`, and `odata`** are deliberately **not** auto-imported — their names are far
too generic and common (every app has a `types` and a `datas`), so auto-importing them
would collide and pollute the global namespace. Instead you import them explicitly through
the alias — and that **same alias is what lets one app reach the _other_ app's `datas` /
`types` / `odata`**:

```ts
import type { DTO_BrandTypes } from '@mono-vue/types'        // a Remote type
import table from '@mono-vue/datas/table'                    // a Remote's static data
import { QDTO_Brand } from '@mono-vue/odata/DTO/QDefault'     // a Remote's generated OData
```

So the rule of thumb: **auto-imported folders (`stores` / `composables` / `components`)
need no import line; everything else — especially `datas`, `types`, and `odata` — is
reached through the `@app-name` alias.** That alias is the backbone connecting the two
apps; keep it intact. (Those folder names are relative to your source dir — `src/` in Vue,
`app/` in Nuxt.)

### 3. Never edit `.mono/apps/` — it's synced

> **When:** always — whenever you see a path under `.mono/apps/`.
> **Do:** change the other app in its own repo, then `pnpm mono:sync`.
> **Don't:** create, edit, or delete anything inside `.mono/apps/` by hand.

`.mono/apps/` is where this app keeps a copy of the **other** app it's connected to — a
Host stores the Remote there, a Remote stores the Host there. It's generated content,
and the whole cross-app setup reads from it: the `@mono-host` / `@mono-vue` aliases
resolve into it, the ecosystem discovery pulls pages/components/stores from it, and
`server.fs.allow` grants access to it (all of Rule 1's Host ↔ Remote links).

::: danger Do not touch `.mono/apps/`
Never create, edit, or delete files inside `.mono/apps/` by hand. It feeds routing,
auto-imports, and the build directly, so manual changes will break things — and the
next sync overwrites them anyway. The **only** way to update it is to re-sync:

```
pnpm mono:sync
```

(the script lives in your `package.json`). See [Sync](../repo/sync). Need a change in the
other app? Make it in that app's own repo and sync.
:::

### 4. Never edit generated files

> **When:** always — before touching any `*.d.ts` or `odata/DTO/` file.
> **Do:** change the source (store/composable/component/page, or the OData metadata) and regenerate.
> **Don't:** hand-edit `odata/DTO/`, `.mono/tsconfig.json`, or your language's generated output (Rules V3 / N3).

Several files are produced by the tooling and **regenerated on every dev / build** —
hand edits are silently lost and only hide the real problem. Treat them as read-only.

Every app, whatever its language:

- everything under `odata/DTO/` — generated by `odata2ts` from the OData
  `$metadata`
- `.mono/tsconfig.json` — generated by `mono prepare` (the `@mono-*` TypeScript paths)
- everything under `.mono/apps/` — synced, not generated, but equally read-only (Rule 3)

**Plus your language's own generated output** — the auto-import / routing type files, which
differ per language: see **Rule V3** (Vue) or **Rule N3** (Nuxt).

::: danger Don't hand-edit generated output
Never edit the files above. They're regenerated on dev/build, so your changes vanish
— and editing the output instead of the source hides the actual cause. Commit them to
version control, but to change what they contain, edit the **source**: a
store / composable / component / page for the `*.d.ts` files, or the OData metadata
(then regenerate) for the `odata/DTO/` types.
:::

Same principle as Rule 3 (`.mono/apps/` is synced, not edited): **generated or synced
output is read-only — fix the thing that produces it.**

### 5. `mono.config.ts` — the shared config + sync core

> **When:** adding an API endpoint, cookie, JWT, or menu entry.
> **Do:** edit `fetching.api` / `auth` / `cookie` / `jwt` / `menu` freely.
> **Don't:** change `extends` or `apps` without asking — they wire the two apps together.

`mono.config.ts` (built with `defineConfig` from `@mono-lit/utility/config`) is the single
source of truth that ties a Host and a Remote together and holds their shared
**cookie / JWT / API / menu** config. Unlike the build config (Rule 1), you **do** edit this
file regularly — adding an API endpoint, a cookie, or a menu entry is normal. Only
two fields actually wire the two apps together; treat those with care.

#### What each field does

| Field | What it does |
| --- | --- |
| `name` | This app's identity within the ecosystem — `monoAlias()` derives the `@<name>` aliases from it. If it's still a template default, confirm a rename with the user **first** (Rule 1 → _Confirm the app name_); a rename also touches `package.json` and the other app's `apps[].name`. |
| `type` | `'vue'` or `'nuxt'` — declares this app's **template language**, which decides both which Common Rules section applies (Vue / Nuxt) and whether its source is `src/` or `app/`. Read statically by `monoAlias` / `monoEcosystem`, so it **must be declared above `apps`**. _(Host ↔ Remote link — see [Config](../repo/config) and Rules 2, V2, N2.)_ |
| `extends` | Merges the **other app's** `mono.config` into this one, so cookies, JWT, APIs, and menu **compose across Host and Remote**. _(Host ↔ Remote link.)_ |
| `apps` | The app(s) this one pulls when you run `pnpm mono:sync` — each entry's `url` is a GitHub ref, `envToken` names the env var holding the access token, and **`type`** declares that synced app's framework (so its folders resolve to `.mono/apps/<name>/src` or `.mono/apps/<name>/app`). _(Host ↔ Remote link — see [Sync](../repo/sync).)_ |
| `fetching.api` | Named REST / OData endpoints and their source constructors. Add your APIs here; call them by name with `configBaseUrl`. See [Data Fetching](../repo/data-fetching). |
| `fetching.auth` | `use` names the cookie sent on API requests (`apiRequest`) and the one that authenticates the refresh call (`refreshTokenRequest`) — both are entries of `cookie[]`, so `split` is inherited. Adding `requestRefreshTokenRequest` turns on automatic token refresh. See [Data Fetching](../repo/data-fetching#automatic-token-refresh). |
| `cookie` | Declares the cookies (`name`, `split`) whose values hydrate into mono state. |
| `jwt` | Decodes cookies into JWT state (prod reads by cookie name; dev uses the decoded payload). `token` / `refreshToken` are the two keys mono knows by name, but **any key is allowed** — each hydrates into `monoState().jwt.<key>`. See [Config](../repo/config#more-than-two-tokens). |
| `menu` | This app's navigation entries (`title`, `url`, `icon`, nested `items`) — how a Remote's modules show up in the Host's nav. See [Config](../repo/config). |

#### Host ↔ Remote: handle with care

`type`, `extends`, and `apps` are the link between the two apps — `type` decides
`src/` vs `app/` resolution, `extends` merges the other app's config, and `apps`
declares what `mono:sync` pulls. `type` reflects the app's framework and is set once;
flipping any of these alters how Host and Remote connect, so **confirm with the user
before editing them** (same as the three build-config settings in Rule 1).

Everything else — `fetching.api`, `auth`, `cookie`, `jwt`, `menu` — is normal
day-to-day editing. Add the API, cookie, or menu entry your feature needs.

#### `extends` + `apps` must agree across every app — mirror the Host's other Remotes

`mono.config.ts` is loaded **transitively**: this app `extends` the Host's config, and the
Host's config in turn `extends` each Remote it owns — via that Remote's **`@<remote>-root`
import** (e.g. `import monoVueConfig from '@mono-vue-root/mono.config'`). Every one of those
imports is resolved with **this** app's aliases, and `monoAlias()` only emits a `@<x>-root`
alias for **this app's own `name`** and for **each entry in this app's `apps[]`** (Rule 2).
So the invariant is:

> **Every `@<x>-root` referenced anywhere in the merged config chain must resolve to this
> app's own `name` or one of its `apps[]` entries.**

In the common one-Host-one-Remote setup this is automatic: the Host imports the Remote as
`@<remote>-root`, and inside the Remote that *is* its own-root alias (own `name`), so it
resolves with nothing in `apps[]`. It only bites when the graph grows or a name moves:

- **The Host owns more than one Remote.** If the Host `extends` Remote `mono-vue` **and**
  Remote `acme-orders`, then **each** of those Remotes must list the **other** in its own
  `apps[]` — otherwise, when `acme-orders` loads the Host config, the Host's
  `@mono-vue-root` import has no alias. Add the sibling Remote to `apps[]` so `mono:sync`
  pulls it into `.mono/apps/<remote>` and the alias appears on its own (Rule 2 — no
  build-config edit).
- **You renamed a Remote the Host still imports by the old name.** Renaming `mono-vue` →
  `my-memo` drops `@mono-vue-root` (Rule 1 → _a rename cascades_). If the Host config still
  `extends @mono-vue-root`, either repoint the Host's import to `@my-memo-root` (and rename
  its `apps[].name`) — the clean fix — **or** re-add `mono-vue` to this app's `apps[]` to
  restore the alias.

::: danger Symptom: `Cannot find module '@<remote>-root/mono.config'` at startup
A missing sibling-Remote alias fails at **config-load time**: jiti (inside c12) can't
resolve the Host's `extends` import, so `vite` / `vue-tsc` die **before** the dev server
starts — and `mono prepare` won't help (it regenerates aliases from `name` + `apps[]`, it
doesn't invent the missing one):

```
failed to load config from …/vite.config.ts
Error: Cannot find module '@mono-vue-root/mono.config'
```

Fix the `apps[]` / `extends` graph so the name resolves, then `pnpm mono:sync` +
`pnpm mono:prepare`. **Trade-off to flag to the user:** adding a Remote to `apps[]` also
**merges in *its* pages/routes** and merges *its* `mono.config` (menu, fetching) into this
app — and layers its env file (so a key like `MONO_SYNC_TRANSPORT` in that Remote's `.env`
can override yours). That's the cost of re-providing the alias this way; the cleaner path is to
fix the Host's import to the current name.

**A Vue app on `monoRepo()` softens this**: its `stubMissing` option (default **on**) resolves
the `mono.config` import of an app that isn't synced into `.mono/apps/` to an empty config
instead of throwing, and warns once naming what it stubbed. So a missing *sync* no longer
hard-stops startup. It does **not** paper over a genuinely wrong `apps[]` / `extends` graph —
only that specifier is stubbed, and app code importing a missing app still fails. Read the
warning; don't ignore it.
:::

### 6. Naming — consistent prefixes & object props

> **When:** naming any variable / function, or passing arguments to a handler.
> **Do:** group by a shared **leading** prefix (`data*`, `dataSource*`, `input*`), name functions verb-first (`openModal`, `addBudget`), and pass arguments as one **typed object** — `openModal({ item }: { item: Budget })`.
> **Don't:** flip the prefix per entity (`budgetData`), pass positional scalars (`openModal(row.Id, row.Name)`), or pass a bare row (`openModal(row)`).

Consistency is the whole point: when every variable, function, and call site is named the
same way, the code reads predictably and the AI (and the next programmer) never has to
guess. Pick the leading word by **role**, keep it identical across entities, and the
related names sort and scan together.

#### Variables — leading prefix is the role, suffix is the entity

The **start** of the name says what kind of thing it is; the **end** says which entity it
belongs to. Same role → same leading word, every time. A list is `data<Entity>`, its
DataSource is `dataSource<Entity>`, an edit/form model is `input<Entity>`.

```ts
// ✅ role first, entity last — groupable, instantly scannable
const dataBudget = ref<Budget[]>([])
const dataTransaction = ref<Transaction[]>([])

const dataSourceBudget = ref<any>(null)
const dataSourceTransaction = ref<any>(null)

const inputBudget = ref<Budget>({} as Budget)
const inputTransaction = ref<Transaction>({} as Transaction)

// ❌ entity-first / mixed prefixes — unrelated-looking, hard to scan
const budgetData = ref([])
const transactionList = ref([])
const budgetSource = ref(null)
```

So the leading word (`data`, `dataSource`, `input`) is the category and stays fixed; only
the trailing entity changes. Two variables for the same role always share their prefix.

#### Functions — verb-first, same shape

Functions follow the same idea: a consistent **leading verb** is the action, the rest is
the target. Pair openers with closers, and keep the verb identical across entities.

```ts
const openModal = () => { /* … */ }
const closeModal = () => { /* … */ }
const addBudget = () => { /* … */ }
const addTransaction = () => { /* … */ }
```

#### Arguments — one typed object, always the whole row

When you call a handler — especially inside a table row / detail loop — pass **a single
object**, never positional arguments, and pass the **whole row**, not hand-picked fields.

```ts
// ✅ one object prop, whole row, typed → self-documenting and future-proof
const openModal = ({ item }: { item: Budget }) => {
  inputBudget.value = item
}

// in the template, inside a row loop:
// <mono-button @click="openModal({ item: row })">Detail</mono-button>
```

```ts
// ❌ positional scalars — order-sensitive, breaks the moment you need one more field
const openModal = (id: string, name: string) => { /* … */ }
openModal(row.Id, row.Name)

// ❌ bare row — works, but the call site can't tell what shape is expected
const openModal = (row) => { /* … */ }
openModal(row)
```

Why object-props-**with-types** wins:

- **Self-documenting call site** — `openModal({ item: row })` names what you pass.
- **Order-free & extensible** — grow to `{ item, mode }` later without touching callers.
- **Typed in one place** — `{ item }: { item: Budget }` gives autocomplete and catches a
  wrong row shape right at the call site. Declare the shape in `types/` (Rule 16).
- **Whole row, not fragments** — pass `row`, not `row.Id` / `row.Name`; the handler reaches
  whatever field it needs and you never go back to thread one more argument through.

Combine the two — object destructuring **plus** an inline type — for the cleanest DX:
`({ item }: { item: Budget })`.

### 7. Secrets & env — secrets in `.env`, non-secret config in `mono.env.ts`

> **When:** handling any config value (API key, token, base URL, port, feature flag).
> **Do:** sort by sensitivity — **secret** → `.env` / `.env.dev`; **non-secret shared config** (base URL, flag) → a committed **`mono.env.ts`**, read via `resolveEnv` / `monoEnv`; **dev-server-only** (port, HTTPS) → the build config (Rules V6 / N6).
> **Don't:** put a non-secret base URL in `.env` (it vanishes when a dev forgets to push it), hardcode a secret anywhere, or read `PORT` / `VITE_HTTPS` from `.env`.

Not every config value is a secret, and they don't all live in the same place — sort
by what the value **is**:

| Value | Where it lives | Read with |
| --- | --- | --- |
| **Secret** — API key, token, PAT, Sentry DSN / auth token | `.env` / `.env.dev` (never committed) | `import.meta.env.*` / `process.env.*` |
| **Non-secret shared config** — API base URL, feature flag | **`mono.env.ts`** (committed) | `resolveEnv` (load-time) · `monoEnv` (runtime) |
| **Dev-server-only** — port, local HTTPS | hardcoded in the build config — Rule **V6** / **N6** | — |

The rest of this rule takes each row in turn.

#### Secrets → `.env` (`.env.dev` for dev, `.env` for prod)

Real secrets — API keys, tokens, the Sentry DSN — go in an env file at the app root,
never hardcoded in a page, store, or `mono.config.ts`. Two files, picked by what
you're running:

- **`.env.dev`** — development. Loaded by the dev scripts (`pnpm dev`).
- **`.env`** — production. Loaded by build / preview (`pnpm build`, `pnpm preview`).

```
mono-vue-remote/
├── .env.dev              # development secrets/config
├── .env                  # production secrets/config
└── .mono/
    └── apps/
        └── mono-host/
            └── .env.dev  # the other app's env, layered in automatically
```

#### Syncing env between apps

You don't merge env files by hand. **Every script already runs through `mono-env`**
(shipped with `@mono-lit/utility`), which loads this app's root env first, then layers each
connected app's matching env file from `.mono/apps/` on top — see [Environment](../repo/env).
So just run the normal scripts from `package.json`:

```json
{
  "scripts": {
    "postinstall": "mono sync && mono prepare",
    "dev": "mono prepare && mono env -e .env.dev -- vite",
    "build": "mono env -e .env -- vue-tsc && mono env -e .env -- vite build --emptyOutDir",
    "preview": "mono env -e .env -- vite preview"
  }
}
```

`postinstall` leads with **`mono sync`** so a plain `pnpm i` recovers an empty or stale
`.mono/apps/` on its own — pnpm auto-runs `install` before any script, so a broken `.mono/`
would otherwise break *every* `pnpm` command, `pnpm mono:sync` included. (A Nuxt host chains
`&& nuxt prepare` after it.) See [Sync](../repo/sync).

`pnpm dev` loads `.env.dev` (root + every app); `pnpm build` / `pnpm preview` do the
same with `.env`. The `-- <command>` part is the real command that runs with the
merged environment.

#### Shared vs private: the `MONO_` prefix

The build config sets `envPrefix: ['VITE_', 'MONO_']` (Rule V6 / N6), so only those prefixes
reach client code. Use them deliberately:

- **`MONO_…`** — the **only shared vars**. Anything one app must read from another
  (or the Host shares with Remotes). Read with `import.meta.env.MONO_*`. Keep keys
  unique per app (`MONO_NUXT_HOST_API_URL`, `MONO_NUXT_REMOTE_API_URL`) so they don't override
  each other when apps are layered.
- **`VITE_…`** — app-private client config (standard Vite).
- **no prefix** — build/tooling-only secrets. Stay in `process.env` for the command,
  never shipped to the browser.

::: warning Don't commit real secrets
`.env` / `.env.dev` hold real values and must **not** be committed. Commit a
`.env.example` with empty keys instead (the templates already ship one). See
[Environment](../repo/env) for the full load order and flags.
:::

#### Non-secret config → `mono.env.ts`

A base URL isn't a secret — hiding it in `.env` just means a dev can forget to push
it and the app breaks. Put non-secret, per-environment values in a committed
**`mono.env.ts`** at the app root: an `env` object keyed by `NODE_ENV`, plus the
resolved `appEnv`. It's checked in, **merges across the host+remote `extends` chain**,
and any consumer can import it — including the Node OData codegen
(`odata2ts.config.ts`), which can't import `mono.config.ts` (it would pull in the
`@mono-host` alias, `@mono-lit/devextreme`, and the generated DTO).

```ts
// mono.env.ts
import { resolveEnv } from '@mono-lit/utility/config'

export const env = {
  default:    { API_BASE_URL: 'https://api.dev.example.com' },
  production: { API_BASE_URL: 'https://api.example.com' },
}
export const appEnv = resolveEnv({ env })
```

- **At load time** (`mono.config.ts`, `odata2ts.config.ts`) import `appEnv` and read
  the value — e.g. `fetching.api.main.url = String(appEnv.API_BASE_URL)`. Pass `env`
  to `defineConfig` too, so it merges and is exposed.
- **At runtime** (component / store) use `monoEnv('API_BASE_URL')`.
- Selection is by `NODE_ENV` — each env file should set it (`.env.dev` →
  `development`, `.env` → `production`); `env.default` is the fallback.
- Values must be **scalars** and **non-secret** — they ship to the browser bundle.
- Don't call `monoEnv()` inside the `fetching` literal (it resolves before mono
  inits → empty); use `appEnv` / `resolveEnv` at load time there.

See [Environment → Config env object](../repo/env#config-env-object-non-secret-values).

#### Dev-only knobs → the build config

`PORT` and `VITE_HTTPS` are dev-server-only, so they're **hardcoded in the build config, not
in `.env`**. Where exactly depends on your language — **Rule V6** (Vue: a `const` in
`vite.config.ts`) or **Rule N6** (Nuxt: `devServer.port`).

### 8. Unique exports & store keys — suffix with the app name

> **When:** always — every store / composable you create.
> **Do:** suffix the export name *and* the `defineStore` key with the app name.
> **Don't:** ship a generic name like `useAuth` or a key like `'auth'`.

Stores and composables are **auto-imported** (Rule 1), which means a Host and every
Remote share **one global namespace**. Two apps that export the same name — or two Pinia
stores that use the same `defineStore` key — collide **silently**: only one survives, and
you end up calling the wrong code or reading the wrong state with no error to warn you. So
make every auto-imported **export name** and every **store key** unique by suffixing it
with the app name.

#### Pinia stores — unique variable *and* unique key

A store in `stores/` has two identifiers, and **both** must be unique:

```ts
// ❌ generic — collides with the Host or another Remote
export const useAuthStore = defineStore('use-my-fetch-auth', () => {
  const data = ref()
  return { data }
})

// ✅ both the export and the key carry the app name
export const useAuthStoreMonoVue = defineStore('use-my-fetch-auth-mono-vue', () => {
  const data = ref()
  return { data }
})
```

- **The export variable** (`useAuthStore…`) is auto-imported globally. If a Remote and the
  Host both export `useAuthStore`, auto-import resolves to **one of them** — you may call a
  completely different store than you meant to.
- **The `defineStore` key** (`'use-my-fetch-auth…'`) is how Pinia stores global reactive
  state. Two stores sharing a key share the **same state slot**: if both declare
  `const data = ref()`, the `data` you read is whichever store registered first — the other
  is silently overridden. This is the dangerous one, because the app still runs.

Use the pattern: variable `useAuthStoreAppName`, key `'your-key-name-app-name'`.

#### Composables & utils — unique export name too

The same applies to anything auto-imported from `composables/` (Rule 10) — the
top-level **export** must be unique, so suffix it with the app name:

```ts
export const useHostHelper = () => { /* … */ }   // Host
export const useUtilsHost  = () => { /* … */ }   // Host
// in a Remote, the mirror: useHelperMonoVue, useUtilsMonoVue, …
```

Rule of thumb: **if it's auto-imported, its name (and a store's key) must be globally
unique — append the app name.** Generic names like `useAuth`, `useUtils`, or a key like
`'auth'` are landmines across a Host + its Remotes.

### 9. Static data lives in `datas/`

> **When:** you have static / constant data (config, option lists, column defs, sample rows).
> **Do:** put it in `datas/` (`src/datas/` in Vue, `app/datas/` in Nuxt), grouped, with one `export default` per group.
> **Don't:** inline it in a page / component / store, or scatter named exports.

Any static / constant data — config objects, option lists, lookup maps, column
definitions, labels, sample rows — goes in **`datas/`** inside your source dir (`src/` in Vue,
`app/` in Nuxt — Rules V2 / N2). Never inline it in a
page, component, or store. Static data tends to be large and turns into a mess when
it's scattered or passed around as props, and it's almost always shared across more
than one component — keeping it in one place keeps it reusable and out of the way.

**Group it, and expose one `export default` per group** so consumers do a single
import. A long list of named imports — `import { static1, day, am } from '...'` —
is painful to maintain. Instead, put each piece in its own leaf file, then collect
them in an `index.ts` that default-exports one object.

```
src/
└── datas/
    └── table/
        ├── users.ts                  # each leaf: `export default { ... }`
        ├── products.ts
        ├── orders.ts
        ├── invoices.ts
        ├── customers.ts
        └── index.ts                  # groups the leaves + export default
```

`src/datas/table/index.ts` — group, then default-export:

```ts
import users from './users'
import products from './products'
import orders from './orders'
import invoices from './invoices'
import customers from './customers'

const config = {
  users,
  products,
  orders,
  invoices,
  customers,
}

export default config
```

Now a consumer imports the whole group once and reaches into it by key:

```ts
import table from '@/datas/table'

table.orders     // → the orders table config
table.invoices   // → the invoices table config
```

As with everything else, type the data (and put any reused shapes in `types/`,
per Rule 16).

### 10. Shared utilities go in `composables/use-utils.ts`

> **When:** you write a genuinely global / reusable helper (not tied to one feature).
> **Do:** put it in `composables/use-utils.ts` (or a split-out file re-exported from it).
> **Don't:** use it for feature-specific helpers — those stay in that feature's `use-<name>-utils.ts` (Rule 16).

When you have a reactive helper, a common utility, or a reusable bit of behavior that
should be available **globally** (used across features, not tied to one page), put it
in `composables/use-utils.ts`. Everything in `composables` is auto-imported
(Rules V1 / N1), so it's usable anywhere with no import line.

- This is for **genuinely shared / global** helpers. Feature-specific helpers still
  belong in that feature's own `use-<name>-utils.ts` (Rule 16).
- If a group of utilities grows large, give it its **own file** in
  `composables/` and re-export it through `use-utils.ts`, so consumers still
  reach everything from one place.

The example below shows the Vue layout (`src/`); a Nuxt app uses `app/composables/` — and
must have the folder opted into `imports.dirs` (Rule N2).

```
src/composables/
├── use-utils.ts          # global helpers — auto-imported everywhere
└── use-date-utils.ts     # split out when a group grows; re-exported by use-utils.ts
```

```ts
// src/composables/use-utils.ts
export * from './use-date-utils'   // pull a large, split-out group back in

// `ref` is auto-imported — no import needed
export function useToggle(initial = false) {
  const on = ref(initial)
  const toggle = () => (on.value = !on.value)
  return { on, toggle }
}
```

### 11. Component flavor — light DOM in a Vue app, shadow in a Nuxt (SSR) host

> **When:** building UI with `mono-*` components (pairs with Rule 14).
> **Do:** in a **Vue** app (host or remote) use the default **light-DOM** build (`import '@mono-lit/helper/ui/<c>'`); in a **Nuxt** host use the **shadow-DOM** build (`import '@mono-lit/helper/ui/shadow/<c>'`) so SSR paints the real component.
> **Don't:** ship light-DOM components as the primary UI of a Nuxt/SSR host (skeleton delay + reflow on hydration); hand-wrap shadow components when `@mono-lit/helper/nuxt` already auto-wraps them.

Every `mono-*` component ships in **two builds**, and which one you reach for is decided by your
app's template language — because it comes down to whether the app server-renders:

| Your app | Build | Import | Tag | Rule |
| --- | --- | --- | --- | --- |
| `type: 'vue'` — Vue host **or any remote** | **light DOM** | `@mono-lit/helper/ui/<c>` | `<mono-<c>>` | **V5** |
| `type: 'nuxt'` — the Nuxt host | **shadow DOM** (SSR) | `@mono-lit/helper/ui/shadow/<c>` | `<mono-<c>>` (auto-wrapped) | **N5** |

Why the split: a Vue SPA hydrates on the client, so there is no server paint to protect and light
DOM is the simplest, smallest path. A Nuxt host **does** server-render, and the shadow build emits
Declarative Shadow DOM so the browser paints the **fully-styled component on the first response** —
no skeleton delay, no unstyled flash, no reflow when Lit hydrates.

Rule of thumb: **Vue → light; Nuxt host → shadow.** Note the asymmetry that catches people out — a
**Vue remote stays light even under a Nuxt host** (it is still a client-rendered Vue island); the
shadow build is only for the Nuxt host's own server-rendered shell and pages. So a single running
page can legitimately contain both. That Nuxt-host + Vue-remote combination is the **hybrid
pairing** — still possible, but outside the same-framework standard and at your own risk
([Setup](../repo/setup)).

Everything else about using the component (props, events, theming via CSS variables) is identical
either way — see Rule 14. For the mechanics of each build — the exact import, whether you write the
tag yourself, and the SSR wrapper — go to **Rule V5** or **Rule N5**.

### 12. Data fetching — always use `@mono-lit/utility/fetching`

> **When:** always — any data access.
> **Do:** use `@mono-lit/utility/fetching` (`monoCreateFetcher` + a DataSource for lists/tables); for one row, reuse a source you already hold via `load({ take: 1 })`.
> **Don't:** add an external HTTP lib; build a **second fetcher** (`monoFetchOdata` / another `monoCreateFetcher`) for a detail/related row you could read from a DataSource you already hold; or use `dataSource.store().byKey()` for a single record.

**All data access goes through `@mono-lit/utility/fetching`.** Never introduce an external
HTTP library (axios, ofetch, ky, a raw `fetch` wrapper, …). The mono helpers already
resolve the base URL, token / JWT, headers, and OData source from `mono.config.ts`
(Rule 5) — bypassing them breaks auth and the shared config.

Two things to do when fetching enters the picture:

- **New base URL → add it to `mono.config.ts` first.** If the user gives a base URL
  that isn't already a named entry under `fetching.api`, add it there, then consume
  it by name with `configBaseUrl: '<entry>'`. That keeps URLs centralized and shared
  so **both Host and Remote** can use them — don't hardcode a one-off `baseUrl` for
  something reusable.
- **New page → ask if it should be deployable.** When you plan a new page (Rule 16),
  ask the user: should this feature be visible to the other Host/Remote — i.e.
  registered in `mono.config.ts` `menu` so it shows in the nav — or is it still in
  development and should stay out of the menu for now?

#### `monoCreateFetcher` + a DataSource is the standard

`monoCreateFetcher` is the all-in-one fetch solution — make it your default for list
and table data. It returns a reactive **DataSource**, and that DataSource is how you
should hold and re-query server data. Why:

- One call gives a **live handle**, not a dead snapshot — it already knows its base
  URL, token, and OData source from `mono.config.ts`.
- You fetch **once**, keep the DataSource in a `ref`, and re-query through that same
  source — filter, search, sort, change `select`. You never build a second fetcher.

```ts
// (per Rule 16 this lives in the store)
const usersSource = ref<any>(null)

onMounted(async () => {
  const { dataSource } = await monoCreateFetcher({
    configBaseUrl: 'myOdata',
    url: '/Users',
  }).response({ options: { select: ['Id', 'Name'], paginate: true, pageSize: 20 } })

  usersSource.value = dataSource
})

// later — need a different slice? reuse the same source, no new fetcher:
await usersSource.value.store().load({ filter: ["contains(Name,'jo')"], select: ['Id', 'Name'] })

// need one row (e.g. a DETAIL view) while the source is bound to a grid/select?
// query its STORE so the bound list isn't disturbed — and do NOT build a 2nd fetcher:
const [detail] = await usersSource.value.store().load({
  filter: ['Id', '=', id], expand: ['Role'], select: ['Id', 'Name', 'Role'], take: 1,
})

// the source is NOT bound to a live component? dataSource.load() is fine too:
const [one] = await usersSource.value.load({ filter: ['Id', '=', id], take: 1 })
```

::: danger Single record → reuse the source, never a 2nd fetcher or `byKey()`
Already holding a DataSource (a list/table you fetched)? To read one row from it —
a detail view, a related record — **reuse that same source**; don't reach for a fresh
`monoFetchOdata` or another `monoCreateFetcher`. That's the whole point of the live
handle: one source, re-queried.

- **Source is bound to a live component** (grid / `mono-select`): query its **store** —
  `source.store().load({ filter: ['Id','=',id], take: 1, expand, select })`. This runs a
  one-off query **without** disturbing the bound list's paging/filter/sort.
- **Source is not bound to anything:** `source.load({ filter: ['Id','=',id], take: 1 })`
  is fine too.
- **Never** `dataSource.value.store().byKey(id)` — once the source is bound, `byKey`
  caches against the already-loaded data and can return a **stale** row (or nothing).

See [DataSource](../odata/datasource).
:::

Bind that DataSource straight to `mono-select`, `mono-tag-input`, or a `controlMonoTable`
table — see [DataSource](../odata/datasource).

::: warning One DataSource per purpose
A DataSource is a single **live, shared** instance. If you bind the _same_
DataSource to two components — say a `mono-select` and a `mono-tag-input` — they
share its state, so filtering, sorting, or paging from one **also changes the
other**. Create a separate DataSource (its own `monoCreateFetcher` call) for each
component / purpose. Reuse the same source only when you genuinely want the two
views kept in sync.
:::

#### OData: select only what you need

With OData you shape the response, so **`select` only the fields the screen actually
uses**. Before adding a field, find the reason it's needed; if there isn't one, ask
the user. Example: a table renders `Id` and `Name` — does it really need
`Description`? If nothing displays or filters on it, leave it out (smaller payload,
faster load). Work out the reason first, then ask.

#### What's in `@mono-lit/utility/fetching`

| Export | What it does |
| --- | --- |
| `monoFetch` | Plain REST fetch. Resolves base URL (`configBaseUrl` or `baseUrl`), token, and headers. |
| `monoFetchOdata` | OData fetch — shape the result via `options` (`select`, `filter`, `sort`, `paginate`…). Returns `{ data, dataSource, statusCode, error }`. |
| `monoFetchOdataUnique` | Like `monoFetchOdata`, but collapses concurrent identical requests (`unique`). |
| `monoCreateFetcher` | **All-in-one** builder → a reactive OData **DataSource**. The default for list / table data. |
| `monoStaticDataSource` | Wrap a static array as an OData-style DataSource. |
| `monoTryCatchDatasource` | Safe load wrapper around a DataSource (handles errors / notifications). |
| `monoLoadChuckStores` | Load a store in batched chunks. |
| `monoConfigureFetching` / `monoResetFetchingConfig` | Set / reset runtime fetch options (notif, token, base-URL overrides, and `unauthCall` — where to send the user when a token expires and the refresh can't save it; it needs the router, so it can't live in `mono.config.ts`). |
| `monoFetchingRuntime` | Inspect the resolved runtime (base URLs, source, token) for a `configBaseUrl`. |
| `monoRestBaseUrl` / `monoOdataBaseUrl` / `monoOdataSource` / `monoRequestToken` | Low-level resolvers (REST/OData base URL, OData source ctors, request token). Rarely needed directly. |

See [Data Fetching](../repo/data-fetching) for full call examples and [DataSource](../odata/datasource)
for binding a DataSource to components.

### 13. OData URL → generate typed classes with `odata2ts`

> **When:** the user gives you an OData URL, or you consume an OData entity.
> **Do:** generate classes with `odata2ts`, then map them with `MonoOdataMapTypes` in `types/odata.d.ts`.
> **Don't:** hand-write the entity interfaces, or edit the generated `odata/<Key>/` output.

When the user hands you an **OData URL** (or asks you to consume an OData entity),
**never hand-write the entity interfaces**. Generate them from the service's
`$metadata` with **`odata2ts`**, then map the output to plain types. This keeps the
shapes correct and in sync with the backend.

The flow, in short:

1. **Configure the service** in `odata2ts.config.ts` — each entry's **key is unique**
   and becomes the folder name under `odata/<Key>`. One config can hold many OData
   sources (one key/folder each).
2. **Generate** with `pnpm odata:gen` — it writes the Q-objects, models, and services
   into `odata/<Key>/`. That output is **generated — never hand-edit it (Rule 4)**.
3. **Map to usable types.** The generated output is raw **query-object classes**, not
   plain shapes. In `types/odata.d.ts`, wrap each with `MonoOdataMapTypes<typeof
   Q...>` (from `@mono-lit/utility/runtime`), importing the Q-object through the app's **own resolve
   alias** — `@mono-vue/odata/...` in a Remote, `@mono-host/odata/...` in the Host
   (Rule 2). The alias already resolves `src/` vs `app/` for you.
4. **Use the mapped types across the app** — in store state, fetch generics, and table
   columns. They're safe and shared.

If the OData base URL is new, it's also an env var (`MONO_…`, Rule 7) and a
`fetching.api` entry (Rules 5 / 12).

See [OData Types](../odata/types) for the full step-by-step with real examples.

### 14. UI — reach for `@mono-lit/helper/ui` first

> **When:** building any UI.
> **Do:** go top-down — `<mono-*>` component → its `.mono-*` CSS → UnoCSS → native CSS in `assets/`.
> **Don't:** write custom markup/CSS when a `mono-*` component already covers it.

Build UI with the shared library before writing anything custom. Follow this
priority top-to-bottom, and only drop to the next level when the current one
genuinely can't do the job:

1. **mono-ui Lit component** — the web components from `@mono-lit/helper/ui/*`
   (`<mono-button>`, `<mono-input>`, `<mono-select>`, …). Import the subpath
   (`import '@mono-lit/helper/ui/button'`) and use the tag — in a Nuxt host, the shadow
   subpath instead (Rules 11, V5, N5). This is the default for
   anything that has a matching component.
2. **mono-ui native (CSS only)** — when you must hand-build the markup, reuse the
   component's **`.mono-*` CSS classes** and assemble the element yourself. Same
   look, full control over the DOM.
3. **UnoCSS utilities** — no suitable mono-ui for a very custom layout/style? Use
   UnoCSS utility classes.
4. **Native CSS (last resort)** — UnoCSS still can't express it? Write plain CSS and
   **store it in `assets/`** in its own, specifically-named file (e.g.
   `assets/brand-report.css`), then import it **only into the page that needs
   it**. Don't scatter ad-hoc global `<style>` or dump rules into shared files.

See [Mono-UI → Getting started](/ui/getting-started) for install and usage, and the
per-component pages for the available tags and their props.

> **Loading states:** every mono element has a `pending` prop that draws a skeleton measured
> from its real DOM (optional peer `@aejkatappaja/phantom-ui`; automatic in an SSR app, manual
> with `:pending="busy"` anywhere). Reach for it before writing a placeholder of your own —
> [Addons → Skeleton](/addons/skeleton).

### 15. External utilities — reach for `useMonoUtility` helpers first

> **When:** you need validation, notifications, list add/update/remove, OData filters, or JSON parsing.
> **Do:** destructure from `useMonoUtility()` (imported from `@mono-lit/utility/runtime`).
> **Don't:** hand-roll these; and don't use them for fetching (that's Rule 12).

Before you hand-roll **form validation, notifications, list add/update/remove, OData
filter strings, or JSON parsing**, stop — there's almost certainly a ready-made,
battle-tested helper for it in **`useMonoUtility`** (the shared helper surface in
`@mono-lit/utility`). Don't reinvent these; the shared helpers handle the awkward
edge cases (nested schema errors, `@odata.*` metadata cleanup, double-wrapped JSON) you'd
otherwise rediscover.

These helpers cover, broadly:

- **Validation** (Yup) — validate a whole form or a single field, and clear errors.
- **Notifications** — one unified `notif()` for success / info / warning / error / promise
  (render them with `MonoNotivue` in the app shell).
- **Data manipulation & filtering** — upsert/remove rows in arrays or DataSources, build
  OData `in` filters, stringify DevExtreme filters to `$filter`.
- **JSON & misc** — safe parse, JSON / date type guards.

#### How to use them

Import `useMonoUtility` from `@mono-lit/utility/runtime` — the same entry as `monoJwt` /
`createMono` — and destructure what you need:

```ts
import { useMonoUtility } from '@mono-lit/utility/runtime'
const { validateAllSchema, notif, replacerData } = useMonoUtility()
```

A project may still re-spread it into a local auto-imported composable
(`composables/use-helper.ts`) if it wants a single project-wide helper.

::: warning Fetching stays on `@mono-lit/utility/fetching`
`@mono-lit/utility` also ships fetching / datasource helpers, but **data access still goes
through `@mono-lit/utility/fetching` (Rule 12)** — that's the standard path here.
:::

See [Useful Utils](../repo/useful-utils) for the full list of helpers, signatures, and what
each one does.

### 16. Building a new feature — separate the code

> **When:** building a feature or page — the synthesis step that uses Rules 1–15.
> **Do:** split into layers — thin page, components, Pinia store (logic+fetching), composable helpers, `.d.ts` types.
> **Don't:** dump everything in one file, or put business logic / fetching in the page.

This is the last rule on purpose: by here you understand the machine, the conventions,
and the capabilities. Building a feature just **composes** them.

When asked to build a feature or page (say a **Brand / Master** screen), never dump
everything into one file. Split it across these layers so logic stays reusable and
the page stays readable.

**1. Ask for the page name first.** Before creating anything, ask the user what the
page/route should be named (e.g. `brand`). Don't assume a name.

**2. Create the page as a thin entry** at `pages/<name>.vue`. The page is
presentational: markup plus wiring to the store. No business logic, no fetching,
no heavy computation inline — it only renders UI and reads from / calls the store.

**3. Extract components when the page grows.** If a page gets large (~500
lines) or contains markup that repeats or could be reused, pull those chunks into
their own focused components under `components/<name>/`. Keep each file small
and single-purpose.

**4. Put all logic in a Pinia store** at `stores/use-<name>.ts`. Everything that
isn't markup lives here and is globally reusable: reactive state (`ref` / `reactive`),
`computed`, watchers, plain functions, and **fetching**. Pages and components only
read from or call into the store. Use the project's fetch helpers from
[Data Fetching](../repo/data-fetching) — `monoFetch`, `monoFetchOdata`, `monoCreateFetcher`.

**5. Move generic helpers into a composable** at `composables/use-<name>-utils.ts`.
Pure, reusable functions that might be needed again later go here. These are usually
consumed only by the store (`use-<name>.ts`).

**6. Always TypeScript, with types in `.d.ts`.** Every file is typed. Whenever the
store holds typed reactive data — e.g. `const data = ref<Brand[]>()` — declare that
type in `types/<name>.d.ts` and import it. Don't inline complex shapes ad-hoc.

#### Layout

The tree below is a **Vue** app (`src/`, Rule V2). In a **Nuxt** app the identical layers live
under `app/` (Rule N2) and the page is a route the same way — only the root folder changes.

```
src/
├── pages/
│   └── brand.vue                 # thin page — UI + store wiring only
├── components/
│   └── brand/                    # extracted, reusable pieces (when the page grows)
│       └── BrandTable.vue
├── stores/
│   └── use-brand.ts              # ALL logic: state, computed, fetching, functions
├── composables/
│   └── use-brand-utils.ts        # generic helpers, usually used by the store
└── types/
    └── brand.d.ts                # types for the store's reactive data
```

#### Each layer, in short

**`src/types/brand.d.ts`** — the shape, declared once and shared.

```ts
export interface Brand {
  id: string
  name: string
  active: boolean
}
```

**`src/stores/use-brand.ts`** — all state, fetching and logic; globally reusable.

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { monoFetch } from '@mono-lit/utility/fetching'
import type { Brand } from '@/types/brand'
import { sortByName } from '@/composables/use-brand-utils'

export const useBrand = defineStore('brand', () => {
  const data = ref<Brand[]>([])
  const loading = ref(false)

  const activeBrands = computed(() => data.value.filter((b) => b.active))

  async function load() {
    loading.value = true
    const res = await monoFetch<Brand[]>('/brands', { configBaseUrl: 'MyApi', method: 'GET' })
    data.value = sortByName(res.data ?? [])
    loading.value = false
  }

  return { data, loading, activeBrands, load }
})
```

**`src/composables/use-brand-utils.ts`** — generic, reusable helpers.

```ts
import type { Brand } from '@/types/brand'

export function sortByName(rows: Brand[]): Brand[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}
```

**`src/pages/brand.vue`** — thin: read the store, render UI.

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useBrand } from '@/stores/use-brand'

const brand = useBrand()
onMounted(() => brand.load())
</script>

<template>
  <section>
    <mono-input label="Search" />
    <!-- when this grows, move the table into components/brand/BrandTable.vue -->
    <ul>
      <li v-for="b in brand.activeBrands" :key="b.id">{{ b.name }}</li>
    </ul>
  </section>
</template>
```

The takeaway: **pages render, stores think, composables provide reusable helpers,
and types live in `.d.ts`.** There's no rigid flow beyond that — build what the
feature needs, but keep it in these layers.

### 17. MONO Skills — read shared knowledge, save the session

> **When:** before non-trivial work (read what's already known), and after meaningful work (save what you learned). **Only when `mono.config.ts` has a `skill` key.**
> **Do:** `mono skills check` once; `read` / `search` the app's knowledge before complex work; after meaningful work, stage the session and `mono skills save`, then report the saved `repoPath`.
> **Don't:** touch git/GitHub directly for this, bypass the `mono skills` CLI, print a token, save under a generic app name, or claim a save succeeded unless the result is `{ "success": true }`.

Apps live in separate repos, so what one session learns is invisible to the next — and to
the other app. **MONO Skills** is the shared brain: a git repository **the user owns**,
chosen per app in `mono.config.ts`, holding each app's **knowledge**, reusable **skills**,
**decisions**, and AI **session history**, reached only through the `mono skills` CLI.
Full reference: [Skills (for AI)](./skills).

```ts
// mono.config.ts — the presence of `skill` IS the switch
skill: { url: 'https://github.com/my-org/app-knowledge.git', envToken: 'APP_KNOWLEDGE_TOKEN' }
// or a branch + subfolder:  url: 'https://github.com/my-org/monorepo/tree/mono/knowledge'
```

It's **opt-in and off by default** — without `skill`, every repo command returns
`{ "skipped": true, "reason": "MONO_SKILLS_NOT_CONFIGURED" }`. When it's off, do your normal
work and skip the whole workflow; it must **never block, delay, or change the primary task**.
Never add `skill` to a config yourself — that's the user's decision (Rule 5).

#### The loop

```bash
mono skills check                                # confirm config + access once (never prints a token)
mono skills read   --app <id> --type knowledge   # ground yourself before complex work
mono skills search --app <id> --query "<topic>"  # only when relevant
# …do the user's task…
# stage the session under .mono/skills/pending/<id>/ (metadata.json, summary.md, …)
mono skills save --app <id> --dir .mono/skills/pending/<id>   # one commit, pushed (--dry-run to validate)
```

On success the CLI returns `{ "success": true, "repoPath": "…", "commit": "…" }` — **report
that path**. On failure it preserves the staging under `.mono/skills/failed/` for
`mono skills retry`. `.mono/skills/` is local only (staging + a working clone of the repo;
gitignored, part of the `.mono/` convention — see [Sync](../repo/sync)); the permanent
store is the user's repository.

Access is **git first**: the machine's own credentials, then — only on a *no access*
failure — the token named by `skill.envToken`. You never handle either; `check` tells you
which one worked (`transport`), and whether you can push (`canPush`).

::: warning Rename the app first — generic names are skipped
While the app still uses a default template name (`mono-host`, `mono-vue`,
`mono-nuxt-host`, `mono-vue-remote`), `save` / `retry` are **skipped**
(`reason: "MONO_SKILLS_GENERIC_APP_NAME"`) so history isn't filed under a placeholder id.
Rename it first (Rule 1 → _Confirm the app name_).
:::

::: danger Through the CLI only — and never fake it
Use `mono skills` **only**; never call the GitHub API / `git` / `gh` directly for this
workflow, never target another repo, and never print or pass a token. A second-pass
redaction strips secrets from anything saved — but don't stage secrets / `.env` values
in the first place. Only claim success on `{ "success": true }`, and never hide from the
user that session history was saved.
:::

**Save** for meaningful work — code changes, bug investigations, architecture / DB / API
changes, business-rule clarifications, config / security changes, reusable findings
(including useful failures). **Don't save** greetings, trivial fixes, or cancelled work
with no conclusion.

## Common Rules: Vue

> **Read this section when** `mono.config.ts` says `type: 'vue'`.

That covers **a Vue Host and its Vue Remotes** — under the standard, the Host and its Remote
share the same framework. So in a Vue-Host + Vue-Remote pair, both apps read this section.
The Nuxt-Host + Vue-Remote pair is the **hybrid** — still possible but risky (see
[Setup](../repo/setup)): there the Host reads [Nuxt](#common-rules-nuxt) and the Remote
reads this section, with the extra wiring in **Rule V7**.

These rules sit **on top of** the General rules; they never replace them.

### V1. `vite.config.ts` is the core — one `monoRepo()` call wires it

> **When:** always be aware of it; act only when a change to build wiring seems needed.
> **Do:** get the mono wiring from `const mono = await monoRepo({ command })`, and register `mono.vite()` **last**.
> **Don't:** hand-write `resolve.alias` / `server.fs.allow` / `__MONO_CONFIG_EXPOSE__`, or rewire any of it without asking (Rule 1).

A Vue app's infrastructure lives in **`vite.config.ts`**, and the whole mono side of it is a
single call — **`monoRepo()`** from `@mono-lit/utility/vite`, the Vite twin of the `@mono-lit/utility/nuxt`
module:

```ts
// vite.config.ts — the mono core. THE SAME FILE in a Host and in a Remote.
import { monoRepo } from '@mono-lit/utility/vite'

export default defineConfig(async ({ command }) => {
  const mono = await monoRepo({ command })

  return {
    envPrefix: ['VITE_', 'MONO_'], // Rule V6
    plugins: [
      VueRouter(mono.pages.options()),
      AutoImport(mono.autoImport.options({ imports: ['vue', 'vue-router', /* … */] })),
      Components(mono.components.options()),
      Layouts(mono.layouts.options()),
      mono.vite(), // ← MUST be last
    ],
  }
})
```

You keep the real plugin imports; mono only supplies their options. That is not a style
choice — `vue-router` and the unplugins capture their dirs in a closure, so mono cannot inject
anything after construction. It hands you the object to construct **with**.

`monoRepo()` loads `mono.config.ts` once and resolves the `extends`-active apps, then gives you:

| From the handle | What it does |
| --- | --- |
| `mono.pages.options()` | `VueRouter()` options: own + federated page folders, plus `extendRoute` (which seeds `meta.layout` so `setupLayouts` can't wrap a page twice). If this app has its own `pages/index.vue` it owns `/`, so each federated app's root page is excluded automatically. |
| `mono.layouts.options()` | `Layouts()` options — see the role note below. |
| `mono.components.options()` / `mono.autoImport.options()` | The unplugin options: own dirs + federated. Auto-import covers `composables/`, `stores/` **and both `shared/` sub-dirs**, in this app and in every federated one. |
| `mono.vite()` | **Register last.** The Nuxt-compat transforms (added only when a federated app is `type: 'nuxt'` — Rule V7) plus `resolve.alias` (Rule 2), `__MONO_CONFIG_EXPOSE__`, `server.fs.allow` and dependency dedup. |
| `mono.ecosystem(subs)` | Raw federated dirs, **type-aware** (`nuxt` → `app/<sub>`, `vue` → `src/<sub>`). The long-hand escape hatch; taking dirs this way tells `mono.vite()` that plugin is yours, so it won't register a second one. |
| `mono.nuxt()` | Compat helpers, **only** when the app you extend is Nuxt — Rule V7. Normally derived for you. |
| `mono.alias` / `mono.apps` | The computed alias map and the extends-active `{ name, type }` list, if you need to read them. |

::: warning `mono.vite()` goes last, and your options win
Register it as the **final** plugin. Anything you pass to an `.options()` call overrides
mono's defaults — but `routesFolder` / `layoutsDirs` / `dirs` **replace** the whole list
rather than adding to it, so spread the default first if you mean to add:
`mono.components.options({ dirs: [...mono.components.options().dirs, 'src/widgets'] })`.
:::

**Layouts are the one thing that differs by role, and `mono.config.ts` declares it.** A
**Host** ships the shared shell, so it renders its own `layouts/` and takes **no** federated
ones — it says `template: 'host'`. A **Remote** has no shell of its own and consumes the
Host's, so it says `template: 'remote'` (or nothing, which is the default). Getting this
backwards is why a Remote renders without the Host's shell.

Nothing on disk can tell the two apart — an app with no `layouts/` looks identical either way
— which is why this one is declared rather than derived. It is **never inherited through
`extends`**: a Remote extending a Host does not pick up the Host's `template`, or it would
drop the very shell it exists to consume. To override for a single call, pass the plugin's own
option: `mono.layouts.options({ layoutsDirs: [...] })`.

::: tip This replaced a hand-written block
Older templates opened with `monoAlias()` + `getMonoConfig()` + `resolveExtendsAppNames`, then
repeated `monoEcosystem({ dirname, apps: activeApps, subs })` four times, and hand-wrote
`resolve.alias` / `define` / `server.fs.allow`. If you're looking at a `vite.config.ts` shaped
like that, it predates `monoRepo()`. Those exports still work, so **don't migrate it as a
side-quest** — but write new wiring the way above. See
[Template Changelog → Simplify Config](../repo/template-changelog).
:::

#### What each plugin gives you (DX)

These plugins are why `src/` code is so light — most of them mean **you don't write
imports**:

| Plugin | What it does |
| --- | --- |
| `@vitejs/plugin-vue` | Compiles `.vue` SFCs. `isCustomElement` lets `mono-`, `dx-` (and `ui5-` in a Remote) tags through untouched so the browser renders the web components. |
| `unplugin-auto-import` (`AutoImport`) | Auto-imports `vue`, `vue-router`, `@vueuse/core`, `pinia`, `unhead`, and **everything in `src/stores` and `src/composables`**. So `ref`, `computed`, `useRouter`, `defineStore`, and your own `useBrand()` work with **no import line**. Generates a `.d.ts` for type support (Rule V3). |
| `unplugin-vue-components` (`Components`) | Auto-registers components from `src/components` — drop a `.vue` there and use it in any template **without importing**. `directoryAsNamespace` turns the folder into a prefix (e.g. `components/brand/Table.vue` → `<BrandTable>`). |
| `vue-router/vite` (`VueRouter`) | File-based routing — a file in `src/pages` becomes a route automatically. No manual route table. |
| `vite-plugin-vue-layouts` (`Layouts`) | Wraps pages in layouts from `src/layouts`; `defaultLayout: 'default'`. |
| `unocss/vite` (`UnoCSS`) | Atomic utility-class CSS engine. Its scan config lives in **`uno.config.ts`** and **must reach the synced apps** through an absolute `content.filesystem` base — see the relative-glob warning in Rule 1. |

Each of those `dirs` / `routesFolder` lists gets its federated half from
`mono.ecosystem(...)`, as shown above — that's the one place remote dirs enter the build.

Host-only extras: `vite-plugin-vue-devtools` (the in-app Vue devtools) and
`@sentry/vite-plugin` (uploads source maps when `VITE_SENTRY_DSN` is set).
Remote-only extras: `vite-plugin-mkcert` (local HTTPS when `VITE_HTTPS=true`) and a
`server.proxy` for `/api` and `/odata` during dev.

### V2. Source lives in `src/`

> **When:** creating any file, or resolving where an existing one lives.
> **Do:** put source under `src/`; let auto-import cover `stores` / `composables` / `components`.
> **Don't:** create an `app/` folder (that's Nuxt — Rule N2), or expect `datas` / `types` / `odata` to be auto-imported.

`type: 'vue'` means this app's source root is **`src/`**. The folder names the General rules
refer to are all relative to it:

```
src/
├── pages/        # file-based routes (VueRouter)          — auto-routed
├── layouts/      # page layouts, defaultLayout: 'default' — auto-applied
├── components/   # auto-registered (directoryAsNamespace)  — no import line
├── composables/  # auto-imported (Rules 10, 8)             — no import line
├── stores/       # auto-imported Pinia stores (Rule 8)     — no import line
├── datas/        # static data (Rule 9)      — import via @<app-name>/datas
├── types/        # .d.ts shapes (Rule 16)    — import via @<app-name>/types
├── odata/        # generated OData (Rule 13) — import via @<app-name>/odata
├── assets/       # last-resort native CSS (Rule 14)
└── main.ts       # app bootstrap (Rule V4)
```

The three **not** auto-imported (`datas`, `types`, `odata`) are reached through the
`@app-name` alias — the reason why is Rule 2.

### V3. Generated files a Vue app never edits

> **When:** before touching any `*.d.ts` at the project root.
> **Do:** change the source (a store / composable / component / page) and let dev/build regenerate.
> **Don't:** hand-edit these — the edits are silently overwritten (Rule 4).

On top of the language-neutral list in Rule 4, a Vue app generates:

- `auto-imports.d.ts` — by `unplugin-auto-import`
- `components.d.ts` — by `unplugin-vue-components`
- `typed-router.d.ts` — by `vue-router` (its header literally says _"DO NOT MODIFY THIS FILE"_)

They're regenerated on every `pnpm dev` / `pnpm build`. Commit them, never edit them.

### V4. Register mono in `src/main.ts`

> **When:** wiring the app up, or debugging "mono state is empty".
> **Do:** `app.use(createMono(monoConfig))` in `src/main.ts`.
> **Don't:** add a server event resolver — that's Nuxt-only (Rule N4).

```ts
// src/main.ts
import { createMono } from '@mono-lit/utility/runtime'
import monoConfig from '../mono.config'

app.use(createMono(monoConfig))
```

A Vue app is client-only, so there is no server pass to hydrate cookies on — `createMono`
alone is the whole registration.

### V5. Use the light-DOM `mono-*` build

> **When:** using any `mono-*` component (the decision itself is Rule 11).
> **Do:** `import '@mono-lit/helper/ui/<c>'` and write `<mono-<c>>`.
> **Don't:** import the `@mono-lit/helper/ui/shadow/*` subpath or write `<mono-shadow-*>` in a Vue app.

```vue
<script setup lang="ts">
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'
</script>

<template>
  <mono-input label="Search" />
  <mono-button>Save</mono-button>
</template>
```

The component renders into the light DOM (no shadow root) and is styled by the global
`@mono-lit/helper` CSS the **Host** imports (Host template — a Remote never imports the theme).

**A Remote stays light even when its Host is Nuxt** (the hybrid pairing — possible but
risky, see [Setup](../repo/setup)). The Remote is a client-rendered island
inside the Host's server-rendered shell, so it gains nothing from the shadow/SSR build. Don't
"match the host" — match your own `type`.

### V6. Dev-only knobs live in `vite.config.ts`

> **When:** setting a port, local HTTPS, or the client env prefix.
> **Do:** hardcode them as a `const` / literal in `vite.config.ts` (Rule 7).
> **Don't:** read `PORT` or `VITE_HTTPS` from `.env`.

```ts
const PORT = 2020
// server: { port: PORT }, preview: { port: PORT + 1 }
// local HTTPS stays off unless you flip it: `false && mkcert({ … })`
// envPrefix: ['VITE_', 'MONO_']  — only these reach client code (Rule 7)
```

### V7. When the app you extend is Nuxt — `mono.nuxt()`

> **When:** the app you `extends` (normally your Host) has `type: 'nuxt'`.
> **Do:** nothing — `mono.vite()` reads `apps[].type` and wires both helpers for you.
> **Don't:** spread `mono.nuxt()` by hand unless you are maintaining a long-hand config, hardcode the host's `app/pages` path, or change this without asking (Rule 1).

A Nuxt app keeps its code under `app/`, its pages use `definePageMeta`, and its layouts render
`<slot/>` — none of which a Vue/Vite app can execute. **You no longer switch this on by
hand.** `mono.config.ts` already says whether a federated app is `type: 'nuxt'`, so
`mono.vite()` reads it and adds the compat transforms only then. That is what lets one
`vite.config.ts` serve a Nuxt federation and a Vue one unchanged:

```ts
// vite.config.ts — identical whether the app you extend is Nuxt or Vue
export default defineConfig(async ({ command }) => {
  const mono = await monoRepo({ command })

  return {
    plugins: [
      VueRouter(mono.pages.options()), // extendRoute already wired
      Layouts(mono.layouts.options()),
      mono.vite(), // ← adds the compat transforms iff a federated app is `nuxt`
    ],
  }
})
```

The transforms declare a hook-level `order: 'pre'`, so they beat `VueRouter` and `vue()`
wherever `mono.vite()` sits in the array — the old "spread it BEFORE `VueRouter`" convention
is no longer something you can get wrong.

The long-hand form still works, and is what an older template looks like:

```ts
plugins: [
  ...mono.nuxt().hostResolver(), // marks compat as yours, so mono.vite() skips it
  VueRouter({
    routesFolder: [{ src: 'src/pages' }, ...mono.ecosystem('pages')],
    extendRoute: mono.nuxt().extendRoute(),
  }),
  mono.plugin, // ← last
]
```

- **`hostResolver()`** returns the `Plugin[]` that makes synced Nuxt code runnable: strips the
  `definePageMeta({…})` macro, rewrites a remote layout's default `<slot/>` to
  `<router-view/>` (so `setupLayouts`' nested routes render the page), resolves Nuxt's
  `useState()` / `clearNuxtState()` to the `@mono-lit/utility/runtime` shim, rewrites `<NuxtLink>` to
  `<RouterLink>`, and defines `import.meta.server` / `import.meta.client`. Each rewrite can be
  switched off — `mono.vite({ nuxtCompat: { nuxtLink: false } })`, or the same options on
  `hostResolver()` in a long-hand config.
- **`extendRoute()`** is the `VueRouter({ extendRoute })` callback that parses `{ layout, title }`
  out of a synced page's source so `setupLayouts` wraps it. Pages using `definePage` are read
  natively by vue-router and skipped.

::: tip Nuxt federation only — and it decides for itself
For a **Vue** federation the rewrites have nothing to do (those pages use `definePage`
natively and those layouts already render `<router-view/>`), so `mono.vite()` leaves them
out. Force it either way with `mono.vite({ nuxtCompat: true | false })`.
:::

Set the other app as `apps[].type: 'nuxt'` in `mono.config.ts`; `mono prepare` then points
`@mono-host/*` at its `app/*` (not `src/*`) in the generated `.mono/tsconfig.json`
automatically (Rule 2). Everything else in your app is unchanged — you still write `src/`,
still use the light build (V5). See [Setup](../repo/setup).

_(The standalone `monoNuxtHost` / `monoExtendRoute` exports from `@mono-lit/utility/vite` still work
and take the same options; `mono.nuxt()` is the current surface.)_

## Common Rules: Nuxt

> **Read this section when** `mono.config.ts` says `type: 'nuxt'`.

A Nuxt app is a **Host** or a **Remote**, decided by `template` in `mono.config.ts`. Almost
everything below applies to both — a Nuxt Remote is a full Nuxt app, not a fragment. These
rules sit **on top of** the General rules; they never replace them.

Where the two differ:

| | Nuxt Host (`template: 'host'`) | Nuxt Remote (`template: 'remote'`) |
| --- | --- | --- |
| owns `app/layouts/`, `app/app.vue` | yes | no — inherits the Host's |
| owns `app/pages/index.vue` | yes (it owns `/`) | no — `/` is the Host's login page |
| `apps[]` | its Remotes | the Host it extends |
| how the other app is merged | Nuxt layer — a Vue Remote here would be the risky hybrid, merged by mono's compat instead | Nuxt layer (Host is Nuxt) |

A Nuxt Remote's `nuxt.config.ts` is **identical to a Host's**. `@mono-lit/utility/nuxt` reads
`apps[]` and registers each `type: 'nuxt'` app as a native Nuxt layer, so Nuxt merges the
Host's `pages`/`layouts`/`middleware`/`plugins`/`components` with its own cross-layer
rules — and a file the Remote ships wins over the Host's of the same name.

The headline difference: a Nuxt app **server-renders**. That's what drives the shadow-DOM
component build (N5) and the plugin-based registration (N4).

### N1. `nuxt.config.ts` is the core — there is no `vite.config.ts`

> **When:** always be aware of it; act only when a change to build wiring seems needed.
> **Do:** treat `nuxt.config.ts` as read-only; let the two mono modules do the wiring.
> **Don't:** create a `vite.config.ts`, or hand-list aliases / `server.fs.allow` (they're injected).

A Nuxt Host has **no `vite.config.ts`**. The same fixed infrastructure lives in
`nuxt.config.ts`, driven by two modules and a `mono` key:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
  mono: { utils: {}, helper: {} },
  modules: ['@mono-lit/utility/nuxt', '@mono-lit/helper/nuxt', /* …unocss, pinia, vueuse… */],
  // nested shared/ dirs aren't scanned by default — opt them in (Rule N2)
  imports: { dirs: ['composables', 'composables/**', 'stores', 'stores/**'] },
  vite: { envPrefix: ['VITE_', 'MONO_'] },  // Vite-only tweaks go under `vite` (Rule N6)
})
```

What the two modules give you:

| Module | What it injects |
| --- | --- |
| `@mono-lit/utility/nuxt` | the `@<app-name>` aliases, `server.fs.allow` for `.mono/apps`, the `__MONO_CONFIG_EXPOSE__` define, and the ecosystem merge — everything a Vue app wires by hand in `vite.config.ts` |
| `@mono-lit/helper/nuxt` | the base `@mono-lit/helper` CSS, the `mono-*` `isCustomElement` rule, the lit dedupe / `optimizeDeps` entries, and — only while the app server-renders (`ssr: true`) — the SSR plumbing (`monoSsr`: the `<ClientOnly>` wrap of light tags, the server import stub, and the auto-wrap behind Rule N5). In an `ssr: false` app that plumbing is skipped automatically (`mono.helper.clientOnly` overrides) |

So the three Host ↔ Remote links of Rule 1 map onto Nuxt like this:

| Vue (`vite.config.ts`) | Nuxt (`nuxt.config.ts`) |
| --- | --- |
| `mono.ecosystem(...)` + the plugins (from `monoRepo()`) | the `modules` array + `mono` key — they discover and wire the other app's pages/components/stores for you |
| `mono.plugin` → `resolve.alias` | injected by `@mono-lit/utility/nuxt` — not hand-listed |
| `server.fs.allow` | injected by `@mono-lit/utility/nuxt` |

**Treat `nuxt.config.ts` as read-only and ask before changing the mono wiring** (Rule 1).
[Setup](../repo/setup) has the full walkthrough.

### N2. Source lives in `app/`

> **When:** creating any file, or resolving where an existing one lives.
> **Do:** put source under `app/`; opt nested `shared/` dirs into `imports.dirs`.
> **Don't:** use `src/` (that's Vue — Rule V2), or assume a nested folder is auto-imported.

`type: 'nuxt'` means this app's source root is **`app/`**. The folder names the General rules
refer to are all relative to it — `app/pages`, `app/components`, `app/stores`,
`app/composables`, `app/layouts`, `app/datas`, `app/types`, `app/odata`, `app/assets`.

::: warning Nested `shared/` dirs need `imports.dirs`
Nuxt scans only the **top level** of `composables/` and `stores/` by default, so a nested
`app/composables/shared/use-x.ts` is **not** auto-imported and its call fails at runtime with
an undefined function. Opt the globs in explicitly:

```ts
imports: { dirs: ['composables', 'composables/**', 'stores', 'stores/**'] }
```

This matters here more than in Vue because the ecosystem merge pulls in the *other* app's
`stores/shared` and `composables/shared` (Rule 1) — exactly the nested layout Nuxt skips.
:::

### N3. Generated files a Nuxt app never edits

> **When:** before touching anything under `.nuxt/`.
> **Do:** change the source and let Nuxt regenerate (`nuxt prepare` / `pnpm dev`).
> **Don't:** hand-edit `.nuxt/` or commit fixes into it (Rule 4).

On top of the language-neutral list in Rule 4, Nuxt generates the whole **`.nuxt/`** directory
— auto-import declarations, typed routes, and the generated `tsconfig` Nuxt extends. It's
rebuilt on every `nuxt prepare` / `dev` / `build`, so edits there vanish. If a type is wrong,
fix the source file (or `nuxt.config.ts` `imports.dirs`, Rule N2) and regenerate.

### N4. Register mono in `app/plugins/mono.ts`, not `main.ts`

> **When:** wiring the app up, or debugging "cookies/JWT are empty on the server".
> **Do:** register `createMono` from a Nuxt plugin **and** keep the `setMonoEventResolver` server guard.
> **Don't:** look for a `main.ts` — a Nuxt app has none (that's Vue, Rule V4).

Because Nuxt also runs on the server, mono needs a way to read the request's cookies during
SSR. That's what the resolver does — drop it and `monoState()` hydrates empty on the server,
so the first paint renders logged-out and then flips after hydration:

```ts
// app/plugins/mono.ts
import { createMono, setMonoEventResolver } from '@mono-lit/utility/runtime'
import monoConfig from '@mono-host-root/mono.config'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) setMonoEventResolver(() => useRequestEvent())
  nuxtApp.vueApp.use(createMono(monoConfig))
})
```

Keep the `import.meta.server` guard — `useRequestEvent()` only exists on the server.

### N5. Use the shadow-DOM `mono-*` build — and let it auto-wrap

> **When:** using any `mono-*` component in a Nuxt host (the decision itself is Rule 11).
> **Do:** `import '@mono-lit/helper/ui/shadow/<c>'` and write the **normal** `<mono-<c>>` tag.
> **Don't:** hand-write `<mono-shadow-*>`, hand-wrap in an SSR wrapper, or import the light subpath for the host's own UI.

```vue
<script setup lang="ts">
// the shadow subpath — this import is also the signal that triggers auto-wrapping
import '@mono-lit/helper/ui/shadow/button'
</script>

<template>
  <mono-button>Save</mono-button>
</template>
```

`@mono-lit/helper/nuxt` **auto-wraps** a `<mono-*>` in its SSR wrapper when the `.vue` file imports
the matching shadow subpath. The match is import-driven and exact — so importing
`@mono-lit/helper/ui/shadow/button` wraps `<mono-button>` in that file, and nothing else. You write
the ordinary tag; the module does the rest.

The payoff (Rule 11): the server emits Declarative Shadow DOM, so the browser paints the
fully-styled component on the first response — no skeleton delay, no unstyled flash, no reflow
when Lit hydrates. See [Mono-UI → Getting started](/ui/getting-started).

::: tip `ssr: false` apps keep the light build, unwrapped
A Nuxt app running client-only (`ssr: false` — a Remote standalone, or a Host before its SSR
phase) has no server paint to protect, so it uses the **light** build (`@mono-lit/helper/ui/<c>`) like
a Vue app, and `@mono-lit/helper/nuxt` wraps nothing: the `<ClientOnly>` wrap and `nuxt-ssr-lit` are
registered only when `ssr` is on. (Wrapping would defer every `<mono-*>` past the page's
`onMounted`, where `controlMonoTable/Form/Modal` refs are bound.) Force either way with
`mono: { helper: { clientOnly: true | false } }`.
:::

::: tip Loading skeletons come for free — `pending`
Do not hand-roll a skeleton (`<div class="animate-pulse">`, a `v-if="loading"` placeholder, the
legacy `client-skeleton-*` attributes). Every mono element has a `pending` prop drawn by the
optional peer `@aejkatappaja/phantom-ui`: install it in the Host and, in an SSR app, the light
components of a page pend on their own until their first data is in (tables until the grid has
loaded, selects until their source has a page; buttons / inputs never flash). For a busy state
of your own, bind it: `:pending="store.saving"` or `:pending.prop="{ active, count: 6 }"`. See
[Addons → Skeleton](/addons/skeleton).
:::

### N6. Dev-only knobs live in `nuxt.config.ts`

> **When:** setting a port or the client env prefix.
> **Do:** use `devServer.port`, and put Vite-only options under the `vite` key (Rule 7).
> **Don't:** read `PORT` from `.env`, or create a `vite.config.ts` to hold them (Rule N1).

```ts
export default defineNuxtConfig({
  devServer: { port: 2020 },
  vite: { envPrefix: ['VITE_', 'MONO_'] },  // only these prefixes reach client code
})
```

## Before you finish

A quick self-check against the always-rules before you call a change done:

- [ ] You read the section matching this app's `type` — and applied **only** that one (Vue / Nuxt).
- [ ] The `mono-*` build matches the language: light in a Vue app, shadow in a Nuxt host (Rules 11, V5, N5).
- [ ] New files landed in the right source root — `src/` in Vue (V2), `app/` in Nuxt (N2).
- [ ] All data access goes through `@mono-lit/utility/fetching` — no external HTTP lib (Rule 12).
- [ ] A detail / single-row read **reuses an existing DataSource** (`source.store().load({ take: 1 })` when it's bound to a component) instead of a second fetcher; never `store().byKey()` (Rule 12).
- [ ] Every new store has a **unique export name and `defineStore` key** (app-suffixed) (Rule 8).
- [ ] Nothing under `.mono/apps/` or any generated file (`*.d.ts`, `.nuxt/`, `.mono/tsconfig.json`, `odata/DTO/`) was hand-edited (Rules 3, 4, V3, N3).
- [ ] OData types are **generated + mapped** with `MonoOdataMapTypes`, not hand-written (Rule 13).
- [ ] Variables/functions use consistent leading prefixes and handlers take one typed object — `openModal({ item }: { item: T })` (Rule 6).
- [ ] Typed data has its shape in a `.d.ts`; static data lives in `datas/` (Rules 16, 9).
- [ ] Cross-app / `datas`·`types`·`odata` imports use the `@app-name` alias (Rule 2).
- [ ] UI starts from `@mono-lit/helper/ui`; secrets live in env with the right prefix (Rules 14, 7).
- [ ] If the Host shell looks unstyled (layout/sidebar lose their utility classes while `mono-*` components still render), `uno.config.ts` scans `.mono/apps` via an **absolute** `content.filesystem` base, not a relative glob (Rule 1).
- [ ] You paused to **ask** before touching infra (the build config, aliases, `mono.config.ts` `extends`/`apps`).
- [ ] If `skill` is configured in `mono.config.ts` and the work was meaningful, the session was saved with `mono skills save` and the `repoPath` reported (Rule 17).

## Host template

> **When:** you're working in the **Host**.
> **Do:** own the shared shell — `pages` (Login/Logout), `layouts` (Sidebar/Navbar), Middleware, and the **theme** (Mono/Material + color).
> **Don't:** bury a Remote's module-specific logic in the Host.

The Host owns the **shell** every Remote reuses — see [Getting Started](../repo/getting-started).
All Common Rules above apply here too — **General**, plus [Vue](#common-rules-vue) or
[Nuxt](#common-rules-nuxt) depending on this Host's `type`.

- **Owns:** Login / Logout pages, layouts (Sidebar, Navbar), Middleware — the generic pieces
  a Remote should never rebuild.
- **Owns the theme — and is the *only* app that does.** The Host is the single place that
  imports the theme CSS (`@mono-lit/helper/index.css`, plus `@mono-lit/helper/ui/theme/<flavor>.css` only if
  Material is used) and sets the active **theme** (Mono / Material) and **theme color** via the
  theming API (`applyTheme` / `applyFlavor`). Theme/color apply as classes on a root element
  (`<html>` / `<body>`), so they cascade into every Remote automatically — a Remote inherits the
  Host's theme without importing or applying anything. See [Theme](/ui/theme).
- **Exposes to Remotes** via the three Host ↔ Remote links (Rule 1) and `mono.config.ts`
  (Rule 5): its shared pages/components/stores and the merged cookie/JWT/API/menu config.
- **Keep out of the Host:** feature logic that belongs to one Remote's module — build that in
  the Remote.

#### When the Host is a Nuxt app

A Host can be a **Nuxt** app instead of Vue + Vite (`type: 'nuxt'` in `mono.config.ts`). It
owns the same shell and theme — only the language-level wiring differs, and that is now
covered in full by **[Common Rules: Nuxt](#common-rules-nuxt)**: `nuxt.config.ts` as the core
(N1), source under `app/` (N2), registration via `app/plugins/mono.ts` (N4), and the
shadow-DOM component build for the server-rendered shell (N5).

Nothing about the Host's **role** changes: it still owns Login/Logout, layouts, Middleware, and
the theme. [Setup](../repo/setup) has the full config walkthrough.

Starter apps (in the `mono-lit/templates` monorepo): Vue <https://github.com/mono-lit/templates/tree/main/vue-host> · Nuxt <https://github.com/mono-lit/templates/tree/main/nuxt-host>

## Remote template

> **When:** you're working in a **Remote**.
> **Do:** add your own modules under `src/`, and register pages in `mono.config.ts` `menu` to appear in the Host nav.
> **Don't:** re-create Login / Logout / layouts / Middleware, or manage the theme — the Host already provides them.

A Remote only **adds its own modules** and consumes the Host's shell — see
[Getting Started](../repo/getting-started). All Common Rules above apply here too — **General**
plus [Vue](#common-rules-vue). Under the standard a Remote **matches its Host's framework** —
this Vue template is the Remote of a **Vue Host**.

- **Adds:** its feature pages, components, stores under its own `src/` (auto-imported per Rule V1).
- **Surfaces in the Host:** add a `menu` entry in `mono.config.ts` (Rule 5) so the module shows
  in the Host's navigation; ask the user whether a new page should be deployable yet (Rule 12).
- **Don't rebuild the shell:** Login, Logout, Sidebar, Navbar, Middleware and layouts come from
  the Host — just use them.
- **Don't manage the theme.** Don't import the theme CSS (`@mono-lit/helper/index.css`,
  `@mono-lit/helper/ui/theme/<flavor>.css`) and don't call `applyTheme` / `applyFlavor`. The **Host** owns
  and applies the theme globally; a Remote just uses the `mono-*` components and inherits the
  active theme/color. See [Theme](/ui/theme).

#### When the host is a Nuxt app

::: warning Hybrid pairing — possible, but at your own risk
A Vue Remote under a Nuxt Host is **outside the same-framework standard**. The combination
still boots — mono's compat layer (Rule V7) rewrites the host's Nuxt code for the Remote's
Vite build — but the seams it papers over (SSR, layouts, routing, state) stay your risk.
Prefer a Nuxt Remote for a Nuxt Host; see [Setup](../repo/setup).
:::

A Vue Remote stays a Vue + Vite app even when its Host is **Nuxt** — you keep reading
[Common Rules: Vue](#common-rules-vue), you write the same `src/` modules, and your day-to-day
code is unchanged. **Do not switch to the Nuxt section, and do not switch to the shadow
component build** (Rule V5) — the Host's `type` is not yours.

Only `vite.config.ts` infra differs, and that is **Rule V7**: `apps[].type: 'nuxt'` makes
`mono prepare` resolve `@mono-host/*` to the host's `app/*` (Rule 2), and the build adds the
Nuxt-compat helpers `mono.nuxt().hostResolver()` / `.extendRoute()` alongside the same
type-driven `mono.ecosystem(...)` discovery. See [Setup](../repo/setup) for the exact config.

Starter: the `vue-remote` app in <https://github.com/mono-lit/templates/tree/main/vue-remote>
