// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import type {
  MonoColumnEl,
  MonoColumnSort,
  MonoColumnValue,
  MonoDateFilter,
  MonoEditableTrigger,
  MonoHeaderFilter,
  MonoHeaderFilterLoadOptions,
  SortOrder,
} from './mono-data-grid.js'
import {
  buildDateTree,
  checkState,
  minimize,
  seedFromRanges,
  setAllChecked,
  setChecked,
  type DateNode,
} from './date-filter-tree.js'
import { ariaSort, nextOrder, sortTitle } from './table-sort-utils.js'
import {
  MonoTableMenuCore,
  type MonoTableMenuCoreInterface,
  type MonoResolvedSort,
} from './table-menu-core.js'
import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { PopupPortalController } from '../../composables/popup-portal.js'

/** Slot regions the header cell lays out. */
export type TableThSlotName = 'label'
/** Per-build icon hook the header core delegates to. */
export type TableThIconName = 'chevron' | 'funnel'
/**
 * Horizontal alignment for a column's HEADER cell.
 *
 * Numeric columns are the reason this exists: their bodies are right-aligned by the consumer
 * while the caption stayed left, so every money column read as misaligned.
 */
export type TableThAlign = 'left' | 'center' | 'right'

/** Public surface added by the header-cell core mixin. */
export declare class MonoTableThCoreInterface extends MonoTableMenuCoreInterface {
  field: string
  caption: string
  sort?: boolean | MonoColumnSort
  editable: boolean
  editableTrigger?: MonoEditableTrigger
  required: boolean
  headerFilter: boolean | MonoHeaderFilter
  dateFilter: boolean | MonoDateFilter
  align?: TableThAlign
  width?: string | number
  height?: string | number
  protected renderSlot(name: TableThSlotName): TemplateResult
  protected renderIcon(name: TableThIconName): TemplateResult
  /** Active sort direction for this column, or null. Read by the builds' `renderIcon`. */
  protected get _current(): SortOrder
  /** Whether this column has an active header filter. Read by the builds' `renderIcon`. */
  protected get _filtered(): boolean
}

/** Coerce a size prop to a CSS length: a number or bare numeric string → px; anything with a unit (`'10rem'`, `'40%'`) is used as-is. */
function toCssSize(value: string | number): string {
  return typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))
    ? `${value}px`
    : String(value)
}

/**
 * `MonoTableThCore` — render-mode-agnostic logic for `mono-table-th`, the unified
 * column-header cell. It declares a column's `field`/`caption`, folds the sort
 * behavior into a single `:sort.prop` object (`{ order?, noClear?, disabled? }`),
 * marks a column editable (`editable`), and — with `header-filter` — adds a
 * DevExtreme-style **header filter**: a funnel icon (or the header's right-click
 * menu → "Header Filter") opens a panel of the column's distinct values (fetched
 * via the controller's `distinctValues`, i.e. an OData `$apply=groupby`) with
 * checkboxes; checking some + Apply calls `dataGrid.setColumnFilter(field, values)`.
 *
 * Gestures are fixed, not configurable, and both features split the same way: the
 * ICON (sort arrow / filter funnel) acts on ONE column, replacing whatever else
 * was sorted or filtered, while RIGHT-CLICK always opens the menu, whose `Sort ›`
 * / `Header Filter ›` rows combine columns. One carry-over: once the menu has
 * started a combination and something is still sorted / filtered, the icons
 * combine too — the grid remembers the gesture (`sortCombining` /
 * `columnFilterCombining`) until the last key / filter is gone.
 *
 * The standalone `mono-table-sort` element is unchanged and still supported.
 */
