import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getMonoConfig } from '../src/composables/config-node'
import { monoAlias, monoStubAliases } from '../src/composables/mono-alias'
import { resolveExtendsAppNames } from '../src/composables/create-config'

/**
 * The whole point, exercised through the REAL loader: c12 -> jiti -> our alias map.
 *
 * Scenario: this app federates `mono-host`; the cloned `mono-host` federates `ghost`,
 * which nobody cloned (a clone never carries its own `.mono/apps/`). Loading the chain
 * follows `@mono-host-root/mono.config` into the clone and then hits
 * `@ghost-root/mono.config` — a specifier no alias key covers.
 *
 * This also pins the mechanism the stub rests on: alias matching treats a key with no
 * trailing segment as a FULL match (pathe's `hasTrailingSlash` has a default
 * parameter, so the char past an exact key reads as a separator) and tries keys with
 * more slashes first. If a pathe/jiti bump ever drops that, this test fails here
 * rather than in someone's dev server.
 */

let dir: string

const write = (rel: string, body: string): void => {
    const file = path.join(dir, rel)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, body)
}

/** This app + a cloned host that federates an app which was never synced. */
function scaffoldNestedChain(): void {
    write(
        'mono.config.ts',
        `import host from '@mono-host-root/mono.config'
export default {
  name: 'root-app',
  type: 'vue',
  extends: [() => host],
  apps: [{ name: 'mono-host', type: 'vue' }],
  menu: [{ title: 'Root' }],
}
`,
    )
    write(
        path.join('.mono', 'apps', 'mono-host', 'mono.config.ts'),
        `import ghost from '@ghost-root/mono.config'
export default {
  name: 'mono-host',
  type: 'vue',
  extends: [() => ghost],
  apps: [{ name: 'ghost', type: 'vue', envToken: 'GHOST_TOKEN' }],
}
`,
    )
}

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mono-stub-'))
})

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
})

describe('getMonoConfig — unsynced app in the extends chain', () => {
    it('loads the chain when the missing config is stubbed', async () => {
        scaffoldNestedChain()

        const alias = monoAlias({ dirname: dir })
        const { alias: stubs, missing } = monoStubAliases({ dirname: dir })
        expect(missing.map((m) => m.name)).toEqual(['ghost'])

        const config = await getMonoConfig({
            cwd: dir,
            jitiOptions: { alias: { ...alias, ...stubs } },
        })

        // This app's own config is untouched by the stub.
        expect(config.name).toBe('root-app')
        expect(config.menu).toEqual([{ title: 'Root' }])
        expect(config.apps).toEqual([{ name: 'mono-host', type: 'vue' }])

        // The host layer still resolves; the stubbed layer contributes nothing and,
        // being nameless, never marks an app active.
        expect(resolveExtendsAppNames(config)).toEqual(['mono-host'])
    })

    it('without the stub, says which app to sync instead of `Cannot find module`', async () => {
        scaffoldNestedChain()

        const alias = monoAlias({ dirname: dir })

        await expect(
            getMonoConfig({ cwd: dir, jitiOptions: { alias } }),
        ).rejects.toThrow(/@ghost-root\/mono\.config/)

        const error = await getMonoConfig({ cwd: dir, jitiOptions: { alias } }).catch((e) => e)
        expect(error.message).toContain('mono sync')
        expect(error.message).toContain("isn't present in .mono/apps/")
        // The raw failure is kept for anyone who needs the stack.
        expect(error.cause).toBeInstanceOf(Error)
    })

    it('leaves an ordinary config error alone', async () => {
        write('mono.config.ts', `export default { name: 'root-app', apps: [] }\nthrow new Error('boom')\n`)

        await expect(getMonoConfig({ cwd: dir })).rejects.toThrow(/boom/)
    })
})
