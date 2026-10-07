// src/nuxt/ssr-cookie.ts — OPTIONAL unstorage cookie driver.
//
// The primary cookie/token/jwt utils are the synchronous isomorphic ones in
// `src/composables/universal.ts` (monoCookie/monoToken/monoJwt). This file is the
// opt-in async alternative for callers who want a unstorage `Storage` over cookies
// (e.g. to share an unstorage abstraction). unstorage ships a localStorage driver
// but NO cookie driver, so we author one here that bridges:
//   - server: h3 request/response cookies
//   - client: document.cookie
//
// Note: unstorage is async-only, so this cannot satisfy the synchronous
// `monoCookie().get()` API — use the universal utils for that.

import { createStorage, defineDriver, type Driver, type Storage } from 'unstorage'
import {
  getCookie,
  setCookie,
  deleteCookie,
  parseCookies,
  type H3Event,
} from 'h3'

const isClient = () => typeof document !== 'undefined'

// --- document.cookie helpers (client fallback) -------------------------------

function clientReadCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '='
  for (const c of document.cookie.split(';').map((s) => s.trim())) {
    if (c.startsWith(nameEQ)) return decodeURIComponent(c.substring(nameEQ.length))
  }
  return null
}

function clientWriteCookie(name: string, value: string, expires?: Date): void {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    expires ? `expires=${expires.toUTCString()}` : '',
    'path=/',
  ].filter(Boolean)
  document.cookie = parts.join('; ')
}

function clientDeleteCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

function clientCookieKeys(): string[] {
  return document.cookie
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => decodeURIComponent(c.split('=')[0]))
}

// --- Custom unstorage cookie driver ------------------------------------------

export interface MonoCookieDriverOptions {
  /** h3 request event (server). When absent, the driver uses document.cookie (client). */
  event?: H3Event
}

/**
 * Per-request write overlay. On the server, h3 `setCookie` writes to the RESPONSE,
 * so `getCookie` (request) can't see a just-written value within the same render.
 * We mirror writes into an overlay keyed by the request event; `null` = tombstone.
 */
const serverOverlay = new WeakMap<object, Map<string, string | null>>()

function overlayFor(event: H3Event): Map<string, string | null> {
  let m = serverOverlay.get(event as object)
  if (!m) {
    m = new Map()
    serverOverlay.set(event as object, m)
  }
  return m
}

/**
 * unstorage cookie driver. Values are plain strings; expiry is passed through the
 * transaction options as `{ expires: Date }` on `setItem`.
 */
export const monoCookieDriver = defineDriver((opts: MonoCookieDriverOptions = {}): Driver => {
  const event = opts.event
  const onServer = () => Boolean(event) && !isClient()

  const serverGet = (key: string): string | null => {
    const ov = overlayFor(event!)
    if (ov.has(key)) return ov.get(key) ?? null
    return getCookie(event!, key) ?? null
  }

  return {
    name: 'mono-cookie',
    options: opts,

    hasItem(key) {
      if (onServer()) return serverGet(key) != null
      return isClient() ? clientReadCookie(key) != null : false
    },

    getItem(key) {
      if (onServer()) return serverGet(key)
      return isClient() ? clientReadCookie(key) : null
    },

    setItem(key, value, tOptions) {
      const expires: Date | undefined = (tOptions as any)?.expires
      if (onServer()) {
        setCookie(event!, key, String(value), { path: '/', expires })
        overlayFor(event!).set(key, String(value))
        return
      }
      if (isClient()) clientWriteCookie(key, String(value), expires)
    },

    removeItem(key) {
      if (onServer()) {
        deleteCookie(event!, key, { path: '/' })
        overlayFor(event!).set(key, null)
        return
      }
      if (isClient()) clientDeleteCookie(key)
    },

    getKeys() {
      if (onServer()) {
        const ov = overlayFor(event!)
        const keys = new Set(Object.keys(parseCookies(event!)))
        for (const [k, v] of ov) {
          if (v == null) keys.delete(k)
          else keys.add(k)
        }
        return [...keys]
      }
      return isClient() ? clientCookieKeys() : []
    },

    clear() {
      // no-op: clearing all cookies indiscriminately is unsafe
    },
  }
})

/** A unstorage Storage bound to the cookie driver (server event or client). */
export function monoCookieStorage(event?: H3Event): Storage {
  return createStorage({ driver: monoCookieDriver({ event }) })
}
