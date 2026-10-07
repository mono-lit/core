import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runMonoPrepare } from '../src/composables/mono-tsconfig'

/**
 * `mono prepare` wiring the CLONED remotes under `.mono/apps/`, not just the root.
 *
 * Why this matters beyond editor comfort: `@vue/compiler-sfc` resolves the type-only
 * imports in `defineProps<ImportedType>()` through the NEAREST tsconfig's `paths`
 * (`ts.findConfigFile` walks up from the SFC and stops at the clone's own tsconfig —
 * it never reaches the host's). Vite's `resolve.alias` is invisible to it. A clone
 * arrives with no usable `paths` at all: its own `.mono/tsconfig.json` is gitignored so
 * it is missing from the archive `mono sync` downloads, and `sanitizeClonedTsconfig`
 * then strips the dangling `.mono` `extends`. Without the wiring below, a host build of
 * such a remote dies with `Failed to resolve import source "@some-app/types"`.
 */

let dir: string

/** Minimal host app root: mono.config.ts + tsconfig.json, plus cloned remotes. */
function scaffold(apps: Record<string, { tsconfig?: unknown } | null>): void {
    fs.writeFileSync(
        path.join(dir, 'mono.config.ts'),
        `export default { name: 'mono-host', type: 'nuxt', apps: [${Object.keys(apps)
            .map((n) => `{ name: '${n}', type: 'vue' }`)
            .join(', ')}] }\n`,
    )
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }, null, 2))

    for (const [name, spec] of Object.entries(apps)) {
        const appDir = path.join(dir, '.mono', 'apps', name)
        fs.mkdirSync(appDir, { recursive: true })
        if (spec === null) continue // a clone with NO tsconfig.json
        fs.writeFileSync(
            path.join(appDir, 'tsconfig.json'),
            JSON.stringify(spec.tsconfig ?? { compilerOptions: {} }, null, 2),
        )
    }
}

const readApp = (name: string): any =>
    JSON.parse(fs.readFileSync(path.join(dir, '.mono', 'apps', name, 'tsconfig.json'), 'utf8'))

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-prepare-'))
})

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('runMonoPrepare — cloned apps', () => {
    it('points a freshly-synced clone at the generated tsconfig', async () => {
        scaffold({ 'flow-app': {} })

        const result = await runMonoPrepare({ dirname: dir })

        // `.mono/apps/flow-app/` -> `.mono/tsconfig.json`
        expect(readApp('flow-app').extends).toEqual(['../../tsconfig.json'])
        expect(result.wiredApps).toEqual(['flow-app'])
        // The alias the clone's SFCs need is in the file it now extends.
        const generated = JSON.parse(fs.readFileSync(result.monoTsconfigPath, 'utf8'))
        expect(generated.compilerOptions.paths['@flow-app/*']).toEqual(['./apps/flow-app/src/*'])
    })

    it('appends LAST so the generated map wins over the clone’s other bases', async () => {
        scaffold({ 'flow-app': { tsconfig: { extends: ['./tsconfig.base.json'] } } })

        await runMonoPrepare({ dirname: dir })

        // tsconfig replaces `paths` with the LAST config defining it.
        expect(readApp('flow-app').extends).toEqual(['./tsconfig.base.json', '../../tsconfig.json'])
    })

    it('strips inline alias paths that would shadow the generated map', async () => {
        // A clone carries its own `@mono-host/*` pointing at the outdated host snapshot
        // it was published with, and inline `paths` beat anything inherited via
        // `extends` — so it would win over the host's real, current mapping.
        scaffold({
            'flow-app': {
                tsconfig: {
                    compilerOptions: {
                        paths: { '@mono-host/*': ['./.mono/apps/mono-host/src/*'], '@keep-me/*': ['./x/*'] },
                    },
                },
            },
        })

        await runMonoPrepare({ dirname: dir })

        const app = readApp('flow-app')
        expect(app.compilerOptions.paths).not.toHaveProperty('@mono-host/*')
        expect(app.compilerOptions.paths['@keep-me/*']).toEqual(['./x/*']) // non-mono keys survive
    })

    it('is idempotent — a second run rewrites nothing', async () => {
        scaffold({ 'flow-app': {} })

        await runMonoPrepare({ dirname: dir })
        const first = readApp('flow-app')
        const second = await runMonoPrepare({ dirname: dir })

        expect(second.wiredApps).toEqual([]) // nothing left to change
        expect(readApp('flow-app')).toEqual(first)
    })

    it('skips a clone that has no tsconfig.json, and never creates one', async () => {
        scaffold({ 'flow-app': {}, 'no-config-app': null })

        const result = await runMonoPrepare({ dirname: dir })

        expect(result.wiredApps).toEqual(['flow-app'])
        expect(fs.existsSync(path.join(dir, '.mono', 'apps', 'no-config-app', 'tsconfig.json'))).toBe(false)
    })

    it('leaves a malformed clone tsconfig untouched rather than masking it', async () => {
        scaffold({ 'flow-app': {} })
        const broken = path.join(dir, '.mono', 'apps', 'flow-app', 'tsconfig.json')
        fs.writeFileSync(broken, '{ this is not json')

        const result = await runMonoPrepare({ dirname: dir })

        expect(result.wiredApps).toEqual([])
        expect(fs.readFileSync(broken, 'utf8')).toBe('{ this is not json')
    })

    it('still wires the root tsconfig', async () => {
        scaffold({ 'flow-app': {} })

        const result = await runMonoPrepare({ dirname: dir })

        const root = JSON.parse(fs.readFileSync(path.join(dir, 'tsconfig.json'), 'utf8'))
        expect(root.extends).toEqual(['./.mono/tsconfig.json'])
        expect(result.addedExtends).toBe(true)
    })
})

