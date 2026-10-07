// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  SelectSize,
  SelectColor,
  SelectVariant,
  SelectValidationState,
  SelectValue,
  SelectItem,
  SelectDataSource,
  SelectLoadMore,
  SelectDisplayValue,
  SelectDisplayGroup,
  SelectCssClass,
  SelectDropdownOptions,
  SelectModelEventDetail,
} from './select-types.js'

import { getFieldValue } from '../../search/field-path'
import { rateLimitHasChanged } from '../../composables/rate-limit'
import {
  arrayHasChanged,
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { DataSourceController } from '../../composables/data-source-controller'
import { buildSizeStyle, toCssSize, type CssSizeValue } from '../../composables/css-size'
import { PopupPortalController } from '../../composables/popup-portal'
import { LateSlotWatcher } from '../../composables/light-slots'
import { MonoFormControlCore } from '../form/form-control-core.js'
import type { MonoFormListEntry } from '../form/form-types.js'
import { unwrapReactive } from '../../composables/reactive'
import {
  MonoSourceSearch,
  resolveSearchFields,
  searchRowPredicate,
  type MonoSearchExprEntry,
  type MonoSearchValue,
} from '../../search/data-search.js'

/** Named slots projected by `mono-select` (light: captured; shadow: native). */
export type SelectSlotName = 'label' | 'helper' | 'prefix' | 'suffix' | 'list'

/**
 * `MonoSelectCore` — render-mode-agnostic logic for `mono-select` (props, hybrid
 * aliases, value/model sync, DataSource paging, search, grouping, keyboard nav,
 * the popup controller, and the full `render()`). SSR-safe: every `document` /
 * `window` / focus access is `isServer`-guarded.
 *
 * Each build supplies `createRenderRoot()` + `static styles`, the slot strategy
 * (light captures children into `data-mono-slot` placeholders; shadow uses native
 * `<slot>` + a `firstUpdated` scan), and the `_slotOutlet` / `renderIcon` hooks.
 * The shared `_has*SlotState` `@state` fields back both strategies.
 */
export const MonoSelectCore = <T extends Constructor<LitElement>>(superClass: T) => {
class MonoSelectCoreClass extends MonoFormControlCore(superClass) {
  constructor(...args: any[]) {
    super(...args)

    defineHybridPropAliases(this, [
      'modelValue',
      'helperText',
      'validationState',
      'validationMessage',
      'errorMessage',
      'successMessage',
      'ariaLabelText',
      'cssClass',
      'keyValue',
      'displayValue',
      'displayGroup',
      'groupKey',
      'groupItems',
      'groupSticky',
      'searchValue',
      'searchOperation',
      'searchDebounce',
      'searchPlaceholder',
      'dataSource',
      'loadMore',
      'pageSize',
      'dropdownHeight',
      'dropdownMaxHeight',
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
      'stayOpen',
    ])

    /**
     * Makes these Vue usages work:
     *
     * <mono-select :cssClass="{}" />
     * <mono-select :css-class="{}" />
     * <mono-select :cssclass="{}" />
     */
    Object.defineProperty(this, 'css-class', {
      get: () => this.cssClass,
      set: (value: unknown) => {
        this._setCssClass(value)
      },
      configurable: true,
      enumerable: false,
    })

    Object.defineProperty(this, 'cssclass', {
      get: () => this.cssClass,
      set: (value: unknown) => {
        this._setCssClass(value)
      },
      configurable: true,
      enumerable: false,
    })

    Object.defineProperty(this, 'ariaLabel', {
      get: () => this.ariaLabelText,
      set: (value: unknown) => {
        this.ariaLabelText = value == null ? undefined : String(value)
      },
      configurable: true,
      enumerable: false,
    })

    Object.defineProperty(this, 'aria-label', {
      get: () => this.ariaLabelText,
      set: (value: unknown) => {
        this.ariaLabelText = value == null ? undefined : String(value)
      },
      configurable: true,
      enumerable: false,
    })

    Object.defineProperty(this, 'arialabel', {
      get: () => this.ariaLabelText,
      set: (value: unknown) => {
        this.ariaLabelText = value == null ? undefined : String(value)
      },
      configurable: true,
      enumerable: false,
    })

    this._ds = new DataSourceController<SelectItem>(this, {
      getDataSource: () => this.dataSource,
      getItems: () => this.items,
      getImmediate: () => this.immediate,
      getLoadMoreMode: () => this._loadMoreMode,
      getPageSize: () => this._pageSize,
    })
  }

  private readonly _ds: DataSourceController<SelectItem>

  /**
   * Automatic skeleton (`pending`, composables/mono-skeleton.ts): DATA-driven — a select
   * fed by a `dataSource` stays pending until that source's first page is in; one with
   * static `items` (or no source) has nothing to wait for and releases before first paint.
   */
  static monoPendingAuto = 'data' as const

  protected _monoPendingReady(): boolean {
    return !this.dataSource || !this._ds.loading
  }

  static get observedAttributes(): string[] {
    // @ts-ignore — `super` statics are untyped through the generic mixin base.
    const base: string[] = super.observedAttributes ?? []
    return [
      ...base,
      'modelvalue',
      'model-value',
      'helpertext',
      'validationstate',
      'validationmessage',
      'errormessage',
      'successmessage',
      'arialabeltext',
      'arialabel',
      'css-class',
      'cssclass',
      'keyvalue',
      'displayvalue',
      'display-value',
      'stayopen',
    ]
  }

  override attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    super.attributeChangedCallback(name, oldValue, newValue)

    if (oldValue === newValue) return

    if (name === 'modelvalue' || name === 'model-value') {
      this.modelValue = this._toSelectValue(newValue)
      return
    }

    if (name === 'helpertext') {
      this.helperText = newValue ?? ''
      return
    }

    if (name === 'validationstate') {
      this.validationState = (newValue ?? 'default') as SelectValidationState
      return
    }

    if (name === 'validationmessage') {
      this.validationMessage = newValue ?? ''
      return
    }

    if (name === 'errormessage') {
      this.errorMessage = newValue ?? ''
      return
    }

    if (name === 'successmessage') {
      this.successMessage = newValue ?? ''
      return
    }

    if (name === 'arialabeltext' || name === 'arialabel') {
      this.ariaLabelText = newValue ?? undefined
      return
    }

    if (name === 'keyvalue') {
      this.keyValue = newValue ?? ''
      return
    }

    if (name === 'displayvalue' || name === 'display-value') {
      // If a function was already set via .prop binding, don't let Vue's
      // string-mirrored attribute overwrite it.
      if (typeof this.displayValue === 'function') return
      const next = newValue ?? ''
      // Vue 3 stringifies non-primitive props via String(value) when also
      // setting them as attributes — skip values that look like a serialized
      // function, otherwise the real function (arriving on the next tick via
      // .prop) gets clobbered until a second update.
      if (this._looksLikeSerializedFunction(next)) return
      this.displayValue = next
      return
    }

    if (name === 'stayopen') {
      this.stayOpen = this._toBoolean(newValue)
      return
    }

    if (name === 'css-class' || name === 'cssclass') {
      this._setCssClass(newValue)
    }
  }

  @property({ type: String })
  size: SelectSize = 'md'

  @property({ type: String })
  color: SelectColor = 'primary'

  @property({ type: String })
  variant: SelectVariant = 'outlined'

  // Not reflected: reflecting an arbitrary value would stringify objects/numbers
  // to text, and the next Vue attribute patch (`:model-value="9"` → `'9'`) would
  // re-enter as a string, corrupting comparisons against the real item value.
  // Attribute reads still work via attributeChangedCallback + _toSelectValue.
  @property({ attribute: false })
  modelValue: SelectValue = null

  @property({ attribute: false })
  value: SelectValue = null

  @property({ type: String })
  name = ''

  @property({ type: String })
  label = ''

  @property({ type: String })
  placeholder = 'Select option'

  @property({ type: String, attribute: 'helper-text' })
  helperText = ''

  @property({ type: String, attribute: 'validation-state' })
  validationState: SelectValidationState = 'default'

  @property({ type: String, attribute: 'validation-message' })
  validationMessage = ''

  @property({ type: String, attribute: 'error-message' })
  errorMessage = ''

  @property({ type: String, attribute: 'success-message' })
  successMessage = ''

  @property({ type: String, attribute: 'aria-label' })
  ariaLabelText?: string

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  disabled = false

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  readonly = false

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  required = false

  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  clearable = false

  /**
   * Supports:
   * element.items = [{ label: 'A', value: 'a' }]
   * items='[{"label":"A","value":"a"}]'
   */
  @property({ attribute: false, hasChanged: arrayHasChanged })
  items: SelectItem[] = []

  /**
   * A devextreme DataSource (structurally typed) to drive the list. When set,
   * it takes precedence over `items`: the component mirrors `dataSource.items()`
   * and re-renders on the source's `changed` / `loadingChanged` events, so
   * external `ds.filter(...)` + `ds.load()` / `ds.reload()` update the list.
   *
   * Vue: bind with `.prop` — `:data-source.prop="ds"`.
   */
  @property({ attribute: false })
  dataSource: SelectDataSource | null = null

  /**
   * DataSource-only. When true (default), the component calls `dataSource.load()`
   * on attach if the source has no items yet. When false, the consumer must load
   * the source manually (`await ds.load()`); the component still mirrors items
   * and events. Has no effect in plain `items` mode (nothing to fetch).
   */
  @property({
    attribute: 'immediate',
    reflect: true,
    converter: booleanStringConverter,
  })
  immediate = true

  /**
   * Incremental loading. Works with a paged DataSource OR a plain `items` array:
   * - DataSource → loads one page at a time (consumer keeps `pageSize` small)
   *   and appends as the user requests more.
   * - Array → reveals the list one `page-size` chunk at a time (client-side),
   *   so a long `items` array isn't rendered all at once.
   *
   * - 'button' → a "Load more" button at the end of the list.
   * - 'scroll' → loads/reveals the next chunk when scrolled near the bottom.
   * - unset    → no paging; the whole list is shown.
   *
   * Enabling it without an explicit mode defaults to 'scroll' — so a bare
   * `load-more` attribute, `load-more=""`, or `:load-more.prop="true"` all mean
   * scroll. Only `load-more="button"` opts into the button affordance.
   */
  @property({ attribute: 'load-more', reflect: true })
  loadMore?: SelectLoadMore | '' | boolean

  /**
   * Chunk size used when paging a plain `items` array via `load-more`
   * (how many extra rows each "load more" reveals). Default 10. Ignored in
   * DataSource mode, where the source's own page size governs paging.
   */
  @property({ attribute: 'page-size', reflect: true, type: Number })
  pageSize = 10

  /**
   * Sizes the popup PANEL only, independent of the field —
   * `:dropdown.prop="{ width: 460, maxHeight: 320 }"`.
   *
   * `attribute: false` makes it `.prop`-only, like `cssClass`; there is no JSON attribute form.
   * The name is one lowercase word, so it needs no hybrid spelling aliases.
   *
   * Setting `width` also stops the panel tracking the field — see `matchWidth` below.
   */
  @property({ attribute: false })
  dropdown?: SelectDropdownOptions

  /**
   * Fixed height of the scrollable dropdown list. A bare number is treated as
   * px; CSS lengths pass through (e.g. "12rem", "200px", "40vh"). Useful with
   * `load-more="scroll"` so a short page still overflows and can
   * scroll. Overrides the default max-height.
   */
  @property({ attribute: 'dropdown-height', reflect: true })
  dropdownHeight: string | number = ''

  /**
   * Max height of the scrollable dropdown list (default 18rem). Same value
   * format as `dropdown-height`.
   */
  @property({ attribute: 'dropdown-max-height', reflect: true })
  dropdownMaxHeight: string | number = ''

  /**
   * Open the dropdown UPWARD when there isn't room below (e.g. a select near the
   * bottom of the viewport, or in a grid row below the fold). Default `true`.
   */
  @property({ converter: booleanStringConverter })
  flip = true

  /**
   * Slide the dropdown horizontally so it stays inside the viewport near a
   * screen edge. Default `true`.
   */
  @property({ converter: booleanStringConverter })
  shift = true

  /**
   * Property name on each item to use as the model value.
   * If empty, the whole item object is stored in `modelValue`.
   *
   * Example: items=[{id:9,name:'John'}] + key-value="id" → modelValue=9.
   */
  @property({ type: String, attribute: 'key-value', reflect: true })
  keyValue = ''

  /**
   * Property name (string) or selector function used to derive the display
   * text for each item. Falls back to `item.label` when unset, then
   * `String(item)`.
   *
   * String form via plain HTML: display-value="name".
   * Function form via JS/Vue: :display-value.prop="(item) => item.name".
   */
  @property({ attribute: false })
  displayValue: SelectDisplayValue = ''

  /**
   * Render **pre-grouped** data (the nested `{ key, items }` shape a grouped
   * devextreme DataSource returns) with a group header per level. One accessor
   * per group level; each header's label is resolved from a **representative
   * leaf row** of that group — a string reads `row[field]`, a function gets the
   * row. Empty (default) = flat list, no grouping.
   *
   * @example
   * // L0 header = row.Nama, L1 header = row.Code
   * :display-group.prop="['Nama', (row) => row.Code]"
   */
  @property({ attribute: false, hasChanged: arrayHasChanged })
  displayGroup: SelectDisplayGroup = []

  /** Field holding a group node's key (default `'key'`). */
  @property({ type: String, attribute: 'group-key', reflect: true })
  groupKey = 'key'

  /** Field holding a group node's child array (default `'items'`). */
  @property({ type: String, attribute: 'group-items', reflect: true })
  groupItems = 'items'

  /**
   * Group a **plain, paginated** DataSource client-side (so scroll / "load more"
   * keep working). Pass a source **without** `group` in its request — the
   * component fetches flat rows page by page and buckets the accumulated rows by
   * the `display-group` accessors. Leave off to instead render data that is
   * already nested as `{ key, items }`.
   */
  @property({ attribute: 'group', reflect: true, converter: booleanStringConverter })
  group = false

  /**
   * When grouping, keep each group header pinned to the top of the dropdown
   * while its rows scroll past (nested levels stack). Default `false`.
   */
  @property({ attribute: 'group-sticky', reflect: true, converter: booleanStringConverter })
  groupSticky = false

  /**
   * Turn the field itself into a search input (combobox) — the trigger becomes a
   * text box you type into to filter, instead of a separate search box inside the
   * dropdown. With a bound `dataSource`, typing **queries the server** (debounced)
   * so the dropdown shows the full matching result set; with a plain `items`
   * array it filters client-side.
   */
  @property({ attribute: 'searchable', reflect: true, converter: booleanStringConverter })
  searchable = false

  /**
   * Exempt this select from every automatic close — clicking or focusing
   * anything outside it, which includes opening another select. It is **not** a
   * lock: its own trigger, Escape and picking an item still close it. Set it on
   * every select if you want several dropdowns open at once.
   */
  @property({ attribute: 'stay-open', reflect: true, converter: booleanStringConverter })
  stayOpen = false

  /**
   * Field(s) the search matches — drives both the server query and the client
   * filter. Falls back to `display-value` (when it's a string) then `key-value`.
   *
   * Accepts the same **search expressions** the data grid does, as an array or as
   * a comma-separated string:
   *
   * ```html
   * search-value="Nama,Code"
   * search-value="Company.Name,Transaction.[*].Price,*.[*].*"
   * ```
   * ```ts
   * :search-value.prop="['Company.Name', 'Transaction.[1].Name', '*']"
   * :search-value.prop="[{ field: 'Active', custom: ({ value }) => `Active eq ${value}` }]"
   * ```
   *
   * An entry may be a plain column, a path (`Company.Name`, `Transaction.[*].Price`),
   * a `*` pattern (`'*'`, `'Company.*'`, `'*.*'`, `'*.[*].*'`) or a `{ field, custom }`
   * clause builder (array form only). See `src/search/` for the full grammar.
   */
  @property({ attribute: 'search-value', hasChanged: arrayHasChanged })
  searchValue: MonoSearchValue = ''

  /** devextreme search operation for server search (default `'contains'`). */
  @property({ type: String, attribute: 'search-operation' })
  searchOperation = 'contains'

  /** Debounce (ms) before a server search fires (default 300). */
  @property({ attribute: 'search-debounce', type: Number })
  searchDebounce = 300

  /**
   * Placeholder shown in the field while it is open/searching. Falls back to
   * `placeholder` when empty, so the field reads as the selection prompt when
   * closed and as a search hint once focused.
   */
  @property({ type: String, attribute: 'search-placeholder' })
  searchPlaceholder = ''

  @property({ attribute: false, hasChanged: rateLimitHasChanged })
  cssClass: SelectCssClass = {}

  /**
   * Plain HTML root class fallback:
   * <mono-select css-class="premium-select"></mono-select>
   */
  @property({ attribute: false })
  cssClassName = ''

  @state()
  private _open = false

  /** Current search text typed into the field. */
  @state()
  private _query = ''

  /**
   * Whether the typed query is an active filter. While `false` the field shows
   * the selected option's label and the full list is offered; it flips to `true`
   * as soon as the user types, and back to `false` on select / close.
   */
  @state()
  private _searchActive = false

  /** Highlighted option index for keyboard nav in the searchable combobox. */
  @state()
  private _activeIndex = -1

  /**
   * Set on the open edge, cleared once the cursor has been placed (or the user
   * starts typing). Not `@state`: it only gates the seed in `updated()` and must
   * never trigger a render of its own.
   */
  private _cursorPending = false

  private _searchTimer?: ReturnType<typeof setTimeout>

  /** Applies a query to a bound DataSource; remembers the consumer's own filter. */
  private _sourceSearch = new MonoSourceSearch()

  /**
   * Bumped whenever an input to search resolution changes, so the two memos below
   * invalidate. A counter rather than a serialized key because `search-value` may
   * hold `{ field, custom }` entries whose functions don't serialize.
   */
  private _searchVersion = 0

  private _entriesCache?: { key: string; entries: MonoSearchExprEntry[] }

  private _predicateCache?: { key: string; pred: ((row: any) => boolean) | null }

  // Computed max-height (px) that keeps a paged scroll list just tall enough
  // to scroll, so the next page loads on scroll rather than on open.
  @state()
  private _scrollAutoMaxHeight = ''

  @state()
  protected _hasLabelSlotState = false

  @state()
  protected _hasHelperSlotState = false

  @state()
  protected _hasPrefixSlotState = false

  @state()
  protected _hasSuffixSlotState = false

  /**
   * Whether a `list` slot was supplied. Set by the builds, which own slot detection.
   *
   * `@state`, like its label/helper siblings: the shadow build only learns the slot has content
   * AFTER a render has created the <slot>, so flipping this has to schedule another one.
   */
  @state()
  protected _hasListSlotState = false

  @query('.mono-select-search-field')
  private _searchFieldEl?: HTMLInputElement

  @query('.mono-select-trigger')
  private _triggerEl?: HTMLButtonElement

  /**
   * The scroll body lives inside the dropdown panel, which the portal
   * controller relocates into a `<body>` portal while open — query it through
   * `panelRoot` (the portal when adopted, else the host render root).
   */
  private get _dropdownBodyEl(): HTMLElement | null {
    return this._popup.panelRoot.querySelector('.mono-select-dropdown-body')
  }

  /**
   * Where the consumer's list wrapper is parked — through the SAME portal-aware root as the panel,
   * since while the dropdown is open it lives in a body portal a host query would miss.
   */
  protected get _listSlotTarget(): HTMLElement | null {
    return this._popup.panelRoot.querySelector('[data-mono-slot="list"]')
  }

  /**
   * Relocates the dropdown panel into a body portal while open so the shared
   * popup-stack z-index ranks it against every other popup, and owns this
   * select's popup-stack membership + fixed positioning.
   */
  private _popup = new PopupPortalController(this, {
    getPanel: () =>
      this.renderRoot.querySelector('.mono-select-dropdown') as HTMLElement | null,
    getAnchor: () =>
      this.renderRoot.querySelector('.mono-select-trigger') as HTMLElement | null,
    getStyleScope: () =>
      this.renderRoot.querySelector('.mono-select') as HTMLElement | null,
    isOpen: () => this._open,
    // The panel matches the field UNLESS an explicit width was given. When portaled, the
    // controller writes `panel.style.width` from the anchor on every reposition, so a plain
    // `true` here would overwrite `dropdown.width` on the next open, scroll or resize.
    matchWidth: () => !toCssSize(this.dropdown?.width),
    offset: () => 6,
    flip: () => this.flip,
    shift: () => this.shift,
    // Flipping alone isn't enough when NEITHER side has room for the full list;
    // this also publishes the available height so the panel shrinks and scrolls.
    constrainSize: () => true,
  })

  private readonly _selectId = `mono-select-${Math.random().toString(36).slice(2)}`
  private readonly _messageId = `${this._selectId}-message`
  private readonly _listboxId = `${this._selectId}-listbox`

  /**
   * Watches for a `slot="list"` wrapper that shows up AFTER connect.
   *
   * The builds capture their slot children once, at connect, which is right whenever a framework
   * fills an element before inserting it. It is not always so: a `<ClientOnly>` boundary, a
   * hydration pass or a `v-if` flipping appends to an element that is already live, and the
   * capture that already ran cannot see it. Left unwatched, the light build shows the wrapper
   * loose in the host and the shadow build never renders its `<slot>` at all.
   */
  protected _lateListSlot = new LateSlotWatcher(
    this as unknown as Element,
    'list',
    () => this._onLateListSlot(),
  )

  /** A late wrapper arrived. Overridden per build — one adopts it, the other rescans. */
  protected _onLateListSlot(): void {}

  override connectedCallback(): void {
    super.connectedCallback()
    // Above the guard on purpose: `start()` renders nothing and already no-ops without a
    // MutationObserver, and a wrapper can be appended before anything else has run.
    this._lateListSlot.start()

    if (isServer) return
    // Bound only while OPEN (see `_bindDocumentListeners`). A plain reattach
    // schedules no Lit update, so an element that was open when it was detached has
    // to rebind here — nothing else would.
    if (this._open) this._bindDocumentListeners()
    // DataSource re-attach on reconnect is handled by the controller.
  }

  private _docListenersBound = false

  /**
   * Outside-dismiss listeners, bound on OPEN rather than on connect.
   *
   * All three handlers begin with `if (!this._open) return`, so binding them only
   * while open is behaviour-preserving — the cost they carried was pure event
   * DISPATCH. Every mounted select used to hold three `document` listeners, two of
   * them capture-phase, so a grid with one select per row put 600 handlers (400 in
   * capture) in the path of every click, focus move and keystroke on the page.
   * Measured on the 200-row fixture: 600 listeners before, 0 at rest after.
   *
   * Same change, and the same reasoning, as the popup viewport listeners in
   * `popup-portal.ts` — which this file was explicitly the remaining example of.
   */
  private _bindDocumentListeners(): void {
    if (this._docListenersBound) return
    this._docListenersBound = true
    // CAPTURE phase, matching mono-dropdown. The trigger handlers call
    // `stopPropagation()` (`_toggleOpen` / `_handleFieldClick`), so a bubble-phase
    // listener never sees a click that lands on ANOTHER select's trigger — which
    // is exactly why opening a second select used to leave the first one open.
    document.addEventListener('click', this._handleDocumentClick, true)
    // Tab traversal never produces a click, and a searchable select opens on
    // focus — so without this, keyboarding from one select into the next leaves
    // both panels down.
    document.addEventListener('focusin', this._handleDocumentFocusIn, true)
    document.addEventListener('keydown', this._handleDocumentKeydown)
  }

  private _unbindDocumentListeners(): void {
    if (!this._docListenersBound) return
    this._docListenersBound = false
    // The `true` must match the add above or the listener is never removed.
    document.removeEventListener('click', this._handleDocumentClick, true)
    document.removeEventListener('focusin', this._handleDocumentFocusIn, true)
    document.removeEventListener('keydown', this._handleDocumentKeydown)
  }

  override disconnectedCallback(): void {
    // A pending debounced query would otherwise fire against a detached element
    // and issue a request nothing will ever render.
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = undefined
    }
    // Undo whatever this element wrote onto the source. With `defaultToWildcard`
    // the search lands in `source.filter()` — the consumer's own slot — so leaving
    // it behind pollutes a DataSource the app still owns and shares.
    this._sourceSearch.clear(this.dataSource)
    this._lateListSlot.stop()
    this._stopWatchingListChrome()
    // Safety net: the open path unbinds on close, but a select destroyed while open
    // never reaches that.
    if (!isServer) this._unbindDocumentListeners()
    super.disconnectedCallback()
  }

  /**
   * Invalidation key for the item memos below. Bumped UNCONDITIONALLY at the top of
   * `willUpdate`, which is the only key that cannot go stale here.
   *
   * A key gated on `changed.has('items' | 'dataSource')` — the shape `_searchVersion`
   * uses — would miss every DataSource mutation, which is the dominant path for a
   * remote list: `DataSourceController._changed()` calls a bare `host.requestUpdate()`
   * with no property name, so Lit schedules the update but writes NOTHING into the
   * changed map. Server pages, load-more, and array-mode reveals all arrive that way.
   * `willUpdate` still runs for each of them, so the epoch sees them all.
   *
   * The memos are therefore per-render, not cross-render. Reads from OUTSIDE the
   * update cycle (the keydown handler, the click handler, the debounced search timer)
   * get the last rendered value — which is the list the user is currently looking at.
   */
  private _itemsEpoch = 0
  private _normalizedMemo?: { epoch: number; items: SelectItem[] }
  private _visibleMemo?: { epoch: number; items: SelectItem[] }
  private _leafMemo?: { epoch: number; items: SelectItem[] }

  override willUpdate(changed: Map<string, unknown>): void {
    this._itemsEpoch++
    // SSR (nuxt-ssr-lit) can set a boolean prop to a raw string (e.g. '') by
    // assigning the property directly (bypassing the attribute converter); coerce
    // so render() sees real booleans and client hydration matches.
    // (see project_shadow_boolean_prop_ssr)
    for (const key of [
      'disabled', 'readonly', 'required', 'clearable',
      'immediate', 'group', 'groupSticky', 'searchable', 'stayOpen',
    ] as const) {
      const v = this[key] as unknown
      if (typeof v !== 'boolean') {
        ;(this as unknown as Record<string, unknown>)[key] = this._toBoolean(v)
      }
    }

    // Store the RAW target, not the consumer's reactive proxy — otherwise the
    // element's own correct value is overwritten by the echo from Vue's `ref` and
    // every later lookup compares a proxy against raw rows.
    if (changed.has('modelValue') && !this._isSameValue(this.value, this.modelValue)) {
      this.value = unwrapReactive(this.modelValue)
    }

    if (changed.has('value') && !this._isSameValue(this.modelValue, this.value)) {
      this.modelValue = unwrapReactive(this.value)
    }

    // `group` mode: order the (plain) source by the group fields so each page
    // arrives with its groups together. Set before binding so the first load
    // uses it. Never sends `group`, so the source stays paginated.
    if (
      this.group &&
      (changed.has('dataSource') || changed.has('displayGroup') || changed.has('group'))
    ) {
      const fields = this._groupSortFields()
      if (fields.length) {
        const ds = this.dataSource as { sort?: (v: unknown) => unknown } | null
        ds?.sort?.(fields)
      }
    }

    if (changed.has('dataSource')) {
      this._ds.bind(this.dataSource)
      // Snapshot the new source's own filter before any search composes onto it.
      this._sourceSearch.bind(this.dataSource)
    }

    // Invalidate the resolved-entry / predicate memos when any input to search
    // resolution changes.
    if (
      changed.has('searchValue') ||
      changed.has('searchOperation') ||
      changed.has('displayValue') ||
      changed.has('keyValue') ||
      changed.has('dataSource') ||
      changed.has('items')
    ) {
      this._searchVersion++
    }

    if (changed.has('immediate')) {
      this._ds.maybeImmediateLoad()
    }

    if (changed.has('loadMore')) {
      this._ds.onLoadMoreModeChange()
    }

    // Array-mode paging: (re)start from the first chunk whenever the list, the
    // mode, or the chunk size changes. Harmless in DataSource mode.
    if (
      changed.has('items') ||
      changed.has('loadMore') ||
      changed.has('pageSize')
    ) {
      this._ds.resetVisible()
    }

    // Opening puts the cursor on the row that is already selected, so ↑/↓ carry on
    // from the current value instead of restarting at the top (and Enter re-picks
    // it, a harmless no-op). With nothing selected it lands on the first row, as
    // it always did.
    //
    // The seed is LATCHED rather than run once on the open edge: with a bound
    // dataSource the first page is still in flight at that moment, so
    // `_filteredItems` is empty and the lookup would always miss — the feature
    // would do nothing for exactly the remote data it is meant for. Holding the
    // latch until the list first has rows fixes that, and also makes every entry
    // path agree (opening via ArrowDown sets `_activeIndex` to 0 *before* this
    // runs, which the old `< 0` guard silently skipped).
    //
    // Done HERE and not in `updated()`: `_activeIndex` is reactive state, and
    // writing it after the render tripped Lit's change-in-update warning and
    // cost a second render on every open. From `willUpdate` the write folds
    // into the render already underway (and still lands in `changed`, which
    // is what `updated()` keys the scroll-into-view on).
    if (changed.has('_open')) {
      this._cursorPending = this._open
      if (!this._open) this._activeIndex = -1
    }
    if (this._cursorPending && this._open && this._filteredItems.length) {
      this._activeIndex = this._initialActiveIndex()
      this._cursorPending = false
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)

    // BEFORE the isServer guard: publishing the resolved list is pure data with no DOM in it, and
    // it is exactly what an SSR pass needs so a framework can render the slot rows on the server
    // too. Everything below this line touches the DOM and rightly stops short.
    this._syncListEntries()

    if (isServer) return

    // Focus the search field when the dropdown opens (e.g. opened via the arrow
    // or the public open() API — clicking the field already focuses it).
    if (changed.has('_open') && this._open && this.searchable) {
      this._searchFieldEl?.focus()
    }

    // Keep the highlight visible: ↑/↓ walk past the panel's edge on any list
    // longer than the dropdown is tall, and nothing else scrolls it into view.
    // (The cursor itself is seeded in `willUpdate` — see there.)
    if (changed.has('_activeIndex') && this._open && this._activeIndex >= 0) {
      const root = this._popup.panelRoot as ParentNode | null
      const item = root?.querySelectorAll?.('.mono-select-item')?.[this._activeIndex]
      ;(item as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' })
    }

    this._updateScrollAutoHeight()

    // Cheap and idempotent, so it runs on every update rather than only on the
    // `_open` edge — `_open` is assigned from a dozen places and a missed edge would
    // leave a select that cannot be dismissed by clicking away.
    if (this._open) this._bindDocumentListeners()
    else this._unbindDocumentListeners()
  }

  /**
   * Scroll-mode ergonomics: a short page (e.g. 5 items) won't overflow the
   * default dropdown height, so there's nothing to scroll and the next page
   * could never be triggered. Rather than eagerly fetching another page on
   * open, cap the list height to the loaded rows minus a sliver — enough to
   * show a scrollbar so the user scrolls to load more. No height is forced
   * when the consumer set `dropdown-height`/`dropdown-max-height`, when the
   * last page is reached, or when the rows already overflow.
   */
  private _updateScrollAutoHeight(): void {
    // The object counts too, or the scroll heuristic would silently override an author's height.
    const userSetHeight =
      this._toCssLength(this.dropdownHeight) != null ||
      this._toCssLength(this.dropdownMaxHeight) != null ||
      toCssSize(this.dropdown?.height) != null ||
      toCssSize(this.dropdown?.maxHeight) != null

    const active =
      this._loadMoreMode === 'scroll' &&
      this._open &&
      !this._ds.atLastPage &&
      !userSetHeight &&
      this._visibleItems.length > 0

    if (!active) {
      this._setScrollAutoMaxHeight('')
      return
    }

    const el = this._dropdownBodyEl
    const firstRow = el?.querySelector<HTMLElement>('.mono-select-item')
    const rowH = firstRow?.offsetHeight ?? 0
    if (!el || !rowH) return // not laid out yet (e.g. jsdom) — leave as-is

    const CAP_ROWS = 7
    const rows = this._visibleItems.length
    let visible = Math.min(rows, CAP_ROWS)
    // When the rows fit, hide half a row so a scrollbar still appears.
    if (rows <= CAP_ROWS) visible -= 0.5

    this._setScrollAutoMaxHeight(`${Math.round(visible * rowH)}px`)
  }

  private _setScrollAutoMaxHeight(value: string): void {
    if (value === this._scrollAutoMaxHeight) return
    // Defer so we don't mutate reactive state synchronously inside updated().
    queueMicrotask(() => {
      this._scrollAutoMaxHeight = value
    })
  }

  private _setCssClass(value: unknown): void {
    if (value == null) {
      this.cssClass = {}
      this.cssClassName = ''
      return
    }

    if (typeof value === 'object') {
      this.cssClass = value as SelectCssClass
      return
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()

      if (!trimmed) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }

      /**
       * Optional HTML object support:
       * <mono-select css-class='{"root":"...", "trigger":"..."}'>
       */
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.cssClass = JSON.parse(trimmed) as SelectCssClass
          return
        } catch {
          // fallback to root class
        }
      }

      this.cssClassName = trimmed
    }
  }

  private _toSelectValue(value: unknown): SelectValue {
    if (value === undefined || value === null) return null

    if (typeof value !== 'string') return value as SelectValue

    const trimmed = value.trim()
    if (!trimmed) return null

    // Recover number / boolean / null / object / array from an attribute
    // string so `:model-value="9"` doesn't downgrade `9` to `'9'`.
    if (
      /^-?\d+(?:\.\d+)?$/.test(trimmed) ||
      trimmed === 'true' ||
      trimmed === 'false' ||
      trimmed === 'null' ||
      (trimmed[0] === '{' && trimmed[trimmed.length - 1] === '}') ||
      (trimmed[0] === '[' && trimmed[trimmed.length - 1] === ']') ||
      (trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"')
    ) {
      try {
        return JSON.parse(trimmed) as SelectValue
      } catch {
        // fall through — keep as string
      }
    }

    return trimmed
  }

  /**
   * Wrap bare primitives so every row is an object, and pass objects through.
   *
   * The `.map()` used to be unconditional, which made this an ALLOCATION on the
   * overwhelmingly common path (an array of objects, where the map is an identity
   * function). It is read through `_normalizedItems` / `_visibleItems` / `_leafItems`
   * several times per render, so at one select per table row it was the single
   * hottest allocation in the component. The scan below is O(n) reads with no
   * allocation, and returns the SAME array when nothing needs wrapping.
   *
   * Returning the input array is safe: every caller only reads
   * (`find`/`filter`/`map`/`findIndex`/`length`), and `resolveSearchFields` takes its
   * rows as `readonly unknown[]`. It also makes item identity STABLE across calls for
   * primitive lists, which is the safe direction — see the note on
   * `_initialActiveIndex`, which explains why it deliberately does not rely on that
   * identity holding.
   */
  private _normalizeItems(items: unknown): SelectItem[] {
    if (Array.isArray(items)) {
      let needsWrap = false
      for (const item of items) {
        if (typeof item !== 'object' || item === null) {
          needsWrap = true
          break
        }
      }
      if (!needsWrap) return items as SelectItem[]

      return items.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return item as SelectItem
        }

        return { value: item as SelectValue } as SelectItem
      })
    }

    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items)
        return this._normalizeItems(parsed)
      } catch {
        return []
      }
    }

    return []
  }

  private readonly _handleDropdownScroll = (event: Event): void => {
    if (this._loadMoreMode !== 'scroll') return
    if (this._ds.loadingMore || this._ds.atLastPage) return

    const el = event.currentTarget as HTMLElement | null
    if (!el) return

    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remaining <= 24) void this._ds.loadMore()
  }

  /**
   * Read `field` off an option row — PATH-AWARE, like every other field name in
   * the library.
   *
   * A plain `field in item` was the old test, and it silently produced
   * `undefined` for any nested accessor: an option list grouped by a navigation
   * property (`$apply=groupby((PostBudget/Nama))` returns
   * `{ PostBudget: { Nama: … } }`) has no top-level `"PostBudget.Nama"` key, so
   * every option resolved to no value at all — selectable in appearance, inert in
   * practice. `searchExpr`, table columns and summaries have always accepted
   * these paths; a select's `key-value` / `display-value` now do too.
   *
   * The LITERAL key is still tried first, so a row that genuinely carries a
   * dotted PROPERTY NAME keeps resolving exactly as it did — only a key that is
   * absent falls through to being read as a path, which previously could only
   * have yielded `undefined` anyway. Nothing that worked before changes.
   */
  private _readField(item: object, field: string): unknown {
    if (field in (item as Record<string, unknown>)) {
      return (item as Record<string, unknown>)[field]
    }
    return getFieldValue(item, field)
  }

  private _resolveItemValue(item: SelectItem | null | undefined): unknown {
    if (item == null) return item
    if (typeof item !== 'object') return item

    if (this.keyValue) return this._readField(item, this.keyValue)

    // No key specified → whole item is the value.
    return item
  }

  private _resolveItemDisplay(item: SelectItem | null | undefined): string {
    if (item == null) return ''

    if (typeof this.displayValue === 'function') {
      return String(this.displayValue(item as SelectItem))
    }

    if (typeof this.displayValue === 'string' && this.displayValue) {
      if (typeof item !== 'object') return ''
      const value = this._readField(item, this.displayValue)
      // `undefined` means the row has no such field; an empty label is the
      // honest rendering, and matches what this returned before.
      return value == null ? '' : String(value)
    }

    if (typeof item === 'object' && 'label' in (item as Record<string, unknown>)) {
      const label = (item as Record<string, unknown>).label
      return label == null ? '' : String(label)
    }

    // A `{ value }` wrapper with no label — every primitive `items` entry becomes one
    // in `_normalizeItems`. Its own value is the label; `String(item)` here is what
    // rendered a plain string list as "[object Object]". Same branch `mono-tag-input`
    // already carries; select was the one that never got it.
    if (typeof item === 'object' && 'value' in (item as Record<string, unknown>)) {
      const value = (item as Record<string, unknown>).value
      return value == null ? '' : String(value)
    }

    return String(item)
  }

  private _looksLikeSerializedFunction(value: string): boolean {
    const trimmed = value.trim()
    if (!trimmed) return false
    // `(...) => ...`, `function foo(...) ...`, `function(...) ...`,
    // `async (...) => ...`, `async function ...`
    return /^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(
      trimmed,
    )
  }

  /**
   * Value equality. With no `key-value` the whole item IS the value, so this is
   * identity — with one correction that is load-bearing under Vue.
   *
   * The model round-trips through the consumer's `ref`, which hands the item back
   * wrapped in a **reactive Proxy**; `items` normally stays raw, so `proxy === row`
   * is false and the selected row stops resolving (blank field, no highlight).
   * Comparing the raw targets restores it. Still identity, not deep equality:
   * two distinct rows with equal contents remain different values.
   */
  private _isSameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (a == null || b == null) return false
    const rawA = unwrapReactive(a)
    const rawB = unwrapReactive(b)
    if (rawA === rawB) return true
    if (typeof rawA !== 'object' || typeof rawB !== 'object') return false
    // Object compare — same reference handled above; otherwise treat as different.
    return false
  }

  private _cls(base: string, key: keyof SelectCssClass): string {
    const extra = this.cssClass?.[key]
    return extra ? `${base} ${extra}` : base
  }

  private _toCssLength(value: string | number): string | undefined {
    if (value == null || value === '') return undefined
    if (typeof value === 'number') return `${value}px`

    const trimmed = String(value).trim()
    if (!trimmed) return undefined
    // Bare number → px; anything with a unit/keyword passes through.
    return /^-?\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed
  }

  /**
   * The WIDTH half of `dropdown`, on the panel.
   *
   * Split from the heights below because this component's popup is two elements: the panel owns
   * the box and the border, its body does the scrolling. That split is also why select needs no
   * `--_…-panel-max-h` custom property the way tag-input does — the popup controller's own cap
   * (`--mono-popup-avail-h`) lives on the panel and the author's on the body, so the two writers
   * never meet on one declaration.
   *
   * The panel is positioned `left: 0; right: 0` against the field, and a width on top of that is
   * the over-constrained case, which CSS resolves by dropping `right` — so the panel keeps its
   * left edge and takes this size.
   */
  private get _dropdownPanelStyle(): Record<string, string> {
    const style: Record<string, string> = {}
    const panel = this.dropdown

    const width = toCssSize(panel?.width)
    if (width) style.width = width
    const minWidth = toCssSize(panel?.minWidth)
    if (minWidth) style['min-width'] = minWidth
    const maxWidth = toCssSize(panel?.maxWidth)
    if (maxWidth) style['max-width'] = maxWidth

    return style
  }

  /** The HEIGHT half of `dropdown`, on the scrolling body — see `_dropdownPanelStyle`. */
  private get _dropdownBodyStyle(): Record<string, string> {
    const style: Record<string, string> = {}
    const panel = this.dropdown

    const minHeight = toCssSize(panel?.minHeight)
    if (minHeight) style.minHeight = minHeight

    // The object wins over the flat attribute, which stays for the plain-HTML case.
    const height = toCssSize(panel?.height) ?? this._toCssLength(this.dropdownHeight)
    if (height) style.height = height

    const maxHeight = toCssSize(panel?.maxHeight) ?? this._toCssLength(this.dropdownMaxHeight)
    if (maxHeight) style.maxHeight = maxHeight
    // A fixed height should win over the default 18rem max-height in CSS.
    else if (height) style.maxHeight = height
    // Otherwise, scroll-mode paging may compute a height to keep it scrollable.
    else if (this._scrollAutoMaxHeight) style.maxHeight = this._scrollAutoMaxHeight

    return style
  }

  private get _normalizedItems(): SelectItem[] {
    if (this._normalizedMemo?.epoch !== this._itemsEpoch) {
      this._normalizedMemo = {
        epoch: this._itemsEpoch,
        items: this._normalizeItems(this._ds.sourceItems),
      }
    }
    return this._normalizedMemo.items
  }

  /** Sanitised chunk size for array-mode paging (>= 1). */
  private get _pageSize(): number {
    const n = Math.floor(Number(this.pageSize))
    return Number.isFinite(n) && n > 0 ? n : 10
  }

  /**
   * The effective load-more mode. Off when unset/false; otherwise 'button' only
   * for the explicit `load-more="button"`, and 'scroll' for everything else that
   * enables it (bare attribute, empty string, `true`, or `"scroll"`). Scroll is
   * the default so enabling load-more "just works" without picking a mode.
   */
  private get _loadMoreMode(): SelectLoadMore | undefined {
    const v = this.loadMore
    if (v === undefined || v === null || v === false) return undefined
    return v === 'button' ? 'button' : 'scroll'
  }

  /**
   * The rows to actually render — the controller's visible slice, normalized.
   * (Array load-more reveals a chunk; DataSource mode accumulates pages.)
   */
  private get _visibleItems(): SelectItem[] {
    if (this._visibleMemo?.epoch !== this._itemsEpoch) {
      this._visibleMemo = {
        epoch: this._itemsEpoch,
        items: this._normalizeItems(this._ds.visibleItems),
      }
    }
    return this._visibleMemo.items
  }

  private get _selectedItem(): SelectItem | undefined {
    // Search leaf rows (when grouped, the selected row is nested in the tree).
    return this._leafItems.find((item) =>
      this._isSameValue(this._resolveItemValue(item), this.value),
    )
  }

  // --- Grouping --------------------------------------------------------------

  /** Grouping is active when at least one display-group accessor is given. */
  private get _grouped(): boolean {
    return Array.isArray(this.displayGroup) && this.displayGroup.length > 0
  }

  /** A node is a group when its `groupItems` field holds an array. */
  private _isGroupNode(x: unknown): x is Record<string, unknown> {
    return (
      !!x &&
      typeof x === 'object' &&
      Array.isArray((x as Record<string, unknown>)[this.groupItems])
    )
  }

  /** Descend `groupItems[0]` to the first leaf row — the group's representative. */
  private _firstLeaf(node: unknown): SelectItem | undefined {
    let cur: unknown = node
    let guard = 0
    while (this._isGroupNode(cur) && guard++ < 50) {
      cur = ((cur as Record<string, unknown>)[this.groupItems] as unknown[])?.[0]
    }
    return (cur ?? undefined) as SelectItem | undefined
  }

  /** Resolve a group header's label from `displayGroup[level]` over a leaf row. */
  private _resolveGroupLabel(node: Record<string, unknown>, level: number): string {
    const accessor = this.displayGroup[level]
    const leaf = this._firstLeaf(node)
    if (typeof accessor === 'function') {
      return String(accessor((leaf ?? {}) as SelectItem) ?? '')
    }
    if (typeof accessor === 'string' && leaf && accessor in (leaf as Record<string, unknown>)) {
      return String((leaf as Record<string, unknown>)[accessor] ?? '')
    }
    const key = node[this.groupKey]
    return key == null ? '' : String(key)
  }

  /** The string `display-group` entries — usable as server group/sort fields. */
  private _groupSortFields(): string[] {
    return (this.displayGroup ?? []).filter((a): a is string => typeof a === 'string')
  }

  /** A `display-group` level's key for a row (string → field, function → call). */
  private _groupKeyOf(row: SelectItem, level: number): unknown {
    const accessor = this.displayGroup[level]
    if (typeof accessor === 'function') return accessor(row)
    if (typeof accessor === 'string') return (row as Record<string, unknown>)[accessor]
    return undefined
  }

  /**
   * `group` mode: bucket flat rows into the nested `{ [groupKey], [groupItems] }`
   * shape client-side, by `display-group` level. Buckets keep first-appearance
   * order, so each group is contiguous and grows in place as more pages load.
   */
  private _buildClientTree(rows: SelectItem[]): unknown[] {
    const build = (items: SelectItem[], level: number): unknown[] => {
      if (level >= this.displayGroup.length) return items
      const buckets = new Map<string, { key: unknown; rows: SelectItem[] }>()
      for (const row of items) {
        const key = this._groupKeyOf(row, level)
        const ks = String(key)
        let bucket = buckets.get(ks)
        if (!bucket) buckets.set(ks, (bucket = { key, rows: [] }))
        bucket.rows.push(row)
      }
      return [...buckets.values()].map((b) => ({
        [this.groupKey]: b.key,
        [this.groupItems]: build(b.rows, level + 1),
      }))
    }
    return build(rows, 0)
  }

  /** The nested group nodes to render — built client-side in `group` mode. */
  private _groupNodes(): unknown[] {
    if (this.group) {
      const leaves = this._visibleItems.filter((it) => this._searchMatches(it))
      return this._buildClientTree(leaves)
    }
    return (this._ds.visibleItems as unknown[]) ?? []
  }

  /** Every leaf row — for value/display lookup. */
  private get _leafItems(): SelectItem[] {
    if (this._leafMemo?.epoch === this._itemsEpoch) return this._leafMemo.items
    const items = this._computeLeafItems()
    this._leafMemo = { epoch: this._itemsEpoch, items }
    return items
  }

  private _computeLeafItems(): SelectItem[] {
    if (!this._grouped) return this._normalizedItems
    // `group` mode: the source items are already the flat leaf rows.
    if (this.group) return [...(this._ds.sourceItems as SelectItem[])]
    const out: SelectItem[] = []
    const walk = (nodes: unknown[]): void => {
      for (const n of nodes) {
        if (this._isGroupNode(n)) walk((n as Record<string, unknown>)[this.groupItems] as unknown[])
        else if (n != null) out.push(n as SelectItem)
      }
    }
    walk((this._ds.sourceItems as unknown[]) ?? [])
    return out
  }

  /**
   * Flatten the visible group tree into ordered header / item render rows.
   * Leaves are search-filtered (client mode); empty groups are dropped.
   */
  private _groupRows(): Array<
    | { kind: 'group'; level: number; label: string; key: string }
    | { kind: 'item'; item: SelectItem; index: number }
  > {
    type Row =
      | { kind: 'group'; level: number; label: string; key: string }
      | { kind: 'item'; item: SelectItem; index: number }
    // group mode pre-filters leaves in `_groupNodes`; pre-grouped filters here.
    const filterLeaves = !this.group
    const build = (nodes: unknown[], level: number, parentKey: string): Row[] => {
      const rows: Row[] = []
      nodes.forEach((node, i) => {
        if (!this._isGroupNode(node)) {
          const item = node as SelectItem
          if (item == null) return
          if (filterLeaves && !this._searchMatches(item)) return
          rows.push({ kind: 'item', item, index: -1 })
          return
        }
        const rec = node as Record<string, unknown>
        const path = `${parentKey}/${String(rec[this.groupKey])}#${i}`
        const children = build((rec[this.groupItems] as unknown[]) ?? [], level + 1, path)
        if (!children.length) return
        rows.push({
          kind: 'group',
          level,
          label: this._resolveGroupLabel(rec, level),
          key: `g:${level}:${path}`,
        })
        rows.push(...children)
      })
      return rows
    }
    // Number the leaf rows in render order so `_activeIndex` / keyboard nav and
    // the active highlight line up with `_filteredItems`.
    let idx = 0
    return build(this._groupNodes(), 0, '').map((r) =>
      r.kind === 'item' ? { ...r, index: idx++ } : r,
    )
  }

  // --- Search ----------------------------------------------------------------

  /** Whether `search-value` names anything explicitly (vs falling back). */
  private get _hasSearchValue(): boolean {
    const sv = this.searchValue
    if (Array.isArray(sv)) return sv.length > 0
    return typeof sv === 'string' && !!sv.trim()
  }

  /**
   * The natural fields searched alongside the `'*'` default when `search-value` is
   * empty — the safety net, not the whole list.
   *
   * `'*'` resolves against loaded rows, so on a bound DataSource it expands to
   * NOTHING until the first page lands (nothing loads on open, and a query can
   * fire inside the debounce) — these keep that first query working. They are also
   * exempt from the remote string-only rule, so a numeric `key-value` stays
   * searchable. `display-value` contributes only when it's a string; a function
   * builds text that no field expression can reach, which is why `_searchMatches`
   * keeps matching the rendered display separately.
   */
  private _fallbackSearchFields(): Array<string | undefined> {
    return [typeof this.displayValue === 'string' ? this.displayValue : undefined, this.keyValue]
  }

  /**
   * A cheap signature of the rows' SHAPE, for the memo keys below.
   *
   * Row count alone isn't enough once `'*'` is in play: the resolved field list
   * depends on the rows' keys, and a remote source paging from one full page to
   * the next keeps the same length while the shape can differ. Sampling the first
   * and last row keeps this O(1) while catching that case.
   */
  private _rowsShapeKey(rows: readonly unknown[]): string {
    const keysOf = (row: unknown): string =>
      row && typeof row === 'object' ? Object.keys(row as object).join(',') : typeof row
    if (!rows.length) return '0'
    return `${rows.length}:${keysOf(rows[0])}|${keysOf(rows[rows.length - 1])}`
  }

  /**
   * `search-value` resolved to concrete entries — `*` patterns expanded against
   * the loaded rows. Memoized: a pattern samples up to 20 rows, so resolving per
   * item (this feeds `_searchMatches`) would be O(items × fields) per keystroke.
   *
   * With no `search-value` this defaults to `'*'` (every top-level field) plus the
   * natural fallbacks — see {@link _fallbackSearchFields}.
   */
  private _searchEntries(remote: boolean): MonoSearchExprEntry[] {
    const rows = this._normalizedItems
    const key = `${this._searchVersion} ${remote ? 1 : 0} ${this._rowsShapeKey(rows)}`
    if (this._entriesCache?.key === key) return this._entriesCache.entries
    const entries = resolveSearchFields({
      searchValue: this.searchValue,
      fallbackFields: this._fallbackSearchFields(),
      rows,
      remote,
      defaultToWildcard: true,
    })
    this._entriesCache = { key, entries }
    return entries
  }

  /** The compiled client-side predicate for the current query (memoized). */
  private _searchPredicate(): ((row: any) => boolean) | null {
    const query = this._query.trim()
    const operation = this.searchOperation || 'contains'
    const rows = this._normalizedItems
    const key = `${this._searchVersion} ${operation} ${this._rowsShapeKey(rows)} ${query}`
    if (this._predicateCache?.key === key) return this._predicateCache.pred
    const pred = searchRowPredicate(this._searchEntries(false), query, operation)
    this._predicateCache = { key, pred }
    return pred
  }

  /** A bound DataSource is searched on the server; a plain array, client-side. */
  private _serverSearch(): boolean {
    return !!this.dataSource
  }

  /** Client-side match test (server mode already filtered → always true). */
  private _searchMatches(item: SelectItem): boolean {
    if (this._serverSearch()) return true
    // Not typing → the field is showing the selected label, so offer the full list.
    if (!this._searchActive) return true
    const q = this._query.trim().toLowerCase()
    if (!q) return true

    // An explicit `search-value` means explicit control over what is searched, so
    // only its entries decide. Without one there is nothing authored to honour,
    // and the natural thing to match is what the user can actually see — the
    // display text (which may come from a `display-value` FUNCTION, unreachable
    // by any field expression) and the raw value.
    if (this._hasSearchValue) {
      const pred = this._searchPredicate()
      return pred ? pred(item) : true
    }

    const display = this._resolveItemDisplay(item).toLowerCase()
    const val = this._resolveItemValue(item)
    const valStr = val == null ? '' : String(val).toLowerCase()
    const pred = this._searchPredicate()
    return display.includes(q) || valStr.includes(q) || (pred ? pred(item) : false)
  }

  private _onSearchInput(event: Event): void {
    if (this.disabled || this.readonly) return

    this._query = (event.target as HTMLInputElement).value
    this._searchActive = true
    this._open = true
    this._activeIndex = 0
    // While filtering, the top result is the right place for the cursor — drop the
    // open-edge latch so a late server response can't yank it back to the
    // selected row mid-search.
    this._cursorPending = false
    this.requestUpdate() // instant client filter
    if (this._searchTimer) clearTimeout(this._searchTimer)
    const wait = Math.max(0, Number(this.searchDebounce) || 0)
    this._searchTimer = setTimeout(() => void this._applySearch(this._query), wait)
  }

  /** Run the search: server query (debounced) or just re-render for client filter. */
  private async _applySearch(query: string): Promise<void> {
    if (!this._serverSearch()) {
      this.requestUpdate()
      return
    }
    // `MonoSourceSearch` picks the strategy: plain columns ride the source's own
    // `searchValue` folding, while paths / `*` patterns / customs are compiled to
    // a `$filter` and AND-ed onto the consumer's own filter.
    await this._sourceSearch.apply(this.dataSource, {
      query,
      searchValue: this.searchValue,
      fallbackFields: this._fallbackSearchFields(),
      rows: this._normalizedItems,
      remote: true,
      defaultToWildcard: true,
      operation: this.searchOperation || 'contains',
    })
  }

  /** Clear the typed query (and the source query, on close / select). */
  private _resetSearch(): void {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = undefined
    }
    const had = this._searchActive && !!this._query
    this._query = ''
    this._searchActive = false
    this._activeIndex = -1
    if (had && this._serverSearch()) void this._applySearch('')
  }

  /** The label shown in the field while not actively typing a query. */
  private get _displayText(): string {
    const item = this._selectedItem
    return item ? this._resolveItemDisplay(item) : ''
  }

  /** Placeholder for the search field — a search hint while open, else the prompt. */
  private get _fieldPlaceholder(): string {
    if ((this._open || this._searchActive) && this.searchPlaceholder) {
      return this.searchPlaceholder
    }
    return this.placeholder
  }

  /**
   * The selectable rows in render order — drives keyboard nav (`_activeIndex`)
   * for the searchable combobox. Mirrors what `_renderItems` paints.
   */
  /**
   * Where the keyboard cursor goes when the list opens: the row matching the
   * current value, else the first row.
   *
   * Deliberately runs the SAME predicate that paints `.selected` in
   * `_renderOption`, over `_filteredItems` — the very list ↑/↓ and Enter index
   * into — so the cursor is guaranteed to land on the row drawn as selected.
   * Going via `_selectedItem` + `indexOf` would not work: that searches
   * `_leafItems`, an unfiltered/unpaged array whose `_normalizeItems` wraps
   * primitives in fresh objects per call, so identity would not hold. Grouping
   * needs no special case — `_groupRows()` numbers leaf rows only, which is
   * exactly what `_filteredItems` reconstructs.
   *
   * `-1` when the list is empty; `0` when the selected row is not in it (a page
   * the user hasn't scrolled to, or a server query that didn't return it), which
   * is the behaviour this component has always had.
   */
  private _initialActiveIndex(): number {
    const items = this._filteredItems
    if (!items.length) return -1

    const index = items.findIndex((item) =>
      this._isSameValue(this._resolveItemValue(item), this.value),
    )
    return index >= 0 ? index : 0
  }

  private get _filteredItems(): SelectItem[] {
    if (this._grouped) {
      return this._groupRows()
        .filter(
          (r): r is { kind: 'item'; item: SelectItem; index: number } =>
            r.kind === 'item',
        )
        .map((r) => r.item)
    }
    return this._visibleItems.filter((item) => this._searchMatches(item))
  }

  private get _hasValue(): boolean {
    return this.value !== null && this.value !== undefined && this.value !== ''
  }

  private get _hasLabelSlot(): boolean {
    return this._hasLabelSlotState
  }

  private get _hasHelperSlot(): boolean {
    return this._hasHelperSlotState
  }

  private get _hasPrefixSlot(): boolean {
    return this._hasPrefixSlotState
  }

  private get _hasSuffixSlot(): boolean {
    return this._hasSuffixSlotState
  }

  private get _resolvedValidationState(): SelectValidationState {
    if (this.validationState && this.validationState !== 'default') {
      return this.validationState
    }

    if (this.errorMessage) return 'invalid'
    if (this.successMessage) return 'valid'

    return 'default'
  }

  private get _wrapperClasses(): string {
    return [
      'mono-select',
      this.size,
      this.color,
      this.variant,
      this._open ? 'open' : '',
      this.disabled ? 'disabled' : '',
      this.readonly ? 'readonly' : '',
      this._resolvedValidationState !== 'default'
        ? `is-${this._resolvedValidationState}`
        : '',
      this._hasValue ? 'has-value' : '',
      this._hasPrefixSlot ? 'has-prefix' : '',
      this._hasSuffixSlot ? 'has-suffix' : '',
      this.cssClassName,
      this.cssClass?.root,
    ]
      .filter(Boolean)
      .join(' ')
  }

  private get _triggerClasses(): string {
    return [
      this._cls('mono-select-trigger', 'trigger'),
      this.size,
      this.color,
      this.variant,
      this.disabled ? 'disabled' : '',
      this.readonly ? 'readonly' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  private _createModelDetail(args: {
    modelValue: SelectValue
    oldValue: SelectValue
    sourceEvent?: Event
  }): SelectModelEventDetail {
    return {
      modelValue: args.modelValue,
      currentValue: args.modelValue,
      oldValue: args.oldValue,
      value: args.modelValue,
      // Leaf rows, matching `_selectedItem` — `_normalizedItems` holds GROUP
      // NODES for pre-grouped data, so searching it returned `undefined` there
      // even when the selection itself was fine.
      selectedItem: this._leafItems.find((item) =>
        this._isSameValue(this._resolveItemValue(item), args.modelValue),
      ),
      sourceEvent: args.sourceEvent,
    }
  }

  private _emitChange(detail: SelectModelEventDetail): void {
    dispatchMonoEvent(this, 'change', detail)
  }

  private _emitClear(detail: SelectModelEventDetail): void {
    dispatchMonoEvent(this, 'clear', detail)
  }

  private _toggleOpen(event?: Event): void {
    event?.stopPropagation()

    if (this.disabled || this.readonly) return

    if (this._open) this._close()
    else this._open = true
  }

  private _close(): void {
    this._open = false
    this._resetSearch()
  }

  private _handleDocumentClick = (event: MouseEvent): void => {
    if (!this._open || this.stayOpen) return

    const path = event.composedPath()
    // The dropdown panel may be relocated into a body portal — clicks inside it
    // must not count as "outside".
    if (path.includes(this) || this._popup.containsInPath(path)) return

    this._close()
  }

  /**
   * Close when focus lands anywhere else — tabbing into the next field, for
   * instance, which fires no click at all.
   *
   * Tests the INCOMING focus target rather than `focusout`/`relatedTarget` on the
   * way out: the panel is relocated into a `<body>` portal, so focus moving *into*
   * the panel reads as focus leaving the host and would close the dropdown the
   * moment you clicked into its own search box. The same `composedPath` guard the
   * click handler uses has no such ambiguity (and covers the shadow build, where
   * there is no portal and the panel sits in the host's shadow root).
   */
  private _handleDocumentFocusIn = (event: FocusEvent): void => {
    if (!this._open || this.stayOpen) return

    const path = event.composedPath()
    if (path.includes(this) || this._popup.containsInPath(path)) return

    this._close()
  }

  private _handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this._open) return

    if (event.key === 'Escape') {
      event.preventDefault()
      this._close()
      this._triggerEl?.focus()
    }
  }

  private _handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) return

    // Closed: Enter / Space / ↓ open it.
    if (!this._open) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        this._open = true
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        this._close()
      }
      return
    }

    // Open: the trigger drives the list. A non-searchable select has no other
    // element holding focus, so without this ↑/↓ and Enter did nothing at all
    // once the panel was open — navigation only ever worked in search mode.
    this._handleListKeydown(event)
  }

  /**
   * ↑/↓/Enter/Esc against the rendered list, shared by the trigger and the
   * search field so both modes navigate identically.
   */
  private _handleListKeydown(event: KeyboardEvent): boolean {
    const items = this._filteredItems

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this._open = true
      this._activeIndex = items.length ? Math.min(this._activeIndex + 1, items.length - 1) : -1
      return true
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this._activeIndex = items.length ? Math.max(this._activeIndex - 1, 0) : -1
      return true
    }

    if (event.key === 'Enter') {
      const active = this._activeIndex >= 0 ? items[this._activeIndex] : undefined
      if (!active) return false
      event.preventDefault()
      if (!active.disabled) this._selectItem(active, event)
      return true
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      this._close()
      return true
    }

    return false
  }

  // --- Searchable combobox interactions --------------------------------------

  /**
   * Focusing the field selects the shown label so the first keystroke replaces
   * it (type to filter). It does NOT open the dropdown: a Tab into the field is
   * not a request to see the list — typing, ↓, a click in the field or the
   * chevron are.
   */
  private _handleSearchFocus(event: Event): void {
    if (this.disabled || this.readonly) return
    ;(event.target as HTMLInputElement).select()
  }

  /**
   * Clicking anywhere in a SEARCHABLE field opens it and focuses the input.
   * Opens only — a click in a text input while the list is open is caret
   * placement or text selection, never a toggle; the chevron, Escape and an
   * outside click close. (The plain trigger is a button that toggles instead:
   * nothing to type there, so a second click means "close".)
   */
  private _handleFieldClick(event: Event): void {
    event.stopPropagation()
    if (this.disabled || this.readonly) return
    this._open = true
    this._searchFieldEl?.focus()
  }

  /** Keyboard nav for the search field: arrows move, Enter selects, Esc closes. */
  private _handleSearchKeydown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) return
    this._handleListKeydown(event)
  }

  private _selectItem(item: SelectItem, event?: Event): void {
    event?.preventDefault()
    event?.stopPropagation()

    if (this.disabled || this.readonly || item.disabled) return

    const oldValue = this.modelValue
    const nextValue = this._resolveItemValue(item)

    this.value = nextValue as SelectValue
    this.modelValue = nextValue as SelectValue
    this._open = false
    this._resetSearch()

    const detail = this._createModelDetail({
      modelValue: nextValue,
      oldValue,
      sourceEvent: event,
    })

    this._emitChange(detail)
    // Searchable: options use mousedown-preventDefault so the field keeps focus
    // through the click; the field now shows the new selection's label, which we
    // select so a follow-up keystroke replaces it. Plain mode returns focus to
    // the button trigger.
    if (this.searchable) {
      void this.updateComplete.then(() => this._searchFieldEl?.select())
    } else {
      this._triggerEl?.focus()
    }
  }

  private _clear(event: Event): void {
    event.preventDefault()
    event.stopPropagation()

    if (this.disabled || this.readonly) return

    const oldValue = this.modelValue
    const nextValue = null

    this.value = nextValue
    this.modelValue = nextValue
    this._open = false
    this._resetSearch()

    const detail = this._createModelDetail({
      modelValue: nextValue,
      oldValue,
      sourceEvent: event,
    })

    this._emitChange(detail)
    this._emitClear(detail)

    if (this.searchable) this._searchFieldEl?.focus()
  }
  private _renderLabel(): TemplateResult | typeof nothing {
    const hasContent = !!this.label || this._hasLabelSlot
    if (!hasContent && !this._slotsAlwaysRender) return nothing

    return html`
      <label
        class=${this._cls('mono-select-label', 'label')}
        mono-label
        for=${this._selectId}
        ?mono-empty=${!hasContent}
      >
        ${this._slotOutlet('label', this.label)}

        ${this.required
        ? html`
              <span class=${this._cls('mono-select-required', 'required')} mono-required-mark>
                *
              </span>
            `
        : nothing}
      </label>
    `
  }

  private _renderValue(): TemplateResult {
    if (this._hasValue && this._selectedItem) {
      return html`
        <span class=${this._cls('mono-select-value', 'value')} mono-value>
          ${this._hasPrefixSlot || this._slotsAlwaysRender
          ? this._slotOutlet('prefix')
          : nothing}

          <span>${this._resolveItemDisplay(this._selectedItem)}</span>

          ${this._hasSuffixSlot || this._slotsAlwaysRender
          ? this._slotOutlet('suffix')
          : nothing}
        </span>
      `
    }

    return html`
      <span
        class=${`${this._cls('mono-select-value', 'value')} ${this._cls(
      'mono-select-placeholder',
      'placeholder',
    )}`}
        mono-value
        mono-placeholder
      >
        ${this.placeholder}
      </span>
    `
  }

  /** A single selectable option button. `index` drives the keyboard-active highlight. */
  private _renderOption(item: SelectItem, index = -1): TemplateResult {
    const selected = this._isSameValue(this._resolveItemValue(item), this.value)
    const active = index >= 0 && index === this._activeIndex

    const itemClass = [
      this._cls('mono-select-item', 'item'),
      active ? `active ${this.cssClass?.itemActive ?? ''}` : '',
      selected ? `selected ${this.cssClass?.itemSelected ?? ''}` : '',
      item.disabled ? `disabled ${this.cssClass?.itemDisabled ?? ''}` : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <button
        type="button"
        role="option"
        class=${itemClass}
        mono-item
        ?mono-active=${active}
        ?mono-selected=${selected}
        ?mono-disabled=${!!item.disabled}
        aria-selected=${selected ? 'true' : 'false'}
        ?disabled=${item.disabled}
        @mousedown=${(event: MouseEvent) => event.preventDefault()}
        @click=${(event: Event) => this._selectItem(item, event)}
      >
        ${this._resolveItemDisplay(item)}
      </button>
    `
  }

  // --- slot="list" -----------------------------------------------------------
  //
  // The consumer draws the option rows; mono keeps the panel, the search, the grouping, the
  // keyboard and the value. Same contract as `mono-tag-input`, minus the checkbox — picking here
  // SETS the value and closes, rather than toggling one of many.

  private _publishedEntries: MonoFormListEntry[] = []

  /**
   * The flat entry list published to `form.items()[key].list`.
   *
   * The SAME sequence the component renders — group headers interleaved with their leaves — so a
   * consumer looping it produces one node per row, in order, with nothing to pair up by hand.
   *
   * `key` is `item[keyValue]` via `_resolveItemValue`, the same value selection is keyed by, so
   * the feature introduces no second notion of a key.
   */
  private _listEntries(): MonoFormListEntry[] {
    // `selected` / `active` ride ALONG because the consumer draws the row: mono cannot put a
    // highlight inside a subtree it does not own, so it reports the two states and the row binds
    // them.
    const rowEntry = (item: SelectItem, level: number, index: number): MonoFormListEntry => ({
      type: 'row',
      key: String(this._resolveItemValue(item) ?? ''),
      item: item as Record<string, unknown>,
      level,
      selected: this._isSameValue(this._resolveItemValue(item), this.value),
      active: index >= 0 && index === this._activeIndex,
    })

    if (this._grouped) {
      const rows = this._groupRows()

      // A group's `items` is derived here rather than carried by `_groupRows()`, whose own rows
      // only ever needed a caption to render. A group's leaves are the item rows that FOLLOW it,
      // up to the next header at its level or above — the same nesting the flat sequence already
      // encodes, read back out so a consumer can show a count without walking the list itself.
      const leavesFrom = (start: number, level: number): Record<string, unknown>[] => {
        const out: Record<string, unknown>[] = []
        for (let i = start + 1; i < rows.length; i++) {
          const row = rows[i]!
          if (row.kind === 'group') {
            if (row.level <= level) break
            continue
          }
          out.push(row.item as Record<string, unknown>)
        }
        return out
      }

      // A row's level is the depth of the group it sits IN, which is the last header's level plus
      // one — the same thing tag-input's `_groupRows()` stamps on each leaf directly. Select's own
      // group rows carry no level (they never needed one to render), so it is read back off the
      // sequence here; without this every grouped row reports 0 and a consumer indenting by
      // `e.level` gets a flat wall from select and correct steps from the tag input.
      let rowLevel = 0

      return rows.map((row, i) => {
        if (row.kind === 'group') {
          rowLevel = row.level + 1
          return {
            type: 'group' as const,
            key: row.key,
            label: row.label,
            level: row.level,
            items: leavesFrom(i, row.level),
          }
        }
        return rowEntry(row.item, rowLevel, row.index)
      })
    }

    return this._filteredItems.map((item, index) => rowEntry(item, 0, index))
  }

  /**
   * Hand the form the current entries — but only a NEW array when they actually moved.
   *
   * This runs from `updated()`, so it fires on every render; the controller notifies on a changed
   * list, and that notify re-renders this control. Returning the same array reference is what keeps
   * that from looping forever. Identity of `item` counts as a change: a reloaded DataSource hands
   * back fresh row objects under the same keys, and a consumer reading `e.item.Nama` must see them.
   */
  protected _syncListEntries(): void {
    const next = this._listEntries()
    const prev = this._publishedEntries

    let same = prev.length === next.length
    if (same) {
      for (let i = 0; i < next.length; i++) {
        const a = prev[i] as MonoFormListEntry
        const b = next[i] as MonoFormListEntry
        if (
          a.type !== b.type
          || a.key !== b.key
          || a.item !== b.item
          || a.selected !== b.selected
          || a.active !== b.active
        ) {
          same = false
          break
        }
      }
    }
    if (same) return

    this._publishedEntries = next
    this._publishList(next)
  }

  /**
   * Where the consumer's `slot="list"` content goes — overridden per build.
   *
   * mono places that content as ONE block and never reaches inside it. Moving a `v-for`'s children
   * is not survivable: Vue inserts a new row with `parent.insertBefore(node, anchor)` where the
   * anchor is the existing node at that position, so relocating one makes the consumer's next
   * insert throw `NotFoundError`. Hence one block, and hence `data-mono-item-key` — with the rows
   * out of reach, a delegated click is the only way back to the item.
   */
  protected renderListSlot(): TemplateResult {
    return html``
  }

  /**
   * The entry a click landed on — by POSITION, so a consumer writes a plain `v-for` and nothing else.
   *
   * mono cannot read a node's item off the node: it published the list, but the DOM was built by
   * someone else. What it CAN do is count. The wrapper's Nth element child is the Nth published
   * entry, because that is the contract the slot already states — one flat loop, one node per entry,
   * in order — and here that contract is CHECKED rather than assumed: if the two lengths disagree,
   * this refuses the click instead of picking the wrong row.
   *
   * Position is resolved at CLICK time, never cached. That is what makes it safe with no observer
   * and no re-stamping: by the time a human clicks, the framework has long finished patching, so
   * there is no window where a stale pairing could be consulted.
   *
   * `data-mono-item-key` still wins when present — the escape hatch for a wrapper that cannot emit
   * exactly one element per entry (a sticky header of your own, a row that renders as a fragment).
   */
  /**
   * The consumer's `slot="list"` wrapper, wherever the build keeps it.
   *
   * The shadow build never moves it — it stays a light child of the host and is PROJECTED — so
   * that is the default. The light build moves it into the panel and overrides this with the node
   * it captured, which is also findable while the panel is closed and the wrapper parked.
   */
  protected get _listSlotWrapper(): HTMLElement | null {
    return this._lateListSlot.find() as HTMLElement | null
  }

  private _listChromeObserver?: MutationObserver
  private _observedListWrapper?: Element

  /**
   * Re-decorate whenever the consumer re-renders their rows.
   *
   * `_syncListChrome()` runs from `updated()`, but a framework patches the wrapper on ITS next
   * tick — so a row the search box just revealed would be born undecorated and stay that way until
   * something else made mono render. This closes that gap.
   *
   * `childList` on the WRAPPER, which is exactly the churn {@link LateSlotWatcher} refuses on the
   * host: there the consumer's row traffic is noise, here it IS the signal. No `subtree`, so
   * mono's own attribute writes cannot re-trigger it.
   */
  protected _watchListChrome(): void {
    if (typeof MutationObserver === 'undefined') return

    const wrapper = this._listSlotWrapper
    if (!wrapper || wrapper === this._observedListWrapper) return

    this._listChromeObserver?.disconnect()
    this._observedListWrapper = wrapper
    this._listChromeObserver = new MutationObserver(() => this._syncListChrome())
    this._listChromeObserver.observe(wrapper, { childList: true })
  }

  protected _stopWatchingListChrome(): void {
    this._listChromeObserver?.disconnect()
    this._listChromeObserver = undefined
    this._observedListWrapper = undefined
  }

  /**
   * Decorate the lines the consumer rendered — the half of this feature that keeps the SLOT about
   * markup and mono about behaviour.
   *
   * Your template says what a line LOOKS like; the state it is in is stamped here, as `data-*`
   * attributes, so nothing in that template has to bind `e.selected` or `e.active` to say so.
   *
   * Where the tag input also injects a checkbox, this stops at the stamp: a select carries no
   * checkbox and no select-all, so there is no chrome to put anywhere.
   *
   * Three rules keep this safe beside a framework:
   *   · children are ANNOTATED only, never moved, reordered or removed — every `insertBefore`
   *     anchor a `v-for` patches against stays valid;
   *   · `data-*` only, never `class` — `class` is the consumer's binding and would be clobbered;
   *   · nothing is stamped unless the lines and the published entries match 1:1.
   */
  protected _syncListChrome(): void {
    // No isServer guard, for the same reason `_syncListEntries` has none: this only ever runs from
    // a build's `updated()`, which a server render never reaches, and every line below is a no-op
    // without a wrapper to walk.
    if (!this._hasListSlotState) return

    const wrapper = this._listSlotWrapper
    if (!wrapper) return

    const children = Array.from(wrapper.children)
    const entries = this._publishedEntries
    if (children.length !== entries.length) return

    for (let i = 0; i < children.length; i++) {
      const node = children[i] as HTMLElement
      const entry = entries[i] as MonoFormListEntry

      node.setAttribute('data-mono-type', entry.type)
      node.setAttribute('data-mono-level', String(entry.level ?? 0))
      // NOT `data-mono-item-key`: that name belongs to the consumer as the explicit pairing
      // override, and a stale stamp under it would defeat the count check above.
      node.setAttribute('data-mono-key', entry.key)

      if (entry.type === 'group') continue

      node.toggleAttribute('data-mono-selected', !!entry.selected)
      node.toggleAttribute('data-mono-active', !!entry.active)
    }
  }

  private _entryFromNode(node: Element): MonoFormListEntry | undefined {
    const keyed = node.closest?.('[data-mono-item-key]') as HTMLElement | null
    if (keyed) {
      const key = keyed.getAttribute('data-mono-item-key')
      return this._publishedEntries.find((e) => e.type === 'row' && e.key === key)
    }

    // The wrapper is the consumer's `slot="list"` element. It is a light-DOM ancestor of the row in
    // BOTH builds — the light build keeps the attribute on the node it moves, the shadow build
    // needs it for native projection — so one lookup serves both.
    const wrapper = node.closest?.('[slot="list"]') as HTMLElement | null
    if (!wrapper) return undefined

    let row: Element | null = node
    while (row && row.parentElement !== wrapper) row = row.parentElement
    if (!row) return undefined

    const children = Array.from(wrapper.children)
    if (children.length !== this._publishedEntries.length) {
      console.warn(
        `[mono-select] slot="list" rendered ${children.length} element(s) for ${this._publishedEntries.length} ` +
          'option(s), so a click cannot be paired with its row. Render exactly one element per ' +
          'entry, or put data-mono-item-key="<entry.key>" on each row.',
      )
      return undefined
    }

    // A group header resolves to a 'group' entry, which is not selectable — clicking one is a no-op,
    // exactly as it is on mono's own headers.
    const entry = this._publishedEntries[children.indexOf(row)]
    return entry?.type === 'row' ? entry : undefined
  }

  /**
   * A click anywhere in the consumer's list, resolved back to an item.
   *
   * Delegated, because mono does not own the rows and so has nowhere to bind a per-row handler.
   * The walk starts at `event.target`, which may be an icon or a span deep inside the row.
   * Single-select, so this SETS the value and closes — the same thing `_renderOption` does.
   */
  protected _onListSlotClick = (event: Event): void => {
    if (this.disabled || this.readonly) return

    const target = event.target as Element | null
    const item = target ? (this._entryFromNode(target)?.item as SelectItem | undefined) : undefined
    if (!item || item.disabled) return

    this._selectItem(item, event)
  }

  private _emptyRow(): TemplateResult {
    const text = this.dataSource && this._ds.loading ? 'Loading…' : this._query ? 'No matches' : 'No items'
    return html`<div class=${this._cls('mono-select-item disabled', 'itemDisabled')} mono-empty-row>${text}</div>`
  }

  private _renderItems(): TemplateResult {
    // The slot is checked FIRST, ahead of grouping: the entries it publishes already carry the
    // group headers interleaved with their leaves, so a grouped list is still the consumer's to
    // draw. Falling through to the grouped branch would paint mono's own rows instead and strand
    // the wrapper with nowhere to be placed.
    //
    // It also renders when the list is empty. The wrapper is a live framework subtree whose
    // `v-for` inserts against anchors INSIDE it; dropping it for the frame where a search matches
    // nothing would tear those out and take the consumer's next insert with them. mono's empty row
    // renders above it instead - with no rows the consumer's loop paints nothing anyway.
    if (this._hasListSlotState) {
      return html`
        ${this._filteredItems.length ? nothing : this._emptyRow()}
        ${this.renderListSlot()}
      `
    }

    if (this._grouped) {
      const rows = this._groupRows()
      if (!rows.some((r) => r.kind === 'item')) return this._emptyRow()
      return html`
        ${rows.map((row) =>
        row.kind === 'group'
          ? html`<div
                class=${`${this._cls('mono-select-group', 'group')}${this.groupSticky ? ' sticky' : ''}`}
                mono-group
                mono-level=${row.level}
                ?mono-sticky=${this.groupSticky}
                data-level=${row.level}
                role="presentation"
              >
                ${row.label}
              </div>`
          : this._renderOption(row.item, row.index),
      )}
      `
    }

    const items = this._visibleItems.filter((item) => this._searchMatches(item))
    if (!items.length) return this._emptyRow()
    return html`${items.map((item, index) => this._renderOption(item, index))}`
  }

  private _renderLoadMore(): TemplateResult | typeof nothing {
    if (!this._loadMoreMode) return nothing
    // Nothing loaded yet, or nothing left to load/reveal → no affordance.
    if (!this._normalizedItems.length || this._ds.atLastPage) return nothing

    // Only DataSource paging is async; array paging reveals instantly.
    if (this._ds.loadingMore) {
      return html`
        <div class=${`${this._cls('mono-select-load-more', 'loadMore')} loading`} mono-load-more mono-loading>
          Loading…
        </div>
      `
    }

    // Scroll mode loads automatically; no button needed.
    if (this._loadMoreMode !== 'button') return nothing

    return html`
      <button
        type="button"
        class=${this._cls('mono-select-load-more', 'loadMore')}
        mono-load-more
        @click=${(event: Event) => {
        event.preventDefault()
        event.stopPropagation()
        void this._ds.loadMore()
      }}
      >
        Load more
      </button>
    `
  }

  private _renderHelper(): TemplateResult | typeof nothing {
    const base = this._cls('mono-select-message', 'message')
    if (this.validationMessage) {
      const state = this._resolvedValidationState
      return html`
        <div class=${`${base} ${state}`} mono-message=${state} role=${state === 'invalid' ? 'alert' : nothing}>
          ${this.validationMessage}
        </div>
      `
    }

    if (this.errorMessage) {
      return html`
        <div class=${`${base} invalid`} mono-message="invalid" role="alert">
          ${this.errorMessage}
        </div>
      `
    }

    if (this.successMessage) {
      return html`
        <div class=${`${base} valid`} mono-message="valid">
          ${this.successMessage}
        </div>
      `
    }

    if (this.helperText || this._hasHelperSlot || this._slotsAlwaysRender) {
      return html`
        <div
          class=${`${base} helper`}
          mono-message="helper"
          ?mono-empty=${!this.helperText && !this._hasHelperSlot}
        >
          ${this._slotOutlet('helper', this.helperText)}
        </div>
      `
    }

    return nothing
  }

  /** Shared clear (×) / chevron action. `toggleArrow` lets the chevron close an
   * already-open dropdown in the searchable field (the plain button toggles itself).
   *
   * ONE glyph, matching `<mono-tag-input>` and `<mono-dropdown-table>`: with a
   * clearable value the corner shows `✕` alone — clearing is the useful action
   * then, and the chevron would only say what the value already says. Without a
   * value (or `clearable` off) the chevron is alone. `disabled` / `readonly`
   * show NEITHER: the field refuses every gesture, so a chevron would promise an
   * open it never delivers. The actions span still renders so the gutter — and
   * the text beside it — stays put when the state toggles.
   *
   * THE VALUE WINS over the open state. On a searchable field the chevron is the
   * only mouse way to CLOSE — the body OPENS but never closes there (a click in a
   * text input is caret placement, not a toggle) — and it was once kept beside
   * `✕` for exactly that reason. The rule now is the simpler one: while there is
   * something to clear there is no chevron, open or closed; a searchable field
   * with a value closes by picking, Escape or an outside click. `role="button"`
   * on a span, not a `<button>`: the plain trigger is itself a button and buttons
   * do not nest. `mousedown.preventDefault` keeps focus where it is (the search
   * input); `_toggleOpen` stops propagation so the plain trigger does not toggle
   * a second time. */
  private _renderActions(): TemplateResult {
    const inert = this.disabled || this.readonly
    const canClear = this.clearable && this._hasValue && !inert
    const showArrow = !inert && !canClear
    return html`
      <span class=${this._cls('mono-select-actions', 'actions')} mono-actions>
        ${canClear
        ? html`
              <span
                role="button"
                tabindex="-1"
                class=${this._cls('mono-select-clear', 'clear')}
                mono-clear
                aria-label="Clear select"
                @mousedown=${(event: MouseEvent) => event.preventDefault()}
                @click=${this._clear}
              >
                ${this.renderIcon('close')}
              </span>
            `
        : nothing}
        ${showArrow
        ? html`
              <span
                role="button"
                tabindex="-1"
                class=${this._cls('mono-select-arrow', 'arrow')}
                mono-arrow
                aria-label="Toggle options"
                aria-expanded=${this._open ? 'true' : 'false'}
                @mousedown=${(event: MouseEvent) => event.preventDefault()}
                @click=${this._toggleOpen}
              >
                ${this.renderIcon('chevron')}
              </span>
            `
        : nothing}
      </span>
    `
  }

  /** Plain trigger: a button showing the selected value (non-searchable). */
  private _renderButtonTrigger(
    ariaLabel?: string,
    describedBy?: string,
  ): TemplateResult {
    return html`
      <button
        id=${this._selectId}
        type="button"
        class=${this._triggerClasses}
        mono-trigger
        ?disabled=${this.disabled}
        aria-haspopup="listbox"
        aria-expanded=${this._open ? 'true' : 'false'}
        aria-controls=${this._listboxId}
        aria-label=${ifDefined(ariaLabel)}
        aria-describedby=${ifDefined(describedBy)}
        @click=${this._toggleOpen}
        @keydown=${this._handleTriggerKeydown}
      >
        ${this._renderValue()}
        ${this._renderActions()}
      </button>
    `
  }

  /** Searchable trigger: the field itself is a search input (combobox). */
  private _renderSearchTrigger(
    ariaLabel?: string,
    describedBy?: string,
  ): TemplateResult {
    return html`
      <div class=${this._triggerClasses} mono-trigger @click=${this._handleFieldClick}>
        <input
          id=${this._selectId}
          class=${this._cls('mono-select-search-field', 'searchField')}
          mono-search-field
          type="text"
          role="combobox"
          autocomplete="off"
          aria-haspopup="listbox"
          aria-expanded=${this._open ? 'true' : 'false'}
          aria-controls=${this._listboxId}
          aria-label=${ifDefined(ariaLabel)}
          aria-describedby=${ifDefined(describedBy)}
          .value=${this._searchActive ? this._query : this._displayText}
          placeholder=${this._fieldPlaceholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @input=${this._onSearchInput}
          @focus=${this._handleSearchFocus}
          @keydown=${this._handleSearchKeydown}
        />
        ${this._renderActions()}
      </div>
    `
  }

  /**
   * Explicit sizing. Each accepts a CSS length string (`"320px"`, `"80%"`) or a
   * number (interpreted as px). Use `width="100%"` for a full-width field.
   */
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

  /** Inline sizing applied to the root wrapper. */
  private _sizeStyle() {
    return buildSizeStyle(this)
  }

  protected override render(): TemplateResult {
    const describedBy =
      this.validationMessage ||
        this.errorMessage ||
        this.successMessage ||
        this.helperText ||
        this._hasHelperSlot
        ? this._messageId
        : undefined

    const ariaLabel =
      this.ariaLabelText ||
      this.label ||
      this.placeholder ||
      undefined

    // The dropdown's HOST renders unconditionally, only its CONTENTS are gated on
    // `_open`. Both halves of that are load-bearing:
    //
    // - The host cannot be conditional. `PopupPortalController` physically moves this
    //   node into a <body> portal and never moves it back, so a `nothing` branch
    //   strands it — a ChildPart can only remove nodes still inside its own range —
    //   and re-enabling renders a SECOND one. (Confirmed on `mono-table-search`,
    //   which produced two panels, the stale one still holding stale options.) It is
    //   also the target of the trigger's `aria-controls`.
    // - The contents must be gated. Closing is CSS-only (`display: none`), so the
    //   whole option list used to sit in the document for every select on the page
    //   whether or not anyone had opened it. Measured on 200 selects x 30 options:
    //   6000 option elements, and ~209ms of a ~384ms mount.
    //
    // Safe once portaled, because the ChildPart markers move WITH the panel — which
    // is also why typing already adds and removes options inside an open, portaled
    // panel.
    // The wrapper's `mono-*` attributes mirror the props one for one and are what
    // select.css styles (`[mono-select][mono-size="sm"]`); a prop at its default
    // emits NO attribute, so the DOM reads exactly like the hand-written CSS-tab
    // markup. `mono-open` is the open STATE (the portal mirrors it onto the
    // relocated panel's parent). The classes stay as inert hooks until 2.0.
    const state = this._resolvedValidationState
    return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-select
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
        mono-validation-state=${state === 'default' ? nothing : state}
        ?mono-open=${this._open}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
        ?mono-searchable=${this.searchable}
      >
        ${this._renderLabel()}

        ${this.searchable
        ? this._renderSearchTrigger(ariaLabel, describedBy)
        : this._renderButtonTrigger(ariaLabel, describedBy)}

        <div
          id=${this._listboxId}
          role="listbox"
          class=${this._cls('mono-select-dropdown', 'dropdown')}
          mono-dropdown
          style=${styleMap(this._dropdownPanelStyle)}
        >
          <div
            class=${this._cls('mono-select-dropdown-body', 'dropdownBody')}
            mono-dropdown-body
            style=${styleMap(this._dropdownBodyStyle)}
            @scroll=${this._handleDropdownScroll}
          >
            ${this._open ? this._renderItems() : nothing}
            ${this._open ? this._renderLoadMore() : nothing}
          </div>
        </div>

        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>
          ${this._renderHelper()}
        </div>
      </div>
    `
  }

  public override focus(options?: FocusOptions): void {
    if (this.searchable) this._searchFieldEl?.focus(options)
    else this._triggerEl?.focus(options)
  }

  public override blur(): void {
    if (this.searchable) this._searchFieldEl?.blur()
    else this._triggerEl?.blur()
  }

  /** Whether the dropdown panel is currently open. */
  public get isOpen(): boolean {
    return this._open
  }

  public open(): void {
    if (this.disabled || this.readonly) return
    this._open = true
  }

  public close(): void {
    this._close()
  }

  public toggle(): void {
    if (this.disabled || this.readonly) return
    if (this._open) this._close()
    else this._open = true
  }

  // --- build hooks -----------------------------------------------------------

  /** Coerce a possibly-stringy SSR value to a real boolean (matches
   *  `booleanStringConverter`: a bare / empty attribute means present → true). */
  protected _toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (value == null) return false
    const s = String(value).toLowerCase().trim()
    return s === '' || s === 'true'
  }

  /** Whether the slot regions render even when empty. Light: no (omit empty
   *  regions). Shadow: yes — the native `<slot>`s must exist to project DSD
   *  content + be scanned (hidden via `[mono-empty]` when empty). */
  protected get _slotsAlwaysRender(): boolean {
    return false
  }

  protected _hasSlot(name: SelectSlotName): boolean {
    return name === 'label'
      ? this._hasLabelSlotState
      : name === 'helper'
        ? this._hasHelperSlotState
        : name === 'prefix'
          ? this._hasPrefixSlotState
          : name === 'suffix'
            ? this._hasSuffixSlotState
            : this._hasListSlotState
  }

  protected _setSlotState(name: SelectSlotName, has: boolean): void {
    if (name === 'label') this._hasLabelSlotState = has
    else if (name === 'helper') this._hasHelperSlotState = has
    else if (name === 'prefix') this._hasPrefixSlotState = has
    else if (name === 'suffix') this._hasSuffixSlotState = has
    else this._hasListSlotState = has
  }

  /**
   * Slot outlet. Light build (default): a `data-mono-slot` placeholder the
   * captured light-DOM nodes are re-parented into when present, else the prop
   * `fallback`. Shadow build overrides this with a native `<slot name>` that
   * carries the fallback as native slot content.
   */
  protected _slotOutlet(name: SelectSlotName, fallback: unknown = nothing): TemplateResult {
    return this._hasSlot(name)
      ? html`<span data-mono-slot=${name}></span>`
      : html`${fallback}`
  }

  /**
   * Icon hook. Light build (default): the global `.mono-icon` / `i-mdi-*` UnoCSS
   * icon. Shadow overrides with inline SVG (UnoCSS can't reach a shadow root).
   */
  protected renderIcon(name: 'close' | 'chevron'): TemplateResult {
    const cls = name === 'close' ? 'i-mdi-close' : 'i-mdi-chevron-down'
    return html`<span class=${`mono-icon ${cls}`} mono-icon aria-hidden="true"></span>`
  }
}

  return MonoSelectCoreClass as unknown as Constructor<MonoSelectCoreInterface> & T
}

