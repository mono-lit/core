/**
 * `mono.vite()` — the role-aware half of the shared `vite.config.ts`.
 *
 * The point of `template` is that a host and a remote can now ship the SAME
 * config file. Two properties keep that honest, and both are here:
 *
 *  - a `host` takes its own layouts and none of the federated ones; anything
 *    else takes both, and **an absent `template` must behave exactly as before
 *    the field existed** (otherwise adding it is a silent breaking change);
 *  - `template` never crosses an `extends` boundary. A remote extends its host,
 *    so an inherited `template: 'host'` would tell the remote to drop the very
 *    layouts it exists to consume — with nothing to error on. That one is the
 *    reason this file exists.
 *
 * Real directories rather than mocks: the options builders are thin shells over
 * `existsSync`, so stubbing that would test the stub.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  monoLayoutsOptions,
  monoPagesOptions,
  monoAutoImportOptions,
  type MonoViteContext,
} from '../src/vite/mono-vite'
import {
  resolveMonoConfig,
  type MonoConfig,
  type MonoTemplate,
} from '../src/composables/create-config'

let tmp: string

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-vite-'))
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

const mkdir = (...segments: string[]) => {
  const dir = path.join(tmp, ...segments)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

const touch = (...segments: string[]) => {
  const file = path.join(tmp, ...segments)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, '<template><div /></template>')
  return file
}

/**
 * A context standing in for one `monoRepo()` call. `ecosystem` returns whatever
 * the test says the federated apps contribute — the discovery itself is covered
 * by `mono-ecosystem-policy.test.ts`.
 */
function ctx(overrides: Partial<MonoViteContext> & { federated?: string[] } = {}) {
  const { federated = [], ...rest } = overrides
  return {
    rootDir: tmp,
    ownType: 'vue' as const,
    apps: [],
    ecosystem: () => federated,
    extendRoute: () => undefined,
    hostResolver: () => [],
    plugin: { name: 'mono-repo' } as any,
    built: new Set(),
    ...rest,
  } as MonoViteContext
}

/** Absolute temp paths are noise; compare on the tail. */
const tails = (dirs: string[]) =>
  dirs.map((dir) => dir.replace(/\\/g, '/').split('/').slice(-2).join('/'))

describe('monoLayoutsOptions — the one ecosystem template changes', () => {
  it("a host takes its OWN layouts and none of the federated ones", () => {
    mkdir('src', 'layouts')

    const options = monoLayoutsOptions(ctx({ template: 'host', federated: ['/remote/src/layouts'] }))

    expect(tails(options.layoutsDirs)).toEqual(['src/layouts'])
  })

  it('a remote takes both — its own and the federated shell', () => {
    mkdir('src', 'layouts')

    const options = monoLayoutsOptions(
      ctx({ template: 'remote', federated: ['/remote/app/layouts'] }),
    )

    expect(tails(options.layoutsDirs)).toEqual(['src/layouts', 'app/layouts'])
  })

  it('a remote with no layouts of its own resolves to the federated shell alone', () => {
    // No `src/layouts` on disk — the shape `mono-vue-remote` actually has.
    const options = monoLayoutsOptions(
      ctx({ template: 'remote', federated: ['/remote/app/layouts'] }),
    )

    expect(tails(options.layoutsDirs)).toEqual(['app/layouts'])
  })

  it('NO template behaves exactly as `remote` — adding the field breaks nobody', () => {
    mkdir('src', 'layouts')
    const federated = ['/remote/app/layouts']

    const absent = monoLayoutsOptions(ctx({ federated }))
    const remote = monoLayoutsOptions(ctx({ template: 'remote', federated }))

    expect(absent).toEqual(remote)
  })

  it('an explicit `layoutsDirs` still replaces the whole list — under both roles', () => {
    mkdir('src', 'layouts')
    const mine = ['/somewhere/else']

    for (const template of ['host', 'remote'] as MonoTemplate[]) {
      const options = monoLayoutsOptions(
        ctx({ template, federated: ['/remote/app/layouts'] }),
        { layoutsDirs: mine },
      )
      expect(options.layoutsDirs).toEqual(mine)
    }
  })

  it('layoutsDirs is always an ARRAY — a bare string swaps in ClientSideLayout', () => {
    // `mono-vue-host` hand-wrote `layoutsDirs: 'src/layouts'`, which silently
    // switches the plugin to an implementation that cannot see federated dirs.
    mkdir('src', 'layouts')

    const options = monoLayoutsOptions(ctx({ template: 'host' }))

    expect(Array.isArray(options.layoutsDirs)).toBe(true)
  })

  it('marks layouts as built even when it skips the federated lookup', () => {
    const built = new Set<any>()

    monoLayoutsOptions(ctx({ template: 'host', built }))

    expect(built.has('layouts')).toBe(true)
  })
})