export const MonoTableThCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableThCoreClass extends MonoTableMenuCore(superClass) {
    /** Reads `monoDataGrid({ props: { th } })`. */
    protected override _propsSlot = 'th' as const

    constructor(...args: any[]) {
      super(...args)
      // `:editable-trigger` / `:editabletrigger` as Vue *property* bindings.
      // Only camelCase names may be listed — an already-lowercase name would
      // self-alias and recurse.
      defineHybridPropAliases(this, ['editableTrigger'])
    }

    /** Column key (data property). Omit to render a plain, non-sortable label. */
    @property({ type: String })
    field = ''

    /** Header text. Overrides the element's own (slotted) text content. */
    @property({ type: String })
    caption = ''

    /**
     * Sortable. `sort` / `sort="true"` / `:sort="true"` — or, for the options,
     * an object via `:sort.prop="{ order, index, noClear, … }"` / `props.th[].sort`
     * (`{}` is the same as `true`). `false` / omitted = not sortable. Presence
     * needs a `field`. See {@link MonoColumnSort}.
     *
     * `reflect` is safe with an object value: `booleanStringConverter.toAttribute`
     * coerces anything truthy to `''`, so the attribute is `sort=""`, never
     * `[object Object]` — the same arrangement `header-filter` uses.
     */
    @property({ attribute: 'sort', reflect: true, converter: booleanStringConverter })
    sort: boolean | MonoColumnSort = false

    /** The sort config as an object: `true` → `{}`, `false` → `undefined`. */
    protected get _sortObj(): MonoColumnSort | undefined {
      const s = this.sort
      if (s === true) return {}
      if (!s || typeof s !== 'object') return undefined
      return s
    }

    /** Whether this column's cells are editable. `editable` / `editable="true"` / `:editable="true"`. */
    @property({ reflect: true, converter: booleanStringConverter })
    editable = false

    /**
     * How a row's inline editor opens — `'click'` (default) or `'double-click'`.
     * `editable-trigger="double-click"` / `:editable-trigger="'click'"`.
     *
     * Opening a row is a TABLE-wide behaviour, so this writes through to the
     * shared controller (`dataGrid.editableTrigger`) and applies to every row.
     * Leave it unset to inherit `monoDataGrid(data, { editableTrigger })`; if two
     * header cells declare different values, the last one to update wins.
     */
    @property({ attribute: 'editable-trigger' })
    editableTrigger?: MonoEditableTrigger

    /**
     * Marks the column as one that wants input — a red `*` after the caption, the
     * same marker `mono-input` and friends draw for their own `required`.
     * `required` / `required="true"` / `:required="true"`.
     *
     * PRESENTATION ONLY — it does not make the column editable, `editable` does,
     * and it enforces nothing. They are separate so a column can be wired editable
     * without advertising it, and so the marker can sit on a column whose editing
     * the consumer drives themselves.
     *
     * The `*` is drawn INSIDE the caption group (see `_label`), not beside the
     * funnel, so it can never be split from the text when the header wraps.
     */
    @property({ reflect: true, converter: booleanStringConverter })
    required = false


    /**
     * Header filter for this column. `header-filter` / `:header-filter="true"`
     * (attribute) or an options object via `:header-filter.prop` /
     * `props.th[].headerFilter` — `{ enable, title, showIcon, type,
     * dataSourceOptions }`. See {@link MonoHeaderFilter}.
     *
     * `reflect` is safe with an object value: `booleanStringConverter.toAttribute`
     * coerces anything truthy to `''`, so the attribute is `header-filter=""`
     * rather than `[object Object]`.
     */
    @property({ attribute: 'header-filter', reflect: true, converter: booleanStringConverter })
    headerFilter: boolean | MonoHeaderFilter = false

    /**
     * Date filter for this column — the header filter's sibling for date /
     * datetime data, whose panel is a year → month → day → hour → minute → second
     * tree. `date-filter` / `:date-filter="true"` or an options object via
     * `:date-filter.prop` / `props.th[].dateFilter` — `{ enable, title, showIcon,
     * depth, utc, locale, dataSourceOptions }`. See {@link MonoDateFilter}. Not
     * together with `header-filter`: both set, this one wins and warns.
     */
    @property({ attribute: 'date-filter', reflect: true, converter: booleanStringConverter })
    dateFilter: boolean | MonoDateFilter = false

    /** The date tree built from the last `_loadValues()` (date filter only). */
    @state() private _tree: DateNode[] = []
    /** Expanded tree nodes (keys). Reset on every open. */
    @state() private _expanded = new Set<string>()
    private _exclusiveWarned = false

    /**
     * Column width — applied to the parent `<th>` (so it sizes the column; use
     * `mono-table-fixed` on the `<table>` for strict widths). A number is `px`;
     * a string is used verbatim (`'10rem'`, `'40%'`). `:width="160"` / `width="10rem"`.
     */
    @property()
    width?: string | number

    /**
     * Horizontal alignment of the header cell — applied to the parent `<th>`, the same way
     * `width` and `height` are.
     *
     * It exists because the body of a column is the CONSUMER's markup while the header is
     * mono's: a right-aligned money column had no way to say so in one place, so the caption
     * sat left above right-aligned figures. Declaring it on the column entry
     * (`props.th[].align`) now covers the header, and the same entry is what a consumer's own
     * `<td>` loop can read so both sides cannot drift.
     *
     * The header content is an `inline-flex` box in the light DOM, so `text-align` moves it.
     */
    @property({ reflect: true })
    align?: TableThAlign

    /** Header-cell height — applied to the parent `<th>`. Number → `px`, string used as-is. */
    @property()
    height?: string | number

    private _seededSort = false

    // ── Header-filter state ──────────────────────────────────────────────────
    // (`_menuOpen`, `_sortMenuOpen`, the popups, the contextmenu binding and the
    //  document listeners all live in `MonoTableMenuCore`.)
    @state() private _filterOpen = false
    @state() private _values: MonoColumnValue[] = []
    @state() private _checked = new Set<string>()
    @state() private _valuesLoading = false
    @state() private _valuesError = false
    @state() private _search = ''

    private _filterPopup?: PopupPortalController
    /** True when the panel was opened straight from the icon (no menu beside it). */
    @state() private _fromIcon = false

    override connectedCallback(): void {
      super.connectedCallback()
      this._register()
    }

    override disconnectedCallback(): void {
      this.dataGrid?.unregisterColumn(this as unknown as MonoColumnEl)
      super.disconnectedCallback() // menu core detaches the contextmenu + doc listeners
    }

    override willUpdate(changed: Map<string, unknown>): void {
      super.willUpdate(changed) // controller-core: (re)subscribe on dataGrid change
      // The controller arrives via `.prop` after the first render — (re)register
      // when it or the column identity changes.
      // `sort` too: the controller may deliver it after we first registered.
      if (changed.has('dataGrid') || changed.has('field') || changed.has('sort')) this._register()
    }

    private _register(): void {
      if (isServer || !this.dataGrid) return
      this.dataGrid.registerColumn(this as unknown as MonoColumnEl)
      this._seedSort()
    }

    /** Apply `sort.order` once, unless THIS column is already sorted (don't fight a user sort). */
    private _seedSort(): void {
      if (this._seededSort) return
      // Don't burn the once-only flag before there is a `sort` to seed FROM.
      // With `monoDataGrid({ props })` the config arrives from the controller a
      // microtask after `connectedCallback` registered us, so marking this
      // seeded on the first (empty) pass would silently drop `sort.order`.
      if (!this._sortObj) return
      this._seededSort = true
      const order = this._sortObj.order as SortOrder | undefined
      if (!order || !this.field) return
      // Guard on THIS field only, never on "is anything sorted": several columns
      // may each declare an `order` and they must COMBINE, so seeding takes the
      // `{ multi: true }` path (the same one the `Sort ›` menu uses) rather than
      // the arrow's single-key one. `sort.index` still pins the precedence.
      if (this._current) return
      void this.dataGrid?.setSort(this.field, order, { multi: true })
    }

    protected override updated(changed: Map<string, unknown>): void {
      super.updated(changed)
      if (isServer) return
      const cell = this.closest('th, td') as HTMLElement | null
      if (cell) {
        cell.setAttribute('aria-sort', ariaSort(this._current))
        // Size the column by sizing the parent header cell (reflect, like aria-sort).
        if (this.width != null && this.width !== '') cell.style.width = toCssSize(this.width)
        if (this.height != null && this.height !== '') cell.style.height = toCssSize(this.height)
        // Set AND cleared: a column whose `align` is removed must go back to the sheet default,
        // not keep the last value written onto the cell's inline style.
        cell.style.textAlign = this.align ?? ''
      }
      // Header filter: (re)bind the cell's contextmenu + reflect the active state.
      this._syncContextMenu()
      this.toggleAttribute('data-filtered', this._filtered)
      this._syncRowTrigger()
    }

    /**
     * Hand the controller the `<table>` that holds this grid's rows so it can
     * bind the click / double-click that opens a row's inline editor. Every
     * header cell calls in; `bindRowTrigger` is idempotent, so they collapse to
     * one listener. Only a th that declares its own `editable-trigger` writes the
     * shared setting, leaving `monoDataGrid({ editableTrigger })` in charge
     * otherwise.
     */
    private _syncRowTrigger(): void {
      const grid = this.dataGrid
      if (!grid?.bindRowTrigger) return
      if (this.editableTrigger && grid.editableTrigger !== this.editableTrigger) {
        grid.editableTrigger = this.editableTrigger
      }
      grid.bindRowTrigger(this.closest('table') as HTMLElement | null)
    }

    /**
     * The header-filter config with every default resolved, so no call site has to
     * re-test `headerFilter`'s shape. `true` → all defaults; an object implies
     * `enable: true` unless it says otherwise (config that silently does nothing
     * would be worse than useless).
     */
    protected get _hf(): Required<Omit<MonoHeaderFilter, 'dataSourceOptions'>> & {
      dataSourceOptions?: MonoHeaderFilterLoadOptions
      /** `true` when the panel is the DATE tree (`dateFilter`), not the value list. */
      date: boolean
    } {
      const df = this._df
      const raw = this.headerFilter
      const cfg: MonoHeaderFilter = raw && typeof raw === 'object' ? raw : {}
      const hfEnable = raw && typeof raw === 'object' ? cfg.enable !== false : !!raw
      if (df) {
        // The two are one feature with two panels — a column gets one of them.
        // The date filter wins (it is the more specific declaration), loudly.
        if (hfEnable && !this._exclusiveWarned) {
          this._exclusiveWarned = true
          console.warn(
            `[mono-table-th] "${this.field}" sets both headerFilter and dateFilter; they are exclusive — using dateFilter.`,
          )
        }
        return {
          enable: true,
          title: df.title ?? `Filter: ${this.caption || this.field}`,
          showIcon: df.showIcon !== false,
          dataSourceOptions: df.dataSourceOptions,
          date: true,
        }
      }
      return {
        enable: hfEnable,
        title: cfg.title ?? `Filter: ${this.caption || this.field}`,
        showIcon: cfg.showIcon !== false,
        dataSourceOptions: cfg.dataSourceOptions,
        date: false,
      }
    }

    /** The date-filter config when it is ON, with its defaults resolved; else `null`. */
    protected get _df(): (MonoDateFilter & { depth: NonNullable<MonoDateFilter['depth']>; utc: boolean }) | null {
      const raw = this.dateFilter
      const cfg: MonoDateFilter = raw && typeof raw === 'object' ? raw : {}
      const enable = raw && typeof raw === 'object' ? cfg.enable !== false : !!raw
      if (!enable) return null
      return { ...cfg, depth: cfg.depth ?? 'month', utc: cfg.utc === true }
    }

    /** The column's sort config with every default resolved. */
    protected get _sortCfg(): MonoResolvedSort {
      return this.resolveSort(this._sortObj)
    }

    /** Whether the sort arrow is drawn. Hidden → see `_sortHeader()`. */
    protected get _sortIcon(): boolean {
      return this._sortCfg.showIcon
    }

    protected get _sortable(): boolean {
      // `enable: false` removes the sort UI, same as omitting `sort` entirely.
      // NOTE: `disabled` also lands here today — it renders a plain label rather
      // than the inert affordance its docs describe. Left as-is (pre-existing).
      const sort = this._sortObj
      if (sort?.enable === false) return false
      return !!this.field && !!sort && !sort.disabled && !!this.dataGrid
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

    /**
     * True when THIS column currently has an active header filter. Read by
     * `updated()` (the `data-filtered` reflection, which drives the colour rules
     * in table.css) and by both builds' `renderIcon('funnel')`, which swaps the
     * outlined funnel for the filled one.
     *
     * Safe to read during `render()`: every subscribed element re-renders on the
     * controller's `notify()`, and `setColumnFilter` notifies BEFORE it reloads,
     * so the funnel flips with the click rather than with the response.
     */
    protected get _filtered(): boolean {
      return this._hf.enable && (this.dataGrid?.columnFilter?.(this.field)?.length ?? 0) > 0
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
     * The arrow (or, with `showIcon: false`, the caption). Single-key — this
     * column becomes the entire sort, collapsing any stack — UNLESS the user has
     * started combining from the right-click menu and something is still
     * sorted: then the arrow appends too, because a user who began a multi-key
     * sort means to keep building it (`sortCombining`). Cycling past `desc`
     * clears this column either way.
     */
    private _toggle(): void {
      if (!this._sortable) return
      void this.dataGrid?.setSort(this.field, nextOrder(this._current, this._sortObj?.noClear), {
        multi: !!this.dataGrid?.sortCombining?.(),
      })
    }

    /** Per-region slot content — overridden per build. */
    protected renderSlot(_name: TableThSlotName): TemplateResult {
      return html``
    }

    /**
     * Internal icon — light: a UnoCSS `i-*` class; shadow: inline SVG (utility CSS
     * can't reach a shadow root). Both glyphs encode state the override reads off
     * `this`: `'chevron'` the sort direction (`_current`), `'funnel'` whether the
     * column is filtered (`_filtered`).
     */
    protected renderIcon(_name: TableThIconName): TemplateResult {
      return html``
    }

    /**
     * The caption, plus the `required` marker when the column carries one.
     *
     * The marker sits in a WRAPPER around the label rather than inside it. Two
     * reasons, both load-bearing:
     *
     *  · `[data-mono-slot="label"]` must stay the exact element it has always been —
     *    the light build re-appends the consumer's captured nodes (and the Vue
     *    anchors travelling with them) into it after every render. Rendering into
     *    it as well would put Lit's own child part in the same range.
     *  · The header lays out as three independent boxes — funnel, caption, sort
     *    arrow — so a marker at that level drifts away from the text as soon as the
     *    header wraps. An inline-flex wrapper around label + `*` cannot be split.
     *
     * The wrapper is emitted ONLY for a marked column, so every other header keeps
     * the DOM it had. Plain text, so both builds render it from here — no per-build
     * icon hook, which is the whole point of a `*` over a glyph.
     */
    protected _label(): TemplateResult {
      const label = html`<span class="mono-table-sort-label" data-mono-slot="label"
        >${this.caption ? this.caption : this.renderSlot('label')}</span
      >`

      if (!this.required) return label

      return html`<span class="mono-th-caption" mono-th-caption
        >${label}<sup class="mono-th-required" mono-th-required>*</sup></span
      >`
    }

    /**
     * Label + sort arrow. Only the ARROW is a button — clicking the caption text
     * must not sort, so the label sits outside it. `_label()` keeps its
     * `[data-mono-slot="label"]` placeholder: the light build re-appends the
     * consumer's captured nodes (and their Vue anchors) into that exact element.
     */
    private _sortHeader(): TemplateResult {
      const current = this._current
      const seq = this._seq
      const total = this._sortCount
      const seqBadge =
        total > 1 && seq > 0
          ? html`<sup class="mono-table-sort-seq" mono-sort-seq aria-hidden="true">${seq}</sup>`
          : nothing

      if (!this._sortIcon) {
        // No arrow — the CAPTION becomes the single-sort trigger. Right-click
        // still reaches the `Sort ›` menu either way.
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
        `
      }

      return html`
        <span class="mono-table-sort-head" mono-sort-head>
          ${this._label()}
          <button
            type="button"
            class="mono-table-sort-btn" mono-sort-btn
            data-dir=${current ?? 'none'}
            title=${sortTitle(current, seq, total)}
            aria-label=${`Sort by ${this.caption || this.field}`}
            data-shimmer-ignore
            @click=${this._toggle}
          >
            <span class="mono-table-sort-ind" mono-sort-ind aria-hidden="true">${this.renderIcon('chevron')}</span>
            ${seqBadge}
          </button>
        </span>
      `
    }

    protected override render(): TemplateResult {
      const hf = this._hf
      const header = this._sortable ? this._sortHeader() : this._label()
      // The funnel leads the header row, so it sits LEFT of the caption. The menu
      // renders whenever either feature has a section to put in it.
      return html`${hf.enable && hf.showIcon ? this._renderFilterIcon() : nothing}${header}${this
        ._wantsMenu
        ? this._renderMenus()
        : nothing}`
    }

    /**
     * Whether right-click has anything to show. Sorting and the header filter each
     * contribute a section; a column with neither keeps the browser's own menu.
     */
    private get _wantsMenu(): boolean {
      return this._sortable || this._hf.enable
    }

    // ── contextmenu binding ──────────────────────────────────────────────────
    /**
     * Bind `contextmenu` whenever the menu has a section to show. Unconditional now
     * that the gesture is fixed, which is also what keeps a header filter with
     * `showIcon: false` reachable — it used to need a warned-about fallback.
     */
    private _syncContextMenu(): void {
      if (isServer) return
      this.bindContextMenu(this._wantsMenu)
    }

    // ── Header-filter: its own popup, on top of the shared menu ones ─────────
    protected override ensurePopups(): void {
      if (this._filterPopup || isServer) return
      super.ensurePopups() // menu + sort submenu
      const scope = (): HTMLElement | null =>
        (this.closest('.mono-table, [mono-table]') as HTMLElement | null) ?? this
      this._filterPopup = new PopupPortalController(this, {
        getPanel: () => this.renderRoot.querySelector('.mono-th-filter') as HTMLElement | null,
        // Opened from the icon there is no menu to cascade off, so anchor to the
        // icon itself and drop below it; via the menu, keep cascading to the right.
        getAnchor: () =>
          this._fromIcon
            ? ((this.renderRoot.querySelector('.mono-th-filter-ind') as HTMLElement | null) ?? this)
            : ((this._menuPanelEl?.querySelector('[data-menu="filter"]') as HTMLElement | null) ??
              this._cell ??
              this),
        getStyleScope: scope,
        isOpen: () => this._filterOpen,
        side: () => (this._fromIcon ? 'bottom' : 'right'),
        align: () => 'start',
        offset: () => 4,
        flip: () => true,
        shift: () => true,
      })
    }

    protected override openMenu(e?: Event): void {
      this._fromIcon = false
      this._filterOpen = false
      super.openMenu(e)
    }

    protected override closeMenu(): void {
      this._filterOpen = false
      this._fromIcon = false
      super.closeMenu()
    }

    /** Also keep the filter panel and the funnel from dismissing the menu. */
    protected override _menuKeepsPath(path: EventTarget[]): boolean {
      if (super._menuKeepsPath(path)) return true
      if (this._filterPopup?.containsInPath(path)) return true
      // The funnel is its own trigger, opening the panel with no menu in the flow.
      // Without this its pointerdown counts as "outside", closes the panel, and the
      // click handler reopens it — the toggle would never shut.
      const icon = this.renderRoot.querySelector('.mono-th-filter-ind')
      return !!icon && path.includes(icon)
    }

    private async _openFilter(): Promise<void> {
      // Keep the menu open beside the panel (cascade) — unless we came straight
      // from the icon, where there is no menu in the flow at all.
      this._menuOpen = !this._fromIcon
      this._filterOpen = true
      this._search = ''
      this._expanded = new Set()
      // Pre-check from the column's current filter. The date tree can only seed
      // once its nodes exist, so it does so after the load.
      const current = this.dataGrid?.columnFilter?.(this.field) ?? []
      this._checked = this._hf.date ? new Set() : new Set(current.map((v) => String(v)))
      await this._loadValues()
      if (this._hf.date) this._checked = seedFromRanges(this._tree, current)
    }

    /**
     * Left-click on the funnel — open the value panel DIRECTLY, skipping the
     * `Header Filter ›` row that right-click goes through. A visible click
     * affordance shouldn't need two steps.
     */
    private async _openFromIcon(e: MouseEvent): Promise<void> {
      if (isServer || !this._hf.enable) return
      e.preventDefault()
      e.stopPropagation() // don't let the header's sort/edit handlers see it
      if (this._filterOpen) {
        this.closeMenu()
        return
      }
      this.ensurePopups()
      this._fromIcon = true
      this.bindDocListeners()
      await this._openFilter()
    }

    private _renderFilterIcon(): TemplateResult {
      return html`
        <button
          type="button"
          class="mono-th-filter-ind" mono-th-filter-ind
          title=${this._hf.title}
          aria-label=${`Filter ${this.caption || this.field}`}
          data-shimmer-ignore
          @click=${this._openFromIcon}
        >
          ${this.renderIcon('funnel')}
        </button>
      `
    }

    /** (Re)fetch the column's distinct values (used on open and on Retry). */
    private async _loadValues(): Promise<void> {
      this._valuesError = false
      this._valuesLoading = true
      this._values = []
      this._tree = []
      try {
        this._values =
          (await this.dataGrid?.distinctValues?.(this.field, this._hf.dataSourceOptions)) ?? []
        const df = this._df
        if (df) this._tree = buildDateTree(this._values, { depth: df.depth, utc: df.utc, locale: df.locale })
      } catch {
        this._valuesError = true
      } finally {
        this._valuesLoading = false
      }
    }

    // ── date tree ────────────────────────────────────────────────────────────

    private _toggleNode(node: DateNode, on: boolean): void {
      this._checked = setChecked(node, on, this._checked, this._tree)
    }

    private _toggleExpand(key: string): void {
      const next = new Set(this._expanded)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      this._expanded = next
    }

    private _renderDateNodes(nodes: DateNode[], level: number, inheritedOn = false): TemplateResult {
      return html`
        <ul class="mono-th-tree" mono-th-tree role=${level === 0 ? 'tree' : 'group'}>
          ${nodes.map((n) => {
            const state = checkState(n, this._checked, undefined, inheritedOn)
            const open = this._expanded.has(n.key)
            const branch = n.children.length > 0
            return html`
              <li role="treeitem" aria-expanded=${branch ? (open ? 'true' : 'false') : nothing}>
                <div class="mono-th-tree-row" mono-th-tree-row data-level=${level} data-key=${n.key}>
                  <button
                    type="button"
                    class="mono-th-tree-toggle ${open ? 'open' : ''}" mono-th-tree-toggle
                    ?mono-open=${open}
                    ?hidden=${!branch}
                    tabindex=${branch ? 0 : -1}
                    aria-label=${open ? 'Collapse' : 'Expand'}
                    @click=${() => this._toggleExpand(n.key)}
                  >
                    ${this._caretIcon()}
                  </button>
                  <label class="mono-th-check" mono-th-check>
                    <input
                      type="checkbox"
                      .checked=${state === 'on'}
                      .indeterminate=${state === 'mixed'}
                      @change=${(e: Event) => this._toggleNode(n, (e.target as HTMLInputElement).checked)}
                    />
                    <span class="mono-th-check-box" mono-th-check-box></span>
                    <span class="mono-th-check-label" mono-th-check-label>${n.label}</span>
                    <span class="mono-th-check-count" mono-th-check-count>${n.count}</span>
                  </label>
                </div>
                ${branch && open ? this._renderDateNodes(n.children, level + 1, state === 'on') : nothing}
              </li>
            `
          })}
        </ul>
      `
    }

    private _renderDateTree(): TemplateResult {
      const roots = this._tree
      const allOn = roots.length > 0 && roots.every((r) => checkState(r, this._checked) === 'on')
      const anyOn = roots.some((r) => checkState(r, this._checked) !== 'off')
      return html`
        <label class="mono-th-check mono-th-check-all" mono-th-check mono-th-check-all>
          <input
            type="checkbox"
            .checked=${allOn}
            .indeterminate=${!allOn && anyOn}
            @change=${(e: Event) => (this._checked = setAllChecked(roots, (e.target as HTMLInputElement).checked))}
          />
          <span class="mono-th-check-box" mono-th-check-box></span>
          <span class="mono-th-check-label" mono-th-check-label>(Select all)</span>
          <span class="mono-th-check-count" mono-th-check-count>${roots.reduce((n, r) => n + r.count, 0)}</span>
        </label>
        ${this._renderDateNodes(roots, 0)}
      `
    }

    /**
     * Label for a distinct value. A column `map` relabels the list so it reads like
     * the table body — the checkbox still carries the RAW value, so
     * `setColumnFilter` keeps matching the real data.
     */
    private _display(value: unknown): string {
      const map = this.dataGrid?.columnMap?.(this.field)
      if (map) {
        try {
          const mapped = map(value, { [this.field]: value }, 0)
          if (mapped != null && mapped !== '') return String(mapped)
        } catch {
          /* a map written for whole rows may not survive a synthetic one — fall back */
        }
      }
      return value == null || value === '' ? '(Blanks)' : String(value)
    }

    /**
     * The figure shown beside `(Select all)`: the summed row count of the listed
     * values, so it lines up with each value's own count in the same column. Falls
     * back to the NUMBER of values when the source reports no counts (a consumer
     * `distinctValues` resolver may return bare values).
     */
    private _totalCount(list: MonoColumnValue[]): number {
      const sum = list.reduce((n, v) => n + (Number(v.count) || 0), 0)
      return sum > 0 ? sum : list.length
    }

    private _filteredValues(): MonoColumnValue[] {
      const q = this._search.trim().toLowerCase()
      if (!q) return this._values
      return this._values.filter((v) => this._display(v.value).toLowerCase().includes(q))
    }

    private _toggleValue(key: string, on: boolean): void {
      const next = new Set(this._checked)
      if (on) next.add(key)
      else next.delete(key)
      this._checked = next
    }

    private _toggleSelectAll(on: boolean): void {
      const next = new Set(this._checked)
      for (const v of this._filteredValues()) {
        const key = String(v.value)
        if (on) next.add(key)
        else next.delete(key)
      }
      this._checked = next
    }

    /**
     * Which way this panel was reached decides whether the filter COMBINES with the
     * other columns — the same split the sort arrow and `Sort ›` menu use: the
     * menu combines, the funnel replaces. With one carry-over: once the user has
     * started combining from the menu and something is still filtered, the
     * funnel combines too (`columnFilterCombining`) — a user who began a
     * multi-column filter means to keep building it. Read it BEFORE
     * `closeMenu()`, which resets `_fromIcon`.
     */
    private get _filterMulti(): boolean {
      return !this._fromIcon || !!this.dataGrid?.columnFilterCombining?.()
    }

    private async _apply(): Promise<void> {
      if (this._hf.date) {
        // The ticked periods, as few ranges as possible (a whole year is ONE range).
        const ranges = minimize(this._tree, this._checked)
        const multi = this._filterMulti
        const sticky = !this._fromIcon
        this.closeMenu()
        await this.dataGrid?.setColumnFilter?.(this.field, ranges, { multi, sticky })
        return
      }
      const selected = this._values.filter((v) => this._checked.has(String(v.value)))
      // What is ticked IS the filter. Nothing ticked clears it ("Clear" is the
      // explicit way); everything ticked used to clear it too — "all values is
      // no filter" — and that was wrong once the list cascades: after Country
      // is filtered the City list may hold ONE city, and ticking it (or
      // select-all) is the user narrowing to that city, not lifting the filter.
      // It silently reset every column to "no filter" instead. Applying the
      // ticked values verbatim is right in both cases: on a full list it
      // matches every row today (harmless, and shown as active), on a
      // narrowed one it is exactly the selection made.
      const values = selected.map((v) => v.value)
      const multi = this._filterMulti
      // Only the MENU starts the carry-over; a funnel that is merely following it
      // passes `multi` and leaves the memory as it is.
      const sticky = !this._fromIcon
      this.closeMenu()
      await this.dataGrid?.setColumnFilter?.(this.field, values, { multi, sticky })
    }

    private async _clear(): Promise<void> {
      this._checked = new Set()
      const multi = this._filterMulti
      const sticky = !this._fromIcon
      this.closeMenu()
      await this.dataGrid?.setColumnFilter?.(this.field, [], { multi, sticky })
    }

    /** Drop every column's header filter, however many are active. */
    private async _clearAllFilters(): Promise<void> {
      this._checked = new Set()
      this.closeMenu()
      // Single-column mode wipes the whole map, so one empty call clears the lot.
      await this.dataGrid?.setColumnFilter?.(this.field, [], { multi: false })
    }

    // (The document pointerdown/Escape listeners live in `MonoTableMenuCore`;
    //  `_menuKeepsPath` above adds this element's filter panel and funnel.)

    // ── Header-filter: render ────────────────────────────────────────────────

    private _retryIcon(): TemplateResult {
      return html`<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        <path
          d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
      </svg>`
    }

    /** Empty / error state with a Retry action below the message. */
    private _renderMessage(text: string): TemplateResult {
      return html`
        <div class="mono-th-filter-msg" mono-th-filter-msg>
          <div class="mono-th-filter-msg-text" mono-th-filter-msg-text>${text}</div>
          <button type="button" class="mono-th-retry" mono-th-retry @click=${() => this._loadValues()}>
            ${this._retryIcon()} Retry
          </button>
        </div>
      `
    }

    /**
     * The header menu (+ its cascading panels). The funnel itself is rendered by
     * `_renderFilterIcon()` BEFORE the caption; this only carries the popups.
     *
     * One section per enabled feature, with a separator between them when a column
     * has both.
     */
    private _renderMenus(): TemplateResult {
      const hf = this._hf
      const sortSection = this._sortable
      const filterSection = hf.enable
      return html`
        <div class="mono-th-menu ${this._menuOpen ? 'open' : ''}" mono-th-menu ?mono-open=${this._menuOpen} role="menu">
          ${sortSection ? this.renderSortMenuItem() : nothing}
          ${sortSection && filterSection ? html`<div class="mono-th-menu-sep" mono-th-menu-sep role="separator"></div>` : nothing}
          ${filterSection
            ? html`
                <button
                  type="button"
                  class="mono-th-menu-item" mono-th-menu-item
                  role="menuitem"
                  data-menu="filter"
                  aria-haspopup="true"
                  @click=${() => this._openFilter()}
                >
                  <span class="mono-th-menu-ic" mono-th-menu-ic>${this.renderIcon('funnel')}</span>
                  <span class="mono-th-menu-label" mono-th-menu-label>${this._hf.date ? 'Date Filter' : 'Header Filter'}</span>
                  <span class="mono-th-menu-caret" mono-th-menu-caret>${this._caretIcon()}</span>
                </button>
              `
            : nothing}
        </div>
        ${sortSection ? this.renderSortSubmenu(this._sortCfg.noClear) : nothing}
        ${hf.enable ? this._renderFilterPanel() : nothing}
      `
    }

    private _renderFilterPanel(): TemplateResult {
      const list = this._filteredValues()
      const allChecked = list.length > 0 && list.every((v) => this._checked.has(String(v.value)))
      // Via the FUNNEL the filter is single-column, so its "Clear" already drops
      // everything and a second button would be noise. Via the MENU the filter
      // combines, so that is the only place a one-shot "Clear all columns" is
      // needed — and only once ANOTHER column is filtered: with this column the
      // only one, "Clear" is the same action. It used to be rendered on every
      // menu-opened panel and merely disabled, which beside an empty value list
      // read as a statement about the ticks ("you haven't selected all") rather
      // than about the other columns. Absent when it has nothing to do, and
      // named for its scope with a count when it does.
      const multi = this._filterMulti
      const filteredColumns = this.dataGrid?.filteredColumns?.() ?? []
      const otherFiltered = filteredColumns.filter((f) => f !== this.field).length
      const clearAllCount = otherFiltered + (filteredColumns.includes(this.field) ? 1 : 0)
      return html`
        <div
          class="mono-th-filter ${this._filterOpen ? 'open' : ''} ${this._hf.date ? 'is-date' : ''}" mono-th-filter
          ?mono-open=${this._filterOpen}
          ?mono-date=${!!this._hf.date}
          role="dialog"
          aria-label=${this._hf.date ? 'Date filter' : 'Header filter'}
        >
          <div class="mono-th-filter-head" mono-th-filter-head>${this._hf.title}</div>
          ${this._hf.date
            ? nothing
            : html`
                <div class="mono-th-filter-search" mono-th-filter-search>
                  <input
                    type="text"
                    class="mono-th-filter-input" mono-th-filter-input
                    placeholder="Search…"
                    .value=${this._search}
                    @input=${(e: Event) => (this._search = (e.target as HTMLInputElement).value)}
                  />
                </div>
              `}
          <div class="mono-th-filter-list" mono-th-filter-list>
            ${this._valuesLoading
              ? html`<div class="mono-th-filter-msg" mono-th-filter-msg><span class="mono-th-filter-spin" mono-th-filter-spin></span>Loading…</div>`
              : this._valuesError
                ? this._renderMessage('Failed to load values.')
                : this._hf.date
                  ? this._tree.length === 0
                    ? this._renderMessage('No values.')
                    : this._renderDateTree()
                : list.length === 0
                  ? this._renderMessage('No values.')
                  : html`
                      <label class="mono-th-check mono-th-check-all" mono-th-check mono-th-check-all>
                        <input
                          type="checkbox"
                          .checked=${allChecked}
                          @change=${(e: Event) =>
                            this._toggleSelectAll((e.target as HTMLInputElement).checked)}
                        />
                        <span class="mono-th-check-box" mono-th-check-box></span>
                        <span class="mono-th-check-label" mono-th-check-label>(Select all)</span>
                        <span class="mono-th-check-count" mono-th-check-count>${this._totalCount(list)}</span>
                      </label>
                      ${list.map((v) => {
                        const key = String(v.value)
                        return html`
                          <label class="mono-th-check" mono-th-check>
                            <input
                              type="checkbox"
                              .checked=${this._checked.has(key)}
                              @change=${(e: Event) =>
                                this._toggleValue(key, (e.target as HTMLInputElement).checked)}
                            />
                            <span class="mono-th-check-box" mono-th-check-box></span>
                            <span class="mono-th-check-label" mono-th-check-label>${this._display(v.value)}</span>
                            <span class="mono-th-check-count" mono-th-check-count>${v.count}</span>
                          </label>
                        `
                      })}
                    `}
          </div>
          <div class="mono-th-filter-foot" mono-th-filter-foot>
            <button type="button" class="mono-th-filter-btn ghost" mono-th-filter-btn @click=${() => this._clear()}>
              Clear
            </button>
            ${multi && otherFiltered > 0
              ? html`
                  <button
                    type="button"
                    class="mono-th-filter-btn ghost" mono-th-filter-btn
                    data-action="clear-all"
                    title="Drop the header filter on every column (${clearAllCount})"
                    @click=${() => this._clearAllFilters()}
                  >
                    Clear all columns (${clearAllCount})
                  </button>
                `
              : nothing}
            <span class="mono-th-filter-foot-sp" mono-th-filter-foot-sp></span>
            <button type="button" class="mono-th-filter-btn ghost" mono-th-filter-btn @click=${() => this.closeMenu()}>
              Cancel
            </button>
            <button type="button" class="mono-th-filter-btn primary" mono-th-filter-btn @click=${() => this._apply()}>
              Apply
            </button>
          </div>
        </div>
      `
    }
  }

  return MonoTableThCoreClass as unknown as Constructor<MonoTableThCoreInterface> & T
}
