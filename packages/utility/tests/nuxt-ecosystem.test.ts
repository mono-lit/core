/**
 * `@mono-lit/utility/nuxt` — the role-aware half of the Nuxt module.
 *
 * The module itself needs a live `defineNuxtModule` context, so the decisions
 * that actually differ between a host and a remote are factored into
 * `src/nuxt/nuxt-ecosystem.ts` (which imports no `@nuxt/kit`) and pinned here:
 *
 *  - which ecosystem folders a role merges. `layouts` must follow
 *    `monoLayoutsOptions` EXACTLY, absent `template` included, or the Vite and
 *    Nuxt sides of one `mono.config.ts` disagree. `middleware`/`plugins` are
 *    newer and must stay off for anything but an explicit `'remote'`, so an
 *    existing Nuxt host does not silently start running its remotes' plugins.
 *  - the federated root-`index.vue` exclusion. Hardcoding it (as this module
 *    used to) leaves a remote with no `/`, because the page it needs there is
 *    the host's login screen.
 *  - own-file-wins, which is what lets a remote replace one file of the host's
 *    shell — `plugins/mono.ts` — without disabling the whole entry.
 *
 * Real directories rather than mocks: these helpers are thin shells over
 * `existsSync`/`readdirSync`, so stubbing that would test the stub.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  ecosystemFileKey,
  layoutNameFor,
  middlewareNameFor,
  nuxtEcosystemDefaults,
  ownEcosystemKeys,
  remotePageExcludes,
  topLevelFiles,
  walkFiles,
} from '../src/nuxt/nuxt-ecosystem'

let root: string

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-nuxt-eco-'))
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

/** Which default entries are actually active for a role. */
function enabledFor(template?: 'host' | 'remote') {
  return Object.entries(nuxtEcosystemDefaults(template))
    .filter(([, entry]) => entry.enabled !== false)
    .map(([name]) => name)
    .sort()
}

describe('nuxtEcosystemDefaults', () => {
  it('merges the same four feature folders for every role', () => {
    for (const template of ['host', 'remote', undefined] as const) {
      expect(enabledFor(template)).toEqual(
        expect.arrayContaining(['pages', 'composables', 'stores', 'components']),
      )
    }
  })

  it('gives a remote the host shell: layouts, middleware and plugins', () => {
    expect(enabledFor('remote')).toEqual([
      'components',
      'composables',
      'layouts',
      'middleware',
      'pages',
      'plugins',
      'stores',
    ])
  })

  it('keeps a host from adopting federated layouts', () => {
    expect(enabledFor('host')).not.toContain('layouts')
    expect(nuxtEcosystemDefaults('host').layouts!.enabled).toBe(false)
  })

  // The rule `mono.vite()` pins: no `template` has ALWAYS meant "take the
  // federated layouts too". If this flips, one config file stops meaning the
  // same thing on the two sides.
  it('treats an absent template as a remote for layouts, like mono.vite()', () => {
    expect(enabledFor(undefined)).toContain('layouts')
  })

  // …but NOT for the two with no Vite analogue. An existing Nuxt host declares
  // no `template`; it must not start running its remotes' global middleware.
  it('keeps middleware and plugins off unless template is explicitly remote', () => {
    for (const template of ['host', undefined] as const) {
      expect(enabledFor(template)).not.toContain('middleware')
      expect(enabledFor(template)).not.toContain('plugins')
    }
  })

  it('resolves each entry to the folder name it merges', () => {
    const defaults = nuxtEcosystemDefaults('remote')
    expect(defaults.layouts).toMatchObject({ type: 'layouts', relDir: 'layouts' })
    expect(defaults.middleware).toMatchObject({ type: 'middleware', relDir: 'middleware' })
    expect(defaults.plugins).toMatchObject({ type: 'plugins', relDir: 'plugins' })
  })
})

