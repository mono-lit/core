// rate-limit.ts
//
// Promise-based throttling / debouncing for components, on top of `p-throttle`
// and `p-debounce`. Both libraries wrap an async function and hand back a
// promise, so the promise IS the "busy" window — a component can drive its own
// loading state off it without the consumer wiring anything by hand.
//
// This module owns three things the components shouldn't repeat:
//   1. Config normalization (object form + a plain number shorthand).
//   2. The Lit glue — an attribute converter and a `hasChanged` that
//      shallow-compares, so an inline object prop re-created on every parent
//      render doesn't silently reset the timer (see `rateLimitHasChanged`).
//   3. The wrapper lifecycle — lazy construction, phase reporting, and
//      cancellation via `AbortController`.

import type { ComplexAttributeConverter } from 'lit'

import pThrottle from 'p-throttle'
import pDebounce from 'p-debounce'

/** `p-throttle` options we expose. Mirrors the upstream option names. */
export interface ThrottleConfig {
  /** Maximum number of calls within `interval`. Default 1. */
  limit?: number
  /** Timespan for `limit`, in ms. Default 1000. */
  interval?: number
  /** Throttle each call individually instead of using a window. Default false. */
  strict?: boolean
}

/** `p-debounce` options we expose. Mirrors the upstream option names. */
export interface DebounceConfig {
  /** Milliseconds to wait after the last call. Default 300. */
  wait?: number
  /** Run on the leading edge instead of the trailing edge. Default false. */
  before?: boolean
}

/**
 * What a rate-limit prop accepts: the config object, a bare number shorthand, a
 * numeric/JSON string (the attribute form), or a falsy value meaning "off".
 */
export type RateLimitOption<C> = C | number | string | boolean | null | undefined

export type ResolvedThrottleConfig = Required<ThrottleConfig>
export type ResolvedDebounceConfig = Required<DebounceConfig>

const DEFAULT_THROTTLE: ResolvedThrottleConfig = {
  limit: 1,
  interval: 1000,
  strict: false,
}

const DEFAULT_DEBOUNCE: ResolvedDebounceConfig = {
  wait: 300,
  before: false,
}

/** Parse the attribute form: `"300"` → `300`, `'{"wait":300}'` → object. */
function parseRateLimitValue(value: unknown): unknown {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()

  // A bare boolean attribute (`<mono-button debounce>`) means "use the defaults".
  if (trimmed === '' || trimmed === 'true') return true
  if (trimmed === 'false') return false

  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return undefined
    }
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * Normalize a `throttle` prop. A bare number is the *interval*
 * (`throttle="1000"` → at most one call per second), which is the reading
 * people expect from `throttle={1000}` elsewhere. Returns `null` when
 * throttling is off.
 */
export function normalizeThrottle(
  value: RateLimitOption<ThrottleConfig>,
): ResolvedThrottleConfig | null {
  const parsed = parseRateLimitValue(value)

  if (parsed === undefined || parsed === null || parsed === false) return null
  if (parsed === true) return { ...DEFAULT_THROTTLE }

  if (typeof parsed === 'number') {
    return { ...DEFAULT_THROTTLE, interval: toPositiveNumber(parsed, DEFAULT_THROTTLE.interval) }
  }

  if (typeof parsed !== 'object') return null

  const config = parsed as ThrottleConfig

  return {
    limit: Math.max(1, toPositiveNumber(config.limit, DEFAULT_THROTTLE.limit)),
    interval: toPositiveNumber(config.interval, DEFAULT_THROTTLE.interval),
    strict: Boolean(config.strict),
  }
}

/**
 * Normalize a `debounce` prop. A bare number is the *wait*
 * (`debounce="300"` → 300ms). Returns `null` when debouncing is off.
 */
export function normalizeDebounce(
  value: RateLimitOption<DebounceConfig>,
): ResolvedDebounceConfig | null {
  const parsed = parseRateLimitValue(value)

  if (parsed === undefined || parsed === null || parsed === false) return null
  if (parsed === true) return { ...DEFAULT_DEBOUNCE }

  if (typeof parsed === 'number') {
    return { ...DEFAULT_DEBOUNCE, wait: toPositiveNumber(parsed, DEFAULT_DEBOUNCE.wait) }
  }

  if (typeof parsed !== 'object') return null

  const config = parsed as DebounceConfig

  return {
    wait: toPositiveNumber(config.wait, DEFAULT_DEBOUNCE.wait),
    before: Boolean(config.before),
  }
}

/**
 * Lit `hasChanged` for a rate-limit prop.
 *
 * **This is load-bearing.** In a template, `:throttle.prop="{ limit: 1 }"`
 * allocates a NEW object on every parent re-render. With Lit's default `!==`
 * check the element would see a change each time, rebuild the wrapper, and
 * restart the timer — so on a frequently re-rendering parent a debounced call
 * could be postponed forever and never fire at all. Comparing by value makes a
 * re-created but equivalent config a no-op.
 */
export function rateLimitHasChanged(value: unknown, old: unknown): boolean {
  if (value === old) return false
  if (typeof value !== 'object' || typeof old !== 'object') return true
  if (value === null || old === null) return true

  const next = value as Record<string, unknown>
  const previous = old as Record<string, unknown>
  const keys = new Set([...Object.keys(next), ...Object.keys(previous)])

  for (const key of keys) {
    if (next[key] !== previous[key]) return true
  }

  return false
}

/**
 * Lit attribute converter for a rate-limit prop, so the shorthand attribute
 * forms (`debounce="300"`, `throttle`, `debounce='{"wait":300}'`) work in plain
 * HTML and SSR without a `.prop` binding.
 */
