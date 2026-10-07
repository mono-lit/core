/* =========================================================================
   Chip strip scroller
   -------------------------------------------------------------------------
   Drives the ONE-LINE chip strip used by `chip.behaviour: 'inline'` in
   `mono-tag-input` and `mono-dropdown-table`.

   The strip is `overflow-x: hidden`, NOT `auto`. A hidden overflow still
   honours a programmatic `scrollLeft`, so that single declaration gives the
   whole contract for free: no scrollbar is painted, and the wheel, a
   click-drag and the arrow keys all leave the strip where it is. The only way
   to move it is `page()`, called by the field's `‹` / `›` buttons.

   That is the opposite of `mono-table-search`'s chips strip, which is
   `overflow-x: auto` plus pointer handlers for drag-to-scroll. The geometry
   guard here is the same idea; the input handling is deliberately absent.

   This controller owns measurement and scrolling only. Each host renders its
   own buttons, with its own class names and icons.

   COST MODEL — this is the part that bit. Measuring reads `scrollWidth` /
   `clientWidth`, which forces a synchronous layout, and publishing the result
   means `requestUpdate()`. Doing either on every render made every field on
   the page pay for a feature most of them do not use, and scheduling an update
   from `hostUpdated()` is what Lit's `change-in-update` warning reports. So:

     - `enabled()` gates EVERYTHING. A `flex`-mode field does no work at all,
       not even a `querySelector`.
     - measuring is event-driven — a `ResizeObserver` for width, and the host
       calling `invalidate()` when the chips actually changed. There is no
       per-render measurement.
     - `page()` / `scrollToEnd()` measure inline, because they just moved the
       strip themselves and already know the target.
   ========================================================================= */

import type { ReactiveController, ReactiveControllerHost } from 'lit'

/** Slack (px) absorbing sub-pixel layout noise in the overflow comparisons. */
const EPSILON = 1

export interface ChipStripOptions {
  /** The scrolling strip, or `null` when the host is not rendering one. */
  strip: () => HTMLElement | null
  /**
   * Whether inline behaviour is active. False means the host renders no strip,
   * so the controller stays completely inert — no observer, no queries, no
   * layout reads. This is what keeps `flex` mode free.
   */
  enabled: () => boolean
}

export class ChipStripController implements ReactiveController {
  private readonly host: ReactiveControllerHost
  private readonly opts: ChipStripOptions

  private _canScrollStart = false
  private _canScrollEnd = false
  private _observer: ResizeObserver | null = null
  /** The element the observer is attached to, so a re-render can re-target it. */
  private _observed: HTMLElement | null = null

  constructor(host: ReactiveControllerHost, opts: ChipStripOptions) {
    this.host = host
    this.opts = opts
    host.addController(this)
  }

  /** True once the strip is scrolled away from its start — render `‹`. */
  get canScrollStart(): boolean {
    return this._canScrollStart
  }

  /** True while content remains past the right edge — render `›`. */
  get canScrollEnd(): boolean {
    return this._canScrollEnd
  }

  /** True when either button should show — i.e. the chips overflow the strip. */
  get overflowing(): boolean {
    return this._canScrollStart || this._canScrollEnd
  }

  // --- lifecycle -----------------------------------------------------------

  hostConnected(): void {
    if (this.opts.enabled()) this._attach()
  }

  hostDisconnected(): void {
    this._teardown()
  }

  /**
   * Only re-target the observer — deliberately does NOT measure. Measuring here
   * would force a layout on every render of every host, and its `requestUpdate`
   * would schedule an update from inside `updated()`. `invalidate()` and the
   * ResizeObserver cover the cases that can actually change the answer.
   */
  hostUpdated(): void {
    if (!this.opts.enabled()) {
      // Switched out of inline mode (or lost its value) — stop observing and
      // drop the flags, so stale buttons cannot survive the switch.
      if (this._observed) {
        this._teardown()
        this._publish(false, false)
      }
      return
    }
    this._attach()
  }

  // --- measurement ---------------------------------------------------------

  /**
   * Re-measure because the CONTENT changed — a chip added, removed or relabelled.
   * The host calls this from `updated()` when such state actually changed, which
   * is far rarer than "every update".
   */
  invalidate(): void {
    this.sync()
  }

  /**
   * Recompute both flags from the live geometry and re-render only when one
   * actually flipped.
   */
  sync(): void {
    if (!this.opts.enabled()) return

    const strip = this.opts.strip()
    let start = false
    let end = false

    if (strip) {
      const max = strip.scrollWidth - strip.clientWidth
      // Under jsdom every geometry read is 0, so `max` is 0 and both flags stay
      // false — no buttons, which is the right answer for a zero-width strip.
      if (max > EPSILON) {
        start = strip.scrollLeft > EPSILON
        end = strip.scrollLeft < max - EPSILON
      }
    }

    this._publish(start, end)
  }

