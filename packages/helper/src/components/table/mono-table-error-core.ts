// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import { ensureRowHost, releaseRowHost, syncRowSpan, type RowHost } from './table-overlay.js'
import type { MonoErrorBehaviour, MonoTableError } from './mono-data-grid.js'
import type { Constructor } from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

/** `detail` of the `close` event `<mono-table-error>` emits when its × is pressed. */
export interface TableErrorCloseEventDetail {
  /** The text that was showing. */
  message: string
  /** The controller error it stood for, if any. */
  error: MonoTableError | null
}

/** `detail` of the `reload` event `<mono-table-error>` emits when its ↻ is pressed. */
export interface TableErrorReloadEventDetail {
  error: MonoTableError | null
}

export type TableErrorCloseEvent = CustomEvent<TableErrorCloseEventDetail>
export type TableErrorReloadEvent = CustomEvent<TableErrorReloadEventDetail>

/** Events emitted by `<mono-table-error>` (feeds the generated Vue types). */
export interface TableErrorEvents {
  // The plain names — what a template listens to.
  close: TableErrorCloseEvent
  reload: TableErrorReloadEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-close': TableErrorCloseEvent
  mnoClose: TableErrorCloseEvent
  'mno-reload': TableErrorReloadEvent
  mnoReload: TableErrorReloadEvent
}

/** Public surface added by the error-bar core mixin. */
export declare class MonoTableErrorCoreInterface extends MonoTableControllerCoreInterface {
  message: string
  dismissible: boolean
  closeLabel: string
  behaviour: MonoErrorBehaviour
  reload: boolean
  reloadLabel: string
  protected renderIcon(name: 'close' | 'refresh'): TemplateResult
}

/**
 * `MonoTableErrorCore` — render-mode-agnostic logic for `mono-table-error`, the
 * red bar shown under the header when a request fails.
 *
 * Unlike `mono-table-loading` and `mono-table-empty`, which paint OVER the grid,
 * this one is a real row in it, taking up honest height directly below the
 * header the way DevExtreme's error row does. The consumer writes that row —
 * `<tr><td colspan><mono-table-error/></td></tr>` — and the element ADOPTS it
 * (`ensureRowHost`): the row class the padding reset keys on, the zebra-skip
 * marker and a live `colspan` are stamped on, so the hand-written form needs
 * nothing but the two tags. Dropped bare into `<tbody>` it still wraps itself,
 * but that is invalid HTML — Vue warns, and it does not survive SSR — so it is
 * the fallback, not the taught form.
 *
 * **What it shows.** `message` if you set one — an explicit message is an
 * instruction, and it wins for as long as it is set. Otherwise the controller's
 * last caught error (`MonoTableController.error`), whose text comes from the
 * error itself rather than from a hardcoded string.
 *
 * **A failure clears the rows** (`behaviour="clear-list"`, the default): the
 * controller empties `items` when it records the error, so a rejected filter
 * never leaves the previous filter's rows under the bar. `"keep-list"` keeps
 * them. The setting is pushed to the controller (`setErrorBehaviour`), so it
 * holds whether or not this element is the one on screen.
 *
 * **Reload** (`reload`, default `true`): a ↻ beside the × that re-runs the
 * failed query (`table.reload()`). The bar stays until that succeeds.
 *
 * **Dismiss hides THIS element only.** The controller keeps its error, so
 * anything else bound to the same table still agrees that it happened. What
 * comes back is the next *failure*, not the next different message: the element
 * remembers the error object it dismissed, and the controller mints a fresh one
 * per failure, so an identical repeat error re-shows.
 *
 * **It stays in view.** The row is table-wide, and on a table wider than its
 * `.mono-table-scroll` that put the text at the far left and the ✕ / ↻ past the
 * right edge — invisible until you scrolled for them. So the bar inside the row
 * is `position: sticky; left: 0` at exactly the scrollport's width (`100cqw`,
 * the same container-query trick the loading spinner centres with — pure CSS in
 * `table.css`). Vertically it follows the HEADER: under `mono-table-sticky-head`
 * the row's cell is sticky too, `top` = the measured `<thead>` height, which this
 * element publishes as `--mono-table-error-head` on the `<table>` and keeps
 * fresh with a `ResizeObserver` (a banded two-row header, a caption that wraps).
 * A header that scrolls away takes the bar with it — it belongs to those rows.
 *
 * SSR-safe: all DOM work is guarded behind `isServer`.
 */
