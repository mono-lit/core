/**
 * Nuxt-to-Nuxt federation: mono hands the app to **Nuxt's own layer machinery**
 * instead of merging it itself.
 *
 * When both sides are Nuxt, Nuxt already resolves pages, layouts, middleware,
 * plugins, components, `app.vue` and `error.vue` across layers, with the
 * consuming app winning on any same-path file — which is precisely the
 * own-file-wins rule mono otherwise implements by hand. So `@mono-lit/utility/nuxt`
 * registers the layer and stands down.
 *
 * The properties that make that safe, all pinned here:
 *
 *  - **appended, never prepended.** Every Nuxt consumer treats earlier layers as
 *    higher priority (`layouts[name] ||=`, `mainComponent ||= findPath(…)`), and
 *    layer 0 is the consuming app. Prepending would silently hand the host's
 *    `app.vue` and layouts priority over the remote's own.
 *  - **only what can BE a layer**: a `type: 'nuxt'` app with a `nuxt.config` on
 *    disk. A Vue remote and an unsynced app must fall back to mono's merge, not
 *    crash Nuxt with a layer dir it cannot read.
 *  - **never a host.** Layers are all-or-nothing, so opting a host in would give
 *    it its remotes' `layouts/` with no way to refuse — the one thing `template`
 *    exists to prevent.
 *  - **idempotent.** A config that ALSO declares `extends: monoNuxtLayers()` must
 *    not end up with the app twice.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  buildMonoNuxtLayer,
  monoLayerCandidates,
  monoNuxtLayers,
  nuxtConfigFile,
  registerMonoNuxtLayers,
} from '../src/nuxt/nuxt-layers'
import { extractTemplate } from '../src/composables/mono-alias'

let root: string

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-nuxt-layers-'))
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

function write(rel: string, body = '') {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, body)
  return file
}

/** A mono.config.ts with the given top-level fields and `apps[]`. */
function monoConfig({
  name = 'mono-nuxt',
  type = 'nuxt',
  template,
  apps = '[]',
}: {
  name?: string
  type?: string
  template?: string
  apps?: string
} = {}) {
  fs.writeFileSync(
    path.join(root, 'mono.config.ts'),
    [
      `export default defineConfig({`,
      `  name: '${name}',`,
      `  type: '${type}',`,
      ...(template ? [`  template: '${template}',`] : []),
      `  apps: ${apps},`,
      `})`,
    ].join('\n'),
  )
}

/** A directory that looks like a synced Nuxt app. */
function nuxtApp(rel: string) {
  write(path.join(rel, 'nuxt.config.ts'), 'export default {}')
  return path.join(root, rel)
}

/** The shape `monoLayerCandidates` takes for one app. */
function appRoot(name: string, dir: string) {
  return { name, type: 'nuxt' as const, root: dir, source: 'clone' }
}

describe('extractTemplate', () => {
  it('reads the top-level template literal', () => {
    monoConfig({ template: 'remote' })
    expect(extractTemplate(root)).toBe('remote')

    monoConfig({ template: 'host' })
    expect(extractTemplate(root)).toBe('host')
  })

  it('is null when absent — which reads as remote', () => {
    monoConfig()
    expect(extractTemplate(root)).toBeNull()
  })

  // Only the text before `apps:` is searched, so a per-app key can never be
  // mistaken for the config's own role.
  it('is not shadowed by a key inside apps[]', () => {
    monoConfig({ apps: `[{ name: 'a', type: 'nuxt', template: 'host' }]` })
    expect(extractTemplate(root)).toBeNull()
  })

  it('ignores a commented-out declaration', () => {
    fs.writeFileSync(
      path.join(root, 'mono.config.ts'),
      `export default defineConfig({\n  // template: 'host',\n  name: 'x',\n  apps: [],\n})`,
    )
    expect(extractTemplate(root)).toBeNull()
  })
})

