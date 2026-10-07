/**
 * Where each federated app's source actually lives.
 *
 * Everything that consumes a remote — `monoAlias`, `monoMissingApps`,
 * `monoEcosystem`, `mono prepare`, `mono sync`, `mono env`, the vite transform
 * gates, the Nuxt module — used to answer that question by listing
 * `.mono/apps/`. That is still the answer for a synced clone, but
 * `MonoAppConfig.path` names a directory the app is read from DIRECTLY (a
 * sibling folder in a mono-lith, a checkout beside this one), and a directory
 * listing cannot see one. So the question is asked here, once, and every
 * consumer takes the answer.
 *
 * Two properties this file has to preserve:
 *
 *  - **`path` is authoritative in every command.** Dev, build, prepare, sync,
 *    env and the Nuxt module all read the same directory. There is no
 *    "build reads the clone instead" mode any more: a bundle built from a lith
 *    IS built from its siblings, and that is the point.
 *  - **Nothing here is a delete target.** `MONO_APPS_DIR` stays the single
 *    constant `mono sync` prunes inside (`bin/mono-git.mjs`). A resolved root is
 *    only ever READ. The very first `path` option was removed precisely because
 *    it fed the clone destination, and therefore the prune root, with a
 *    user-supplied directory.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { MonoAppType } from './create-config'

/** Where a resolved root came from. */
export type MonoAppRootSource = 'path' | 'clone'

/** One federated app, resolved to the directory its source is read from. */
export interface MonoAppRoot {
  /** The app's `name` — what `@<name>` / `@<name>-root` key off. */
  name: string
  /** Its declared `type`, when a config entry supplied one. */
  type?: MonoAppType
  /** Absolute directory that IS the app root (contains `src/` or `app/`). */
  root: string
  /**
   * `'path'` — resolved from `apps[].path`, read in place, never written to.
   * `'clone'` — the `.mono/apps/<name>` tree `mono sync` materialised.
   */
  source: MonoAppRootSource
  /**
   * Set when the entry was not declared by the root config but by one of its
   * apps (see `resolveFederatedRoots`): the name of the app whose config
   * declared it.
   */
  via?: string
}

/** The `apps[]` shape this needs. Loosened so the static text-parse fits too. */
export interface MonoAppRootInput {
  name?: string
  type?: MonoAppType
  url?: string
  path?: string
  [key: string]: unknown
}

/**
 * What to do with a declared `path` whose directory does not exist.
 *
 * - `'report'` — the entry also has a `url`: warn once and fall back to the
 *   clone (the developer who set `path` has the directory, everyone else gets
 *   `mono sync`'s copy). No `url`: THROW, there is nothing to fall back to.
 * - `'ignore'` — skip silently. For a second pass over a config that another
 *   pass has already reported (prepare after alias, the transitive walk).
 */
export type MonoMissingPathPolicy = 'report' | 'ignore'

export interface ResolveAppRootsOptions {
  /** Project root. `path` entries resolve against it. */
  dirname: string
  /** Folder holding the clones. @default './.mono/apps' */
  appsDir?: string
  /** `apps[]` from `mono.config.ts`. Entries with `path` resolve in place. */
  apps?: MonoAppRootInput[]
  /** @default 'report' */
  onMissingPath?: MonoMissingPathPolicy
  /**
   * Also list `<appsDir>` for clones. Pass `false` to resolve ONLY the declared
   * `path` entries — what a transitive walk over a sibling's config wants.
   * @default true
   */
  listClones?: boolean
  /**
   * @deprecated `path` is authoritative in every command; this is ignored.
   * Kept so older call sites keep type-checking.
   */
  link?: boolean
  /** @deprecated use `onMissingPath: 'ignore'`. */
  warnMissingPath?: boolean
}

/** Apps already warned about, so a repeated config load stays quiet. */
const warnedPaths = new Set<string>()

