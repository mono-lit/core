import { describe, it, expect } from 'vitest'
import {
    resolveMonoConfig,
    resolveEnv,
    type MonoConfig,
} from '../src/composables/create-config'

/**
 * `resolveMonoConfig` — the precedence rule for a federated `extends` chain.
 *
 * The contract: the ROOT config (the repo you are working in, the one c12 loads
 * from `cwd`) outranks every layer it extends, for every key, and for `env` in
 * every block. Layers only fill in what the root did not declare.
 *
 * The bug these pin: layers merged block-by-block, so a host's
 * `env.development.MONO_URL` survived into the merged config and `resolveEnv`'s
 * mode-beats-default spread then handed it a win over the local
 * `env.default.MONO_URL`. Block specificity was silently outranking layer
 * specificity — a remote could not override a host key without also mirroring
 * the host's block layout.
 */

const HOST = 'https://host.api'
const MINE = 'https://mine.api'

/** A config, minus the required fields every test would otherwise repeat. */
const cfg = (name: string, rest: Partial<MonoConfig>): MonoConfig =>
    ({ name, type: 'vue', apps: [], ...rest }) as MonoConfig

/**
 * The real federated shape: a remote extends the cloned host, and the host —
 * being the other half of a mutually-federating pair — extends the remote back.
 * Building it this way keeps the `extends` cycle guard in the test path.
 */
function mutual(local: MonoConfig, host: MonoConfig): MonoConfig {
    local.extends = [() => host]
    host.extends = [() => local]
    return local
}

const envOf = (local: MonoConfig, host: MonoConfig, mode: string) =>
    resolveEnv(resolveMonoConfig(mutual(local, host)), mode)

describe('resolveMonoConfig — env layer precedence', () => {
    it('local `default` beats a host `<mode>` block (the reported bug)', () => {
        const value = envOf(
            cfg('mono-vue', { env: { default: { MONO_URL: MINE } } }),
            cfg('mono-host', { env: { development: { MONO_URL: HOST } } }),
            'development',
        )

        expect(value.MONO_URL).toBe(MINE)
    })

    it('local `default` beats a host `<mode>` block in EVERY mode', () => {
        for (const mode of ['development', 'production', 'staging']) {
            const value = envOf(
                cfg('mono-vue', { env: { default: { MONO_URL: MINE } } }),
                cfg('mono-host', {
                    env: {
                        development: { MONO_URL: HOST },
                        production: { MONO_URL: HOST },
                    },
                }),
                mode,
            )

            expect(value.MONO_URL, `mode ${mode}`).toBe(MINE)
        }
    })

    it('local `default` beats a host `default`', () => {
        const value = envOf(
            cfg('mono-vue', { env: { default: { MONO_URL: MINE } } }),
            cfg('mono-host', { env: { default: { MONO_URL: HOST } } }),
            'development',
        )

        expect(value.MONO_URL).toBe(MINE)
    })

    it('local `<mode>` beats a host `default`', () => {
        const value = envOf(
            cfg('mono-vue', { env: { development: { MONO_URL: MINE } } }),
            cfg('mono-host', { env: { default: { MONO_URL: HOST } } }),
            'development',
        )

        expect(value.MONO_URL).toBe(MINE)
    })

    it('local `<mode>` beats the local `default` — block precedence still holds WITHIN a layer', () => {
        const local = cfg('mono-vue', {
            env: {
                default: { MONO_URL: MINE },
                production: { MONO_URL: 'https://mine.prod.api' },
            },
        })
        const host = cfg('mono-host', { env: { development: { MONO_URL: HOST } } })

        const resolved = resolveMonoConfig(mutual(local, host))

        // the local default erases the host's development value...
        expect(resolveEnv(resolved, 'development').MONO_URL).toBe(MINE)
        // ...but the local's own production block still wins over its own default
        expect(resolveEnv(resolved, 'production').MONO_URL).toBe(
            'https://mine.prod.api',
        )
    })

    it('inherits host keys the local config never declares, per mode', () => {
        const value = envOf(
            cfg('mono-vue', { env: { default: { MONO_URL: MINE } } }),
            cfg('mono-host', {
                env: {
                    default: { SHARED: 'base' },
                    development: { MONO_URL: HOST, OTHER: 'host-dev' },
                },
            }),
            'development',
        )

        expect(value).toEqual({
            SHARED: 'base',
            MONO_URL: MINE,
            OTHER: 'host-dev',
        })
    })

    it('leaves the host env untouched when the local declares no env at all', () => {
        const value = envOf(
            cfg('mono-vue', {}),
            cfg('mono-host', {
                env: {
                    default: { MONO_URL: 'https://host.default' },
                    development: { MONO_URL: HOST },
                },
            }),
            'development',
        )

        expect(value.MONO_URL).toBe(HOST)
    })

    it('wins from the root even when the host holds a non-identical COPY of the local config', () => {
        // Two module instances of the same `mono.config.ts` (the local graph's
        // `../mono.config` vs the host's `@<app>-root/mono.config`) defeat the
        // identity-based cycle guard. Root precedence must not depend on it.
        const local = cfg('mono-vue', { env: { default: { MONO_URL: MINE } } })
        const twin = cfg('mono-vue', { env: { default: { MONO_URL: MINE } } })
        const host = cfg('mono-host', { env: { development: { MONO_URL: HOST } } })

        local.extends = [() => host]
        host.extends = [() => twin]

        expect(
            resolveEnv(resolveMonoConfig(local), 'development').MONO_URL,
        ).toBe(MINE)
    })

    it('the root wins over a three-level chain (local -> host -> host\'s remote)', () => {
        const grandparent = cfg('mono-legacy', {
            env: { development: { MONO_URL: 'https://legacy.api', DEEP: 'kept' } },
        })
        const host = cfg('mono-host', {
            extends: [() => grandparent],
            env: { development: { MONO_URL: HOST } },
        })
        const local = cfg('mono-vue', {
            extends: [() => host],
            env: { default: { MONO_URL: MINE } },
        })

        const value = resolveEnv(resolveMonoConfig(local), 'development')

        expect(value.MONO_URL).toBe(MINE)
        expect(value.DEEP).toBe('kept')
    })
})