describe('nuxtConfigFile', () => {
  it('finds a nuxt.config, in any accepted extension', () => {
    write('a/nuxt.config.ts')
    write('b/nuxt.config.mjs')

    expect(nuxtConfigFile(path.join(root, 'a'))).toBe(path.join(root, 'a/nuxt.config.ts'))
    expect(nuxtConfigFile(path.join(root, 'b'))).toBe(path.join(root, 'b/nuxt.config.mjs'))
  })

  it('is null for a directory without one', () => {
    fs.mkdirSync(path.join(root, 'c'))
    expect(nuxtConfigFile(path.join(root, 'c'))).toBeNull()
  })
})

describe('monoLayerCandidates', () => {
  it('takes a synced nuxt app', () => {
    const dir = nuxtApp('.mono/apps/mono-host')

    expect(
      monoLayerCandidates({
        apps: [{ name: 'mono-host', type: 'nuxt' }],
        appRoots: [appRoot('mono-host', dir)],
        template: 'remote',
      }),
    ).toEqual([{ name: 'mono-host', root: dir, configFile: path.join(dir, 'nuxt.config.ts') }])
  })

  // A Vue remote has no Nuxt srcDir convention; it can only go through mono's
  // own merge.
  it('never takes a vue app', () => {
    const dir = nuxtApp('.mono/apps/vue-remote')

    expect(
      monoLayerCandidates({
        apps: [{ name: 'vue-remote', type: 'vue' }],
        appRoots: [appRoot('vue-remote', dir)],
        template: 'remote',
      }),
    ).toEqual([])
  })

  // Nuxt cannot read a layer dir with no config; an unsynced app must degrade to
  // mono's merge, which already stubs the missing mono.config.
  it('skips an app with no nuxt.config on disk', () => {
    const dir = path.join(root, '.mono/apps/mono-host')
    fs.mkdirSync(dir, { recursive: true })

    expect(
      monoLayerCandidates({
        apps: [{ name: 'mono-host', type: 'nuxt' }],
        appRoots: [appRoot('mono-host', dir)],
        template: 'remote',
      }),
    ).toEqual([])
  })

  it('takes nothing at all for a host', () => {
    const dir = nuxtApp('.mono/apps/nuxt-remote')

    expect(
      monoLayerCandidates({
        apps: [{ name: 'nuxt-remote', type: 'nuxt' }],
        appRoots: [appRoot('nuxt-remote', dir)],
        template: 'host',
      }),
    ).toEqual([])
  })

  // Absent `template` reads as 'remote' everywhere else in mono; it must here too.
  it('treats an absent template as a remote', () => {
    const dir = nuxtApp('.mono/apps/mono-host')

    expect(
      monoLayerCandidates({
        apps: [{ name: 'mono-host', type: 'nuxt' }],
        appRoots: [appRoot('mono-host', dir)],
      }),
    ).toHaveLength(1)
  })
})

describe('buildMonoNuxtLayer', () => {
  it('points srcDir at app/, the nuxt-type convention', () => {
    const dir = nuxtApp('.mono/apps/mono-host')
    const layer = buildMonoNuxtLayer({
      name: 'mono-host',
      root: dir,
      configFile: path.join(dir, 'nuxt.config.ts'),
    })

    expect(layer.cwd).toBe(dir)
    expect(layer.config.rootDir).toBe(dir)
    expect(layer.config.srcDir).toBe(path.join(dir, 'app'))
    expect(layer.config.dir).toMatchObject({
      pages: 'pages',
      layouts: 'layouts',
      middleware: 'middleware',
      plugins: 'plugins',
    })
  })

  // The layer contributes FILES only. Nuxt merges layer config (modules, css,
  // vite, devServer, sentry, hooks) at config-load time, long before a module
  // runs — a remote wants the host's shell, not its dev-server port or a second
  // registration of every module it already lists itself.
  it('carries no modules, css or vite config', () => {
    const dir = nuxtApp('.mono/apps/mono-host')
    const layer = buildMonoNuxtLayer({
      name: 'mono-host',
      root: dir,
      configFile: path.join(dir, 'nuxt.config.ts'),
    })

    for (const key of ['modules', 'css', 'vite', 'devServer', 'hooks', 'sentry']) {
      expect(layer.config).not.toHaveProperty(key)
    }
  })
})

