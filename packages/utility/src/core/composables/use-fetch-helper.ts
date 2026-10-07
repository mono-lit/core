
import type DataSource from 'devextreme/data/data_source';
import type ODataStore from 'devextreme/data/odata/store';
import type CustomStore from 'devextreme/data/custom_store';
// import { DataSource, ODataStore, CustomStore, LoadOptions } from '@mono-lit/devextreme';
import type { OdataFetchTypes, NormalFetchOptions, NormalFetchResult } from "../types"
import { FetchClientError, FetchClient } from '@odata2ts/http-client-fetch';
import { useHelper } from './use-helper';
import type { LoadOptions } from 'devextreme/data';
import { Deferred } from 'devextreme/core/utils/deferred';
import { useMyToken, useMyCookie, useMyJwt, MonoFetchCookieOptions } from '../../token'
import { markRaw } from 'vue'
declare global {
    interface Window {
        helper?: any
    }
}

type ConfigType = { jwtName: string, jwtRefreshName: string }

// Discriminated result of a proactive refresh-token fetch so callers can tell
// "refreshed", "no main token", and "stored junk" apart instead of guessing.
type RefreshResult =
    | { ok: true; token: string }
    | { ok: false; reason: 'no-main' | 'store-failed' }

type Policy = "share" | "abort-prev";

/**
 * Deterministic serialization of a value, for request-dedupe keys.
 *
 * DEEP and key-sorted. The previous one-liner handed the value's own TOP-LEVEL
 * keys to `JSON.stringify` as a REPLACER ARRAY, and a replacer array filters
 * every object in the tree by that one list — so nested objects lost every key
 * that did not also appear at the top. `{ sort: [{ selector: "A" }] }` and
 * `{ sort: [{ selector: "B" }] }` both collapsed to `{"sort":[{}]}`, i.e. to the
 * SAME key, so two concurrent loads differing only by sort field deduped into
 * one. A key that cannot tell two requests apart does not save a request — it
 * hands the second caller the first caller's rows.
 */
function stable(v: any) {
    const seen = new WeakSet<object>();

    const walk = (x: any): any => {
        if (typeof x === 'function') return '[fn]';
        if (!x || typeof x !== 'object') return x;
        if (seen.has(x)) return '[circular]';
        seen.add(x);
        if (Array.isArray(x)) return x.map(walk);
        return Object.keys(x).sort().reduce<Record<string, any>>((acc, k) => {
            acc[k] = walk((x as any)[k]);
            return acc;
        }, {});
    };

    try {
        return JSON.stringify(walk(v)) ?? 'undefined';
    } catch {
        return String(v);
    }
}

/**
 * The part of a request that lives in `params` rather than in the url.
 *
 * `params` (`$apply`, `$filter`, …) are attached to the request LATER, inside the
 * store's `beforeSend` — they are not in the url the store was built with. So two
 * DataSources over one endpoint that differ ONLY by `params` are different
 * requests that look identical to anything keying on the url alone.
 *
 * Sorted by key so the same params written in a different order still match.
 */
const paramsIdentity = (p?: Record<string, any> | null) =>
    Object.entries(p ?? {})
        .filter(([, v]) => v !== undefined && v !== null)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => `${k}=${String(v)}`)
        .join('&');

/**
 * A store built with a caller `override` opts OUT of cross-store sharing:
 * `override.dataSource` is spread into the ODataStore config and can replace the
 * url, the params or `beforeSend` itself, none of which is comparable by value.
 * Such a store still dedupes against ITSELF — the ordinary case of one grid
 * firing the same load twice — just never against another store.
 */
let storeIdSeq = 0;
const nextStoreId = () => `#store${++storeIdSeq}`;

/** Endpoints already reported for ignoring `$count=true` (see the `load` override in useFetchOData) — once per URL. */
const warnedNoCount = new Set<string>();

type CountStrategy = 'path' | 'apply' | 'select'
/** The counting strategy that worked for an endpoint, so later pages skip the ones it ignores. */
const countStrategy = new Map<string, CountStrategy>()

/**
 * The row count of an OData query, for an endpoint that ignores `$count=true`.
 *
 * Tried in order — first success wins and is remembered per URL:
 *   path    `GET {url}/$count?$filter=…`                       → the bare integer (a different
 *           server code path from the query option, and honoured where that one is not);
 *   apply   `GET {url}?$apply=filter(…)/aggregate($count as Count)` → `value[0].Count`. Accepted
 *           only when the body has that shape — a server that ignores `$apply` sends rows back;
 *   select  `GET {url}?$select={key}&$filter=…`, unpaged        → `value.length`. The last resort,
 *           and what DevExtreme did anyway, as one request that is as small as the server allows.
 * `null` when nothing worked; the caller then leaves DevExtreme to its own fallback.
 *
 * `sent` is what `beforeSend` last put on the wire — its `$filter` is the compiled search +
 * filter of the page query, and its headers carry the bearer.
 */
async function resolveTotal(
    url: string,
    key: string,
    sent: { params: Record<string, any>; headers: Record<string, any> } | null,
): Promise<number | null> {
    const filter = sent?.params?.['$filter'] ? String(sent.params['$filter']) : ''
    const headers = { ...(sent?.headers || {}), Accept: 'application/json, text/plain' }

    const get = async (target: string) => {
        const r = await fetch(target, { headers })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
    }
    const withFilter = (qs: URLSearchParams) => { if (filter) qs.set('$filter', filter); return qs }

    const strategies: Record<CountStrategy, () => Promise<number>> = {
        path: async () => {
            const qs = withFilter(new URLSearchParams())
            const n = parseInt(await get(`${url}/$count${qs.size ? `?${qs}` : ''}`), 10)
            if (!Number.isFinite(n)) throw new Error('not a count')
            return n
        },
        apply: async () => {
            const qs = new URLSearchParams()
            qs.set('$apply', `${filter ? `filter(${filter})/` : ''}aggregate($count as Count)`)
            const body = JSON.parse(await get(`${url}?${qs}`))
            const n = Number(body?.value?.[0]?.Count)
            if (!Array.isArray(body?.value) || body.value.length !== 1 || !Number.isFinite(n)) throw new Error('$apply ignored')
            return n
        },
        select: async () => {
            const qs = withFilter(new URLSearchParams())
            qs.set('$select', key)
            const body = JSON.parse(await get(`${url}?${qs}`))
            if (!Array.isArray(body?.value)) throw new Error('no value array')
            return body.value.length
        },
    }

    const order: CountStrategy[] = ['path', 'apply', 'select']
    const known = countStrategy.get(url)
    for (const name of known ? [known, ...order.filter((o) => o !== known)] : order) {
        try {
            const n = await strategies[name]()
            countStrategy.set(url, name)
            if (!warnedNoCount.has(url)) {
                warnedNoCount.add(url)
                console.warn(`[@mono-lit/utility] ${url}: the server ignores $count=true (no @odata.count); the total is counted via "${name}" instead. Enable $count on this OData endpoint.`)
            }
            return n
        } catch { /* next */ }
    }
    return null
}


const cookie = useMyCookie()
const jwt = useMyJwt()
const slTkn = useMyToken()

let refreshPromise: Promise<string | null> | null = null

let proactivePromise: Promise<RefreshResult> | null = null

async function retryFetchClientOnce<T>(
    fn: () => Promise<T>,
    config?: ConfigType,
    tokenOptions?: MonoFetchCookieOptions,
): Promise<T> {
    try {
        return await fn()
    } catch (err: any) {
        const status = err?.status ?? err?.response?.status ?? err?.httpStatus

        if (status !== 401) {
            throw err
        }

        const newToken = await refreshTokenOnce({
            config,
            options: tokenOptions,
        })

        if (!newToken) {
            throw err
        }

        return await fn()
    }
}

function getCookieToken(name?: string, split = false) {
    if (!name) return null
    let v: string | null | undefined
    try {
        v = cookie.get(name, split)
    } catch {
        // `document` is absent (SSR) — the cookie is read on EVERY request now, so this
        // has to be a plain "nothing here", never a throw out of `beforeSend`.
        return null
    }
    // A corrupt cookie (empty or the literal string "undefined"/"null") must never
    // become `Authorization: Bearer undefined` downstream.
    if (v == null || v === '' || v === 'undefined' || v === 'null') return null
    return v
}

// A stored token is only usable if it is a non-empty, decodable JWT.
function isUsableToken(v?: string | null): v is string {
    if (!v) return false
    return Boolean(jwt.cookieDecode({ token: v }))
}

