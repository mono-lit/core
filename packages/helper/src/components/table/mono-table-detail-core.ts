// @unocss-include

import { LitElement, html, isServer, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import {
  captureLightSlots,
  placeLightSlots,
  type LightSlotBuckets,
} from '../../composables/light-slots'
import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { applyProps } from '../../composables/element-props'
import { dispatchMonoEvent } from '../../composables/mono-event'
import type { MonoTableController } from './mono-data-grid.js'

/** `detail` of the `toggle` / `open` / `close` events `<mono-table-detail>` emits (and of `mno-click`, the kept alias). */
export interface TableDetailClickEventDetail {
  /** The state the detail moved TO. */
  open: boolean
  /** `data-row-key` of the row the toggle sits in, when the consumer set one. */
  rowKey: string | null
  /** The chevron click that caused it; absent for `toggle()` / `expandAll()`. */
  sourceEvent?: Event
}

export type TableDetailClickEvent = CustomEvent<TableDetailClickEventDetail>

/** Events emitted by `<mono-table-detail>` (feeds the generated Vue types). */
export interface TableDetailEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  toggle: TableDetailClickEvent
  open: TableDetailClickEvent
  close: TableDetailClickEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-click': TableDetailClickEvent
  mnoClick: TableDetailClickEvent
  'mno-open': TableDetailClickEvent
  mnoOpen: TableDetailClickEvent
  'mno-close': TableDetailClickEvent
  mnoClose: TableDetailClickEvent
}

/** Public surface added by the detail core mixin. */
export declare class MonoTableDetailCoreInterface extends MonoTableControllerCoreInterface {
  icon: string
  iconExpanded: string
  open: boolean
  stayOpen: boolean
  disabled: boolean
  label?: string
  toggle(force?: boolean): void
  /** The chevron — overridden by the shadow build, which can't use icon classes. */
  protected _renderIcon(): TemplateResult
}

/** Total column span of a row, so the panel cell can stretch the full width. */
function colSpanOf(row: HTMLTableRowElement): number {
  let total = 0
  for (const cell of Array.from(row.cells)) total += cell.colSpan || 1
  return Math.max(1, total)
}

/**
 * `MonoTableDetailCore` — render-mode-agnostic logic for `mono-table-detail`, the
 * expand/collapse chevron for a table row.
 *
 * **Shape.** The element itself is *only the toggle*: put it in a `<td>` of the
 * row you want expandable and keep authoring the `<tr>` yourself. Everything
 * slotted into it becomes the **panel** — a `<tr class="mono-table-detail-row" mono-detail-row>`
 * with one `<td colspan="…">` that the element inserts into the `<tbody>`
 * immediately after its own row while open, and pulls back out when closed. The
 * `colspan` is recomputed from the parent row's cells on every attach, so it
 * always spans the whole grid.
 *
 * ```html
 * <tr :data-row-key="row.Id">
 *   <td>
 *     <mono-table-detail :control-table.prop="table">
 *       <p>Notes: {{ row.Note }}</p>
 *     </mono-table-detail>
 *   </td>
 *   <td>{{ row.Name }}</td>
 * </tr>
 * ```
 *
 * **Why the panel row is built imperatively.** Lit renders through a `<template>`,
 * and a bare `<tr>` in a non-table parsing context is dropped by the HTML parser —
 * so the row could never come out of `render()`. It is created with
 * `document.createElement` instead, which also means the SAME code path serves the
 * light and the shadow build: in both, the consumer's children are captured off
 * the host and re-parented into the panel cell (a shadow `<slot>` could not
 * project content to a row *outside* the host).
 *
 * **Content is real DOM the consumer owns**, captured through
 * `composables/light-slots`, so Vue interpolation (`{{ row.Note }}`), `v-if`
 * anchors, a whole nested `<table class="mono-table" mono-table>` with its own
 * `controlMonoTable`, and further nested `<mono-table-detail>` elements all work.
 * While closed, the captured nodes stay parked inside the (detached) panel cell
 * rather than orphaned — a captured node with a `null` parent is what crashes
 * Vue's next patch.
 *
 * **Accordion by default.** Opening a row closes the row that was open, scoped to
 * the bound controller — so a nested grid runs its own accordion without
 * disturbing the outer one. **`stay-open` is the exemption**: such a row is
 * skipped by the accordion *and* by `table.detail().collapseAll()`. It is not a
 * lock — its own chevron still closes it. Mark every row `stay-open` to get
 * independent panels back.
 *
 * SSR-safe: every DOM touch is behind `isServer`, so the server renders just the
 * collapsed toggle.
 */