/** Public + shared-protected surface added by the core mixin (types the wrappers
 *  + the `HTMLElementTagNameMap` augmentation in the light build). */
export declare class MonoSelectCoreInterface {
  size: SelectSize
  color: SelectColor
  variant: SelectVariant
  modelValue: SelectValue
  value: SelectValue
  name: string
  label: string
  placeholder: string
  helperText: string
  validationState: SelectValidationState
  validationMessage: string
  errorMessage: string
  successMessage: string
  ariaLabelText?: string
  disabled: boolean
  readonly: boolean
  required: boolean
  clearable: boolean
  items: SelectItem[]
  dataSource: SelectDataSource | null
  immediate: boolean
  loadMore?: SelectLoadMore | '' | boolean
  pageSize: number
  dropdown?: SelectDropdownOptions
  dropdownHeight: string | number
  dropdownMaxHeight: string | number
  flip: boolean
  shift: boolean
  keyValue: string
  displayValue: SelectDisplayValue
  displayGroup: SelectDisplayGroup
  groupKey: string
  groupItems: string
  group: boolean
  groupSticky: boolean
  searchable: boolean
  stayOpen: boolean
  searchValue: MonoSearchValue
  searchOperation: string
  searchDebounce: number
  searchPlaceholder: string
  cssClass: SelectCssClass
  cssClassName: string
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  focus(): void
  blur(): void
  readonly isOpen: boolean
  open(): void
  close(): void
  toggle(): void

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected _hasPrefixSlotState: boolean
  protected _hasSuffixSlotState: boolean
  protected _hasListSlotState: boolean
  protected _lateListSlot: LateSlotWatcher
  protected _onLateListSlot(): void
  protected get _listSlotWrapper(): HTMLElement | null
  protected _watchListChrome(): void
  protected _stopWatchingListChrome(): void
  protected _syncListChrome(): void
  protected renderListSlot(): TemplateResult
  protected _onListSlotClick: (event: Event) => void
  protected readonly _listSlotTarget: HTMLElement | null
  protected get _slotsAlwaysRender(): boolean
  protected _toBoolean(value: unknown): boolean
  protected _setSlotState(name: SelectSlotName, has: boolean): void
  protected _slotOutlet(name: SelectSlotName, fallback?: unknown): TemplateResult
  protected renderIcon(name: 'close' | 'chevron'): TemplateResult
}