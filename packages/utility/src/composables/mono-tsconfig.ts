import fs from 'node:fs'
import path from 'node:path'
import { readTSConfig, writeTSConfig, type TSConfig } from 'pkg-types'
import { monoAlias, extractConfig, stripCommentsSafe, type MonoAliasOptions } from './mono-alias'
import { hostedAppRoots, resolveAppRoots } from './app-roots'
import { srcDirForType } from './create-config'

/** Folder (relative to an app root) that holds the generated tsconfig. */
export const MONO_DIR = '.mono'

/** Reference to the generated tsconfig, as written into the root `extends`. */
export const MONO_TSCONFIG_REF = `./${MONO_DIR}/tsconfig.json`

/** Folder (relative to an app root) that holds the cloned remotes. */
export const MONO_APPS_DIR = `${MONO_DIR}/apps`

/**
 * Turn an absolute path into a POSIX, tsconfig-friendly relative path from
 * `fromDir`, always prefixed with `./` or `../` so TypeScript treats it as a
 * path mapping rather than a bare module name.
 */
function toRelativePosix(fromDir: string, absTarget: string): string {
  let rel = path.relative(fromDir, absTarget).split(path.sep).join('/')
  if (rel === '') rel = '.'
  if (!rel.startsWith('.')) rel = `./${rel}`
  return rel
}

/**
 * Build the `compilerOptions.paths` map for `.mono/tsconfig.json` from the mono
 * alias map.
 *
 * `monoAlias` returns absolute directory paths keyed WITHOUT a `/*` glob (e.g.
 * `@mono-host` -> `<abs>/src`). tsconfig `paths` need the `/*` glob on both the
 * key and the value, and the value must be relative to the `.mono/` folder that
 * the file lives in. So `@mono-host` -> `{ "@mono-host/*": ["../src/*"] }`.
 *
 * All alias/type/srcDir rules are inherited from `monoAlias` — nothing is
 * re-implemented here.
 */
export function monoTsconfigPaths(opts: MonoAliasOptions): Record<string, string[]> {
  const monoDir = path.resolve(opts.dirname, MONO_DIR)

  // One map, `path` authoritative. An app read in place through `apps[].path`
  // maps to that directory even when a stale clone sits in `.mono/apps` — the
  // same rule every other command follows, so what the editor type-checks is
  // what Vite serves and builds.
  //
  // A sibling directory lies OUTSIDE this project, and a tsconfig with
  // `rootDir: "."` rejects it ("is not under 'rootDir'"). `mono prepare` does
  // not edit `rootDir` — it cannot know the intended layout — it warns instead
  // (see `runMonoPrepare`); a Vite / vue-tsc project that never emits can
  // simply drop the option.
  const alias = monoAlias(opts)

  const paths: Record<string, string[]> = {}
  for (const [key, absDir] of Object.entries(alias)) {
    const rel = toRelativePosix(monoDir, absDir)
    paths[`${key}/*`] = [`${rel}/*`]
  }

  return paths
}

/** The object written to `<dirname>/.mono/tsconfig.json`. */
export function buildMonoTsconfig(opts: MonoAliasOptions): TSConfig {
  return {
    // TS >= 5 resolves these paths relative to THIS file (the `.mono/` folder),
    // so no `baseUrl` is required for the root tsconfig that `extends` it.
    compilerOptions: {
      paths: monoTsconfigPaths(opts),
    },
  }
}

export interface RunMonoPrepareOptions {
  /** App root (absolute) containing `mono.config.ts` and `tsconfig.json`. */
  dirname: string
}