  // --- scrolling -----------------------------------------------------------

  /**
   * Scroll one "page" toward `dir`, aligned to a chip boundary so a chip is
   * never left half-cut at the leading edge.
   *
   * Forward: the first chip whose right edge passes the visible right edge
   * becomes the new leftmost chip. Backward: the chip that would end at the
   * current left edge becomes the new leftmost chip. If no chip qualifies
   * (one chip wider than the strip), fall back to a plain viewport-width step
   * so the button is never a no-op.
   */
  page(dir: -1 | 1): void {
    const strip = this.opts.strip()
    if (!strip) return

    const max = strip.scrollWidth - strip.clientWidth
    if (max <= EPSILON) return

    const viewLeft = strip.scrollLeft
    const viewRight = viewLeft + strip.clientWidth

    // Offsets in the strip's own SCROLL coordinates. `offsetLeft` is not usable
    // here: it is measured from the nearest positioned ancestor, which is the
    // field wrapper rather than the strip, so it carries the wrapper's padding
    // and every element before the strip as a constant error. Rect deltas are
    // origin-correct however the ancestors happen to be positioned.
    const stripLeft = strip.getBoundingClientRect().left
    const chips = (Array.from(strip.children) as HTMLElement[]).map((chip) => {
      const rect = chip.getBoundingClientRect()
      const left = rect.left - stripLeft + viewLeft
      return { left, right: left + rect.width }
    })

    let target: number | null = null

    if (dir === 1) {
      for (const chip of chips) {
        if (chip.right > viewRight + EPSILON) {
          target = chip.left
          break
        }
      }
    } else {
      for (let i = chips.length - 1; i >= 0; i--) {
        if (chips[i].left < viewLeft - EPSILON) {
          // Land this chip at the RIGHT edge, so the page steps back by a
          // strip-width rather than jumping to a single chip.
          target = chips[i].right - strip.clientWidth
          break
        }
      }
    }

    if (target === null) target = viewLeft + dir * strip.clientWidth

    this._scrollTo(strip, target, max)
  }

  /** Pin the strip to its end — used after a chip is added, to reveal it. */
  scrollToEnd(): void {
    const strip = this.opts.strip()
    if (!strip) return
    const max = strip.scrollWidth - strip.clientWidth
    this._scrollTo(strip, max, max)
  }

  // --- internals -----------------------------------------------------------

  /**
   * Move the strip and republish from the CLAMPED TARGET rather than by reading
   * `scrollLeft` back.
   *
   * Scrolling is instant (no `scroll-behavior: smooth`), so the read would agree
   * — but not reading avoids a second forced layout, and more importantly the
   * strip's scroll events are expensive well beyond this controller: the shared
   * popup controller listens for `scroll` on `window` in the CAPTURE phase, so
   * every scroll event the strip emits repositions any open dropdown, forcing a
   * layout and a `getComputedStyle` ancestor walk. One event per click is the
   * budget; a smooth animation's ~30 was what made the page crawl.
   */
  private _scrollTo(strip: HTMLElement, target: number, max: number): void {
    const clamped = Math.max(0, Math.min(max, target))
    strip.scrollLeft = clamped

    if (max <= EPSILON) {
      this._publish(false, false)
      return
    }
    this._publish(clamped > EPSILON, clamped < max - EPSILON)
  }

  /**
   * Store the flags and re-render only on a real change.
   *
   * The request is deferred a microtask: `invalidate()` / `scrollToEnd()` are
   * called from the host's `updated()` (a chip landed, a preset value arrived),
   * and a synchronous `requestUpdate()` there is Lit's change-in-update warning
   * on every such edge. The flags are already stored, so the deferred render
   * reads the same answer — it just doesn't get scheduled from inside the
   * render that asked for it.
   */
  private _publish(start: boolean, end: boolean): void {
    if (start === this._canScrollStart && end === this._canScrollEnd) return
    this._canScrollStart = start
    this._canScrollEnd = end
    if (typeof queueMicrotask === 'function') queueMicrotask(() => this.host.requestUpdate())
    else this.host.requestUpdate()
  }

  /**
   * Observe the strip so the buttons re-evaluate when the FIELD is resized —
   * a window resize changes `clientWidth` without any render or scroll event.
   *
   * Only the strip is observed, not the chips: a chip add/remove always comes
   * with a host render, and the host calls `invalidate()` for those.
   */
  private _attach(): void {
    const strip = this.opts.strip()
    if (strip === this._observed) return

    this._observer?.disconnect()
    this._observed = strip
    if (!strip) return
    if (typeof ResizeObserver === 'undefined') return

    this._observer ??= new ResizeObserver(() => this.sync())
    this._observer.observe(strip)
  }

  private _teardown(): void {
    this._observer?.disconnect()
    this._observer = null
    this._observed = null
  }
}
