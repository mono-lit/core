// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import type { MonoSearchTerm } from './mono-data-grid.js'
import { mergeSearchFields, type MonoSearchValue } from '../../search/data-search.js'
import { PopupPortalController } from '../../composables/popup-portal.js'
import type {
  InputCssClass,
  InputColor,
  InputSize,
  InputValidationState,
  InputVariant,
} from '../input/input-types.js'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { cssPart } from '../../composables/css-class'
import {
  booleanStringConverter,
  numberStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'

/** Per-build icon hooks the search core delegates to. */
export type TableSearchIconName = 'search' | 'close' | 'chevron'

/** Public surface added by the search core mixin. */
export declare class MonoTableSearchCoreInterface extends MonoTableControllerCoreInterface {
  /** Fields a term matches — replaces `monoDataGrid({ searchExpr })`. */
  searchValue: MonoSearchValue
  /** Alias of {@link searchValue}, under the grid option's older name. */
  searchExpr: MonoSearchValue
  placeholder: string
  disabled: boolean
  debounce: number
  noIcon: boolean

  // mono-input parity
  size: InputSize
  color: InputColor
  variant: InputVariant
  readonly: boolean
  clearable: boolean
  autofocus: boolean
  label: string
  helperText: string
  validationState: InputValidationState
  validationMessage: string
  error: boolean
  errorMessage: string
  success: boolean
  successMessage: string
  name: string
  autocomplete: string
  inputmode: string
  minLength?: number
  maxLength?: number
  ariaLabelText?: string
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  cssClass: InputCssClass
  cssClassName: string

  focus(options?: FocusOptions): void
  blur(): void
  protected renderIcon(name: TableSearchIconName): TemplateResult
  protected _renderFilterSlotContent(): TemplateResult
  protected _onFilterSlotChange(e: Event): void
  protected _setFilterSlotted(value: boolean): void
  protected _filterPanelRoot(): ParentNode | null
}

/**
 * `MonoTableSearchCore` — render-mode-agnostic logic for `mono-table-search`: a
 * debounced search box wired to the controller.
 *
 * It renders **`mono-input`'s markup and class names** (`.mono-input` →
 * `.mono-input-field` → `.mono-input-native`) rather than a bespoke box, so the
 * whole size × color × variant matrix in `input.css` applies verbatim and a
 * search sitting beside a `<mono-input>` in a toolbar matches it exactly. That is
 * also why the prop names, attribute names and converters below mirror
 * `input-core.ts` — markup is portable between the two elements.
 *
 * Deliberately NOT taken from `InputProps`: `type` (pinned to `search`),
 * `required` / `pattern` / `min` / `max` / `step` (form-submit constraints with no
 * meaning for a filter), and `value` / `modelValue` — the debounce below plus the
 * controller own the search term.
 *
 * The magnifier and clear glyphs are delegated to `renderIcon()` (light: UnoCSS
 * `.mono-icon i-mdi-*`; shadow: inline SVG) so the chrome is otherwise identical.
 */
export const MonoTableSearchCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableSearchCoreClass extends MonoTableControllerCore(superClass) {
    /** Reads `monoDataGrid({ props: { search } })`. */
    protected override _propsSlot = 'search' as const

    constructor(...args: any[]) {
      super(...args)
      // camelCase names ONLY — an already-lowercase name self-aliases and recurses.
      defineHybridPropAliases(this, [
        'searchValue',
        'searchExpr',
        'multiContext',
        'suggestionTemplate',
        'allFieldsLabel',
        'maxChips',
        'moreLabel',
        'noIcon',
        'helperText',
        'validationState',
        'validationMessage',
        'errorMessage',
        'successMessage',
        'ariaLabelText',
        'minLength',
        'maxLength',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
        'cssClass',
      ])
    }

    /**
     * Which fields a typed term matches — declared next to the search box instead
     * of in `monoDataGrid({ searchExpr })`. Pushed into the bound controller via
     * `setSearchExpr`, so it **replaces** the controller's own option.
     *
     * Takes a comma string from markup or an array through a `.prop` binding, over
     * the same grammar the grid option uses (paths, `*` patterns, `{ field, custom }`):
     *
     * ```html
     * <mono-table-search search-value="Company.Name,Transaction.[*].Price,*.[*].*" />
     * ```
     * ```vue
     * <mono-table-search :search-value.prop="['Company.Name', '*.[*].*']" />
     * ```
     *
     * `searchExpr` / `search-expr` is the same prop under the grid's older name.
     */
    @property({ attribute: 'search-value' })
    searchValue: MonoSearchValue = ''

    /** Alias of {@link searchValue}, matching `monoDataGrid({ searchExpr })`. */
    @property({ attribute: 'search-expr' })
    searchExpr: MonoSearchValue = ''

    @property({ type: String })
    placeholder = 'Search…'

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    /** Debounce (ms) before calling `setSearch`. Default 300. */
    @property({ converter: numberStringConverter })
    debounce = 300

    @property({ attribute: 'no-icon', reflect: true, converter: booleanStringConverter })
    noIcon = false

    // ── mono-input parity ────────────────────────────────────────────────────
    @property({ type: String })
    size: InputSize = 'md'

    @property({ type: String })
    color: InputColor = 'primary'

    @property({ type: String })
    variant: InputVariant = 'outlined'

    @property({ reflect: true, converter: booleanStringConverter })
    readonly = false

    @property({ reflect: true, converter: booleanStringConverter })
    clearable = false

    @property({ reflect: true, converter: booleanStringConverter })
    autofocus = false

    @property({ type: String })
    label = ''

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    @property({ type: String, attribute: 'validation-state' })
    validationState: InputValidationState = 'default'

    @property({ type: String, attribute: 'validation-message' })
    validationMessage = ''

    @property({ reflect: true, converter: booleanStringConverter })
    error = false

    @property({ type: String, attribute: 'error-message' })
    errorMessage = ''

    @property({ reflect: true, converter: booleanStringConverter })
    success = false

    @property({ type: String, attribute: 'success-message' })
    successMessage = ''

    @property({ type: String })
    name = ''

    @property({ type: String })
    autocomplete = ''

    @property({ type: String })
    inputmode = ''

    @property({ attribute: 'min-length', converter: numberStringConverter })
    minLength?: number

    @property({ attribute: 'max-length', converter: numberStringConverter })
    maxLength?: number

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ type: String })
    width?: CssSizeValue

    @property({ type: String })
    height?: CssSizeValue

    @property({ type: String, attribute: 'min-width' })
    minWidth?: CssSizeValue

    @property({ type: String, attribute: 'max-width' })
    maxWidth?: CssSizeValue

    @property({ type: String, attribute: 'min-height' })
    minHeight?: CssSizeValue

    @property({ type: String, attribute: 'max-height' })
    maxHeight?: CssSizeValue

    /** Per-part class overrides — same keys as `mono-input`'s `cssClass`. */
    @property({ attribute: false })
    cssClass: InputCssClass = {}

    @property({ type: String, attribute: 'css-class' })
    cssClassName = ''

    /**
     * Show a suggestion dropdown under the field — one row per registered
     * `mono-table-th`, plus an "all fields" row. `suggestion` / `:suggestion="true"`.
     */
    @property({ reflect: true, converter: booleanStringConverter })
    suggestion = false

    /**
     * Turn each accepted suggestion into a removable **chip**, so several search
     * terms stack. `multi-context` / `:multiContext="true"`.
     *
     * Terms group by column: OR within a column, AND across columns — so two chips
     * on Name widen, and adding one on Code narrows.
     */
    @property({ attribute: 'multi-context', reflect: true, converter: booleanStringConverter })
    multiContext = false

    /** Suggestion wording. `{caption}` / `{term}` are substituted. */
    @property({ attribute: 'suggestion-template' })
    suggestionTemplate = 'Search {caption} for: {term}'

    /** Label of the leading "every column" suggestion row. */
    @property({ attribute: 'all-fields-label' })
    allFieldsLabel = 'All fields'

    /**
     * Max context chips rendered inline inside the field; the rest collapse into
     * a clickable `${moreLabel}` chip whose panel lists them. `0` shows none
     * inline (only the trigger chip); a large value shows all (no collapse).
     * `max-chips` / `:maxChips="1"`.
     */
    @property({ attribute: 'max-chips', converter: numberStringConverter })
    maxChips = 1

    /** Label of the chip that opens the overflow panel. `more-label` / `:moreLabel="..."`. */
    @property({ attribute: 'more-label' })
    moreLabel = 'See All'

    /**
     * Label of the filter chip rendered when a slotted
     * `<mono-filter-builder slot="filter-builder">` applies its filter with
     * `multi-context` on. `filter-label` / `:filterLabel="..."`.
     */
    @property({ attribute: 'filter-label' })
    filterLabel = 'Filter'

    @state()
    private _value = ''

    /** Committed chips (only used with `multiContext`). */
    @state() private _chips: MonoSearchTerm[] = []
    @state() private _open = false
    @state() private _activeIndex = 0
    /** Which zone the keyboard is in — mirrors `mono-dropdown-table`'s panel nav. */
    @state() private _zone: 'input' | 'list' = 'input'
    /** Whether the "See All" overflow panel is open. */
    @state() private _moreOpen = false
    /** Whether the chips strip is being mouse-drag-scrolled (toggles `grabbing`). */
    @state() private _chipsDragging = false
    /** Whether a `<mono-filter-builder slot="filter-builder">` is slotted. */
    @state() private _filterSlotted = false
    /** Whether the slotted filter-builder panel is open (chevron toggle). */
    @state() private _filterOpen = false
    /** The active filter chip ({@link filterLabel} + the OData string), when applied with multi-context. */
    @state() private _filterChip: { label: string; string: string } | null = null

    private _tabHeld = false
    private _tabConsumed = false
    private _popup?: PopupPortalController
    protected _filterPopup?: PopupPortalController
    private _onDocPointer?: (e: Event) => void
    private _onMoreDocPointer?: (e: Event) => void
    private _onFilterDocPointer?: (e: Event) => void
    /** Drag-to-scroll bookkeeping for the inline chips strip. */
    private _chipsDragId: number | null = null
    private _chipsDragStartX = 0
    private _chipsDragStartScroll = 0
    private _chipsDragMoved = false

    @query('.mono-input-native')
    private _inputEl?: HTMLInputElement

    private _timer?: ReturnType<typeof setTimeout>

    override disconnectedCallback(): void {
      if (this._timer) clearTimeout(this._timer)
      this._teardownDocListener()
      this._teardownMoreDocListener()
      this._teardownFilterDocListener()
      this._detachChipsSwallow()
      super.disconnectedCallback()
    }

    /** The last field list handed to the controller, so we only push on change. */
    private _pushedFields?: string

    override willUpdate(changed: Map<string, unknown>): void {
      // Chain: the base mixin re-subscribes here when `dataGrid` changes.
      super.willUpdate(changed)
      if (
        changed.has('searchValue') ||
        changed.has('searchExpr') ||
        changed.has('dataGrid')
      ) {
        this._pushSearchFields()
      }
    }

    /**
     * Hand the declared fields to the controller.
     *
     * Only pushes when something was actually declared — an untouched element must
     * not clobber `monoDataGrid({ searchExpr })` with an empty list. The
     * stringified guard matters because `_applyControllerProps` re-applies
     * `props.search` on every controller notify, and `setSearchExpr` re-runs the
     * live query: without it, searching would loop.
     */
    private _pushSearchFields(): void {
      const grid = this.dataGrid
      // `setSearchValue` is the canonical name; `setSearchExpr` is its alias and
      // is what an older controller object would carry.
      const setFields = grid?.setSearchValue ?? grid?.setSearchExpr
      if (!grid || typeof setFields !== 'function') return
      const entries = mergeSearchFields(this)
      if (!entries?.length) return
      const key = JSON.stringify(entries.map((e) => (typeof e === 'string' ? e : e.field)))
      if (key === this._pushedFields) return
      this._pushedFields = key
      void setFields.call(grid, entries)
    }

    /**
     * Delegate focus to the inner `<input>` — `@query` resolves against
     * `renderRoot`, so this reaches the input in BOTH builds (light: the host
     * itself; shadow: the shadow root). Consumers (e.g. `<mono-dropdown-table>`
     * auto-focusing its search region) can then just call `el.focus()` without
     * having to know which build they hold or reach across a shadow boundary.
     */
    public override focus(options?: FocusOptions): void {
      this._inputEl?.focus(options)
    }

    public override blur(): void {
      this._inputEl?.blur()
    }

    // ── search terms ─────────────────────────────────────────────────────────
    /** Everything currently searched: committed chips plus the live input. */
    private _terms(extra?: MonoSearchTerm): MonoSearchTerm[] {
      const out = [...this._chips]
      if (extra) out.push(extra)
      else if (this._value && !this.multiContext) out.push({ value: this._value })
      return out
    }

    private _push(value: string): void {
      const grid = this.dataGrid
      if (!grid) return
      // With chips the live text is only a draft — it searches once committed.
      if (this.multiContext) {
        void grid.setSearchTerms?.(this._chips)
        return
      }
      if (typeof grid.setSearchTerms === 'function') void grid.setSearchTerms([{ value }].filter((t) => t.value))
      else void grid.setSearch(value)
    }

    /** Suggestion rows: an all-columns row, then one per registered `mono-table-th`. */
    private _suggestions(): Array<{ field?: string; caption: string }> {
      const grid = this.dataGrid
      if (!grid || typeof grid.registeredColumns !== 'function') return []
      // Read at render time — header cells register on their own connectedCallback,
      // so a list captured earlier would be empty or stale.
      const cols = grid
        .registeredColumns()
        .filter((c) => !!c.field)
        .map((c) => ({ field: c.field, caption: c.caption || c.field }))
      return [{ caption: this.allFieldsLabel }, ...cols]
    }

    private _suggestionLabel(s: { field?: string; caption: string }): string {
      if (!s.field) return `${this.allFieldsLabel}: ${this._value}`
      return this.suggestionTemplate.replace('{caption}', s.caption).replace('{term}', this._value)
    }

    private get _canSuggest(): boolean {
      return this.suggestion && !this.disabled && !this.readonly && !!this._value
    }

    private _openPanel(): void {
      if (isServer || !this._canSuggest) return
      this._closeMore()
      this._closeFilter()
      this._ensurePopup()
      // First row active on open — so Enter always has a target and can never
      // commit a context-less chip.
      this._activeIndex = 0
      this._zone = 'input'
      this._open = true
      this._bindDocListener()
    }

    private _closePanel(): void {
      this._open = false
      this._zone = 'input'
      this._tabHeld = false
      this._teardownDocListener()
    }

    /** Accept the active suggestion: chip it (multiContext) or search it directly. */
    private _acceptActive(): void {
      const list = this._suggestions()
      const s = list[this._activeIndex]
      if (!s || !this._value) return
      const term: MonoSearchTerm = s.field ? { value: this._value, field: s.field } : { value: this._value }

      if (this.multiContext) {
        this._chips = [...this._chips, term]
        this._value = ''
        if (this._inputEl) this._inputEl.value = ''
        if (this._timer) clearTimeout(this._timer)
        void this.dataGrid?.setSearchTerms?.(this._chips)
      } else {
        if (this._timer) clearTimeout(this._timer)
        void this.dataGrid?.setSearchTerms?.([term])
      }
      this._closePanel()
      this._inputEl?.focus()
    }

    private _removeChip(index: number): void {
      this._chips = this._chips.filter((_, i) => i !== index)
      void this.dataGrid?.setSearchTerms?.(this._chips)
      // Removing a chip can empty the overflow slice — drop the panel so it
      // never lingers open with nothing to show.
      if (!this._overflowChips.length) this._closeMore()
      this._inputEl?.focus()
    }

    /**
     * Drag-to-scroll for the inline chips strip. `overflow-x: auto` scrolls with
     * wheel / touch, but a desktop mouse has no native drag there — so a press on
     * the strip (not on an interactive control) captures the pointer and drags
     * `scrollLeft`. A small threshold separates a drag from a click, and the
     * click that follows a real drag is swallowed so a button under the release
     * point never fires.
     */
    private _onChipsPointerDown = (e: PointerEvent): void => {
      if (e.button !== 0) return
      const strip = e.currentTarget as HTMLElement
      // Nothing to scroll, or the press is on the remove / "See All" buttons.
      if (strip.scrollWidth <= strip.clientWidth) return
      if ((e.target as HTMLElement).closest('button')) return
      this._chipsDragId = e.pointerId
      this._chipsDragStartX = e.clientX
      this._chipsDragStartScroll = strip.scrollLeft
      this._chipsDragMoved = false
      try {
        strip.setPointerCapture?.(e.pointerId)
      } catch {
        /* ignore — capture is best-effort */
      }
      strip.addEventListener('pointermove', this._onChipsPointerMove)
      strip.addEventListener('pointerup', this._onChipsPointerUp)
      strip.addEventListener('pointercancel', this._onChipsPointerUp)
    }

    private _onChipsPointerMove = (e: PointerEvent): void => {
      if (e.pointerId !== this._chipsDragId) return
      const strip = e.currentTarget as HTMLElement
      const dx = e.clientX - this._chipsDragStartX
      if (!this._chipsDragMoved) {
        if (Math.abs(dx) < 5) return
        this._chipsDragMoved = true
        this._chipsDragging = true
      }
      strip.scrollLeft = this._chipsDragStartScroll - dx
      e.preventDefault()
    }

    private _onChipsPointerUp = (e: PointerEvent): void => {
      const strip = e.currentTarget as HTMLElement
      if (e.pointerId === this._chipsDragId) {
        try {
          if (strip.hasPointerCapture?.(e.pointerId)) strip.releasePointerCapture?.(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      strip.removeEventListener('pointermove', this._onChipsPointerMove)
      strip.removeEventListener('pointerup', this._onChipsPointerUp)
      strip.removeEventListener('pointercancel', this._onChipsPointerUp)
      this._chipsDragId = null
      // Swallow the click that follows a real drag so a button under the release
      // point never fires.
      if (this._chipsDragMoved) {
        // Detach any swallow left over from a previous drag before arming another.
        // The listener used to remove itself ONLY when a click actually followed;
        // a drag that ended without one (released outside, pointercancel from a
        // scroll gesture, the strip re-rendered under the pointer) left it bound
        // AND left `_chipsDragging` / `_chipsDragMoved` latched true, so the next
        // click was swallowed for no reason and every further drag stacked another.
        this._detachChipsSwallow()
        const swallow = (ev: Event): void => {
          ev.preventDefault()
          ev.stopPropagation()
          this._chipsDragMoved = false
          this._chipsDragging = false
          this._detachChipsSwallow()
        }
        this._chipsSwallow = { strip, fn: swallow }
        strip.addEventListener('click', swallow, true)
      } else {
        this._chipsDragging = false
      }
    }

    /** The armed drag-swallow listener, so it can be removed unconditionally. */
    private _chipsSwallow: { strip: HTMLElement; fn: (ev: Event) => void } | null = null

    protected _detachChipsSwallow(): void {
      if (!this._chipsSwallow) return
      this._chipsSwallow.strip.removeEventListener('click', this._chipsSwallow.fn, true)
      this._chipsSwallow = null
    }

    private _handleInput(event: Event): void {
      const value = (event.currentTarget as HTMLInputElement).value
      this._value = value
      if (value && this.suggestion) this._openPanel()
      else if (!value) this._closePanel()
      if (this._timer) clearTimeout(this._timer)
      this._timer = setTimeout(() => this._push(value), Math.max(0, Number(this.debounce) || 0))
    }

    // ── keyboard ─────────────────────────────────────────────────────────────
    /**
     * Same model as `mono-dropdown-table`'s panel nav, so the two feel identical:
     * Tab is swallowed on keydown (a following arrow must not be preceded by a
     * stray focus move), Tab+↓ enters the list, Tab+↑ returns to the input, and a
     * plain Tab tap toggles the two on release. Arrows only move the active row
     * while the list has focus, so the input keeps its caret keys.
     */
    private _onKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this._filterOpen && !this._open) {
        e.preventDefault()
        this._closeFilter()
        return
      }
      if (e.key === 'Escape' && this._moreOpen && !this._open) {
        e.preventDefault()
        this._closeMore()
        return
      }

      if (!this._open) return

      if (e.key === 'Escape') {
        e.preventDefault()
        this._closePanel()
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        if (!e.repeat) {
          this._tabHeld = true
          this._tabConsumed = false
        }
        return
      }

      if (this._tabHeld && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        this._tabConsumed = true
        this._zone = e.key === 'ArrowDown' ? 'list' : 'input'
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (this._zone !== 'list') return // the input keeps its caret keys
        e.preventDefault()
        const n = this._suggestions().length
        if (!n) return
        const step = e.key === 'ArrowDown' ? 1 : -1
        this._activeIndex = (this._activeIndex + step + n) % n
        return
      }

      if (e.key === 'Enter') {
        // Enter ALWAYS goes through a suggestion while the panel is open, so a bare
        // Enter can never create a context-less chip.
        e.preventDefault()
        this._acceptActive()
      }
    }

    private _onKeyup = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab' || !this._tabHeld) return
      this._tabHeld = false
      if (this._tabConsumed) return
      this._zone = this._zone === 'input' ? 'list' : 'input'
    }

    // ── popup ────────────────────────────────────────────────────────────────
    private _ensurePopup(): void {
      if (this._popup || isServer) return
      this._popup = new PopupPortalController(this, {
        getPanel: () => this.renderRoot.querySelector('.mono-table-search-panel') as HTMLElement | null,
        getAnchor: () => (this.renderRoot.querySelector('.mono-input-field') as HTMLElement | null) ?? this,
        // The portal mirrors this element's CLASS onto its host, which is what
        // puts the `--mono-table-*` block in scope for the panel. Unlike the
        // header-filter menus, a search box usually sits in a toolbar OUTSIDE
        // the table, so `.mono-table` is often absent — fall back to our own
        // wrapper, which carries `mono-table-search` (a selector in that same
        // var block). The host element itself has no class, so returning it
        // would leave every colour unresolved and paint the panel transparent.
        getStyleScope: () =>
          (this.closest('.mono-table, [mono-table]') as HTMLElement | null) ??
          (this.renderRoot.querySelector('.mono-table-search') as HTMLElement | null) ??
          this,
        isOpen: () => this._open,
        side: () => 'bottom',
        align: () => 'start',
        offset: () => 4,
        flip: () => true,
        shift: () => true,
        matchWidth: true,
      })
    }

    private _bindDocListener(): void {
      if (this._onDocPointer || isServer) return
      this._onDocPointer = (e: Event): void => {
        const path = (e as PointerEvent).composedPath()
        if (path.includes(this)) return
        if (this._popup?.containsInPath(path)) return
        this._closePanel()
      }
      document.addEventListener('pointerdown', this._onDocPointer, true)
    }

    private _teardownDocListener(): void {
      if (this._onDocPointer) document.removeEventListener('pointerdown', this._onDocPointer, true)
      this._onDocPointer = undefined
    }

    /**
     * Clearing is an explicit act, so it skips the debounce — the grid resets to
     * the unfiltered rows immediately rather than after a dangling timer.
     */
    private _handleClear(): void {
      if (this.disabled || this.readonly) return
      if (this._timer) clearTimeout(this._timer)
      this._value = ''
      if (this._inputEl) this._inputEl.value = ''
      this._push('')
      this._inputEl?.focus()
    }

    /** Mirrors `input-core`'s resolution: an explicit state wins, else error/success. */
    private get _resolvedValidationState(): InputValidationState {
      if (this.validationState && this.validationState !== 'default') return this.validationState
      if (this.error || this.errorMessage) return 'invalid'
      if (this.success || this.successMessage) return 'valid'
      return 'default'
    }

    private _cls(base: string, key: keyof InputCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    /** Modifier classes shared by the wrapper and the field (see `input-core`). */
    private get _stateClasses(): string {
      const hasSuffix = (this.clearable && !!this._value) || this._filterSlotted
      return [
        this.size,
        this.color,
        this.variant,
        this.disabled ? 'disabled' : '',
        this.readonly ? 'readonly' : '',
        this._resolvedValidationState !== 'default' ? `is-${this._resolvedValidationState}` : '',
        this.noIcon ? '' : 'has-prefix',
        hasSuffix ? 'has-suffix' : '',
        this._value ? 'has-value' : '',
      ]
        .filter(Boolean)
        .join(' ')
    }

    private get _wrapperClasses(): string {
      return ['mono-input', 'mono-table-search', this._stateClasses, this.cssClassName, this.cssClass?.root]
        .filter(Boolean)
        .join(' ')
    }

    private get _fieldClasses(): string {
      return [this._cls('mono-input-field', 'field'), this._stateClasses].filter(Boolean).join(' ')
    }

    /** Internal icon — light: UnoCSS `.mono-icon`; shadow: inline SVG. */
    protected renderIcon(_name: TableSearchIconName): TemplateResult {
      return html``
    }

    private _renderLabel(): TemplateResult | typeof nothing {
      if (!this.label) return nothing
      return html`<label class=${this._cls('mono-input-label', 'label')} mono-label>${this.label}</label>`
    }

    private _renderMessage(): TemplateResult | typeof nothing {
      const base = this._cls('mono-input-message', 'message')
      const wrap = (state: string, text: string) =>
        html`<div mono-message-wrap><div class=${`${base} ${state}`} mono-message=${state}>${text}</div></div>`
      if (this.validationMessage) return wrap(this._resolvedValidationState, this.validationMessage)
      if (this.errorMessage) return wrap('invalid', this.errorMessage)
      if (this.successMessage) return wrap('valid', this.successMessage)
      if (this.helperText) return wrap('helper', this.helperText)
      return nothing
    }

    private _renderClear(): TemplateResult | typeof nothing {
      if (!(this.clearable && this._value && !this.disabled && !this.readonly)) return nothing
      return html`
        <button
          type="button"
          class=${this._cls('mono-input-clear', 'clear')}
          mono-clear
          aria-label="Clear search"
          @click=${this._handleClear}
        >
          ${this.renderIcon('close')}
        </button>
      `
    }

    /** Sanitized inline-chip limit (>= 0) or `Infinity` when collapsing is off. */
    private get _maxChips(): number {
      const n = Math.floor(Number(this.maxChips))
      if (!Number.isFinite(n) || n < 0) return Infinity
      return n
    }

    /** Chips beyond the inline limit — the ones the "See All" panel lists. */
    private get _overflowChips(): MonoSearchTerm[] {
      const max = this._maxChips
      return max === Infinity ? [] : this._chips.slice(max)
    }

    /** Render one removable chip at its true index in `_chips`. */
    private _renderOneChip(t: MonoSearchTerm, index: number): TemplateResult {
      return html`
        <span class="mono-table-search-chip" mono-search-chip data-chip=${t.field ?? '*'}>
          ${t.field
            ? html`<span class="mono-table-search-chip-ctx" mono-search-chip-ctx>${this._captionOf(t.field)}:</span>`
            : nothing}
          <span class="mono-table-search-chip-text" mono-search-chip-text>${t.value}</span>
          <button
            type="button"
            class="mono-table-search-chip-x" mono-search-chip-x
            aria-label=${`Remove ${t.value}`}
            @click=${() => this._removeChip(index)}
          >
            ${this.renderIcon('close')}
          </button>
        </span>
      `
    }

    /**
     * Committed chips, rendered inside the field ahead of the input. Only the
     * first `maxChips` show inline; the rest collapse into a `${moreLabel}`
     * trigger chip so a long filter list never stretches the input. Clicking it
     * opens `_renderMorePanel`.
     */
    private _renderChips(): TemplateResult | typeof nothing {
      if (!this.multiContext || (!this._chips.length && !this._filterChip)) return nothing
      const max = this._maxChips
      const inline = max === Infinity ? this._chips : this._chips.slice(0, max)
      const overflow = this._overflowChips
      return html`
        <span
          class="mono-table-search-chips ${this._chipsDragging ? 'is-grabbing' : ''}" mono-search-chips
          @pointerdown=${this._onChipsPointerDown}
        >
          ${this._filterChip ? this._renderFilterChip() : nothing}
          ${inline.map((t, i) => this._renderOneChip(t, i))}
          ${overflow.length
            ? html`
                <button
                  type="button"
                  class="mono-table-search-chip mono-table-search-chip-more ${this._moreOpen
                    ? 'open'
                    : ''}" mono-search-chip mono-search-chip-more
                  aria-haspopup="true"
                  aria-expanded=${this._moreOpen ? 'true' : 'false'}
                  @click=${(e: Event) => {
                    e.stopPropagation()
                    this._toggleMore()
                  }}
                >
                  <span class="mono-table-search-chip-text" mono-search-chip-text>${this.moreLabel}</span>
                  <span class="mono-table-search-chip-count" mono-search-chip-count>${overflow.length}</span>
                </button>
              `
            : nothing}
        </span>
      `
    }

    private _captionOf(field: string): string {
      return this._suggestions().find((s) => s.field === field)?.caption ?? field
    }

    /** The overflow panel — lists the chips that did not fit inline. */
    private _renderMorePanel(): TemplateResult | typeof nothing {
      const overflow = this._overflowChips
      if (!this._moreOpen || !overflow.length) return nothing
      const max = this._maxChips
      return html`
        <div class="mono-table-search-more-panel" mono-search-more-panel role="dialog" aria-label=${this.moreLabel}>
          ${overflow.map((t, i) => this._renderOneChip(t, max + i))}
        </div>
      `
    }

    private _toggleMore(): void {
      if (this._moreOpen) {
        this._closeMore()
        return
      }
      // The two panels never share the field — opening the chip list closes the
      // suggestion list (and vice versa via `_openPanel`).
      this._closePanel()
      this._closeFilter()
      this._moreOpen = true
      this._bindMoreDocListener()
    }

    private _closeMore(): void {
      if (!this._moreOpen) return
      this._moreOpen = false
      this._teardownMoreDocListener()
    }

    private _bindMoreDocListener(): void {
      if (this._onMoreDocPointer || isServer) return
      this._onMoreDocPointer = (e: Event): void => {
        const path = (e as PointerEvent).composedPath()
        if (path.includes(this)) return
        this._closeMore()
      }
      document.addEventListener('pointerdown', this._onMoreDocPointer, true)
    }

    private _teardownMoreDocListener(): void {
      if (this._onMoreDocPointer)
        document.removeEventListener('pointerdown', this._onMoreDocPointer, true)
      this._onMoreDocPointer = undefined
    }

    // ── slotted filter-builder ────────────────────────────────────────────────
    /**
     * A `<mono-filter-builder slot="filter-builder">` joins the search: a
     * chevron in the field toggles its panel, and its `mno-apply` either renders
     * one filter chip (multi-context) or filters the grid directly.
     *
     * Projection differs per build: the light build can't use `<slot>` (it
     * renders into the host, not a shadow root), so it captures the child and
     * moves it into the `[data-mono-slot]` placeholder rendered by
     * `_renderFilterSlotContent`; the shadow build overrides that hook to render
     * a native `<slot>` and detects content via `_onFilterSlotChange`.
     */
    protected _setFilterSlotted(value: boolean): void {
      this._filterSlotted = value
    }

    protected _onFilterSlotChange(e: Event): void {
      const slot = e.target as HTMLSlotElement
      this._setFilterSlotted(slot.assignedElements().length > 0)
    }

    /**
     * Inner content of the filter panel. Default = the light-build placeholder
     * (`[data-mono-slot]`) the captured child is moved into; the shadow build
     * overrides this to render a native `<slot name="filter-builder">`.
     */
    protected _renderFilterSlotContent(): TemplateResult {
      return html`<div data-mono-slot="filter-builder"></div>`
    }

    private _toggleFilter(): void {
      if (this._filterOpen) {
        this._closeFilter()
        return
      }
      this._closePanel()
      this._closeMore()
      this._ensureFilterPopup()
      this._filterOpen = true
      this._bindFilterDocListener()
    }

    private _closeFilter(): void {
      if (!this._filterOpen) return
      this._filterOpen = false
      this._teardownFilterDocListener()
    }

    /**
     * The filter panel is portaled (like the suggestion panel) so it floats over
     * the rows instead of pushing them, and flips / shifts to stay on screen at
     * a viewport edge.
     */
    private _ensureFilterPopup(): void {
      if (this._filterPopup || isServer) return
      this._filterPopup = new PopupPortalController(this, {
        getPanel: () =>
          this.renderRoot.querySelector('.mono-table-search-filter') as HTMLElement | null,
        getAnchor: () =>
          (this.renderRoot.querySelector('.mono-input-field') as HTMLElement | null) ?? this,
        getStyleScope: () =>
          (this.closest('.mono-table, [mono-table]') as HTMLElement | null) ??
          (this.renderRoot.querySelector('.mono-table-search') as HTMLElement | null) ??
          this,
        isOpen: () => this._filterOpen,
        side: () => 'bottom',
        align: () => 'start',
        offset: () => 4,
        flip: () => true,
        shift: () => true,
        constrainSize: () => true,
      })
    }

    /** Where the portaled filter panel lives now (host or body portal). */
    protected _filterPanelRoot(): ParentNode | null {
      return this._filterPopup?.panelRoot ?? null
    }

    private _bindFilterDocListener(): void {
      if (this._onFilterDocPointer || isServer) return
      this._onFilterDocPointer = (e: Event): void => {
        const path = (e as PointerEvent).composedPath()
        if (path.includes(this)) return
        if (this._filterPopup?.containsInPath(path)) return
        this._closeFilter()
      }
      document.addEventListener('pointerdown', this._onFilterDocPointer, true)
    }

    private _teardownFilterDocListener(): void {
      if (this._onFilterDocPointer)
        document.removeEventListener('pointerdown', this._onFilterDocPointer, true)
      this._onFilterDocPointer = undefined
    }

    /** `mno-apply` from the slotted builder — filter the grid, chip it if multi-context. */
    private _onFilterApply(e: Event): void {
      const detail = (e as CustomEvent).detail as {
        filter: unknown
        array: unknown
        string: string
      } | undefined
      const arr = detail?.array
      const has = !!((Array.isArray(arr) && arr.length) || detail?.string)
      const grid = this.dataGrid
      if (grid?.setFilter) {
        // Skip a no-op apply (empty filter) so an empty builder never blanks the
        // grid AND leaves a dangling chip.
        void grid.setFilter(has ? arr : null)
      }
      this._filterChip =
        this.multiContext && has ? { label: this.filterLabel, string: detail?.string || '' } : null
    }

    /** `mno-clear` from the slotted builder — drop the filter and the chip. */
    private _onFilterClear(): void {
      void this.dataGrid?.setFilter?.(null)
      this._filterChip = null
    }

    /** Remove button on the filter chip — clear the grid filter, keep the builder's edits. */
    private _removeFilter(): void {
      void this.dataGrid?.setFilter?.(null)
      this._filterChip = null
      this._inputEl?.focus()
    }

    /** The chevron suffix button — only when a filter-builder is slotted. */
    private _renderFilterToggle(): TemplateResult | typeof nothing {
      if (!this._filterSlotted) return nothing
      return html`
        <button
          type="button"
          class=${`mono-table-search-filter-toggle ${this._filterOpen ? 'open' : ''} ${this
            ._filterChip
            ? 'active'
            : ''}`} mono-search-filter-toggle
          ?mono-open=${this._filterOpen}
          ?mono-active=${!!this._filterChip}
          aria-haspopup="true"
          aria-expanded=${this._filterOpen ? 'true' : 'false'}
          title=${this.filterLabel}
          @click=${(e: Event) => {
            e.stopPropagation()
            this._toggleFilter()
          }}
        >
          ${this.renderIcon('chevron')}
        </button>
      `
    }

    /** One removable chip representing the active built filter (multi-context only). */
    private _renderFilterChip(): TemplateResult {
      const chip = this._filterChip
      if (!chip) return html``
      return html`
        <span
          class="mono-table-search-chip mono-table-search-filter-chip" mono-search-chip mono-search-filter-chip
          data-chip="filter"
          title=${chip.string || chip.label}
        >
          <span class="mono-table-search-chip-text" mono-search-chip-text>${chip.label}</span>
          <button
            type="button"
            class="mono-table-search-chip-x" mono-search-chip-x
            aria-label=${`Remove ${chip.label}`}
            @click=${() => this._removeFilter()}
          >
            ${this.renderIcon('close')}
          </button>
        </span>
      `
    }

    /** The slotted filter-builder panel — hidden unless the chevron is toggled. */
    private _renderFilterSlot(): TemplateResult {
      return html`
        <div
          class="mono-table-search-filter ${this._filterOpen ? 'open' : ''}" mono-search-filter
          ?mono-open=${this._filterOpen}
          ?hidden=${!this._filterOpen}
          @mno-apply=${this._onFilterApply}
          @mno-clear=${this._onFilterClear}
        >
          ${this._renderFilterSlotContent()}
        </div>
      `
    }

    /**
     * The suggestion dropdown — portaled, so it escapes the table's overflow.
     *
     * The host div renders even with `suggestion` off (empty and `hidden`) rather
     * than collapsing to `nothing`: once the popup controller has portaled it out
     * of the render root, Lit can no longer remove it, so a conditional branch
     * would strand the old panel and render a second one on the way back.
     */
    private _renderPanel(): TemplateResult {
      const list = this.suggestion ? this._suggestions() : []
      return html`
        <div
          class="mono-table-search-panel ${this._open ? 'open' : ''} ${this._zone === 'list' ? 'zone-list' : ''}" mono-search-panel
          ?mono-open=${this._open}
          ?mono-zone-list=${this._zone === 'list'}
          role="listbox"
          ?hidden=${!this.suggestion}
          aria-hidden=${this._open ? 'false' : 'true'}
        >
          ${list.map(
            (s, i) => html`
              <button
                type="button"
                role="option"
                aria-selected=${i === this._activeIndex ? 'true' : 'false'}
                class="mono-table-search-option ${i === this._activeIndex ? 'active' : ''}" mono-search-option
                ?mono-active=${i === this._activeIndex}
                data-suggest=${s.field ?? '*'}
                @mouseenter=${() => (this._activeIndex = i)}
                @click=${() => {
                  this._activeIndex = i
                  this._acceptActive()
                }}
              >
                ${this._suggestionLabel(s)}
              </button>
            `,
          )}
        </div>
      `
    }

    protected override render(): TemplateResult {
      return html`
        <div
          class=${this._wrapperClasses}
          style=${styleMap(buildSizeStyle(this))}
          mono-input
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
          mono-validation-state=${this._resolvedValidationState === 'default' ? nothing : this._resolvedValidationState}
          ?mono-disabled=${this.disabled}
          ?mono-readonly=${this.readonly}
          ?mono-clearable=${this.clearable}
          @keydown=${this._onKeydown}
          @keyup=${this._onKeyup}
        >
          ${this._renderLabel()}
          <div class=${this._fieldClasses} mono-field>
            ${this.noIcon
              ? nothing
              : html`<span class=${this._cls('mono-input-prefix', 'prefix')} mono-prefix aria-hidden="true"
                  >${this.renderIcon('search')}</span
                >`}
            ${this._renderChips()}
            <input
              class=${`${this._cls('mono-input-native', 'native')} ${this.size}`}
              mono-native
              type="search"
              .value=${this._value}
              name=${ifDefined(this.name || undefined)}
              placeholder=${ifDefined(this.placeholder || undefined)}
              autocomplete=${ifDefined(this.autocomplete || undefined)}
              inputmode=${ifDefined(this.inputmode || undefined)}
              minlength=${ifDefined(this.minLength)}
              maxlength=${ifDefined(this.maxLength)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?autofocus=${this.autofocus}
              aria-label=${ifDefined(this.ariaLabelText || this.label || this.placeholder || undefined)}
              aria-invalid=${this._resolvedValidationState === 'invalid' ? 'true' : 'false'}
              @input=${this._handleInput}
            />
            ${this._renderClear()}
            ${this._renderFilterToggle()}
          </div>
          ${this._renderPanel()} ${this._renderMorePanel()} ${this._renderFilterSlot()} ${this._renderMessage()}
        </div>
      `
    }
  }

  return MonoTableSearchCoreClass as unknown as Constructor<MonoTableSearchCoreInterface> & T
}
