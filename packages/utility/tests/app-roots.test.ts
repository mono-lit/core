/**
 * `MonoAppConfig.path` — resolving a federated app to the directory it is
 * read from, in place.
 *
 * The properties worth pinning: `path` is authoritative in EVERY command (no
 * dev/build split), a `path` that does not exist falls back to the clone when
 * there is a `url` to sync from and is an ERROR when there is not, and nothing
 * here is ever a delete target.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resolveAppRoots, resetAppPathWarnings } from '../src/composables/app-roots'
import { resolveFederatedRoots, monoAlias, assertAppSources } from '../src/composables/mono-alias'
import { createRemoteMatcher } from '../src/vite/remote-matcher'
import { monoTsconfigPaths } from '../src/composables/mono-tsconfig'
import { appDirToPrune, orphanAppDirs } from '../bin/mono-git.mjs'

let tmp: string

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-app-roots-'))
  resetAppPathWarnings()
})

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

const mkdir = (...segments: string[]) => {
  const dir = path.join(tmp, ...segments)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

describe('resolveAppRoots', () => {
  it('reads clones from .mono/apps when no app declares a path', () => {
    mkdir('.mono', 'apps', 'host')

    const roots = resolveAppRoots({ dirname: tmp, apps: [{ name: 'host', type: 'nuxt' }] })

    expect(roots).toHaveLength(1)
    expect(roots[0]!.name).toBe('host')
    expect(roots[0]!.source).toBe('clone')
    expect(roots[0]!.root).toBe(path.join(tmp, '.mono', 'apps', 'host'))
  })

  it('resolves a relative path against dirname, and marks it linked', () => {
    const local = mkdir('sibling')

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', path: './sibling' }],
    })

    expect(roots).toEqual([{ name: 'host', type: 'nuxt', root: local, source: 'path' }])
  })

  it('keeps an absolute path as-is', () => {
    const local = mkdir('elsewhere')

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'vue', path: local }],
    })

    expect(roots[0]!.root).toBe(local)
  })

  it('shadows a clone of the same name — the whole point', () => {
    mkdir('.mono', 'apps', 'host')
    const local = mkdir('sibling')

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', path: './sibling' }],
    })

    expect(roots).toHaveLength(1)
    expect(roots[0]!.root).toBe(local)
    expect(roots[0]!.source).toBe('path')
  })

  it('falls back to the clone when the path does not exist and there is a url, and warns', () => {
    const clone = mkdir('.mono', 'apps', 'host')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', url: 'x', path: './not-here' }],
    })

    expect(roots).toEqual([{ name: 'host', type: 'nuxt', root: clone, source: 'clone' }])
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toContain('host')
  })

  it('yields nothing when the path is missing, there is a url, and no clone exists', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', url: 'x', path: './not-here' }],
    })

    expect(roots).toEqual([])
  })

  it('THROWS when the path is missing and there is no url — nothing to fall back to', () => {
    mkdir('.mono', 'apps', 'host')

    expect(() =>
      resolveAppRoots({
        dirname: tmp,
        apps: [{ name: 'host', type: 'nuxt', path: './not-here' }],
      }),
    ).toThrow(/host.*not-here.*no url/s)
  })

  it('onMissingPath: ignore skips a missing path silently, url or not', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const clone = mkdir('.mono', 'apps', 'host')

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', path: './not-here' }],
      onMissingPath: 'ignore',
    })

    expect(roots).toEqual([{ name: 'host', type: 'nuxt', root: clone, source: 'clone' }])
    expect(warn).not.toHaveBeenCalled()
  })

  it('honours path with no opt-in — there is no dev/build switch', () => {
    mkdir('.mono', 'apps', 'host')
    const local = mkdir('sibling')

    // `link` is accepted (deprecated) and changes nothing.
    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', path: './sibling' }],
      link: false,
    })

    expect(roots).toEqual([{ name: 'host', type: 'nuxt', root: local, source: 'path' }])
  })

  it('listClones: false resolves only the declared path entries', () => {
    mkdir('.mono', 'apps', 'other')
    const local = mkdir('sibling')

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', path: './sibling' }],
      listClones: false,
    })

    expect(roots).toEqual([{ name: 'host', type: 'nuxt', root: local, source: 'path' }])
  })

  it('reports a linked app even with no .mono/apps directory at all', () => {
    const local = mkdir('sibling')

    const roots = resolveAppRoots({
      dirname: tmp,
      apps: [{ name: 'host', type: 'nuxt', path: './sibling' }],
    })

    expect(roots.map((r) => r.root)).toEqual([local])
  })

  it('warns once per missing path, not once per call', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const apps = [{ name: 'host', type: 'nuxt' as const, url: 'x', path: './nope' }]

    resolveAppRoots({ dirname: tmp, apps })
    resolveAppRoots({ dirname: tmp, apps })

    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('createRemoteMatcher', () => {
  it('matches the .mono/apps marker, as before', () => {
    const isRemote = createRemoteMatcher()

    expect(isRemote('/repo/.mono/apps/host/app/pages/index.vue')).toBe(true)
    expect(isRemote('/repo/src/pages/index.vue')).toBe(false)
  })

  it('matches a linked root — what the marker alone cannot see', () => {
    const isRemote = createRemoteMatcher({ roots: ['/work/sibling'] })

    expect(isRemote('/work/sibling/app/pages/index.vue')).toBe(true)
    expect(isRemote('/work/other/app/pages/index.vue')).toBe(false)
  })

  it('treats a root as a DIRECTORY prefix, so host does not swallow host-extra', () => {
    const isRemote = createRemoteMatcher({ roots: ['/work/host'] })

    expect(isRemote('/work/host/app/x.vue')).toBe(true)
    expect(isRemote('/work/host-extra/app/x.vue')).toBe(false)
  })

  it('normalises separators — Vite ids and path.resolve disagree on Windows', () => {
    const isRemote = createRemoteMatcher({ roots: ['C:\\work\\sibling'] })

    expect(isRemote('C:/work/sibling/app/pages/index.vue')).toBe(true)
  })

  it('ignores the query string', () => {
    const isRemote = createRemoteMatcher({ roots: ['/work/sibling'] })

    expect(isRemote('/work/sibling/a.vue?vue&type=script')).toBe(true)
  })
})

describe('appDirToPrune', () => {
  // These are the tests that matter most: everything else here only reads,
  // this one guards an `rmrf`.
  it('returns the resolved path for a normal app dir', () => {
    const appsDir = path.join(tmp, '.mono', 'apps')

    expect(appDirToPrune(appsDir, 'host')).toBe(path.join(appsDir, 'host'))
  })

  it('refuses `..` traversal', () => {
    const appsDir = path.join(tmp, '.mono', 'apps')

    expect(() => appDirToPrune(appsDir, '../../../sibling')).toThrow(/not inside/)
  })

  it('refuses an absolute path elsewhere', () => {
    const appsDir = path.join(tmp, '.mono', 'apps')

    expect(() => appDirToPrune(appsDir, path.join(tmp, 'sibling'))).toThrow(/not inside/)
  })

  it('refuses the apps dir itself', () => {
    const appsDir = path.join(tmp, '.mono', 'apps')

    expect(() => appDirToPrune(appsDir, '.')).toThrow(/not inside/)
  })
})

describe('tsconfig paths follow path', () => {
  // The editor must type-check what Vite serves and builds. A sibling maps
  // OUTSIDE the project, which a `rootDir: "."` tsconfig rejects — that is
  // reported by `runMonoPrepare` (see mono-prepare-cloned-apps.test.ts), not
  // avoided by silently mapping to a stale clone.
  it('maps a path app to its directory even when a stale clone exists', () => {
    mkdir('.mono', 'apps', 'host', 'src')
    mkdir('sibling', 'src')
    fs.writeFileSync(
      path.join(tmp, 'mono.config.ts'),
      `export default { name: 'own', type: 'vue', apps: [` +
        `{ name: 'host', url: 'x', type: 'vue', path: './sibling' }` +
        `] }`,
    )

    const paths = monoTsconfigPaths({ dirname: tmp })

    expect(paths['@host/*']!.join()).toContain('sibling/src')
    expect(paths['@host/*']!.join()).not.toContain('apps/host')
  })

  it('maps a path app that was never synced', () => {
    mkdir('.mono', 'apps')
    mkdir('sibling', 'src')
    fs.writeFileSync(
      path.join(tmp, 'mono.config.ts'),
      `export default { name: 'own', type: 'vue', apps: [` +
        `{ name: 'host', url: 'x', type: 'vue', path: './sibling' }` +
        `] }`,
    )

    const paths = monoTsconfigPaths({ dirname: tmp })

    expect(paths['@host/*'], 'a declared app must map to something').toBeDefined()
    expect(paths['@host/*']!.join()).toContain('sibling')
    // `-root` is minted alongside it, and reaches the checkout root not its src.
    expect(paths['@host-root/*']!.join()).toContain('sibling')
    expect(paths['@host-root/*']!.join()).not.toContain('sibling/src')
  })

  it('leaves an app with neither a clone nor a path unmapped', () => {
    mkdir('.mono', 'apps')
    fs.writeFileSync(
      path.join(tmp, 'mono.config.ts'),
      `export default { name: 'own', type: 'vue', apps: [` +
        `{ name: 'host', url: 'x', type: 'vue' }` +
        `] }`,
    )

    // Nothing to point at, so nothing is invented — the fallback must not
    // start guessing at sibling directories by name.
    expect(monoTsconfigPaths({ dirname: tmp })['@host/*']).toBeUndefined()
  })
})

describe('prune leaves a linked app alone', () => {
  it('keeps the clone of an app that is still declared, path or not', () => {
    const appsDir = mkdir('.mono', 'apps')
    fs.mkdirSync(path.join(appsDir, 'host'))

    // A linked app stays in `apps[]` — `path` never removes it — so its name is
    // in keepNames and its directory is not an orphan.
    expect(orphanAppDirs(appsDir, ['host'])).toEqual([])
  })
})

describe('resolveFederatedRoots', () => {
  const config = (dir: string, name: string, apps: string) =>
    fs.writeFileSync(
      path.join(dir, 'mono.config.ts'),
      `export default { name: '${name}', type: 'vue', apps: [${apps}] }`,
    )

  it('unions the root apps with the path apps each of them declares, resolved against THAT app', () => {
    const host = mkdir('host')
    const other = mkdir('other')
    mkdir('own')
    const own = path.join(tmp, 'own')
    config(own, 'own', `{ name: 'host', type: 'vue', path: '../host' }`)
    // `../other` is relative to host/, not to own/.
    config(host, 'host', `{ name: 'own', type: 'vue', path: '../own' }, { name: 'other', type: 'nuxt', path: '../other' }`)

    const roots = resolveFederatedRoots({ dirname: own })

    expect(roots).toEqual([
      { name: 'host', type: 'vue', root: host, source: 'path' },
      { name: 'other', type: 'nuxt', root: other, source: 'path', via: 'host' },
    ])
  })

  it('does not loop on mutual federation and never lists a sibling\'s own clones', () => {
    const host = mkdir('host')
    mkdir('host', '.mono', 'apps', 'stale-clone')
    const own = mkdir('own')
    config(own, 'own', `{ name: 'host', type: 'vue', path: '../host' }`)
    config(host, 'host', `{ name: 'own', type: 'vue', path: '../own' }`)

    const roots = resolveFederatedRoots({ dirname: own })

    expect(roots.map((r) => r.name)).toEqual(['host'])
  })

  it('skips a sibling\'s missing path silently — that sibling reports it itself', () => {
    const host = mkdir('host')
    const own = mkdir('own')
    config(own, 'own', `{ name: 'host', type: 'vue', path: '../host' }`)
    config(host, 'host', `{ name: 'ghost', type: 'vue', path: '../ghost' }`)

    expect(resolveFederatedRoots({ dirname: own }).map((r) => r.name)).toEqual(['host'])
  })

  it('monoAlias aliases the transitive sibling, with the type its declarer gave it', () => {
    const host = mkdir('host')
    const other = mkdir('other')
    const own = mkdir('own')
    config(own, 'own', `{ name: 'host', type: 'vue', path: '../host' }`)
    config(host, 'host', `{ name: 'other', type: 'nuxt', path: '../other' }`)

    const alias = monoAlias({ dirname: own })

    expect(alias['@host']).toBe(path.resolve(host, 'src'))
    expect(alias['@other']).toBe(path.resolve(other, 'app'))
    expect(alias['@other-root']).toBe(other)
  })
})

describe('assertAppSources', () => {
  it('accepts url-only, path-only and both', () => {
    expect(() =>
      assertAppSources(
        [
          { name: 'a', type: 'vue', url: 'x' },
          { name: 'b', type: 'vue', path: '../b' },
          { name: 'c', type: 'vue', url: 'x', path: '../c' },
        ],
        'f',
      ),
    ).not.toThrow()
  })

  it('rejects an app with neither url nor path, by name', () => {
    expect(() => assertAppSources([{ name: 'ghost', type: 'vue' }], 'f')).toThrow(/ghost.*neither url nor path/)
  })

  it('rejects an empty path', () => {
    expect(() => assertAppSources([{ name: 'a', type: 'vue', path: '  ' }], 'f')).toThrow(/non-empty/)
  })
})