describe('resolveMonoConfig — name-keyed arrays', () => {
    it('local entries override same-key host entries, lead the list, and keep host-only ones', () => {
        const local = cfg('mono-vue', {
            menu: [{ title: 'A', url: '/my-a' } as any],
        })
        const host = cfg('mono-host', {
            menu: [{ title: 'A', url: '/host-a' } as any, { title: 'B' } as any],
        })

        expect(resolveMonoConfig(mutual(local, host)).menu).toEqual([
            { title: 'A', url: '/my-a' },
            { title: 'B' },
        ])
    })

    it('dedupes `apps` by name and `cookie` by name with the same rule', () => {
        const local = cfg('mono-vue', {
            apps: [{ name: 'shared', type: 'nuxt' } as any],
            cookie: [{ name: 'sid', split: true }],
        })
        const host = cfg('mono-host', {
            apps: [
                { name: 'shared', type: 'vue' } as any,
                { name: 'host-only', type: 'vue' } as any,
            ],
            cookie: [{ name: 'sid', split: false }, { name: 'host-only' }],
        })

        const resolved = resolveMonoConfig(mutual(local, host))

        expect(resolved.apps).toEqual([
            { name: 'shared', type: 'nuxt' },
            { name: 'host-only', type: 'vue' },
        ])
        expect(resolved.cookie).toEqual([
            { name: 'sid', split: true },
            { name: 'host-only' },
        ])
    })
})

describe('resolveMonoConfig — non-env keys', () => {
    it('deep-merges plain objects with the local leaf winning', () => {
        const local = cfg('mono-vue', {
            fetching: { api: { main: { url: MINE } } } as any,
        })
        const host = cfg('mono-host', {
            fetching: { api: { main: { url: HOST, type: 'odata' }, extra: {} } } as any,
        })

        expect((resolveMonoConfig(mutual(local, host)).fetching as any).api).toEqual({
            main: { url: MINE, type: 'odata' },
            extra: {},
        })
    })

    it('strips `extends` from the resolved config', () => {
        const resolved = resolveMonoConfig(
            mutual(cfg('mono-vue', {}), cfg('mono-host', {})),
        )

        expect(resolved.extends).toBeUndefined()
        expect(resolved.name).toBe('mono-vue')
    })
})
