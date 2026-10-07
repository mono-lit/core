import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { MonoTemplate } from '../composables/create-config'

/**
 * Which Nuxt API consumes the discovered folders (the "destination").
 *
 * `layouts` / `middleware` / `plugins` are the shell a REMOTE inherits from its
 * host; the first four are what a host pulls out of its remotes.
 */
export type EcosystemType =
  | 'imports'
  | 'components'
  | 'pages'
  | 'layouts'
  | 'middleware'
  | 'plugins'

/** One built-in ecosystem default: a destination plus the per-app subpath. */
export interface EcosystemDefault {
  type: EcosystemType
  relDir: string
  enabled?: boolean
}

/**
 * The built-in ecosystem map, given THIS app's `template`.
 *
 * `pages`/`imports`/`components` are role-independent — a host absorbs its
 * remotes' features, a remote absorbs its host's, and both want the same four
 * folders. The shell is where the roles disagree:
 *
 * - `layouts` follows `mono.vite()` exactly (`monoLayoutsOptions`): a `host`
 *   owns the shared shell and must not adopt a remote's `default.vue`, while a
 *   `remote` — and an ABSENT `template`, which has always read as `remote` —
 *   consumes the host's.
 * - `middleware` / `plugins` have no `mono.vite()` analogue, so there is no
 *   prior behaviour to preserve. They are enabled for an EXPLICIT `remote`
 *   only: quietly running a remote's global middleware or its Sentry plugin
 *   inside an existing Nuxt host would be a regression, not a fix. A host that
 *   wants them opts in by restating the entry in `mono.utils.ecosystem`.
 */
export function nuxtEcosystemDefaults(
  template?: MonoTemplate,
): Record<string, EcosystemDefault> {
  return {
    pages: { type: 'pages', relDir: 'pages' },
    composables: { type: 'imports', relDir: 'composables' },
    stores: { type: 'imports', relDir: 'stores' },
    components: { type: 'components', relDir: 'components' },

    layouts: { type: 'layouts', relDir: 'layouts', enabled: template !== 'host' },
    middleware: {
      type: 'middleware',
      relDir: 'middleware',
      enabled: template === 'remote',
    },
    plugins: { type: 'plugins', relDir: 'plugins', enabled: template === 'remote' },
  }
}

/**
 * Default page-exclude globs for the federated `pages` dirs.
 *
 * Only the root `index.vue` is ever in question, and the answer is visible on
 * disk: an app that ships its own `pages/index.vue` owns `/`, so a federated
 * root index would clobber it. An app that does NOT — every remote, which takes
 * the host's login page as `/` — must let it through. Same derivation as
 * `monoPagesOptions` (`src/vite/mono-vite.ts`), which reads `ownsRoot` off the
 * filesystem rather than asking the config.
 *
 * Deeper `<folder>/index.vue` pages are never excluded by this.
 */
export function remotePageExcludes(ownPagesDir: string): string[] {
  return existsSync(join(ownPagesDir, 'index.vue')) ? ['index.vue'] : []
}

/**
 * The identity two files fight over when one is federated and one is the app's
 * own: the basename, minus its extension and minus a trailing Nuxt mode/scope
 * suffix (`.client` / `.server` / `.global`).
 *
 * Dropping the suffix is deliberate — an app's own `plugins/mono.ts` should win
 * over a host's `plugins/mono.client.ts`, since they are two versions of one
 * plugin rather than two plugins.
 */
export function ecosystemFileKey(file: string): string {
  const name = file.replaceAll('\\', '/').split('/').pop() ?? file
  return name
    .replace(/\.(vue|[cm]?[jt]sx?)$/, '')
    .replace(/\.(client|server|global)$/, '')
}

/**
 * The `ecosystemFileKey`s this app ships in its OWN `<srcDir>/<sub>` folder.
 *
 * Used to skip a federated layout/middleware/plugin the app has replaced. Nuxt
 * already refuses to clobber for layouts (`app.layouts`) and middleware
 * (`addRouteMiddleware` matches on name), but `addPlugin` dedupes on absolute
 * `src` — which never matches across two checkouts — so the rule is applied
 * here for all three rather than relying on three different behaviours.
 */
export function ownEcosystemKeys(ownDir: string): Set<string> {
  const keys = new Set<string>()
  if (!existsSync(ownDir)) return keys

  for (const entry of readdirSync(ownDir, { withFileTypes: true })) {
    if (entry.isDirectory()) continue
    keys.add(ecosystemFileKey(entry.name))
  }

  return keys
}

/** Recursively collect files under `dir` whose extension is in `exts`. */
export function walkFiles(dir: string, exts: string[]): string[] {
  const out: string[] = []
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return out

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(full, exts))
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full)
  }

  return out
}

/** Top-level files only (no recursion) whose extension is in `exts`. */
export function topLevelFiles(dir: string, exts: string[]): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return []

  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.isDirectory() && exts.some((ext) => e.name.endsWith(ext)))
    .map((e) => join(dir, e.name))
}

/**
 * `layouts/home.vue` -> `home`, `layouts/admin/users.vue` -> `admin-users` —
 * the same path-to-name flattening Nuxt applies to its own `layouts/` dir.
 */
export function layoutNameFor(layoutsDir: string, file: string): string {
  return relative(layoutsDir, file)
    .replace(/\.vue$/, '')
    .split(sep)
    .join('-')
}

/** `route-guard.global.ts` -> `{ name: 'route-guard', global: true }`. */
export function middlewareNameFor(file: string): { name: string; global: boolean } {
  const base = (file.replaceAll('\\', '/').split('/').pop() ?? file).replace(
    /\.[cm]?[jt]sx?$/,
    '',
  )
  const global = base.endsWith('.global')

  return { name: global ? base.slice(0, -'.global'.length) : base, global }
}

/** Source extensions Nuxt accepts for middleware / plugins. */
export const SCRIPT_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.tsx', '.jsx']