describe('registerMonoNuxtLayers', () => {
  const candidate = (dir: string) => ({
    name: 'mono-host',
    root: dir,
    configFile: path.join(dir, 'nuxt.config.ts'),
  })

  // Layer 0 is the consuming app and must stay highest priority: Nuxt keeps the
  // FIRST layout of a given name and the first `app.vue` it finds.
  it('appends after the consuming app', () => {
    const dir = nuxtApp('.mono/apps/mono-host')
    const nuxt = { options: { _layers: [{ cwd: root }] } }

    const added = registerMonoNuxtLayers({ nuxt, candidates: [candidate(dir)] })

    expect(added).toEqual(new Set(['mono-host']))
    expect(nuxt.options._layers).toHaveLength(2)
    expect((nuxt.options._layers[0] as { cwd: string }).cwd).toBe(root)
    expect((nuxt.options._layers[1] as { cwd: string }).cwd).toBe(dir)
  })

  // A config may declare `extends: monoNuxtLayers()` by hand to get the layer's
  // own nuxt.config merged too. That copy is the better one — don't add a second.
  it('does not re-add a layer nuxt already has', () => {
    const dir = nuxtApp('.mono/apps/mono-host')
    const nuxt = { options: { _layers: [{ cwd: root }, { cwd: dir }] } }

    const added = registerMonoNuxtLayers({ nuxt, candidates: [candidate(dir)] })

    // Still reported as layered, so the module stands down either way.
    expect(added).toEqual(new Set(['mono-host']))
    expect(nuxt.options._layers).toHaveLength(2)
  })

  it('is a no-op with no candidates', () => {
    const nuxt = { options: { _layers: [{ cwd: root }] } }

    expect(registerMonoNuxtLayers({ nuxt, candidates: [] })).toEqual(new Set())
    expect(nuxt.options._layers).toHaveLength(1)
  })
})

describe('monoNuxtLayers (config-time escape hatch)', () => {
  it('reads apps[] straight off mono.config.ts, without executing it', () => {
    monoConfig({ template: 'remote', apps: `[{ name: 'mono-host', type: 'nuxt' }]` })
    const dir = nuxtApp('.mono/apps/mono-host')

    expect(monoNuxtLayers({ dirname: root })).toEqual([dir])
  })

  it('honours includes / excludes by app name', () => {
    monoConfig({ apps: `[{ name: 'a', type: 'nuxt' }, { name: 'b', type: 'nuxt' }]` })
    const a = nuxtApp('.mono/apps/a')
    nuxtApp('.mono/apps/b')

    expect(monoNuxtLayers({ dirname: root, includes: ['a'] })).toEqual([a])
    expect(monoNuxtLayers({ dirname: root, excludes: ['b'] })).toEqual([a])
  })

  it('is empty when there is no mono.config at all', () => {
    expect(monoNuxtLayers({ dirname: root })).toEqual([])
  })

  describe('path', () => {
    beforeEach(() => {
      monoConfig({
        apps: `[{ name: 'mono-host', type: 'nuxt', path: '../checkout' }]`,
      })
      nuxtApp('.mono/apps/mono-host')
      write('../checkout/nuxt.config.ts', 'export default {}')
    })

    // A layer is compiled in from the same directory dev served — `path` is
    // authoritative in every command, and the stale clone beside it is shadowed.
    it('reads the path directory, shadowing the clone', () => {
      expect(monoNuxtLayers({ dirname: root })).toEqual([path.resolve(root, '../checkout')])
    })

    it('ignores the deprecated link option', () => {
      expect(monoNuxtLayers({ dirname: root, link: false })).toEqual([
        path.resolve(root, '../checkout'),
      ])
    })
  })
})
