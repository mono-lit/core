import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
    monoAlias,
    monoMissingApps,
    monoStubAliases,
    formatMissingApps,
} from '../src/composables/mono-alias'

/**
 * Finding the apps a federated chain references but that aren't on disk.
 *
 * A cloned app can't carry its own `.mono/apps/` (gitignored, so it's absent from the
 * archive `mono sync` downloads). A host that federates apps of its own therefore
 * arrives importing `@some-app-root/mono.config` with nothing to resolve it against —
 * and since `monoAlias` keys off the DIRECTORY LISTING, there is no alias, jiti falls
 * through to bare-package resolution, and the config never loads. Everything here runs
 * before any config can be executed, so discovery has to be static text parsing.
 */

let dir: string

const write = (rel: string, body: string): void => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, body)
}

/** Root config + a cloned app, both as plain object literals (never executed). */
function scaffold(rootApps: string, clone?: { name: string; body: string }): void {
    write(
        'mono.config.ts',
        `export default { name: 'root-app', type: 'vue', apps: [${rootApps}] }\n`,
    )
    if (clone) write(path.join('.mono', 'apps', clone.name, 'mono.config.ts'), clone.body)
}

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-missing-'))
})

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('monoMissingApps', () => {
    it('reports an app a CLONE federates, with the token needed to sync it', () => {
        scaffold(`{ name: 'mono-host', type: 'vue' }`, {
            name: 'mono-host',
            body: `import ghost from '@ghost-root/mono.config'
export default { name: 'mono-host', type: 'vue', extends: [() => ghost], apps: [{ name: 'ghost', type: 'vue', envToken: 'GHOST_TOKEN' }] }
`,
        })

        expect(monoMissingApps({ dirname: dir })).toEqual([
            { name: 'ghost', via: 'mono-host', envToken: 'GHOST_TOKEN' },
        ])
    })

    it('catches an import of an app that was never declared in apps[]', () => {
        scaffold(`{ name: 'mono-host', type: 'vue' }`, {
            name: 'mono-host',
            body: `import stray from '@stray-root/mono.config'
export default { name: 'mono-host', type: 'vue', apps: [] }
`,
        })

        expect(monoMissingApps({ dirname: dir })).toEqual([{ name: 'stray', via: 'mono-host' }])
    })

    it('never mistakes a scoped npm package for a mono app', () => {
        // `@vueuse/core` is syntactically identical to `@some-app/file`. Stubbing a real
        // dependency out of the build is far worse than the crash we're preventing, so
        // only the `-root` convention counts.
        scaffold(`{ name: 'mono-host', type: 'vue' }`, {
            name: 'mono-host',
            body: `import { useNow } from '@vueuse/core'
import { defineConfig } from '@nuxt/kit'
import svc from '@mono-host/odata/DTO/DefaultService'
export default { name: 'mono-host', type: 'vue', apps: [] }
`,
        })

        expect(monoMissingApps({ dirname: dir })).toEqual([])
    })

    it('skips apps already on disk, and this app itself', () => {
        // A host that federates us BACK (mutual federation) names us in its apps[] —
        // that is not a missing app, it's this very repo.
        scaffold(`{ name: 'mono-host', type: 'vue' }`, {
            name: 'mono-host',
            body: `export default { name: 'mono-host', type: 'vue', apps: [{ name: 'root-app' }, { name: 'mono-host' }] }
`,
        })

        expect(monoMissingApps({ dirname: dir })).toEqual([])
    })
})

describe('monoStubAliases', () => {
    it('stubs the config specifier only — never the app prefix', () => {
        scaffold(`{ name: 'ghost', type: 'vue', envToken: 'GHOST_TOKEN' }`)

        const { alias, missing, stubFile } = monoStubAliases({ dirname: dir })

        expect(missing.map((m) => m.name)).toEqual(['ghost'])
        expect(stubFile).toBe(path.join(dir, '.mono', 'empty-mono-config.mjs'))
        expect(fs.existsSync(stubFile!)).toBe(true)

        // Every spelling of the config import resolves to the stub…
        expect(alias['@ghost-root/mono.config']).toBe(stubFile)
        expect(alias['@ghost-root/mono.config.ts']).toBe(stubFile)
        expect(alias['@ghost/mono.config']).toBe(stubFile)

        // …but app code importing a missing app must still fail loudly. A page that
        // can't exist beats a page that silently renders blank.
        expect(alias['@ghost']).toBeUndefined()
        expect(alias['@ghost-root']).toBeUndefined()
    })

    it('exports a layer that merges to nothing', async () => {
        scaffold(`{ name: 'ghost', type: 'vue' }`)
        const { stubFile } = monoStubAliases({ dirname: dir })

        const stub = (await import(pathToFileURL(stubFile!).href)).default
        expect(stub).toEqual({ apps: [], extends: [] })
        // No `name`: a named layer could clobber the root's own fields on merge, and
        // could make `resolveExtendsAppNames` mark something active.
        expect(stub.name).toBeUndefined()
    })

    it('is a no-op when everything is synced', () => {
        scaffold(`{ name: 'mono-host', type: 'vue' }`, {
            name: 'mono-host',
            body: `export default { name: 'mono-host', type: 'vue', apps: [] }\n`,
        })

        const { alias, missing, stubFile } = monoStubAliases({ dirname: dir })

        expect(missing).toEqual([])
        expect(alias).toEqual({})
        expect(stubFile).toBeNull()
        expect(fs.existsSync(path.join(dir, '.mono', 'empty-mono-config.mjs'))).toBe(false)
    })

    it('survives repeated calls (every dev-server restart runs it)', () => {
        scaffold(`{ name: 'ghost', type: 'vue' }`)

        const first = monoStubAliases({ dirname: dir })
        const second = monoStubAliases({ dirname: dir })

        expect(second.alias).toEqual(first.alias)
        expect(fs.readFileSync(second.stubFile!, 'utf8')).toContain('apps: []')
    })
})

describe('monoAlias — own-name guard', () => {
    it("won't let a clone of ourselves hijack @<own>", () => {
        // Mutual federation can put a stale copy of THIS app under .mono/apps/. The
        // readdir loop assigns unconditionally, so without the guard `@root-app` would
        // silently point at the copy instead of our own source.
        scaffold(`{ name: 'root-app', type: 'vue' }`)
        fs.mkdirSync(path.join(dir, '.mono', 'apps', 'root-app', 'src'), { recursive: true })

        const alias = monoAlias({ dirname: dir })

        expect(alias['@root-app']).toBe(path.resolve(dir, 'src'))
        expect(alias['@root-app-root']).toBe(path.resolve(dir))
    })
})

describe('formatMissingApps', () => {
    it('names the app, who wants it, and the token to set', () => {
        const message = formatMissingApps([
            { name: 'ghost', via: 'mono-host', envToken: 'GHOST_TOKEN' },
        ])

        expect(message).toContain('ghost')
        expect(message).toContain('required by mono-host')
        expect(message).toContain('GHOST_TOKEN')
        expect(message).toContain('mono sync')
    })
})
