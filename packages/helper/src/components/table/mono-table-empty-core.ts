// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import {
  applyOverlayHost,
  ensureRowHost,
  releaseOverlayHost,
  releaseRowHost,
  type RowHost,
} from './table-overlay.js'
import { isIconifyClass } from '../../composables/icon.js'
import type { Constructor } from '../../composables/hybird-prop'
import { monoPendingActive } from '../../composables/mono-skeleton'
import { dispatchMonoEvent } from '../../composables/mono-event'
import type { MonoTableController } from './mono-data-grid.js'

/** `detail` of the `reload` event `<mono-table-empty>` emits when its button is pressed. */
export interface TableEmptyReloadEventDetail {
  grid: MonoTableController
}

export type TableEmptyReloadEvent = CustomEvent<TableEmptyReloadEventDetail>

/** Events emitted by `<mono-table-empty>` (feeds the generated Vue types). */
export interface TableEmptyEvents {
  // The plain name — what a template listens to.
  reload: TableEmptyReloadEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-reload': TableEmptyReloadEvent
  mnoReload: TableEmptyReloadEvent
}

/** Public surface added by the empty-state core mixin. */
export declare class MonoTableEmptyCoreInterface extends MonoTableControllerCoreInterface {
  icon: string
  title: string
  subtitle: string
  reload: boolean
  reloadLabel: string
  height?: string
  minHeight?: string
  maxHeight?: string
  /** Set by each build once `slot="body"` is known to hold something. */
  protected _hasBodySlot: boolean
  /** Overridden by the shadow build to emit a real `<slot>`. */
  protected _renderBodySlot(): TemplateResult
  protected _renderProps(): TemplateResult
  protected _renderIcon(): TemplateResult | typeof nothing
}

/**
 * Defaults, so the element says something sensible with no props at all.
 *
 * A neutral question mark rather than a "broken"/"error" glyph: an empty grid is
 * usually a search that matched nothing, which is a normal outcome and not a
 * fault. The subtitle names the two things a user can actually do about it —
 * anything more specific would be wrong on most tables.
 */
const DEFAULT_ICON = 'i-mdi-help-circle-outline'
const DEFAULT_TITLE = 'No Data found'
const DEFAULT_SUBTITLE = 'Try adjusting your search or filters.'

/** Fallback when `--mono-table-empty-min-h` resolves to nothing. */
const DEFAULT_MIN_HEIGHT = '12rem'

/** Breathing room left under the message when its own height sets the reserve. */
const TAIL_GAP = 16

/**
 * `MonoTableEmptyCore` — render-mode-agnostic logic for `mono-table-empty`, the
 * message shown over a grid that came back with no rows.
 *
 * It is `mono-table-loading`'s pair: same `<caption>` host, same overlay geometry,
 * same controller binding — one covers the grid while a query runs, this one
 * covers it when the query returned nothing. Everything they share lives in
 * `table-overlay.ts`.
 *
 * **When it shows.** With a controller bound: only once that controller has
 * settled at least once (`hasLoaded`) AND has no rows AND is not loading. The
 * `hasLoaded` gate is the load-bearing one — a fresh controller reads
 * `items: [], loading: false`, which is indistinguishable from "loaded and
 * genuinely empty", so without it every table would flash "No data" on mount
 * before its first request had even been made.
 *
 * With NO controller bound it shows unconditionally, because then the consumer is
 * driving it with `v-if` / `v-show` and an element that hid itself would simply
 * never appear.
 *
 * **What it shows.** `icon`, then `title`, then `subtitle`, then a reload button —
 * each omitted when its prop is empty. A `slot="body"` replaces all four, so a
 * consumer can put arbitrary markup (or a mono component) in the same box and
 * keep the placement and centring for free.
 *
 * SSR-safe: all DOM work is guarded behind `isServer`.
 */