export const MonoTableDetailCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableDetailCoreClass extends MonoTableControllerCore(superClass) {
    constructor(...args: any[]) {
      super(...args)
      // `icon`, `open`, `label` and `disabled` are already lowercase — aliasing a
      // lowercase name would define the property in terms of itself and recurse.
      defineHybridPropAliases(this, ['iconExpanded', 'stayOpen'])
    }

    /** Reads `monoDataGrid({ props: { detail } })` — shared defaults for every detail. */
    protected override _propsSlot = 'detail' as const

    /** Icon shown while collapsed (a global icon class in the light build). */
    @property({ type: String })
    icon = 'i-mdi-chevron-right'

    /** Icon shown while expanded. */
    @property({ type: String, attribute: 'icon-expanded' })
    iconExpanded = 'i-mdi-chevron-down'

    /**
     * Whether the panel is showing. Reflected, so `[open]` is styleable and the
     * state survives a server render.
     */
    @property({ converter: booleanStringConverter, reflect: true })
    open = false

    /**
     * Keep this detail open when `table.detail().collapseAll()` runs. It is *not*
     * a lock — the chevron still toggles it.
     */
    @property({ converter: booleanStringConverter, attribute: 'stay-open' })
    stayOpen = false

    /** Disable the toggle (the panel stays in whatever state it is in). */
    @property({ converter: booleanStringConverter })
    disabled = false

    /** Accessible label for the toggle button (default `Toggle details`). */
    @property({ type: String })
    label?: string

    private _slotsCaptured = false
    private _buckets: LightSlotBuckets = new Map()
    private _panelRow?: HTMLTableRowElement
    private _panelCell?: HTMLTableCellElement
    private _registeredOn?: MonoTableController

    override connectedCallback(): void {
      super.connectedCallback()
      if (isServer) return

      this._captureSlots()
      this._syncRegistration()

      // Same reason as `mono-card`: capture detaches the consumer's children (and
      // any framework anchors among them) from the host, and only `updated()`
      // re-parents them into the panel cell. Rendering the first update
      // synchronously makes capture→placement one uninterrupted step inside the
      // consumer's insert, so no anchor is ever observably parentless.
      if (this.isConnected) this.performUpdate()

      // …and then re-assert the panel unconditionally, because on a RE-connect
      // `performUpdate()` is a no-op: nothing is pending, so `updated()` never
      // runs. `disconnectedCallback` took the panel row out of the DOM, so
      // without this a detail that was open when its host got detached (a nested
      // one whose parent panel closed and reopened, a `v-if`, a page change)
      // comes back with `open === true`, an expanded chevron and NO panel —
      // looking permanently stuck open, and needing two clicks to reopen.
      this._refreshPanel()
    }

    override disconnectedCallback(): void {
      // The panel row is OUR node in the consumer's `<tbody>`; take it with us,
      // keeping its content (and its parents) intact for a later re-attach.
      this._panelRow?.parentNode?.removeChild(this._panelRow)
      this._registeredOn?.unregisterDetail?.(this)
      this._registeredOn = undefined
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      super.willUpdate(changed)
      if (changed.has('dataGrid')) this._syncRegistration()
    }

    protected override updated(changed: Map<string, unknown>): void {
      // @ts-ignore — the generic base may not declare `updated`.
      super.updated?.(changed)
      this._refreshPanel()
    }

    /**
     * Bring the panel in line with the current state: build it if needed, make
     * sure the consumer's captured nodes are in it, and attach/detach the row.
     * Idempotent, so the extra call from `connectedCallback` costs nothing.
     */
    private _refreshPanel(): void {
      if (isServer) return
      this._ensurePanel()
      placeLightSlots(this._panelCell!, this._buckets)
      this._syncPanel()
    }

    /**
     * Shared defaults from `props: { detail }`, minus `open`.
     *
     * Every other slot lets the controller win outright, but `open` is per-element
     * state that the user toggles: re-applying it on each update cycle would undo
     * the click a microtask later and the chevron would look broken. Open/close
     * from code goes through `table.detail()` instead.
     */
    protected override _applyControllerProps(): void {
      const patch = this.dataGrid?.props?.().detail
      if (!patch) return
      const { open: _open, ...rest } = patch
      applyProps(this, rest)
    }

    private _captureSlots(): void {
      if (this._slotsCaptured) return
      this._slotsCaptured = true
      // No named regions: everything the consumer wrote is the panel.
      this._buckets = captureLightSlots(this, { names: [] })
    }

    private _syncRegistration(): void {
      const grid = this.dataGrid
      if (this._registeredOn === grid) return
      this._registeredOn?.unregisterDetail?.(this)
      this._registeredOn = grid
      grid?.registerDetail?.(this)
    }

    /** The panel row + cell, created once and reused across every toggle. */
    private _ensurePanel(): void {
      if (this._panelRow) return

      const row = document.createElement('tr')
      row.className = 'mono-table-detail-row'
      row.setAttribute('mono-detail-row', '')
      // Marks our rows so a second detail on the same `<tr>` appends after the
      // first instead of the two fighting over the slot right below the row.
      row.setAttribute('data-mono-detail-row', '')

      const cell = document.createElement('td')
      cell.className = 'mono-table-detail-cell'

      const panel = document.createElement('div')
      panel.className = 'mono-table-detail-panel'
      panel.setAttribute('data-mono-slot', 'default')

      cell.appendChild(panel)
      row.appendChild(cell)

      this._panelRow = row
      this._panelCell = cell
    }

    /** The row this toggle belongs to (`null` outside a table). */
    private get _row(): HTMLTableRowElement | null {
      return this.closest('tr')
    }

    /** Attach the panel row after our own row while open; detach it while closed. */
    private _syncPanel(): void {
      const row = this._panelRow
      if (!row) return

      const parent = this._row
      const container = parent?.parentNode

      if (!this.open || !parent || !container) {
        row.parentNode?.removeChild(row)
        return
      }

      const cell = this._panelCell!
      const span = colSpanOf(parent)
      if (cell.colSpan !== span) cell.colSpan = span

      if (!this._isPlaced(parent, row)) container.insertBefore(row, this._anchorAfter(parent))
    }

    /** Already sitting in this row's own run of detail rows? */
    private _isPlaced(parent: HTMLTableRowElement, row: HTMLTableRowElement): boolean {
      if (row.parentNode !== parent.parentNode) return false
      let el = parent.nextElementSibling
      while (el) {
        if (el === row) return true
        if (!el.hasAttribute('data-mono-detail-row')) return false
        el = el.nextElementSibling
      }
      return false
    }

    /** Insert point: after the row, past any detail rows a sibling toggle opened. */
    private _anchorAfter(parent: HTMLTableRowElement): Node | null {
      let last: Element = parent
      let el = parent.nextElementSibling
      while (el && el.hasAttribute('data-mono-detail-row')) {
        last = el
        el = el.nextElementSibling
      }
      return last.nextSibling
    }

    /**
     * Open, close, or flip the panel. Emits `toggle` (historically `mno-click`,
     * kept) and then `open` / `close`, exactly like a tap on the chevron.
     */
    toggle(force?: boolean, sourceEvent?: Event): void {
      if (this.disabled) return
      const next = force === undefined ? !this.open : force
      if (next === this.open) return
      this.open = next

      // Accordion: opening a row closes the one that was open. Scoped to the
      // bound controller, so a nested grid's details run their own accordion and
      // are not disturbed by the outer one. `stay-open` rows are exempt — that
      // flag means "exempt from every automatic close".
      //
      // Deliberately driven from HERE and not from an `open` write, so
      // `table.detail().expandAll()` can still open every panel at once.
      if (next) this.dataGrid?.detail?.().collapseOthers?.(this)

      const detail: TableDetailClickEventDetail = {
        open: next,
        rowKey: this._row?.getAttribute('data-row-key') ?? null,
        sourceEvent,
      }
      // Not a plain `click`: the chevron's real click bubbles on its own, and a
      // programmatic `expandAll()` is not a click at all.
      dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })
      dispatchMonoEvent(this, next ? 'open' : 'close', detail)
    }

    protected _handleClick(event: Event): void {
      // The grid binds its inline-editor trigger on the `<table>`; the toggle is a
      // `<button>`, which that guard already skips, but the panel row it opens
      // would otherwise shift the row under the pointer mid-gesture.
      event.stopPropagation()
      this.toggle(undefined, event)
    }

    /**
     * The chevron. The light build overrides nothing (global icon classes); the
     * shadow build swaps in inline SVG, which page-level utility CSS can't reach.
     */
    protected _renderIcon(): TemplateResult {
      const cls = this.open ? this.iconExpanded : this.icon
      return html`<span class="mono-icon ${cls}" aria-hidden="true"></span>`
    }

    protected override render(): TemplateResult {
      return html`
        <button
          type="button"
          class="mono-table-detail-toggle" mono-detail-toggle
          part="toggle"
          ?disabled=${this.disabled}
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-label=${this.label ?? 'Toggle details'}
          @click=${this._handleClick}
        >
          ${this._renderIcon()}
        </button>
      `
    }
  }

  return MonoTableDetailCoreClass as unknown as Constructor<MonoTableDetailCoreInterface> & T
}
