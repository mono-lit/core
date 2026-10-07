/**
 * The Vite half of a mono-lith: every federated app is a SIBLING directory
 * read in place through `apps[].path`, and the dev server has to treat those
 * directories as its own.
 *
 * Three things Vite does not do for a directory outside its root, and this
 * plugin adds:
 *
 *  1. **Serve it** — `server.fs.allow` refuses anything not listed.
 *  2. **Watch it** — Vite watches only its root (plus config deps and env
 *     files). A sibling file that is already in the module graph hot-updates,
 *     because Vite adds imported files to the watcher one by one; a NEW page,
 *     component or composable in the sibling's `src/` never emits an `add`
 *     event, so unplugin-vue-router / components / auto-import never learn of
 *     it. `server.watcher.add(<sibling>/src)` is what makes them.
 *  3. **Restart on a config change** — `mono.config.ts` (ours or a sibling's)
 *     is loaded through c12/jiti at config time, outside Vite's own
 *     config-dependency tracking. Aliases, `__MONO_CONFIG_EXPOSE__`, the
 *     `extends` gate and every ecosystem dir derive from it, and none can be
 *     patched live, so a change restarts the server.
 *
 * Plus one module: `virtual:mono-apps`, the lith-aware replacement for the
 * `import.meta.glob('../../.mono/apps/*​/mono.config.ts')` hosts used to merge
 * remote menus — a glob over the clone folder cannot see a sibling.
 *
 * `monoRepo()` folds these hooks into its own plugin; a long-hand
 * `vite.config.ts` (`monoAlias` + `monoEcosystem` by hand) registers
 * {@link monoLith} itself.
 */
import type { Plugin, ViteDevServer } from 'vite'
import { join } from 'node:path'
import {
  extractConfig,
  monoConfigFileFor,
  resolveFederatedRoots,
} from '../composables/mono-alias'
import { pathAppRoots, type MonoAppRoot } from '../composables/app-roots'
import { srcDirForType } from '../composables/create-config'

export const MONO_APPS_VIRTUAL_ID = 'virtual:mono-apps'
const RESOLVED_VIRTUAL_ID = '\0virtual:mono-apps'

export interface MonoLithOptions {
  /** Project root. Defaults to `process.cwd()`. */
  dirname?: string
  /** Folder scanned for clones. @default './.mono/apps' */
  appsDir?: string
  /**
   * Pre-resolved roots (what `monoRepo` already computed). Resolved from
   * `mono.config.ts` when omitted.
   */
  appRoots?: MonoAppRoot[]
  /**
   * Names of the apps that contribute — the `extends`-gated set. Every
   * resolved root when omitted. Drives `virtual:mono-apps` and the config
   * watch list; siblings are served and watched regardless.
   */
  activeNames?: string[]
  /**
   * Restart the dev server when any active app's `mono.config.ts` changes.
   * @default true
   */
  restartOnConfigChange?: boolean
  /**
   * Add every `path` sibling's source dir to the dev watcher so new files are
   * picked up by the ecosystem plugins.
   * @default true
   */
  watchSiblings?: boolean
}

/** The hooks, shared by {@link monoLith} and `monoRepo`'s own plugin. */
export interface MonoLithHooks {
  /** Extra `server.fs.allow` entries: every `path` root. */
  fsAllow: string[]
  /** The resolved roots this instance works from. */
  appRoots: MonoAppRoot[]
  configureServer: (server: ViteDevServer) => void
  resolveId: (id: string) => string | undefined
  load: (id: string) => string | undefined
}

/** `C:\a\B` -> `c:/a/b` — chokidar and Vite slash paths differently, and Windows is case-insensitive. */
function normalizeFsPath(value: string): string {
  const slashed = value.replace(/\\/g, '/')
  return process.platform === 'win32' ? slashed.toLowerCase() : slashed
}

/** Forward-slashed absolute path, safe inside a JS string literal. */
function importSpecifier(file: string): string {
  return JSON.stringify(file.replace(/\\/g, '/'))
}

