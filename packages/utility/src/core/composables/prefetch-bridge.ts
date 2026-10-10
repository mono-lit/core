// The `prefetch` option of monoFetch / monoFetchOdata.
//
// The prefetch host (in a Nuxt app: `@mono-lit/nuxt-pre-fetch` learned requests) installs itself
// here through its runtime plugin. REST calls are reported and answered in `useNormalFetch`;
// OData stores handle it themselves when the data layer supports it (`@mono-lit/data`'s
// `prefetch` store option, flagged `Symbol.for('mono.prefetch')`). Without a host, or with
// plain DevExtreme stores, `prefetch` does nothing.

/** One GET request as reported to the prefetch host. */
export interface MonoPrefetchRequest {
    /** Absolute or app-relative URL (may carry a query string). */
    url: string
    query?: Record<string, unknown>
    /** Non-credential headers only (Authorization / Cookie are dropped). */
    headers?: Record<string, string>
    /** The cookie the Bearer token is read from on the host (`split`: chunked cookie). */
    auth?: { cookie: string, split?: boolean }
}

/** What a prefetch host provides (shape of `useNuxtApp().$nuxtPreFetch`). */
export interface MonoPrefetchBridge {
    /** Synchronous: a prefetched result is available (or arriving) for this request. */
    expects: (method: string, url: string, query?: Record<string, unknown> | null) => boolean
    /** The prefetched result, once (`undefined` = fetch it yourself). */
    take: (method: string, url: string, query?: Record<string, unknown> | null) => Promise<{ data: unknown } | undefined>
    /** Reports a request the page sent (served ones too). */
    learn: (request: MonoPrefetchRequest) => void
}

/** Store classes that implement the `prefetch` option themselves (`@mono-lit/data`). */
export const PREFETCH_SUPPORT = Symbol.for('mono.prefetch')

let bridge: MonoPrefetchBridge | null = null

export function setPrefetchBridge(next: MonoPrefetchBridge | null): void {
    bridge = next
}

export function getPrefetchBridge(): MonoPrefetchBridge | null {
    return bridge
}

const CREDENTIAL_HEADERS = new Set(['authorization', 'cookie', 'set-cookie', 'proxy-authorization', 'x-api-key'])

function safeHeaders(headers: unknown): Record<string, string> | undefined {
    if (!headers || typeof headers !== 'object') return undefined
    const out: Record<string, string> = {}
    for (const [name, value] of Object.entries(headers as Record<string, unknown>)) {
        if (CREDENTIAL_HEADERS.has(name.toLowerCase()) || typeof value !== 'string') continue
        out[name] = value
    }
    return Object.keys(out).length ? out : undefined
}

/** Reports a request (credential headers stripped). A no-op without a bridge. */
export function learnPrefetch(request: MonoPrefetchRequest): void {
    if (!bridge || !request?.url) return
    try {
        const headers = safeHeaders(request.headers)
        bridge.learn({
            url: request.url,
            ...(request.query && Object.keys(request.query).length ? { query: { ...request.query } } : {}),
            ...(headers ? { headers } : {}),
            ...(request.auth ? { auth: request.auth } : {}),
        })
    } catch {
        // reporting is best effort, never a reason for a request to fail
    }
}

/**
 * Describing a call on a server (`.prefetch()` twins): where the store's first load goes
 * instead of the network. `auth` is the cookie the browser's Bearer lives in.
 */
export interface MonoPrefetchCapture {
    emit: (request: MonoPrefetchRequest) => void
    auth?: MonoPrefetchRequest['auth']
    /** Describe ONE `store.load(load)` instead of the call's own first load (`.prefetchLoad()`). */
    load?: Record<string, unknown>
}

/**
 * A per-store `@mono-lit/data` prefetch provider that captures the store's first load exactly as
 * it would be sent, and answers it with an empty result (nothing is fetched here).
 */
export function captureProvider(emit: MonoPrefetchCapture['emit']) {
    return {
        learn: (request: MonoPrefetchRequest) => emit(request),
        expects: () => true,
        take: async () => ({ data: { 'value': [], '@odata.count': 0 } }),
    }
}

/**
 * Serving plain DevExtreme stores (`@mono-lit/devextreme`), which can't serve by themselves.
 *
 * DevExtreme's OData stores call the store's `beforeSend(request)` and then, synchronously in the
 * same call, open and send ONE XMLHttpRequest for it. So utility's own `beforeSend` arms the
 * request the bridge expects ({@link armPrefetchServe}), and the very next `send()` of a GET to that
 * URL is answered from the prefetched result instead of the network — DevExtreme then parses it
 * exactly like a response (dates, `@odata.count`, `map`). This needs no access to DevExtreme's own
 * modules (in Vite dev the data layer is pre-bundled with its OWN copy of DevExtreme's internals,
 * out of reach of an `ajax.inject` from here). Every other XHR is untouched; a missing result (e.g.
 * it failed on the server) is sent normally — the request was opened but not yet sent.
 */
let armed: { url: string, query?: Record<string, unknown> | null, bridge: MonoPrefetchBridge } | null = null
const opened = new WeakMap<object, { method: string, url: string }>()
let xhrPatched = false

function patchXhr(): boolean {
    if (xhrPatched) return true
    const Xhr = (globalThis as any).XMLHttpRequest
    const proto = Xhr?.prototype
    if (!proto || typeof proto.open !== 'function' || typeof proto.send !== 'function') return false
    xhrPatched = true
    const { open, send, abort } = proto
    proto.open = function (this: any, method: string, url: string | URL, ...rest: any[]) {
        opened.set(this, { method: String(method).toUpperCase(), url: String(url) })
        return open.call(this, method, url, ...rest)
    }
    proto.send = function (this: any, body?: any) {
        const request = opened.get(this)
        const hit = armed
        armed = null
        if (!hit || request?.method !== 'GET' || !request.url.startsWith(hit.url)) return send.call(this, body)

        const xhr = this
        let aborted = false
        xhr.abort = function () {
            aborted = true
            return abort.call(xhr)
        }
        const passThrough = () => {
            if (!aborted) send.call(xhr, body)
        }
        hit.bridge.take('GET', hit.url, hit.query).then((result) => {
            if (aborted) return
            if (!result) return passThrough()
            const text = JSON.stringify(result.data)
            for (const [name, value] of Object.entries({ readyState: 4, status: 200, statusText: 'OK', responseText: text, response: text, responseURL: request.url })) {
                Object.defineProperty(xhr, name, { configurable: true, value })
            }
            xhr.onreadystatechange?.(new Event('readystatechange'))
            xhr.onload?.(new Event('load'))
            xhr.onloadend?.(new Event('loadend'))
        }, passThrough)
    }
    return true
}

/**
 * Called from a plain DevExtreme store's `beforeSend` with the final request: when the bridge has a
 * result for this GET, the XHR DevExtreme sends right after is answered from it. Returns whether
 * it was armed.
 */
export function armPrefetchServe(url: string, query?: Record<string, unknown> | null): boolean {
    armed = null
    const current = bridge
    if (!current || typeof url !== 'string' || !url) return false
    try {
        if (!current.expects('GET', url, query) || !patchXhr()) return false
    } catch {
        return false
    }
    armed = { url, query, bridge: current }
    // DevExtreme sends in the same tick; never let a stale arm catch a later request.
    queueMicrotask(() => { if (armed?.url === url) armed = null })
    return true
}
