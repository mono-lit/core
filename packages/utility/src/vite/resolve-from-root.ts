/**
 * Import the consumer's own copy of an ecosystem plugin.
 *
 * `mono.vite()` registers plugins (`vue-router/vite`, `unplugin-auto-import`,
 * …) that belong to the **app**, not to @mono-lit/utility. Two ways to reach them, and
 * only one is correct:
 *
 *  - A bare `await import('unocss/vite')` happens to work from the plain
 *    `.pnpm/mono-utils@…/` layout, because the app's `node_modules` is an
 *    ancestor of the real path and Node's upward walk finds it. But that is
 *    phantom-dependency resolution: undeclared, unversioned, and silently
 *    dependent on the plugin being a *direct* dep of the app.
 *
 *  - Declaring them as peerDependencies is worse. pnpm's `autoInstallPeers` is on
 *    (no `.npmrc` in any template), so declaring a peer installs a SECOND copy
 *    under @mono-lit/utility's own `node_modules/`. That already happens:
 *    `mono-nuxt-host` carries `@unhead/vue` twice at the identical version 3.1.3
 *    under different peer-hash directories. Two `vue-router` instances would mean
 *    two `vue-router/auto-routes` virtual modules, two UnoCSS contexts, two
 *    auto-import dts writers racing on the same file.
 *
 * So resolve from the app root explicitly. `monoRepo()` already computes it.
 */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

/** A loader that imports bare specifiers as the app at `rootDir` would. */
export type RootLoader = <T = any>(id: string) => Promise<T>

/**
 * Build a {@link RootLoader} anchored at `rootDir`.
 *
 * `createRequire` needs a *file* to resolve from — `noop.js` never has to exist,
 * it only fixes the directory the walk starts in.
 */
export function createRootLoader(rootDir: string): RootLoader {
  const req = createRequire(pathToFileURL(join(rootDir, 'noop.js')))

  return async <T = any>(id: string): Promise<T> => {
    try {
      return (await import(pathToFileURL(req.resolve(id)).href)) as T
    } catch {
      // CJS `require.resolve` throws ERR_PACKAGE_PATH_NOT_EXPORTED on packages
      // whose `exports` declare only an `import` condition — real case:
      // `vite-plugin-vue-layouts-next`. The specifier is fine, the *condition*
      // is not, so a plain dynamic import still succeeds.
      return (await import(id)) as T
    }
  }
}

/**
 * Pull the plugin factory out of a module namespace.
 *
 * `createRequire().resolve()` picks the **`require`** condition, so a package
 * that ships both (vue-router does: `dist/unplugin/vite.cjs`) resolves to CJS.
 * Importing a `.cjs` puts `module.exports` on `default` — and since that export
 * is itself `{ default: fn }`, the factory ends up at `default.default`. ESM
 * builds put it at `default` directly, and a few packages are the bare
 * namespace. Unwrap all three rather than guessing per package.
 */
export function interopDefault<T = any>(mod: any): T {
  const first = mod?.default ?? mod
  if (typeof first !== 'function' && typeof first?.default === 'function') {
    return first.default as T
  }
  return first as T
}

/** Read a named export, looking through the same CJS `default` wrapper. */
export function interopNamed<T = any>(mod: any, key: string): T | undefined {
  return (mod?.[key] ?? mod?.default?.[key]) as T | undefined
}

/** `true` when `id` can be resolved from the app root. Never throws. */
export function canResolveFromRoot(rootDir: string, id: string): boolean {
  const req = createRequire(pathToFileURL(join(rootDir, 'noop.js')))
  try {
    req.resolve(id)
    return true
  } catch (error) {
    // Same export-condition caveat as above: a package that only ships an
    // `import` condition resolves at runtime even though `require.resolve`
    // refuses it, so treat that one error as "present".
    return (error as NodeJS.ErrnoException)?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
  }
}
