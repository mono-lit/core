// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import type { SortOrder } from './mono-data-grid.js'
import { ariaSort, nextOrder, sortTitle } from './table-sort-utils.js'
import { MonoTableMenuCore, type MonoTableMenuCoreInterface } from './table-menu-core.js'
import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'

/** Slot regions the sort control lays out. */
export type TableSortSlotName = 'label'
/** Per-build icon hook the sort core delegates to. */
export type TableSortIconName = 'chevron'

/** Public surface added by the sort core mixin. */
export declare class MonoTableSortCoreInterface extends MonoTableMenuCoreInterface {
  field: string
  caption: string
  disabled: boolean
  enable: boolean
  noClear: boolean
  showIcon: boolean
  protected renderSlot(name: TableSortSlotName): TemplateResult
  protected renderIcon(name: TableSortIconName): TemplateResult
  /** Active sort direction, or null. Read by the builds' `renderIcon`. */
  protected get _current(): SortOrder
}

/**
 * `MonoTableSortCore` — render-mode-agnostic logic for `mono-table-sort`: a
 * column-header sort control whose arrow cycles a SINGLE key `asc → desc → none`
 * (or `asc ↔ desc` with `no-clear`), while right-clicking the header cell opens
 * the `Sort ›` menu — the only place a multi-key sort can be built. The header
 * label is delegated to a `renderSlot('label')`
 * hook (light: a `[data-mono-slot]` placeholder filled with captured nodes;
 * shadow: native `<slot>`) and the up/down chevrons to `renderIcon('chevron')`
 * (light: `i-mdi-chevron-*`; shadow: inline SVG).
 *
 * `updated()` reflects the sort state onto the parent `<th>`/`<td>` via
 * `closest()` — guarded by `isServer` (lit) so it never runs during SSR.
 */
