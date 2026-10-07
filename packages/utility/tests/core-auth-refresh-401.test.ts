// @vitest-environment jsdom

// `unauthCall` means ONE thing: a refresh was attempted and could not save the session.
//
// It used to mean two other things as well, and both of them logged signed-in users out:
//
//   * the DataSource error handlers returned on `unauthCall` BEFORE trying to refresh
//     (`if (unauthCall) { unauthCall(); return }`), so registering a handler switched
//     refresh-on-401 OFF for every DevExtreme store in the app — the opposite of what the
//     option is documented to do;
//   * `ensureFreshToken` called it speculatively, when no cookie was readable yet. Nothing
//     had been refused at that point: on a cold boot that is simply an app whose own cookie
//     renewal has not mounted, and the first request of the session bounced the user to the
//     login gate.
//
// The four tests below pin the corrected contract.

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { useFetchOData } from '../src/core/composables/use-fetch-helper'

/* ------------------------------- test harness ------------------------------ */

class FakeStore {
    constructor(public cfg: any) { }
    load() { return Promise.resolve([]) }
    byKey() { return Promise.resolve(null) }
}

class FakeDataSource {
    constructor(public cfg: any) { }
    store() { return this.cfg.store }
    load() { return this.cfg.store.load({}) }
    reload() { return this.load() }
}

const source = {
    DataSource: FakeDataSource,
    ODataStore: FakeStore,
    CustomStore: FakeStore,
} as any

const CONFIG = { jwtName: 'TEST_token', jwtRefreshName: 'TEST_tokenRefresh' }

/** A refresh endpoint has to be configured, or the refresh machinery stays dormant by design. */
const TOKEN_OPTIONS = {
    name: CONFIG.jwtRefreshName,
    splitCookie: false,
    path: { milis: 'Expired', value: 'RefreshToken' },
    fetchParams: {
        url: '/Auth/RefreshToken',
        options: { method: 'POST', baseUrl: 'https://api.test' },
    },
}

const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** A decodable JWT — `isUsableToken` accepts nothing else. */
const jwtOf = (payload: Record<string, unknown>) =>
    `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.x`

const FUTURE = () => Math.floor(Date.now() / 1000) + 3600

