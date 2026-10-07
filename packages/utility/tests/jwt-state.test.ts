import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The `jwt` config block, and the mono state it hydrates.
 *
 * `jwt` accepts any key — not just `token` / `refreshToken` — so an app can carry a third
 * JWT (a vendor token, an impersonation token, a second identity provider). These cover
 * the three places that used to hardcode the two known names: hydration, patching, and
 * reset. A key that hydrates but never resets is the dangerous one — that's a stale
 * identity surviving logout.
 */

/** What `document.cookie` holds, as far as these tests are concerned. */
let cookies: Record<string, string> = {}
/** What each cookie decodes to. */
let decoded: Record<string, Record<string, any>> = {}

vi.mock('../src/composables/universal', () => ({
    monoCookie: () => ({
        get: (name: string) => cookies[name],
    }),
    monoJwt: () => ({
        cookieDecode: ({ cookie }: { cookie: string; splitCookie?: boolean }) =>
            decoded[cookie] ?? null,
    }),
}))

const { initMono, monoState, monoStatePatch, monoStateReset } = await import(
    '../src/composables/state'
)

function config(jwt: Record<string, any>) {
    return {
        name: 'test-app',
        type: 'vue' as const,
        apps: [],
        jwt,
    }
}

beforeEach(() => {
    cookies = {}
    decoded = {}
    monoStateReset()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('hydrating the jwt block', () => {
    it('still hydrates token and refreshToken exactly as before', () => {
        cookies['MONO_token'] = 'jwt.a.b'
        cookies['MONO_tokenRefresh'] = 'jwt.c.d'
        decoded['MONO_token'] = { USER_NAME: 'ade', USER_ID: 7 }
        decoded['MONO_tokenRefresh'] = { exp: 123 }

        initMono(
            config({
                token: { name: 'MONO_token', split: true },
                refreshToken: { name: 'MONO_tokenRefresh' },
            }) as any,
        )

        const { jwt } = monoState()

        expect(jwt.token).toEqual({ USER_NAME: 'ade', USER_ID: 7 })
        expect(jwt.refreshToken).toEqual({ exp: 123 })
    })

    it('hydrates a custom key from its cookie', () => {
        decoded['VENDOR_jwt'] = { vendor: 'acme', scope: 'read' }

        initMono(
            config({
                token: { name: 'MONO_token' },
                vendorToken: { name: 'VENDOR_jwt', split: true },
            }) as any,
        )

        expect(monoState().jwt.vendorToken).toEqual({ vendor: 'acme', scope: 'read' })
    })

    it('accepts a pre-decoded claims object on a custom key (the dev-mode form)', () => {
        // `name: PROD ? 'VENDOR_jwt' : { ...alreadyDecoded }`
        initMono(
            config({
                vendorToken: { name: { vendor: 'acme' } },
            }) as any,
        )

        expect(monoState().jwt.vendorToken).toEqual({ vendor: 'acme' })
    })

    it('leaves an unconfigured custom key absent rather than empty', () => {
        initMono(config({ token: { name: 'MONO_token' } }) as any)

        expect(monoState().jwt.vendorToken).toBeUndefined()
    })

    it('does not re-decode a key that is already hydrated', () => {
        decoded['VENDOR_jwt'] = { vendor: 'from-cookie' }

        monoStatePatch({ jwt: { vendorToken: { vendor: 'already-here' } } } as any)

        initMono(config({ vendorToken: { name: 'VENDOR_jwt' } }) as any)

        expect(monoState().jwt.vendorToken).toEqual({ vendor: 'already-here' })
    })
})

describe('patching', () => {
    it('lands a custom key', () => {
        monoStatePatch({ jwt: { vendorToken: { vendor: 'acme' } } } as any)

        expect(monoState().jwt.vendorToken).toEqual({ vendor: 'acme' })
    })

    it('merges into a custom key rather than replacing it', () => {
        monoStatePatch({ jwt: { vendorToken: { vendor: 'acme' } } } as any)
        monoStatePatch({ jwt: { vendorToken: { scope: 'read' } } } as any)

        expect(monoState().jwt.vendorToken).toEqual({ vendor: 'acme', scope: 'read' })
    })

    it('leaves the other keys alone', () => {
        monoStatePatch({ jwt: { token: { USER_NAME: 'ade' } } } as any)
        monoStatePatch({ jwt: { vendorToken: { vendor: 'acme' } } } as any)

        expect(monoState().jwt.token).toEqual({ USER_NAME: 'ade' })
        expect(monoState().jwt.vendorToken).toEqual({ vendor: 'acme' })
    })
})

describe('reset', () => {
    // The logout leak: a reset that only knows about `token` / `refreshToken` leaves any
    // custom identity behind, so the next user inherits it.
    it('clears a custom key, not just the two known ones', () => {
        monoStatePatch({
            jwt: {
                token: { USER_NAME: 'ade' },
                vendorToken: { vendor: 'acme' },
            },
        } as any)

        monoStateReset()

        expect(monoState().jwt.token).toEqual({})
        expect(monoState().jwt.refreshToken).toEqual({})
        expect(monoState().jwt.vendorToken).toBeUndefined()
    })

    it('clears cookies too', () => {
        monoStatePatch({ cookie: { MONO_token: 'abc' } })

        monoStateReset()

        expect(monoState().cookie).toEqual({})
    })
})

describe('a mis-cased key', () => {
    // An index signature turns OFF excess-property checking, so `refreshtoken` compiles.
    // It would then hydrate as its own entry and leave `jwt.refreshToken` empty — with no
    // error anywhere. The warning is the only thing standing between that and a silent
    // logged-out app.
    it('warns that it looks like a mis-cased known key', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        decoded['MONO_tokenRefresh'] = { exp: 123 }

        initMono(
            config({
                refreshtoken: { name: 'MONO_tokenRefresh' },
            }) as any,
        )

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('refreshtoken'))
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('refreshToken'))
    })

    it('stays quiet for a legitimately different key', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

        decoded['VENDOR_jwt'] = { vendor: 'acme' }

        initMono(config({ vendorToken: { name: 'VENDOR_jwt' } }) as any)

        expect(warn).not.toHaveBeenCalled()
    })
})