let refetchRefreshToken = async ({
    token: tkn,
    config,
    options
}: {
    token?: string,
    config?: ConfigType,
    options?: MonoFetchCookieOptions
}): Promise<RefreshResult> => {
    const token = tkn || getCookieToken(config?.jwtName, true)

    // The refresh endpoint authenticates with the main token (Bearer + username),
    // so without it a refresh is impossible.
    if (!token) return { ok: false, reason: 'no-main' }

    const decodeToken = jwt.cookieDecode<{ USER_NAME: string }>({ token })

    const mergedOptions: MonoFetchCookieOptions = {
        ...options,
        name: options?.name ?? config?.jwtRefreshName,
        splitCookie: options?.splitCookie ?? false,
        fetchParams: {
            ...options?.fetchParams,
            options: {
                ...options?.fetchParams?.options,
                headers: {
                    ...(options?.fetchParams?.options?.headers || {}),
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: options?.fetchParams?.options?.body ?? JSON.stringify({
                    username: decodeToken?.USER_NAME,
                }),
            },
        },
    }

    await slTkn.fetch<{ Expired: number, RefreshToken: string }>(mergedOptions)

    // Re-read what was actually persisted. `slTkn.fetch` short-circuits when the
    // target cookie still validates, and a response-shape mismatch can store the
    // literal string "undefined" — so trust the stored value, not the call.
    const stored = getCookieToken(
        options?.name ?? config?.jwtRefreshName,
        options?.splitCookie ?? false,
    )

    if (!isUsableToken(stored)) return { ok: false, reason: 'store-failed' }

    return { ok: true, token: stored }
}



/**
 * Where the api-token cookie lives — the SAME name/split `refetchRefreshToken` writes to,
 * so what a refresh stores is exactly what the next request reads.
 */
function apiCookieRef(config?: ConfigType, tokenOptions?: MonoFetchCookieOptions) {
    return {
        name: tokenOptions?.name ?? config?.jwtRefreshName,
        split: tokenOptions?.splitCookie ?? false,
    }
}

/**
 * Was `token` READ from one of the configured cookies?
 *
 * @mono-lit/utility resolves the live cookie once, at call time, and hands it over as `token`.
 * The core cannot be told "this was a cookie" any other way — but on the client mono reads the
 * very same `document.cookie` this module does, so byte-equality with the cookie IS that
 * signal. A token equal to no cookie was chosen by the caller and stays pinned; no readable
 * cookie at all (SSR) also pins it, which keeps the passed value as the fallback there.
 *
 * The main-cookie check covers mono's own fallback: when the api cookie is missing it sends
 * the main token instead.
 */
function tokenFollowsCookie(token: string | undefined, config?: ConfigType, tokenOptions?: MonoFetchCookieOptions) {
    if (!token) return true
    const api = apiCookieRef(config, tokenOptions)
    return token === getCookieToken(api.name, api.split) || token === getCookieToken(config?.jwtName, true)
}

/**
 * The Bearer for a request.
 *
 * `followCookie` is the fix for a store that outlives its token: a DataSource is built once
 * and issues requests for as long as the page lives, while the cookie under it is replaced
 * by every refresh — the core's own 401 path, the one another store on the page triggered, or
 * the app's timer. Reading `manualToken` first meant the store sent the token it was BUILT
 * with forever, so after a refresh every request 401'd again. With `followCookie` the live
 * cookie wins and the captured value is only the fallback for where no cookie is readable.
 */
function getRequestToken({
    manualToken,
    config,
    tokenOptions,
    followCookie = false,
}: {
    manualToken?: string
    config?: ConfigType
    tokenOptions?: MonoFetchCookieOptions
    followCookie?: boolean
}) {
    if (manualToken && !followCookie) return manualToken

    const api = apiCookieRef(config, tokenOptions)

    return getCookieToken(api.name, api.split) || manualToken || null
}

/**
 * `unauthCall` means ONE thing: a refresh was attempted and could not save the session.
 *
 * It is not "a 401 happened" — every 401 path below tries `refreshTokenOnce` first — and it is not
 * "there is no token", because at boot that is indistinguishable from a cold start whose cookies the
 * app has not renewed yet. Getting that wrong is what used to throw a signed-in user back to the
 * login gate on the first request of the session.
 *
 * The latch is for the fan-out: a page with several grids answers a dead session with several 401s,
 * and each would otherwise fire its own redirect. It clears the moment a refresh succeeds, so the
 * NEXT dead session redirects again.
 */
let unauthFired = false

function callUnauth(unauthCall?: () => void): void {
    if (!unauthCall || unauthFired) return

    unauthFired = true
    unauthCall()
}

/** A refresh worked — the session is alive again, so arm the latch for next time. */
function resetUnauthLatch(): void {
    unauthFired = false
}

// Proactively ensure the refresh token is fresh BEFORE a request goes out.
// `token` is treated as the refresh token; `tokenOptions` describes how to fetch a new one.
async function ensureFreshToken({
    token,
    config,
    tokenOptions,
    leewaySeconds = 60,
}: {
    token?: string
    config?: ConfigType
    tokenOptions?: MonoFetchCookieOptions
    leewaySeconds?: number
}): Promise<string | null> {
    const split = tokenOptions?.splitCookie ?? false
    const current = token ?? getCookieToken(tokenOptions?.name ?? config?.jwtRefreshName, split)

    // No way to fetch a fresh token configured → preserve existing behavior.
    if (!tokenOptions?.fetchParams?.url) return current

    let expiring = !current
    if (current) {
        try {
            const decoded = jwt.cookieDecode<{}>({ token: current })
            const now = Math.floor(Date.now() / 1000)
            expiring = !decoded?.exp || (Number(decoded.exp) - now) <= leewaySeconds
        } catch {
            expiring = true
        }
    }

    if (!expiring) return current

    // A refresh requires the main token (for the Bearer header + username body).
    const mainToken = getCookieToken(config?.jwtName, true)
    if (!mainToken) {
        // Can't proactively refresh — and deliberately NOT a reason to declare the session dead.
        // Nothing has been refused yet: this also describes a cold boot, where the app's own cookie
        // renewal has not mounted. Let the request go and let a real 401 answer for it.
        return current
    }

    // Reuse the proven reactive refresh path: it reads the (split) main token, attaches the
    // Authorization header + username body, stores the new refresh token, and verifies it.
    proactivePromise ??= refetchRefreshToken({ token: mainToken, config, options: tokenOptions })

    try {
        const result = await proactivePromise

        if (result.ok) {
            resetUnauthLatch()
            return result.token
        }

        // Same reasoning as above: the main token vanished mid-flight, which is still not a refused
        // request. The 401 path decides.
        if (result.reason === 'no-main') return current

        // store-failed: the refresh ran but produced no usable token (most likely the
        // /Auth/RefreshToken response shape doesn't match tokenOptions.path). Keep the
        // existing token; never return the literal "undefined".
        console.warn('[@mono-lit/utility] proactive refresh did not produce a usable token — check tokenOptions.path against the /Auth/RefreshToken response shape.')
        return current
    } finally {
        proactivePromise = null
    }
}

async function refreshTokenOnce({
    config,
    options,
}: {
    config?: ConfigType
    options?: MonoFetchCookieOptions
} = {}): Promise<string | null> {
    refreshPromise ??= (async () => {
        const mainToken = getCookieToken(config?.jwtName, true)

        if (!mainToken) return null

        try {
            const r = await refetchRefreshToken({
                token: mainToken,
                config,
                options,
            })

            return r.ok ? r.token : getCookieToken(config?.jwtRefreshName)
        } catch {
            // A refresh that throws is a refresh that failed. Returning null keeps the callers'
            // `.then()` on its feet, so the 401 they came from still gets an answer.
            return getCookieToken(config?.jwtRefreshName)
        }
    })()

    try {
        const token = await refreshPromise
        // A working refresh re-arms the latch, so the NEXT dead session redirects again.
        if (token) resetUnauthLatch()
        return token
    } finally {
        refreshPromise = null
    }
}
type AuthFetchOptions = RequestInit & {
    token?: string
    skipAuthRetry?: boolean
}

async function authFetch({
    url, init = {}, config, options
}: {
    url: string,
    init: AuthFetchOptions,
    config?: ConfigType,
    options?: MonoFetchCookieOptions
}
): Promise<Response> {
    const {
        token: manualToken,
        skipAuthRetry,
        ...fetchInit
    } = init

    const token = getRequestToken({
        manualToken,
        config,
        tokenOptions: options,
    })

    const headers = new Headers(fetchInit.headers)

    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    if (fetchInit.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(url, {
        ...fetchInit,
        headers,
    })

    if (res.status !== 401 || skipAuthRetry) {
        return res
    }

    const newToken = await refreshTokenOnce({ config, options })

    if (!newToken) {
        return res
    }

    const retryHeaders = new Headers(headers)

    retryHeaders.set('Authorization', `Bearer ${newToken}`)

    if (fetchInit.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json')
    }

    return await fetch(url, {
        ...fetchInit,
        headers: retryHeaders,
    })
}



























































function createRequestManager() {
    const inflightFetch = new Map<string, Promise<Response>>();
    const controllers = new Map<string, AbortController>();
    const inflightStore = new Map<string, any>();

    function keyFetch(url: string, init?: RequestInit) {
        const method = (init?.method ?? "GET").toUpperCase();

        if (method === 'GET') {
            return `${method} ${url}`;
        }

        return `${method} ${url} ${String((init as any)?.body ?? '')}`;
    }

    async function smartFetch({
        url,
        init = {},
        policy = "share",
        config,
        tokenOptions
    }: {
        url: string,
        init?: AuthFetchOptions,
        policy?: Policy,
        config?: { jwtRefreshName: string; jwtName: string },
        tokenOptions?: MonoFetchCookieOptions
    }): Promise<Response> {
        const method = (init?.method ?? "GET").toUpperCase()

        if (method !== 'GET' && policy === 'share') {
            policy = 'abort-prev'
        }

        const k = keyFetch(url, init);

        if (policy === "share") {
            const existing = inflightFetch.get(k);
            if (existing) return await existing;

            // const p = fetch(url, init).finally(() => inflightFetch.delete(k));

            const p = authFetch({ url, init, config, options: tokenOptions }).finally(() => inflightFetch.delete(k))
            inflightFetch.set(k, p);
            return await p;
        }

        const prev = controllers.get(k);
        if (prev) prev.abort();

        const ac = new AbortController();
        controllers.set(k, ac);

        try {
            return await authFetch({ url, init: { ...init, signal: ac.signal }, config, options: tokenOptions })
        } finally {
            if (controllers.get(k) === ac) controllers.delete(k);
        }
    }

    function tryAbort(p: any) {
        if (p && typeof p.abort === "function") p.abort();         // jqXHR
        else if (p?.xhr && typeof p.xhr.abort === "function") p.xhr.abort();
    }

    function attachCleanup(p: any, cleanup: () => void) {
        if (p && typeof p.always === "function") p.always(cleanup);        // DevExtreme promise
        // native promise — `finally` derives a promise that re-rejects, and nobody is
        // listening to THAT one: every failed load became an "Uncaught (in promise)".
        else if (p && typeof p.finally === "function") p.finally(cleanup).catch(() => { });
        else p?.then?.(cleanup, cleanup);
    }

    // Patch DevExtreme store to dedupe/abort duplicate load/byKey
    function patchDxStore(store: any, name: string, policy: Policy = "share") {
        if (!store || store.__reqPatched) return;
        store.__reqPatched = true;

        const origLoad = store.load?.bind(store);
        const origByKey = store.byKey?.bind(store);

        if (origLoad) {
            store.load = (loadOptions: any) => {
                const k = `${name}::load::${stable(loadOptions ?? {})}`;
                const existing = inflightStore.get(k);

                if (existing) {
                    if (policy === "share") return existing;
                    tryAbort(existing);
                    inflightStore.delete(k);
                }

                const p = origLoad(loadOptions);
                inflightStore.set(k, p);
                attachCleanup(p, () => {
                    if (inflightStore.get(k) === p) inflightStore.delete(k);
                });
                return p;
            };
        }

        if (origByKey) {
            store.byKey = (key: any, extra?: any) => {
                const k = `${name}::byKey::${stable(key)}::${stable(extra)}`;
                const existing = inflightStore.get(k);

                if (existing) {
                    if (policy === "share") return existing;
                    tryAbort(existing);
                    inflightStore.delete(k);
                }

                const p = origByKey(key, extra);
                inflightStore.set(k, p);
                attachCleanup(p, () => {
                    if (inflightStore.get(k) === p) inflightStore.delete(k);
                });
                return p;
            };
        }
    }

    return { smartFetch, patchDxStore };
}

// ✅ singleton inside the helper module (callers don’t see it)
const manageRequest = createRequestManager();


function httpVariant(
    input: number | string | { status?: number } | { response?: { status?: number } }
): any {
    const status = toStatus(input);
    if (status == null) return undefined;

    const bucket = Math.trunc(status / 100);
    return bucket === 4 ? 'warning'
        : bucket === 5 ? 'error'
            : undefined;
}

function toStatus(
    input: number | string | { status?: number } | { response?: { status?: number } }
): number | null {
    if (typeof input === 'number') return input;
    if (typeof input === 'string') {
        const n = Number(input);
        return Number.isFinite(n) ? n : null;
    }
    if (input && typeof input === 'object') {
        // fetch Response-like or generic error with .status
        if (typeof (input as any).status === 'number') return (input as any).status;
        // AxiosError-like: error.response.status
        const res = (input as any).response;
        if (res && typeof res.status === 'number') return res.status;
    }
    return null;
}

const mapOdataService = ({ url, services }: { url: string, services: any }): {
    Service: new (...args: any[]) => any;
    EntityAccessor?: (svc: any) => any
} | undefined => {

    if (!services) return undefined;

    function lastPathSegment(input: string): string | null {
        // 1. Strip query part (?...) if any
        const noQuery = input.split("?")[0];

        // 2. Split path into segments
        const segs = noQuery.split("/").filter(Boolean);
        if (!segs.length) return null;

        // 3. Take the last segment (e.g., "DTO_Produk" or "DTO_Produk(123)")
        const raw = segs[segs.length - 1];

        // 4. Remove "(...)" key part if present and decode
        return decodeURIComponent(raw.replace(/\(.*\)$/, ""));
    }

    if (lastPathSegment(url)) {
        return {
            Service: services,
            //@ts-ignore
            EntityAccessor: (svc) => svc[lastPathSegment(url)]()
        }
    }

    return undefined



}

// Standardize the messy, per-API error shapes into one human message.
// Collects every "*message*" key (case-insensitive) with a non-empty string value — also OData's
// { error: { message: { value } } } shape — dedupes, and joins multiples with a blank line.
export function extractErrorMessage(source: any, fallback = 'Terjadi kesalahan!.'): string {
    if (source == null) return fallback;
    if (typeof source === 'string') return source.trim() || fallback;

    const found: string[] = [];
    const add = (s: any) => { if (typeof s === 'string' && s.trim()) found.push(s.trim()); };

    const visit = (val: any, depth: number) => {
        if (!val || typeof val !== 'object' || depth > 3) return;
        for (const [k, v] of Object.entries(val)) {
            if (/message/i.test(k)) {
                if (typeof v === 'string') add(v);
                // OData: message is an object { value: "..." }
                else if (v && typeof v === 'object' && typeof (v as any).value === 'string') add((v as any).value);
            }
            if (v && typeof v === 'object') visit(v, depth + 1); // descend into nested error objects
        }
    };

    visit(source, 0);

    // Error instances keep `message` on the prototype (non-enumerable) → Object.entries misses it.
    if (!found.length && typeof (source as any)?.message === 'string') add((source as any).message);

    const unique = [...new Set(found)]; // dedupe so { message:"X", errorMessage:"X" } → "X"
    return unique.length ? unique.join('\n\n') : fallback;
}


export function adaptFetchClientErrorToDx(err: any) {
    if (err instanceof FetchClientError) {
        const status = err.status;
        const body = err.responseData ?? null as any
        const msg = extractErrorMessage(body, err.message || 'Unexpected error');

        const dxErr: any = new Error(msg);
        dxErr.httpStatus = status;
        dxErr.status = status;
        dxErr.errorDetails = {
            status,
            //@ts-ignore
            statusText: err.statusText ?? '',
            // DevExtreme parsers often look at responseText
            responseText: body ? JSON.stringify(body) : '',
        };
        return dxErr;
    }
    return err;
}


function splitOdata(urlAbs: string) {
    const i = urlAbs.indexOf('/odata');
    if (i < 0) return null;
    const root = urlAbs.slice(0, i + '/odata'.length);  // .../odata
    const rest = urlAbs.slice(i + '/odata'.length);     // /EntitySet or /EntitySet(...)
    return { root, rest };
}

function parseODataUrl(urlAbs: string) {
    const spl = splitOdata(urlAbs);
    if (!spl) return null;

    const pathAndQuery = spl.rest; // e.g. "/DTO_HeaderPpl(1)?$select=..."
    const [path, query = ""] = pathAndQuery.split("?");
    const tail = path.replace(/^\//, "");

    // match "DTO_HeaderPpl" and optional "(...)" key
    const m = tail.match(/^([^/()]+)(?:\(([^)]+)\))?(?:\/(.*))?$/);
    // groups: [0]=whole, [1]=entitySet, [2]=parenKey?, [3]=slashRest?
    if (!m) return null;

    const entitySet = m[1];
    const parenKey = m[2] ?? null;

    // if we have a slash part AND no parenKey, treat first segment as key
    let slashKey: string | null = null;
    if (!parenKey && m[3]) {
        const firstSeg = m[3].split("/")[0]; // e.g. "123" in "123/something"
        if (firstSeg) slashKey = decodeURIComponent(firstSeg);
    }

    const rawKey = parenKey ?? slashKey; // string form like "123" or "Id=1,Code='X'"

    // Build canonical entity-set base URL (no key, no query)
    const canonicalSetUrl = `${spl.root.replace(/\/$/, "")}/${entitySet}`;

    // Build canonical full URL with key (if any) in parenthesis
    const canonicalUrlWithKey = rawKey
        ? `${canonicalSetUrl}(${rawKey})${query ? `?${query}` : ""}`
        : `${canonicalSetUrl}${query ? `?${query}` : ""}`;

    return {
        root: spl.root,
        entitySet,
        rawKey,                // like "1" or "Id=1,Code='X'"
        hasParenKey: Boolean(parenKey),
        hasSlashKey: Boolean(slashKey),
        canonicalSetUrl,
        canonicalUrlWithKey,
        query
    };
}



function toRelativeFromRoot(url: string, root: string): string {
    // If absolute, strip scheme+host and the service-root prefix
    try {
        const abs = new URL(url, root);
        const base = new URL(root);
        if (abs.origin === base.origin) {
            // remove the service-root path prefix
            const rel = abs.pathname + (abs.search || '');
            // ex: root=/odata => strip that prefix so change requests start with "DTO_..."
            const rootPath = base.pathname.replace(/\/$/, ''); // "/odata"
            const out = rel.startsWith(rootPath) ? rel.slice(rootPath.length) : rel;
            return out.replace(/^\/+/, ''); // no leading slash per spec examples
        }
    } catch { /* fall through */ }
    // already relative or unknown origin
    return url.replace(/^\/+/, '');
}

async function odataBatchWrite({
    client, canonicalSetUrl, root, ops,
}: {
    client: FetchClient;
    canonicalSetUrl: string; // now actually useful if callers pass absolute URLs
    root: string;
    ops: Array<{ method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; url: string; body?: any }>;
}) {
    const batchId = `batch_${crypto.randomUUID()}`;
    const changeId = `changeset_${crypto.randomUUID()}`;

    const lines: string[] = [];
    lines.push(`--${batchId}`);
    lines.push(`Content-Type: multipart/mixed; boundary=${changeId}`, '');

    for (let i = 0; i < ops.length; i++) {
        const o = ops[i];
        const relUrl = toRelativeFromRoot(o.url || canonicalSetUrl, root);

        lines.push(`--${changeId}`);
        lines.push('Content-Type: application/http');
        lines.push('Content-Transfer-Encoding: binary');
        lines.push(`Content-ID: ${i + 1}`, '');
        lines.push(`${o.method} ${relUrl} HTTP/1.1`);
        lines.push('Content-Type: application/json; charset=utf-8', '');
        if (o.method === 'DELETE') lines.push('');
        else lines.push(JSON.stringify(o.body ?? {}), '');
    }
    lines.push(`--${changeId}--`, '');
    lines.push(`--${batchId}--`, '');

    const body = lines.join('\r\n');

    return client.post(`${root.replace(/\/$/, '')}/$batch`, body, {
        headers: {
            'Content-Type': `multipart/mixed; boundary=${batchId}`,
            'Accept': 'multipart/mixed',
        }
    });
}


function pickKeyForRow(
    row: any,
    i: number,
    payload: { keyName?: string; keyValue?: any[] },
) {
    // explicit key array wins (supports composite)
    if (Array.isArray(payload.keyValue)) return payload.keyValue[i];

    const name = payload.keyName || 'Id';
    return row?.[name];
}

function isInsertKey(key: any) {
    // null/undefined/'' => insert
    if (key == null || key === '') return true;

    // scalar negative numbers => treat as temp IDs => insert
    if (typeof key === 'number' && key < 0) return true;

    // composite: if every numeric part is negative or missing, consider insert
    if (key && typeof key === 'object' && !Array.isArray(key)) {
        const entries = Object.entries(key);
        if (!entries.length) return true;
        const allNegOrMissing = entries.every(([_, v]) =>
            v == null || v === '' || (typeof v === 'number' && v < 0)
        );
        if (allNegOrMissing) return true;
    }

    return false;
}

// optional: remove key field when inserting (avoid server rejecting temp/empty id)
function stripKeyOnInsert(row: any, keyName = 'Id') {
    if (row && Object.prototype.hasOwnProperty.call(row, keyName)) {
        const clone = { ...row };
        delete clone[keyName];
        return clone;
    }
    return row;
}


// Build OData key segment: (1) for single key → (123) or ('ABC')
// (2) for composite keys → (KeyA=1,KeyB='X')
function buildKeySegment(key: any) {
    const quote = (v: any) => {
        if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`;
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        return String(v);
    };
    if (key == null) return '';
    if (typeof key === 'object' && !Array.isArray(key)) {
        const parts = Object.entries(key).map(([k, v]) => `${k}=${quote(v)}`);
        return `(${parts.join(',')})`;
    }
    return `(${quote(key)})`;
}


export function parseDxError(err: any) {
    // ✅ DevExtreme wrapper shape: { error: { httpStatus, requestOptions, ... } }
    const wrapped = err?.error;

    const status =
        wrapped?.httpStatus ??          // ✅ ini yang kamu lihat di debug
        err?.httpStatus ??
        err?.status ??
        err?.xhr?.status ??
        err?.errorDetails?.status ??
        null;

    // DevExtreme can pass either wrapped.error, xhr, errorDetails, or both.
    const xhr = err?.errorDetails ?? err?.xhr ?? wrapped ?? null;

    let body: any = null;

    // 1) jQuery-like jqXHR: responseJSON or responseText
    if (xhr?.responseJSON) body = xhr.responseJSON;

    if (!body && typeof xhr?.responseText === 'string') {
        try { body = JSON.parse(xhr.responseText); } catch { }
    }

    // 2) plain string body
    if (!body && typeof xhr?.response === 'string') {
        try { body = JSON.parse(xhr.response); } catch { }
    }

    // 3) if wrapped itself contains something useful
    if (!body && wrapped && typeof wrapped === 'object') {
        body = wrapped;
    }

    // 4) sometimes the entire error is already the parsed object
    if (!body && typeof err === 'object' && (err.error || err.Message || err.message)) {
        body = err;
    }

    const message = status == 401
        ? 'Unauthorized access' : status == 403 ? 'Forbidden access' :
            extractErrorMessage(body, '')
            || extractErrorMessage(wrapped, '')
            || extractErrorMessage(err, 'Unexpected error');

    const code =
        body?.error?.code ??
        body?.ErrorCode ??
        body?.code ??
        null;

    return { status, code, message, body: body ?? xhr ?? err, err };
}





export const useFetchOData = async <T = any>({
    url,
    options,
    source,
    type = 'datasource',
    params,
    notif = false,
    force = false,
    token,
    headers,
    selfProxy = '',
    method = 'GET',
    baseUrl,
    override,
    allowZero = false,
    cache = false,
    expiredBehaviour,
    unauthCall,
    payload = { data: null, keyValue: null, keyName: '', keyType: '' },
    config,
    tokenOptions,
    tanstack
}: OdataFetchTypes): Promise<{
    data: T | null,
    dataSource: DataSource<T> | null,
    statusCode: number,
    error: { message: string, stack: string, response: any } | null
}> => {

    const helper = window.helper || useHelper();

    const isNotif = typeof notif === 'boolean' && notif === true ? helper.notif : notif;

    type ZeroGuard = 'all' | string[];

    const zeroGuardFields: ZeroGuard = 'all'; // or ['Id', 'IdArea']

    const isZeroVal = (v: any) => v === 0 || v === '0';

    // An OData system option is never a "zero id": `$top=0` is how DevExtreme asks for the
    // count alone (its `totalCount()` probe), and stripping it turned that probe into an
    // UNPAGED download of the whole table. Only the consumer's own params are guarded.
    const shouldStripZero = (k: string, v: any, allowZero: boolean, guard: ZeroGuard) =>
        !allowZero && !k.startsWith('$') && isZeroVal(v) && (guard === 'all' || (Array.isArray(guard) && guard.includes(k)));

    function stripZeroParams(params: Record<string, any> | undefined, allowZero: boolean, guard: ZeroGuard) {
        if (!params) return;
        for (const [k, v] of Object.entries(params)) {
            if (shouldStripZero(k, v, allowZero, guard)) delete (params as any)[k];
        }
    }

    // make filter-aware guard honor field names too
    function containsZeroInDxFilter(expr: any, allowZero: boolean, guard: ZeroGuard): boolean {
        if (allowZero || !expr) return false;

        if (Array.isArray(expr)) {
            // simple condition: [field, op, value]
            if (expr.length >= 3 && typeof expr[0] === 'string') {
                const [field, , val] = expr;
                if (isZeroVal(val) && (guard === 'all' || (Array.isArray(guard) && guard.includes(field)))) return true;
            }
            // nested / combined conditions
            return expr.some(e => containsZeroInDxFilter(e, allowZero, guard));
        }
        if (expr && typeof expr === 'object') {
            return Object.values(expr).some(v => containsZeroInDxFilter(v, allowZero, guard));
        }
        return false;
    }


    try {
        // proactively refresh the (refresh) token before any request is built
        token = await ensureFreshToken({ token, config, tokenOptions }) ?? undefined

        // Decided ONCE, after the proactive refresh above may have replaced `token` with the
        // value it just stored: a cookie-derived token follows the cookie for the life of the
        // store, a caller's own token stays pinned. See `getRequestToken`.
        const followCookie = tokenFollowsCookie(token, config, tokenOptions)
        const readToken = () => getRequestToken({ manualToken: token, config, tokenOptions, followCookie }) ?? undefined

        // Built further down; the store's errorHandler reaches it through this binding.
        let dataSource: any = null
        // One auto-reload per 401 episode. Stays latched if the reload itself fails, so a
        // token the server keeps refusing never turns into a reload loop.
        let authReloadPending = false

        const bearerOf = (h: any): string | undefined => {
            const v = h?.Authorization ?? h?.authorization
            return typeof v === 'string' && v.startsWith('Bearer ') ? v.slice(7) : undefined
        }

        // Shared by both store errorHandlers (fake + real): refresh FIRST, exactly as the
        // fetch path does. `unauthCall` used to return here before anything was tried, which
        // switched refresh-on-401 OFF for every DataSource in an app that registered one —
        // the opposite of what it means. Concurrent 401s share one attempt: `refreshTokenOnce`
        // dedupes.
        const onStore401 = (err: any) => {
            // DevExtreme rejects with the ajax options our beforeSend populated, so the token
            // the server actually refused is right there; `readToken()` is the fallback.
            const refusedToken =
                bearerOf(err?.requestOptions?.headers ?? err?.error?.requestOptions?.headers) ??
                readToken()

            refreshTokenOnce({ config, options: tokenOptions }).then((newToken) => {
                if (newToken) {
                    // A grid-bound DataSource has nobody to re-issue the load it just lost;
                    // reload it once, and only when the refresh produced a DIFFERENT token —
                    // re-sending the refused one would just be another 401. `type: 'data'`
                    // awaits its own retry below; reloading here too would double the request.
                    const live = type === 'datasource' || type === 'fakedatasource'

                    if (live && newToken !== refusedToken && !authReloadPending && typeof dataSource?.reload === 'function') {
                        authReloadPending = true
                        Promise.resolve(dataSource.reload()).then(
                            () => { authReloadPending = false },
                            () => { /* stays latched */ },
                        )
                    }
                    return
                }

                if (unauthCall) {
                    callUnauth(unauthCall);
                    return;
                }

                if (expiredBehaviour === 'refresh') window.location.reload();
            })
        }

        const urls = `${selfProxy ? selfProxy : baseUrl}${url}`;

        const ds = source?.DataSource
        const cs = source?.CustomStore
        const ods = source?.ODataStore

        // Opt-in TanStack behaviour, forwarded only to store classes that declare support via the
        // neutral `Symbol.for('mono.tanstack')` flag. Plain DevExtreme stores never see the key.
        const tanstackFlag = Symbol.for('mono.tanstack');
        const odsTanstack = tanstack && (ods as any)?.[tanstackFlag] ? { tanstack } : {};
        const csTanstack = tanstack && (cs as any)?.[tanstackFlag] ? { tanstack } : {};

        const keyName = payload?.keyName || (options as any)?.key || 'Id';
        const isFake = type === 'fakedatasource' || type === 'fakedata';
        function isZeroKey(v: any): boolean {
            if (v === 0 || v === '0') return true;
            if (Array.isArray(v)) return v.some(isZeroKey);
            if (v && typeof v === 'object') return Object.values(v).some(isZeroKey);
            return false;
        }


        function applyByKeyGuardAndCache(
            store: any,
            { allowZero, cache }: { allowZero: boolean; cache: boolean }
        ) {
            if (!store || (store as any).__byKeyPatched) return;
            (store as any).__byKeyPatched = true;

            const cacheMap: Map<any, any> = new Map();
            (store as any).__byKeyCache = cacheMap;

            const origByKey = typeof store.byKey === 'function' ? store.byKey.bind(store) : null;
            if (origByKey) {
                store.byKey = (key: any, extra?: any) => {
                    // zero guard
                    if (!allowZero) {
                        const isZero = (v: any): boolean =>
                            v === 0 || v === '0' || (Array.isArray(v) && v.some(isZero)) ||
                            (v && typeof v === 'object' && Object.values(v).some(isZero));
                        if (isZero(key)) return dxResolve(null);
                    }
                    // cache hit
                    if (cache && cacheMap.has(key)) return dxResolve(cacheMap.get(key));

                    const dxp = ensureDx(origByKey(key, extra));
                    // fill cache on success
                    dxp.done?.((val: any) => { if (cache) cacheMap.set(key, val); });
                    dxp.then?.((val: any) => { if (cache) cacheMap.set(key, val); });
                    return dxp;
                };
            }

            // also guard zero-valued filters at store.load level
            const origLoad = typeof store.load === 'function' ? store.load.bind(store) : null;
            if (origLoad) {
                store.load = (loadOptions: any) => {
                    const hasZero = (expr: any): boolean => {
                        if (!expr) return false;
                        if (Array.isArray(expr)) {
                            if (expr.length >= 3 && typeof expr[0] === 'string') {
                                const [, , val] = expr;
                                if (val === 0 || val === '0') return true;
                            }
                            return expr.some(hasZero);
                        }
                        if (expr && typeof expr === 'object') {
                            return Object.values(expr).some(v => v === 0 || v === '0' || hasZero(v));
                        }
                        return false;
                    };
                    if (!allowZero && hasZero(loadOptions?.filter)) {
                        const empty = loadOptions?.requireTotalCount ? { data: [], totalCount: 0 } : [];
                        return dxResolve(empty);
                    }
                    return ensureDx(origLoad(loadOptions));
                };
            }

            // basic invalidation: update/remove/delete the affected keys
            const origUpdate = typeof store.update === 'function' ? store.update.bind(store) : null;
            if (origUpdate) {
                store.update = (key: any, values: any) => {
                    cacheMap.delete(key);
                    return ensureDx(origUpdate(key, values));
                };
            }
            const origRemove = typeof store.remove === 'function' ? store.remove.bind(store) : null;
            if (origRemove) {
                store.remove = (key: any) => {
                    cacheMap.delete(key);
                    return ensureDx(origRemove(key));
                };
            }
            const origInsert = typeof store.insert === 'function' ? store.insert.bind(store) : null;
            if (origInsert) {
                store.insert = (values: any) => {
                    // safest: clear all; you can refine if your API returns new key
                    cacheMap.clear();
                    return ensureDx(origInsert(values));
                };

            }
        }



        type DXPromise<T> = {
            then: Promise<T>['then']; catch: Promise<T>['catch']; finally: Promise<T>['finally'];
            done(cb: (v: T) => any): DXPromise<T>; fail(cb: (e: any) => any): DXPromise<T>; always(cb: (a: any) => any): DXPromise<T>;
            _resolve(v: T): void; _reject(e: any): void;
        };
        function makeDxPromise<T>(): DXPromise<T> {
            let resolve!: (v: T) => void, reject!: (e: any) => void;
            const p = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
            const api: any = {};
            api.then = p.then.bind(p); api.catch = p.catch.bind(p); api.finally = p.finally.bind(p);
            api.done = (cb: (v: T) => any) => { p.then(cb); return api; };
            api.fail = (cb: (e: any) => any) => { p.catch(cb); return api; };
            api.always = (cb: (a: any) => any) => { p.then(cb, cb); return api; };
            api._resolve = (v: T) => resolve(v); api._reject = (e: any) => reject(e);
            return api as DXPromise<T>;
        }
        function dxResolve<T>(val: T) { const d = makeDxPromise<T>(); d._resolve(val); return d; }
        function dxFromPromise<T>(np: Promise<T>) { const d = makeDxPromise<T>(); np.then(d._resolve, d._reject); return d; }

        // Wrap any return into a DX-style promise if needed
        const ensureDx = <T>(x: any) =>
            (x && typeof x.fail === 'function') ? x : dxFromPromise(Promise.resolve(x));



        // sanitize DataSource options to avoid implicit CustomStore creation
        function sanitizeDsOptions(opts: any = {}) {
            const { store, load, byKey, insert, update, remove, totalCount, ...rest } = opts;
            return rest; // keep doing this
        }


        const buildUrlWithParams = (base: string, extra?: Record<string, any>, key?: string | number | null) => {
            const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
            if (key != null) u.pathname += `/${encodeURIComponent(String(key))}`;
            Object.entries(extra || {}).forEach(([k, v]) => {
                if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
            });
            return u.toString(); // ⬅️ use the absolute URL, not just pathname
        };


        const fakeWrite = async ({ verb, body, key, config }: { verb: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: any, key?: string | number | null, config?: ConfigType }) => {
            const target = buildUrlWithParams(urls, params, verb === 'POST' ? null : key);
            const resp = await manageRequest.smartFetch({
                url: target,
                init: {
                    token: readToken(),
                    method: verb,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(headers || {}),
                    },
                    body: verb === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
                },
                config: config,
                tokenOptions: tokenOptions
            });
            const statusCode = resp.status;
            const json = statusCode !== 204 ? await resp.json().catch(() => null) : null;
            if (!resp.ok) return { data: null, statusCode, error: { message: resp.statusText, stack: '', response: json } };
            return { data: json, statusCode, error: null };
        };

        let store: any;

        // build the store ONCE
        if (isFake) {


            if (method === 'GET') {

                store = new ods({
                    url: urls,
                    version: 4,
                    key: keyName,
                    ...(payload.keyType && { keyType: payload.keyType }),
                    beforeSend: (req: any) => {
                        try {
                            if (force) {
                                req.url = urls;
                                req.method = method;
                                req.params = { ...(params || {}) };
                            } else {
                                req.params = { ...(req.params || {}), ...(params || {}) };
                            }
                            const latestToken = readToken()

                            req.headers = {
                                ...(req.headers || {}),
                                ...(headers || {}),
                                ...(latestToken ? { Authorization: `Bearer ${latestToken}` } : {}),
                            };
                            // zero guard for params
                            stripZeroParams(req.params, allowZero, zeroGuardFields);


                            override?.dataSource?.beforeSend?.(req);
                        } catch { }
                    },
                    errorHandler: (err: any) => {
                        const p = parseDxError(err);




                        if (isNotif) isNotif({ type: httpVariant(p.status), message: `${p.message}` });
                        if (p.status === 401) onStore401(err);
                    },
                    ...odsTanstack,
                    ...override?.dataSource,
                });

            } else {

                store = new cs({
                    key: keyName,
                    load: async (loadOptions: any) => {
                        const sp = new URLSearchParams();
                        const s = (loadOptions.sort && loadOptions.sort[0]) || null;
                        if (loadOptions.searchValue) sp.set('q', String(loadOptions.searchValue));
                        if (s?.selector) { sp.set('_sort', String(s.selector)); sp.set('_order', s.desc ? 'desc' : 'asc'); }
                        if (loadOptions.skip != null) sp.set('_start', String(loadOptions.skip));
                        if (loadOptions.take != null) sp.set('_limit', String(loadOptions.take));

                        const resp = await manageRequest.smartFetch(
                            {
                                url: `${urls}${sp.toString() ? `?${sp.toString()}` : ''}`,
                                init: {
                                    token: readToken(),
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(headers || {}),
                                    }
                                },
                                tokenOptions: tokenOptions,
                                config // not used in fake mode, but required by type
                            }

                            //     `${urls}${sp.toString() ? `?${sp.toString()}` : ''}`, {
                            //     headers: { 'Content-Type': 'application/json', ...(headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                            // }

                        );
                        if (!resp.ok) throw new Error(`Load failed: ${resp.status} ${resp.statusText}`);

                        const data = await resp.json();
                        const total = Number(resp.headers.get('X-Total-Count')) || (Array.isArray(data) ? data.length : 0);
                        return { data, totalCount: total };
                    },
                    byKey: (key: string | number) => {
                        if (!isFake) {
                            const origByKey = (store as any).byKey?.bind(store);
                            if (typeof origByKey === 'function') {
                                (store as any).byKey = (key: any, extra?: any) => {
                                    if (!allowZero && isZeroKey(key)) return dxResolve(null);
                                    return ensureDx(origByKey(key, extra)); // usually already DX-promise, but safe
                                };
                            }
                        }

                        // use fetch but convert the native promise to a DX-promise
                        const p = manageRequest.smartFetch({
                            url: `${urls}/${encodeURIComponent(String(key))}`,
                            init: {
                                token: readToken(),
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(headers || {}),
                                }
                            },
                            tokenOptions: tokenOptions,
                            config: config // not used in fake mode, but required by type
                        }

                            //     `${urls}/${encodeURIComponent(String(key))}`, {
                            //     headers: {
                            //         'Content-Type': 'application/json',
                            //         ...(headers || {}),
                            //         ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            //     }
                            // }

                        ).then(resp => {
                            if (!resp.ok) throw new Error(`byKey failed: ${resp.status} ${resp.statusText}`);
                            return resp.json();
                        });

                        return dxFromPromise(p);
                    },

                    //@ts-ignore
                    insert: (values) => fakeWrite({ verb: 'POST', body: values, config }).then(r => { if (r.error) throw r.error; return r.data; }),
                    //@ts-ignore
                    update: (key, values) => fakeWrite({ verb: 'PATCH', body: values, key, config }).then(r => { if (r.error) throw r.error; return r.data; }),
                    //@ts-ignore
                    remove: (key) => fakeWrite({ verb: 'DELETE', key, config }).then(r => { if (r.error) throw r.error; return key; }),
                    ...csTanstack,
                    ...override?.fakeDataSource
                })
            }





            // ------------------ NON-FAKE PATH (REPLACE YOUR WHOLE ELSE { ... } WITH THIS) ------------------
        } else {
            // Always build one ODataStore for READS
            const odsInst = new ods({
                url: urls,
                version: 4,
                key: keyName,
                ...(payload.keyType && { keyType: payload.keyType }),
                beforeSend: (req: any) => {

                    const latestToken = readToken()

                    try {
                        if (force) {
                            req.url = urls;
                            req.method = method;
                            req.params = { ...(params || {}) };
                        } else {
                            req.params = { ...(req.params || {}), ...(params || {}) };
                        }
                        req.headers = {
                            ...(req.headers || {}),
                            ...(headers || {}),
                            ...(latestToken ? { Authorization: `Bearer ${latestToken}` } : {}),
                        };
                        stripZeroParams(req.params, allowZero, zeroGuardFields);
                        override?.dataSource?.beforeSend?.(req);
                        // What actually went out — the load override below re-uses the compiled
                        // $filter (search + filters, exactly as the page query had them).
                        lastSent = { params: { ...(req.params || {}) }, headers: { ...(req.headers || {}) } };
                    } catch { }
                },
                errorHandler: (err: any) => {
                    const p = parseDxError(err);
                    if (isNotif) isNotif({ type: httpVariant(p.status), message: `${p.message}` });
                    if (p.status === 401) onStore401(err);
                },
                ...odsTanstack,
                ...override?.dataSource
            });

            /**
             * Supply the total ourselves when the server ignores $count=true.
             *
             * DevExtreme's DataSource needs extra.totalCount from a requireTotalCount load; an
             * endpoint that answers without @odata.count makes it fall back to store.totalCount()
             * — a second request, and on such an endpoint the same query again (it ignores that
             * $count too), so paging cost the whole table twice. So: run the load as usual; if
             * the total is missing, work it out with the cheapest thing the server honours (see
             * resolveTotal) — with the SAME $filter the load went out with, captured in
             * beforeSend — and resolve (data, { totalCount }), so DevExtreme never reaches its
             * fallback. If nothing works, resolve as received and let it.
             */
            let lastSent: { params: Record<string, any>; headers: Record<string, any> } | null = null
            const origStoreLoad: (o?: LoadOptions) => any = odsInst.load.bind(odsInst)
            ;(odsInst as any).load = (loadOptions?: LoadOptions) => {
                lastSent = null
                const inner = origStoreLoad(loadOptions as any)
                if (!loadOptions?.requireTotalCount) return inner

                const sent = lastSent as { params: Record<string, any>; headers: Record<string, any> } | null
                const d = Deferred<any>()
                inner
                    .done((data: any, extra: any) => {
                        if (extra && Number.isFinite(Number(extra.totalCount))) {
                            d.resolve(data, extra)
                            return
                        }
                        resolveTotal(urls, keyName, sent)
                            .then((n) => d.resolve(data, n == null ? extra : { ...(extra || {}), totalCount: n }))
                            .catch(() => d.resolve(data, extra))
                    })
                    .fail((err: any) => d.reject(err))
                return d.promise()
            }

            if (source?.OdataService) {

                const OdataService = mapOdataService({ url: url, services: source?.OdataService })


                if (method === 'GET') {
                    // ✅ FIX: define a store for GET + OdataService
                    store = odsInst;
                }


                if (method !== 'GET' && OdataService) {
                    // Hybrid write path: READS → odsInst, WRITES → odata2ts/httpClient
                    const parsed = parseODataUrl(urls)!;

                    const createHttpClient = () => {
                        const latestToken = readToken()

                        return new FetchClient({
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                ...(headers || {}),
                                ...(latestToken ? { Authorization: `Bearer ${latestToken}` } : {}),
                            },
                            ...(params || {}),
                        })
                    }


                    const createOdataServiceClient = () => {
                        const httpClient = createHttpClient()
                        const svc = new OdataService.Service(httpClient, parsed.root)

                        const callIfMethod = (x: any) => (typeof x === 'function' ? x.call(svc) : x)

                        let entityApi: any =
                            callIfMethod(OdataService?.EntityAccessor?.(svc)) ||
                            callIfMethod((svc as any)[String(parsed.entitySet)]) ||
                            callIfMethod((svc as any)[`DTO_${parsed.entitySet}`]) ||
                            null

                        if (!entityApi) {
                            for (const k of Object.keys(svc)) {
                                const fn = (svc as any)[k]

                                if (typeof fn === 'function') {
                                    const api = fn.call(svc)

                                    if (api?.entity && (api?.post || api?.query)) {
                                        entityApi = api
                                        break
                                    }
                                }
                            }
                        }

                        return { httpClient, svc, entityApi }
                    }

                    // === BATCH SHORT-CIRCUIT (array writes in one $batch) ===
                    // === BATCH SHORT-CIRCUIT (mixed add/edit) ===
                    if (Array.isArray(payload.data) && payload.useBatch && !isFake) {
                        const rows = payload.data as any[];
                        const keyName = payload.keyName || 'Id';
                        const preferPut = method === 'PUT';
                        const keySeg = (k: any) => buildKeySegment(k);

                        const ops = rows.map((row, i) => {
                            const key = pickKeyForRow(row, i, { keyName, keyValue: payload.keyValue as any[] | undefined });
                            if (isInsertKey(key)) {
                                return {
                                    method: 'POST' as const,
                                    url: parsed.canonicalSetUrl,
                                    body: stripKeyOnInsert(row, keyName),
                                };
                            }
                            return {
                                method: (preferPut ? 'PUT' : 'PATCH'),
                                url: `${parsed.canonicalSetUrl}${keySeg(key)}`,
                                body: row,
                            };
                        });
                        //@ts-ignore
                        const r = await odataBatchWrite({
                            client: createHttpClient(),
                            root: parsed.root,
                            //@ts-ignore

                            ops,
                        });

                        return { data: r as T, statusCode: 200, error: null, dataSource: null };
                    }


                    // const svc = new OdataService.Service(httpClient, parsed.root);

                    // // Resolve entity accessor (keep your logic)
                    // const callIfMethod = (x: any) => (typeof x === 'function' ? x.call(svc) : x);
                    // let entityApi: any =
                    //     callIfMethod(OdataService?.EntityAccessor?.(svc)) ||
                    //     callIfMethod((svc as any)[String(parsed.entitySet)]) ||
                    //     callIfMethod((svc as any)[`DTO_${parsed.entitySet}`]) ||
                    //     null;

                    // if (!entityApi) {
                    //     for (const k of Object.keys(svc)) {
                    //         const fn = (svc as any)[k];
                    //         if (typeof fn === 'function') {
                    //             const api = fn.call(svc);
                    //             if (api?.entity && (api?.post || api?.query)) { entityApi = api; break; }
                    //         }
                    //     }
                    // }


                    store = new cs({
                        key: keyName,
                        ...csTanstack,

                        load: (lo: any) => odsInst.load(lo),
                        byKey: (k: any) => odsInst.byKey(k),

                        insert: async (values: any) => {
                            try {
                                return await retryFetchClientOnce(async () => {
                                    const { httpClient, entityApi } = createOdataServiceClient()

                                    if (entityApi?.post) {
                                        const created = await entityApi.post(values)
                                        return created ?? values
                                    }

                                    return await httpClient.post(String(parsed.canonicalSetUrl), values)
                                }, config, tokenOptions)
                            } catch (e) {
                                throw adaptFetchClientErrorToDx(e)
                            }
                        },

                        update: async (id: any, values: any) => {
                            try {
                                return await retryFetchClientOnce(async () => {
                                    const { httpClient, entityApi } = createOdataServiceClient()
                                    const keySeg = buildKeySegment(id)

                                    if (method === 'PUT') {
                                        return entityApi?.entity?.call
                                            ? (await entityApi.entity(id).put(values)) ?? values
                                            : await httpClient.put(`${parsed.canonicalSetUrl}${keySeg}`, values)
                                    }

                                    return entityApi?.entity?.call
                                        ? (await entityApi.entity(id).patch(values)) ?? values
                                        : await httpClient.patch(`${parsed.canonicalSetUrl}${keySeg}`, values)
                                }, config, tokenOptions)
                            } catch (e) {
                                throw adaptFetchClientErrorToDx(e)
                            }
                        },

                        remove: async (id: any) => {
                            try {
                                return await retryFetchClientOnce(async () => {
                                    const { httpClient, entityApi } = createOdataServiceClient()
                                    const keySeg = buildKeySegment(id)

                                    return entityApi?.entity?.call
                                        ? (await entityApi.entity(id).delete()) ?? id
                                        : await httpClient.delete(`${parsed.canonicalSetUrl}${keySeg}`)
                                }, config, tokenOptions)
                            } catch (e) {
                                throw adaptFetchClientErrorToDx(e)
                            }
                        },
                    });
                }
            } else {
                // No odata2ts service → plain ODataStore
                store = odsInst;
            }
        }

        // The dedupe identity of this store’s reads, and it has to describe the
        // REQUEST. Keying on `urls` alone meant every source over one endpoint
        // shared a key: `/DTO_BudgetAlokasiList` grouped by `PostBudget/ParentName`
        // and the same endpoint grouped by `PostBudget/Nama` are two different
        // queries, but `$apply` lives in `params`, which is not in the url and not
        // in `loadOptions` either. Whichever loaded first won and the second
        // `.load()` was handed its in-flight promise — one request on the wire, two
        // consumers, and the loser silently rendering the winner’s rows.
        //
        // `inflightStore` is a module-level singleton shared by every store in the
        // app, so this was never scoped to one grid or one page.
        manageRequest.patchDxStore(
            store,
            override?.dataSource
                ? `${urls}::${nextStoreId()}`
                : `${urls}?${paramsIdentity(params)}::${stable(headers)}::${method}${force ? '::force' : ''}`,
            "share",
        );

        applyByKeyGuardAndCache(store, { allowZero, cache });

        // build DS with the *injected* constructor, not the imported one
        dataSource = new ds({
            ...sanitizeDsOptions(options),
            store, // instance, not config
        });

        // Keep DevExtreme's objects OUT of Vue's reactivity graph. Consumers hold these in
        // `ref()`s and pinia stores, which would wrap them in a deep reactive proxy: every
        // internal DevExtreme mutation (`_loadingCount`, `_items`, …) then becomes a Vue
        // `set` that triggers watchers — and in a dev build pinia deep-watches every store's
        // `$state` synchronously for the devtools, so one DataSource event walked the whole
        // store (fifteen DataSources and their item arrays) and a single checkbox tick cost
        // over a second. `markRaw` makes `reactive()` return them untouched and `traverse`
        // skip them.
        markRaw(store as object)
        markRaw(dataSource as object)

        // const origLoadSingle = (dataSource as any).loadSingle?.bind(dataSource);
        // if (typeof origLoadSingle === 'function') {
        //     (dataSource as any).loadSingle = (prop: any, value: any, select?: any) => {
        //         // value may be 0, '0', { Id: 0 }, or composite
        //         if (!allowZero && isZeroKey(value)) return dxResolve(null);
        //         return ensureDx(origLoadSingle(prop, value, select));
        //     };
        // }

        const origLoadSingle = (dataSource as any).loadSingle;
        if (typeof origLoadSingle === 'function') {
            (dataSource as any).loadSingle = function (prop: any, value: any, select?: any) {
                if (!allowZero && isZeroKey(value)) return dxResolve(null);
                const res = origLoadSingle.call(this, prop, value, select);
                return ensureDx(res);
            };
        }

        // Optional: quick sanity log
        // const used = (dataSource as any).store();
        // console.log('Store used:', used?.constructor?.name, 'byKey is fn:', typeof used?.byKey === 'function');

        // --- writes ---
        let result: any;

        if (method !== 'GET') {


            // ⬇️ FAKE batch fast-path (json-server friendly)
            if (isFake && Array.isArray(payload.data) && payload.useBatch) {
                const rows = payload.data as any[];
                const keyName = payload.keyName || 'Id';
                const preferPut = method === 'PUT';

                const results = await Promise.allSettled(
                    rows.map(async (row, i) => {
                        const key = pickKeyForRow(row, i, { keyName, keyValue: payload.keyValue as any[] | undefined });
                        if (isInsertKey(key)) {
                            const r = await fakeWrite({ verb: 'POST', body: stripKeyOnInsert(row, keyName), config });
                            if (r.error) throw r.error; return r.data;
                        } else {
                            const r = await fakeWrite({ verb: preferPut ? 'PUT' : 'PATCH', body: row, key, config });
                            if (r.error) throw r.error; return r.data;
                        }
                    })
                );

                return { data: results as T, statusCode: 207, error: null, dataSource: null };
            }


            if (!isFake) {
                const origByKey = (store as any).byKey?.bind(store);
                if (typeof origByKey === 'function') {
                    (store as any).byKey = (key: any, extra?: any) => {
                        if (!allowZero && isZeroKey(key)) return dxResolve(null);
                        return ensureDx(origByKey(key, extra));
                    };
                }

                // Block filter([...0...]).load() too
                const origLoad = (store as any).load?.bind(store);
                if (typeof origLoad === 'function') {
                    store.load = (loadOptions: any) => {
                        if (containsZeroInDxFilter(loadOptions?.filter, allowZero, zeroGuardFields)) {
                            const empty = loadOptions?.requireTotalCount ? { data: [], totalCount: 0 } : [];
                            return dxResolve(empty);
                        }
                        return ensureDx(origLoad(loadOptions));
                    };
                }
            }

            if (isFake) {
                if (method === 'POST') { const r = await fakeWrite({ verb: 'POST', body: payload.data, config }); return { data: r.data as T, statusCode: r.statusCode, error: r.error, dataSource: null }; }
                if (method === 'PUT') { const r = await fakeWrite({ verb: 'PUT', body: payload.data, key: payload.keyValue, config }); return { data: r.data as T, statusCode: r.statusCode, error: r.error, dataSource: null }; }
                if (method === 'PATCH') { const r = await fakeWrite({ verb: 'PATCH', body: payload.data, key: payload.keyValue, config }); return { data: r.data as T, statusCode: r.statusCode, error: r.error, dataSource: null }; }
                if (method === 'DELETE') { const r = await fakeWrite({ verb: 'DELETE', key: payload.keyValue, config }); return { data: r.data as T, statusCode: r.statusCode, error: r.error, dataSource: null }; }
            } else {
                if (method === 'POST') result = await (store as any).insert(payload.data);
                if (method === 'PATCH' || method === 'PUT') result = await (store as any).update(payload.keyValue, payload.data);
                if (method === 'DELETE') result = await (store as any).remove(payload.keyValue);




                if (source?.OdataService) {

                    return { data: result.data, dataSource: null, statusCode: result?.status || (result ? 200 : 500), error: null }
                }

                return { data: result as T, statusCode: 200, error: null, dataSource: null };
            }
        }

        // --- reads ---
        if (method === 'GET') {
            if (type === 'data' || type === 'fakedata') {
                // Now safe to use DataSource.load() (options are sanitized).
                const usedToken = readToken();
                try {
                    result = await dataSource.load();
                } catch (err: any) {
                    let p = parseDxError(err);
                    let failure = err;

                    // ODataStore path only: the fake CustomStore went through authFetch, which already
                    // retried once behind a refresh. The store's errorHandler has started this refresh
                    // (it runs before the rejection), so this JOINS it via refreshPromise rather than
                    // firing a second one — and the retry only goes out with a DIFFERENT token.
                    if (type === 'data' && p.status === 401) {
                        const newToken = await refreshTokenOnce({ config, options: tokenOptions });

                        if (newToken && newToken !== usedToken) {
                            try {
                                result = await dataSource.load();
                                return { dataSource, data: result as T, statusCode: 200, error: null };
                            } catch (err2: any) {
                                p = parseDxError(err2);
                                failure = err2;
                            }
                        }
                    }

                    if (isNotif) {
                        isNotif?.({ type: httpVariant(p.status), message: `${p.message}` });
                    }

                    return { data: null, dataSource, statusCode: p.status ?? 500, error: { message: p.message, stack: String(failure?.stack ?? ''), response: p.body } };
                }
            }

            return { dataSource, data: result as T, statusCode: 200, error: null };
        }


        return { data: result as T, statusCode: 200, error: null, dataSource: null };
    } catch (error: any) {
        const p = parseDxError(error);


        const status = p.status ?? Number(error?.status) ?? 500

        if (isNotif) {
            isNotif?.({ type: httpVariant(p.status), message: `${p.message}` });
        }

        return {
            data: null,
            statusCode: status,
            error: { message: p.message, stack: String(error?.stack ?? ''), response: p.body },
            dataSource: null
        };
    }
};


export type FetchOverrides = Omit<Partial<OdataFetchTypes>, 'url' | 'type' | 'options'> & {
    options?: Omit<Partial<NonNullable<OdataFetchTypes['options']>>, 'key'>;
};

export function createFetcher<T>(base: OdataFetchTypes) {
    const build = (option?: FetchOverrides): OdataFetchTypes => {
        const { options: optOverrides, ...rest } = option ?? {};
        return {
            ...base,
            ...rest,                 // force, cache, beforeSend, dll.
            url: base.url,           // lock url
            type: base.type ?? 'datasource',
            options: {
                ...(base.options ?? {}),
                ...(optOverrides ?? {}),
                key: (base.options as any)?.key ?? 'Id', // lock key
            },
        };
    };

    return {
        // inline: createFetcher(...).response({ option: { ... } })
        response(option?: FetchOverrides) {
            return useFetchOData<T>(build(option));
        },
    };
}


export type OdataFetchUniqueTypes<T> = {
    unique: keyof T & string,
} & OdataFetchTypes



export const createUniqueFetcher = async <T extends any>(opt: OdataFetchUniqueTypes<T>) => {
    const keyField = String(opt.options?.key ?? 'Id');
    const api = (params: Record<string, any>) =>
        useFetchOData<any>({
            ...opt,
            url: opt.url,
            type: 'data',
            params,
            options: { key: keyField, paginate: false },
        });

    // ---- Fast path (fully backward compatible) ----
    const { data: picks = [] } = await api({
        $apply: `groupby((${opt.unique}), aggregate(${keyField} with max as PickId))`,
        $orderby: `${opt.unique} asc`,
    });
    const ids = picks.length > 0 ? (picks ?? []).map((p: any) => p.PickId).filter(Boolean) : [];
    return await useFetchOData<T>({
        ...opt,
        params: { ...(opt.params || {}), $filter: `${keyField} in (${ids.join(',')})` },
    });
}


export async function useNormalFetch<T>(url: string, options: NormalFetchOptions, config?: ConfigType): Promise<NormalFetchResult<T>> {
    let response: Response | null = null
    const {
        //  isJSONString, safeJSONParse, extractErrorMessage, 
        notif } = useHelper();

    const isNotif = typeof options?.notif === 'boolean' && options.notif === true ? notif : options?.notif;

    try {

        const {
            token,
            tokenOptions,
            ...fetchOptions
        } = options

        // proactively refresh the (refresh) token before the request goes out
        const freshToken = await ensureFreshToken({ token, config, tokenOptions }) ?? undefined

        response = await manageRequest.smartFetch({
            url: (options?.baseUrl) + url,
            init: {
                ...fetchOptions,
                token: freshToken,
                headers: {
                    ...options?.headers,
                    'Content-Type': 'application/json',
                }
            },
            tokenOptions,
            config,
        });

        if (!response.ok) {
            if (response.status === 401) {
                // No refresh attempt here, and none is missing: `ensureFreshToken` ran above and
                // `authFetch` already retried this request once behind a refresh. A 401 that
                // reaches this line has outlived both, which is what `unauthCall` is for.
                callUnauth(options?.unauthCall)

                if (options?.expiredBehaviour === 'refresh' && !options?.unauthCall) {

                    window.location.reload();

                }
            }

            // Defensive parse: a 500 often returns a non-JSON / empty body, so don't trust .json().
            const raw = await response.text();
            let errorResponse: any = null;
            try { errorResponse = raw === '' ? null : JSON.parse(raw); } catch { errorResponse = raw; }

            const errorReturn = extractErrorMessage(errorResponse, response.statusText || 'Terjadi kesalahan!.');

            if (isNotif) isNotif({
                message: errorReturn,
                type: response.status >= 400 && response.status < 500 ? 'warning' : 'error'
            })

            return { message: errorReturn, statusCode: response.status, data: null, all: errorResponse };
        } else {
            const raw = await response.text()
            let responseData: T | null
            try {
                responseData = raw === '' ? null : (JSON.parse(raw) as T);
            } catch {
                responseData = raw as T;
            }
            return {
                //@ts-ignore
                data: responseData?.data,
                statusCode: response.status,
                //@ts-ignore
                message: responseData?.message || null,
                //@ts-ignore
                all: responseData
            };
        }
    } catch (error: any) {

        const sttsCode = Number(response?.status) >= 400 && Number(response?.status) < 500 ? 'warning' : 'error'
        const msg = extractErrorMessage(error, response?.statusText || 'Tejadi kesalahan!.')
        if (isNotif) isNotif({ message: msg, type: sttsCode })

        return { message: msg, statusCode: 500, data: null, all: null };
    }
}

export interface TryCatchDatasourceParams<T> {
    tryCallback: () => Promise<T> | T;
    catchCallback?: (error: any, parsed: ReturnType<typeof parseDxError>) => Promise<T> | T;
    finallyCallback?: () => Promise<any> | any;
    notif?: OdataFetchTypes['notif']
}

export async function tryCatchDatasource<T>({
    tryCallback,
    catchCallback,
    finallyCallback,
    notif
}: TryCatchDatasourceParams<T>): Promise<T> {
    const helper = window.helper || useHelper();

    const isNotif = typeof notif === 'boolean' && notif === true ? helper.notif : notif;

    try {
        return await tryCallback();
    } catch (error: any) {
        const p = parseDxError(error);

        // notif berdasarkan status (pakai httpVariant yang kamu punya)
        if (isNotif) isNotif({
            type: httpVariant(p.status),
            message: p.message,
        });

        // optional: hook tambahan (mis. handle 401)
        if (catchCallback) return await catchCallback(error, p);

        // kalau kamu mau defaultnya lempar lagi:
        throw error;
    } finally {
        await finallyCallback?.();
    }
}




export type LoadChunkStoreArgs<T> = {
    datasource: DataSource<T>;
    options: LoadOptions<T>;
    limit?: number;
    maxRows?: number;
    concurrency?: number;
};

function normalizeLoadResult<T>(res: any): { rows: T[]; totalCount?: number } {
    // DevExtreme store.load() can return:
    // - T[]
    // - { data: T[], totalCount: number, ... }
    // - { data: T[] }
    const rows: T[] = Array.isArray(res) ? res : (res?.data ?? []);
    const totalCount =
        Array.isArray(res) ? undefined : (typeof res?.totalCount === "number" ? res.totalCount : undefined);
    return { rows, totalCount };
}

async function promisePool<T, R>(
    items: T[],
    worker: (item: T, idx: number) => Promise<R>,
    concurrency = 4
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let i = 0;

    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (i < items.length) {
            const idx = i++;
            results[idx] = await worker(items[idx], idx);
        }
    });

    await Promise.all(runners);
    return results;
}

export async function loadChuckStore<T>({
    datasource,
    options,
    limit = 100,
    maxRows = Infinity,
    concurrency = 1,
}: LoadChunkStoreArgs<T>): Promise<T[]> {
    const store = datasource.store();

    // 1) first page (+totalCount)
    const firstRes = await store.load({
        ...options,
        take: limit,
        skip: 0,
        requireTotalCount: true,
    });


    const { rows: firstRows, totalCount } = normalizeLoadResult<T>(firstRes);

    // ✅ IMPORTANT: If first page already "last page" or reached maxRows, STOP (no 2nd request)
    if (firstRows.length === 0) return [];
    if (firstRows.length < limit) {
        return firstRows.slice(0, maxRows);
    }
    if (firstRows.length >= maxRows) {
        return firstRows.slice(0, maxRows);
    }

    const outMax = Math.min(
        maxRows,
        Number.isFinite(totalCount as any) ? (totalCount as number) : Infinity
    );

    // If no totalCount OR no parallel desired => sequential paging
    if (!Number.isFinite(totalCount as any) || concurrency <= 1) {
        const out: T[] = [...firstRows];
        let skip = firstRows.length;

        while (out.length < outMax) {
            const take = Math.min(limit, outMax - out.length);


            const secoundRes = await store.load({ ...options, take, skip });

            const { rows } = normalizeLoadResult<T>(secoundRes);

            out.push(...rows);

            if (rows.length < take) break;      // last page
            if (rows.length === 0) break;       // safety

            // ✅ correct skip increment
            skip += rows.length;
        }

        return out;
    }

    // 2) parallel remaining pages (totalCount known)
    const total = Math.min(totalCount as number, outMax);
    const totalPages = Math.ceil(total / limit);

    // pages 2..N (pageNo 1 means skip=limit)
    const pages = Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 1);

    const pageResults = await promisePool(
        pages,
        async (pageNo) => {
            const skip = pageNo * limit;
            const take = Math.min(limit, total - skip);
            if (take <= 0) return [] as T[];

            const res = await store.load({ ...options, take, skip });
            return normalizeLoadResult<T>(res).rows;
        },
        concurrency
    );

    return [firstRows, ...pageResults].flat();
}


type AwaitedMap<T extends Record<string, Promise<any>>> = {
    [K in keyof T]: Awaited<T[K]>
}

type SettledMap<T extends Record<string, Promise<any>>> = {
    values: Partial<AwaitedMap<T>>
    errors: Partial<Record<keyof T, unknown>>
}

type AllMap<T extends Record<string, Promise<any>>> = {
    values: AwaitedMap<T>
    errors: {} // empty if it returns; if something fails, it throws
}

export async function promiseWrapper<
    T extends Record<string, Promise<any>>,
    Mode extends 'all' | 'allSettled' = 'allSettled',
>({
    task,
    type = 'allSettled' as Mode,
}: {
    task: T
    type?: Mode
}): Promise<Mode extends 'all' ? AllMap<T> : SettledMap<T>> {
    const entries = Object.entries(task) as [keyof T, T[keyof T]][]

    if (type === 'all') {
        // fail-fast (throws if any promise rejects)
        const pairs = await Promise.all(
            entries.map(async ([key, p]) => [key, await p] as const),
        )

        const values = Object.fromEntries(pairs) as AwaitedMap<T>

        return { values, errors: {} } as any
    }

    // allSettled but keep the key even when rejected
    const results = await Promise.all(
        entries.map(([key, p]) =>
            p
                .then((value) => ({ key, ok: true as const, value }))
                .catch((reason) => ({ key, ok: false as const, reason })),
        ),
    )

    const values: Partial<AwaitedMap<T>> = {}
    const errors: Partial<Record<keyof T, unknown>> = {}

    for (const r of results) {
        if (r.ok) values[r.key] = r.value
        else errors[r.key] = r.reason
    }

    return { values, errors } as any
}