export interface RunMonoPrepareResult {
  /** Absolute path of the generated `.mono/tsconfig.json`. */
  monoTsconfigPath: string
  /** Absolute path of the root `tsconfig.json` that was wired. */
  rootTsconfigPath: string
  /** The alias keys (with `/*`) written into `.mono/tsconfig.json`. */
  writtenKeys: string[]
  /** Inline `@mono-*` path keys stripped from the root tsconfig. */
  removedKeys: string[]
  /** Whether the `extends` entry was added (false if it was already present). */
  addedExtends: boolean
  /** Cloned remotes under `.mono/apps/` whose tsconfig was (re)wired. */
  wiredApps: string[]
  /**
   * Alias keys whose directory lies outside the project (`apps[].path`
   * siblings) while the root tsconfig sets `rootDir` — TypeScript will reject
   * them until `rootDir` is removed or widened.
   */
  outsideProject: string[]
  /**
   * `path` apps whose own `tsconfig.json` extends a `.mono/tsconfig.json` that
   * does not exist yet — they have not run their own `mono prepare`.
   */
  unpreparedApps: string[]
  /**
   * Hosted (mini) `path` apps — no `package.json` — this host prepared on their
   * behalf: `node_modules` linked to the host's, `.mono/tsconfig.json` written.
   */
  hostedApps: HostedAppPrepared[]
}

/** Normalise a tsconfig `extends` field (string | string[] | undefined) to an array. */
function extendsToArray(value: TSConfig['extends']): string[] {
  if (!value) return []
  return Array.isArray(value) ? [...value] : [value]
}

/**
 * Point every cloned remote's `tsconfig.json` at the host's generated
 * `.mono/tsconfig.json` (as `../../tsconfig.json`), and strip the inline alias
 * keys that file now owns.
 *
 * WHY: a clone arrives with no usable `paths`. Its own `.mono/tsconfig.json` is
 * gitignored, so it is absent from the archive `mono sync` downloads, and
 * `sanitizeClonedTsconfig` then strips the dangling `.mono` `extends` from it.
 * That matters beyond editor comfort: `@vue/compiler-sfc` resolves the type-only
 * imports in `defineProps<ImportedType>()` through the NEAREST tsconfig's `paths`
 * (`ts.findConfigFile` walks up from the SFC and stops at the clone's own
 * tsconfig — it never reaches the host's). Vite's `resolve.alias` is invisible to
 * it. So a remote whose SFCs do `defineProps<NodeWrapperProps>()` with
 * `import type { NodeWrapperProps } from '@some-app/types'` breaks the host build
 * with `Failed to resolve import source "@some-app/types"` unless the clone's
 * tsconfig maps the alias.
 *
 * The host already has every mapping it needs — `.mono/tsconfig.json` covers each
 * remote (`@flow-app/*` -> `./apps/flow-app/src/*`) and its `paths` are relative
 * to `.mono/`, so they stay correct when inherited from a clone two levels down.
 * Wiring it here means remotes need no committed workaround of their own.
 *
 * The ref goes LAST for the same reason as the root tsconfig: tsconfig replaces
 * the whole `paths` object with the last config that defines it, so the generated
 * map wins over anything else the clone extends. Idempotent.
 */
