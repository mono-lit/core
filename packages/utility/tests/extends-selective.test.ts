import { describe, it, expect } from 'vitest'
import {
    resolveMonoConfig,
    resolveEnv,
    resolveExtendsAppNames,
    resolveExtendsEcosystems,
    type MonoConfig,
} from '../src/composables/create-config'

/**
 * Selective `extends` — `{ config, merges, ecosystems }`.
 *
 * The contract on top of the whole-layer rules pinned by
 * `resolve-config-layers.test.ts`:
 *
 * - Omitting `merges` / `ecosystems` means NO restriction, so the options form
 *   with neither is indistinguishable from a bare thunk. That backward-compat
 *   guarantee is the first test here and the one most worth keeping green.
 * - An explicit `[]` means "nothing", which is how a layer becomes config-only
 *   or directories-only.
 * - Narrowing happens AFTER the layer resolves its own `extends`, so `merges`
 *   selects from the finished layer, not from its bare top level.
 */

const HOST = 'https://host.api'
const MINE = 'https://mine.api'

const cfg = (name: string, rest: Partial<MonoConfig>): MonoConfig =>
    ({ name, type: 'vue', apps: [], ...rest }) as MonoConfig

/** A layer carrying one of every merge-rule shape, so a gate is easy to see. */
const richLayer = () =>
    cfg('mono-host', {
        menu: [{ title: 'Host' } as any],
        cookie: [{ name: 'sid', split: true }],
        env: { default: { MONO_URL: HOST, SHARED: 'base' } },
        fetching: { api: { main: { url: HOST } } } as any,
    })

describe('selective extends — merges', () => {
    it('is identical to a bare thunk when neither list is given', () => {
        const viaThunk = resolveMonoConfig(
            cfg('mono-vue', { extends: [() => richLayer()] }),
        )
        const viaOptions = resolveMonoConfig(
            cfg('mono-vue', { extends: [{ config: () => richLayer() }] }),
        )

        expect(viaOptions).toEqual(viaThunk)
    })

    it('takes only the listed keys and drops the rest of the layer', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                extends: [{ config: () => richLayer(), merges: ['menu'] }],
            }),
        )

        expect(resolved.menu).toEqual([{ title: 'Host' }])
        // everything else the layer declared stays behind
        expect(resolved.cookie).toBeUndefined()
        expect(resolved.fetching).toBeUndefined()
        expect(resolveEnv(resolved, 'development')).toEqual({})
    })

    it('contributes nothing at all with an explicit empty list', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                extends: [{ config: () => richLayer(), merges: [] }],
            }),
        )

        expect(resolved.menu).toBeUndefined()
        expect(resolved.cookie).toBeUndefined()
        expect(resolved.fetching).toBeUndefined()
        expect(resolveEnv(resolved, 'development')).toEqual({})
        // ...but the config itself is untouched
        expect(resolved.name).toBe('mono-vue')
    })

    it('keeps the root winning over an allowlisted key', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                menu: [{ title: 'Host', url: '/mine' } as any],
                extends: [{ config: () => richLayer(), merges: ['menu'] }],
            }),
        )

        expect(resolved.menu).toEqual([{ title: 'Host', url: '/mine' }])
    })

    it('still applies the env layer-beats-block rule to an allowlisted `env`', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                env: { default: { MONO_URL: MINE } },
                extends: [
                    {
                        config: () =>
                            cfg('mono-host', {
                                env: { development: { MONO_URL: HOST, OTHER: 'host-dev' } },
                            }),
                        merges: ['env'],
                    },
                ],
            }),
        )

        const value = resolveEnv(resolved, 'development')
        expect(value.MONO_URL).toBe(MINE)
        expect(value.OTHER).toBe('host-dev')
    })

    it('narrows the layer AFTER its own extends chain has folded in', () => {
        // grandparent -> host -> local. `merges: ['menu']` must see the menu the
        // host inherited from the grandparent, not just the host's own line.
        const grandparent = cfg('mono-legacy', {
            menu: [{ title: 'Legacy' } as any],
            cookie: [{ name: 'legacy' }],
        })
        const host = cfg('mono-host', {
            extends: [() => grandparent],
            menu: [{ title: 'Host' } as any],
        })

        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                extends: [{ config: () => host, merges: ['menu'] }],
            }),
        )

        expect(resolved.menu).toEqual([{ title: 'Host' }, { title: 'Legacy' }])
        // the grandparent's cookie was NOT on the allowlist
        expect(resolved.cookie).toBeUndefined()
    })

    it('applies per entry, leaving sibling layers whole', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                extends: [
                    { config: () => richLayer(), merges: ['menu'] },
                    () => cfg('gallery-apps', { cookie: [{ name: 'gallery' }] }),
                ],
            }),
        )

        expect(resolved.menu).toEqual([{ title: 'Host' }])
        expect(resolved.cookie).toEqual([{ name: 'gallery' }])
    })

    it('accepts a plain object as `config`, not just a thunk', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                extends: [{ config: richLayer(), merges: ['menu'] }],
            }),
        )

        expect(resolved.menu).toEqual([{ title: 'Host' }])
    })

    it('survives a mutual extends cycle declared with the options form', () => {
        const local = cfg('mono-vue', { menu: [{ title: 'Mine' } as any] })
        const host = cfg('mono-host', { menu: [{ title: 'Host' } as any] })
        local.extends = [{ config: () => host, merges: ['menu'] }]
        host.extends = [{ config: () => local, merges: ['menu'] }]

        const resolved = resolveMonoConfig(local)

        expect(resolved.menu).toEqual([{ title: 'Mine' }, { title: 'Host' }])
    })

    it('treats a thunk that throws as a layer contributing nothing', () => {
        const resolved = resolveMonoConfig(
            cfg('mono-vue', {
                extends: [
                    {
                        config: () => {
                            throw new Error('circular import not ready')
                        },
                        merges: ['menu'],
                    },
                ],
            }),
        )

        expect(resolved.name).toBe('mono-vue')
    })
})

describe('selective extends — app activation is unaffected', () => {
    it('reads the same names from both entry forms', () => {
        const names = resolveExtendsAppNames(
            cfg('mono-vue', {
                extends: [
                    () => cfg('flow-app', {}),
                    { config: () => cfg('gallery-apps', {}), ecosystems: ['pages'] },
                    { config: cfg('my-memo', {}), merges: [] },
                ],
            }),
        )

        // `merges: []` still activates the app — it gates config, not activation.
        expect(names).toEqual(['flow-app', 'gallery-apps', 'my-memo'])
    })
})

describe('resolveExtendsEcosystems', () => {
    it('maps only the layers that declared a list', () => {
        const policy = resolveExtendsEcosystems(
            cfg('mono-vue', {
                extends: [
                    () => cfg('flow-app', {}),
                    {
                        config: () => cfg('gallery-apps', {}),
                        ecosystems: ['pages', 'composables'],
                    },
                    { config: () => cfg('my-memo', {}), ecosystems: [] },
                ],
            }),
        )

        // flow-app is absent => unrestricted; my-memo is [] => nothing.
        expect(policy).toEqual({
            'gallery-apps': ['pages', 'composables'],
            'my-memo': [],
        })
    })

    it('is empty when there is no extends at all', () => {
        expect(resolveExtendsEcosystems(cfg('mono-vue', {}))).toEqual({})
    })
})
