// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  TagInputSize,
  TagInputColor,
  TagInputVariant,
  TagInputChipProps,
  TagInputDropdownOptions,
  TagInputValidationState,
  TagInputValue,
  TagInputItem,
  TagInputDataSource,
  TagInputLoadMore,
  TagInputDisplayValue,
  TagInputDisplayGroup,
  TagInputCssClass,
  TagInputModelEventDetail,
} from './tag-input-types.js'
import type { ChipBehaviour, ChipColor, ChipCssClass, ChipVariant } from '../chip/chip-types.js'
import type { MonoFormListEntry } from '../form/form-types.js'

import {
  arrayHasChanged,
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { DataSourceController } from '../../composables/data-source-controller'
import { ChipStripController } from '../../composables/chip-strip'
import { caretIcon, chevronIcon } from '../../composables/field-icons'
import { buildSizeStyle, toCssSize, type CssSizeValue } from '../../composables/css-size'
import { PopupPortalController } from '../../composables/popup-portal'
import { LateSlotWatcher } from '../../composables/light-slots'
import { MonoFormControlCore } from '../form/form-control-core.js'
import { unwrapReactive, unwrapReactiveDeep } from '../../composables/reactive'
import {
  MonoSourceSearch,
  resolveSearchFields,
  searchRowPredicate,
  type MonoSearchExprEntry,
  type MonoSearchValue,
} from '../../search/data-search.js'
import { readAllRows } from '../../utils/data-source-read'
import { resolveChipLimit, visibleChipCap } from '../../composables/chip-limits'

/** Named slots projected by `mono-tag-input` (light: captured; shadow: native). */
export type TagInputSlotName = 'label' | 'helper' | 'list'

const numberStringConverter = {
  fromAttribute(value: string | null): number | undefined {
    if (value === null || value === '') return undefined

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : undefined
  },

  toAttribute(value: number | undefined): string | null {
    if (value === undefined || value === null) return null

    return String(value)
  },
}

/**
 * `MonoTagInputCore` — render-mode-agnostic logic for `mono-tag-input` (props,
 * hybrid aliases, array value/model sync, DataSource paging, search, grouping,
 * keyboard, tag chips, the popup controller, and the full `render()`). SSR-safe:
 * every `document`/`window`/focus access is `isServer`-guarded. Each build
 * supplies `createRenderRoot()` + `static styles`, the slot strategy (light
 * captures children into `data-mono-slot` placeholders; shadow uses native
 * `<slot>`), and the `_slotOutlet` / `renderIcon` hooks. Mirrors `select-core`.
 */
export const MonoTagInputCore = <T extends Constructor<LitElement>>(superClass: T) => {
class MonoTagInputCoreClass extends MonoFormControlCore(superClass) {
  constructor(...args: any[]) {
    super(...args)

    defineHybridPropAliases(this, [
      'modelValue',
      'helperText',
      'validationState',
      'validationMessage',
      'errorMessage',
      'successMessage',
      'allowCustom',
      'maxVisible',
      'minVisible',
      'ariaLabelText',
      'cssClass',
      'keyValue',
      'displayValue',
      'displayGroup',
      'groupKey',
      'groupItems',
      'groupSticky',
      'groupSelectAll',
      'selectAll',
      'selectAllLabel',
      'searchValue',
      'searchOperation',
      'searchDebounce',
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
     * Vue support:
     *
     * <mono-tag-input :cssClass="{}" />
     * <mono-tag-input :css-class="{}" />
     * <mono-tag-input :cssclass="{}" />
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

    this._ds = new DataSourceController<TagInputItem>(this, {
      getDataSource: () => this.dataSource,
      getItems: () => this.items,
      getImmediate: () => this.immediate,
      getLoadMoreMode: () => this._loadMoreMode,
      getPageSize: () => this._pageSize,
    })
  }

  private readonly _ds: DataSourceController<TagInputItem>

  /**
   * Automatic skeleton (`pending`, composables/mono-skeleton.ts): DATA-driven — pending
   * until a bound `dataSource` has its first page; static `items` release before first paint.
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
      'helpertext',
      'validationstate',
      'validationmessage',
      'errormessage',
      'successmessage',
      'allowcustom',
      'maxvisible',
      'minvisible',
      'arialabeltext',
      'arialabel',
      'css-class',
      'cssclass',
      'chip',
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

    if (name === 'modelvalue') {
      this.modelValue = this._normalizeValue(newValue)
      return
    }

    if (name === 'helpertext') {
      this.helperText = newValue ?? ''
      return
    }

    if (name === 'validationstate') {
      this.validationState = (newValue ?? 'default') as TagInputValidationState
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

    if (name === 'allowcustom') {
      this.allowCustom = this._toBoolean(newValue)
      return
    }

    if (name === 'maxvisible') {
      this.maxVisible = this._toOptionalNumber(newValue)
      return
    }

    if (name === 'minvisible') {
      this.minVisible = this._toOptionalNumber(newValue)
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
      return
    }

    if (name === 'chip') {
      this._setChip(newValue)
    }
  }

  @property({ type: String })
  size: TagInputSize = 'md'

  @property({ type: String })
  color: TagInputColor = 'primary'

  @property({ type: String })
  variant: TagInputVariant = 'outlined'

  /**
   * `mono-chip` props applied to every tag chip — `{ size, color, variant,
   * shape, dot, closeLabel, cssClass }`. Unset keys follow the control (see
   * {@link TagInputChipProps}). Bind as a property (`:chip.prop="{…}"`); a JSON
   * attribute is accepted too, handled in `attributeChangedCallback`.
   */
  @property({ attribute: false })
  chip: TagInputChipProps = {}

  @property({ attribute: 'model-value', reflect: false, hasChanged: arrayHasChanged })
  modelValue: TagInputValue[] = []

  @property({ attribute: false, hasChanged: arrayHasChanged })
  value: TagInputValue[] = []

  @property({ type: String })
  name = ''

  @property({ type: String })
  label = ''

  @property({ type: String })
  placeholder = 'Add tag...'

  @property({ type: String, attribute: 'helper-text' })
  helperText = ''

  @property({ type: String, attribute: 'validation-state' })
  validationState: TagInputValidationState = 'default'

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

  @property({
    attribute: 'allow-custom',
    reflect: true,
    converter: booleanStringConverter,
  })
  allowCustom = true

  /**
   * Most tags the user can select; unset = unlimited. A pick past it is
   * REJECTED, not disabled: the list stays as it is and the pick simply does not
   * land (a typed tag is dropped and the query reset). Bulk adds fill only the
   * room left. `chip.max` pins over it. A `model-value` pushed in is never
   * trimmed — the cap is the user's, not the developer's.
   */
  @property({
    attribute: 'max',
    converter: numberStringConverter,
  })
  max?: number

  /**
   * Fewest tags the user can leave; unset = 0. At the floor the chips lose their
   * ✕, a deselect / Backspace is rejected, the clear button hides and a bulk
   * deselect keeps the first `min`. `chip.min` pins over it.
   */
  @property({
    attribute: 'min',
    converter: numberStringConverter,
  })
  min?: number

  /**
   * Checkbox multi-select mode. Each suggestion row shows a checkbox; selected
   * items stay in the list (checked) instead of being hidden, the dropdown
   * stays open, and clicking a row toggles it.
   */
  @property({
    reflect: true,
    converter: booleanStringConverter,
  })
  checkable = false
  /**
   * A leading "All" row that selects — or clears — every option the current search
   * leaves visible. ON by default: a multi-select list without one makes the user
   * click every row, and each consumer was hand-rolling the same thing.
   *
   * Scoped to what the current search leaves visible: typing narrows the list, so
   * "All" then means "all of these", which is what makes it useful next to a
   * search.
   *
   * Where those rows COME from is the second half of the scope, and it depends on
   * the source. A plain `items` array is already wholly in memory, so the row
   * selects what it has. A bound `dataSource` in `loadMore` mode is a window onto
   * something bigger, and there the loaded page is an accident of scrolling rather
   * than a scope anyone chose — so the row drains the source instead
   * (`_selectAllFromServer`), exactly as `<mono-table-checkbox type="all">` does
   * for a grid.
   *
   * Disabled options are skipped. `max` is a hard cap for the drain as much as
   * for a click: "select all" fills the room left and stops.
   */
  @property({
    attribute: 'select-all',
    reflect: true,
    converter: booleanStringConverter,
  })
  selectAll = true

  /** Label of the select-all row (default `'All'`). */
  @property({ type: String, attribute: 'select-all-label', reflect: true })
  selectAllLabel = 'All'

  /**
   * Turn every group header into its own select-all over that group's rows. ON by
   * default, and only rendered while the list is actually grouped.
   *
   * A nested header covers every leaf BELOW it, not just its direct children, so a
   * level-0 header selects its whole subtree in one click.
   */
  @property({
    attribute: 'group-select-all',
    reflect: true,
    converter: booleanStringConverter,
  })
  groupSelectAll = true

  /**
   * Chips drawn in the field before the rest collapse into a "+N more" chip
   * whose panel lists them. Display-only — no selection cap (that is `max`).
   * Applies to `inline` too: the "+N more" chip then sits in the strip.
   * `chip.maxVisible` / `chip['max-visible']` pin over it.
   */
  @property({
    attribute: 'max-visible',
    converter: numberStringConverter,
  })
  maxVisible?: number

  /**
   * Collapse floor: while the selection is at or under it, every chip is drawn
   * regardless of `max-visible`. `chip.minVisible` / `chip['min-visible']` pin.
   */
  @property({
    attribute: 'min-visible',
    converter: numberStringConverter,
  })
  minVisible?: number

  /**
   * Supports:
   * element.items = [{ label: 'Vue', value: 'vue' }]
   */
  @property({ attribute: false, hasChanged: arrayHasChanged })
  items: TagInputItem[] = []

  /**
   * A devextreme DataSource (structurally typed) to drive the suggestions.
   * When set, it takes precedence over `items`. Vue: bind with `.prop`.
   */
  @property({ attribute: false })
  dataSource: TagInputDataSource | null = null

  /**
   * DataSource-only. When true (default), `dataSource.load()` is called on
   * attach if the source has no items yet. No effect in plain `items` mode.
   */
  @property({
    attribute: 'immediate',
    reflect: true,
    converter: booleanStringConverter,
  })
  immediate = true

  /**
   * Incremental loading. Works with a paged DataSource OR a plain `items`
   * array. 'button' shows a "Load more" button; 'scroll' loads on scroll;
   * enabling without a mode (bare attribute / '' / true) defaults to 'scroll'.
   */
  @property({ attribute: 'load-more', reflect: true })
  loadMore?: TagInputLoadMore | '' | boolean

  /** Chunk size when paging a plain `items` array via `load-more` (default 10). */
  @property({ attribute: 'page-size', reflect: true, type: Number })
  pageSize = 10

  /**
   * Sizes the popup PANEL only, independent of the field —
   * `:dropdown.prop="{ width: 460, maxHeight: 320 }"`.
   *
   * `attribute: false` makes it `.prop`-only, like `chip` and `cssClass`; there is no JSON
   * attribute form. The name is one lowercase word, so it needs no hybrid spelling aliases.
   *
   * Setting `width` also stops the panel tracking the field — see `matchWidth` on the popup
   * controller below.
   */
  @property({ attribute: false })
  dropdown?: TagInputDropdownOptions

  /** Fixed height of the scrollable suggestions list (number → px). */
  @property({ attribute: 'dropdown-height', reflect: true })
  dropdownHeight: string | number = ''

  /** Max height of the scrollable suggestions list (default 18rem). */
  @property({ attribute: 'dropdown-max-height', reflect: true })
  dropdownMaxHeight: string | number = ''

  /**
   * Open the suggestions UPWARD when there isn't room below (e.g. a field near
   * the bottom of the viewport, or in a grid row below the fold). Default `true`.
   */
  @property({ converter: booleanStringConverter })
  flip = true

  /**
   * Slide the suggestions horizontally so they stay inside the viewport near a
   * screen edge. Default `true`.
   */
  @property({ converter: booleanStringConverter })
  shift = true

  /**
   * Property name on each item used as the tag value stored in modelValue.
   * If empty, the whole item object is stored.
   *
   * Example: items=[{id:9,name:'John'}] + key-value="id" → tags hold 9.
   */
  @property({ type: String, attribute: 'key-value', reflect: true })
  keyValue = ''

  /**
   * Property name (string) or selector function used to derive the display
   * text for each item — used for chip labels and the dropdown title.
   * Falls back to `item.label`, then `String(item)`.
   *
   * String form via plain HTML: display-value="name".
   * Function form via JS/Vue: :display-value.prop="(item) => item.name".
   */
  @property({ attribute: false })
  displayValue: TagInputDisplayValue = ''

  /**
   * Render grouped options: one accessor per group **level**. Each header's
   * label resolves from a representative leaf row — a string reads `row[field]`,
   * a function receives the row. Empty (default) = flat list, no grouping.
   *
   * @example :display-group.prop="['BrandNama', (row) => row.DeptNama]"
   */
  @property({ attribute: false })
  displayGroup: TagInputDisplayGroup = []

  /** Field holding a group node's key (default `'key'`). */
  @property({ type: String, attribute: 'group-key', reflect: true })
  groupKey = 'key'

  /** Field holding a group node's child array (default `'items'`). */
  @property({ type: String, attribute: 'group-items', reflect: true })
  groupItems = 'items'

  /**
   * Group a **plain, paginated** DataSource (or a flat `items` array) client-side
   * so scroll / "load more" keep working — pass a source **without** `group` in
   * its request; the component fetches flat rows and buckets the accumulated rows
   * by `display-group`. Leave off to render data already nested as `{ key, items }`.
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
   * Whether typing in the field searches. Default `true` — the field has always
   * been a text box, so turning search OFF is the opt-in.
   *
   * `searchable="false"` makes the input read-only: it can't be typed into, so it
   * never filters and never queries the server, and no custom tag can be entered
   * that way. Everything else still works — clicking opens the dropdown, arrows
   * and `Enter` pick, and chips stay removable.
   */
  @property({ attribute: 'searchable', reflect: true, converter: booleanStringConverter })
  searchable = true

  /**
   * Exempt this tag-input from every automatic close — clicking or focusing
   * anything outside it, which includes opening another one. It is **not** a
   * lock: its own trigger, Escape and picking an item still close it.
   */
  @property({ attribute: 'stay-open', reflect: true, converter: booleanStringConverter })
  stayOpen = false

  /**
   * Field(s) the typed search matches. With a bound `dataSource`, typing
   * **queries the server** (debounced) so the dropdown shows the full matching
   * set; a plain `items` array filters client-side. Falls back to `display-value`
   * (when it's a string) then `key-value`.
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
  @property({ attribute: 'search-value' })
  searchValue: MonoSearchValue = ''

  /** devextreme search operation for server search (default `'contains'`). */
  @property({ type: String, attribute: 'search-operation' })
  searchOperation = 'contains'

  /** Debounce (ms) before a server search fires (default 300). */
  @property({ attribute: 'search-debounce', type: Number })
  searchDebounce = 300

  @property({ attribute: false })
  cssClass: TagInputCssClass = {}

  /**
   * Plain HTML root class fallback:
   *
   * <mono-tag-input css-class="premium-tag-input"></mono-tag-input>
   */
  @property({ attribute: false })
  cssClassName = ''

  @state()
  private _inputValue = ''

  @state()
  private _open = false

  @state()
  private _activeIndex = -1

  /**
   * Set on the open edge, cleared once the cursor has been placed (or the user
   * starts typing). Not `@state`: it only gates the seed in `updated()` and must
   * never trigger a render of its own.
   */
  private _cursorPending = false

  // Whether the "+N more" overflow panel is open.
  @state()
  private _moreOpen = false

  // Computed max-height (px) that keeps a paged scroll list scrollable.
  @state()
  /** True while the server drain behind the "All" row is in flight. */
  @state()
  private _selectAllPending = false

  private _scrollAutoMaxHeight = ''

  @state()
  protected _hasLabelSlotState = false

  @state()
  protected _hasHelperSlotState = false

  @query('.mono-tag-input-native')
  private _inputEl?: HTMLInputElement

  /**
   * Measures and scrolls the one-line chip strip in `chip.behaviour: 'inline'`.
   * The strip is `overflow-x: hidden`, so this controller's `page()` — driven by
   * the `‹` / `›` buttons — is the ONLY thing that can move it.
   */
  protected _chipStrip = new ChipStripController(this, {
    strip: () =>
      this.renderRoot?.querySelector('.mono-tag-input-chip-strip') as HTMLElement | null,
    // Gated so a default `flex` field pays nothing per render — no query, no
    // layout read. Everything below the gate is inline-only.
    enabled: () => this._chipBehaviour === 'inline',
  })

  /**
   * The dropdown panel is relocated into a `<body>` portal while open — query
   * it through `panelRoot` (the portal when adopted, else the host render root).
   */
  private get _dropdownEl(): HTMLElement | null {
    return this._popup.panelRoot.querySelector('.mono-tag-input-dropdown')
  }

  /**
   * Where the consumer's list wrapper is parked, through the SAME portal-aware root as the panel
   * itself — while the dropdown is open it lives in a body portal, so a host query would miss it.
   */
  protected get _listSlotTarget(): HTMLElement | null {
    return this._popup.panelRoot.querySelector('[data-mono-slot="list"]')
  }

  /**
   * Relocates the dropdown panel into a body portal while open so the shared
   * popup-stack z-index ranks it against every other popup, and owns this
   * tag-input's popup-stack membership + fixed positioning.
   */
  private _popup = new PopupPortalController(this, {
    getPanel: () =>
      this.renderRoot.querySelector('.mono-tag-input-dropdown') as HTMLElement | null,
    getAnchor: () =>
      this.renderRoot.querySelector('.mono-tag-input-field') as HTMLElement | null,
    getStyleScope: () =>
      this.renderRoot.querySelector('.mono-tag-input') as HTMLElement | null,
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

  /**
   * The "+N more" panel is a floating layer of its own — a second controller on
   * the same host (as the table header menu does with its sort submenu). It used
   * to be a plain `position: absolute` child of the field, which any ancestor
   * with `overflow: hidden`, a transform or its own stacking context (a card, a
   * table cell, a modal body) clipped. Portaled it flips, shifts and shrinks at
   * the viewport edge like the dropdown, and ranks in the shared popup stack.
   */
  private _morePopup = new PopupPortalController(this, {
    getPanel: () =>
      this.renderRoot.querySelector('.mono-tag-input-more-panel') as HTMLElement | null,
    getAnchor: () =>
      this.renderRoot.querySelector('.mono-tag-input-field') as HTMLElement | null,
    getStyleScope: () =>
      this.renderRoot.querySelector('.mono-tag-input') as HTMLElement | null,
    isOpen: () => this._moreOpen,
    // Field-wide, as it always was.
    matchWidth: () => true,
    offset: () => 6,
    flip: () => true,
    shift: () => true,
    constrainSize: () => true,
  })

  private readonly _inputId = `mono-tag-input-${Math.random().toString(36).slice(2)}`
  private readonly _messageId = `${this._inputId}-message`
  private readonly _listboxId = `${this._inputId}-listbox`

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
    // CAPTURE phase, matching mono-dropdown. The trigger handlers call
    // `stopPropagation()`, so a bubble-phase listener never sees a click landing
    // on ANOTHER tag-input's trigger — which is why opening a second one used to
    // leave the first open.
    document.addEventListener('click', this._handleDocumentClick, true)
    // Tab traversal fires no click, so without this, keyboarding from one field
    // into the next leaves both panels down.
    document.addEventListener('focusin', this._handleDocumentFocusIn, true)
    document.addEventListener('keydown', this._handleDocumentKeydown)
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
    if (!isServer) {
      // The `true` must match the add above or the listener is never removed.
      document.removeEventListener('click', this._handleDocumentClick, true)
      document.removeEventListener('focusin', this._handleDocumentFocusIn, true)
      document.removeEventListener('keydown', this._handleDocumentKeydown)
    }
    super.disconnectedCallback()
  }

  override willUpdate(changed: Map<string, unknown>): void {
    // SSR (nuxt-ssr-lit) can set a boolean prop to a raw string (e.g. '');
    // coerce so render() sees real booleans and hydration matches.
    // (see project_shadow_boolean_prop_ssr)
    for (const key of [
      'disabled', 'readonly', 'required', 'clearable',
      'allowCustom', 'checkable', 'immediate', 'group', 'groupSticky', 'searchable',
      'stayOpen', 'selectAll', 'groupSelectAll',
    ] as const) {
      const v = this[key] as unknown
      if (typeof v !== 'boolean') {
        ;(this as unknown as Record<string, unknown>)[key] = this._toBoolean(v)
      }
    }

    // Store RAW targets, not the consumer's reactive proxies. Spreading a deep
    // reactive array reads each index and so copies in child PROXIES, which then
    // fail identity against the raw rows in `items`.
    if (changed.has('modelValue') && !this._arrayEqual(this.value, this.modelValue)) {
      this.value = [...unwrapReactiveDeep(this.modelValue)]
    }

    if (changed.has('value') && !this._arrayEqual(this.modelValue, this.value)) {
      this.modelValue = [...unwrapReactiveDeep(this.value)]
    }

    // `group` mode: order the (plain) source by the group fields so each page
    // arrives with its groups together. Never sends `group` — paging stays on.
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

    // NOTE: the cache is deliberately NEVER cleared here.
    //
    // It used to be emptied whenever `dataSource`/`items` changed, on the theory
    // that a source swap invalidates the remembered rows. That theory is wrong in
    // the direction that matters: the cache is only ever a FALLBACK — if a value
    // still exists in the new source, `_findLoadedItem` finds it and the cache is
    // never consulted, and it is refreshed on the way past. It is read only for a
    // value the current rows cannot resolve, and there the choice is between the
    // last label we knew and no chip at all.
    //
    // Clearing also made the fix hostage to prop identity. `dataSource` has no
    // `hasChanged` (unlike `items`, which uses `arrayHasChanged`), so ANY new but
    // equivalent source object — a form controller re-pushing props, a store
    // rebuilding a DataSource — emptied the cache and brought the bug back.
    // Entries for deselected values are harmless: lookups always start from the
    // selected values, so an orphan is never read.

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

    if (
      changed.has('items') ||
      changed.has('loadMore') ||
      changed.has('pageSize')
    ) {
      this._ds.resetVisible()
    }
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)

    // BEFORE the isServer guard: publishing the resolved list is pure data with no DOM in it, and
    // it is exactly what an SSR pass needs so a framework can render the slot rows on the server
    // too. Everything below this line touches the DOM and rightly stops short.
    this._syncListEntries()

    if (isServer) return

    // Rows arrive asynchronously, so a value selected before its page loaded (or
    // set from outside as `model-value`) becomes resolvable only later. Catch it
    // here, once the rows are in. Costs nothing for values already remembered —
    // `_rememberSelected` skips those without touching `_leafItems`.
    this._rememberSelected(this._selectedValues)

    // Opening puts the cursor on the LAST tag the user picked, so ↑/↓ carry on
    // from there instead of restarting at the top. With nothing selected it lands
    // on the first row, as it always did.
    //
    // Latched rather than run once on the open edge: with a bound dataSource the
    // first page is still in flight when the panel opens, so `_filteredItems` is
    // empty and the lookup would always miss. Holding the latch until the list
    // first has rows covers every path that sets `_open` — focus, field click and
    // the public `open()` — from one place.
    if (changed.has('_open')) {
      this._cursorPending = this._open
      if (!this._open) this._activeIndex = -1
    }
    // Removing the last collapsed chip from inside the panel leaves nothing to show.
    if (this._moreOpen && !this._overflowChips.length) this._moreOpen = false
    if (this._cursorPending && this._open && this._filteredItems.length) {
      this._activeIndex = this._initialActiveIndex()
      this._cursorPending = false
    }

    // Keep the ↑/↓ highlight visible — on a list longer than the panel is tall
    // nothing else scrolls it into view.
    if (changed.has('_activeIndex') && this._open && this._activeIndex >= 0) {
      const root = this._popup.panelRoot as ParentNode | null
      const item = root?.querySelectorAll?.('.mono-tag-input-item')?.[this._activeIndex]
      ;(item as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' })
    }

    this._updateScrollAutoHeight()

    // Re-measure the inline strip only when something that can change its
    // overflow actually changed. Deliberately NOT every update: measuring forces
    // a layout and can schedule another update, and this method already runs on
    // every keystroke, every page of a bound source and every popup reposition.
    // Width changes are the ResizeObserver's job, not this one's.
    //
    // The chip COUNT is the signal rather than `changed.has('value')`, because a
    // value whose row had not loaded yet draws no chip — it appears later, on the
    // update that resolves it, with `value` untouched. `_renderedChipCount` is
    // recorded during render, so testing it costs nothing.
    const styleChanged =
      changed.has('chip') ||
      changed.has('size') ||
      changed.has('disabled') ||
      changed.has('readonly')
    if (styleChanged || this._renderedChipCount !== this._measuredChipCount) {
      this._measuredChipCount = this._renderedChipCount
      this._chipStrip.invalidate()
    }
  }

  private _setCssClass(value: unknown): void {
    if (value == null) {
      this.cssClass = {}
      this.cssClassName = ''
      return
    }

    if (typeof value === 'object') {
      this.cssClass = value as TagInputCssClass
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
       *
       * <mono-tag-input css-class='{"root":"...", "field":"..."}'></mono-tag-input>
       */
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.cssClass = JSON.parse(trimmed) as TagInputCssClass
          return
        } catch {
          // fallback to root class
        }
      }

      this.cssClassName = trimmed
    }
  }

  /**
   * `chip` is an object prop, so the real binding is `:chip.prop="{…}"`. This
   * covers the two ways a *string* can arrive: a hand-written JSON attribute
   * (`chip='{"size":"md"}'`, incl. DSD/SSR), and Vue's `String(value)` mirror of
   * a plain `:chip="{…}"` binding — which yields `"[object Object]"` and must be
   * ignored, or it would wipe the property set moments later.
   */
  private _setChip(value: unknown): void {
    if (value == null) {
      this.chip = {}
      return
    }

    if (typeof value === 'object') {
      this.chip = value as TagInputChipProps
      return
    }

    if (typeof value !== 'string') return

    const trimmed = value.trim()
    if (!trimmed) {
      this.chip = {}
      return
    }
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return

    try {
      this.chip = JSON.parse(trimmed) as TagInputChipProps
    } catch {
      // Not JSON (e.g. a stringified object) — keep whatever the property holds.
    }
  }

  private _toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value

    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return normalized === '' || normalized === 'true'
    }

    return Boolean(value)
  }

  private _toOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  private _normalizeValue(value: unknown): TagInputValue[] {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== null && item !== undefined)
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()

      if (!trimmed) return []

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return this._normalizeValue(JSON.parse(trimmed))
        } catch {
          return []
        }
      }

      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return []
  }

  private _normalizeItems(items: unknown): TagInputItem[] {
    if (Array.isArray(items)) {
      return items.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return item as TagInputItem
        }

        return { value: item as TagInputValue } as TagInputItem
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

  private _resolveItemValue(item: TagInputItem | null | undefined): unknown {
    if (item == null) return item
    if (typeof item !== 'object') return item

    if (this.keyValue && this.keyValue in (item as Record<string, unknown>)) {
      return (item as Record<string, unknown>)[this.keyValue]
    }

    if (!this.keyValue) {
      // `TagInputItem` IS `{ label, value }`, and `_normalizeItems` wraps every
      // primitive as `{ value }` — re-wrapping on every read, so a stored wrapper
      // could never match back and its chip fell through to `String(item)`
      // ("[object Object]"). The item's own `value` is the stable identity.
      if ('value' in (item as Record<string, unknown>)) {
        return (item as Record<string, unknown>).value
      }
      return item
    }

    // `keyValue` is set but this row does not carry it — e.g. a GROUP NODE that
    // reached the option list. There is no value to store; callers must skip it
    // rather than write `undefined` into the selection.
    return undefined
  }

  /** Whether `item` resolves to a value that can actually be stored (see above). */
  private _isSelectable(item: TagInputItem | null | undefined): boolean {
    if (item == null || (item as TagInputItem).disabled) return false
    return this._resolveItemValue(item) !== undefined
  }

  private _resolveItemDisplay(item: TagInputItem | null | undefined): string {
    if (item == null) return ''

    if (typeof this.displayValue === 'function') {
      return String(this.displayValue(item as TagInputItem))
    }

    if (typeof this.displayValue === 'string' && this.displayValue) {
      if (typeof item === 'object' && this.displayValue in (item as Record<string, unknown>)) {
        return String((item as Record<string, unknown>)[this.displayValue])
      }
      return ''
    }

    if (typeof item === 'object' && 'label' in (item as Record<string, unknown>)) {
      const label = (item as Record<string, unknown>).label
      return label == null ? '' : String(label)
    }

    // A `{ value }` wrapper with no label — every primitive `items` entry becomes one
    // in `_normalizeItems`. Its own value is the label; `String(item)` here is what
    // rendered a plain string list as "[object Object]".
    if (typeof item === 'object' && 'value' in (item as Record<string, unknown>)) {
      const value = (item as Record<string, unknown>).value
      return value == null ? '' : String(value)
    }

    return String(item)
  }

  private _looksLikeSerializedFunction(value: string): boolean {
    const trimmed = value.trim()
    if (!trimmed) return false
    return /^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(
      trimmed,
    )
  }

  /**
   * Value equality. With no `key-value` the whole item IS the value, so this is
   * identity — with one correction that is load-bearing under Vue.
   *
   * The model round-trips through the consumer's `ref`, which hands each tag back
   * wrapped in a **reactive Proxy**; `items` normally stays raw, so `proxy === row`
   * is false, an already-selected option reads as unselected, and clicking it
   * again APPENDS a duplicate instead of toggling it off. Comparing the raw
   * targets restores it. Still identity, not deep equality: two distinct rows with
   * equal contents remain different values.
   */
  private _isSameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (a == null || b == null) return false
    const rawA = unwrapReactive(a)
    const rawB = unwrapReactive(b)
    if (rawA === rawB) return true
    if (typeof rawA !== 'object' || typeof rawB !== 'object') return false
    return false
  }

  private _arrayEqual(a: TagInputValue[], b: TagInputValue[]): boolean {
    if (a.length !== b.length) return false

    return a.every((item, index) => this._isSameValue(item, b[index]))
  }

  private _cls(base: string, key: keyof TagInputCssClass): string {
    const extra = this.cssClass?.[key]
    return extra ? `${base} ${extra}` : base
  }

  /** Full normalized source (for resolving chip labels by value). */
  private get _normalizedItems(): TagInputItem[] {
    return this._normalizeItems(this._ds.sourceItems)
  }

  /** Normalized rows actually available to show (paged slice in array mode). */
  private get _visibleItems(): TagInputItem[] {
    return this._normalizeItems(this._ds.visibleItems)
  }

  /** Effective load-more mode (scroll is the default when enabled). */
  private get _loadMoreMode(): TagInputLoadMore | undefined {
    const v = this.loadMore
    if (v === undefined || v === null || v === false) return undefined
    return v === 'button' ? 'button' : 'scroll'
  }

  /** Sanitised chunk size for array-mode paging (>= 1). */
  private get _pageSize(): number {
    const n = Math.floor(Number(this.pageSize))
    return Number.isFinite(n) && n > 0 ? n : 10
  }

  private get _selectedValues(): TagInputValue[] {
    return this.value ?? []
  }

  private get _hasValue(): boolean {
    return this._selectedValues.length > 0
  }

  private get _hasLabelSlot(): boolean {
    return this._hasLabelSlotState
  }

  private get _hasHelperSlot(): boolean {
    return this._hasHelperSlotState
  }

  private get _resolvedValidationState(): TagInputValidationState {
    if (this.validationState && this.validationState !== 'default') {
      return this.validationState
    }

    if (this.errorMessage) return 'invalid'
    if (this.successMessage) return 'valid'

    return 'default'
  }

  private _isSelected(item: TagInputItem): boolean {
    const value = this._resolveItemValue(item)
    return this._selectedValues.some((v) => this._isSameValue(v, value))
  }

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
    const query = this._inputValue.trim()
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

  /** Run the server search, reset to page 0. */
  private async _applySearch(query: string): Promise<void> {
    if (!this._serverSearch()) return
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

  /**
   * Clear the typed query — the visible one AND the one applied to the source.
   *
   * These are two independent tracks, and with a bound DataSource only the second
   * one actually filters anything: `_searchMatches` short-circuits to `true`
   * because the rows arrive pre-filtered. So clearing `_inputValue` on its own
   * looks like it worked and changes nothing, which is exactly how a query that
   * is no longer visible anywhere kept filtering the list.
   *
   * Cancelling the debounce FIRST is load-bearing: a timer armed before the reset
   * fires afterwards and re-applies the stale query.
   */
  private _resetSearch(): void {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = undefined
    }
    const had = !!this._inputValue
    this._inputValue = ''
    this._activeIndex = -1
    if (had && this._serverSearch()) void this._applySearch('')
  }

  /**
   * The single way the panel closes. Every exit resets the search, so reopening
   * never shows a list filtered by a query the box no longer holds.
   */
  private _close(): void {
    this._open = false
    this._resetSearch()
  }

  /** Debounce a server search for the current input text. */
  private _scheduleSearch(): void {
    if (!this.searchable || !this._serverSearch()) return
    if (this._searchTimer) clearTimeout(this._searchTimer)
    const wait = Math.max(0, Number(this.searchDebounce) || 0)
    this._searchTimer = setTimeout(() => void this._applySearch(this._inputValue), wait)
  }

  /** Whether an option matches the current typed query. */
  private _searchMatches(item: TagInputItem): boolean {
    // Search off: the field can't be typed into, so every option stays offered.
    if (!this.searchable) return true
    // Server mode: the loaded rows are already the server-filtered result.
    if (this._serverSearch()) return true
    const query = this._inputValue.trim().toLowerCase()
    if (!query) return true

    // An explicit `search-value` means explicit control over what is searched, so
    // only its entries decide. Without one there is nothing authored to honour,
    // and the natural thing to match is what the user can actually see — the
    // display text (which may come from a `display-value` FUNCTION, unreachable
    // by any field expression), the raw value and the option's description.
    if (this._hasSearchValue) {
      const pred = this._searchPredicate()
      return pred ? pred(item) : true
    }

    const itemValue = this._resolveItemValue(item)
    const display = this._resolveItemDisplay(item).toLowerCase()
    const valueStr = itemValue == null ? '' : String(itemValue).toLowerCase()
    const desc =
      typeof item === 'object' && item && typeof item.description === 'string'
        ? item.description.toLowerCase()
        : ''
    const pred = this._searchPredicate()
    return (
      display.includes(query) ||
      valueStr.includes(query) ||
      desc.includes(query) ||
      (pred ? pred(item) : false)
    )
  }

  // --- Grouping --------------------------------------------------------------

  /**
   * Grouping is active when `display-group` names at least one level — OR when the
   * source already loaded PRE-GROUPED `{ key, items }` nodes.
   *
   * The second half is what makes "feed pre-grouped data directly" actually work.
   * Without it, a devextreme DataSource carrying `group:` loaded its group nodes and,
   * because `displayGroup` was empty, they were treated as ordinary OPTIONS: the
   * headers became rows, `keyValue` was absent on them so they resolved to
   * `undefined`, and selecting one wrote `undefined` into the value.
   *
   * `group` mode is excluded: there the source is deliberately FLAT and
   * `display-group` is what buckets it client-side.
   */
  private get _grouped(): boolean {
    if (Array.isArray(this.displayGroup) && this.displayGroup.length > 0) return true
    if (this.group) return false
    const src = (this._ds.sourceItems as unknown[]) ?? []
    return src.length > 0 && src.some((n) => this._isGroupNode(n))
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
  private _firstLeaf(node: unknown): TagInputItem | undefined {
    let cur: unknown = node
    let guard = 0
    while (this._isGroupNode(cur) && guard++ < 50) {
      cur = ((cur as Record<string, unknown>)[this.groupItems] as unknown[])?.[0]
    }
    return (cur ?? undefined) as TagInputItem | undefined
  }

  /** Resolve a group header's label from `displayGroup[level]` over a leaf row. */
  private _resolveGroupLabel(node: Record<string, unknown>, level: number): string {
    const accessor = this.displayGroup[level]
    const leaf = this._firstLeaf(node)
    if (typeof accessor === 'function') {
      return String(accessor((leaf ?? {}) as TagInputItem) ?? '')
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
  private _groupKeyOf(row: TagInputItem, level: number): unknown {
    const accessor = this.displayGroup[level]
    if (typeof accessor === 'function') return accessor(row)
    if (typeof accessor === 'string') return (row as Record<string, unknown>)[accessor]
    return undefined
  }

  /** `group` mode: bucket flat rows into `{ [groupKey], [groupItems] }` by level. */
  private _buildClientTree(rows: TagInputItem[]): unknown[] {
    const build = (items: TagInputItem[], level: number): unknown[] => {
      if (level >= this.displayGroup.length) return items
      const buckets = new Map<string, { key: unknown; rows: TagInputItem[] }>()
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

  /** Every leaf row (all loaded) — for chip-label / value lookup. */
  private get _leafItems(): TagInputItem[] {
    if (!this._grouped) return this._normalizedItems
    if (this.group) return this._normalizeItems(this._ds.sourceItems)
    const out: TagInputItem[] = []
    const walk = (nodes: unknown[]): void => {
      for (const n of nodes) {
        if (this._isGroupNode(n)) walk((n as Record<string, unknown>)[this.groupItems] as unknown[])
        else if (n != null) out.push(n as TagInputItem)
      }
    }
    walk((this._ds.sourceItems as unknown[]) ?? [])
    return out
  }

  /** The nested group nodes to render — built client-side in `group` mode. */
  private _groupNodes(): unknown[] {
    if (this.group) {
      const leaves = this._visibleItems.filter((it) => this._searchMatches(it))
      return this._buildClientTree(leaves)
    }
    return (this._ds.visibleItems as unknown[]) ?? []
  }

  /**
   * Flatten the visible group tree into ordered render rows (headers + items).
   * `index` is the item's position among rendered leaves (drives `_activeIndex`
   * and keyboard nav). Leaves are search-filtered; empty groups are dropped.
   */
  private _groupRows(): Array<
    | { kind: 'group'; level: number; label: string; key: string; items: TagInputItem[] }
    | { kind: 'item'; item: TagInputItem; index: number; level: number }
  > {
    type Row =
      | { kind: 'group'; level: number; label: string; key: string; items: TagInputItem[] }
      | { kind: 'item'; item: TagInputItem; index: number; level: number }
    // group mode pre-filters leaves in `_groupNodes`; pre-grouped filters here.
    const filterLeaves = !this.group
    // Build the rows for a subtree; a group with no surviving content is omitted.
    const build = (nodes: unknown[], level: number, parentKey: string): Row[] => {
      const rows: Row[] = []
      nodes.forEach((node, i) => {
        if (!this._isGroupNode(node)) {
          const item = node as TagInputItem
          if (item == null) return
          if (filterLeaves && !this._searchMatches(item)) return
          // `level` is the depth of the group this leaf sits IN — the header above it
          // was pushed at `level - 1`, so indenting the row by its own level is what
          // steps it in from that header.
          rows.push({ kind: 'item', item, index: -1, level })
          return
        }
        const rec = node as Record<string, unknown>
        const path = `${parentKey}/${String(rec[this.groupKey])}#${i}`
        const children = build((rec[this.groupItems] as unknown[]) ?? [], level + 1, path)
        if (!children.length) return // drop empty group
        rows.push({
          kind: 'group',
          level,
          label: this._resolveGroupLabel(rec, level),
          key: `g:${level}:${path}`,
          // Every leaf BELOW this header, not just its direct children: `children` is
          // the already-flattened subtree, so a level-0 header covers the whole tree
          // under it. That is what `group-select-all` toggles.
          items: children
            .filter((r): r is { kind: 'item'; item: TagInputItem; index: number; level: number } => r.kind === 'item')
            .map((r) => r.item),
        })
        rows.push(...children)
      })
      return rows
    }
    let idx = 0
    return build(this._groupNodes(), 0, '').map((r) =>
      r.kind === 'item' ? { ...r, index: idx++ } : r,
    )
  }

  /**
   * Where the keyboard cursor goes when the list opens: the row holding the most
   * recently picked tag, else the first row.
   *
   * "Most recent" is the TAIL of the value array — every add appends and nothing
   * sorts, so removing and re-adding a tag correctly moves it to the end. The
   * `Backspace` handler already leans on that same invariant.
   *
   * Selected rows stay in the suggestion list (see `_renderOption`), so this can
   * actually find them; the predicate is the one that paints `.selected`, so the
   * cursor lands on the row drawn as selected. `0` when the tag is not in the
   * loaded page — the behaviour this component has always had.
   */
  private _initialActiveIndex(): number {
    const items = this._filteredItems
    if (!items.length) return -1

    const values = this._selectedValues
    const last = values.length ? values[values.length - 1] : undefined
    if (last === undefined) return 0

    const index = items.findIndex((item) =>
      this._isSameValue(this._resolveItemValue(item), last),
    )
    return index >= 0 ? index : 0
  }

  private get _filteredItems(): TagInputItem[] {
    if (this._grouped) {
      return this._groupRows()
        .filter((r): r is { kind: 'item'; item: TagInputItem; index: number; level: number } => r.kind === 'item')
        .map((r) => r.item)
    }
    return this._visibleItems.filter((item) => this._searchMatches(item))
  }

  /**
   * The selection limits in force: `chip.max` / `chip.min` pin, the element's
   * `max` / `min` are the fallback (the rule `chip.color` follows). Undefined =
   * unlimited / no floor.
   */
  private get _selectionLimits(): { max?: number; min?: number } {
    const chip = this._chipProps
    return {
      max: resolveChipLimit(chip, 'max', this.max),
      min: resolveChipLimit(chip, 'min', this.min),
    }
  }

  /** Room left under `max`, or Infinity without one. */
  private get _room(): number {
    const max = this._selectionLimits.max
    return max === undefined ? Infinity : Math.max(0, max - this._selectedValues.length)
  }

  private get _canAddMore(): boolean {
    return this._room > 0
  }

  /** The selection sits above its floor, so one more removal is allowed. */
  private get _canRemoveMore(): boolean {
    const min = this._selectionLimits.min
    return min === undefined || this._selectedValues.length > min
  }

  /**
   * A bulk deselect keeps the FIRST `min` values (selection order) — "remove
   * these" then means "down to the floor", the most a user gesture may do.
   */
  private _keepFloor(next: TagInputValue[]): TagInputValue[] {
    const min = this._selectionLimits.min ?? 0
    if (next.length >= min) return next
    const kept = [...next]
    for (const v of this._selectedValues) {
      if (kept.length >= min) break
      if (!kept.some((k) => this._isSameValue(k, v))) kept.push(v)
    }
    // Back into selection order, so the chips do not reshuffle.
    return this._selectedValues.filter((v) => kept.some((k) => this._isSameValue(k, v)))
  }

 private get _wrapperClasses(): string {
  return [
    'mono-tag-input',
    this.size,
    this.color,
    this.variant,
    this._open ? 'open' : '',
    // Mirrored onto the more panel's portal, which is what shows the panel.
    this._moreOpen ? 'more-open' : '',
    this.disabled ? 'disabled' : '',
    this.readonly ? 'readonly' : '',
    this._resolvedValidationState !== 'default'
      ? `is-${this._resolvedValidationState}`
      : '',
    this._hasValue ? 'has-value' : '',
    this.checkable ? 'checkable' : '',
    this.cssClassName,
    this.cssClass?.root,
  ]
    .filter(Boolean)
    .join(' ')
}

 /**
  * Whether the clear button renders. A getter because BOTH the field class list
  * and `render()` need it: the button is pinned to the top-right corner, and the
  * gutter that keeps wrapped chips from running under it is reserved by
  * `.has-clear` on the field.
  */
 private get _showClear(): boolean {
  // A selection floor hides the clear button: clearing would stop at `min`
  // anyway, and a ✕ that leaves chips behind reads as broken.
  return (
    this.clearable &&
    this._hasValue &&
    !this.disabled &&
    !this.readonly &&
    !((this._selectionLimits.min ?? 0) > 0)
  )
 }

 private get _fieldClasses(): string {
  return [
    this._cls('mono-tag-input-field', 'field'),
    this.size,
    this.color,
    this.variant,
    this.disabled ? 'disabled' : '',
    this.readonly ? 'readonly' : '',
    this._showClear ? 'has-clear' : '',
    // The gutter is now reserved for whichever single glyph the actions row
    // shows, not just the clear button — an empty field renders the caret and
    // needs exactly the same room. `has-clear` keeps emitting because consumer
    // stylesheets already target it.
    'has-actions',
    this._chipBehaviour === 'inline' ? 'is-inline' : '',
    // Inline only: the collapsed text box claims real width just while there is
    // text in it. Focus alone is not enough — opening the dropdown focuses the
    // input, so keying the width off `:focus` reserved a gap for an empty box
    // for the whole time the field was in use.
    this._inputValue ? 'is-typing' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

  /**
   * The row behind each SELECTED value, remembered from when it was picked.
   *
   * `_leafItems` is only a complete picture in array mode. With a bound
   * DataSource a server search REPLACES the loaded rows with just the matches
   * (`data-source-controller.ts` `_sync`), so a row that was selected earlier and
   * does not match the current query is simply gone — and a chip resolved through
   * `_leafItems` alone would vanish with it.
   *
   * Keyed by the STRING form of the resolved value, matching how
   * `mono-data-dropdown` keys the same cache: `_isSameValue` is identity-only for
   * objects, so an object row can never be found by re-lookup.
   */
  private _selectedItemCache = new Map<string, TagInputItem>()

  private _cacheKey(value: TagInputValue): string | undefined {
    if (value == null || typeof value === 'object') return undefined
    return String(value)
  }

  /**
   * Remember the rows behind `values` while they are still loaded.
   *
   * Called from `_setValue`, i.e. at the moment of selection — the row is in the
   * list by definition right then, which is why this needs no request. Values
   * that cannot be resolved yet are skipped, not cached as misses, so a later
   * load can still fill them in.
   */
  private _rememberSelected(values: readonly TagInputValue[]): void {
    if (!this.keyValue) return
    for (const value of values) {
      const key = this._cacheKey(value)
      if (key === undefined || this._selectedItemCache.has(key)) continue
      const item = this._findLoadedItem(value)
      if (item !== undefined) this._selectedItemCache.set(key, item)
    }
  }

  /** Look a value up in the currently loaded rows only. */
  private _findLoadedItem(value: TagInputValue): TagInputItem | undefined {
    // `_leafItems` flattens the tree when grouped, so selected values resolve.
    return this._leafItems.find((item) =>
      this._isSameValue(this._resolveItemValue(item), value),
    )
  }

  private _getItemByValue(value: TagInputValue): TagInputItem | undefined {
    const loaded = this._findLoadedItem(value)
    if (loaded !== undefined) {
      // Remember on the way past. Every chip resolves through here on every
      // render, so a value is remembered the first time it is drawable — whether
      // it was clicked, arrived as `model-value`, or only became resolvable when
      // its page loaded. That makes the cache independent of `updated()` and of
      // which code path put the value there.
      const key = this._cacheKey(value)
      if (key !== undefined && this.keyValue) this._selectedItemCache.set(key, loaded)
      return loaded
    }

    // Not in the current result set — fall back to what it was when picked, so a
    // search that filters the LIST never filters the CHIPS.
    const key = this._cacheKey(value)
    return key === undefined ? undefined : this._selectedItemCache.get(key)
  }

  /**
   * Whether this value still has no row behind it — the list has not loaded it (or
   * not loaded yet).
   *
   * Only meaningful when `keyValue` is set: that prop is the statement "values are
   * KEYS into the items", so an unmatched key has no label anyone would want to
   * read — showing the bare key renders a chip like `1` or `1|MKT`. Without
   * `keyValue` the value IS its own label (and `allow-custom` tags rely on that),
   * so nothing is ever hidden there.
   */
  private _isUnresolvedKey(value: TagInputValue): boolean {
    if (!this.keyValue) return false
    if (value == null) return false
    if (typeof value === 'object') return false
    return this._getItemByValue(value) === undefined
  }

  private _getLabelByValue(value: TagInputValue): string {
    const item = this._getItemByValue(value)
    if (item) return this._resolveItemDisplay(item)

    if (value == null) return ''
    if (typeof value === 'object') return this._resolveItemDisplay(value as TagInputItem)
    if (this._isUnresolvedKey(value)) return ''
    return String(value)
  }

  private _createModelDetail(args: {
    modelValue: TagInputValue[]
    oldValue: TagInputValue[]
    addedValue?: TagInputValue
    removedValue?: TagInputValue
    sourceEvent?: Event
  }): TagInputModelEventDetail {
    return {
      modelValue: args.modelValue,
      currentValue: args.modelValue,
      oldValue: args.oldValue,
      value: args.modelValue,
      addedValue: args.addedValue,
      removedValue: args.removedValue,
      selectedItem:
        args.addedValue !== undefined
          ? this._getItemByValue(args.addedValue)
          : undefined,
      sourceEvent: args.sourceEvent,
    }
  }

  private _emitChange(detail: TagInputModelEventDetail): void {
    dispatchMonoEvent(this, 'change', detail)
  }

  private _emitAdd(detail: TagInputModelEventDetail): void {
    dispatchMonoEvent(this, 'add', detail)
  }

  private _emitRemove(detail: TagInputModelEventDetail): void {
    dispatchMonoEvent(this, 'remove', detail)
  }

  private _emitClear(detail: TagInputModelEventDetail): void {
    dispatchMonoEvent(this, 'clear', detail)
  }

  private _setValue(
    nextValue: TagInputValue[],
    args: {
      addedValue?: TagInputValue
      removedValue?: TagInputValue
      sourceEvent?: Event
      emitAdd?: boolean
      emitRemove?: boolean
      emitClear?: boolean
    } = {},
  ): void {
    const oldValue = [...this._selectedValues]
    const normalized = [...nextValue]

    // Remember the rows behind these values while they are still loaded. Every
    // selection path funnels through here — `_addValue`, `_toggleValue`, keyboard
    // pick, row click, select-all, clear — so one call covers them all.
    this._rememberSelected(normalized)

    this.value = normalized
    this.modelValue = normalized

    const detail = this._createModelDetail({
      modelValue: normalized,
      oldValue,
      addedValue: args.addedValue,
      removedValue: args.removedValue,
      sourceEvent: args.sourceEvent,
    })

    this._emitChange(detail)

    if (args.emitAdd) this._emitAdd(detail)
    if (args.emitRemove) this._emitRemove(detail)
    if (args.emitClear) this._emitClear(detail)

    // A new chip lands at the END of the inline strip, i.e. off-screen once the
    // strip has overflowed — reveal it, so picking a row always shows what was
    // picked. Every selection path funnels through here, so this covers the
    // keyboard, a row click and select-all alike.
    if (args.emitAdd && this._chipBehaviour === 'inline') {
      void this.updateComplete.then(() => this._chipStrip.scrollToEnd())
    }
  }

  private _addValue(value: TagInputValue, event?: Event): void {
    if (this.disabled || this.readonly) return
    // At the cap the add is REJECTED — the list stays open and usable (to
    // deselect, or just to look), the typed tag is dropped and the query reset so
    // no filter is left behind for a pick that can never land.
    if (!this._canAddMore) return this._resetSearch()

    if (!this.allowCustom && !this._getItemByValue(value)) return

    if (!this._selectedValues.some((v) => this._isSameValue(v, value))) {
      this._setValue([...this._selectedValues, value], {
        addedValue: value,
        sourceEvent: event,
        emitAdd: true,
      })
    }

    this._close()
    this._inputEl?.focus()
  }

  /**
   * Checkbox-mode toggle: add or remove a value while keeping the dropdown open
   * (and the typed filter intact), so the user can check several rows in a row.
   */
  private _toggleValue(value: TagInputValue, event?: Event): void {
    if (this.disabled || this.readonly) return

    const selected = this._selectedValues.some((v) => this._isSameValue(v, value))

    if (selected) {
      // At the floor the deselect is rejected — the row stays ticked. Nothing is
      // disabled; the pick just does not land, same as an add at the cap.
      if (!this._canRemoveMore) return
      this._setValue(
        this._selectedValues.filter((v) => !this._isSameValue(v, value)),
        { removedValue: value, sourceEvent: event, emitRemove: true },
      )
    } else {
      if (!this._canAddMore) return this._resetSearch()
      this._setValue([...this._selectedValues, value], {
        addedValue: value,
        sourceEvent: event,
        emitAdd: true,
      })
    }

    // A pick in non-checkable mode is a completed add, so it ends the query the
    // same way `_addValue` does. `checkable` deliberately keeps the panel open AND
    // the typed filter, so several rows can be ticked (see the note above).
    if (!this.checkable) {
      this._close()
      this._inputEl?.focus()
      return
    }

    this._open = true
    this._inputEl?.focus()
  }

  /**
   * How much of `items` is selected — what paints a select-all box unchecked,
   * indeterminate or checked. Disabled options are ignored, so a group whose only
   * unselected row is disabled still reads as fully selected.
   */
  private _selectionStateOf(items: TagInputItem[]): 'none' | 'some' | 'all' {
    const usable = items.filter((item) => this._isSelectable(item))
    if (!usable.length) return 'none'

    let hit = 0
    for (const item of usable) if (this._isSelected(item)) hit += 1

    if (hit === 0) return 'none'
    return hit === usable.length ? 'all' : 'some'
  }

  /**
   * Whether the "All" row reaches the SERVER rather than the loaded rows.
   *
   * Gated on a bound `DataSource` + `load-more`, which together mean "the list is
   * a window onto something bigger". A plain `items` array is static and already
   * wholly in memory, so it keeps the loaded-only behaviour.
   */
  private get _serverSelectAll(): boolean {
    return !!this.dataSource && !!this._loadMoreMode
  }

  /** The source's own page size, when it pages; `0` otherwise. */
  private _sourcePageSize(): number {
    const ds = this.dataSource as { paginate?: () => boolean, pageSize?: () => number } | null
    if (!ds || typeof ds.pageSize !== 'function') return 0
    if (typeof ds.paginate === 'function' && !ds.paginate()) return 0
    const n = Number(ds.pageSize())
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  /** The source's row count, when it knows one. */
  private _serverTotal(): number | undefined {
    const n = Number(this.dataSource?.totalCount?.())
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  /**
   * The "All" box, judged against the SERVER total rather than the loaded rows.
   *
   * Without this the box reads `'all'` the moment the loaded page is selected —
   * and the next click would CLEAR, so the drain could never be reached. Every
   * state below `all` therefore has to mean "clicking me selects more".
   *
   * BOTH halves of the `'all'` test matter, and each rules out a way of being
   * wrong. `_selectionStateOf` alone says `'all'` after one page of 250. The count
   * alone says `'all'` whenever the selection is merely LARGER than the total,
   * which a search makes routine: hold 111 rows, narrow the query to 11, and a
   * bare `111 >= 11` paints a finished box over eleven rows none of which are
   * selected — and the next click would clear instead of selecting them.
   *
   * Falls back to the loaded-scope reading when the source cannot say how many
   * rows it has, which is the honest answer: nothing here can tell whether the
   * selection is complete.
   */
  private _selectAllState(usable: TagInputItem[]): 'none' | 'some' | 'all' {
    const loaded = this._selectionStateOf(usable)
    if (!this._serverSelectAll) return loaded

    const total = this._serverTotal()
    if (total === undefined) return loaded

    if (loaded === 'all' && total > 0 && this._selectedValues.length >= total) return 'all'
    // Anything held at all is `'some'`, even when nothing VISIBLE is ticked: the
    // field does hold a selection, and the box's job here is to say that clicking
    // it will add to it rather than throw it away.
    return this._selectedValues.length > 0 ? 'some' : 'none'
  }

  /**
   * Select every row the source returns for the CURRENT search — the tag-input's
   * counterpart to `<mono-table-checkbox type="all">`.
   *
   * `readAllRows` walks the store in chunks and rebuilds the source's live filter
   * plus its folded search (`searchFilterOf`), so this means "everything the user
   * is currently looking at", not the whole table. Deliberately NOT routed through
   * `_ds`: its `_onChanged` resets the accumulated pages whenever a `changed`
   * fires outside its own load, and `readAllRows` talks to the store directly.
   */
  private async _selectAllFromServer(event?: Event): Promise<void> {
    if (this._selectAllPending) return

    // A drain reads the filter off the source, so a debounced query that has not
    // landed yet would silently drain the PREVIOUS search.
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
      this._searchTimer = undefined
      await this._applySearch(this._inputValue)
    }

    // Published BEFORE the first request: a flag flipped after the await is a
    // loading state nobody can observe.
    this._selectAllPending = true
    try {
      // Chunk = `page-size`, or the source's own page when that is larger: a
      // source paged at 20 should not be re-read ten rows at a time.
      const rows = await readAllRows<TagInputItem>(this.dataSource, {
        chunkSize: Math.max(1, this._pageSize, this._sourcePageSize()),
      })

      const usable = this._normalizeItems(rows).filter((item) => this._isSelectable(item))
      const values = usable.map((item) => this._resolveItemValue(item) as TagInputValue)

      // A Set, not `_isSelected` per row: that is a linear scan of the selection
      // for each of possibly thousands of drained rows.
      const seen = new Set(
        this._selectedValues.map((v) => this._cacheKey(v)).filter((k) => k !== undefined),
      )
      const additions: TagInputValue[] = []
      for (let i = 0; i < values.length; i++) {
        const key = this._cacheKey(values[i])
        if (key !== undefined && seen.has(key)) continue
        if (key !== undefined) seen.add(key)
        additions.push(values[i])
        // Seed the label cache from the row we just fetched. Without this an
        // unresolvable value renders NO chip at all (`_resolvedValues`), so the
        // field would look empty while holding every value.
        if (key !== undefined && this.keyValue) this._selectedItemCache.set(key, usable[i])
      }

      if (!additions.length) return

      // `max` is a hard cap for the drain too: "select everything" fills the room
      // left and stops, rather than this one control breaking its own contract.
      const room = this._room
      if (!room) return
      this._setValue([...this._selectedValues, ...additions.slice(0, room)], {
        sourceEvent: event,
        emitAdd: true,
      })
    } finally {
      this._selectAllPending = false
      // Same as every other bulk toggle: the panel stays open so the user can keep
      // going. Refocus because disabling the row while the drain ran may have
      // blurred it.
      this._open = true
      this._inputEl?.focus()
    }
  }

  /**
   * Where the "All" row's click goes.
   *
   * Only a state BELOW `all` drains; once `_selectAllState` says everything on the
   * server is held, the row goes back to being a clear button. `_toggleMany` still
   * owns both directions for a plain `items` array.
   *
   * A drain is for the rows NOT yet here. Once the controller has walked the source
   * to its last page — `load-more` scrolled to the end, or a source whose whole
   * result fit its first page — every row the query matches is already in
   * memory, and `items` (the visible, server-filtered set) IS the answer: select
   * it as a plain array would, with no request. A query still inside its debounce
   * disqualifies that shortcut, because the loaded rows belong to the PREVIOUS
   * search; the drain path flushes it first.
   */
  private _onSelectAllClick(
    items: TagInputItem[],
    state: 'none' | 'some' | 'all',
    event: Event,
  ): void {
    if (this._selectAllPending) return
    if (!this._serverSelectAll) {
      this._toggleMany(items, event)
      return
    }
    if (state !== 'all') {
      if (this._ds.atLastPage && !this._searchTimer) {
        this._toggleMany(items, event)
        return
      }
      void this._selectAllFromServer(event)
      return
    }
    this._clearAllFromServer(event)
  }

  /**
   * Untick "All" after a drain.
   *
   * NOT `_toggleMany`: that only removes the values present in `items`, which on a
   * paged source is one page — so clearing 1,085 drained rows would drop ten of
   * them and leave the box reading `'some'`. `'all'` here means the selection is
   * the drain, so the inverse is emptying it, the same reading
   * `<mono-table-checkbox>` gives its own clear.
   */
  private _clearAllFromServer(event?: Event): void {
    if (this.disabled || this.readonly) return
    if (!this._selectedValues.length) return

    this._setValue([], { sourceEvent: event, emitRemove: true })
    this._open = true
    this._inputEl?.focus()
  }

  /**
   * Select every one of `items`, or clear them all if they are already selected —
   * the "All" row and every group header run through here.
   *
   * ONE `_setValue` call, so a bulk toggle is a single `mno-change` carrying the
   * whole next array rather than N events a consumer would have to coalesce.
   * `addedValue` / `removedValue` are deliberately left undefined for the same
   * reason: there is no single value to name, and guessing one would be worse than
   * saying nothing (`modelValue` and `oldValue` carry the full before/after).
   */
  private _toggleMany(items: TagInputItem[], event?: Event): void {
    if (this.disabled || this.readonly) return

    const usable = items.filter((item) => this._isSelectable(item))
    if (!usable.length) return

    const values = usable.map((item) => this._resolveItemValue(item) as TagInputValue)
    const current = this._selectedValues
    const isOn = (v: TagInputValue) => current.some((c) => this._isSameValue(c, v))

    if (values.every(isOn)) {
      // A bulk deselect stops at the floor (`_keepFloor`).
      this._setValue(
        this._keepFloor(current.filter((c) => !values.some((v) => this._isSameValue(c, v)))),
        { sourceEvent: event, emitRemove: true },
      )
    } else {
      const missing = values.filter((v) => !isOn(v))
      // `max` is a hard cap, so a bulk add fills the room that is left and stops
      // — overshooting it here would let this one control break its own contract.
      const room = Math.min(missing.length, this._room)

      if (!room) return

      this._setValue([...current, ...missing.slice(0, room)], {
        sourceEvent: event,
        emitAdd: true,
      })
    }

    // Same as a single checkbox toggle: keep the list open and the typed filter
    // intact so the user can keep going.
    this._open = true
    this._inputEl?.focus()
  }
  private _removeValue(value: TagInputValue, event?: Event): void {
    event?.stopPropagation()

    if (this.disabled || this.readonly) return
    if (!this._canRemoveMore) return

    this._setValue(
      this._selectedValues.filter((item) => !this._isSameValue(item, value)),
      {
        removedValue: value,
        sourceEvent: event,
        emitRemove: true,
      },
    )

    this._inputEl?.focus()
  }

  private _clear(event: Event): void {
    event.stopPropagation()

    if (this.disabled || this.readonly) return

    this._setValue(this._keepFloor([]), {
      sourceEvent: event,
      emitClear: true,
    })

    this._close()
    this._inputEl?.focus()
  }

  private _handleInput(event: Event): void {
    if (this.disabled || this.readonly) return

    const input = event.currentTarget as HTMLInputElement

    // `searchable=false` renders the input read-only, so this shouldn't fire —
    // but a programmatic `input` event still can. Keep the field text empty
    // rather than letting an untypable field hold a stale query.
    if (!this.searchable) {
      input.value = ''
      return
    }

    this._inputValue = input.value
    this._open = true
    this._activeIndex = this._filteredItems.length ? 0 : -1
    // While filtering, the top result is the right place for the cursor — drop the
    // open-edge latch so a late server response can't yank it back to the last
    // selected tag mid-search.
    this._cursorPending = false
    this._scheduleSearch() // server-side query (debounced) when a DataSource is bound
  }

  /**
   * Focus alone opens nothing: a Tab into the field is not a request to see the
   * list — typing, ↓, a click in a searchable field or the chevron are. (It used
   * to open, which also meant every chip-remove's refocus popped the list.)
   */
  private _handleFocus(): void {
    // Kept as a hook for the input's focus styling; intentionally empty.
  }

  /**
   * A click in the field focuses the input and, when the field is searchable,
   * OPENS the list — the input is the point there, and clicking into it is how
   * you start typing; it never closes, because a click in a text input while
   * the list is open is caret placement, not a toggle (the chevron, Escape and
   * an outside click close). A non-searchable field has nothing to type into,
   * so there the click TOGGLES: a second click on the field closes the list.
   */
  private _handleFieldClick(): void {
    if (this.disabled || this.readonly) return

    this._inputEl?.focus()
    this._moreOpen = false
    if (this.searchable) this._open = true
    else if (this._open) this._close()
    else this._open = true
  }

  /** The chevron: the one mouse gesture that both opens and closes. */
  private _toggleFromCaret(event: Event): void {
    event.stopPropagation()
    if (this.disabled || this.readonly) return
    this._moreOpen = false
    if (this._open) {
      this._close()
    } else {
      this._open = true
      this._inputEl?.focus()
    }
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (this.disabled || this.readonly) return

    const items = this._filteredItems

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      this._open = true
      this._activeIndex = items.length
        ? Math.min(this._activeIndex + 1, items.length - 1)
        : -1
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      this._activeIndex = items.length
        ? Math.max(this._activeIndex - 1, 0)
        : -1
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      const activeItem =
        this._activeIndex >= 0 ? items[this._activeIndex] : undefined

      if (activeItem && !activeItem.disabled) {
        this._toggleValue(this._resolveItemValue(activeItem) as TagInputValue, event)
        return
      }

      const customValue = this._inputValue.trim()
      if (customValue && this.allowCustom) {
        this._addValue(customValue, event)
      }

      return
    }

    if (event.key === ',' || event.key === 'Tab') {
      const customValue = this._inputValue.trim()

      if (customValue && this.allowCustom) {
        event.preventDefault()
        this._addValue(customValue, event)
      }

      return
    }

    if (event.key === 'Backspace' && !this._inputValue && this._selectedValues.length) {
      event.preventDefault()
      const lastValue = this._selectedValues[this._selectedValues.length - 1]
      this._removeValue(lastValue, event)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      this._close()
    }
  }

  private _handleDocumentClick = (event: MouseEvent): void => {
    if (this.stayOpen) return
    if (!this._open && !this._moreOpen) return

    const path = event.composedPath()
    // Both panels may be relocated into a body portal — clicks inside either
    // must not count as "outside".
    if (path.includes(this) || this._popup.containsInPath(path) || this._morePopup.containsInPath(path)) return

    this._close()
    this._moreOpen = false
  }

  /**
   * Close when focus lands anywhere else — tabbing into the next field fires no
   * click at all.
   *
   * Tests the INCOMING focus target rather than `focusout`/`relatedTarget`: the
   * panel is relocated into a `<body>` portal, so focus moving *into* the panel
   * reads as focus leaving the host and would close the dropdown as soon as you
   * clicked into it. The `composedPath` guard has no such ambiguity, and covers
   * the shadow build where the panel stays in the host's shadow root.
   */
  private _handleDocumentFocusIn = (event: FocusEvent): void => {
    if (this.stayOpen) return
    if (!this._open && !this._moreOpen) return

    const path = event.composedPath()
    if (path.includes(this) || this._popup.containsInPath(path) || this._morePopup.containsInPath(path)) return

    this._close()
    this._moreOpen = false
  }

  private _handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this._open && !this._moreOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      this._close()
      this._moreOpen = false
    }
  }

  private _renderLabel(): TemplateResult | typeof nothing {
    const hasContent = !!this.label || this._hasLabelSlotState
    if (!hasContent && !this._slotsAlwaysRender) return nothing

    return html`
      <label
        class=${this._cls('mono-tag-input-label', 'label')}
        mono-label
        for=${this._inputId}
        ?mono-empty=${!hasContent}
      >
        ${this._slotOutlet('label', this.label)}

        ${this.required
        ? html`
              <span class=${this._cls('mono-tag-input-required', 'required')} mono-required-mark>
                *
              </span>
            `
        : nothing}
      </label>
    `
  }

  /**
   * How many chips to draw before the rest collapse into "+N more" — Infinity
   * when uncapped or while the total sits under the collapse floor
   * (`visibleChipCap`). `chip.maxVisible` / `chip.minVisible` pin, the element
   * props are the fallback. Applies to `inline` as well: the "+N more" chip
   * then sits in the strip after the visible ones, and its panel lists the rest
   * exactly as in `flex`. Every downstream consumer (`_overflowChips`,
   * `_renderChips`, the more panel) reads this, so the rule lives in one place.
   */
  private get _maxChips(): number {
    const chip = this._chipProps
    return visibleChipCap(
      this._resolvedValues.length,
      resolveChipLimit(chip, 'maxVisible', this.maxVisible),
      resolveChipLimit(chip, 'minVisible', this.minVisible),
    )
  }

  /** Selected values that have a row behind them — what the chips actually draw. */
  private get _resolvedValues(): TagInputValue[] {
    return this._selectedValues.filter((v) => !this._isUnresolvedKey(v))
  }

  private get _overflowChips(): TagInputValue[] {
    const max = this._maxChips
    // Reads the RESOLVED list for the same reason `_renderChips` does — otherwise
    // "+N more" would count chips that are never drawn.
    return max === Infinity ? [] : this._resolvedValues.slice(max)
  }

  private _closeSvg(): TemplateResult {
    return this.renderIcon('close')
  }

  /** The `chip` prop, always an object (it can be assigned null from a binding). */
  private get _chipProps(): TagInputChipProps {
    return this.chip ?? {}
  }

  /** Chip layout: `inline` = one scrolling line, anything else = today's wrap. */
  private get _chipBehaviour(): ChipBehaviour {
    return this._chipProps.behaviour === 'inline' ? 'inline' : 'flex'
  }

  /**
   * Chip skin matching the field skin: a `filled` field already tints its own
   * surface, so a soft chip would vanish into it — go solid; `underlined` is
   * minimal, so the chip stays outline. `chip.variant` pins one instead.
   */
  private get _chipVariantClass(): ChipVariant {
    const pinned = this._chipProps.variant
    if (pinned) return pinned
    if (this.variant === 'filled') return 'solid'
    if (this.variant === 'underlined') return 'outline'
    return 'soft'
  }

  /** Chips wear the control's color unless `chip.color` pins another. */
  private get _chipColorClass(): ChipColor {
    return this._chipProps.color ?? (this.color as ChipColor)
  }

  /**
   * Classes shared by the tag chips and the "+N more" chip, in `mono-chip`'s own
   * order (`mono-chip <size> <variant>-<color> <shape>`), so chip.css paints them
   * exactly as it paints a real `<mono-chip>`.
   *
   * `mono-tag-input-chip` is a marker only — it scopes the `--mono-chip-*` bridge
   * in tag-input.css so the bridge never reaches a `<mono-chip>` a consumer slots
   * into the field. `chip.color` deliberately picks a hue OTHER than the control
   * accent, so it adds the `-pinned` marker that switches the bridge back off.
   */
  private get _chipBaseClasses(): string {
    const chip = this._chipProps

    // NOT `mono-chip`: a tag chip is Basecoat's combobox chip, painted by
    // tag-input.css on the [mono-chip] attribute — chip.css never sees it.
    return [
      'mono-tag-input-chip',
      chip.color ? 'mono-tag-input-chip-pinned' : '',
      // A chip is a fixed-height box, so at the small steps it — not the text —
      // is what floors the field. A hard-coded `sm` chip (20px) does not fit
      // inside an `xs` control (24px token, ~21px of room), so the default
      // tracks the field's own size. An explicit `chip.size` still wins.
      chip.size ?? (this.size === 'xs' || this.size === 'sm' ? 'xs' : 'sm'),
      `${this._chipVariantClass}-${this._chipColorClass}`,
      // no `rounded-<step>` class: that is Tailwind/UnoCSS's namespace (see
      // chip-core.ts) — the shape travels as the `mono-rounded` attribute
      '',
      chip.dot ? 'has-dot' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  /**
   * Class for one chip part. Both class APIs append: the tag-input-level key
   * (`cssClass.chip` / `.chipLabel` / `.chipRemove`, the established surface) and
   * the chip-level one (`chip.cssClass.*`, which additionally reaches the parts
   * tag-input has no key for — `main`, `content`, `dot`).
   */
  private _chipCls(
    base: string,
    chipKey: keyof ChipCssClass,
    key?: keyof TagInputCssClass,
  ): string {
    return [base, key ? this.cssClass?.[key] : undefined, this._chipProps.cssClass?.[chipKey]]
      .filter(Boolean)
      .join(' ')
  }

  /** Render one chip with shared mono-chip markup/classes. */
  private _renderChip(value: TagInputValue, removable: boolean): TemplateResult {
    const chip = this._chipProps
    const label = this._getLabelByValue(value)
    // At the `min` floor the chips lose their ✕: the removal would be rejected
    // anyway, so the button must not promise one.
    const canRemove = removable && !this.disabled && !this.readonly && this._canRemoveMore

    return html`
      <div
        class=${this._chipCls(
      `${this._chipBaseClasses}${canRemove ? ' removable' : ''}`,
      'root',
      'chip',
    )}
        mono-chip
        ?mono-removable=${canRemove}
        mono-chip-color=${chip.color ?? nothing}
      >
        <span class=${ifDefined(chip.cssClass?.main)} mono-chip-main>
          <span class=${this._chipCls('chip-content', 'content')} mono-chip-content>
            ${chip.dot
        ? html`<span
                  class=${this._chipCls('chip-dot', 'dot')}
                  mono-chip-dot
                  aria-hidden="true"
                ></span>`
        : nothing}
            <span class=${this._chipCls('chip-label', 'label', 'chipLabel')} mono-chip-label>${label}</span>
            ${canRemove
        ? html`
                  <button
                    type="button"
                    class=${this._chipCls('chip-close', 'close', 'chipRemove')}
                    mono-chip-close
                    aria-label=${chip.closeLabel ?? `Remove ${label}`}
                    @click=${(event: Event) => this._removeValue(value, event)}
                  >
                    ${this._closeSvg()}
                  </button>
                `
        : nothing}
          </span>
        </span>
      </div>
    `
  }

  /**
   * The chip region. `flex` returns the chips as bare siblings of the input, so
   * they wrap with it — the historical markup, unchanged. `inline` nests them in
   * one `overflow-x: hidden` strip instead, which is what makes the row scroll
   * as a unit while the input keeps its own space beside it.
   */
  private _renderChipRegion(): TemplateResult | TemplateResult[] {
    const chips = this._renderChips()
    if (this._chipBehaviour !== 'inline') return chips
    return html`
      <div class=${this._cls('mono-tag-input-chip-strip', 'chipStrip')} mono-chip-strip>${chips}</div>
    `
  }

  /**
   * How many chips the last render drew, and how many the strip was last
   * measured against. Plain fields, not `@state` — they are read in `updated()`
   * to decide whether a measurement is needed, and making them reactive would
   * schedule the very extra update this avoids.
   */
  private _renderedChipCount = 0
  private _measuredChipCount = 0

  private _renderChips(): TemplateResult[] {
    const max = this._maxChips
    // A value whose row has not loaded yet is skipped rather than drawn as its raw
    // key — see `_isUnresolvedKey`. The VALUE is untouched: the chip appears as soon
    // as the list can label it, and the field's clear button still empties it.
    const visible = max === Infinity ? this._resolvedValues : this._resolvedValues.slice(0, max)
    this._renderedChipCount = visible.length

    const chips = visible.map((value) => this._renderChip(value, true))

    const overflow = this._overflowChips
    if (overflow.length) {
      chips.push(html`
        <div
          class=${this._cls(
        // `has-dot` is dropped: the overflow chip is a counter, not a tag value.
        `${this._chipBaseClasses.replace(' has-dot', '')} clickable mono-tag-input-more`,
        'moreChip',
      )}
          mono-chip
          mono-more
          mono-chip-color=${this._chipProps.color ?? nothing}
        >
          <span
            class=${ifDefined(this._chipProps.cssClass?.main)}
            mono-chip-main
            role="button"
            tabindex="0"
            @mousedown=${(event: MouseEvent) => event.preventDefault()}
            @click=${(event: Event) => {
          event.stopPropagation()
          this._moreOpen = !this._moreOpen
          if (this._moreOpen) this._close()
        }}
          >
            <span class=${this._chipCls('chip-content', 'content')} mono-chip-content>
              <span class=${this._chipCls('chip-label', 'label')} mono-chip-label>+${overflow.length} more</span>
            </span>
          </span>
        </div>
      `)
    }

    return chips
  }

  /**
   * The trailing control row: `‹ › ✕` or `‹ › ⌄`.
   *
   * The scroll buttons only exist in `inline` mode, and each only while there is
   * something to scroll toward — so a strip that fits shows neither, and a strip
   * parked at its start shows only `›`.
   *
   * Clear and caret are MUTUALLY EXCLUSIVE, in both layouts: whenever the clear
   * button is available the field has a value and clearing is the useful action,
   * and whenever it is not (empty field, or `clearable`/`disabled`/`readonly`
   * ruling it out) the caret advertises the dropdown instead. That keeps the row
   * one glyph wide, which is what lets `flex` mode go on reserving a single-icon
   * gutter.
   *
   * The scroll buttons suppress `mousedown` and stay out of the tab order: they
   * are a view control, so paging must not blur the input (which would close the
   * dropdown mid-interaction) or move focus off the field. The clear button
   * keeps its existing focus behaviour.
   */
  /**
   * One scroll button. `active` false keeps the box — and therefore the row's
   * width — but hides it (`is-idle` → `visibility: hidden`), so reaching an end
   * of the strip costs no layout. `disabled` and `aria-hidden` keep the hidden
   * one out of reach of the pointer and of assistive tech.
   */
  private _renderScrollButton(dir: -1 | 1, active: boolean): TemplateResult {
    const back = dir === -1
    const base = `mono-tag-input-scroll mono-tag-input-scroll-${back ? 'prev' : 'next'}${
      active ? '' : ' is-idle'
    }`
    return html`
      <button
        type="button"
        class=${this._cls(base, back ? 'scrollPrev' : 'scrollNext')}
        mono-scroll=${back ? 'prev' : 'next'}
        ?mono-idle=${!active}
        aria-label=${back ? 'Scroll tags backward' : 'Scroll tags forward'}
        aria-hidden=${active ? 'false' : 'true'}
        ?disabled=${!active}
        tabindex="-1"
        @mousedown=${(event: MouseEvent) => event.preventDefault()}
        @click=${(event: Event) => {
        event.stopPropagation()
        this._chipStrip.page(dir)
      }}
      >
        ${chevronIcon(dir)}
      </button>
    `
  }

  private _renderActions(): TemplateResult {
    const inline = this._chipBehaviour === 'inline'
    // BOTH buttons render together, or neither — never one. They sit in the same
    // flex row as the strip, so a button appearing or disappearing would resize
    // the strip by its own width plus the row gap (~25px at `md`). The strip is
    // the only shrinkable item, so it absorbs all of it: `scrollLeft` is then past
    // the new maximum, the browser silently re-clamps it, and every chip lurches
    // sideways. Paging cannot change whether the strip OVERFLOWS — only where in
    // it you are — so gating both on `overflowing` makes the row a fixed width for
    // the whole interaction, and the jump has nowhere to come from.
    const showScroll = inline && this._chipStrip.overflowing
    // The caret is swapped out for the clear button while there is a clearable
    // value — open or closed. THE VALUE WINS: on a searchable field the caret is
    // the only mouse way to close (the body only opens), which is why the two
    // once sat side by side; a field with a value now closes by picking, Escape
    // or an outside click. Same rule as `<mono-select>` / `<mono-dropdown-table>`,
    // so the three line up in a form.
    //
    // REMOVED, not parked, in inline mode too. The strip does resize by one glyph
    // when the swap happens — but the swap rides on the VALUE changing (a chip
    // added to an empty field, or the last one cleared), which re-lays the strip
    // anyway; it never happens on open/close or while paging, which is the case
    // the scroll-button gate above guards. Holding the slot only bought a blank
    // gap after ✕ for the whole time a value is set.
    //
    // `disabled` / `readonly` show NEITHER glyph: the field refuses every gesture,
    // so a caret would promise an open it never delivers. The actions row still
    // renders — the gutter (and the scroll pair, which keeps paging the chips so
    // they can at least be read) stays exactly where it was.
    const showArrow = !this._showClear && !this.disabled && !this.readonly
    return html`
      <div class=${this._cls('mono-tag-input-actions', 'actions')} mono-actions>
        ${showScroll
        ? html`
              ${this._renderScrollButton(-1, this._chipStrip.canScrollStart)}
              ${this._renderScrollButton(1, this._chipStrip.canScrollEnd)}
            `
        : nothing}
        ${this._showClear
        ? html`
              <button
                type="button"
                class=${this._cls('mono-tag-input-clear', 'clear')}
                mono-clear
                aria-label="Clear tags"
                @click=${this._clear}
              >
                ${this.renderIcon('close')}
              </button>
            `
        : nothing}
        ${showArrow
        ? html`
              <span
                role="button"
                tabindex="-1"
                class=${this._cls('mono-tag-input-arrow', 'arrow')}
                mono-arrow
                aria-label="Toggle suggestions"
                aria-expanded=${this._open ? 'true' : 'false'}
                @mousedown=${(event: MouseEvent) => event.preventDefault()}
                @click=${this._toggleFromCaret}
              >
                ${caretIcon()}
              </span>
            `
        : nothing}
      </div>
    `
  }

  /**
   * Always rendered, shown by the root's `more-open` class: the panel lives in a
   * body portal while open and a portaled node cannot be removed by a
   * conditional render (Lit's ChildPart no longer contains it).
   */
  private _renderMorePanel(): TemplateResult {
    const overflow = this._moreOpen ? this._overflowChips : []

    return html`
      <div class=${this._cls('mono-tag-input-more-panel', 'morePanel')} mono-more-panel>
        ${overflow.map((value) => this._renderChip(value, true))}
      </div>
    `
  }

  private _toCssLength(value: string | number): string | undefined {
    if (value == null || value === '') return undefined
    if (typeof value === 'number') return `${value}px`
    const trimmed = String(value).trim()
    if (!trimmed) return undefined
    return /^-?\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed
  }

  /**
   * The author's cap goes out as the custom property `--_mono-tag-input-panel-max-h`
   * rather than a direct `max-height`: the popup controller also constrains this
   * same element (via `--mono-popup-avail-h`) to keep it inside the viewport, and
   * two writers on one declaration would clobber each other. The CSS `min()`s them.
   */
  private get _dropdownStyle(): Record<string, string> {
    const style: Record<string, string> = {}
    const panel = this.dropdown

    // The widths are plain declarations. The panel is positioned `left: 0; right: 0` against the
    // field, and a width on top of that is the over-constrained case, which CSS resolves by
    // dropping `right` — so the panel keeps its left edge and takes this size.
    const width = toCssSize(panel?.width)
    if (width) style.width = width
    const minWidth = toCssSize(panel?.minWidth)
    if (minWidth) style['min-width'] = minWidth
    const maxWidth = toCssSize(panel?.maxWidth)
    if (maxWidth) style['max-width'] = maxWidth
    const minHeight = toCssSize(panel?.minHeight)
    if (minHeight) style['min-height'] = minHeight

    // The object wins over the flat attribute, which stays for the plain-HTML case.
    const height = toCssSize(panel?.height) ?? this._toCssLength(this.dropdownHeight)
    if (height) style.height = height
    const maxHeight = toCssSize(panel?.maxHeight) ?? this._toCssLength(this.dropdownMaxHeight)
    if (maxHeight) style['--_mono-tag-input-panel-max-h'] = maxHeight
    else if (height) style['--_mono-tag-input-panel-max-h'] = height
    else if (this._scrollAutoMaxHeight)
      style['--_mono-tag-input-panel-max-h'] = this._scrollAutoMaxHeight
    return style
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
   * Scroll-mode ergonomics (see mono-select): cap the list height to the loaded
   * rows minus a sliver so a short page is still scrollable, instead of eagerly
   * fetching another page on open.
   */
  private _updateScrollAutoHeight(): void {
    // The object counts too, or the scroll heuristic would silently override an author's height.
    const userSetHeight =
      this._toCssLength(this.dropdownHeight) != null ||
      this._toCssLength(this.dropdownMaxHeight) != null ||
      toCssSize(this.dropdown?.height) != null ||
      toCssSize(this.dropdown?.maxHeight) != null

    const rowsShown = this._filteredItems.length
    const active =
      this._loadMoreMode === 'scroll' &&
      this._open &&
      !this._ds.atLastPage &&
      !userSetHeight &&
      rowsShown > 0

    if (!active) {
      this._setScrollAutoMaxHeight('')
      return
    }

    const el = this._dropdownEl
    const firstRow = el?.querySelector<HTMLElement>('.mono-tag-input-item')
    const rowH = firstRow?.offsetHeight ?? 0
    if (!el || !rowH) return

    const CAP_ROWS = 7
    let visible = Math.min(rowsShown, CAP_ROWS)
    if (rowsShown <= CAP_ROWS) visible -= 0.5

    this._setScrollAutoMaxHeight(`${Math.round(visible * rowH)}px`)
  }

  private _setScrollAutoMaxHeight(value: string): void {
    if (value === this._scrollAutoMaxHeight) return
    queueMicrotask(() => {
      this._scrollAutoMaxHeight = value
    })
  }

  private _renderLoadMore(): TemplateResult | typeof nothing {
    if (!this._loadMoreMode) return nothing
    if (!this._visibleItems.length || this._ds.atLastPage) return nothing

    if (this._ds.loadingMore) {
      return html`
        <div class=${`${this._cls('mono-tag-input-load-more', 'loadMore')} loading`} mono-load-more mono-loading>
          Loading…
        </div>
      `
    }

    if (this._loadMoreMode !== 'button') return nothing

    return html`
      <button
        type="button"
        class=${this._cls('mono-tag-input-load-more', 'loadMore')}
        mono-load-more
        @mousedown=${(event: MouseEvent) => event.preventDefault()}
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

  /**
   * The reused `.mono-checkbox` box. Tri-state: `'some'` paints the indeterminate
   * dash, which is what tells a user a group is PARTLY selected — the one thing a
   * two-state box could not say.
   */
  private _renderCheckBox(
    state: 'none' | 'some' | 'all',
    loading = false,
  ): TemplateResult {
    const cls = [
      this._cls('mono-checkbox', 'check'),
      this.color,
      state === 'all' ? 'mono-checkbox-checked' : '',
      state === 'some' ? 'mono-checkbox-indeterminate' : '',
      loading ? 'is-loading' : '',
    ]
      .filter(Boolean)
      .join(' ')

    // `has-custom-icon` / `has-custom-indeterminate-icon` belong on the BOX, not
    // the wrapper — checkbox.css hangs them off `.mono-checkbox-box::before` and
    // `::after`, which are the tick and the dash. On the wrapper they match
    // nothing and the spinner spins on top of a checkmark. `_boxClasses` in
    // checkbox-core places them the same way.
    const boxCls = [
      'mono-checkbox-box',
      'sm',
      loading ? 'has-custom-icon has-custom-indeterminate-icon' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <span
        class=${cls}
        mono-check-box
        mono-checkbox
        mono-size="sm"
        mono-color=${this.color === 'primary' ? nothing : this.color}
        ?mono-checked=${state === 'all'}
        ?mono-indeterminate=${state === 'some'}
        ?mono-loading=${loading}
        aria-hidden="true"
      >
        <span class=${boxCls} mono-box ?mono-custom-icon=${loading} ?mono-custom-indeterminate-icon=${loading}>${loading ? this._renderCheckSpinner() : nothing}</span>
      </span>
    `
  }

  /**
   * The drain spinner. Inline SVG rather than the `i-mdi-loading` UnoCSS class
   * because a page stylesheet cannot reach the shadow build's root — one template
   * serves both, the same reason `composables/field-icons` exists.
   *
   * `.mono-checkbox-spinner` carries the sizing and the keyframes; checkbox.css is
   * already on the page for the light build and adopted into the shadow root for
   * the other, which is what the box itself depends on too.
   */
  private _renderCheckSpinner(): TemplateResult {
    return html`<svg
      class="mono-checkbox-spinner"
      mono-spinner
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>`
  }

  /**
   * The leading "All" row. Scoped to the rows the current search leaves visible,
   * which is what `items` already is at every call site.
   *
   * `role="option"` because that is what it behaves like — an option meaning "every
   * one of these" — so a screen reader announces it inside the same listbox as the
   * rows it toggles.
   */
  private _renderSelectAll(items: TagInputItem[]): TemplateResult | typeof nothing {
    if (!this.selectAll || this.disabled || this.readonly) return nothing

    const usable = items.filter((item) => this._isSelectable(item))
    // Nothing to select: the empty state already says so, and a lone "All" row over
    // no rows would be a control that cannot do anything.
    if (!usable.length) return nothing

    // Judged against the SERVER total when the list is a window onto a paged
    // source. `_selectionStateOf` would read 'all' once page one is ticked, and
    // the next click would CLEAR — leaving the drain unreachable.
    const state = this._selectAllState(usable)
    const pending = this._selectAllPending

    const cls = [
      this._cls('mono-tag-input-item', 'item'),
      this._cls('mono-tag-input-select-all', 'selectAll'),
      'has-check',
      state !== 'none' ? 'selected' : '',
      pending ? 'is-loading' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <button
        type="button"
        role="option"
        class=${cls}
        mono-item
        mono-select-all
        mono-check
        ?mono-selected=${state !== 'none'}
        ?mono-loading=${pending}
        aria-selected=${state === 'all' ? 'true' : 'false'}
        aria-busy=${pending ? 'true' : 'false'}
        ?disabled=${pending}
        @mousedown=${(event: MouseEvent) => event.preventDefault()}
        @click=${(event: Event) => this._onSelectAllClick(usable, state, event)}
      >
        ${this._renderCheckBox(state, pending)}
        <div class=${this._cls('mono-tag-input-item-text', 'itemText')} mono-item-text>
          <div class=${this._cls('mono-tag-input-item-title', 'itemTitle')} mono-item-title>
            ${this.selectAllLabel}
          </div>
        </div>
      </button>
    `
  }

  /**
   * A group header — a plain label, or its own select-all when `groupSelectAll` is
   * on and the group has rows to toggle. It stays a header either way: same class,
   * same sticky behaviour, same indent, so a grouped list does not reflow when the
   * feature is switched off.
   */
  private _renderGroupHeader(row: {
    level: number
    label: string
    items: TagInputItem[]
  }): TemplateResult {
    const base = `${this._cls('mono-tag-input-group', 'group')}${this.groupSticky ? ' sticky' : ''}`

    const usable = row.items.filter((item) => this._isSelectable(item))

    if (!this.groupSelectAll || this.disabled || this.readonly || !usable.length) {
      return html`<div class=${base} mono-group mono-level=${row.level} ?mono-sticky=${this.groupSticky} data-level=${row.level} role="presentation">
        ${row.label}
      </div>`
    }

    const state = this._selectionStateOf(usable)

    return html`
      <button
        type="button"
        class=${`${base} is-toggle${state !== 'none' ? ' selected' : ''}`}
        mono-group
        mono-toggle
        mono-level=${row.level}
        ?mono-sticky=${this.groupSticky}
        ?mono-selected=${state !== 'none'}
        data-level=${row.level}
        aria-pressed=${state === 'all' ? 'true' : 'false'}
        @mousedown=${(event: MouseEvent) => event.preventDefault()}
        @click=${(event: Event) => this._toggleMany(usable, event)}
      >
        ${this._renderCheckBox(state)}
        <span class=${this._cls('mono-tag-input-group-label', 'groupLabel')} mono-group-label>
          ${row.label}
        </span>
      </button>
    `
  }

  /**
   * A single selectable option button (index drives active/keyboard state).
   *
   * `level` is the group depth the row sits at — `0` for a flat list. It is stamped
   * as `data-level` so the CSS can step grouped rows in from their header; without
   * it a header and its own options started at the same x and the grouping read as
   * a flat list with labels sprinkled through it.
   */
  // ── slot="list": the consumer renders the option content ────────────────────────────────────
  //
  // The component keeps the row — its button, checkbox, active/selected state, click and keyboard.
  // Only what goes INSIDE a row's text area is handed over, so `checkable`, select-all, grouping
  // and the empty state keep working untouched.

  /**
   * Whether a `list` slot was supplied. Set by the builds, which own slot detection.
   *
   * `@state`, like its label/helper siblings: the shadow build only learns the slot has content
   * AFTER the first render creates the <slot>, so flipping this has to schedule another one.
   */
  @state()
  protected _hasListSlotState = false

  private _publishedEntries: MonoFormListEntry[] = []

  /**
   * The flat entry list published to `form.items()[key].list`.
   *
   * The SAME sequence the component renders — group headers interleaved with their leaves — so a
   * consumer looping it produces one node per row, in order, and the two stay paired by position
   * with nothing to key by hand. `_groupRows()` already computes exactly this for the grouped case.
   *
   * `key` is `item[keyValue]` via `_resolveItemValue`, the same value selection is keyed by, so the
   * feature introduces no second notion of a key.
   */
  private _listEntries(): MonoFormListEntry[] {
    // `selected` / `active` ride ALONG because the consumer draws the row: mono cannot put a
    // checkbox or a highlight inside a subtree it does not own, so it reports the two states
    // instead and the row binds them.
    const rowEntry = (item: TagInputItem, level: number, index: number): MonoFormListEntry => ({
      type: 'row',
      key: String(this._resolveItemValue(item) ?? ''),
      item: item as Record<string, unknown>,
      level,
      selected: this._isSelected(item),
      active: index >= 0 && index === this._activeIndex,
    })

    if (this._grouped) {
      return this._groupRows().map((row) =>
        row.kind === 'group'
          ? {
            type: 'group' as const,
            key: row.key,
            label: row.label,
            level: row.level,
            items: row.items as Record<string, unknown>[],
          }
          : rowEntry(row.item, row.level, row.index),
      )
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

  private _renderOption(item: TagInputItem, index: number, level = 0): TemplateResult {
    const active = index === this._activeIndex
    // Selected rows stay in the list — checked (checkbox) or `.selected` colored.
    const checked = this._isSelected(item)

    const itemClass = [
      this._cls('mono-tag-input-item', 'item'),
      this.checkable ? 'has-check' : '',
      active ? `active ${this.cssClass?.itemActive ?? ''}` : '',
      checked ? `selected ${this.cssClass?.itemSelected ?? ''}` : '',
      item.disabled ? `disabled ${this.cssClass?.itemDisabled ?? ''}` : '',
    ]
      .filter(Boolean)
      .join(' ')

    const itemValue = this._resolveItemValue(item)

    return html`
      <button
        type="button"
        role="option"
        class=${itemClass}
        mono-item
        ?mono-check=${this.checkable}
        ?mono-active=${active}
        ?mono-selected=${checked}
        ?mono-disabled=${!!item.disabled}
        mono-level=${level}
        data-level=${level}
        aria-selected=${checked ? 'true' : 'false'}
        ?disabled=${item.disabled}
        @mousedown=${(event: MouseEvent) => event.preventDefault()}
        @click=${(event: Event) =>
        itemValue === undefined ? undefined : this._toggleValue(itemValue as TagInputValue, event)}
      >
        ${this.checkable ? this._renderCheckBox(checked ? 'all' : 'none') : nothing}

        <div class=${this._cls('mono-tag-input-item-text', 'itemText')} mono-item-text>
          <div class=${this._cls('mono-tag-input-item-title', 'itemTitle')} mono-item-title>
            ${this._resolveItemDisplay(item)}
          </div>

          ${item.description
        ? html`
                <div class=${this._cls('mono-tag-input-item-sub', 'itemSub')} mono-item-sub>
                  ${item.description}
                </div>
              `
        : nothing}
        </div>
      </button>
    `
  }

  private _renderEmpty(): TemplateResult {
      const text = this.dataSource && this._ds.loading ? 'Loading…' : 'No items'
    return html`<div class=${this._cls('mono-tag-input-empty', 'empty')} mono-empty-row>${text}</div>`
  }

  private _renderItems(): TemplateResult {
    // `_filteredItems` is already search-filtered, which is exactly the scope both
    // select-alls promise: "all of what you can see".
    const visible = this._filteredItems
    const empty = !visible.length

    // The slot is checked FIRST, ahead of grouping: the entries it publishes already carry the
    // group headers interleaved with their leaves, so a grouped list is still the consumer's to
    // draw. Falling through to the grouped branch would paint mono's own rows instead and strand
    // the wrapper with nowhere to be placed.
    //
    // It also renders when the list is empty. The wrapper is a live framework subtree whose
    // `v-for` inserts against anchors INSIDE it; dropping it for the frame where a search matches
    // nothing would tear those out and take the consumer's next insert with them. mono's empty
    // text renders above it instead - with no rows the consumer's loop paints nothing anyway.
    if (this._hasListSlotState) {
      return html`
        ${empty ? this._renderEmpty() : this._renderSelectAll(visible)}
        ${this.renderListSlot()}
      `
    }

    if (empty) return this._renderEmpty()

    if (this._grouped) {
      return html`
        ${this._renderSelectAll(visible)}
        ${this._groupRows().map((row) =>
        row.kind === 'group'
          ? this._renderGroupHeader(row)
          : this._renderOption(row.item, row.index, row.level),
      )}
      `
    }

    return html`
      ${this._renderSelectAll(visible)}
      ${visible.map((item, index) => this._renderOption(item, index))}
    `
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
   * mono's own writes — attributes, and a checkbox appended INSIDE a row — cannot re-trigger it.
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
   * Your template says what a line LOOKS like. Everything that carries state or acts on the value
   * stays here: mono walks the lines it just published and stamps the state as `data-*`
   * attributes, then puts its own checkbox in — the same markup `_renderCheckBox` produces for
   * mono's own rows, so it inherits the same CSS and the same colour prop.
   *
   * Three rules keep this safe beside a framework:
   *   · children are ANNOTATED and APPENDED TO, never moved, reordered or removed — every
   *     `insertBefore` anchor a `v-for` patches against stays valid;
   *   · `data-*` only, never `class` — `class` is the consumer's binding and would be clobbered;
   *   · the injected node is marked `data-mono-chrome`, so it is never mistaken for content and is
   *     updated in place instead of recreated.
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
    // The same guard the click resolver uses: with no 1:1 match there is no honest pairing, so
    // stamp nothing rather than stamp the wrong line.
    if (children.length !== entries.length) return

    for (let i = 0; i < children.length; i++) {
      const node = children[i] as HTMLElement
      const entry = entries[i] as MonoFormListEntry

      node.setAttribute('data-mono-type', entry.type)
      node.setAttribute('data-mono-level', String(entry.level ?? 0))
      // NOT `data-mono-item-key`: that name belongs to the consumer as the explicit pairing
      // override, and a stale stamp under it would defeat the count check above.
      node.setAttribute('data-mono-key', entry.key)

      if (entry.type === 'group') {
        const usable = ((entry.items as TagInputItem[]) ?? []).filter((item) =>
          this._isSelectable(item),
        )
        const state = this._selectionStateOf(usable)
        node.setAttribute('data-mono-state', state)
        node.toggleAttribute('data-mono-selected', state === 'all')
        this._syncListCheckBox(
          node,
          this.checkable && this.groupSelectAll && !this.disabled && !this.readonly && usable.length > 0,
          state,
        )
        continue
      }

      node.toggleAttribute('data-mono-selected', !!entry.selected)
      node.toggleAttribute('data-mono-active', !!entry.active)
      this._syncListCheckBox(node, this.checkable, entry.selected ? 'all' : 'none')
    }
  }

  /**
   * mono's own checkbox, inside a line mono does not own.
   *
   * Same markup as `_renderCheckBox`, built by hand because Lit cannot render into a subtree it
   * does not control. It is created once and then only re-classed, so the consumer's framework
   * never sees a node appear and disappear under it.
   */
  private _syncListCheckBox(row: HTMLElement, wanted: boolean, state: 'none' | 'some' | 'all'): void {
    let box = row.querySelector('[data-mono-chrome]') as HTMLElement | null

    if (!wanted) {
      box?.remove()
      return
    }

    if (!box) {
      box = document.createElement('span')
      box.setAttribute('data-mono-chrome', '')
      box.setAttribute('aria-hidden', 'true')

      const inner = document.createElement('span')
      inner.className = 'mono-checkbox-box sm'
      // checkbox.css styles by ATTRIBUTE; the classes are inert legacy. Same
      // markup `_renderCheckBox` emits for mono's own rows.
      inner.setAttribute('mono-box', '')
      box.setAttribute('mono-check-box', '')
      box.setAttribute('mono-checkbox', '')
      box.setAttribute('mono-size', 'sm')
      box.appendChild(inner)

      // An explicit `data-mono-check` marker wins, so a consumer who cares can place the box
      // themselves; otherwise it opens the line, where mono's own rows put it.
      const anchor = row.querySelector('[data-mono-check]')
      if (anchor) anchor.appendChild(box)
      else row.insertBefore(box, row.firstChild)
    }

    box.className = [
      this._cls('mono-checkbox', 'check'),
      this.color,
      state === 'all' ? 'mono-checkbox-checked' : '',
      state === 'some' ? 'mono-checkbox-indeterminate' : '',
    ]
      .filter(Boolean)
      .join(' ')
    // The state the CSS actually reads — re-applied every sync, like the classes.
    if (this.color === 'primary') box.removeAttribute('mono-color')
    else box.setAttribute('mono-color', this.color)
    box.toggleAttribute('mono-checked', state === 'all')
    box.toggleAttribute('mono-indeterminate', state === 'some')
  }

  private _entryFromNode(node: Element): MonoFormListEntry | undefined {
    const keyed = node.closest?.('[data-mono-item-key]') as HTMLElement | null
    if (keyed) {
      const key = keyed.getAttribute('data-mono-item-key')
      return this._publishedEntries.find((e) => e.key === key)
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
        `[mono-tag-input] slot="list" rendered ${children.length} element(s) for ${this._publishedEntries.length} ` +
          'option(s), so a click cannot be paired with its row. Render exactly one element per ' +
          'entry, or put data-mono-item-key="<entry.key>" on each row.',
      )
      return undefined
    }

    // Headers come back too — a click on one is a group select-all, exactly as on mono's own.
    return this._publishedEntries[children.indexOf(row)]
  }

  /**
   * A click anywhere in the consumer's list, resolved back to an item.
   *
   * Delegated, because mono does not own the rows and so has nowhere to bind a per-row handler.
   * The walk starts at `event.target`, which may be an icon or a span deep inside the row.
   */
  protected _onListSlotClick = (event: Event): void => {
    if (this.disabled || this.readonly) return

    const target = event.target as Element | null
    const entry = target ? this._entryFromNode(target) : undefined
    if (!entry) return

    // A header IS a control wherever mono would have made one: the same `_toggleMany` its own
    // `_renderGroupHeader` binds, so a consumer-drawn header selects its whole subtree with no
    // handler in the consumer's template at all.
    if (entry.type === 'group') {
      if (!this.checkable || !this.groupSelectAll) return

      const usable = ((entry.items as TagInputItem[]) ?? []).filter((item) =>
        this._isSelectable(item),
      )
      if (!usable.length) return

      event.preventDefault()
      this._toggleMany(usable, event)
      return
    }

    const item = entry.item as TagInputItem | undefined
    if (!item || !this._isSelectable(item)) return

    event.preventDefault()
    this._toggleValue(this._resolveItemValue(item) as TagInputValue, event)
  }

  private _renderHelper(): TemplateResult | typeof nothing {
    const base = this._cls('mono-tag-input-message', 'message')
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


    // The wrapper's `mono-*` attributes mirror the props one for one and are what
    // tag-input.css styles; a prop at its default emits NO attribute. `mono-open`
    // and `mono-more-open` are STATES (the portal mirrors them onto the relocated
    // panels). The classes stay as inert hooks until 2.0.
    const state = this._resolvedValidationState
    return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-tag-input
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
        mono-validation-state=${state === 'default' ? nothing : state}
        ?mono-open=${this._open}
        ?mono-more-open=${this._moreOpen}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
        ?mono-checkable=${this.checkable}
        ?mono-searchable=${this.searchable}
      >
        ${this._renderLabel()}

        <div
          class=${this._fieldClasses}
          mono-field
          ?mono-inline=${this._chipBehaviour === 'inline'}
          ?mono-typing=${!!this._inputValue}
          @click=${this._handleFieldClick}
        >
          ${this._renderChipRegion()}

          <input
            id=${this._inputId}
            class=${this._cls('mono-tag-input-native', 'native')}
            mono-native
            type="text"
            .value=${this._inputValue}
            name=${ifDefined(this.name || undefined)}
            placeholder=${ifDefined(
      this._hasValue ? undefined : this.placeholder,
    )}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly || !this.searchable}
            ?required=${this.required && !this._hasValue}
            aria-label=${ifDefined(ariaLabel)}
            aria-invalid=${this._resolvedValidationState === 'invalid'
        ? 'true'
        : 'false'}
            aria-describedby=${ifDefined(describedBy)}
            aria-controls=${this._listboxId}
            aria-expanded=${this._open ? 'true' : 'false'}
            autocomplete="off"
            @input=${this._handleInput}
            @focus=${this._handleFocus}
            @keydown=${this._handleKeydown}
          />

          ${this._renderActions()}
        </div>

        ${this._renderMorePanel()}

        <div
          id=${this._listboxId}
          role="listbox"
          class=${this._cls('mono-tag-input-dropdown', 'dropdown')}
          mono-dropdown
          style=${styleMap(this._dropdownStyle)}
          @scroll=${this._handleDropdownScroll}
        >
          ${this._renderItems()}
          ${this._renderLoadMore()}
        </div>

        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>
          ${this._renderHelper()}
        </div>
      </div>
    `
  }

  public override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options)
  }

  public override blur(): void {
    this._inputEl?.blur()
  }

  /**
   * Open / close the suggestion panel. Mirrors `mono-select`'s API so anything
   * driving an editor generically — e.g. the data grid opening the focused
   * inline editor on `Enter` — can treat the two the same.
   */
  /** Whether the suggestion panel is currently open. */
  public get isOpen(): boolean {
    return this._open
  }

  public open(): void {
    if (this.disabled || this.readonly) return
    // Cursor placement is handled by the open-edge latch in `updated()`.
    this._open = true
    this._inputEl?.focus()
  }

  public close(): void {
    this._close()
  }

  public toggle(): void {
    if (this._open) this.close()
    else this.open()
  }

  public clearTags(): void {
    if (this.disabled || this.readonly) return

    this._setValue(this._keepFloor([]), {
      emitClear: true,
    })
    // Matches the clear button: the query goes with the values.
    this._resetSearch()
  }

  public addTag(value: TagInputValue): void {
    this._addValue(value)
  }

  public removeTag(value: TagInputValue): void {
    this._removeValue(value)
  }

  // --- build hooks -----------------------------------------------------------

  /** Whether the slot regions render even when empty. Light: no (omit empty
   *  regions). Shadow: yes — the native `<slot>`s must exist to project DSD
   *  content + be scanned (hidden via `[mono-empty]` when empty). */
  protected get _slotsAlwaysRender(): boolean {
    return false
  }

  protected _hasSlot(name: TagInputSlotName): boolean {
    return name === 'label' ? this._hasLabelSlotState : this._hasHelperSlotState
  }

  protected _setSlotState(name: TagInputSlotName, has: boolean): void {
    if (name === 'label') this._hasLabelSlotState = has
    else if (name === 'list') this._hasListSlotState = has
    else this._hasHelperSlotState = has
  }

  /**
   * Slot outlet. Light build (default): a `data-mono-slot` placeholder the
   * captured light-DOM nodes are re-parented into when present, else the prop
   * `fallback`. Shadow build overrides this with a native `<slot name>` carrying
   * the fallback as native slot content.
   */
  protected _slotOutlet(name: TagInputSlotName, fallback: unknown = nothing): TemplateResult {
    return this._hasSlot(name)
      ? html`<span data-mono-slot=${name}></span>`
      : html`${fallback}`
  }

  /**
   * Icon hook. Light build (default): the global `.mono-icon` / `i-mdi-*` UnoCSS
   * icon. Shadow overrides with inline SVG (UnoCSS can't reach a shadow root).
   *
   * Only the close glyph goes through here. The caret and the scroll chevrons
   * are inline SVG from `composables/field-icons`, shared with
   * `<mono-dropdown-table>` — see `_renderActions`.
   */
  protected renderIcon(_name: 'close'): TemplateResult {
    return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`
  }
}

  return MonoTagInputCoreClass as unknown as Constructor<MonoTagInputCoreInterface> & T
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoTagInputCoreInterface {
  /** True once a build has captured a `slot="list"`; swaps the generated rows for the slot. */
  protected _hasListSlotState: boolean
  protected _lateListSlot: LateSlotWatcher
  protected _onLateListSlot(): void
  protected get _listSlotWrapper(): HTMLElement | null
  protected _watchListChrome(): void
  protected _stopWatchingListChrome(): void
  protected _syncListChrome(): void
  /** Per-build render point for the consumer's list wrapper. */
  protected renderListSlot(): TemplateResult
  /** Delegated click over the consumer's rows, resolved by `data-mono-item-key`. */
  protected _onListSlotClick: (event: Event) => void
  /** The list wrapper's parking spot, portal-aware. */
  protected readonly _listSlotTarget: HTMLElement | null
  size: TagInputSize
  color: TagInputColor
  variant: TagInputVariant
  chip: TagInputChipProps
  modelValue: TagInputValue[]
  value: TagInputValue[]
  name: string
  label: string
  placeholder: string
  helperText: string
  validationState: TagInputValidationState
  validationMessage: string
  errorMessage: string
  successMessage: string
  ariaLabelText?: string
  disabled: boolean
  readonly: boolean
  required: boolean
  clearable: boolean
  allowCustom: boolean
  max?: number
  min?: number
  checkable: boolean
  maxVisible?: number
  minVisible?: number
  items: TagInputItem[]
  dataSource: TagInputDataSource | null
  immediate: boolean
  loadMore?: TagInputLoadMore | '' | boolean
  pageSize: number
  dropdown?: TagInputDropdownOptions
  dropdownHeight: string | number
  dropdownMaxHeight: string | number
  flip: boolean
  shift: boolean
  keyValue: string
  displayValue: TagInputDisplayValue
  displayGroup: TagInputDisplayGroup
  groupKey: string
  groupItems: string
  group: boolean
  groupSticky: boolean
  selectAll: boolean
  selectAllLabel: string
  groupSelectAll: boolean
  searchable: boolean
  stayOpen: boolean
  searchValue: MonoSearchValue
  searchOperation: string
  searchDebounce: number
  cssClass: TagInputCssClass
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
  clearTags(): void
  addTag(value: TagInputValue): void
  removeTag(value: TagInputValue): void

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected get _slotsAlwaysRender(): boolean
  protected _setSlotState(name: TagInputSlotName, has: boolean): void
  protected _slotOutlet(name: TagInputSlotName, fallback?: unknown): TemplateResult
  protected renderIcon(name: 'close'): TemplateResult
}