export const MonoTableEmptyCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableEmptyCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { empty } })`. */
    protected override _propsSlot = 'empty' as const

    /**
     * The glyph above the title. Either an iconify utility class
     * (`i-mdi-database-off`) or literally anything else — an emoji, a letter, a
     * word — which is rendered as text. `isIconifyClass` decides, and it is the
     * same test breadcrumb uses, so one spelling behaves the same everywhere.
     *
     * Set it to `''` to drop the glyph. That is the only way, and deliberately:
     * with a default, "unset" has to mean "give me the default" or the defaults
     * would never appear.
     */
    @property({ type: String })
    icon = DEFAULT_ICON

    /** Headline. Set to `''` to drop it. */
    @property({ type: String })
    title = DEFAULT_TITLE

    /** Supporting line under the title. Set to `''` to drop it. */
    @property({ type: String })
    subtitle = DEFAULT_SUBTITLE

    /**
     * Offer a reload button under the subtitle (default `true`).
     *
     * Only ever rendered when a controller is bound — there is nothing for it to
     * reload otherwise, and a button that cannot work is worse than no button.
     */
    @property({ type: Boolean })
    reload = true

    /** Label on that button. */
    @property({ type: String, attribute: 'reload-label' })
    reloadLabel = 'Reload'

    /**
     * Fixed height for the area the message reserves — any CSS length
     * (`'18rem'`, `'240px'`, `'40vh'`). Wins outright: `minHeight` / `maxHeight`
     * and the auto-grow below are all ignored, because a fixed height is an
     * instruction, not a hint.
     */
    @property({ type: String })
    height?: string

    /**
     * Floor for that area (default `--mono-table-empty-min-h`, `12rem`).
     *
     * It is a floor rather than the height because the reservation also has to
     * fit the message: this box is `sticky`, and a sticky box cannot leave its
     * containing block, so one that is taller than the room reserved for it gets
     * clamped back upwards until its first line is sitting on the column names.
     */
    @property({ type: String, attribute: 'min-height' })
    minHeight?: string

    /**
     * Ceiling for that area. Caps the auto-grow on a tall message — on a short
     * screen a long body slot would otherwise push the grid down past the fold.
     * A message taller than this simply scrolls with the grid.
     */
    @property({ type: String, attribute: 'max-height' })
    maxHeight?: string

    /** True while `slot="body"` holds content — set by each build. */
    @state()
    protected _hasBodySlot = false

    private _visible = false

    /** The `<tr>` this element lives in — generated by it, or adopted from the consumer. */
    private _rowHost?: RowHost

    override connectedCallback(): void {
      super.connectedCallback()
      if (isServer) return
      this._rowHost = ensureRowHost(this, 'mono-table-empty-row')
      // Reflect the state we are mounting into, rather than waiting for a notify
      // that may never come on an already-settled controller.
      const wasVisible = this._visible
      this._sync()
      // A RE-connect (a dropdown panel moved into the body portal) finds the state
      // unchanged, so `_sync` returns early — but `disconnectedCallback` released
      // the room and the header offset. Reserve them again.
      if (this._visible && wasVisible) this._apply()
    }

    override disconnectedCallback(): void {
      // Give the room back. The size host is the CONSUMER's element and outlives
      // this one, so a reservation left behind is a permanent gap under their
      // header that nothing on the page accounts for — and a `v-if` that swaps
      // one of these for another makes it happen on every toggle.
      releaseOverlayHost(this)
      releaseRowHost(this, this._rowHost)
      this._rowHost = undefined
      super.disconnectedCallback()
    }

    /**
     * Re-read state on every notify. Replaces the base subscribe rather than
     * chaining it, the way `mono-table-loading` does: visibility is applied
     * imperatively, so waiting for Lit's async render would let a fast
     * load→empty→load sequence paint the message in between.
     */
    protected override _subscribe(): void {
      this._off?.()
      this._off = this.dataGrid?.subscribe(() => {
        this._sync()
        // The empty state is attribute-driven, but the automatic skeleton (`pending`) is
        // resolved in the update cycle — a notify may be the "first load done" it waits for.
        if (monoPendingActive(this)) this.requestUpdate()
      })
      if (!isServer) this._sync()
    }

    protected override updated(changed: Map<string, unknown>): void {
      super.updated?.(changed)
      if (isServer) return
      // `reload` and the text props change what is rendered but not whether it is
      // shown; `dataGrid` changes both, and `_subscribe` has already re-run by now.
      if (changed.has('dataGrid')) this._sync()
      // Re-reserve from the message that has just rendered. The first `_apply`
      // runs before there is a box to measure, and a prop change can resize one
      // that already exists.
      else if (this._visible) this._apply()
    }

    /** Whether the bound controller says "loaded, and there is nothing". */
    private get _controllerEmpty(): boolean {
      const grid = this.dataGrid
      if (!grid) return false
      if (grid.loading) return false
      // A failed request leaves zero rows, but "No Data found" is then a lie: the
      // grid is not empty, it is unknown. `<mono-table-error>` says the true
      // thing, so this one stands down until the error clears.
      if (grid.error) return false
      // The gate that stops a fresh table announcing "no data" before its first
      // request. See `MonoTableController.hasLoaded`.
      if (!grid.hasLoaded) return false
      return (grid.items?.length ?? 0) === 0
    }

    /** Runs synchronously on every controller notify. */
    private _sync(): void {
      if (isServer) return
      // No controller means the consumer is driving with `v-if` / `v-show`, so
      // the element must not hide itself — it would then never be seen at all.
      const next = this.dataGrid ? this._controllerEmpty : true
      if (next === this._visible && this.hasAttribute('data-mono-empty') === next) return
      this._visible = next
      this._apply()
    }

    /**
     * The room to reserve under the header.
     *
     * A CONFIGURED height, not a measured one: this overlay appears over a grid
     * that is already a header and nothing else, so there is no height left to
     * freeze. `--mono-table-empty-min-h` is the floor, read off the element so a
     * theme or a single field can retune it.
     *
     * The floor alone is not enough, though, because the message is `sticky`: a
     * sticky box cannot leave its containing block, so once the message is taller
     * than the room reserved for it the browser CLAMPS it back upwards — and it
     * creeps up until its first line is sitting on the column names again, which
     * is the exact thing the header offset exists to prevent. So the floor is
     * raised to whatever the message actually needs.
     *
     * Both measurements are taken from values the clamp does not affect: `top` is
     * the resolved `header + gap`, and `offsetHeight` is the message's own height
     * wherever it happens to be painted. Measuring its POSITION instead would be
     * circular — it is the clamped position we are sizing to avoid.
     */
    private _holdHeight(): string {
      // An explicit height is an instruction, not a hint — nothing below applies.
      if (this.height) return this.height

      const floor =
        this.minHeight ||
        getComputedStyle(this).getPropertyValue('--mono-table-empty-min-h').trim() ||
        DEFAULT_MIN_HEIGHT

      const box = this.renderRoot?.querySelector?.(
        '.mono-table-empty-box',
      ) as HTMLElement | null

      const top = box ? parseFloat(getComputedStyle(box).top) || 0 : 0
      const needed = box ? Math.ceil(top + box.offsetHeight + TAIL_GAP) : 0
      const grown = needed ? `max(${floor}, ${needed}px)` : floor

      // The cap wins over the floor when they disagree: both were asked for, and
      // a `maxHeight` under the floor is a screen too short for the default, which
      // is exactly the case it exists for.
      return this.maxHeight ? `min(${grown}, ${this.maxHeight})` : grown
    }

    /** Reflect visibility, and reserve the room the message needs. */
    private _apply(): void {
      this.toggleAttribute('data-mono-empty', this._visible)
      this.setAttribute('aria-hidden', this._visible ? 'false' : 'true')

      applyOverlayHost(this, this._visible, {
        headVar: '--mono-table-empty-head',
        holdVar: '--mono-table-hold-empty',
        // A function, so it is evaluated AFTER the header offset is published —
        // it reads the box's `top`, which is derived from it.
        hold: () => this._holdHeight(),
        // `'always'`: unlike the spinner, this overlay's content is a block of
        // text, and it has to clear the header at REST as well as while
        // scrolling — with a `0` offset the first line lands on the column names.
        measureHead: 'always',
      })
    }

    /** Reload the bound controller. No-op without one — the button isn't rendered then. */
    protected _onReload(): void {
      const grid = this.dataGrid
      if (!grid) return
      dispatchMonoEvent(this, 'reload', { grid })
      // Swallowed on purpose: a failed reload is now recorded on the controller
      // (`grid.error`) and rendered by `<mono-table-error>`, so the rejection has
      // already been observed. Left as a bare `void` it was an unhandled
      // rejection on every failed retry.
      void grid.reload().catch(() => {})
    }

    protected _reloadIcon(): TemplateResult {
      return html`<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        <path
          d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
      </svg>`
    }

    /**
     * The icon, when the props are in play.
     *
     * Two shapes, one prop. An iconify class paints as a mask on an empty span, so
     * it must go on the `class` attribute; anything else — an emoji, a letter —
     * is just text and must go in the node. Rendering either one as the other
     * gives a blank box, which is why the branch exists rather than a single
     * "put it somewhere" line. The shadow build overrides this: a page-level
     * `i-*` class cannot reach a shadow root without help.
     */
    protected _renderIcon(): TemplateResult | typeof nothing {
      const icon = this.icon?.trim()
      if (!icon) return nothing

      if (isIconifyClass(icon)) {
        return html`<span class=${`mono-table-empty-icon ${icon}`} mono-empty-icon aria-hidden="true"></span>`
      }
      return html`<span class="mono-table-empty-icon is-text" mono-empty-icon aria-hidden="true">${icon}</span>`
    }

    /**
     * The `slot="body"` region — a `data-mono-slot` target in light, a real
     * `<slot>` in shadow.
     *
     * ALWAYS rendered, even when the props are in play. In the light build it is
     * the target `placeLightSlots` re-attaches the captured nodes into, and in the
     * shadow build a `<slot>` that is not in the tree has no assigned nodes — so
     * dropping it would make "is the body filled?" permanently false and the
     * override could never turn on.
     */
    protected _renderBodySlot(): TemplateResult {
      return html`<div class="mono-table-empty-body" mono-empty-body data-mono-slot="body"></div>`
    }

    /** Icon, title, subtitle, reload — in that order, each omitted when unset. */
    protected _renderProps(): TemplateResult {
      const showReload = this.reload && !!this.dataGrid

      return html`
        ${this._renderIcon()}
        ${this.title
          ? html`<div class="mono-table-empty-title" mono-empty-title>${this.title}</div>`
          : nothing}
        ${this.subtitle
          ? html`<div class="mono-table-empty-sub" mono-empty-sub>${this.subtitle}</div>`
          : nothing}
        ${showReload
          ? html`<button
              type="button"
              class="mono-table-empty-reload" mono-empty-reload
              part="reload"
              @click=${() => this._onReload()}
            >
              ${this._reloadIcon()}${this.reloadLabel}
            </button>`
          : nothing}
      `
    }

    /**
     * `slot="body"` REPLACES the props rather than sitting beside them. Anyone who
     * fills it has said what the box should contain, and a stray title showing
     * above their own markup would be a bug they could not turn off without also
     * clearing a prop they never set.
     */
    protected _renderContent(): TemplateResult {
      return html`${this._hasBodySlot ? nothing : this._renderProps()}${this._renderBodySlot()}`
    }

    protected override render(): TemplateResult {
      // The box renders even while hidden. A light build renders INTO the host, so
      // returning `nothing` would tear out the region the captured slot nodes were
      // placed into and there would be nothing to put back.
      return html`<div class="mono-table-empty-box" mono-empty-box part="box" role="status">
        ${this._renderContent()}
      </div>`
    }
  }

  return MonoTableEmptyCoreClass as unknown as Constructor<MonoTableEmptyCoreInterface> & T
}