describe('remotePageExcludes', () => {
  it('lets the federated root index through when this app has none', () => {
    fs.mkdirSync(path.join(root, 'pages'), { recursive: true })
    expect(remotePageExcludes(path.join(root, 'pages'))).toEqual([])
  })

  it('excludes it when this app owns `/` itself', () => {
    write('pages/index.vue')
    expect(remotePageExcludes(path.join(root, 'pages'))).toEqual(['index.vue'])
  })

  it('treats a missing pages dir as owning nothing', () => {
    expect(remotePageExcludes(path.join(root, 'nope'))).toEqual([])
  })

  // A remote's own deeper pages are irrelevant to who owns `/`.
  it('is not fooled by a nested index.vue', () => {
    write('pages/memo/index.vue')
    expect(remotePageExcludes(path.join(root, 'pages'))).toEqual([])
  })
})

describe('ecosystemFileKey / ownEcosystemKeys', () => {
  it('keys on the basename without extension', () => {
    expect(ecosystemFileKey('/a/b/mono.ts')).toBe('mono')
    expect(ecosystemFileKey('C:\\a\\b\\home.vue')).toBe('home')
  })

  // Two versions of one plugin, not two plugins — so an own `mono.ts` must beat
  // a federated `mono.client.ts`.
  it('drops a trailing mode/scope suffix', () => {
    expect(ecosystemFileKey('sentry.client.ts')).toBe('sentry')
    expect(ecosystemFileKey('route-guard.global.ts')).toBe('route-guard')
    expect(ecosystemFileKey('cookie.server.mts')).toBe('cookie')
  })

  it('collects the keys this app ships, ignoring subdirectories', () => {
    write('plugins/mono.ts')
    write('plugins/sentry.client.ts')
    write('plugins/nested/ignored.ts')

    expect(ownEcosystemKeys(path.join(root, 'plugins'))).toEqual(
      new Set(['mono', 'sentry']),
    )
  })

  it('is empty for a folder this app does not have', () => {
    expect(ownEcosystemKeys(path.join(root, 'layouts')).size).toBe(0)
  })
})

describe('layoutNameFor / middlewareNameFor', () => {
  it('flattens a nested layout path the way Nuxt does', () => {
    const dir = path.join(root, 'layouts')
    expect(layoutNameFor(dir, path.join(dir, 'home.vue'))).toBe('home')
    expect(layoutNameFor(dir, path.join(dir, 'admin', 'users.vue'))).toBe('admin-users')
  })

  it('reads the .global suffix off a middleware filename', () => {
    expect(middlewareNameFor('/a/route-guard.global.ts')).toEqual({
      name: 'route-guard',
      global: true,
    })
    expect(middlewareNameFor('/a/auth.ts')).toEqual({ name: 'auth', global: false })
  })
})

describe('walkFiles / topLevelFiles', () => {
  // Middleware must NOT recurse: mono-nuxt-host keeps `run-guards.ts` and
  // `guards/*` under `middleware/` as plain modules the global one imports.
  // Recursing would register four guards as four independent middlewares.
  it('topLevelFiles ignores nested modules', () => {
    write('middleware/route-guard.global.ts')
    write('middleware/run-guards.ts')
    write('middleware/guards/auth.ts')
    write('middleware/guards/access.ts')

    expect(
      topLevelFiles(path.join(root, 'middleware'), ['.ts'])
        .map((f) => path.basename(f))
        .sort(),
    ).toEqual(['route-guard.global.ts', 'run-guards.ts'])
  })

  it('walkFiles does recurse, for layouts', () => {
    write('layouts/home.vue')
    write('layouts/admin/users.vue')
    write('layouts/notes.md')

    expect(
      walkFiles(path.join(root, 'layouts'), ['.vue'])
        .map((f) => path.basename(f))
        .sort(),
    ).toEqual(['home.vue', 'users.vue'])
  })

  it('returns nothing for a missing directory', () => {
    expect(walkFiles(path.join(root, 'nope'), ['.vue'])).toEqual([])
    expect(topLevelFiles(path.join(root, 'nope'), ['.ts'])).toEqual([])
  })
})
