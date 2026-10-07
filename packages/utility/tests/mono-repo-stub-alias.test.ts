import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { monoRepo } from '../src/vite/mono-repo'

/**
 * The stub has to reach BOTH resolvers, not just the config loader.
 *
 * `getMonoConfig` runs through jiti, but the browser graph resolves the very same
 * chain on its own — an app's `main.ts` does `import monoConfig from '../mono.config'`,
 * which Vite follows into the cloned host's config and on to
 * `@ghost-root/mono.config`. Stub only jiti and the dev server starts cleanly, then
 * dies on the first page load. So `monoRepo().plugin` must publish the same keys in
 * `resolve.alias`.
 */

let dir: string

const write = (rel: string, body: string): void => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, body)
}

/** This app + a cloned host federating an app nobody synced. */
function scaffoldNestedChain(): void {
    write(
        'mono.config.ts',
        `import host from '@mono-host-root/mono.config'
export default { name: 'root-app', type: 'vue', extends: [() => host], apps: [{ name: 'mono-host', type: 'vue', url: 'x' }] }
`,
    )
    write(
        path.join('.mono', 'apps', 'mono-host', 'mono.config.ts'),
        `import ghost from '@ghost-root/mono.config'
export default { name: 'mono-host', type: 'vue', extends: [() => ghost], apps: [{ name: 'ghost', type: 'vue' }] }
`,
    )
}

/** The `resolve.alias` object the plugin's `config()` hook publishes to Vite. */
async function resolveAlias(): Promise<Record<string, string>> {
    const mono = await monoRepo({ dirname: dir, warnMissing: false })
    const hook = mono.plugin.config as (c: unknown, e: unknown) => { resolve: { alias: any } }
    return hook.call(mono.plugin, {}, { command: 'serve', mode: 'development' }).resolve.alias
}

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-repo-stub-'))
})

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('monoRepo — stub aliases reach Vite', () => {
    it('publishes the config stub alongside the normal app aliases', async () => {
        scaffoldNestedChain()

        const alias = await resolveAlias()
        const stub = path.join(dir, '.mono', 'empty-mono-config.mjs')

        expect(alias['@ghost-root/mono.config']).toBe(stub)
        expect(alias['@ghost/mono.config.ts']).toBe(stub)

        // The real aliases are still there and still win for everything else.
        expect(alias['@mono-host-root']).toBe(path.join(dir, '.mono', 'apps', 'mono-host'))
        expect(alias['@root-app']).toBe(path.resolve(dir, 'src'))

        // Missing app code stays unresolvable — a blank page is worse than an error.
        expect(alias['@ghost']).toBeUndefined()
        expect(alias['@ghost-root']).toBeUndefined()
    })

    it('adds nothing when every federated app is synced', async () => {
        write('mono.config.ts', `export default { name: 'root-app', type: 'vue', apps: [] }\n`)

        const alias = await resolveAlias()

        expect(Object.keys(alias).filter((k) => k.includes('mono.config'))).toEqual([])
    })

    it('can be turned off, restoring the hard failure', async () => {
        scaffoldNestedChain()

        await expect(
            monoRepo({ dirname: dir, stubMissing: false }),
        ).rejects.toThrow(/@ghost-root\/mono\.config/)
    })
})
