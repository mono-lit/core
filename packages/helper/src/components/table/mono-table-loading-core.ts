// @unocss-include

import { LitElement, html, isServer, type PropertyValues, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import {
  applyOverlayHost,
  columnCount,
  ensureRowHost,
  overlayHost,
  releaseOverlayHost,
  releaseRowHost,
  type RowHost,
} from './table-overlay.js'
import type { Constructor } from '../../composables/hybird-prop'
import {
  monoApplyPhantomOptions,
  monoPendingActive,
  monoPhantomOptions,
} from '../../composables/mono-skeleton'

/** Geometry of the pending placeholder: column widths (%), row height (px), row count. */
interface SkeletonGeometry {
  cols: number[]
  rowH: number
  rows: number
}

const SKELETON_FALLBACK: SkeletonGeometry = { cols: [25, 25, 25, 25], rowH: 40, rows: 8 }

/** Public surface added by the loading-overlay core mixin. */
export declare class MonoTableLoadingCoreInterface extends MonoTableControllerCoreInterface {
  minDuration: number
  loading: boolean | null
}

/**
 * `loading` is TRI-STATE, so the attribute can say "not set" as well as on / off: no attribute →
 * `null` (automatic, follow the controller); `loading` / `loading="true"` → `true`;
 * `loading="false"` → `false`. Never reflected — the element's own state is `data-mono-loading`.
 */
const loadingConverter = {
  fromAttribute(value: string | null): boolean | null {
    if (value === null) return null
    return String(value).trim().toLowerCase() !== 'false'
  },
}

/**
 * `MonoTableLoadingCore` — render-mode-agnostic logic for `mono-table-loading`, a
 * drop-in spinner overlay shown over the table whenever the bound controller is
 * fetching (sort / search / paging / reload / save). Place it in the
 * `.mono-table-scroll` wrapper, or inside the `<table>` wrapped in a `<caption>`
 * (a bare custom-element child of `<table>` is invalid HTML — see the tag doc),
 * and bind the controller with `:data-grid.prop` — no `v-show` wiring.
 *
 * It reads `dataGrid.loading` **synchronously on every controller notify** (not in
 * an async render) so it can't miss a fast query whose `loading` flips back before
 * Lit re-renders, and holds the overlay for a small minimum duration
 * (`min-duration`, default 350ms) so the feedback is always perceptible. The
 * overlay itself is toggled by an imperative `data-loading` attribute + CSS — the
 * element never needs to re-render for the state to flip.
 *
 * "Just works" details, applied to the nearest overlay host — the enclosing
 * `.mono-table-scroll` if present, else the `<table>`:
 *  - makes it a positioning context (`position: relative`) so the absolute overlay
 *    covers it (the consumer adds nothing);
 *  - holds the grid's height while active, so a source that momentarily clears its rows
 *    mid-query can't collapse it to a thin strip. The hold goes on the nearest BLOCK box (the
 *    scroll wrapper, else the table's parent) — never on the `<table>`, which would distribute
 *    the height over its rows and stretch the header instead of reserving space.
 *
 * MANUAL mode: set `loading` (`:loading="isBusy"`) and the element follows THAT instead of the
 * controller — for a busy state the controller can't see (several requests, a save in a store,
 * a page with no controller at all). `true` shows, `false` hides, whatever the controller says;
 * `null` / `undefined` (or no attribute) hands it back to the controller. `min-duration` holds
 * for both sources.
 *
 * SSR-safe: all DOM/timer work is guarded behind `isServer`.
 */
export const MonoTableLoadingCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableLoadingCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { loading } })`. */
    protected override _propsSlot = 'loading' as const

    /**
     * Automatic skeleton (`pending`, composables/mono-skeleton.ts): this element draws its
     * OWN placeholder — a phantom-ui block of N rows mirroring the header — instead of the
     * generic wrapper (a spinner has nothing worth measuring). Pending for the controller's
     * FIRST load (`monoPendingAuto = 'data'` is inherited), then the spinner takes over for
     * every later reload. See `_renderSkeleton` / `_applyPending`.
     */
    static monoPendingMode = 'custom' as const

    /** Overrides the helpers' `'css'`: the host must not paint over the phantom rows it draws. */
    static monoPendingDraw = 'phantom' as const

    /** Whether the pending placeholder is currently applied (mirrors `monoPendingActive`). */
    private _pendingOn = false

    /**
     * Measured geometry of the placeholder (see `_measureSkeleton`). A plain field, refreshed
     * in `update()` right before the render reads it — not reactive state, which would have
     * to be written from `updated()` and schedule a second cycle every pass.
     */
    private _skeleton: SkeletonGeometry = SKELETON_FALLBACK

    /**
     * Minimum time (ms) to keep the overlay up once shown, so a fast query still
     * flashes a perceptible spinner. `0` disables the hold (pure reactive —
     * instant queries then show nothing). `min-duration="500"`.
     */
    @property({ type: Number, attribute: 'min-duration' })
    minDuration = 350

    /**
     * Manual control. `null` (the default) = automatic: shown while the bound controller is
     * fetching. `true` / `false` = shown / hidden by the consumer, the controller ignored.
     * `:loading="isBusy"` in Vue; `undefined` / `null` returns to automatic.
     */
    @property({ attribute: 'loading', converter: loadingConverter })
    loading: boolean | null = null

    private _visible = false
    private _shownAt = 0
    private _hideTimer?: ReturnType<typeof setTimeout>

    private _attrObserver?: MutationObserver

    /** The `<tr>` this element lives in — generated by it, or adopted from the consumer. */
    private _rowHost?: RowHost

    override connectedCallback(): void {
      super.connectedCallback()
      if (!isServer) this._rowHost = ensureRowHost(this, 'mono-table-loading-row')
      if (!isServer) this._watchAttr()
      // Reflect a load already in flight when we mount / (re)bind.
      if (!isServer) this._sync()
    }

    override disconnectedCallback(): void {
      if (this._hideTimer) clearTimeout(this._hideTimer)
      this._hideTimer = undefined
      this._attrObserver?.disconnect()
      this._attrObserver = undefined
      // Give back the height hold and the header offset. The size host is the
      // consumer's own element and outlives this one, so anything left on it is
      // a gap under their header with nothing left on the page to explain it.
      releaseOverlayHost(this)
      releaseRowHost(this, this._rowHost)
      this._rowHost = undefined
      super.disconnectedCallback()
    }

    /**
     * Honour a `data-loading` a CONSUMER sets, instead of fighting it.
     *
     * The attribute is documented as the CSS key, so a consumer whose busy state is wider than
     * one controller — a filter that runs several requests, a store flag held across a save —
     * reasonably drives it directly: `:data-loading="isBusy || null"`. Without this the two
     * sources stomp each other: the element's own `_apply(false)` REMOVES an attribute the
     * consumer set (their overlay vanishes mid-work, and their framework will not re-set an
     * attribute it still believes is there), and an externally set one runs NONE of the work
     * below — no height freeze, no measured header offset — because that hangs off the
     * controller's `loading`, not off the attribute.
     *
     * So the two sources are kept STRICTLY apart. `data-loading` belongs to the consumer and this
     * element never writes it; its own state goes on `data-mono-loading`, and the stylesheet shows
     * the overlay for either. Nothing has to work out who wrote what — which is the only version of
     * this that can be correct, because a MutationObserver callback is a MICROTASK: a
     * "`_writing` = true while I write" flag is already back to false by the time the callback
     * runs, so the element reads its OWN write as the consumer's and latches on forever.
     */
    private _watchAttr(): void {
      // Recompute from the DOM — never cached, so there is no stale copy to get out of step.
      this._attrObserver = new MutationObserver(() => this._apply())
      this._attrObserver.observe(this, { attributes: true, attributeFilter: ['data-loading'] })

      this._apply()
    }

    /** Re-read state on every notify (chains the base subscribe re-bind). */
    protected override _subscribe(): void {
      this._off?.()
      this._off = this.dataGrid?.subscribe(() => {
        this._sync()
        // The spinner is attribute-driven and needs no render, but the pending placeholder
        // is resolved in the update cycle — a notify may be the "first load done" it waits for.
        if (monoPendingActive(this)) this.requestUpdate()
      })
      if (!isServer) this._sync()
    }

    /**
     * Runs synchronously on every controller notify. Latches the overlay ON the
     * instant `loading` is observed true (defeating the async-render race) and
     * defers hiding until at least `minDuration` has elapsed.
     */
    private _sync(): void {
      if (isServer) return
      // While the pending placeholder is up it owns the overlay: the spinner latch waits.
      // Whatever is in flight is re-read by `_applyPending(false)` when it releases.
      if (monoPendingActive(this)) {
        if (this._hideTimer) clearTimeout(this._hideTimer)
        this._hideTimer = undefined
        return
      }
      // Manual `loading` wins; `null` / `undefined` defers to the controller.
      const loading = this.loading != null ? !!this.loading : !!this.dataGrid?.loading
      if (loading) {
        if (this._hideTimer) {
          clearTimeout(this._hideTimer)
          this._hideTimer = undefined
        }
        if (!this._visible) {
          this._visible = true
          this._shownAt = Date.now()
          this._apply()
        }
      } else if (this._visible && !this._hideTimer) {
        const wait = Math.max(0, this.minDuration - (Date.now() - this._shownAt))
        this._hideTimer = setTimeout(() => {
          this._hideTimer = undefined
          this._visible = false
          // Not necessarily off: the consumer may still be holding it up with its own flag,
          // which `_apply` reads for itself.
          this._apply()
        }, wait)
      }
    }

    /**
     * Reflect visibility + hold/release the height, from BOTH sources.
     *
     * Writes only `data-mono-loading`, this element's own state. `data-loading` is the
     * consumer's to set and is read here, never written — see `_watchAttr`.
     */
    private _apply(): void {
      // The pending placeholder owns the host while it is up — no spinner, and no touching
      // the reservation it holds (`applyOverlayHost(…, false)` would release it).
      if (monoPendingActive(this)) {
        this.toggleAttribute('data-mono-loading', false)
        this.setAttribute('aria-hidden', 'false')
        return
      }

      const on = this._visible || this.hasAttribute('data-loading')

      this.toggleAttribute('data-mono-loading', this._visible)
      this.setAttribute('aria-hidden', on ? 'false' : 'true')

      // `'measure'`: this overlay appears over a grid that is ABOUT to lose its
      // rows, so the height worth holding is the one it still has.
      applyOverlayHost(this, on, {
        headVar: '--mono-table-loading-head',
        holdVar: '--mono-table-hold-loading',
        hold: 'measure',
      })
    }

    /** A manual `loading` change runs the same latch / min-duration path as a controller notify. */
    protected override updated(changed: PropertyValues): void {
      super.updated(changed)
      // `monoPendingActive` is only ever true in a browser, so this needs no server guard.
      const pending = monoPendingActive(this)
      if (pending !== this._pendingOn) {
        this._pendingOn = pending
        this._applyPending(pending)
      } else if (pending) {
        // Still pending: re-reserve with the geometry this pass measured (DOM writes only).
        this._holdPending()
      }
      if (changed.has('loading') && this.isConnected) this._sync()
    }

    /**
     * Measure the placeholder geometry right before the render that draws it. `update()` runs
     * after every `willUpdate` — including the skeleton mixin's, which is where `pending` is
     * resolved for this pass — and before `render()`, so the template sees fresh numbers
     * without a second update cycle.
     */
    protected override update(changed: PropertyValues): void {
      if (monoPendingActive(this)) this._measureSkeleton()
      super.update(changed)
    }

    /** Enter / leave the pending placeholder. */
    private _applyPending(on: boolean): void {
      if (on) {
        this.toggleAttribute('data-mono-pending', true)
        this._apply() // drops a spinner `connectedCallback` may already have latched
        this._holdPending()
        return
      }
      this.removeAttribute('data-mono-pending')
      releaseOverlayHost(this)
      // The first load is in: do NOT let the spinner flash its min-duration behind the
      // placeholder that just left. Reset the latch, then re-read whatever is in flight
      // now (a manual `loading`, a second request) through the normal path.
      if (this._hideTimer) clearTimeout(this._hideTimer)
      this._hideTimer = undefined
      this._visible = false
      this._apply()
      this._sync()
    }

    /**
     * Reserve header + N rows on the size host (the spinner's own slot, so the two never
     * hold at once) and push the resolved phantom options onto the placeholder.
     */
    /** Rows to draw: a configured phantom `count` (element / tag / global) wins over the page size. */
    private _skeletonRows(): number {
      const count = Number(monoPhantomOptions(this).count)
      return Number.isFinite(count) && count > 0 ? Math.round(count) : this._skeleton.rows
    }

    private _holdPending(): void {
      const { rowH } = this._skeleton
      const rows = this._skeletonRows()
      applyOverlayHost(this, true, {
        headVar: '--mono-table-loading-head',
        holdVar: '--mono-table-hold-loading',
        // Function form: evaluated after the header offset has been published.
        hold: () => {
          const host = overlayHost(this)
          const head = host
            ? parseFloat(host.style.getPropertyValue('--mono-table-loading-head')) || 0
            : 0
          return `${head + rows * rowH}px`
        },
        measureHead: 'always',
      })
      monoApplyPhantomOptions(this, this.renderRoot.querySelector('phantom-ui[mono-skeleton]'))
    }

    /**
     * Mirror the header: one placeholder cell per `<th>`, at the header's column widths
     * (as percentages, so a resize needs no re-measure), rows as tall as a header row,
     * as many rows as the page size (capped — a "show all" page falls back to 8).
     * Cheap: N `offsetWidth` reads while pending. Every branch has a fallback, so a
     * header that has not laid out yet still gets an equal split.
     */
    private _measureSkeleton(): void {
      const table = this.closest('table')
      const grid = this.dataGrid
      let cols: number[] = SKELETON_FALLBACK.cols
      let rowH = SKELETON_FALLBACK.rowH

      if (table) {
        const ths = Array.from(table.querySelectorAll<HTMLElement>(':scope > thead th'))
        const total = table.clientWidth
        const widths = ths.map((th) => th.offsetWidth)
        const sum = widths.reduce((a, b) => a + b, 0)
        if (total > 0 && sum > 0) {
          cols = widths.map((w) => Math.max(2, Math.round((w / total) * 1000) / 10))
        } else {
          const n = columnCount(table) || grid?.props?.().th?.length || SKELETON_FALLBACK.cols.length
          const each = Math.round((100 / n) * 10) / 10
          cols = Array.from({ length: n }, () => each)
        }
        const first = ths[0]?.offsetHeight ?? 0
        if (first > 0) rowH = first
      }

      const size = grid?.pageSize ?? 0
      const rows = grid && !grid.pageSizeAll && size > 0 && size <= 50 ? size : SKELETON_FALLBACK.rows

      const prev = this._skeleton
      if (
        prev.rowH !== rowH ||
        prev.rows !== rows ||
        prev.cols.length !== cols.length ||
        prev.cols.some((c, i) => c !== cols[i])
      ) {
        this._skeleton = { cols, rowH, rows }
      }
    }

    /** The pending placeholder: one measured row, repeated by phantom's `count`. */
    private _renderSkeleton(): TemplateResult {
      const { cols, rowH } = this._skeleton
      const rows = this._skeletonRows()
      return html`
        <div
          class="mono-table-skeleton" mono-table-skeleton
          style="padding-top: var(--mono-table-loading-head, 0px)"
        >
          <phantom-ui mono-skeleton loading count=${rows} count-gap="0" loading-label="Loading rows">
            <div class="mono-table-skeleton-row" mono-table-skeleton-row style=${`height:${rowH}px`}>
              ${cols.map(
                (pct) => html`<span
                  class="mono-table-skeleton-cell" mono-table-skeleton-cell
                  style=${`width:${pct}%`}
                ><span class="mono-table-skeleton-bar" mono-table-skeleton-bar data-shimmer-no-children></span></span>`,
              )}
            </div>
          </phantom-ui>
        </div>
      `
    }

    protected override render(): TemplateResult {
      if (monoPendingActive(this)) return this._renderSkeleton()
      return html`<span
        class="mono-table-spinner" mono-loading-spinner
        part="spinner"
        role="status"
        aria-label="Loading"
      ></span>`
    }
  }

  return MonoTableLoadingCoreClass as unknown as Constructor<MonoTableLoadingCoreInterface> & T
}
