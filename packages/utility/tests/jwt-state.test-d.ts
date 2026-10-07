import { describe, it, expectTypeOf } from 'vitest'

import { monoState } from '../src/composables/state'
import { defineConfig } from '../src/composables/create-config'

/**
 * Type-level guards for the open `jwt` block.
 *
 * Opening a type is easy to get subtly wrong: an index signature widens `keyof`, which
 * flows through the `DeepMerge` mapped type behind `monoState<Override>()` and can quietly
 * collapse the named keys into `any`. Nothing at runtime would notice — every one of these
 * would still PASS its runtime test while every consuming app lost its types.
 */

interface VendorClaims {
    vendor: string
    scope: 'read' | 'write'
}

describe('the jwt block accepts any key', () => {
    it('takes a custom entry alongside the named ones', () => {
        defineConfig({
            name: 'test-app',
            type: 'vue',
            apps: [],
            jwt: {
                token: { name: 'MONO_token', split: true },
                refreshToken: { name: 'MONO_tokenRefresh' },
                vendorToken: { name: 'VENDOR_jwt', split: true },
            },
        })
    })

    it('still takes the dev-mode pre-decoded claims object', () => {
        defineConfig({
            name: 'test-app',
            type: 'vue',
            apps: [],
            jwt: {
                token: { name: { USER_NAME: 'ade' } },
                vendorToken: { name: { vendor: 'acme' } },
            },
        })
    })
})

describe('monoState().jwt keeps its types', () => {
    it('has NOT collapsed token into `any` (the whole risk of an index signature)', () => {
        const { jwt } = monoState()

        expectTypeOf(jwt.token).not.toBeAny()
        expectTypeOf(jwt.token.USER_NAME).toEqualTypeOf<string | undefined>()
        expectTypeOf(jwt.refreshToken.exp).toEqualTypeOf<number | undefined>()
    })

    it('reads a custom key as an untyped claims bag by default', () => {
        const { jwt } = monoState()

        expectTypeOf(jwt.vendorToken).toEqualTypeOf<Record<string, any>>()
    })

    it('narrows a custom key through the Override generic', () => {
        const { jwt } = monoState<{ jwt: { vendorToken: VendorClaims } }>()

        expectTypeOf(jwt.vendorToken.vendor).toEqualTypeOf<string>()
        expectTypeOf(jwt.vendorToken.scope).toEqualTypeOf<'read' | 'write'>()

        // and the named keys survive the merge
        expectTypeOf(jwt.token).not.toBeAny()
        expectTypeOf(jwt.token.USER_NAME).toEqualTypeOf<string | undefined>()
    })
})