function setCookie(name: string, value: string) {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/`
}

function clearCookies() {
    for (const entry of document.cookie.split(';')) {
        const name = entry.split('=')[0]?.trim()
        if (name) document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
}

/** The DevExtreme wrapper shape `parseDxError` reads a status out of. */
const dxError = (status: number) => ({ error: { httpStatus: status } })

/** A 401 as DevExtreme raises it: the ajax options `beforeSend` filled in ride along. */
const dx401 = (sent: string) => ({
    error: { httpStatus: 401, requestOptions: { headers: { Authorization: `Bearer ${sent}` } } },
})

/** What a store puts on the wire right now. */
const sentBearer = (ds: any) => {
    const req: any = { headers: {}, params: {} }
    ds.cfg.store.cfg.beforeSend(req)
    return req.headers.Authorization
}

const isRefreshUrl = (input: any) => String(input?.url ?? input).includes('/Auth/RefreshToken')

/** `/Auth/RefreshToken` answers with `next`; everything else with an empty object. */
function refreshResponds(next: string | { status: number }) {
    vi.stubGlobal('fetch', vi.fn(async (input: any) => {
        if (!isRefreshUrl(input)) return new Response('{}', { status: 200 })
        if (typeof next !== 'string') return new Response('{}', { status: next.status })
        return new Response(JSON.stringify({ Expired: 3600_000, RefreshToken: next }), { status: 200 })
    }))
}

const refreshCalls = () =>
    (fetch as any).mock.calls.filter(([input]: any[]) => isRefreshUrl(input)).length

/**
 * Sign the session in with `api` as the api token.
 *
 * The token helper's `fetchToken` (src/token) skips the network while the cookie's `exp` is still ahead, so a
 * refresh only really happens for an EXPIRED cookie. Stores are built before the clock
 * moves (a fresh token at build time keeps `ensureFreshToken` quiet); the test then
 * runs the token out with `expire()`.
 */
function signIn(api: string) {
    setCookie(CONFIG.jwtName, jwtOf({ exp: FUTURE(), USER_NAME: 'tester' }))
    setCookie(CONFIG.jwtRefreshName, api)
}

const expire = () => vi.setSystemTime(Date.now() + 2 * 3600_000)

const build = async (over: Record<string, any> = {}) => {
    const { dataSource } = await useFetchOData<any>({
        url: '/Anything',
        baseUrl: 'https://api.test/odata',
        type: 'datasource',
        source,
        options: {},
        config: CONFIG,
        tokenOptions: TOKEN_OPTIONS,
        ...over,
    } as any)

    return dataSource as any
}

/** Let the handler's refresh promise settle. */
const settle = () => new Promise((r) => setTimeout(r, 10))

beforeEach(() => {
    clearCookies()
    // Only the clock — `settle()` needs real timers.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    clearCookies()
})

describe('401 handling', () => {
    it('never redirects before a request has been refused', async () => {
        // THE cold-boot regression: no cookies at all, and nothing has failed yet. Building and
        // loading a source must not decide the session is over — `ensureFreshToken` runs on this
        // path, and it used to call `unauthCall` the moment it found no token.
        const unauthCall = vi.fn()

        const ds = await build({ unauthCall })
        await ds.load()
        await settle()

        expect(unauthCall).not.toHaveBeenCalled()
    })

    it('redirects when a 401 outlives the refresh', async () => {
        // No main token → `refreshTokenOnce` can produce nothing → the session really is over.
        const unauthCall = vi.fn()

        const ds = await build({ unauthCall })
        ds.cfg.store.cfg.errorHandler(dxError(401))
        await settle()

        expect(unauthCall).toHaveBeenCalledTimes(1)
    })

    it('does NOT redirect when the refresh saves the session', async () => {
        // The short-circuit, pinned: with a handler registered, a 401 whose refresh succeeds must
        // leave the user exactly where they are. Before the fix this redirected without so much as
        // attempting the refresh.
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)

        const unauthCall = vi.fn()

        const ds = await build({ unauthCall, token: OLD })
        expire()
        refreshResponds(jwtOf({ exp: FUTURE(), sub: 'new' }))

        ds.cfg.store.cfg.errorHandler(dx401(OLD))
        await settle()

        expect(refreshCalls()).toBe(1)
        expect(unauthCall).not.toHaveBeenCalled()
    })

    it('redirects once for a whole page of failing requests', async () => {
        // A page of grids answers a dead session with a 401 each. One redirect, not six.
        const unauthCall = vi.fn()

        const ds = await build({ unauthCall })
        for (let i = 0; i < 6; i++) ds.cfg.store.cfg.errorHandler(dxError(401))
        await settle()

        expect(unauthCall).toHaveBeenCalledTimes(1)
    })

    it('leaves anything that is not a 401 alone', async () => {
        const unauthCall = vi.fn()

        const ds = await build({ unauthCall })
        ds.cfg.store.cfg.errorHandler(dxError(500))
        await settle()

        expect(unauthCall).not.toHaveBeenCalled()
    })
})

/* --------------------------- the token a store sends -------------------------- */

// @mono-lit/utility reads the cookie ONCE, at call time, and passes it down as `token`. A store
// is built once and lives as long as the page, while the cookie under it is replaced by
// every refresh — the core's own, one another store triggered, or the app's timer. It used to
// send the token it was BUILT with forever: refresh 200, next request 401, forever.

describe('the token a store sends', () => {
    it('follows the cookie after an app-side renewal', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        const NEW = jwtOf({ exp: FUTURE(), sub: 'new' })
        signIn(OLD)

        const ds = await build({ token: OLD })
        expect(sentBearer(ds)).toBe(`Bearer ${OLD}`)

        // CookieExp.vue / the access middleware renew behind the core's back
        setCookie(CONFIG.jwtRefreshName, NEW)

        expect(sentBearer(ds)).toBe(`Bearer ${NEW}`)
    })

    it('every store on the page picks up the token one 401 refreshed', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)

        const stores = [await build({ token: OLD }), await build({ token: OLD }), await build({ token: OLD })]
        expire()
        const NEW = jwtOf({ exp: FUTURE(), sub: 'new' })
        refreshResponds(NEW)

        for (const ds of stores) ds.cfg.store.cfg.errorHandler(dx401(OLD))
        await settle()

        expect(refreshCalls()).toBe(1)
        for (const ds of stores) expect(sentBearer(ds)).toBe(`Bearer ${NEW}`)
    })

    it('an explicit token that is not the cookie stays pinned', async () => {
        const COOKIE = jwtOf({ exp: FUTURE(), sub: 'cookie' })
        const EXPLICIT = jwtOf({ exp: FUTURE(), sub: 'explicit' })
        signIn(COOKIE)

        const ds = await build({ token: EXPLICIT })
        setCookie(CONFIG.jwtRefreshName, jwtOf({ exp: FUTURE(), sub: 'renewed' }))

        expect(sentBearer(ds)).toBe(`Bearer ${EXPLICIT}`)
    })

    it('falls back to the passed token when no cookie is readable', async () => {
        // SSR: mono resolves the cookie from the request event and hands it over as `token`;
        // there is no document.cookie for the core to prefer.
        const T = jwtOf({ exp: FUTURE(), sub: 'ssr' })

        const ds = await build({ token: T })

        expect(sentBearer(ds)).toBe(`Bearer ${T}`)
    })
})

/* ------------------------------- type: 'data' -------------------------------- */

/**
 * An ODataStore whose FIRST load is refused; `rows` after that.
 *
 * A 401 also runs the clock forward: the token was fine when the store was built (so the
 * proactive `ensureFreshToken` stayed quiet) and ran out by the time the server answered —
 * the reactive path, not the proactive one, is what these cover.
 */
function storeRefusingOnce(status: number, rows: any[] = [{ Id: 1 }]) {
    const load = vi.fn()
        .mockImplementationOnce(() => {
            if (status === 401) expire()
            return Promise.reject(status === 401 ? dx401('whatever') : dxError(status))
        })
        .mockResolvedValue(rows)

    class RefusingStore extends FakeStore {
        load = load
    }

    return { source: { ...source, ODataStore: RefusingStore }, load, rows }
}

const loadRows = (src: any) => useFetchOData<any>({
    url: '/Anything', baseUrl: 'https://api.test/odata', type: 'data', source: src,
    options: {}, config: CONFIG, tokenOptions: TOKEN_OPTIONS,
} as any)

describe("type: 'data'", () => {
    it('retries once behind a refresh that produced a different token', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)
        const NEW = jwtOf({ exp: FUTURE(), sub: 'new' })
        const { source: flaky, load, rows } = storeRefusingOnce(401)

        refreshResponds(NEW)

        const res = await loadRows(flaky)

        expect(res.statusCode).toBe(200)
        expect(res.data).toEqual(rows)
        expect(load).toHaveBeenCalledTimes(2)
        expect(refreshCalls()).toBe(1)
    })

    it('does not retry when the refresh hands back the same token', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)
        const { source: flaky, load } = storeRefusingOnce(401)

        refreshResponds(OLD)

        const res = await loadRows(flaky)

        expect(res.statusCode).toBe(401)
        expect(load).toHaveBeenCalledTimes(1)
    })

    it('leaves a non-401 alone', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)
        const { source: flaky, load } = storeRefusingOnce(500)

        const res = await loadRows(flaky)

        expect(res.statusCode).toBe(500)
        expect(load).toHaveBeenCalledTimes(1)
        expect(refreshCalls()).toBe(0)
    })
})

/* ------------------------- reloading a live DataSource ------------------------ */

// A grid-bound DataSource has nobody to re-issue the load it just lost. After a refresh
// that produced a DIFFERENT token it reloads itself once; the same token again would only
// be another 401, and a reload that fails leaves the store latched — never a loop.

describe('reloading a live DataSource', () => {
    it('reloads once after the token changed', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)

        const ds = await build({ token: OLD })
        expire()
        const NEW = jwtOf({ exp: FUTURE(), sub: 'new' })
        refreshResponds(NEW)
        ds.reload = vi.fn(() => Promise.reject(dx401(NEW)))

        ds.cfg.store.cfg.errorHandler(dx401(OLD))
        await settle()
        // the reload itself was refused with the NEW token: no second reload
        ds.cfg.store.cfg.errorHandler(dx401(NEW))
        await settle()

        expect(ds.reload).toHaveBeenCalledTimes(1)
    })

    it('does not reload when the token did not change', async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)

        const ds = await build({ token: OLD })
        expire()
        refreshResponds(OLD)
        ds.reload = vi.fn(() => Promise.resolve([]))

        ds.cfg.store.cfg.errorHandler(dx401(OLD))
        await settle()

        expect(ds.reload).not.toHaveBeenCalled()
    })

    it("does not reload for type: 'data' — that path awaits its own retry", async () => {
        const OLD = jwtOf({ exp: FUTURE(), sub: 'old' })
        signIn(OLD)
        const { source: flaky, load } = storeRefusingOnce(401)
        const reload = vi.fn()

        class Spied extends FakeDataSource {
            reload = reload
        }

        refreshResponds(jwtOf({ exp: FUTURE(), sub: 'new' }))

        const res = await loadRows({ ...flaky, DataSource: Spied })
        // DevExtreme would have raised the store's errorHandler for the refused load too
        res.dataSource.cfg.store.cfg.errorHandler(dx401(OLD))
        await settle()

        expect(res.statusCode).toBe(200)
        expect(load).toHaveBeenCalledTimes(2)
        expect(reload).not.toHaveBeenCalled()
    })
})
