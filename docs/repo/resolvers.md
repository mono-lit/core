# Resolvers

A **resolver** is a host-side stopgap fix. When a remote app has a bug or isn't
ready yet and it breaks the host, the host doesn't wait for the upstream fix — it
drops a small file in a `resolvers/` folder, wires it in, and **deletes it once
the remote is fixed upstream**. Resolvers live only in the host; the remote stays
untouched.

## Two kinds

Where a resolver goes depends on what it fixes.

- **Build-config resolver** — a **root-level `resolvers/`** folder, next to the
  host config. It fixes things at build/resolution time (redirect a broken remote
  import, patch an alias, tweak `optimizeDeps`) and is imported into the host
  config: `nuxt.config.ts` on a Nuxt host, `vite.config.ts` on a Vue host. This is
  the common case.
- **Runtime resolver** — a `resolvers/` folder inside the src dir, for a fix that
  is itself runtime code (a composable, store, or component that patches remote
  behavior at runtime). It lives in **`app/resolvers/`** on a Nuxt host (srcDir is
  `app/`) and **`src/resolvers/`** on a Vue host or remote (srcDir is `src/`).

## Rules

- **Not auto-imported.** Unlike `composables/` and `stores/`, the `resolvers/`
  folder is never scanned for auto-imports. Always import a runtime resolver
  **explicitly, via the host app alias `@mono-host`** — so every fix stays visible
  and easy to find and delete.
- **Label it as a stopgap.** Add a comment at the top saying which remote issue it
  works around.
- **Document the real fix.** Always write a detailed comment explaining **how to
  fix it properly in the remote** — the actual change the remote needs — so
  whoever fixes the remote later has the instructions right there.
- **Delete when fixed.** Remove the resolver file *and* its wiring the moment the
  remote is fixed upstream — resolvers are meant to disappear.

## Example

A build-config resolver on a Nuxt host that redirects a broken component from the
`flow-app` remote to a host copy, until the remote fixes it.

`resolvers/flow-app.ts` (root, next to the host config):

```ts
import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'

// Stopgap: the flow-app remote ships a broken CodeMirror.vue.
// Redirect its import to a host copy until the remote fixes it upstream.
//
// HOW TO FIX IN THE REMOTE (then delete this resolver + its wiring):
//   In mono-vue-remote, src/components/CodeMirror.vue must register the SQL
//   language: `import { sql } from '@codemirror/lang-sql'` and add `sql()` to the
//   editor `extensions`. Once that ships, the host copy is no longer needed.
const hostCopy = fileURLToPath(
  new URL('../app/overrides/FlowCodeMirror.vue', import.meta.url),
)

export function flowAppCodeMirrorOverride(): Plugin {
  return {
    name: 'mono-flow-codemirror-override',
    enforce: 'pre',
    resolveId: (id) =>
      id === '@flow-app/components/CodeMirror.vue' ? hostCopy : null,
  }
}
```

Wire it in `nuxt.config.ts` (a Vue host does the same in `vite.config.ts`):

```ts
import { flowAppCodeMirrorOverride } from './resolvers/flow-app'

export default defineNuxtConfig({
  vite: { plugins: [flowAppCodeMirrorOverride()] },
})
```

A **runtime** resolver is wired differently — it is not auto-imported, so you
import it explicitly with the `@mono-host` alias where you use it:

```ts
// app/resolvers/patch-remote-user.ts   (src/resolvers/… on a Vue host)
import { patchRemoteUser } from '@mono-host/resolvers/patch-remote-user'
```

::: tip
When the remote fix lands, delete `resolvers/flow-app.ts` and remove its line from
the config. A resolver that outlives its remote bug is just dead weight.
:::
