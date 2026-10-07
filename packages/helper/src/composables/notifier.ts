/** A subscriber callback. */
export type MonoNotifyFn = () => void

export interface MonoNotifier {
  /** Register a subscriber; returns its unsubscribe handle. */
  subscribe(cb: MonoNotifyFn): () => void
  /** Schedule a coalesced notification. */
  notify(): void
  /** Drop every subscriber (controller `dispose`). */
  clear(): void
  /** How many subscribers are attached — handy for tests / diagnostics. */
  readonly size: number
}

export interface MonoNotifierOptions {
  /**
   * Runs immediately before the subscribers, inside the same flush. Use it to
   * recompute derived state that subscribers are about to read (e.g. the grid
   * refreshes its merged element props and writes its `state` snapshot here).
   */
  onFlush?: () => void
  /** Names the controller in the runaway-loop error (`'form'`, `'grid'` …). */
  name?: string
  /** Extra context for that error — e.g. the form keys that notified last. Called only on a trip. */
  detail?: () => string
}

/**
 * Flushes allowed back-to-back without the event loop getting a turn. Real work never comes close:
 * notifies in one tick coalesce into ONE flush, and a chain of awaited watchers adds a handful. A
 * count in the hundreds is a feedback loop — a subscriber (a Vue `watch` on the `state` ref, a
 * `subscribe` callback) writing back into the controller on every flush — and as microtasks it
 * starves rendering, input and timers: the tab freezes with no error at all.
 */
export const MONO_NOTIFY_RUNAWAY_LIMIT = 200

/**
 * The coalesced notifier every mono controller uses.
 *
 * Notifications are queued on a microtask and de-duplicated, so several state
 * changes in one tick produce a single callback. That coalescing is not a
 * nicety: a synchronous subscriber that re-renders the consumer's Vue tree would
 * reenter an in-flight patch and corrupt the DOM. When `queueMicrotask` is
 * unavailable (older SSR runtimes) it degrades to a synchronous flush.
 *
 * This was copy-pasted into `monoDataGrid`, `monoDataDropdown`, `monoForm` and
 * `monoChart` — identical logic and, in two of them, identical comments. One
 * implementation means one place to fix if the scheduling ever needs to change.
 */
export function createNotifier(options: MonoNotifierOptions = {}): MonoNotifier {
  const subscribers = new Set<MonoNotifyFn>()
  let queued = false

  // ── runaway breaker ─────────────────────────────────────────────────────────
  // `chain` counts flushes since the event loop last ran a macrotask; a `setTimeout(0)` probe,
  // armed on the first flush of a chain, resets it. Past the limit the notifier stops scheduling,
  // reports ONCE, and delivers one final flush on the probe — so the page stays responsive and the
  // subscribers still end on the latest state.
  let chain = 0
  let probe: ReturnType<typeof setTimeout> | undefined
  let tripped = false
  let pending = false
  /** Reported once per notifier: a loop that keeps going re-trips every task, and one line says it. */
  let reported = false

  function armProbe(): void {
    if (probe !== undefined || typeof setTimeout !== 'function') return
    probe = setTimeout(() => {
      probe = undefined
      chain = 0
      if (tripped) {
        tripped = false
        if (pending) {
          pending = false
          flush()
        }
      }
    }, 0)
  }

  function trip(): void {
    tripped = true
    pending = true
    if (reported) return
    reported = true
    const extra = options.detail ? options.detail() : ''
    console.error(
      `[mono] ${options.name ?? 'controller'} notified ${chain} times without yielding to the event loop — `
        + 'a feedback loop (something writing back into it on every change, e.g. a watch() on its state ref '
        + 'that calls setProp / setValue). Notifications are paused until the next task.'
        + (extra ? ` ${extra}` : ''),
    )
  }

  function flush(): void {
    // No timers (an exotic SSR runtime): nothing can reset the count, so do not keep one.
    if (typeof setTimeout === 'function') {
      chain++
      armProbe()
    }
    if (chain > MONO_NOTIFY_RUNAWAY_LIMIT) {
      if (!tripped) trip()
      pending = true
      return
    }
    options.onFlush?.()
    subscribers.forEach((cb) => cb())
  }

  return {
    subscribe(cb: MonoNotifyFn): () => void {
      subscribers.add(cb)
      return () => subscribers.delete(cb)
    },
    notify(): void {
      if (typeof queueMicrotask !== 'function') {
        flush()
        return
      }
      if (tripped) {
        pending = true
        return
      }
      if (queued) return
      queued = true
      queueMicrotask(() => {
        queued = false
        flush()
      })
    },
    clear(): void {
      subscribers.clear()
    },
    get size(): number {
      return subscribers.size
    },
  }
}
