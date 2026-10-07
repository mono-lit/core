// Nuxt's `useState()` for a plain Vue/Vite host.
//
// A synced Nuxt remote (`.mono/apps/<app>`) freely calls `useState('key', () => …)`,
// which Nuxt auto-imports. A Vue/Vite host has no such global, so the call throws
// `useState is not defined` at runtime. This is the SAME composable, minus the
// Nuxt payload: a keyed ref registry, so every caller of a given key shares one
// ref, and a keyless call is just `ref(init())`.
//
// Wired automatically by the `monoNuxtStateToRef()` Vite plugin (part of
// `monoVue()` / `monoRepo().nuxt().hostResolver()`), which injects the import into
// the remote files that use it. Can also be imported explicitly, or fed to
// `unplugin-auto-import`'s `imports` so host code shares the same registry.
//
// NOTE: the registry is module-scoped — correct for a browser SPA (one registry
// per page load), NOT request-isolated. Nuxt's own `useState` (payload-backed, per
// request) keeps serving the Nuxt side; this shim is only ever pulled in by the
// Vite-host transform.

import { isRef, ref, type Ref } from 'vue'

/** key -> the one ref every caller of that key shares. */
const states = new Map<string, Ref<any>>()

/**
 * Shared, keyed reactive state — the Vue/Vite stand-in for Nuxt's `useState`.
 *
 *   const count = useState('count', () => 0)   // shared by key
 *   const local = useState(() => 'hello')      // plain ref('hello')
 *
 * Differences from Nuxt's: no SSR payload (nothing to hydrate in a SPA), and a
 * missing/empty key is tolerated instead of throwing — Nuxt's build-time auto-key
 * transform never ran on this code, so `useState('', () => 'hello')` can only mean
 * "an unshared `ref('hello')`".
 *
 * `init` runs ONLY the first time a key is seen (as in Nuxt); later callers get
 * the existing ref untouched, even if their `init` differs. Returning a ref from
 * `init` adopts that ref rather than nesting it.
 */
export function useState<T = any>(init?: (() => T | Ref<T>) | T): Ref<T>
export function useState<T = any>(key: string, init?: (() => T | Ref<T>) | T): Ref<T>
export function useState<T = any>(
  keyOrInit?: string | ((() => T | Ref<T>) | T),
  maybeInit?: (() => T | Ref<T>) | T,
): Ref<T> {
  const key = typeof keyOrInit === 'string' ? keyOrInit : undefined
  const init = key === undefined ? (keyOrInit as (() => T | Ref<T>) | T) : maybeInit

  // No usable key -> nothing to share BY, so hand back a private ref. Keying an
  // empty string instead would silently join every keyless call in the app into
  // one piece of state.
  if (!key) return createState(init)

  const existing = states.get(key)
  if (existing) return existing as Ref<T>

  const state = createState(init)
  states.set(key, state)
  return state
}

/** Explicit alias — for hosts that don't want the bare Nuxt name in scope. */
export const monoUseState = useState

function createState<T>(init?: (() => T | Ref<T>) | T): Ref<T> {
  const value = typeof init === 'function' ? (init as () => T | Ref<T>)() : init
  return (isRef(value) ? value : ref(value)) as Ref<T>
}

/**
 * Drop keyed state so the next `useState(key, init)` re-runs `init` (Nuxt's
 * `clearNuxtState`). No argument clears everything; a predicate filters by key.
 *
 * Only the registry entry goes — refs already handed out keep working, they're
 * just no longer what that key resolves to.
 */
export function clearNuxtState(
  keys?: string | string[] | ((key: string) => boolean),
): void {
  if (keys === undefined) {
    states.clear()
    return
  }
  if (typeof keys === 'function') {
    for (const key of [...states.keys()]) if (keys(key)) states.delete(key)
    return
  }
  for (const key of Array.isArray(keys) ? keys : [keys]) states.delete(key)
}

/** The live keyed refs — for devtools/debugging, not app logic. */
export function nuxtStateKeys(): string[] {
  return [...states.keys()]
}