export const rateLimitConverter: ComplexAttributeConverter<unknown> = {
  fromAttribute(value: string | null): unknown {
    if (value === null) return undefined
    return parseRateLimitValue(value)
  },

  toAttribute(value: unknown): string | null {
    if (value === undefined || value === null || value === false) return null
    if (value === true) return ''
    if (typeof value === 'number' || typeof value === 'string') return String(value)
    return JSON.stringify(value)
  },
}

/**
 * Lifecycle of a call through a limiter. `pending` covers the wait — the
 * debounce timer or the throttle queue — and `running` covers the actual
 * execution. Consumers typically paint a spinner for both but only block
 * interaction for `running`, otherwise the first click locks the control and
 * there is no burst left to collapse.
 */
export type RateLimitPhase = 'pending' | 'running' | 'idle'

export interface RateLimiter {
  /** Put a call through the limiter. Never rejects on cancellation. */
  call(...args: unknown[]): Promise<unknown>
  /** Drop everything pending. The wrapper is rebuilt on the next `call()`. */
  cancel(): void
  /** Cancel and release the wrapper (use on disconnect). */
  dispose(): void
  /** Calls accepted but not yet settled (waiting *or* executing). */
  readonly pending: number
  /** Calls currently executing `run`. */
  readonly running: number
  /** Derived phase, for reporting. */
  readonly phase: RateLimitPhase
  /** Calls waiting in the throttle queue (always 0 for a debouncer). */
  readonly queueSize: number
}

export interface CreateRateLimiterOptions {
  kind: 'throttle' | 'debounce'
  config: ResolvedThrottleConfig | ResolvedDebounceConfig
  /** The work to rate-limit. Its promise defines the `running` phase. */
  run: (...args: unknown[]) => unknown | Promise<unknown>
  /** Called whenever `pending` / `running` change, so the host can re-render. */
  onChange?: () => void
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError'
}

/**
 * Build a limiter around `run`.
 *
 * The wrapper is created lazily on the first `call()`, so nothing schedules a
 * timer at construction time — important for SSR, where a limiter may be
 * constructed but never called.
 *
 * `pending` counts calls that are still *waiting* — not merely unsettled. The
 * distinction matters because a debounced burst collapses N calls into one
 * execution and the losers only settle after it finishes: counting them as
 * waiting would make the limiter report a phantom `pending` tail once the work
 * was already done. So waiting is cleared when an execution starts (all of it
 * for a debounce, one call for a throttle, whose queue really does keep
 * waiting), and force-cleared whenever no call is outstanding at all — an
 * invariant that also covers leading-edge debounces, where a trailing call
 * settles without ever reaching `run`.
 *
 * Cancellation goes through an `AbortController`: both libraries take a
 * `signal` and reject their pending promises when it fires. A signal is
 * one-shot, so `cancel()` also drops the wrapper and the next `call()` rebuilds
 * it with a fresh controller.
 */
export function createRateLimiter(options: CreateRateLimiterOptions): RateLimiter {
  const { kind, config, run, onChange } = options

  let wrapped: ((...args: unknown[]) => Promise<unknown>) | null = null
  let controller: AbortController | null = null
  let disposed = false
  let waiting = 0
  let running = 0
  let outstanding = 0

  const build = (): ((...args: unknown[]) => Promise<unknown>) => {
    controller = new AbortController()
    const signal = controller.signal

    // The inner function marks the transition out of the wait: everything
    // before this point was queued/debounced, everything after is real work.
    const inner = async (...args: unknown[]): Promise<unknown> => {
      // A debounce collapses everything queued into this one execution; a
      // throttle takes one call off its queue and leaves the rest waiting.
      waiting = kind === 'debounce' ? 0 : Math.max(0, waiting - 1)
      running++
      onChange?.()

      try {
        return await run(...args)
      } finally {
        running--
        onChange?.()
      }
    }

    if (kind === 'throttle') {
      const { limit, interval, strict } = config as ResolvedThrottleConfig
      return pThrottle({ limit, interval, strict, signal })(inner) as (
        ...args: unknown[]
      ) => Promise<unknown>
    }

    const { wait, before } = config as ResolvedDebounceConfig
    return pDebounce(inner, wait, { before, signal })
  }

  const teardown = (): void => {
    // Rejects every promise still queued in the wrapper; `call()` swallows those.
    controller?.abort()
    controller = null
    wrapped = null
    waiting = 0
  }

  return {
    async call(...args: unknown[]): Promise<unknown> {
      if (disposed) return undefined

      outstanding++
      waiting++
      onChange?.()

      try {
        wrapped ??= build()
        return await wrapped(...args)
      } catch (error) {
        // A cancelled call is not a failure — it's the caller's own doing.
        if (isAbortError(error)) return undefined
        throw error
      } finally {
        outstanding--
        // Nothing unsettled means nothing can still be waiting. Belt-and-braces
        // against a call that settles without ever reaching `run`.
        if (outstanding === 0) waiting = 0
        onChange?.()
      }
    },

    cancel(): void {
      teardown()
    },

    dispose(): void {
      disposed = true
      teardown()
    },

    get pending(): number {
      return waiting
    },

    get running(): number {
      return running
    },

    get phase(): RateLimitPhase {
      if (running > 0) return 'running'
      return waiting > 0 ? 'pending' : 'idle'
    },

    get queueSize(): number {
      const throttled = wrapped as { queueSize?: number } | null
      return throttled?.queueSize ?? 0
    },
  }
}
