// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import { booleanStringConverter, numberStringConverter, type Constructor } from '../../composables/hybird-prop'

export type TablePagingType = 'standard' | 'infinity-scroll' | 'virtual-scroll'

/** Public surface added by the paging core mixin. */
export declare class MonoTablePagingCoreInterface extends MonoTableControllerCoreInterface {
  type: TablePagingType
  siblings: number
  simple: boolean
  size?: number
  rowHeight: number
  scrollTarget?: string
  threshold: number
  overscan: number
  prevIcon: string
  nextIcon: string
  protected _renderIcon(direction: 'prev' | 'next'): TemplateResult
}

/** Defaults the shadow build tests against before swapping in its inline SVG. */
export const DEFAULT_PREV_ICON = 'i-mdi-chevron-left'
export const DEFAULT_NEXT_ICON = 'i-mdi-chevron-right'

/**
 * `MonoTablePagingCore` — render-mode-agnostic logic for `mono-table-paging`.
 *
 * - `type="standard"` (default): Prev / numbered / Next buttons wired to
 *   `setPage`. The arrows are ICONS (`prev-icon` / `next-icon`, mdi chevrons by
 *   default) rendered through `_renderIcon`, the same seam `mono-table-detail`
 *   uses — they were text `‹ ›` glyphs, whose ink is a fraction of the em box and
 *   sits off its centre, so they read as tiny and never optically centred next to
 *   the digits. The `…` gap marker stays text: it has no centring problem and no
 *   icon would say it better.
 * - `type="infinity-scroll"`: drives the controller's accumulator — scrolling the
 *   nearest `.mono-table-scroll` container to the end auto-calls `loadNext()`.
 * - `type="virtual-scroll"`: same auto-loading, plus it computes a render window
 *   from `scrollTop`/`rowHeight` and pushes it via `setVirtualWindow()` so the
 *   consumer renders spacer rows + only the visible slice.
 *
 * Flat tables only — the controller refuses scroll modes on a grouped grid.
 */

/** Scroll containers known by structure — every spelling a consumer or the library writes. */
const SCROLL_HOSTS =
  '.mono-table-scroll, [mono-table-scroll], [mono-dd-region="body"], .mono-dropdown-table-region.body'
const DD_PANEL = '[mono-dd-panel], .mono-dropdown-table-panel'
const DD_BODY = '[mono-dd-region="body"], .mono-dropdown-table-region.body'

/**
 * Ancestors in the FLATTENED tree: a slotted node continues at its `<slot>`, and a shadow root's
 * top continues at its host. `closest()` stops at both, which hid the shadow dropdown-table's
 * panel from a pager slotted into it.
 */
function flatAncestors(start: Element): HTMLElement[] {
  const out: HTMLElement[] = []
  let node: Element | null = start
  while (node) {
    const next: Element | null =
      (node.assignedSlot as Element | null) ??
      node.parentElement ??
      ((node.parentNode as ShadowRoot | null)?.host ?? null)
    if (next) out.push(next as HTMLElement)
    node = next
  }
  return out
}