export const MonoTableErrorCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableErrorCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { error } })`. */
    protected override _propsSlot = 'error' as const

    /**
     * Show this instead of whatever the controller caught.
     *
     * Wins while set, and releases when cleared — so a consumer can put their own
     * wording up without losing the automatic behaviour afterwards. It is also
     * the whole surface when no controller is bound, which makes the element
     * usable as plain presentation behind a `v-if`.
     */
    @property({ type: String })
    message = ''

    /** Offer the `×` at the right edge (default `true`). */
    @property({ type: Boolean })
    dismissible = true

    /** `aria-label` for that button. */
    @property({ type: String, attribute: 'close-label' })
    closeLabel = 'Dismiss'

    /**
     * What a failure does to the rows on screen: `'clear-list'` (default) empties
     * them, `'keep-list'` leaves them. Written through to the controller.
     */
    @property({ reflect: true })
    behaviour: MonoErrorBehaviour = 'clear-list'

    /** Offer the ↻ that re-runs the failed query (default `true`). */
    @property({ type: Boolean })
    reload = true

    /** `aria-label` for that button. */
    @property({ type: String, attribute: 'reload-label' })
    reloadLabel = 'Reload'

    /**
     * The controller error this element has been dismissed for.
     *
     * The OBJECT, not its message: the controller mints a fresh record per
     * failure, so holding the object is what makes "hidden until the next
     * failure" mean the next failure rather than the next different wording.
     */
    @state()
    private _dismissed: MonoTableError | null = null

    /** True once a manually-set `message` has been dismissed. */
    @state()
    private _dismissedMessage = false

    /** The `<tr>` this element lives in — generated by it, or adopted from the consumer. */
    private _rowHost?: RowHost

    /** Watches the `<thead>` while the bar is up, so `--mono-table-error-head` tracks it. */
    private _headObserver?: ResizeObserver
    /** The `<table>` the head offset was last written on — to clear it on the way out. */
    private _headHost?: HTMLElement

    override connectedCallback(): void {
      super.connectedCallback()
      if (isServer) return
      this._rowHost = ensureRowHost(this, 'mono-table-error-row')
      // A RE-connect (a dropdown panel moved into the body portal) dropped the head
      // observer in `disconnectedCallback`, and no update is pending to re-arm it.
      if (this.hasUpdated) this._syncHead()
    }

    protected override _subscribe(): void {
      super._subscribe()
      this._pushBehaviour()
    }

    /** The controller owns the clearing; this element only names the mode. */
    private _pushBehaviour(): void {
      this.dataGrid?.setErrorBehaviour?.(this.behaviour === 'keep-list' ? 'keep-list' : 'clear-list')
    }

    override disconnectedCallback(): void {
      this._releaseHead()
      releaseRowHost(this, this._rowHost)
      this._rowHost = undefined
      super.disconnectedCallback()
    }

    protected override updated(changed: Map<string, unknown>): void {
      super.updated?.(changed)
      if (isServer) return
      // A column added or removed after mount would otherwise leave the bar
      // spanning the old count — short of the table, or overflowing it.
      syncRowSpan(this, this._rowHost)
      // Clearing `message` has to bring a caught error back, and re-setting it
      // has to take over again, so the dismissal of one must not silence the
      // other.
      if (changed.has('message')) this._dismissedMessage = false
      if (changed.has('behaviour')) this._pushBehaviour()
      this._syncHead()
    }

    /**
     * Publish the header's height for the sticky cell to sit under — only while
     * the bar is showing, and only under a frozen header (`mono-table-sticky-head`
     * on the table or its scroll wrapper). Anything else is a plain row.
     *
     * Written on the `<table>` rather than on this element: the sticky box is the
     * host `<td>`, which is an ANCESTOR, and a custom property only travels down.
     */
    private _syncHead(): void {
      const table = this.closest('table') as HTMLElement | null
      const frozen = !!this._text && !!table && !!this.closest('.mono-table-sticky-head, [mono-sticky-head]')
      if (!frozen) {
        this._releaseHead()
        return
      }

      const thead = table.querySelector(':scope > thead') as HTMLElement | null
      if (this._headHost !== table) {
        this._releaseHead()
        this._headHost = table
        if (thead && typeof ResizeObserver !== 'undefined') {
          this._headObserver = new ResizeObserver(() => this._writeHead())
          this._headObserver.observe(thead)
        }
      }
      this._writeHead()
    }

    private _writeHead(): void {
      const table = this._headHost
      if (!table) return
      const thead = table.querySelector(':scope > thead') as HTMLElement | null
      const next = `${thead?.offsetHeight ?? 0}px`
      if (table.style.getPropertyValue('--mono-table-error-head') !== next) {
        table.style.setProperty('--mono-table-error-head', next)
      }
    }

    /** Undo `_syncHead` — from the remembered table, since `closest()` is empty after removal. */
    private _releaseHead(): void {
      this._headObserver?.disconnect()
      this._headObserver = undefined
      this._headHost?.style.removeProperty('--mono-table-error-head')
      this._headHost = undefined
    }

    /** The controller error this element would show, if it has not been dismissed. */
    private get _liveError(): MonoTableError | null {
      const error = this.dataGrid?.error ?? null
      if (!error) return null
      return error === this._dismissed ? null : error
    }

    /** The text to paint, or `''` for "show nothing". */
    protected get _text(): string {
      const manual = this.message?.trim()
      if (manual) return this._dismissedMessage ? '' : manual
      return this._liveError?.message ?? ''
    }

    /**
     * What the server said beyond the headline (`MonoTableError.detail`), or
     * `''`. Only for a controller error — a manual `message` is the whole text.
     */
    protected get _detail(): string {
      if (this.message?.trim()) return ''
      return this._liveError?.detail ?? ''
    }

    private _onClose(event: Event): void {
      event.stopPropagation()

      // Remember WHICH thing was dismissed, so the other source is unaffected and
      // the next failure is not mistaken for the one just dismissed.
      if (this.message?.trim()) this._dismissedMessage = true
      else this._dismissed = this.dataGrid?.error ?? null

      dispatchMonoEvent(this, 'close', { message: this._text, error: this.dataGrid?.error ?? null })
    }

    private _onReload(event: Event): void {
      event.stopPropagation()
      const grid = this.dataGrid
      dispatchMonoEvent(this, 'reload', { error: grid?.error ?? null })
      // The rejection is already observed by the controller (`table.error`); an
      // unhandled one here would only be noise.
      grid?.reload().catch(() => {})
    }

    /**
     * Close ✕ / reload ↻. Light (default): the UnoCSS icon class. The shadow build overrides
     * this with inline SVG — a global `.i-mdi-close` rule cannot reach a shadow
     * root. Same split as `mono-modal` / `mono-drawer`.
     */
    protected renderIcon(name: 'close' | 'refresh'): TemplateResult {
      return name === 'refresh'
        ? html`<span class="mono-icon i-mdi-refresh" aria-hidden="true"></span>`
        : html`<span class="mono-icon i-mdi-close" aria-hidden="true"></span>`
    }

    protected override render(): TemplateResult | typeof nothing {
      const text = this._text
      // Nothing to say: render nothing at all rather than an empty bar. This
      // element is in FLOW, so an empty one would open a gap under the header —
      // the overlays can afford to stay in the tree because they are not.
      if (!text) return nothing

      const detail = this._detail
      return html`
        <div class="mono-table-error-bar" mono-error-bar part="bar" role="alert">
          <span class="mono-table-error-text" mono-error-text part="text" title=${detail || nothing}
            >${text}${detail
              ? html`<span class="mono-table-error-detail" mono-error-detail part="detail">${detail}</span>`
              : nothing}</span
          >
          <span class="mono-table-error-actions" mono-error-actions part="actions">
            ${this.reload && this.dataGrid
              ? html`<button
                  type="button"
                  class="mono-table-error-btn mono-table-error-reload" mono-error-btn
                  part="reload"
                  aria-label=${this.reloadLabel}
                  title=${this.reloadLabel}
                  ?disabled=${this.dataGrid.loading}
                  @click=${(event: Event) => this._onReload(event)}
                >
                  ${this.renderIcon('refresh')}
                </button>`
              : nothing}
            ${this.dismissible
              ? html`<button
                  type="button"
                  class="mono-table-error-btn mono-table-error-close" mono-error-btn mono-error-close
                  part="close"
                  aria-label=${this.closeLabel}
                  @click=${(event: Event) => this._onClose(event)}
                >
                  ${this.renderIcon('close')}
                </button>`
              : nothing}
          </span>
        </div>
      `
    }
  }

  return MonoTableErrorCoreClass as unknown as Constructor<MonoTableErrorCoreInterface> & T
}
