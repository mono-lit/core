import type { MonoConfig } from './create-config'

/**
 * Is `v` a plain object (proto is `Object.prototype` or `null`) — not a class
 * instance, Date, Map, etc. Used by {@link sanitizeForExpose} to decide whether
 * to recurse into an object or drop it.
 */
export function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object') return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/**
 * Deep-clone `value` keeping ONLY JSON-safe leaves: strings, numbers, booleans,
 * null, plain objects and arrays. Everything else is thrown away automatically —
 * functions & class constructors (e.g. `oDataService: DefaultService`, DevExtreme
 * `DataSource`/`ODataStore`/`CustomStore`), class instances, symbols, `undefined`,
 * `bigint`, `Date`, `Map`, `Set`. Cycles and runaway depth are guarded, so it
 * never throws and never leaks non-serialisable values into a client bundle.
 *
 * The single source of truth for the `__MONO_CONFIG_EXPOSE__` global shared by
 * the Vite host (`monoRepo`) and the Nuxt host (`@mono-lit/utility/nuxt`).
 *
 * Exported so a custom `expose` can opt into the same sanitisation:
 *   expose: (c) => sanitizeForExpose({ ...c, extra: customInstance })
 */
export function sanitizeForExpose(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (depth > 10) return undefined
  if (value === null) return null
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return value
  if (t === 'function' || t === 'symbol' || t === 'bigint' || t === 'undefined') return undefined
  if (typeof value !== 'object') return undefined
  if (seen.has(value)) return undefined // cycle guard
  seen.add(value)
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForExpose(v, depth + 1, seen)).filter((v) => v !== undefined)
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const s = sanitizeForExpose(v, depth + 1, seen)
      if (s !== undefined) out[k] = s
    }
    return out
  }
  // Non-plain object (class instance, Date, Map, Set, etc.) → drop.
  return undefined
}

/**
 * Default `__MONO_CONFIG_EXPOSE__` builder: expose EVERYTHING that's JSON-safe.
 *
 * Deep-sanitises the full config so values like `fetching.api.myRest.type`/`url`
 * ship to the client, while non-serialisable values are thrown away automatically
 * — e.g. `fetching.api.myOdata.oDataService` (a class), `fetching.source`'s
 * DevExtreme constructors, and the `extends` thunks. `extends`/`renderFn` are
 * config-time-only, so they're stripped before sanitising to avoid recursing
 * into layers / leaking the render fn.
 */
export function defaultMonoExpose(config: MonoConfig): Record<string, unknown> {
  const { extends: _extends, renderFn: _renderFn, ...rest } = config
  return (sanitizeForExpose(rest) as Record<string, unknown>) ?? {}
}
