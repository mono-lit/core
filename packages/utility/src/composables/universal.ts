// src/composables/universal.ts — ISOMORPHIC cookie/token/jwt/storage utils.
//
// One set of names that work the same on the client (document.cookie, e.g. the
// Nuxt client + the `.mono/apps/mono-vue` SPA) AND during Nuxt SSR (the h3 request
// event). Everything stays SYNCHRONOUS so existing consumers
// (`monoCookie().get(name, split)`, route guards, `mono.config.ts`) are unchanged.
//
// The server path reads/writes the h3 event directly via `event.node.req/res`
// (no `h3`/`unstorage` import here) so this module is safe in the client bundle.
// A per-request write overlay makes read-after-write work within a single render
// while still emitting real `Set-Cookie` headers.

import {
  createCookie,
  createToken,
  isJwt,
  decodeJwt,
  useMyFetch,
  useMyCookie,
  useMyToken,
  useMyJwt,
  useMyStorage,
  type CookieStore,
  type CookieParams,
  type CookieTokenParams,
  type JWTPayload,
  type LocalStorageParams,
} from '../token'

/** Minimal shape of an h3/Nuxt request event we rely on (kept loose on purpose). */
export type MonoRequestEvent = any

const isClient = () => typeof document !== 'undefined'

// --- request-scoped event resolution -----------------------------------------

let eventResolver: (() => MonoRequestEvent | undefined) | undefined

/**
 * Wire how the SSR cookie utils find the current request event. Call once from a
 * Nuxt plugin: `setMonoEventResolver(() => useRequestEvent())`. Without it (and
 * without an explicit `event` argument) the server utils degrade to empty reads.
 */
export function setMonoEventResolver(fn: (() => MonoRequestEvent | undefined) | undefined): void {
  eventResolver = fn
}

function resolveEvent(explicit?: MonoRequestEvent): MonoRequestEvent | undefined {
  return explicit ?? eventResolver?.()
}

// --- h3 event cookie store (synchronous) -------------------------------------

/** Per-request write overlay: makes read-after-write work; `null` = tombstone. */
const overlay = new WeakMap<object, Map<string, string | null>>()

function overlayFor(event: object): Map<string, string | null> {
  let m = overlay.get(event)
  if (!m) {
    m = new Map()
    overlay.set(event, m)
  }
  return m
}

function reqHeaderCookie(event: MonoRequestEvent): string {
  return event?.node?.req?.headers?.cookie ?? event?.req?.headers?.cookie ?? ''
}

function parseReqCookies(event: MonoRequestEvent): Record<string, string> {
  const out: Record<string, string> = {}
  const header = reqHeaderCookie(event)
  if (!header) return out
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=')
    if (eq < 0) continue
    const k = decodeURIComponent(pair.slice(0, eq).trim())
    const v = decodeURIComponent(pair.slice(eq + 1).trim())
    if (k) out[k] = v
  }
  return out
}

/** Combined view: request cookies overlaid with this request's writes/tombstones. */
function combinedCookies(event: MonoRequestEvent): Map<string, string> {
  const map = new Map<string, string>(Object.entries(parseReqCookies(event)))
  const ov = overlayFor(event)
  for (const [k, v] of ov) {
    if (v == null) map.delete(k)
    else map.set(k, v)
  }
  return map
}

function serializeCookie(name: string, value: string, expires?: Date): string {
  return [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    expires ? `Expires=${expires.toUTCString()}` : '',
    'Path=/',
  ].filter(Boolean).join('; ')
}

function appendSetCookie(event: MonoRequestEvent, serialized: string): void {
  const res = event?.node?.res ?? event?.res
  if (!res || typeof res.setHeader !== 'function') return
  const prev = res.getHeader?.('set-cookie')
  const arr = prev == null ? [] : Array.isArray(prev) ? prev.slice() : [prev]
  arr.push(serialized)
  res.setHeader('set-cookie', arr)
}

/** A synchronous `CookieStore` backed by the h3 request event (+ overlay). */
function eventCookieStore(event: MonoRequestEvent | undefined): CookieStore {
  if (!event) {
    // No event available (e.g. resolver not wired yet) -> safe empty store.
    return { read: () => null, readAll: () => [], write: () => {}, delete: () => {} }
  }
  return {
    read(name) {
      const ov = overlayFor(event)
      if (ov.has(name)) return ov.get(name) ?? null
      return parseReqCookies(event)[name] ?? null
    },
    readAll() {
      return [...combinedCookies(event)].map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
      )
    },
    write(name, value, expires) {
      appendSetCookie(event, serializeCookie(name, value, expires))
      overlayFor(event).set(name, value)
    },
    delete(name) {
      appendSetCookie(event, serializeCookie(name, '', new Date(0)))
      overlayFor(event).set(name, null)
    },
  }
}

// --- isomorphic public API (same names, client + ssr) ------------------------

/** Cookie util. Client: document.cookie. Server: the h3 request event (sync). */
export function monoCookie(event?: MonoRequestEvent) {
  if (isClient()) return useMyCookie()
  return createCookie(eventCookieStore(resolveEvent(event)))
}

/** Token util. Client: document.cookie. Server: the h3 request event (sync). */
export function monoToken(options?: CookieTokenParams, event?: MonoRequestEvent) {
  if (isClient()) return useMyToken(options)
  return createToken(
    { cookie: monoCookie(event), isJwt, decode: decodeJwt, fetch: useMyFetch },
    options,
  )
}

/** JWT util. `cookieDecode({ cookie })` reads via the isomorphic cookie util. */
export function monoJwt(event?: MonoRequestEvent) {
  if (isClient()) return useMyJwt()

  const cookieDecode = <T extends object>(
    { cookie, token, splitCookie }: { splitCookie?: CookieParams['split']; cookie?: CookieParams['name']; token?: CookieParams['value'] },
  ): JWTPayload<T> | null => {
    if (cookie) {
      const tok = monoCookie(event).get(cookie, Boolean(splitCookie))
      const decoded = decodeJwt<T>(tok)
      if (decoded) return decoded
    }
    return decodeJwt<T>(token)
  }

  return { isJwt, cookieDecode }
}

/** Storage util. Client: localStorage/sessionStorage. Server: safe no-op. */
export function monoStorage(options?: LocalStorageParams) {
  if (isClient()) return useMyStorage(options)
  return {
    get: () => null,
    add: (_: Pick<LocalStorageParams, 'name' | 'value' | 'items'>) => null,
    remove: (_?: LocalStorageParams['name']) => false,
    change: (_: Pick<LocalStorageParams, 'name' | 'value'>) => null,
    pull: (_?: LocalStorageParams['name']) => null,
    redirect: () => {},
  }
}
