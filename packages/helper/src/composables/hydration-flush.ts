import type { ReactiveElement } from 'lit'

export interface FlushSsrHydrationOptions {
  /**
   * Withhold hydration until this returns `true`; polling continues meanwhile.
   *
   * Needed for elements that render a LIST from a property the server also
   * rendered (`:items.prop`): Vue assigns the property asynchronously AFTER
   * connect, so hydrating early makes the client render fewer children than the
   * server's `<!--lit-part-->` markers → "Unhandled shorter than expected
   * iterable" plus a duplicate render. Gate on the client count having caught
   * up with the server count.
   */
  gate?: () => boolean
  /** How many ticks to attempt before giving up (default 30). */
  maxTries?: number
}

/**
 * Force an SSR'd element's first client update to flush.
 *
 * Under `nuxt-ssr-lit` the server-rendered element can stay `hasUpdated: false`
 * with updates disabled even after `<LitWrapper>` removes `defer-hydration` —
 * so `render()` never re-runs and its event handlers never bind. The element is
 * then frozen at whatever the SERVER assumed, while its JS properties keep
 * taking client values: a silent divergence between the rendered DOM and the
 * live props.
 *
 * Poll `requestUpdate()` for a few ticks until the element reports `hasUpdated`.
 * A no-op once the element has hydrated normally.
 *
 * Scheduling races `requestAnimationFrame` against a `setTimeout` backstop:
 * rAF does NOT fire in a hidden, minimized, or fully occluded tab, and relying
 * on it alone leaves the element frozen until the tab is next painted.
 */
export function flushSsrHydration(
  el: ReactiveElement,
  options: FlushSsrHydrationOptions = {},
): void {
  if (typeof window === 'undefined') return

  const { gate, maxTries = 30 } = options

  const schedule = (cb: () => void): void => {
    let fired = false
    const once = (): void => {
      if (fired) return
      fired = true
      cb()
    }
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(once)
    setTimeout(once, 32)
  }

  let tries = 0
  const tick = (): void => {
    if (el.hasUpdated || tries++ > maxTries) return
    if (!gate || gate()) {
      el.removeAttribute('defer-hydration')
      el.requestUpdate()
    }
    schedule(tick)
  }
  schedule(tick)
}