/**
 * Resolve every federated app to the directory it is read from.
 *
 * Config-declared `path` apps (when the directory exists) UNIONed with the
 * `.mono/apps/` listing. A `path` root SHADOWS a clone of the same name — the
 * stale clone is left on disk, simply not read — and a `path` that does not
 * exist falls back to the clone when the entry has a `url` to sync from.
 */
export function resolveAppRoots(opts: ResolveAppRootsOptions): MonoAppRoot[] {
  const { dirname, appsDir = './.mono/apps', apps = [], listClones = true } = opts
  const onMissingPath: MonoMissingPathPolicy =
    opts.onMissingPath ?? (opts.warnMissingPath === false ? 'ignore' : 'report')

  const appsRoot = path.resolve(dirname, appsDir)
  const roots: MonoAppRoot[] = []
  const linked = new Set<string>()

  for (const app of apps) {
    const name = app?.name
    const declared = typeof app?.path === 'string' ? app.path.trim() : ''
    if (!name || !declared) continue

    const root = path.isAbsolute(declared) ? declared : path.resolve(dirname, declared)

    if (!isDirectory(root)) {
      if (onMissingPath === 'ignore') continue
      // Falling back rather than throwing is what makes `path` + `url`
      // committable: the developer who set it has the directory, everyone
      // else quietly gets the clone. Without a `url` there is no clone to
      // get, so the only honest answer is an error naming the directory.
      if (hasUrl(app)) {
        warnMissingAppPath(name, declared, root)
        continue
      }
      throw new Error(missingPathMessage(name, declared, root))
    }

    linked.add(name)
    roots.push({ name, type: app.type, root, source: 'path' })
  }

  if (!listClones) return roots

  const typeOf = new Map<string, MonoAppType | undefined>()
  for (const app of apps) if (app?.name) typeOf.set(app.name, app.type)

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(appsRoot, { withFileTypes: true })
  } catch {
    return roots
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    // A `path` root wins; the stale clone beside it is simply not read. It is
    // deliberately left alone rather than cleaned up — deleting a directory the
    // user may still want is not this function's business.
    if (linked.has(entry.name)) continue
    roots.push({
      name: entry.name,
      type: typeOf.get(entry.name),
      root: path.join(appsRoot, entry.name),
      source: 'clone',
    })
  }

  return roots
}

/** Just the absolute roots — for `server.fs.allow` and the transform gates. */
export function appRootDirs(roots: MonoAppRoot[]): string[] {
  return roots.map((r) => r.root)
}

/** The `path`-resolved subset. Used to tell the developer what is read in place. */
export function pathAppRoots(roots: MonoAppRoot[]): MonoAppRoot[] {
  return roots.filter((r) => r.source === 'path')
}

/** @deprecated renamed {@link pathAppRoots}. */
export const linkedAppRoots = pathAppRoots

/** `true` when an app entry can be synced from GitHub. */
export function hasUrl(app: MonoAppRootInput | undefined): boolean {
  return typeof app?.url === 'string' && app.url.trim().length > 0
}

/** The error every entry point raises for a `path` with no directory and no `url`. */
export function missingPathMessage(name: string, declared: string, resolved: string): string {
  return (
    `[mono] ${name}: path '${declared}' does not exist and no url is declared, ` +
    `so there is nothing to fall back to.\n[mono]   looked in ${resolved}`
  )
}

/** Recognise {@link missingPathMessage} from a caught error. */
export function isMissingPathError(e: unknown): boolean {
  return e instanceof Error && e.message.includes('does not exist and no url is declared')
}

function isDirectory(dir: string): boolean {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

function warnMissingAppPath(name: string, declared: string, resolved: string): void {
  const key = `${name} ${resolved}`
  if (warnedPaths.has(key)) return
  warnedPaths.add(key)
  console.warn(
    `[mono] ${name}: path '${declared}' does not exist — using the synced clone instead.\n` +
      `[mono]   looked in ${resolved}`,
  )
}

/** Test seam: forget which missing paths have been reported. */
export function resetAppPathWarnings(): void {
  warnedPaths.clear()
}
