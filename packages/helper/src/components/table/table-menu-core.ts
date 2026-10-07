// @unocss-include

import { html, isServer, nothing, type LitElement, type TemplateResult } from 'lit'
import { state } from 'lit/decorators.js'

import type { MonoTableController, SortOrder } from './mono-data-grid.js'
import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import type { Constructor } from '../../composables/hybird-prop'
import { PopupPortalController } from '../../composables/popup-portal.js'

/** Resolved sort config — see {@link MonoColumnSort}. */
export interface MonoResolvedSort {
  enable: boolean
  showIcon: boolean
  noClear: boolean
  disabled: boolean
}

/** Public surface added by the menu core mixin. */
export declare class MonoTableMenuCoreInterface extends MonoTableControllerCoreInterface {
  protected _menuOpen: boolean
  protected _sortMenuOpen: boolean
  protected _menuPopup?: PopupPortalController
  protected _sortMenuPopup?: PopupPortalController
  protected _menuPanelEl: HTMLElement | null
  protected _cell: HTMLElement | null

  protected get _sortDir(): SortOrder
  protected resolveSort(raw?: {
    enable?: boolean
    showIcon?: boolean
    noClear?: boolean
    disabled?: boolean
  }): MonoResolvedSort

  protected bindContextMenu(wanted: boolean): void
  protected detachContextMenu(): void
  protected ensurePopups(): void
  protected openMenu(e?: Event): void
  protected closeMenu(): void
  protected _menuKeepsPath(path: EventTarget[]): boolean
  protected bindDocListeners(): void
  protected teardownDocListeners(): void

  protected renderSortMenuItem(): TemplateResult
  protected renderSortSubmenu(noClear?: boolean): TemplateResult
  protected pickSort(order: SortOrder): Promise<void>
  protected clearAllSorts(): Promise<void>
  protected _caretIcon(): TemplateResult
  protected _sortGlyph(dir: 'asc' | 'desc' | 'clear'): TemplateResult
  protected _clearAllIcon(): TemplateResult
  protected _checkIcon(): TemplateResult
}

/**
 * `MonoTableMenuCore` — the header context-menu machinery shared by
 * `mono-table-th` and the standalone `mono-table-sort`.
 *
 * Right-click on the header cell ALWAYS opens the menu; its **Sort** row cascades
 * into an Ascending / Descending / Clear / Clear-all submenu, and picking a
 * direction there ACCUMULATES keys (the column's own arrow stays single-key).
 * Only `mono-table-th` adds a Header Filter row (and its value panel), so the
 * filter-specific parts deliberately stay in that core — this mixin owns just what
 * is genuinely common:
 *
 *  - the menu + submenu `PopupPortalController`s,
 *  - the `contextmenu` binding on the closest `th`/`td`,
 *  - the document `pointerdown` / `Escape` dismissal, with a
 *    `_menuKeepsPath()` hook subclasses extend for their own popups,
 *  - the Sort row and submenu rendering.
 *
 * It only *declares* `field` / `caption` — both cores already define them as
 * reactive properties, and re-declaring would shadow them.
 */