async function wireClonedApps(
  dirname: string,
  monoTsconfigPath: string,
  writtenKeys: string[],
): Promise<string[]> {
  const wired: string[] = []

  // CLONES ONLY. An app read in place through `path` is deliberately skipped.
  //
  // This function does not just read: it WRITES an `extends` entry into each
  // app's own `tsconfig.json`. For a clone under `.mono/apps` that is fine —
  // mono created it and can rewrite it. For a sibling resolved through `path`
  // it is someone's real repository, and writing there does two concrete
  // kinds of damage:
  //
  //  - it dirties a working tree the developer did not ask mono to touch, with
  //    a relative path only valid on this machine, in a file their teammates
  //    share;
  //  - the host's `paths` then resolve inside that repo, which has its own
  //    `rootDir`, so the same "not under rootDir" breakage lands over there.
  //
  // The cost is that `defineProps<ImportedType>()` in the sibling's own SFCs
  // will not see THIS host's aliases. That app carries its own mono.config.ts
  // and runs its own `mono prepare`, which writes the same map from its point
  // of view; silently editing another repository to fix it is the worse trade.
  // (`unpreparedApps` in the result flags a sibling that has not done so yet.)
  const roots = resolveAppRoots({
    dirname,
    appsDir: MONO_APPS_DIR,
    apps: extractConfig(dirname).apps,
    // `buildMonoTsconfig` already reported a missing path; do not throw twice.
    onMissingPath: 'ignore',
  })
  for (const { name: appName, root: appDir } of roots.filter((r) => r.source === 'clone')) {
    const appTsconfigPath = path.join(appDir, 'tsconfig.json')
    if (!fs.existsSync(appTsconfigPath)) continue

    // From `.mono/apps/<app>/` back to `.mono/tsconfig.json` -> `../../tsconfig.json`.
    // A linked app resolves to a longer `../../../…`, which is equally legal.
    const ref = toRelativePosix(appDir, monoTsconfigPath)

    try {
      const raw = fs.readFileSync(appTsconfigPath, 'utf8')
      const app = await readTSConfig(appTsconfigPath)

      // `readTSConfig` swallows parse errors and hands back `{}`, which is
      // indistinguishable from a legitimately empty config — writing that back
      // would DESTROY a malformed file's real content. Only treat an empty parse
      // as genuine when the source really is an empty object.
      if (
        Object.keys(app).length === 0 &&
        stripCommentsSafe(raw).replace(/\s+/g, '') !== '{}'
      ) {
        continue
      }

      const before = extendsToArray(app.extends)
      const next = [...before.filter((r) => r !== ref), ref]

      // Inline `paths` beat anything inherited via `extends`, so a clone that
      // ships its own copy of a mono alias would shadow the generated map (and a
      // stale `@mono-host/*` there points at the clone's own outdated snapshot).
      // Same rule as the root tsconfig: `.mono/tsconfig.json` owns these keys.
      let strippedPaths = false
      const appPaths = app.compilerOptions?.paths
      if (appPaths) {
        for (const key of writtenKeys) {
          if (key in appPaths) {
            delete appPaths[key]
            strippedPaths = true
          }
        }
        if (Object.keys(appPaths).length === 0) {
          delete app.compilerOptions!.paths
        }
      }

      const extendsUnchanged =
        before.length === next.length && before.every((r, i) => r === next[i])
      if (extendsUnchanged && !strippedPaths) continue

      app.extends = next
      await writeTSConfig(appTsconfigPath, app)
      wired.push(appName)
    } catch {
      // A clone with an unreadable/malformed tsconfig is left untouched — the
      // build should surface that itself rather than have prepare mask it.
    }
  }

  return wired
}

/**
 * Generate `<dirname>/.mono/tsconfig.json` from the mono alias map and wire it
 * into the root `tsconfig.json` via `extends`, stripping the now-redundant
 * inline `@mono-*` paths. Idempotent: safe to run repeatedly.
 */
