import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
    monoEcosystem,
    mergeEcosystem,
    ecosystemSubAllowed,
} from '../src/composables/merge-file'

/**
 * The `ecosystems` allowlist from a selective `extends` entry, applied at
 * directory-discovery time.
 *
 * This is also the first coverage `monoEcosystem` has had, so it pins the
 * pre-existing behaviour too: type-aware srcDirs (`vue` -> `src/`, `nuxt` ->
 * `app/`), and only-existing-dirs-are-returned.
 *
 * Real directories on disk rather than mocks — `mergeEcosystem` is a thin shell
 * over `readdirSync`/`existsSync`, so stubbing those would test the stub.
 */

let root: string

/** `.mono/apps/<app>/<srcDir>/<sub>` for each entry. */
const tree: Record<string, { src: string; subs: string[] }> = {
    'gallery-apps': {
        src: 'src',
        subs: ['pages', 'components', 'composables', 'composables/shared', 'stores'],
    },
    'mono-host': { src: 'app', subs: ['pages', 'components', 'layouts'] },
}

const APPS = [
    { name: 'gallery-apps', type: 'vue' as const },
    { name: 'mono-host', type: 'nuxt' as const },
]

/** Compare on `<app>/<srcDir>/<sub>` tails — absolute temp paths are noise. */
const tails = (dirs: string[]) =>
    dirs
        .map((d) => path.relative(path.join(root, '.mono', 'apps'), d).replaceAll('\\', '/'))
        .sort()

beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-eco-'))
    for (const [app, { src, subs }] of Object.entries(tree)) {
        for (const sub of subs) {
            fs.mkdirSync(path.join(root, '.mono', 'apps', app, src, sub), { recursive: true })
        }
    }
})

afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

describe('ecosystemSubAllowed', () => {
    it('allows everything when no policy was declared', () => {
        expect(ecosystemSubAllowed('components', undefined)).toBe(true)
    })

    it('allows nothing for an explicit empty list', () => {
        expect(ecosystemSubAllowed('pages', [])).toBe(false)
    })

    it('matches segment-wise, so a parent admits its children', () => {
        expect(ecosystemSubAllowed('composables', ['composables'])).toBe(true)
        expect(ecosystemSubAllowed('composables/shared', ['composables'])).toBe(true)
    })

    it('does not match a partial segment', () => {
        // the bug a plain `startsWith` would introduce
        expect(ecosystemSubAllowed('composables', ['compos'])).toBe(false)
        expect(ecosystemSubAllowed('components', ['composables'])).toBe(false)
    })

    it('does not let a child entry admit its parent', () => {
        expect(ecosystemSubAllowed('composables', ['composables/shared'])).toBe(false)
    })

    it('normalises separators and leading `./`', () => {
        expect(ecosystemSubAllowed('composables\\shared', ['composables'])).toBe(true)
        expect(ecosystemSubAllowed('./pages', ['pages'])).toBe(true)
        expect(ecosystemSubAllowed('pages', ['./pages/'])).toBe(true)
    })
})

describe('monoEcosystem — baseline (no policy)', () => {
    it('resolves each app against its own type srcDir', () => {
        expect(tails(monoEcosystem({ dirname: root, apps: APPS, subs: 'pages' }))).toEqual([
            'gallery-apps/src/pages',
            'mono-host/app/pages',
        ])
    })

    it('returns only directories that exist', () => {
        // gallery has no `layouts`, mono-host does
        expect(tails(monoEcosystem({ dirname: root, apps: APPS, subs: 'layouts' }))).toEqual([
            'mono-host/app/layouts',
        ])
    })
})

describe('monoEcosystem — ecosystems policy', () => {
    it('gates one app without touching the others', () => {
        const dirs = monoEcosystem({
            dirname: root,
            apps: APPS,
            subs: 'components',
            ecosystems: { 'gallery-apps': ['pages', 'composables', 'stores'] },
        })

        // gallery declared no `components`, so only the unrestricted host remains
        expect(tails(dirs)).toEqual(['mono-host/app/components'])
    })

    it('still serves a sub that IS on the list', () => {
        const dirs = monoEcosystem({
            dirname: root,
            apps: APPS,
            subs: 'pages',
            ecosystems: { 'gallery-apps': ['pages', 'composables', 'stores'] },
        })

        expect(tails(dirs)).toEqual(['gallery-apps/src/pages', 'mono-host/app/pages'])
    })

    it('drops an app entirely for an empty list', () => {
        const dirs = monoEcosystem({
            dirname: root,
            apps: APPS,
            subs: 'pages',
            ecosystems: { 'gallery-apps': [] },
        })

        expect(tails(dirs)).toEqual(['mono-host/app/pages'])
    })

    it('filters per sub within one multi-sub call', () => {
        const dirs = monoEcosystem({
            dirname: root,
            apps: APPS,
            subs: ['pages', 'components'],
            ecosystems: { 'gallery-apps': ['pages'], 'mono-host': ['components'] },
        })

        expect(tails(dirs)).toEqual(['gallery-apps/src/pages', 'mono-host/app/components'])
    })

    it('admits a nested sub through its parent', () => {
        const dirs = monoEcosystem({
            dirname: root,
            apps: APPS,
            subs: ['composables', 'composables/shared'],
            ecosystems: { 'gallery-apps': ['composables'] },
        })

        expect(tails(dirs)).toEqual([
            'gallery-apps/src/composables',
            'gallery-apps/src/composables/shared',
        ])
    })

    it('gates the host layer too — a remote ignoring host dirs in dev', () => {
        // The user's actual case: a remote extends the host, so the "layer" is
        // the host, and `ecosystems` is how the remote declines its layouts.
        const dirs = monoEcosystem({
            dirname: root,
            apps: APPS,
            subs: 'layouts',
            ecosystems: { 'mono-host': ['pages'] },
        })

        expect(dirs).toEqual([])
    })
})

describe('mergeEcosystem — the low-level primitive honours it too', () => {
    it('gates a per-app appDirs entry', () => {
        const dirs = mergeEcosystem<string>({
            dirname: root,
            appDirs: {
                'gallery-apps': ['src/components'],
                'mono-host': ['app/components'],
            },
            ecosystems: { 'gallery-apps': ['pages'] },
        })

        expect(tails(dirs)).toEqual(['mono-host/app/components'])
    })

    it('gates the legacy `sub` form, which resolves under `src/`', () => {
        const dirs = mergeEcosystem<string>({
            dirname: root,
            sub: 'components',
            ecosystems: { 'gallery-apps': [] },
        })

        // only gallery is a `src/` app, and it is blocked
        expect(tails(dirs)).toEqual([])
    })
})