export const MonoTablePagingCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTablePagingCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { paging } })`. */
    protected override _propsSlot = 'paging' as const

    /** Paging mode. */
    @property({ reflect: true })
    type: TablePagingType = 'standard'

    /** Numbered buttons shown around the current page (each side). Default 1. */
    @property({ converter: numberStringConverter })
    siblings = 1

    /** Only Prev / "X / Y" / Next — no numbered buttons. */
    @property({ reflect: true, converter: booleanStringConverter })
    simple = false

    /**
     * Page size (rows per page / scroll chunk). When set it OVERRIDES the bound
     * DataSource's configured `pageSize`; when unset the DataSource's own pageSize
     * is used.
     */
    @property({ attribute: 'size', converter: numberStringConverter })
    size?: number

    /** Fixed row height (px) for the virtual window + spacers. */
    @property({ attribute: 'row-height', converter: numberStringConverter })
    rowHeight = 44

    /** CSS selector of the scroll container; default = nearest `.mono-table-scroll`. */
    @property({ attribute: 'scroll-target' })
    scrollTarget?: string

    /** Px from the end at which the next page auto-loads. */
    @property({ converter: numberStringConverter })
    threshold = 200

    /** Extra rows rendered above/below the virtual window. */
    @property({ converter: numberStringConverter })
    overscan = 6

    /**
     * Icon class for the previous-page arrow (default `i-mdi-chevron-left`).
     *
     * A global utility class, resolved by the consumer's icon tooling — the same
     * contract `mono-table-detail`'s `icon` has. The shadow build inlines an SVG for
     * the defaults instead, since that CSS cannot cross a shadow boundary.
     */
    @property({ attribute: 'prev-icon' })
    prevIcon = DEFAULT_PREV_ICON

    /** Icon class for the next-page arrow (default `i-mdi-chevron-right`). */
    @property({ attribute: 'next-icon' })
    nextIcon = DEFAULT_NEXT_ICON

    private _scrollEl: HTMLElement | null = null
    private _onScrollBound = (): void => this._scheduleScroll()
    private _rafPending = false

    // --- lifecycle -----------------------------------------------------------
    override connectedCallback(): void {
      super.connectedCallback()
      if (!isServer) this._configure()
    }

    override disconnectedCallback(): void {
      this._detachScroll()
      // Return the shared controller to classic paging when this driver leaves — but WITHOUT a
      // reload. This fires on teardown (nobody is left to read the rows) and, far more often, on a
      // MOVE: a dropdown panel is portaled into <body> the first time it opens, which disconnects
      // and reconnects everything inside it. Reloading here cost one request on the way out and a
      // second on the way back in, for rows the grid already had.
      if (this._scrollActive()) void this.dataGrid?.setScrollPaging('off', { reload: false })
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      super.willUpdate(changed) // re-subscribes when dataGrid changes
      if (!isServer && (changed.has('type') || changed.has('dataGrid') || changed.has('size')))
        this._configure()
    }

    /** Also recompute the virtual window whenever the grid notifies (new rows). */
    protected override _subscribe(): void {
      this._off?.()
      this._off = this.dataGrid?.subscribe(() => {
        this.requestUpdate()
        if (this.type === 'virtual-scroll') this._recomputeWindow()
      })
    }

    private _scrollActive(): boolean {
      return this.type === 'infinity-scroll' || this.type === 'virtual-scroll'
    }

    private _modeOf(): 'off' | 'infinity' | 'virtual' {
      return this.type === 'infinity-scroll' ? 'infinity' : this.type === 'virtual-scroll' ? 'virtual' : 'off'
    }

    // --- scroll wiring -------------------------------------------------------
    /** Did THIS element set the grid's preferred page size? */
    private _ownsPageSize = false

    /** Apply mode + page-size override to the grid, sequentially (avoid racing loads). */
    private async _applyGridConfig(grid: NonNullable<typeof this.dataGrid>): Promise<void> {
      await grid.setScrollPaging(this._modeOf())

      // `:size` overrides the DataSource's pageSize. Only touch it when this element actually
      // DECLARES one: `setPreferredPageSize(null)` does not mean "I have no opinion", it means
      // "clear the override" — and the override may belong to someone else. A dropdown-table
      // controller sets its own page size on the shared grid, so a sizeless pager was resetting it
      // to the source default (devextreme's 20) and paying for a reload to do it.
      if (this.size != null && this.size > 0) {
        this._ownsPageSize = true
        await grid.setPreferredPageSize(this.size)
      } else if (this._ownsPageSize) {
        // We set one earlier and the attribute has since been removed — now clearing is ours to do.
        this._ownsPageSize = false
        await grid.setPreferredPageSize(null)
      }
    }

    private _configure(): void {
      this._detachScroll()
      const grid = this.dataGrid
      if (!grid) return
      void this._applyGridConfig(grid)
      if (!this._scrollActive()) return
      this._attachScroll()
    }

    /** Resolve the scroll container and listen to it; the grid config is not touched. */
    private _attachScroll(): void {
      this._scrollEl = this._resolveScrollEl()
      if (!this._scrollEl) {
        // Nothing scrollable YET — the element may be mid-move (a portal, a light-slot placement)
        // with its container's styles not applied. Look once more next frame rather than stay dead.
        if (!this._retryPending && typeof requestAnimationFrame === 'function') {
          this._retryPending = true
          requestAnimationFrame(() => {
            this._retryPending = false
            if (this.isConnected && !this._scrollEl && this._scrollActive()) this._attachScroll()
          })
        }
        return
      }
      this._scrollEl.addEventListener('scroll', this._onScrollBound, { passive: true })
      if (typeof ResizeObserver !== 'undefined') {
        this._ro = new ResizeObserver(this._onScrollBound)
        this._ro.observe(this._scrollEl)
      }
      // Initial pass (fill short viewports / seed the first window).
      this._scheduleScroll()
    }

    private _ro?: ResizeObserver
    private _retryPending = false

    private _detachScroll(): void {
      this._scrollEl?.removeEventListener('scroll', this._onScrollBound)
      this._ro?.disconnect()
      this._ro = undefined
      this._scrollEl = null
    }

    /** The scroll container: explicit `scroll-target`, else nearest `.mono-table-scroll`. */
    private _resolveScrollEl(): HTMLElement | null {
      if (this.scrollTarget) {
        const root = (this.getRootNode?.() ?? document) as ParentNode
        const el = (root.querySelector?.(this.scrollTarget) ??
          document.querySelector(this.scrollTarget)) as HTMLElement | null
        if (el) return el
      }
      // Every walk below follows the FLATTENED tree (a slotted pager → its <slot> → the region in
      // the host's shadow root), so the shadow build's dropdown-table resolves like the light one.
      const ancestors = flatAncestors(this)

      // Known scroll containers, recognised by STRUCTURE (both spellings), not by computed style:
      // a dropdown-table panel's body region is one — and the computed style is not reliable
      // there, the panel being re-homed into the body portal on first open.
      const near = ancestors.find((el) => el.matches(SCROLL_HOSTS))
      if (near) return near
      // A pager in the panel's FOOTER (`slot="footer"`, the documented placement) is a sibling
      // of the body region, not inside it — the panel's own scroller is that body region.
      const panel = ancestors.find((el) => el.matches(DD_PANEL))
      const body = panel
        ? (Array.from(panel.children).find((c) => c.matches(DD_BODY)) as HTMLElement | undefined)
        : undefined
      if (body) return body
      // Fall back to the nearest scrollable ancestor.
      for (const el of ancestors) {
        if (el === document.body) break
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el
      }
      return null
    }

    private _scheduleScroll(): void {
      if (this._rafPending || isServer) return
      this._rafPending = true
      const run = (): void => {
        this._rafPending = false
        this._onScroll()
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run)
      else run()
    }

    private _onScroll(): void {
      const grid = this.dataGrid
      const el = this._scrollEl
      if (!grid || !el) return

      // A container with no layout is not "scrolled to the end" — it has no end. This matters most
      // for a dropdown panel, which is CLOSED (and so measures 0/0/0) for most of its life: the
      // near-end test below then reads `0 - 0 - 0 <= threshold`, true unconditionally, so a hidden
      // panel prefetches page after page until the source runs dry — and does it from inside
      // `connectedCallback`, where the resulting `notify()` reaches subscribers while their
      // framework is still patching the DOM.
      //
      // Nothing is visible, so there is nothing to prefetch. Once the panel opens and has a real
      // box, the ResizeObserver wired in `_configure` runs this again.
      if (el.clientHeight <= 0) return

      if (this.type === 'virtual-scroll') this._recomputeWindow()
      // Load the next page when the viewport bottom nears the loaded end.
      const nearEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= Math.max(0, this.threshold)
      if (nearEnd && grid.hasMore && !grid.loading) void grid.loadNext()
    }

    /** Compute the virtual window from scrollTop + rowHeight and push it to the grid. */
    private _recomputeWindow(): void {
      const grid = this.dataGrid
      const el = this._scrollEl
      if (!grid || !el || this.type !== 'virtual-scroll') return
      const rh = Math.max(1, Number(this.rowHeight) || 44)
      const over = Math.max(0, Math.floor(Number(this.overscan) || 0))
      const loaded = grid.loadedCount
      let start = Math.floor(el.scrollTop / rh) - over
      let end = Math.ceil((el.scrollTop + el.clientHeight) / rh) + over
      start = Math.max(0, start)
      end = Math.min(loaded, Math.max(start, end))
      const padTop = start * rh
      const padBottom = Math.max(0, (loaded - end) * rh)
      grid.setVirtualWindow(start, end, padTop, padBottom)
    }

    // --- standard pager (unchanged) -----------------------------------------
    private _go(pageIndex: number): void {
      void this.dataGrid?.setPage(pageIndex)
    }

    /** Windowed list of 1-based page numbers with 'gap' markers for ellipses. */
    private _pages(current1: number, total: number): Array<number | 'gap'> {
      if (total <= 1) return total === 1 ? [1] : []
      const sib = Math.max(0, Math.floor(Number(this.siblings) || 0))
      const set = new Set<number>([1, total])
      for (let p = current1 - sib; p <= current1 + sib; p++) {
        if (p >= 1 && p <= total) set.add(p)
      }
      const sorted = [...set].sort((a, b) => a - b)
      const out: Array<number | 'gap'> = []
      let prev = 0
      for (const p of sorted) {
        if (p - prev > 1) out.push('gap')
        out.push(p)
        prev = p
      }
      return out
    }

    private _renderScrollStatus(): TemplateResult {
      const grid = this.dataGrid
      const loading = grid?.loading ?? false
      const hasMore = grid?.hasMore ?? false
      return html`
        <div class="mono-table-pg mono-table-pg-scroll" mono-table-paging mono-pg-scroll data-type=${this.type}>
          ${loading
            ? html`<span class="mono-table-pg-el" mono-pg-el>Loading more…</span>`
            : hasMore
              ? html`<button
                  class="mono-table-pgb" mono-pgb
                  ?disabled=${!grid}
                  @click=${() => void this.dataGrid?.loadNext()}
                >
                  Load more
                </button>`
              : html`<span class="mono-table-pg-el" mono-pg-el>— end —</span>`}
        </div>
      `
    }

    /**
     * One arrow — mdi chevron-left / chevron-right, INLINE, in both builds.
     *
     * Deliberately not a `i-mdi-*` utility class by default, which is what
     * `mono-table-detail` does. That class only paints if the CONSUMER's icon tooling
     * generated it, and a bundler scans the app's own sources — not this package under
     * `node_modules`. So a class emitted from here resolves to nothing unless every
     * consumer remembers to safelist it, and the arrows vanish instead of merely
     * looking wrong. An inline SVG owes the consumer nothing.
     *
     * It also fixes the centring these arrows never had: `‹` / `›` are text, so their
     * ink sits wherever the font's metrics put it inside the em box. An SVG's viewBox
     * IS its box, so the chevron is centred by construction.
     *
     * Setting `prev-icon` / `next-icon` opts back into a class — a consumer who names
     * one is telling us their stylesheet has it.
     */
    protected _renderIcon(direction: 'prev' | 'next'): TemplateResult {
      const isPrev = direction === 'prev'
      const icon = isPrev ? this.prevIcon : this.nextIcon
      const custom = isPrev ? icon !== DEFAULT_PREV_ICON : icon !== DEFAULT_NEXT_ICON

      if (custom) {
        return html`<span class="mono-icon ${icon}" aria-hidden="true"></span>`
      }

      return html`
        <svg class="mono-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d=${isPrev
          ? 'M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6l6 6z'
          : 'M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z'}
          />
        </svg>
      `
    }

    protected override render(): TemplateResult | typeof nothing {
      if (this._scrollActive()) return this._renderScrollStatus()

      const grid = this.dataGrid
      const loading = grid?.loading ?? false
      const current = grid?.pageIndex ?? 0
      const count = grid?.pageCount ?? 0
      const atFirst = current <= 0
      const atLast = count > 0 ? current >= count - 1 : true

      return html`
        <div class="mono-table-pg" mono-table-paging>
          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atFirst || loading || !grid}
            @click=${() => this._go(current - 1)}
            aria-label="Previous page"
          >
            ${this._renderIcon('prev')}
          </button>

          ${this.simple
          ? html`<span class="mono-table-pg-el" mono-pg-el>${current + 1} / ${Math.max(1, count)}</span>`
          : this._pages(current + 1, count).map((p) =>
            p === 'gap'
              ? html`<span class="mono-table-pg-el" mono-pg-el>…</span>`
              : html`<button
                      class=${`mono-table-pgb${p === current + 1 ? ' on' : ''}`} mono-pgb ?mono-on=${p === current + 1}
                      ?disabled=${loading}
                      @click=${() => this._go((p as number) - 1)}
                    >
                      ${p}
                    </button>`,
          )}

          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atLast || loading || !grid}
            @click=${() => this._go(current + 1)}
            aria-label="Next page"
          >
            ${this._renderIcon('next')}
          </button>
        </div>
      `
    }
  }

  return MonoTablePagingCoreClass as unknown as Constructor<MonoTablePagingCoreInterface> & T
}