export async function runMonoPrepare(
  opts: RunMonoPrepareOptions,
): Promise<RunMonoPrepareResult> {
  const { dirname } = opts

  const tsconfig = buildMonoTsconfig({ dirname })
  const writtenKeys = Object.keys(tsconfig.compilerOptions?.paths ?? {})
  const writtenPaths = tsconfig.compilerOptions?.paths ?? {}

  // 1. Write `.mono/tsconfig.json`.
  const monoDir = path.resolve(dirname, MONO_DIR)
  if (!fs.existsSync(monoDir)) fs.mkdirSync(monoDir, { recursive: true })
  const monoTsconfigPath = path.join(monoDir, 'tsconfig.json')
  await writeTSConfig(monoTsconfigPath, tsconfig)

  // 2. Read root tsconfig.
  const rootTsconfigPath = path.resolve(dirname, 'tsconfig.json')
  if (!fs.existsSync(rootTsconfigPath)) {
    throw new Error(
      `[@mono-lit/utility] mono prepare: no tsconfig.json found at ${rootTsconfigPath}`,
    )
  }
  const root = await readTSConfig(rootTsconfigPath)

  // 2b. A sibling read through `apps[].path` maps OUTSIDE this project. That
  //     is fine for Vite and for a tsconfig that never emits — unless the root
  //     pins `rootDir`, in which case TypeScript refuses every import through
  //     the alias. Say so once, name the keys, and leave `rootDir` alone: only
  //     the project knows whether "." was deliberate.
  const outsideProject = pathsOutsideProject(dirname, writtenPaths)
  const rootDir = root.compilerOptions?.rootDir
  if (rootDir && outsideProject.length) {
    console.warn(
      `[mono] tsconfig.json sets rootDir "${rootDir}" but ${outsideProject.join(', ')} ` +
        `map outside the project (apps[].path siblings). Remove rootDir, or set it to ` +
        `the folder that contains every sibling (e.g. "../").`,
    )
  }

  // 3. Ensure `extends` includes the generated file, written as an ARRAY with
  //    our ref LAST. tsconfig replaces the whole `paths` object with the last
  //    config that defines it, so positioning `.mono/tsconfig.json` last makes
  //    its `@mono-*` aliases win over any other base config that sets `paths`.
  //    Idempotent: a re-run filters the existing ref out and re-appends it, so
  //    the order/content stays stable.
  const previousExtends = extendsToArray(root.extends)
  const addedExtends = !previousExtends.includes(MONO_TSCONFIG_REF)
  const otherExtends = previousExtends.filter((ref) => ref !== MONO_TSCONFIG_REF)
  root.extends = [...otherExtends, MONO_TSCONFIG_REF]

  // 4. Strip the inline alias keys now owned by `.mono/tsconfig.json`.
  const removedKeys: string[] = []
  const rootPaths = root.compilerOptions?.paths
  if (rootPaths) {
    for (const key of writtenKeys) {
      if (key in rootPaths) {
        delete rootPaths[key]
        removedKeys.push(key)
      }
    }
    if (Object.keys(rootPaths).length === 0) {
      delete root.compilerOptions!.paths
    }
  }

  // 5. Write the root back.
  await writeTSConfig(rootTsconfigPath, root)

  // 6. Give the cloned remotes the same alias map, so their SFCs compile in this
  //    host (see `wireClonedApps`). Runs after step 1 so the file it points at
  //    exists, and after `mono sync` in the standard `mono sync && mono prepare`
  //    pipeline, so a fresh clone is wired straight away.
  const wiredApps = await wireClonedApps(dirname, monoTsconfigPath, writtenKeys)

  // 6b. A hosted (mini) sibling cannot run its own prepare — do it for it.
  //     Before step 7, which would otherwise flag it as unprepared.
  const hostedApps = adoptHostedApps(dirname)

  // 7. A sibling that has not run ITS OWN prepare still `extends` a
  //    `.mono/tsconfig.json` that is not there — vite's esbuild plugin then
  //    fails its SFCs with "Tsconfig not found", which reads as our fault.
  const unpreparedApps = unpreparedPathApps(dirname)
  if (unpreparedApps.length) {
    console.warn(
      `[mono] ${unpreparedApps.join(', ')}: tsconfig.json extends ./.mono/tsconfig.json ` +
        `but the file is missing — run \`mono prepare\` in that app.`,
    )
  }

  return {
    monoTsconfigPath,
    rootTsconfigPath,
    writtenKeys,
    removedKeys,
    addedExtends,
    wiredApps,
    outsideProject,
    unpreparedApps,
    hostedApps,
  }
}

/** What {@link adoptHostedApps} did for one hosted (mini) `path` app. */
export interface HostedAppPrepared {
  name: string
  /** `<mini>/node_modules` -> `<host>/node_modules`: made, already right, or left alone. */
  link: 'created' | 'kept' | 'skipped'
  /** Absolute path of the generated `<mini>/.mono/tsconfig.json`. */
  tsconfig: string
}