export const MonoTableMenuCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableMenuCoreClass extends MonoTableControllerCore(superClass) {
    declare field: string
    declare caption: string
    declare dataGrid?: MonoTableController

    @state() protected _menuOpen = false
    @state() protected _sortMenuOpen = false

    protected _menuPopup?: PopupPortalController
    protected _sortMenuPopup?: PopupPortalController
    protected _menuPanelEl: HTMLElement | null = null
    /** The `th`/`td` the contextmenu handler is currently bound to. */
    protected _cell: HTMLElement | null = null
    private _ctxHandler?: (e: MouseEvent) => void
    private _onDocPointer?: (e: Event) => void
    private _onDocKey?: (e: KeyboardEvent) => void

    override connectedCallback(): void {
      super.connectedCallback()
      // `disconnectedCallback` dropped the `contextmenu` listener, and simply being
      // re-attached does not schedule a render — so nothing would call
      // `bindContextMenu` again and the header would come back INERT after a Vue
      // `v-if` toggle, `<KeepAlive>`, or a plain node move. Ask for the update that
      // re-binds it (the bind itself stays in `updated()`, where each subclass
      // decides whether it wants the menu at all).
      if (!isServer) this.requestUpdate()
    }

    override disconnectedCallback(): void {
      this.detachContextMenu()
      this.teardownDocListeners()
      super.disconnectedCallback()
    }

    // ── Sort state helpers (read through the controller) ─────────────────────
    /** This column's direction, or null when it isn't part of the sort. */
    protected get _sortDir(): SortOrder {
      const grid = this.dataGrid
      if (!grid) return null
      if (typeof grid.sortOf === 'function') return grid.sortOf(this.field)
      return grid.sortField === this.field ? grid.sortOrder ?? null : null
    }

    /** Resolved sort config. Subclasses supply the raw object. */
    protected resolveSort(raw?: {
      enable?: boolean
      showIcon?: boolean
      noClear?: boolean
      disabled?: boolean
    }): MonoResolvedSort {
      return {
        enable: raw?.enable !== false,
        showIcon: raw?.showIcon !== false,
        noClear: !!raw?.noClear,
        disabled: !!raw?.disabled,
      }
    }

    // ── contextmenu binding ─────────────────────────────────────────────────
    /**
     * (Re)bind `contextmenu` on the closest header cell when `wanted`. Idempotent:
     * it no-ops while already bound to the same cell, so it is safe to call from
     * every `updated()`.
     */
    protected bindContextMenu(wanted: boolean): void {
      if (isServer) return
      const cell = wanted ? (this.closest('th, td') as HTMLElement | null) : null
      if (cell === this._cell) return
      this.detachContextMenu()
      this._cell = cell
      if (!cell) return
      // `stopImmediatePropagation`, not just `stopPropagation`: both cores bind on
      // the SAME `th`/`td` node, and the binding is unconditional now, so a cell
      // holding two menu-capable elements would otherwise open two menus at once.
      this._ctxHandler ??= (e: MouseEvent) => {
        e.stopImmediatePropagation()
        this.openMenu(e)
      }
      cell.addEventListener('contextmenu', this._ctxHandler)
    }

    protected detachContextMenu(): void {
      if (this._cell && this._ctxHandler) {
        this._cell.removeEventListener('contextmenu', this._ctxHandler)
      }
      this._cell = null
    }

    // ── popups ──────────────────────────────────────────────────────────────
    /** Create the menu + submenu popups. Subclasses override to add their own. */
    protected ensurePopups(): void {
      if (this._menuPopup || isServer) return
      const scope = (): HTMLElement | null =>
        (this.closest('.mono-table, [mono-table]') as HTMLElement | null) ?? this

      this._menuPopup = new PopupPortalController(this, {
        // `:not(.mono-th-submenu)` is load-bearing: the submenu carries BOTH classes,
        // so once the main menu has been portaled OUT of the element a bare
        // `.mono-th-menu` lookup returns the submenu and overwrites the cache —
        // the real menu is then orphaned and never opens again.
        getPanel: () => {
          const el = this.renderRoot.querySelector(
            '.mono-th-menu:not(.mono-th-submenu)',
          ) as HTMLElement | null
          if (el) this._menuPanelEl = el
          return this._menuPanelEl
        },
        // Right-click anchors to the cell; opened from an icon there may be no
        // cell bound, so fall back to the element itself.
        getAnchor: () => this._cell ?? this,
        getStyleScope: scope,
        isOpen: () => this._menuOpen,
        side: () => 'bottom',
        align: () => 'start',
        offset: () => 2,
        flip: () => true,
        shift: () => true,
      })

      this._sortMenuPopup = new PopupPortalController(this, {
        getPanel: () => this.renderRoot.querySelector('.mono-th-submenu') as HTMLElement | null,
        // Cascade off the Sort row.
        getAnchor: () =>
          (this._menuPanelEl?.querySelector('[data-menu="sort"]') as HTMLElement | null) ??
          this._cell ??
          this,
        getStyleScope: scope,
        isOpen: () => this._sortMenuOpen,
        side: () => 'right',
        align: () => 'start',
        offset: () => 4,
        flip: () => true,
        shift: () => true,
      })
    }

    /** Open the header menu. Safe to wire straight to a click / contextmenu. */
    protected openMenu(e?: Event): void {
      if (isServer) return
      e?.preventDefault()
      e?.stopPropagation()
      this.ensurePopups()
      this._sortMenuOpen = false
      this._menuOpen = true
      this.bindDocListeners()
    }

    protected closeMenu(): void {
      this._menuOpen = false
      this._sortMenuOpen = false
      this.teardownDocListeners()
    }

    // ── outside-click / Escape ──────────────────────────────────────────────
    /**
     * Paths that must NOT dismiss the menu. Subclasses override to add their own
     * popups and trigger icons — without that, a trigger's own `pointerdown`
     * counts as "outside", closes the menu, and its click handler immediately
     * reopens it, so the toggle never shuts.
     */
    protected _menuKeepsPath(path: EventTarget[]): boolean {
      if (this._cell && path.includes(this._cell)) return true
      if (this._menuPopup?.containsInPath(path)) return true
      if (this._sortMenuPopup?.containsInPath(path)) return true
      return false
    }

    protected bindDocListeners(): void {
      if (this._onDocPointer || isServer) return
      this._onDocPointer = (e: Event): void => {
        if (this._menuKeepsPath((e as PointerEvent).composedPath())) return
        this.closeMenu()
      }
      this._onDocKey = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') this.closeMenu()
      }
      document.addEventListener('pointerdown', this._onDocPointer, true)
      document.addEventListener('keydown', this._onDocKey, true)
    }

    protected teardownDocListeners(): void {
      if (this._onDocPointer) document.removeEventListener('pointerdown', this._onDocPointer, true)
      if (this._onDocKey) document.removeEventListener('keydown', this._onDocKey, true)
      this._onDocPointer = undefined
      this._onDocKey = undefined
    }

    // ── icons ───────────────────────────────────────────────────────────────
    protected _caretIcon(): TemplateResult {
      return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z" />
      </svg>`
    }

    protected _sortGlyph(dir: 'asc' | 'desc' | 'clear'): TemplateResult {
      if (dir === 'asc') {
        return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M11 22h2V8.414h5.414L12 2L5.586 8.414H11z" />
        </svg>`
      }
      if (dir === 'desc') {
        return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M13 2h-2v13.586H5.586L12 22l6.414-6.414H13z" />
        </svg>`
      }
      return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>`
    }

    /** The "clear all sorting" glyph — a crossed-out circle. */
    protected _clearAllIcon(): TemplateResult {
      return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 2c1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.9 7.9 0 0 1 4 12a8 8 0 0 1 8-8m0 16a7.9 7.9 0 0 1-4.9-1.69L18.31 7.1A7.9 7.9 0 0 1 20 12a8 8 0 0 1-8 8"
        />
      </svg>`
    }

    protected _checkIcon(): TemplateResult {
      return html`<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>`
    }

    // ── render ──────────────────────────────────────────────────────────────
    /** The `Sort ›` row that cascades into {@link renderSortSubmenu}. */
    protected renderSortMenuItem(): TemplateResult {
      return html`
        <button
          type="button"
          class="mono-th-menu-item" mono-th-menu-item
          role="menuitem"
          data-menu="sort"
          aria-haspopup="true"
          @click=${() => {
            this.ensurePopups()
            this._sortMenuOpen = true
          }}
        >
          <span class="mono-th-menu-ic" mono-th-menu-ic>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path
                d="M10.73 13.79c.29.28.75.28 1.04 0l2.75-2.65a.75.75 0 1 0-1.04-1.08L12 11.486V2.75a.75.75 0 0 0-1.5 0v8.736L9.02 10.06a.75.75 0 1 0-1.04 1.08zM5.28 2.22a.75.75 0 0 0-1.06 0L1.47 4.97a.75.75 0 0 0 1.06 1.06L4 4.56v8.69a.75.75 0 0 0 1.5 0V4.56l1.47 1.47a.75.75 0 0 0 1.06-1.06z"
              />
            </svg>
          </span>
          <span class="mono-th-menu-label" mono-th-menu-label>Sort</span>
          <span class="mono-th-menu-caret" mono-th-menu-caret>${this._caretIcon()}</span>
        </button>
      `
    }

    /**
     * Apply a direction from the submenu, then close everything. The menu is the
     * multi-key path — `{ multi: true }` appends an unsorted column (pick order is
     * precedence) and drops just this one on `null`, leaving the other keys alone.
     * `sticky` is what makes the grid remember the gesture, so the arrows append
     * too from here on (until nothing is sorted any more).
     */
    protected async pickSort(order: SortOrder): Promise<void> {
      this.closeMenu()
      await this.dataGrid?.setSort(this.field, order, { multi: true, sticky: true })
    }

    /** Empty the whole sort, however many keys it holds. */
    protected async clearAllSorts(): Promise<void> {
      this.closeMenu()
      await this.dataGrid?.setSort(null)
    }

    /**
     * Ascending / Descending / Clear, then a grid-level **Clear all sorting**.
     * `noClear` drops this column's Clear row — that config means the column never
     * returns to unsorted on its own — but not Clear all, which is not about one
     * column and stays reachable from every header.
     */
    protected renderSortSubmenu(noClear = false): TemplateResult {
      const current = this._sortDir
      const sortCount = this.dataGrid?.sorts?.length ?? 0
      const row = (
        order: SortOrder,
        glyph: 'asc' | 'desc' | 'clear',
        label: string,
      ): TemplateResult => {
        // Only a DIRECTION can be the current state. `current === order` would also
        // mark Clear whenever the column is unsorted (both `null`), and a ticked
        // "Clear" reads as if clearing were already applied.
        const active = order !== null && current === order
        return html`
          <button
            type="button"
            class="mono-th-menu-item ${active ? 'active' : ''}" mono-th-menu-item
            ?mono-active=${active}
            role="menuitemradio"
            aria-checked=${active ? 'true' : 'false'}
            data-sort-pick=${glyph}
            @click=${() => this.pickSort(order)}
          >
            <span class="mono-th-menu-ic" mono-th-menu-ic>${this._sortGlyph(glyph)}</span>
            <span class="mono-th-menu-label" mono-th-menu-label>${label}</span>
            <span class="mono-th-menu-check" mono-th-menu-check>${active ? this._checkIcon() : nothing}</span>
          </button>
        `
      }
      return html`
        <div
          class="mono-th-menu mono-th-submenu ${this._sortMenuOpen ? 'open' : ''}" mono-th-menu mono-th-submenu
          ?mono-open=${this._sortMenuOpen}
          role="menu"
          aria-label="Sort"
        >
          ${row('asc', 'asc', 'Ascending')} ${row('desc', 'desc', 'Descending')}
          ${noClear ? nothing : row(null, 'clear', 'Clear')}
          <div class="mono-th-menu-sep" mono-th-menu-sep role="separator"></div>
          <button
            type="button"
            class="mono-th-menu-item" mono-th-menu-item
            role="menuitem"
            data-sort-pick="clear-all"
            ?disabled=${sortCount === 0}
            aria-disabled=${sortCount === 0 ? 'true' : 'false'}
            @click=${() => this.clearAllSorts()}
          >
            <span class="mono-th-menu-ic" mono-th-menu-ic>${this._clearAllIcon()}</span>
            <span class="mono-th-menu-label" mono-th-menu-label>Clear all sorting</span>
          </button>
        </div>
      `
    }
  }

  return MonoTableMenuCoreClass as unknown as Constructor<MonoTableMenuCoreInterface> & T
}