export const MonoTableSortCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableSortCoreClass extends MonoTableMenuCore(superClass) {
    /** Reads `monoDataGrid({ props: { sort } })`. */
    protected override _propsSlot = 'sort' as const

    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, ['noClear', 'showIcon'])
    }

    /** Column to sort by. Omit to render a plain, non-sortable label. */
    @property({ type: String })
    field = ''

    /** Header text. Overrides the element's own (slotted) text content. */
    @property({ type: String })
    caption = ''

    /** Disable sorting for this column. */
    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    /**
     * Whether the control is sortable at all (default `true`). `enable="false"`
     * renders a plain label — the counterpart of `sort: { enable: false }` on a
     * `mono-table-th` column.
     */
    @property({ reflect: true, converter: booleanStringConverter })
    enable = true

    /** Cycle `asc ↔ desc` only (never clears) instead of `asc → desc → none`. */
    @property({ attribute: 'no-clear', reflect: true, converter: booleanStringConverter })
    noClear = false

    /**
     * Show the sort arrow. Default `true`. The arrow is the single-sort click
     * target, so hiding it moves that trigger onto the **label** — still sortable,
     * no glyph. Right-click reaches the `Sort ›` menu either way.
     */
    @property({ attribute: 'show-icon', reflect: true, converter: booleanStringConverter })
    showIcon = true

    protected override updated(changed: Map<string, unknown>): void {
      super.updated(changed)
      // Reflect the sort state onto the parent header cell for assistive tech.
      // SSR never calls updated(), but guard anyway — closest() is DOM-only.
      if (isServer) return
      const cell = this.closest('th, td')
      if (cell) cell.setAttribute('aria-sort', ariaSort(this._current))
      // Right-click always opens the menu; bindContextMenu is idempotent.
      this.bindContextMenu(this._sortable)
    }

    protected get _sortable(): boolean {
      return !!this.field && this.enable && !this.disabled && !!this.dataGrid
    }

    /** This column's current direction, or null when it isn't part of the sort. */
    protected get _current(): SortOrder {
      const grid = this.dataGrid
      if (!grid) return null
      // `sortOf` reads the multi-key list; fall back to the single-value mirrors
      // so an older controller instance still lights the indicator.
      if (typeof grid.sortOf === 'function') return grid.sortOf(this.field)
      return grid.sortField === this.field ? grid.sortOrder ?? null : null
    }

    /** 1-based precedence of this column in the sort; `0` when unsorted. */
    protected get _seq(): number {
      return this.dataGrid?.sortIndex?.(this.field) ?? 0
    }

    /** How many columns are sorted — the `<sup>` only shows when 2+. */
    protected get _sortCount(): number {
      return this.dataGrid?.sorts?.length ?? 0
    }

    /**
     * The arrow (or, with `show-icon="false"`, the label). Single-key — this
     * column becomes the entire sort, collapsing any stack — UNLESS the user has
     * started combining from the right-click menu and something is still
     * sorted: then the arrow appends too, because a user who began a multi-key
     * sort means to keep building it (`sortCombining`). Cycling past `desc`
     * clears this column either way.
     */
    private _toggle(): void {
      if (!this._sortable) return
      void this.dataGrid?.setSort(this.field, nextOrder(this._current, this.noClear), {
        multi: !!this.dataGrid?.sortCombining?.(),
      })
    }

    /** Per-region slot content — overridden per build. */
    protected renderSlot(_name: TableSortSlotName): TemplateResult {
      return html``
    }

    /** Internal icon — light: UnoCSS `.mono-icon`; shadow: inline SVG. */
    protected renderIcon(_name: TableSortIconName): TemplateResult {
      return html``
    }

    protected _label(): TemplateResult {
      return html`<span class="mono-table-sort-label" data-mono-slot="label"
        >${this.caption ? this.caption : this.renderSlot('label')}</span
      >`
    }

    protected override render(): TemplateResult {
      if (!this._sortable) {
        return this._label()
      }

      const current = this._current
      const seq = this._seq
      const total = this._sortCount
      const seqBadge =
        total > 1 && seq > 0
          ? html`<sup class="mono-table-sort-seq" mono-sort-seq aria-hidden="true">${seq}</sup>`
          : nothing

      // The right-click menu (Sort › submenu) is always available on a sortable
      // column — it is the only way to build a multi-key sort.
      const menus = html`
        <div class="mono-th-menu ${this._menuOpen ? 'open' : ''}" mono-th-menu ?mono-open=${this._menuOpen} role="menu">
          ${this.renderSortMenuItem()}
        </div>
        ${this.renderSortSubmenu(this.noClear)}
      `

      if (!this.showIcon) {
        // No arrow — the LABEL becomes the single-sort trigger.
        return html`
          <span class="mono-table-sort-head no-icon" mono-sort-head>
            <button
              type="button"
              class="mono-table-sort-btn label-trigger" mono-sort-btn
              data-dir=${current ?? 'none'}
              title=${sortTitle(current, seq, total)}
              @click=${this._toggle}
            >
              ${this._label()}${seqBadge}
            </button>
          </span>
          ${menus}
        `
      }

      // Only the ARROW is a button — clicking the label must not sort. The icon's
      // GLYPH encodes the direction; `data-dir` drives its colour (see table.css).
      return html`
        <span class="mono-table-sort-head" mono-sort-head>
          ${this._label()}
          <button
            type="button"
            class="mono-table-sort-btn" mono-sort-btn
            data-dir=${current ?? 'none'}
            title=${sortTitle(current, seq, total)}
            aria-label=${`Sort by ${this.caption || this.field}`}
            @click=${this._toggle}
          >
            <span class="mono-table-sort-ind" mono-sort-ind aria-hidden="true">${this.renderIcon('chevron')}</span>
            ${seqBadge}
          </button>
        </span>
        ${menus}
      `
    }
  }

  return MonoTableSortCoreClass as unknown as Constructor<MonoTableSortCoreInterface> & T
}