describe('monoPagesOptions — the `/` exclusion stays derived from disk', () => {
  // `mono-vue-host` has `src/pages/index.vue`; `mono-vue-remote` does not. That
  // is a better signal than `template` would be — it is right for a remote that
  // owns `/` too — so it deliberately does NOT read `template`.
  it('excludes each federated root index.vue when this app owns `/`', () => {
    touch('src', 'pages', 'index.vue')

    const options = monoPagesOptions(ctx({ federated: ['/remote/app/pages'] }))

    expect(options.routesFolder.at(-1)).toMatchObject({ exclude: ['*/index.vue'] })
  })

  it('leaves the federated root alone when this app has no index.vue', () => {
    mkdir('src', 'pages')

    const options = monoPagesOptions(ctx({ federated: ['/remote/app/pages'] }))

    expect(options.routesFolder.at(-1)).not.toHaveProperty('exclude')
  })

  it('is decided by disk, not by role — a host without index.vue excludes nothing', () => {
    mkdir('src', 'pages')

    const options = monoPagesOptions(ctx({ template: 'host', federated: ['/remote/app/pages'] }))

    expect(options.routesFolder.at(-1)).not.toHaveProperty('exclude')
  })
})

describe('template never crosses an extends boundary', () => {
  const host = (): MonoConfig => ({
    name: 'mono-host',
    type: 'vue',
    template: 'host',
    apps: [],
  })

  it('a remote extending a host does NOT inherit `template: host`', () => {
    // The bug this guards: the remote would drop the host's layouts and render
    // with no shell, silently.
    const remote = resolveMonoConfig({
      name: 'mono-vue',
      type: 'vue',
      apps: [],
      extends: [host],
    } as MonoConfig)

    expect(remote.template).toBeUndefined()
  })

  it("keeps the leaf's own template when it declares one", () => {
    const remote = resolveMonoConfig({
      name: 'mono-vue',
      type: 'vue',
      template: 'remote',
      apps: [],
      extends: [host],
    } as MonoConfig)

    expect(remote.template).toBe('remote')
  })

  it('a selective `merges` list cannot smuggle it in either', () => {
    const remote = resolveMonoConfig({
      name: 'mono-vue',
      type: 'vue',
      apps: [],
      // `template` is not a MonoMergeableKey, so this is a type error too —
      // the cast is what a JS consumer could still write.
      extends: [{ config: host, merges: ['template', 'menu'] as any }],
    } as MonoConfig)

    expect(remote.template).toBeUndefined()
  })

  it('still merges the shared state it is supposed to', () => {
    const remote = resolveMonoConfig({
      name: 'mono-vue',
      type: 'vue',
      apps: [],
      extends: [
        (): MonoConfig => ({
          name: 'mono-host',
          type: 'vue',
          template: 'host',
          apps: [],
          menu: [{ title: 'From the host', url: '/host' }],
        }),
      ],
    } as MonoConfig)

    expect(remote.menu).toEqual([{ title: 'From the host', url: '/host' }])
    expect(remote.template).toBeUndefined()
  })
})

describe('monoAutoImportOptions — own dirs mirror the federated ones', () => {
  // Regression from the mono-vue-host migration: mono asks every federated app
  // for BOTH `composables` and `composables/shared`, but scanned only
  // `composables` in this app. The host keeps `useAuthStore` and `useHelper`
  // under `shared/`, so adopting mono's defaults silently dropped them — no
  // error, just four auto-imports that stopped existing.
  it('scans <src>/composables/shared and <src>/stores/shared when they exist', () => {
    mkdir('src', 'composables', 'shared')
    mkdir('src', 'stores', 'shared')

    const dirs = tails(monoAutoImportOptions(ctx()).dirs)

    expect(dirs).toContain('composables/shared')
    expect(dirs).toContain('stores/shared')
  })

  it('still lists the plain dirs, shared/ or not', () => {
    mkdir('src', 'composables')
    mkdir('src', 'stores')

    const dirs = tails(monoAutoImportOptions(ctx()).dirs)

    expect(dirs).toEqual(['src/composables', 'src/stores'])
  })

  it('an explicit `own` still replaces the pair entirely', () => {
    mkdir('src', 'composables', 'shared')
    mkdir('src', 'use')

    const dirs = tails(monoAutoImportOptions(ctx(), { composables: { own: 'src/use' } }).dirs)

    expect(dirs).toContain('src/use')
    expect(dirs).not.toContain('composables/shared')
  })
})