/**
 * Prepare every HOSTED (mini) app read in place through `apps[].path`, from the
 * host's side — the mini has no `package.json`, so it can never run a
 * `mono prepare` (or an install) of its own.
 *
 *  1. `<mini>/node_modules` becomes a link (a junction on Windows — no admin
 *     rights needed) to the host's `node_modules`. A sibling outside the host
 *     has no `node_modules` above it, so every bare import in its files —
 *     `vue`, `@mono-lit/utility/*` — fails in Vite AND in jiti (the host's c12
 *     loads the mini's `mono.config.ts`). One link fixes Vite, jiti, vue-tsc and
 *     the editor together, and because the realpaths ARE the host's, there is
 *     still exactly one copy of Vue. A real directory there is never touched.
 *  2. `<mini>/.mono/tsconfig.json` extends the host's config (Nuxt host:
 *     `.nuxt/tsconfig.app.json`, Vite host: `tsconfig.json`), and — when the
 *     mini has none — `<mini>/tsconfig.json` extends that, so the editor
 *     type-checks the mini against the host's aliases and generated
 *     auto-import/route types.
 *
 * Unlike `wireClonedApps`' rule for full `path` apps, this DOES write into the
 * sibling — but only files a mini gitignores (`node_modules`, `.mono/`, the
 * generated `tsconfig.json`). Nothing it commits is ever edited. A clone under `.mono/apps` needs none
 * of this: Node already walks up to the host's `node_modules`.
 */
export function adoptHostedApps(dirname: string): HostedAppPrepared[] {
  const host = extractConfig(dirname)
  const roots = resolveAppRoots({
    dirname,
    appsDir: MONO_APPS_DIR,
    apps: host.apps,
    onMissingPath: 'ignore',
    listClones: false,
  })

  const hostModules = path.join(dirname, 'node_modules')
  const base =
    host.type === 'nuxt'
      ? path.join(dirname, '.nuxt', 'tsconfig.app.json')
      : path.join(dirname, 'tsconfig.json')

  const prepared: HostedAppPrepared[] = []
  for (const { name, type, root } of hostedAppRoots(roots)) {
    const link = linkHostModules(name, root, hostModules)

    const miniMono = path.join(root, MONO_DIR)
    if (!fs.existsSync(miniMono)) fs.mkdirSync(miniMono, { recursive: true })
    const tsconfigPath = path.join(miniMono, 'tsconfig.json')
    const rel = (abs: string) => toRelativePosix(miniMono, abs)
    const miniSrc = srcDirForType(type ?? host.type)

    const include =
      host.type === 'nuxt'
        ? [rel(path.join(dirname, '.nuxt', 'nuxt.d.ts'))]
        : [`${rel(dirname)}/*.d.ts`, `${rel(path.join(dirname, srcDirForType(host.type)))}/**/*.d.ts`]

    const json = {
      extends: rel(base),
      compilerOptions: {
        // The host may pin `rootDir: "."`; the mini lies outside it. Widen to the
        // folder holding both so TypeScript does not reject the mini's own files.
        rootDir: rel(commonDir(dirname, root)),
      },
      include: [`../${miniSrc}/**/*`, '../mono.config.ts', '../*.d.ts', ...include],
      exclude: ['../node_modules', `${rel(hostModules)}`],
    }
    const text = `${JSON.stringify(json, null, 2)}\n`
    // Unchanged content is not rewritten: the file sits in a watched sibling.
    if (!fs.existsSync(tsconfigPath) || fs.readFileSync(tsconfigPath, 'utf8') !== text) {
      fs.writeFileSync(tsconfigPath, text)
    }

    // The entry the editor finds. Generated rather than committed: a committed
    // `extends: ./.mono/tsconfig.json` dangles until a host has prepared the
    // mini, and Vite/oxc FAILS every transform of the mini's files on a missing
    // extends ("Tsconfig not found") — e.g. a clone, or a test importing its
    // mono.config. An existing file is the author's and is never replaced.
    const entryPath = path.join(root, 'tsconfig.json')
    if (!fs.existsSync(entryPath)) {
      fs.writeFileSync(entryPath, `${JSON.stringify({ extends: MONO_TSCONFIG_REF }, null, 2)}\n`)
    }

    prepared.push({ name, link, tsconfig: tsconfigPath })
  }
  return prepared
}