export function createMonoLithHooks(options: MonoLithOptions = {}): MonoLithHooks {
  const rootDir = options.dirname ?? process.cwd()
  const appRoots =
    options.appRoots ??
    resolveFederatedRoots({
      dirname: rootDir,
      ...(options.appsDir ? { appsDir: options.appsDir } : {}),
    })
  const siblings = pathAppRoots(appRoots)

  const active = options.activeNames
    ? appRoots.filter((r) => options.activeNames!.includes(r.name))
    : appRoots

  // Own config first: it is the one most often edited, and it is not in
  // `appRoots` (those are the OTHER apps).
  const configFiles: { name: string; file: string }[] = []
  const ownName = extractConfig(rootDir).name ?? '<root>'
  const ownConfig = monoConfigFileFor(rootDir)
  if (ownConfig) configFiles.push({ name: ownName, file: ownConfig })
  for (const root of active) {
    const file = monoConfigFileFor(root.root)
    if (file) configFiles.push({ name: root.name, file })
  }
  const configByPath = new Map(configFiles.map((c) => [normalizeFsPath(c.file), c.name]))

  const load = (id: string): string | undefined => {
    if (id !== RESOLVED_VIRTUAL_ID) return undefined
    // Absolute specifiers on purpose: the importer is a `\0` id with no
    // directory, so a relative path has nothing to resolve against. Vite
    // treats a drive-letter absolute as an fs path in dev (served through
    // `/@fs/`, allowed by `fs.allow` above) and in a build (bundled).
    const entries = active.flatMap((r) => {
      const file = monoConfigFileFor(r.root)
      return file ? [`  ${JSON.stringify(r.name)}: () => import(${importSpecifier(file)}),`] : []
    })
    return [
      '// Generated by @mono-lit/utility (virtual:mono-apps): one lazy import per',
      '// federated app\u2019s mono.config, whether it is a sibling or a clone.',
      'export default {',
      ...entries,
      '}',
      '',
    ].join('\n')
  }

  const configureServer = (server: ViteDevServer): void => {
    if (options.watchSiblings !== false) {
      for (const sibling of siblings) {
        server.watcher.add(join(sibling.root, srcDirForType(sibling.type ?? 'vue')))
      }
    }

    if (options.restartOnConfigChange === false) return
    for (const { file } of configFiles) server.watcher.add(file)

    let restarting = false
    const onConfigEvent = (file: string) => {
      const name = configByPath.get(normalizeFsPath(file))
      if (!name || restarting) return
      restarting = true
      server.config.logger.info(`[mono] mono.config changed (${name}) — restarting`, {
        timestamp: true,
      })
      // The restarted server is a new instance with new hooks; this closure
      // dies with the old one, so `restarting` never needs resetting.
      void server.restart()
    }
    server.watcher.on('change', onConfigEvent)
    server.watcher.on('add', onConfigEvent)
    server.watcher.on('unlink', onConfigEvent)
  }

  return {
    fsAllow: siblings.map((r) => r.root),
    appRoots,
    configureServer,
    resolveId: (id) => (id === MONO_APPS_VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined),
    load,
  }
}

/**
 * Standalone plugin for a long-hand `vite.config.ts`. `monoRepo().vite()` /
 * `mono.plugin` already include these hooks — do not register both.
 *
 * ```ts
 * import { monoLith } from '@mono-lit/utility/vite'
 * plugins: [VueRouter({ … }), vue(), monoLith({ dirname: __dirname })]
 * ```
 */
export function monoLith(options: MonoLithOptions = {}): Plugin {
  const hooks = createMonoLithHooks(options)
  return {
    name: 'mono-lith',
    config() {
      if (!hooks.fsAllow.length) return
      // Listing ANY `fs.allow` entry replaces Vite's default (the workspace
      // root), so the project root has to be restated alongside the siblings.
      return {
        server: { fs: { allow: [options.dirname ?? process.cwd(), ...hooks.fsAllow] } },
      }
    },
    configureServer: hooks.configureServer,
    resolveId: hooks.resolveId,
    load: hooks.load,
  }
}
