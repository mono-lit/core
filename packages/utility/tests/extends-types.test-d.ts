import { describe, it } from 'vitest'

import {
    defineConfig,
    type MonoConfig,
    type MonoConfigExtendsEntry,
} from '../src/composables/create-config'

/**
 * Type-level guards for the `extends` entry union.
 *
 * The selective form `{ config, merges, ecosystems }` shares its shape with a plain
 * layer object: `Partial<MonoConfig>` makes every key optional, so ANY object is
 * assignable to it. That used to swallow the selective form's own mistakes — a
 * misspelled `merges` key stopped matching `MonoConfigExtendsOptions` and quietly
 * matched the layer member instead, so the entry either type-checked and did nothing
 * at runtime, or failed with an error elaborated against an unrelated union member
 * (`'() => MonoConfig' is not assignable to type 'string'`).
 *
 * These are compile-time only; nothing here can fail at runtime, and that is the
 * point — a regression in the union would still pass every runtime test.
 */

declare const hostConfig: MonoConfig
declare const galleryConfig: MonoConfig

describe('a selective `extends` entry', () => {
    it('accepts the full form alongside bare thunks', () => {
        defineConfig({
            name: 'mono-vue',
            type: 'vue',
            apps: [],
            extends: [
                (): MonoConfig => hostConfig,
                {
                    config: (): MonoConfig => galleryConfig,
                    merges: ['menu', 'mockIndexedDB'],
                    ecosystems: ['pages', 'composables'],
                },
            ],
        })
    })

    it('accepts `as const` lists', () => {
        const entry: MonoConfigExtendsEntry = {
            config: (): MonoConfig => galleryConfig,
            merges: ['menu'] as const,
            ecosystems: ['pages'] as const,
        }
        void entry
    })

    it('accepts an inline config object rather than a thunk', () => {
        const entry: MonoConfigExtendsEntry = { config: galleryConfig }
        void entry
    })

    it('rejects a `merges` key that is not a config key', () => {
        const entry: MonoConfigExtendsEntry = {
            config: (): MonoConfig => galleryConfig,
            // @ts-expect-error casing: the config key is `mockIndexedDB`
            merges: ['mockIndexedDb'],
        }
        void entry
    })

    it('rejects `ecosystem` for `ecosystems`', () => {
        // @ts-expect-error the key is plural — singular is a silent no-op at runtime
        const entry: MonoConfigExtendsEntry = {
            config: (): MonoConfig => galleryConfig,
            ecosystem: ['pages'],
        }
        void entry
    })

    it('rejects a `config` that is neither a thunk nor an object', () => {
        // A path string here is not a path source: `isExtendsOptions` rejects it,
        // so the entry would resolve to nothing at all.
        // @ts-expect-error write `extends: ['./some/path']` for a path source
        const entry: MonoConfigExtendsEntry = { config: './some/path' }
        void entry
    })

    it('rejects the selective keys on a plain layer object', () => {
        // @ts-expect-error `merges` means nothing without a `config` to narrow
        const entry: MonoConfigExtendsEntry = { menu: [], merges: ['menu'] }
        void entry
    })
})

describe('a plain layer entry', () => {
    it('takes a partial config object', () => {
        defineConfig({
            name: 'mono-vue',
            type: 'vue',
            apps: [],
            extends: [{ menu: [], apps: [] }],
        })
    })

    it('takes a whole config, a thunk, or one bare entry', () => {
        defineConfig({
            name: 'mono-vue',
            type: 'vue',
            apps: [],
            extends: hostConfig,
        })
        defineConfig({
            name: 'mono-vue',
            type: 'vue',
            apps: [],
            extends: [hostConfig, (): MonoConfig => galleryConfig],
        })
    })

    it('takes path sources, and pairs them only inside the list', () => {
        defineConfig({
            name: 'mono-vue',
            type: 'vue',
            apps: [],
            // A top-level array is always a LIST of entries, so these are two
            // sources — `[path, options]` only pairs one level down.
            extends: ['github:org/repo', ['./local', { install: true }]],
        })
    })
})

describe('`merges` cannot name an identity key', () => {
    it('rejects `skill` (and `template`) — they are read from THIS file only', () => {
        defineConfig({
            name: 'mono-vue',
            type: 'vue',
            apps: [],
            extends: [
                {
                    config: (): MonoConfig => hostConfig,
                    // @ts-expect-error `skill` is not a MonoMergeableKey
                    merges: ['skill'],
                },
                {
                    config: (): MonoConfig => hostConfig,
                    // @ts-expect-error `template` is not a MonoMergeableKey
                    merges: ['template'],
                },
            ],
        })
    })
})