/** Point `<root>/node_modules` at the host's. Never replaces a real directory. */
function linkHostModules(
  name: string,
  root: string,
  hostModules: string,
): HostedAppPrepared['link'] {
  if (!fs.existsSync(hostModules)) {
    console.warn(`[mono] ${name}: the host has no node_modules yet — install the host first.`)
    return 'skipped'
  }
  const linkPath = path.join(root, 'node_modules')

  let stat: fs.Stats | undefined
  try {
    stat = fs.lstatSync(linkPath)
  } catch {
    stat = undefined
  }

  if (stat) {
    if (!stat.isSymbolicLink()) {
      console.warn(
        `[mono] ${name}: ${linkPath} is a real directory — a hosted app uses the host's ` +
          `node_modules; delete it to let mono link them.`,
      )
      return 'skipped'
    }
    let current = ''
    try {
      current = fs.realpathSync(linkPath)
    } catch {
      // dangling link — replaced below
    }
    if (current && samePath(current, fs.realpathSync(hostModules))) return 'kept'
    fs.unlinkSync(linkPath)
  }

  fs.symlinkSync(hostModules, linkPath, process.platform === 'win32' ? 'junction' : 'dir')
  return 'created'
}

function samePath(a: string, b: string): boolean {
  const norm = (p: string) => {
    const r = path.resolve(p)
    return process.platform === 'win32' ? r.toLowerCase() : r
  }
  return norm(a) === norm(b)
}

/** Deepest directory containing both `a` and `b`. */
function commonDir(a: string, b: string): string {
  const pa = path.resolve(a).split(path.sep)
  const pb = path.resolve(b).split(path.sep)
  const eq = (x: string, y: string) =>
    process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y
  let i = 0
  while (i < pa.length && i < pb.length && eq(pa[i]!, pb[i]!)) i++
  return pa.slice(0, i).join(path.sep) || path.sep
}

/** Written alias keys whose target directory is not under `dirname`. */
function pathsOutsideProject(dirname: string, paths: Record<string, string[]>): string[] {
  const monoDir = path.resolve(dirname, MONO_DIR)
  const outside: string[] = []
  for (const [key, targets] of Object.entries(paths)) {
    for (const target of targets) {
      const abs = path.resolve(monoDir, target.replace(/\/\*$/, ''))
      const rel = path.relative(dirname, abs)
      if (rel.startsWith('..') || path.isAbsolute(rel)) {
        outside.push(key)
        break
      }
    }
  }
  return outside
}

/** `path` apps whose tsconfig extends a `.mono/tsconfig.json` that does not exist. */
function unpreparedPathApps(dirname: string): string[] {
  const names: string[] = []
  const roots = resolveAppRoots({
    dirname,
    appsDir: MONO_APPS_DIR,
    apps: extractConfig(dirname).apps,
    onMissingPath: 'ignore',
    listClones: false,
  })
  for (const { name, root } of roots) {
    const tsconfigPath = path.join(root, 'tsconfig.json')
    if (!fs.existsSync(tsconfigPath)) continue
    let refs: string[] = []
    try {
      const raw = JSON.parse(stripCommentsSafe(fs.readFileSync(tsconfigPath, 'utf8')))
      refs = extendsToArray(raw?.extends)
    } catch {
      continue
    }
    const ref = refs.find((r) => r.replace(/\\/g, '/').endsWith(`${MONO_DIR}/tsconfig.json`))
    if (ref && !fs.existsSync(path.resolve(root, ref))) names.push(name)
  }
  return names
}