describe('runMonoPrepare — path siblings (mono-lith)', () => {
    /** Host at <dir>/host, sibling at <dir>/sibling, declared by path. */
    function scaffoldLith(opts: { rootDir?: string; siblingExtends?: string[] } = {}): string {
        const host = path.join(dir, 'host')
        fs.mkdirSync(path.join(host, 'src'), { recursive: true })
        fs.writeFileSync(
            path.join(host, 'mono.config.ts'),
            `export default { name: 'mono-host', type: 'vue', apps: [{ name: 'sibling', type: 'vue', path: '../sibling' }] }\n`,
        )
        fs.writeFileSync(
            path.join(host, 'tsconfig.json'),
            JSON.stringify({ compilerOptions: opts.rootDir ? { rootDir: opts.rootDir } : {} }, null, 2),
        )
        const sibling = path.join(dir, 'sibling')
        fs.mkdirSync(path.join(sibling, 'src'), { recursive: true })
        fs.writeFileSync(
            path.join(sibling, 'tsconfig.json'),
            JSON.stringify({ extends: opts.siblingExtends ?? [], compilerOptions: {} }, null, 2),
        )
        return host
    }

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('maps the sibling and never writes into its tsconfig', async () => {
        const host = scaffoldLith()
        const before = fs.readFileSync(path.join(dir, 'sibling', 'tsconfig.json'), 'utf8')

        const result = await runMonoPrepare({ dirname: host })

        const mono = JSON.parse(fs.readFileSync(result.monoTsconfigPath, 'utf8'))
        expect(mono.compilerOptions.paths['@sibling/*']).toEqual(['../../sibling/src/*'])
        expect(result.wiredApps).toEqual([])
        expect(fs.readFileSync(path.join(dir, 'sibling', 'tsconfig.json'), 'utf8')).toBe(before)
        expect(result.outsideProject).toEqual(['@sibling/*', '@sibling-root/*'])
    })

    it('warns about rootDir only when it is set', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        await runMonoPrepare({ dirname: scaffoldLith() })
        expect(warn.mock.calls.some((c) => String(c[0]).includes('rootDir'))).toBe(false)

        fs.rmSync(dir, { recursive: true, force: true })
        fs.mkdirSync(dir, { recursive: true })
        await runMonoPrepare({ dirname: scaffoldLith({ rootDir: '.' }) })
        expect(warn.mock.calls.some((c) => String(c[0]).includes('rootDir'))).toBe(true)
    })

    it('flags a sibling whose tsconfig extends a .mono/tsconfig.json that does not exist', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const host = scaffoldLith({ siblingExtends: ['./.mono/tsconfig.json'] })

        const result = await runMonoPrepare({ dirname: host })

        expect(result.unpreparedApps).toEqual(['sibling'])
        expect(warn.mock.calls.some((c) => String(c[0]).includes('run `mono prepare` in that app'))).toBe(true)
    })
})
