// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import type { StyleInfo } from 'lit/directives/style-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import {
  PopupPortalController,
  computePopupPlacement,
  applyPopupPlacement,
  type PopupSide,
  type PopupAlign,
} from '../../composables/popup-portal.js'
import type { DropdownPlacement } from '../dropdown/dropdown-types.js'
import {
  booleanStringConverter,
  numberStringConverter,
  optionalNumberConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { monoPendingGrace } from '../../composables/mono-skeleton'
import { buildSizeStyle, toCssSize, type CssSizeValue } from '../../composables/css-size'
import { resolveChipLimit, visibleChipCap } from '../../composables/chip-limits'
import type { MonoDropdownController, MonoDropdownItem } from './mono-data-dropdown.js'
import type {
  DropdownTableSize,
  DropdownTableColor,
  DropdownTableVariant,
  DropdownTableValidationState,
  DropdownPanelOptions,
  DropdownTableCssClass,
  DropdownTableChipProps,
} from './dropdown-table-types.js'
import type {
  ChipBehaviour,
  ChipColor,
  ChipCssClass,
  ChipVariant,
} from '../chip/chip-types.js'
import { MonoFormControlCore } from '../form/form-control-core.js'
import { ChipStripController } from '../../composables/chip-strip'
import { caretIcon, chevronIcon, closeIcon } from '../../composables/field-icons'
import { applyProps, detachEventHandlers } from '../../composables/element-props'

/** Sentinel so an initial `model-value === our last emit` guard never matches by accident. */
const SYMBOL_INIT = Symbol('init')

/** Public surface added by the dropdown-table core mixin. */
export declare class MonoDropdownTableCoreInterface {
  dataDropdown?: MonoDropdownController
  size: DropdownTableSize
  color: DropdownTableColor
  variant: DropdownTableVariant
  label: string
  placeholder: string
  helperText: string
  validationState: DropdownTableValidationState
  validationMessage: string
  errorMessage: string
  successMessage: string
  required: boolean
  disabled: boolean
  readonly: boolean
  clearable: boolean
  multiple: boolean
  max?: number
  min?: number
  maxVisible?: number
  minVisible?: number
  chip: DropdownTableChipProps
  modelValue: unknown
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  dropdown?: DropdownPanelOptions
  placement: DropdownPlacement
  flip: boolean
  shift: boolean
  offset: number
  cssClass: DropdownTableCssClass
  cssClassName: string
  stayOpen: boolean
  /** The popup controller — the light build reads `panelRoot` for slot placement. */
  protected _popup: PopupPortalController
  /** Render a panel region — light: a `data-mono-slot` capture target; shadow: native `<slot>`. */
  protected _renderRegion(cls: string, name: string): TemplateResult
  readonly isOpen: boolean
  open(): void
  close(): void
  toggle(): void
}

/**
 * `MonoDropdownTableCore` — the field + popup shell for `<mono-dropdown-table>`. The
 * FIELD mirrors `<mono-select>` (same size/color/variant/validation/label props and
 * an identical look); the selection/value/display magic lives in the bound
 * {@link MonoDropdownController} (`monoDataDropdown`). The consumer's native `<table>`
 * + `mono-table-*` are slotted into the body-portaled panel; row clicks delegate to
 * `dd.toggleRow`. The panel is sized independently of the field via the `dropdown`
 * object (`matchWidth` is intentionally off). Reuses `PopupPortalController`,
 * `buildSizeStyle`, and the global `.mono-chip` classes.
 */
export const MonoDropdownTableCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoDropdownTableCoreClass extends MonoFormControlCore(superClass) {
    /**
     * Automatic skeleton (`pending`, composables/mono-skeleton.ts): DATA-driven — pending
     * until the dropdown's grid has finished its first load.
     */
    static monoPendingAuto = 'data' as const

    protected _monoPendingReady(): boolean {
      const grid = this._dd?.grid
      if (!grid) return monoPendingGrace(this)
      if (grid.hasLoaded || grid.error) return true
      return monoPendingGrace(this) && !grid.loading
    }

    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'dataDropdown',
        'modelValue',
        'cssClass',
        'autoFocusSearch',
        'stayOpen',
        'maxVisible',
        'minVisible',
      ])
      // Renamed controller binding — `:control-data-dropdown` /
      // `:controlDataDropdown` alias the canonical `dataDropdown`.
      defineHybridPropAlias(this, 'controlDataDropdown', 'dataDropdown')

      // Make `:css-class`, `:cssclass` and `:cssClass` (object or JSON string) all
      // reach `_setCssClass`, exactly like <mono-select>.
      for (const alias of ['css-class', 'cssclass']) {
        Object.defineProperty(this, alias, {
          get: () => this.cssClass,
          set: (value: unknown) => this._setCssClass(value),
          configurable: true,
          enumerable: false,
        })
      }
    }

    /** Normalize an object | JSON string | plain-string `css-class` value. */
    private _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }
      if (typeof value === 'object') {
        this.cssClass = value as DropdownTableCssClass
        return
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
          this.cssClass = {}
          this.cssClassName = ''
          return
        }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            this.cssClass = JSON.parse(trimmed) as DropdownTableCssClass
            return
          } catch {
            /* fall through to treat as a single root class */
          }
        }
        this.cssClassName = trimmed
      }
    }

    /** Append the consumer's per-part override to a built-in class. */
    private _cls(base: string, key: keyof DropdownTableCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    /**
     * `chip` is an object prop, so the real binding is `:chip.prop="{…}"`. This
     * covers the two ways a *string* can arrive: a hand-written JSON attribute
     * (`chip='{"size":"md"}'`, incl. DSD/SSR), and Vue's `String(value)` mirror
     * of a plain `:chip="{…}"` binding — which yields `"[object Object]"` and
     * must be ignored, or it would wipe the property set moments later.
     */
    private _setChip(value: unknown): void {
      if (value == null) {
        this.chip = {}
        return
      }

      if (typeof value === 'object') {
        this.chip = value as DropdownTableChipProps
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
        this.chip = JSON.parse(trimmed) as DropdownTableChipProps
      } catch {
        // Not JSON (e.g. a stringified object) — keep whatever the property holds.
      }
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [...base, 'css-class', 'cssclass', 'chip']
    }

    override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
      super.attributeChangedCallback(name, old, value)
      if (name === 'css-class' || name === 'cssclass') this._setCssClass(value)
      if (name === 'chip') this._setChip(value)
    }

    /** The dropdown controller (bind with `.prop`: `:data-dropdown.prop="dd"`). */
    @property({ attribute: false })
    dataDropdown?: MonoDropdownController

    // --- field presentation (mirrors mono-select) ---------------------------
    @property({ type: String })
    size: DropdownTableSize = 'md'

    @property({ type: String })
    color: DropdownTableColor = 'primary'

    @property({ type: String })
    variant: DropdownTableVariant = 'outlined'

    @property({ type: String })
    label = ''

    @property({ type: String })
    placeholder = 'Select…'

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    @property({ type: String, attribute: 'validation-state' })
    validationState: DropdownTableValidationState = 'default'

    @property({ type: String, attribute: 'validation-message' })
    validationMessage = ''

    @property({ type: String, attribute: 'error-message' })
    errorMessage = ''

    @property({ type: String, attribute: 'success-message' })
    successMessage = ''

    @property({ reflect: true, converter: booleanStringConverter })
    required = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    readonly = false

    @property({ reflect: true, converter: booleanStringConverter })
    clearable = false

    @property({ reflect: true, converter: booleanStringConverter })
    multiple = false

    /**
     * Most rows the user can select (multi); unset = unlimited. Pushed into the
     * controller, whose check store enforces it for every gesture — see
     * `_pushLimits`. `chip.max` pins over it.
     */
    @property({ converter: optionalNumberConverter })
    max?: number

    /** Fewest rows the user can leave selected (multi); unset = 0. `chip.min` pins. */
    @property({ converter: optionalNumberConverter })
    min?: number

    /**
     * Chips drawn before the rest collapse into "+N more" (multi). Default 5,
     * `0` = all. Applies inline too — the "+N more" chip then sits in the strip.
     */
    @property({ attribute: 'max-visible', converter: optionalNumberConverter })
    maxVisible?: number = 5

    /** Collapse floor: draw every chip while the selection is at or under it. */
    @property({ attribute: 'min-visible', converter: optionalNumberConverter })
    minVisible?: number

    /**
     * Chip configuration — `mono-chip` props plus `behaviour`. The same object
     * `<mono-tag-input>` takes. Bind with `.prop`.
     */
    @property({ attribute: false })
    chip: DropdownTableChipProps = {}

    /** v-model surface (`:model-value` / `:modelValue`). Scalar single | array multi. */
    @property({ attribute: 'model-value' })
    modelValue: unknown = undefined

    // --- field sizing (css-size, like select) -------------------------------
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

    /** Sizes the popup PANEL only (independent of the field). Bind with `.prop`. */
    @property({ attribute: false })
    dropdown?: DropdownPanelOptions

    // --- panel placement (mirrors <mono-dropdown>) ---------------------------
    /** Preferred side + cross-axis alignment of the panel. */
    @property({ type: String })
    placement: DropdownPlacement = 'bottom-start'

    /** Open on the opposite side when the preferred one lacks room. */
    @property({ converter: booleanStringConverter })
    flip = true

    /** Slide along the cross axis to stay inside the viewport. */
    @property({ converter: booleanStringConverter })
    shift = true

    /** Gap between the field and the panel, in px. */
    @property({ converter: numberStringConverter })
    offset = 6

    /**
     * Focus the panel's search box (`<mono-table-search slot="search">`) when the
     * panel opens, so the user can type immediately. Set `false` to keep focus on
     * the trigger — e.g. on touch, where it would raise the virtual keyboard.
     */
    @property({ attribute: 'auto-focus-search', converter: booleanStringConverter })
    autoFocusSearch = true

    /**
     * Exempt this dropdown from every automatic close — clicking or focusing
     * anything outside it, which includes opening another one. It is **not** a
     * lock: its own trigger, Escape and picking a row still close it.
     */
    @property({ attribute: 'stay-open', reflect: true, converter: booleanStringConverter })
    stayOpen = false

    /** Per-part class overrides (object). Set via `cssClass` / `css-class`. */
    @property({ attribute: false })
    cssClass: DropdownTableCssClass = {}

    /** A single class added to the root (the string form of `css-class`). */
    @property({ attribute: false })
    cssClassName = ''

    private _moreOpen = false

    /**
     * The side the panel actually opened on, reflected on the root as
     * `is-top` / `is-bottom` (the body portal mirrors the root's class list).
     *
     * Deliberately NOT `@state()`: it is resolved during `hostUpdated` /
     * `updated()`, so making it reactive would schedule a second render every
     * time the side changes and trip Lit's `change-in-update` warning. The class
     * is applied imperatively instead; `render()` reads the same field, so a
     * natural re-render stays consistent.
     */
    protected _resolvedSide: PopupSide = 'bottom'

    /** Imperatively sync the `is-<side>` class — see `_resolvedSide`. */
    private _applySideClass(): void {
      const root = this.renderRoot.querySelector('.mono-dropdown-table')
      if (!root) return
      root.classList.toggle('is-top', this._resolvedSide === 'top')
      root.classList.toggle('is-bottom', this._resolvedSide === 'bottom')
      root.classList.toggle('is-left', this._resolvedSide === 'left')
      root.classList.toggle('is-right', this._resolvedSide === 'right')
      // The attribute spelling of the same state (what `render()` writes), so it
      // never lags the class between renders.
      if (root.getAttribute('mono-side') !== this._resolvedSide) root.setAttribute('mono-side', this._resolvedSide)
    }

    protected _off?: () => void
    private _panelObserver?: MutationObserver
    private _lastEmitted: unknown = SYMBOL_INIT
    private _dropdownWired?: MonoDropdownController

    /**
     * Measures and scrolls the one-line chip strip in `chip.behaviour: 'inline'`.
     * The strip is `overflow-x: hidden`, so this controller's `page()` — driven
     * by the `‹` / `›` buttons — is the ONLY thing that can move it.
     */
    protected _chipStrip = new ChipStripController(this, {
      strip: () =>
        this.renderRoot?.querySelector('.mono-dropdown-table-chip-strip') as HTMLElement | null,
      // Gated so a default `flex` field pays nothing per render — no query, no
      // layout read. Everything below the gate is inline-only.
      enabled: () => this._inlineChips,
    })

    protected _popup = new PopupPortalController(this, {
      getPanel: () =>
        this.renderRoot.querySelector('.mono-dropdown-table-panel') as HTMLElement | null,
      getAnchor: () =>
        this.renderRoot.querySelector('.mono-dropdown-table-trigger') as HTMLElement | null,
      getStyleScope: () =>
        this.renderRoot.querySelector('.mono-dropdown-table') as HTMLElement | null,
      isOpen: () => this._isOpen,
      // Panel size is controlled by the `dropdown` prop, NOT the field width.
      matchWidth: false,
      ...this._placementOpts(),
      onSideResolved: (side) => {
        this._resolvedSide = side
        this._applySideClass()
      },
    })

    /**
     * The "+N more" panel is a floating layer of its own — a second controller
     * on the same host, anchored to the chip that opened it. It used to be a
     * plain `position: absolute` child of the control, which any ancestor with
     * `overflow: hidden`, a transform or its own stacking context (a card, a
     * table cell, a modal body) clipped. Portaled it flips, shifts and shrinks
     * at the viewport edge like the panel, and ranks in the shared popup stack.
     */
    protected _morePopup = new PopupPortalController(this, {
      getPanel: () =>
        this.renderRoot.querySelector('.mono-dropdown-table-more') as HTMLElement | null,
      getAnchor: () =>
        this.renderRoot.querySelector('.mono-dropdown-table-more-chip') as HTMLElement | null,
      getStyleScope: () =>
        this.renderRoot.querySelector('.mono-dropdown-table') as HTMLElement | null,
      isOpen: () => this._moreOpen,
      matchWidth: false,
      ...this._morePlacementOpts(),
    })

    /** Shared by the light path (the controller) and the shadow path (`_positionMorePanel`). */
    private _morePlacementOpts() {
      return {
        side: () => 'bottom' as PopupSide,
        align: () => 'start' as const,
        offset: () => 4,
        flip: () => true,
        shift: () => true,
        constrainSize: () => true,
      }
    }

    /**
     * Placement options shared by the light path (the controller) and the shadow
     * path (`_positionPanel`), so both run the identical algorithm.
     *
     * `constrainSize` is on: a field low in a dense grid can have less room than
     * the panel wants on BOTH sides, so flipping alone isn't enough — the panel
     * also has to shrink and scroll internally (see dropdown-table.css).
     */
    private _placementOpts() {
      return {
        side: () => this._sideFromPlacement(this.placement),
        align: () => this._alignFromPlacement(this.placement),
        offset: () => this.offset,
        flip: () => this.flip,
        shift: () => this.shift,
        constrainSize: () => true,
      }
    }

    private _sideFromPlacement(p: DropdownPlacement): PopupSide {
      if (p.startsWith('top')) return 'top'
      if (p.startsWith('left')) return 'left'
      if (p.startsWith('right')) return 'right'
      return 'bottom'
    }

    private _alignFromPlacement(p: DropdownPlacement): PopupAlign {
      if (p.endsWith('-start')) return 'start'
      if (p.endsWith('-end')) return 'end'
      return 'center'
    }

    private get _dd(): MonoDropdownController | undefined {
      return this.dataDropdown
    }
    private get _isOpen(): boolean {
      return !!this._dd?.open
    }
    private get _multi(): boolean {
      return this.multiple || !!this._dd?.multiple
    }
    private get _hasValue(): boolean {
      const v = this._dd?.value
      return this._multi ? Array.isArray(v) && v.length > 0 : v != null
    }

    /** Resolve the effective validation state (message props force it). */
    private get _validationState(): DropdownTableValidationState {
      if (this.validationState && this.validationState !== 'default') return this.validationState
      if (this.errorMessage) return 'invalid'
      if (this.successMessage) return 'valid'
      return 'default'
    }

    private get _wrapperClasses(): string {
      const v = this._validationState
      return [
        'mono-dropdown-table',
        this.size,
        this.color,
        this.variant,
        `is-${this._resolvedSide}`,
        this._isOpen ? 'open' : '',
        // Mirrored onto the more panel's portal, which is what shows the panel.
        this._moreOpen ? 'more-open' : '',
        this.disabled ? 'disabled' : '',
        this.readonly ? 'readonly' : '',
        v !== 'default' ? `is-${v}` : '',
        this._hasValue ? 'has-value' : '',
        this._multi ? 'multiple' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    private get _triggerClasses(): string {
      return [
        'mono-dropdown-table-trigger',
        this.size,
        this.color,
        this.variant,
        this.disabled ? 'disabled' : '',
        this.readonly ? 'readonly' : '',
        this.cssClass?.trigger,
      ]
        .filter(Boolean)
        .join(' ')
    }

    override connectedCallback(): void {
      super.connectedCallback()
      this._subscribe()
      // Re-wire the controller callback. `disconnectedCallback` nulls
      // `onValueChange` unconditionally, but `_wireDropdown()` otherwise only runs
      // from `willUpdate` when the `dataDropdown` IDENTITY changes — which a
      // reconnect (a `v-if` toggle, `<KeepAlive>`, or Vue moving the node) does not
      // do. Without this the panel still opens and rows still highlight after one
      // toggle, but nothing writes `modelValue` or emits `mno-change` ever again, so
      // the consumer's v-model silently stops tracking. Same shape as the `mono-date`
      // reconnect bug; `_wireDropdown()` is idempotent, so calling it here is safe.
      this._wireDropdown()
      if (!isServer) {
        document.addEventListener('pointerdown', this._onDocPointer, true)
        document.addEventListener('keydown', this._onDocKey, true)
        // Shadow build only — the light build's panel is repositioned by the
        // popup controller, which registers its own scroll/resize listeners.
        if (this._isShadowHost) {
          window.addEventListener('scroll', this._onViewportChange, true)
          window.addEventListener('resize', this._onViewportChange)
        }
      }
    }

    override disconnectedCallback(): void {
      this._off?.()
      this._off = undefined
      this._panelObserver?.disconnect()
      this._panelObserver = undefined
      if (this._dropdownWired) this._dropdownWired.onValueChange = null
      if (!isServer) {
        document.removeEventListener('pointerdown', this._onDocPointer, true)
        document.removeEventListener('keydown', this._onDocKey, true)
        window.removeEventListener('scroll', this._onViewportChange, true)
        window.removeEventListener('resize', this._onViewportChange)
      }
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      if (changed.has('dataDropdown')) {
        this._subscribe()
        this._wireDropdown()
      }
      if (changed.has('modelValue')) this._pushModelToDd()
      if (
        changed.has('dataDropdown') ||
        changed.has('max') ||
        changed.has('min') ||
        changed.has('chip')
      ) {
        this._pushLimits()
      }
      // Chain, or mixins composed below this one lose their `willUpdate`.
      // @ts-ignore — the generic mixin base may not declare it, LitElement does.
      super.willUpdate?.(changed)
    }

    /**
     * Second entry point for the props apply. `MonoFormControlCore` (composed
     * below this core) also overrides `update`, so chain `super`.
     */
    protected override update(changed: Map<string, unknown>): void {
      this._scheduleApplyDropdownProps()
      super.update(changed)
    }

    private _subscribe(): void {
      this._off?.()
      detachEventHandlers(this)
      this._off = this._dd?.subscribe(() => {
        this._scheduleApplyDropdownProps()
        this.requestUpdate()
      })
      this._scheduleApplyDropdownProps()
    }

    private _ddPropsQueued = false

    /**
     * Deferred + de-duplicated, and driven from `update()` as well as
     * `_subscribe()` — the same belt-and-braces the table base needed once two
     * cores were found replacing `_subscribe` without chaining `super`. The
     * deferral keeps the reactive writes out of the update cycle, so they can't
     * trip Lit's change-in-update warning.
     */
    private _scheduleApplyDropdownProps(): void {
      if (this._ddPropsQueued) return
      if (typeof queueMicrotask !== 'function') {
        this._applyDropdownProps()
        return
      }
      this._ddPropsQueued = true
      queueMicrotask(() => {
        this._ddPropsQueued = false
        this._applyDropdownProps()
      })
    }

    /**
     * Pull `monoDataDropdown({ props: { dropdownTable } })` onto this element, so
     * the field needs nothing but `:data-dropdown.prop`. The CONTROLLER WINS for
     * keys it declares; the rest stay with the template.
     */
    private _applyDropdownProps(): void {
      const dd = this._dd
      if (!dd?.props) return
      applyProps(this, dd.props().dropdownTable)
    }

    private _wireDropdown(): void {
      const dd = this._dd
      if (this._dropdownWired && this._dropdownWired !== dd) {
        this._dropdownWired.onValueChange = null
      }
      this._dropdownWired = dd
      if (!dd) return
      dd.onValueChange = (v) => {
        this._lastEmitted = v
        this.modelValue = v
        this._emitChange(v)
      }
      this._pushModelToDd()
    }

    /**
     * The selection limits the element asks for: `chip.max` / `chip.min` pin,
     * `max` / `min` are the fallback, and `undefined` leaves the controller's own
     * option in force. They are ENFORCED by the controller's check store (the one
     * place a row click, the keyboard, a `<mono-table-checkbox>` and the
     * select-all drain all go through), so the element only forwards them.
     */
    private _pushLimits(): void {
      const chip = this._chipProps
      this._dd?.setLimits({
        max: resolveChipLimit(chip, 'max', this.max),
        min: resolveChipLimit(chip, 'min', this.min),
      })
    }

    /** Push an external `model-value` into the controller (guarding our own echo). */
    private _pushModelToDd(): void {
      const dd = this._dd
      if (!dd || this.modelValue === undefined) return
      if (this._sameValue(this.modelValue, this._lastEmitted)) return
      if (this._sameValue(this.modelValue, dd.value)) return
      dd.setValue(this.modelValue)
    }

    private _sameValue(a: unknown, b: unknown): boolean {
      if (a === b) return true
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((x, i) => String(x) === String(b[i]))
      }
      return String(a) === String(b)
    }

    private _emitChange(value: unknown): void {
      const detail = {
        modelValue: value,
        value,
        selectedItems: this._dd?.selectedItems() ?? [],
      }
      dispatchMonoEvent(this, 'change', detail)
    }

    // --- public open/close ---------------------------------------------------
    /** Whether the panel is currently open. */
    get isOpen(): boolean {
      return this._isOpen
    }
    open(): void {
      if (this.disabled || this.readonly) return
      this._dd?.setOpen(true)
    }
    close(): void {
      this._moreOpen = false
      this._dd?.setOpen(false)
      this.requestUpdate()
    }
    toggle(): void {
      if (this.disabled || this.readonly) return
      this._moreOpen = false
      this._dd?.setOpen(!this._isOpen)
    }

    /**
     * The trigger's keyboard — the openers a combobox is expected to have:
     * Enter, Space and ↓ open, Escape closes. (Before, a focused trigger opened
     * on nothing.)
     */
    private _onTriggerKeydown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        this.open()
      } else if (e.key === 'Escape' && this._isOpen) {
        e.preventDefault()
        this.close()
      }
    }

    // "Inside" is the host, the panel, or any popup opened from within the
    // panel — a `<mono-table-th>`'s header filter or right-click menu, a
    // `<mono-select>` in the search slot. Those live in portals of their own on
    // `<body>`, so the DOM alone would call them outside (`containsInPath`
    // resolves them by ownership).
    private _onDocPointer = (e: Event): void => {
      if (this.stayOpen) return
      if (!this._isOpen && !this._moreOpen) return
      const path = (e as PointerEvent).composedPath()
      if (path.includes(this)) return
      if (this._popup.containsInPath(path)) return
      if (this._morePopup.containsInPath(path)) return
      this.close()
    }
    // An Escape pressed inside a nested popup belongs to that popup — it closes
    // itself on the same capture-phase listener — and the panel it came from
    // stays. Only an Escape from the panel or the trigger closes this.
    private _onDocKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      if (!this._isOpen && !this._moreOpen) return
      if (this._popup.ownsNestedInPath(e.composedPath())) return
      this.close()
    }

    // --- row selection: delegate clicks + reflect selection ------------------
    /**
     * Where the `[data-row-key]` rows live: light = the captured table inside the
     * (portaled) panel; shadow = the SLOTTED table (host's light-DOM children).
     */
    private get _rowScope(): ParentNode {
      return (this.renderRoot as unknown) === this ? (this._popup.panelRoot as ParentNode) : this
    }

    private _onPanelClick = (e: Event): void => {
      if (this.disabled || this.readonly) return
      const path = e.composedPath()
      // A control that owns its own selection has already done the toggling — a
      // row checkbox would otherwise fire twice and net to nothing, which is why
      // an indicator-only checkbox has to be `pointer-events: none`. Let a real
      // one through instead of racing it.
      const handled = path.some((n) =>
        (n as Element)?.matches?.(
          // The checkbox elements, plus `.mono-checkbox` for raw class markup that
          // has no custom element around it. NOT a bare `label` — the elements
          // above already cover their own inner one, and a plain <label> in a cell
          // would then silently stop selecting the row.
          'mono-table-checkbox, mono-shadow-table-checkbox, mono-checkbox,'
            + ' mono-shadow-checkbox, .mono-checkbox, input, button, a, select, textarea',
        ),
      )
      if (handled) return
      // composedPath so a click on the SLOTTED table (shadow) still resolves the row.
      const row = path.find((n) => (n as Element)?.matches?.('[data-row-key]')) as
        | HTMLElement
        | undefined
      if (!row) return
      const key = row.getAttribute('data-row-key')
      if (key == null) return
      // Clicking also moves the highlight, so a following ↑/↓ continues from the
      // row the user just touched rather than from wherever the keyboard was.
      this._activeRowKey = key
      this._focusZone = 'list'
      this._dd?.toggleRow(key)
      this._reflectSelection()
    }

    protected _reflectSelection(): void {
      const dd = this._dd
      const root = this._rowScope
      if (!dd || !root?.querySelectorAll) return
      const rows = Array.from(root.querySelectorAll('[data-row-key]'))
      // Searching / paging swaps the rows out from under the highlight; drop it
      // onto the new first row rather than leaving nothing highlighted.
      //
      // `_activeRowKey != null` covers the cursor seeded from the selection on
      // open, which is painted while focus is still in the search box: without it
      // a selected row living on a page the user hasn't scrolled to would leave no
      // cursor at all instead of falling back to the first row. With nothing
      // selected the key stays null and the search zone still shows no cursor,
      // exactly as before.
      if (
        (this._focusZone === 'list' || this._activeRowKey != null) &&
        rows.length &&
        !rows.some((el) => el.getAttribute('data-row-key') === this._activeRowKey)
      ) {
        this._activeRowKey = rows[0].getAttribute('data-row-key')
      }
      rows.forEach((el) => {
        const key = el.getAttribute('data-row-key')
        const on = key != null && dd.isSelected(key)
        const active = key != null && key === this._activeRowKey
        el.classList.toggle('mono-dd-row-selected', on)
        el.classList.toggle('mono-dd-row-active', active)
        // A picked row is the TABLE's selected row — the same attribute
        // <mono-table-checkbox> sets — so table.css paints it (wash + rail) and
        // a flavour that retunes the table retunes the picker. The keyboard
        // cursor is the picker's own.
        el.toggleAttribute('mono-selected', on)
        el.toggleAttribute('mono-dd-selected', on)
        el.toggleAttribute('mono-dd-active', active)
        if (on) el.setAttribute('aria-selected', 'true')
        else el.removeAttribute('aria-selected')
      })
    }

    /** Re-reflect after the consumer's Vue re-renders rows (paging/search). */
    private _observePanel(): void {
      const root = this._rowScope as Node | null
      if (!root || this._panelObserver) return
      this._panelObserver = new MutationObserver(() => this._reflectSelection())
      this._panelObserver.observe(root, { childList: true, subtree: true })
    }

    /** True for the shadow build — a shadow host keeps its panel in the shadow root. */
    private get _isShadowHost(): boolean {
      return (this.renderRoot as unknown) !== this
    }

    /**
     * Position the panel for the SHADOW build (renderRoot ≠ this): the popup
     * controller only portals/positions LIGHT hosts (`_canPortal`), so a shadow
     * host places its own `position:fixed` panel. It runs the SAME shared math as
     * the light path — flip, shift and size-constrain included. Light is untouched.
     */
    private _positionPanel(): void {
      if (isServer || !this._isShadowHost) return
      if (!this._isOpen) return
      const root = this.renderRoot as ParentNode
      const panel = root.querySelector('.mono-dropdown-table-panel') as HTMLElement | null
      const anchor = root.querySelector('.mono-dropdown-table-trigger') as HTMLElement | null
      if (!panel || !anchor) return

      const o = this._placementOpts()
      const placement = computePopupPlacement(anchor, panel, {
        side: o.side(),
        align: o.align(),
        offset: o.offset(),
        flip: o.flip(),
        shift: o.shift(),
        constrain: true,
      })
      applyPopupPlacement(panel, placement, true)
      this._resolvedSide = placement.side
      this._applySideClass()
    }

    /** The shadow build's in-place placement of the "+N more" panel — see `_positionPanel`. */
    private _positionMorePanel(): void {
      if (isServer || !this._isShadowHost) return
      if (!this._moreOpen) return
      const root = this.renderRoot as ParentNode
      const panel = root.querySelector('.mono-dropdown-table-more') as HTMLElement | null
      const anchor = root.querySelector('.mono-dropdown-table-more-chip') as HTMLElement | null
      if (!panel || !anchor) return

      const o = this._morePlacementOpts()
      const placement = computePopupPlacement(anchor, panel, {
        side: o.side(),
        align: o.align(),
        offset: o.offset(),
        flip: o.flip(),
        shift: o.shift(),
        constrain: true,
      })
      applyPopupPlacement(panel, placement, true)
    }

    /**
     * Keep the shadow panel glued to its trigger while the page (or any nested
     * scroller — hence capture phase) moves. The light build gets this from the
     * popup controller's own listeners; a shadow host has none.
     */
    private _onViewportChange = (): void => {
      if (this._isOpen) this._positionPanel()
      if (this._moreOpen) this._positionMorePanel()
    }

    protected override updated(changed: Map<string, unknown>): void {
      super.updated(changed)
      if (isServer) return
      if (this._isOpen) {
        this._observePanel()
        this._reflectSelection()
        this._positionPanel()
      } else {
        this._panelObserver?.disconnect()
        this._panelObserver = undefined
      }
      if (this._moreOpen) {
        // Removing the last collapsed chip from inside the panel leaves nothing to show.
        if (!this._overflowItems(this._dd?.selectedItems() ?? []).length) {
          this._moreOpen = false
          this.requestUpdate()
        } else {
          this._positionMorePanel()
        }
      }

      // A new chip lands at the END of the inline strip, i.e. off-screen once the
      // strip has overflowed — reveal it, so ticking a row always shows what was
      // picked. Selection lives on the CONTROLLER, so like `_isOpen` below it
      // never appears in `changed`; track the count edge instead.
      //
      // Gated on the panel being OPEN, which is what separates a user ticking a
      // row from a preset `modelValue` being applied during setup. Without it a
      // field that starts with a value would render already scrolled to its last
      // chip, showing the end of a list nobody has touched. Growth-only, so
      // removing a chip leaves the view where the user was reading.
      const selectedCount = this._dd?.selectedItems?.()?.length ?? 0
      // The visible cap re-draws the strip without the count moving (a
      // `max-visible` change, or `chip` swapping it), so those re-measure too.
      const capChanged =
        changed.has('maxVisible') || changed.has('minVisible') || changed.has('chip')
      if (selectedCount !== this._lastSelectedCount) {
        if (this._isOpen && selectedCount > this._lastSelectedCount && this._inlineChips) {
          this._chipStrip.scrollToEnd()
        } else {
          // The chip set changed some other way (a removal, or a preset value
          // arriving) — re-measure, but only then. Measuring on every update
          // forces a layout, and this method also runs on every reposition.
          this._chipStrip.invalidate()
        }
      } else if (capChanged) {
        this._chipStrip.invalidate()
      }
      this._lastSelectedCount = selectedCount

      // Open state lives on the CONTROLLER (a `notify()` → `requestUpdate()`), so it
      // never appears in `changed` — track the edge ourselves. Edge-only on purpose:
      // re-focusing on every update would fight the user while typing or paging.
      if (this._isOpen !== this._wasOpen) {
        this._wasOpen = this._isOpen
        if (this._isOpen) {
          void this._initPanelFocus()
        } else {
          this._activeRowKey = null
          this._focusZone = 'search'
          this._panelTabHeld = false
          this._restoreTriggerFocus()
        }
      }
    }

    // --- focus management ----------------------------------------------------
    private _wasOpen = false
    /** Selected-row count at the last render, to spot an ADD (see `updated`). */
    private _lastSelectedCount = 0
    /** Set while the panel holds focus, so closing knows to hand it back. */
    private _searchFocused = false

    /** The focusable trigger (`tabindex=0`), in both builds. */
    private _triggerElement(): HTMLElement | null {
      return this.renderRoot.querySelector('.mono-dropdown-table-trigger') as HTMLElement | null
    }

    /**
     * Delegate focus to the trigger — the host itself isn't focusable. Needed by
     * anything that focuses the component from outside, e.g. the data grid
     * focusing the editor in a clicked cell (`focusRowCell`), which looks for an
     * inner `input/textarea/select/button` and otherwise falls back to calling
     * `focus()` on the element itself.
     */
    public override focus(options?: FocusOptions): void {
      this._triggerElement()?.focus(options)
    }

    public override blur(): void {
      this._triggerElement()?.blur()
    }

    /** The search region's slotted content — light: captured nodes; shadow: `<slot>`. */
    private _searchRegionElements(): Element[] {
      if (this._isShadowHost) {
        const slot = this.renderRoot.querySelector(
          'slot[name="search"]',
        ) as HTMLSlotElement | null
        return slot ? (slot.assignedElements({ flatten: true }) as Element[]) : []
      }
      // Light: the panel (and the captured search node with it) may live in the body portal.
      const sel = '[data-mono-slot="search"]'
      const region =
        (this.querySelector(sel) as HTMLElement | null) ??
        ((this._popup.panelRoot as ParentNode | null)?.querySelector?.(sel) as HTMLElement | null)
      return region ? Array.from(region.children) : []
    }

    /**
     * Focus the panel's search box once the panel is rendered, placed and (light
     * build) portaled. Deferred a microtask so a slotted element that hasn't
     * rendered its input yet gets a chance to — `updateComplete` on the search
     * element itself, since it updates independently of this host.
     */
    /**
     * The element to focus for "the search box", or null when the panel has no
     * search region. `mono-table-search` / `mono-shadow-table-search` expose
     * `focus()` and delegate to their own input, so neither build needs a DOM
     * reach-in; anything else slotted in its place falls back to its first field.
     */
    private _searchEl(): HTMLElement | null {
      for (const el of this._searchRegionElements()) {
        if (el.matches('mono-table-search, mono-shadow-table-search')) return el as HTMLElement
        const sel = 'input:not([type="hidden"]), textarea, select'
        const field = el.matches(sel)
          ? (el as HTMLElement)
          : ((el.querySelector(sel) ?? el.shadowRoot?.querySelector(sel)) as HTMLElement | null)
        if (field) return field
      }
      return null
    }

    private async _focusSearch(): Promise<void> {
      await this.updateComplete
      if (!this._isOpen) return
      const el = this._searchEl()
      if (!el) return
      // A slotted element may not have rendered its input yet.
      const pending = (el as Partial<LitElement>).updateComplete
      if (pending) await pending
      if (!this._isOpen) return
      el.focus({ preventScroll: true })
      this._focusZone = 'search'
      this._searchFocused = true
    }

    // --- list keyboard navigation ---------------------------------------------
    // The rows are consumer-authored `<tr data-row-key>`, so navigation is a
    // highlighted-key model (like `mono-select`'s `_activeIndex`) rather than
    // roving focus: the PANEL holds focus and paints `.mono-dd-row-active`.
    /** Which zone owns the keyboard — the search box, or the row list. */
    private _focusZone: 'search' | 'list' = 'search'
    private _activeRowKey: string | null = null
    private _panelTabHeld = false
    private _panelTabConsumed = false

    private _rowEls(): HTMLElement[] {
      const root = this._rowScope
      if (!root?.querySelectorAll) return []
      return Array.from(root.querySelectorAll('[data-row-key]')) as HTMLElement[]
    }

    private _panelEl(): HTMLElement | null {
      const root = (this._popup.panelRoot as ParentNode | null) ?? (this.renderRoot as ParentNode)
      return (root?.querySelector?.('.mono-dropdown-table-panel') as HTMLElement | null) ?? null
    }

    private _setActiveRow(key: string | null, reveal = false): void {
      this._activeRowKey = key
      this._reflectSelection()
      if (!reveal || key == null) return
      this._rowEls()
        .find((r) => r.getAttribute('data-row-key') === key)
        ?.scrollIntoView?.({ block: 'nearest' })
    }

    private _moveActiveRow(delta: 1 | -1): void {
      const keys = this._rowEls().map((r) => r.getAttribute('data-row-key') ?? '')
      if (!keys.length) return
      const i = this._activeRowKey == null ? -1 : keys.indexOf(this._activeRowKey)
      const next =
        i < 0 ? (delta > 0 ? 0 : keys.length - 1) : Math.min(Math.max(i + delta, 0), keys.length - 1)
      this._setActiveRow(keys[next], true)
    }

    /** Move the keyboard into the row list, highlighting the first row. */
    private _enterList(): void {
      this._focusZone = 'list'
      if (this._activeRowKey == null) {
        this._setActiveRow(this._rowEls()[0]?.getAttribute('data-row-key') ?? null, true)
      }
      // The panel carries `tabindex="-1"` so it can hold focus while the rows
      // themselves stay plain consumer markup.
      this._panelEl()?.focus({ preventScroll: true })
    }

    /** Move the keyboard back to the search box (no-op when there isn't one). */
    private _enterSearch(): void {
      const el = this._searchEl()
      if (!el) return
      this._focusZone = 'search'
      el.focus({ preventScroll: true })
    }

    private _selectActiveRow(): void {
      if (this._activeRowKey == null) return
      this._dd?.toggleRow(this._activeRowKey)
      this._reflectSelection()
    }

    /**
     * Keys inside the panel. The search box is a child of the panel, so its
     * keystrokes bubble here too — which is why every branch checks `_focusZone`
     * before acting, leaving the search field's own arrows/caret alone.
     *
     * Tab is swallowed on keydown (as in the data grid) so a following arrow
     * isn't preceded by a stray focus move: Tab+↓ enters the list, Tab+↑ returns
     * to the search, and a plain Tab tap toggles between the two on release.
     */
    protected _onPanelKeydown = (e: KeyboardEvent): void => {
      if (this.disabled || this.readonly || !this._isOpen) return

      if (e.key === 'Tab') {
        // With no search box there are no zones to move between — let Tab be.
        if (!this._searchEl()) return
        e.preventDefault()
        if (!e.repeat) {
          this._panelTabHeld = true
          this._panelTabConsumed = false
        }
        return
      }

      if (this._panelTabHeld && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        this._panelTabConsumed = true
        if (e.key === 'ArrowDown') this._enterList()
        else this._enterSearch()
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (this._focusZone !== 'list') return // the search field keeps its caret keys
        e.preventDefault()
        this._moveActiveRow(e.key === 'ArrowDown' ? 1 : -1)
        return
      }

      if (e.key === 'Enter' && this._focusZone === 'list') {
        e.preventDefault()
        this._selectActiveRow()
      }
    }

    protected _onPanelKeyup = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab' || !this._panelTabHeld) return
      this._panelTabHeld = false
      if (this._panelTabConsumed) return
      if (this._focusZone === 'search') this._enterList()
      else this._enterSearch()
    }

    /**
     * Where the keyboard starts when the panel opens: the search box if there is
     * one, otherwise straight into the list with the first row highlighted.
     */
    private async _initPanelFocus(): Promise<void> {
      await this.updateComplete
      if (!this._isOpen) return

      // Put the cursor on the row that is already selected — the LAST one picked
      // when multiple — so ↑/↓ carry on from there rather than restarting at the
      // top. Painted even while focus stays in the search box, so the mark is
      // visible before any key is pressed.
      //
      // `selectedItems()` is ordered (the controller appends on toggle) and its
      // keys may be numbers, while `data-row-key` is always a string — hence the
      // `String(...)`. Rows are consumer-authored and may not exist yet on this
      // pass; `_reflectSelection` runs again from `updated()` and the panel
      // observer, and re-homes to the first row if the key never shows up.
      const selected = this._dd?.selectedItems?.() ?? []
      if (selected.length) {
        this._setActiveRow(String(selected[selected.length - 1].key), true)
      }

      if (this._searchEl()) {
        // `autoFocusSearch: false` means "don't move focus on open" — honour it,
        // but still record which zone the keyboard belongs to.
        this._focusZone = 'search'
        if (this.autoFocusSearch) void this._focusSearch()
        return
      }
      this._enterList()
    }

    /**
     * Hand focus back to the trigger when a panel that HAD focus closes — hiding
     * the panel blurs its input to `<body>`, which would otherwise strand the
     * keyboard. Covers every close path (Escape, outside pointerdown, a
     * controller-driven auto-close after a single-select pick) because it hangs
     * off the state edge rather than off `close()`.
     */
    private _restoreTriggerFocus(): void {
      if (!this._searchFocused) return
      this._searchFocused = false

      // Don't steal focus from whatever the user just clicked/tabbed into. Hiding
      // the panel normally blurs to `<body>` first; the panel test covers the light
      // build, whose panel is portaled OUT of this element and so isn't `contains`ed.
      const active = document.activeElement
      const panel = (this._popup.panelRoot as ParentNode | null)?.querySelector?.(
        '.mono-dropdown-table-panel',
      ) as HTMLElement | null
      const hadFocus =
        !active || active === document.body || this.contains(active) || !!panel?.contains(active)
      if (!hadFocus) return

      this.focus({ preventScroll: true })
    }

    /** A panel region — light: a `data-mono-slot` capture target; shadow overrides with `<slot>`. */
    protected _renderRegion(cls: string, name: string): TemplateResult {
      return html`<div class="mono-dropdown-table-region ${cls}" mono-dd-region=${cls} data-mono-slot="${name}"></div>`
    }

    // --- render --------------------------------------------------------------
    // The caret and the two chevrons come from `composables/field-icons`, shared
    // with `<mono-tag-input>` so both fields' trailing rows are drawn from one
    // set of glyphs.
    private _caretIcon(): TemplateResult {
      return caretIcon()
    }

    private _chevronIcon(dir: -1 | 1): TemplateResult {
      return chevronIcon(dir)
    }

    /**
     * One scroll button. `active` false keeps the box — and therefore the row's
     * width — but hides it (`is-idle` → `visibility: hidden`), so reaching an end
     * of the strip costs no layout. `aria-hidden` keeps the hidden one out of
     * reach of assistive tech; `pointer-events: none` handles the pointer.
     */
    private _renderScrollButton(dir: -1 | 1, active: boolean): TemplateResult {
      const back = dir === -1
      const base = `mono-dropdown-table-scroll mono-dropdown-table-scroll-${
        back ? 'prev' : 'next'
      }${active ? '' : ' is-idle'}`
      return html`<span
        role="button"
        tabindex="-1"
        class=${this._cls(base, back ? 'scrollPrev' : 'scrollNext')}
        mono-dd-scroll=${back ? 'prev' : 'next'}
        ?mono-idle=${!active}
        aria-label=${back ? 'Scroll selection backward' : 'Scroll selection forward'}
        aria-hidden=${active ? 'false' : 'true'}
        @mousedown=${(e: MouseEvent) => e.preventDefault()}
        @click=${(e: Event) => {
          e.stopPropagation()
          this._chipStrip.page(dir)
        }}
        >${this._chevronIcon(dir)}</span
      >`
    }

    /** The `chip` prop, always an object (it can be assigned null from a binding). */
    private get _chipProps(): DropdownTableChipProps {
      return this.chip ?? {}
    }

    /** Chip layout: `inline` = one scrolling line, anything else = today's wrap. */
    private get _chipBehaviour(): ChipBehaviour {
      return this._chipProps.behaviour === 'inline' ? 'inline' : 'flex'
    }

    /** True where a scrolling strip actually renders: multi, inline, with chips. */
    private get _inlineChips(): boolean {
      return this._multi && this._hasValue && this._chipBehaviour === 'inline'
    }

    /**
     * How many chips to draw for `total` selected rows before the rest collapse
     * into "+N more" — Infinity when uncapped or under the collapse floor.
     * `chip.maxVisible` / `chip.minVisible` pin, the element props are the
     * fallback (`resolveChipLimit`). Applies to `inline` as well: the "+N more"
     * chip then sits in the strip after the visible ones and its panel lists the
     * rest, exactly as in `flex`.
     */
    private _visibleCap(total: number): number {
      const chip = this._chipProps
      return visibleChipCap(
        total,
        resolveChipLimit(chip, 'maxVisible', this.maxVisible),
        resolveChipLimit(chip, 'minVisible', this.minVisible),
      )
    }

    /** The selection floor in force (element / chip / controller), 0 when none. */
    private get _minSelected(): number {
      return this._dd?.limits().min ?? 0
    }

    /** A chip can be removed while the selection sits above its floor. */
    private get _canRemove(): boolean {
      const count = this._dd?.selectedItems?.()?.length ?? 0
      return count > this._minSelected
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
     * Classes shared by the selection chips and the "+N more" chip, in
     * `mono-chip`'s own order (`mono-chip <size> <variant>-<color> <shape>`), so
     * chip.css paints them exactly as it paints a real `<mono-chip>`.
     *
     * `mono-dropdown-table-chip` is a marker only — it scopes the `--mono-chip-*`
     * bridge in dropdown-table.css so the bridge never reaches a `<mono-chip>` a
     * consumer slots into the panel. `chip.color` deliberately picks a hue OTHER
     * than the control accent, so it adds the `-pinned` marker that switches the
     * bridge back off.
     */
    private get _chipBaseClasses(): string {
      const chip = this._chipProps

      // NOT `mono-chip`: a selection chip is Basecoat's combobox chip, painted by
      // dropdown-table.css on the [mono-dd-chip] attribute — chip.css never sees it.
      return [
        'mono-dropdown-table-chip',
        chip.color ? 'mono-dropdown-table-chip-pinned' : '',
        // A chip is a fixed-height box, so at the small steps it — not the text —
        // is what floors the field. A hard-coded `sm` chip (20px) does not fit
        // inside an `xs` control, so the default tracks the field's own size.
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
     * Class for one chip part. Both class APIs append: the field-level key
     * (`cssClass.chip` / `.chipLabel` / `.chipRemove`) and the chip-level one
     * (`chip.cssClass.*`, which additionally reaches the parts the field has no
     * key for — `main`, `content`, `dot`).
     */
    private _chipCls(
      base: string,
      chipKey: keyof ChipCssClass,
      key?: keyof DropdownTableCssClass,
    ): string {
      return [base, key ? this.cssClass?.[key] : undefined, this._chipProps.cssClass?.[chipKey]]
        .filter(Boolean)
        .join(' ')
    }

    private _renderChip(it: MonoDropdownItem): TemplateResult {
      const chip = this._chipProps
      // At the `min` floor the chips lose their ✕ — the store would reject the
      // removal anyway, so the button must not promise one.
      const removable = !this.disabled && !this.readonly && this._canRemove
      return html`
        <div
          class=${this._chipCls(
            `${this._chipBaseClasses}${removable ? ' removable' : ''}`,
            'root',
            'chip',
          )}
          mono-dd-chip
          ?mono-dd-removable=${removable}
          mono-dd-chip-color=${chip.color ?? nothing}
          mono-dd-chip-rounded=${chip.rounded ?? nothing}
        >
          <span class=${ifDefined(chip.cssClass?.main)} mono-dd-chip-main>
            <span class=${this._chipCls('chip-content', 'content')} mono-dd-chip-content>
              ${chip.dot
                ? html`<span class=${this._chipCls('chip-dot', 'dot')} mono-dd-chip-dot aria-hidden="true"></span>`
                : nothing}
              <span class=${this._chipCls('chip-label', 'label', 'chipLabel')} mono-dd-chip-label>${it.text}</span>
              ${removable
                ? html`<button
                    type="button"
                    class=${this._chipCls('chip-close', 'close', 'chipRemove')}
                    mono-dd-chip-close
                    aria-label=${chip.closeLabel ?? `Remove ${it.text}`}
                    @click=${(e: Event) => {
                      e.stopPropagation()
                      this._dd?.removeKey(it.key)
                    }}
                  >
                    ${closeIcon()}
                  </button>`
                : nothing}
            </span>
          </span>
        </div>
      `
    }

    /**
     * The chip region. `flex` returns the chips as bare children of the value
     * span, so they wrap — the historical markup, unchanged. `inline` nests them
     * in one `overflow-x: hidden` strip instead, which is what makes the row
     * scroll as a unit.
     */
    private _renderChipRegion(items: MonoDropdownItem[]): TemplateResult | TemplateResult[] {
      const chips = this._renderChips(items)
      if (this._chipBehaviour !== 'inline') return chips
      return html`
        <span class=${this._cls('mono-dropdown-table-chip-strip', 'chipStrip')} mono-dd-chip-strip>${chips}</span>
      `
    }

    private _renderChips(items: MonoDropdownItem[]): TemplateResult[] {
      const max = this._visibleCap(items.length)
      const visible = max === Infinity ? items : items.slice(0, max)
      const overflow = this._overflowItems(items)
      const chips = visible.map((it) => this._renderChip(it))
      if (overflow.length) {
        chips.push(html`
          <div
            class=${this._cls(
              // `has-dot` is dropped: the overflow chip is a counter, not a value.
              `${this._chipBaseClasses.replace(' has-dot', '')} clickable mono-dropdown-table-more-chip`,
              'moreChip',
            )}
            mono-dd-chip
            mono-dd-more
            mono-dd-chip-color=${this._chipProps.color ?? nothing}
            mono-dd-chip-rounded=${this._chipProps.rounded ?? nothing}
          >
            <span
              class=${ifDefined(this._chipProps.cssClass?.main)}
              mono-dd-chip-main
              role="button"
              tabindex="0"
              @mousedown=${(e: MouseEvent) => e.preventDefault()}
              @click=${(e: Event) => {
                e.stopPropagation()
                const next = !this._moreOpen
                this._dd?.setOpen(false)
                this._moreOpen = next
                this.requestUpdate()
              }}
            >
              <span class=${this._chipCls('chip-content', 'content')} mono-dd-chip-content
                ><span class=${this._chipCls('chip-label', 'label')} mono-dd-chip-label
                  >+${overflow.length} more</span
                ></span
              >
            </span>
          </div>
        `)
      }
      return chips
    }

    /** Selected rows past the visible cap — empty when uncapped or under the collapse floor. */
    private _overflowItems(items: MonoDropdownItem[]): MonoDropdownItem[] {
      const max = this._visibleCap(items.length)
      return max === Infinity ? [] : items.slice(max)
    }

    /**
     * Always rendered, shown by the root's `more-open` class: the panel lives in
     * a body portal while open and a portaled node cannot be removed by a
     * conditional render (Lit's ChildPart no longer contains it).
     */
    private _renderMore(items: MonoDropdownItem[]): TemplateResult {
      const overflow = this._moreOpen ? this._overflowItems(items) : []
      return html`<div class="mono-dropdown-table-more" mono-dd-more>${overflow.map((it) => this._renderChip(it))}</div>`
    }

    private _renderLabel(): TemplateResult | typeof nothing {
      if (!this.label) return nothing
      return html`<label class=${this._cls('mono-dropdown-table-label', 'label')} mono-dd-label
        >${this.label}${this.required
          ? html`<span class=${this._cls('mono-dropdown-table-required', 'required')} mono-dd-required-mark>*</span>`
          : nothing}</label
      >`
    }

    private _renderMessage(): TemplateResult | typeof nothing {
      const base = this._cls('mono-dropdown-table-message', 'message')
      if (this.validationMessage) {
        const state = this._validationState
        return html`<div class="${base} ${state}" mono-dd-message=${state} role=${state === 'invalid' ? 'alert' : nothing}>
          ${this.validationMessage}
        </div>`
      }
      if (this.errorMessage) {
        return html`<div class="${base} invalid" mono-dd-message="invalid" role="alert">${this.errorMessage}</div>`
      }
      if (this.successMessage) {
        return html`<div class="${base} valid" mono-dd-message="valid">${this.successMessage}</div>`
      }
      if (this.helperText) {
        return html`<div class="${base} helper" mono-dd-message="helper">${this.helperText}</div>`
      }
      return nothing
    }

    private _renderTrigger(items: MonoDropdownItem[]): TemplateResult {
      const dd = this._dd
      const hasValue = this._hasValue
      const inert = this.disabled || this.readonly
      // A selection floor hides the clear button: "clear" would stop at `min`
      // anyway, and a ✕ that leaves chips behind reads as broken.
      const canClear = this.clearable && hasValue && !inert && !(this._multi && this._minSelected > 0)
      // The scroll buttons only exist where there is a strip to scroll: multi
      // mode, inline behaviour, with something actually selected. They do NOT
      // consult `inert` — a disabled strip still pages so the chips can be read,
      // and the row must not change width when the state toggles.
      const inlineChips = this._inlineChips
      return html`
        <div
          class=${this._triggerClasses}
          mono-dd-trigger
          role="combobox"
          tabindex=${this.disabled ? -1 : 0}
          aria-expanded=${this._isOpen ? 'true' : 'false'}
          @click=${() => this.toggle()}
          @keydown=${this._onTriggerKeydown}
        >
          <span
            class="${this._cls('mono-dropdown-table-value', 'value')}${hasValue
              ? ''
              : ` mono-dropdown-table-placeholder${
                  this.cssClass?.placeholder ? ` ${this.cssClass.placeholder}` : ''
                }`}${inlineChips ? ' is-inline' : ''}"
            mono-dd-value
            ?mono-dd-placeholder=${!hasValue}
            ?mono-inline=${inlineChips}
          >
            ${this._multi
              ? hasValue
                ? this._renderChipRegion(items)
                : this.placeholder
              : hasValue
                ? html`<span>${dd?.displayText()}</span>`
                : this.placeholder}
          </span>
          <span class=${this._cls('mono-dropdown-table-actions', 'actions')} mono-dd-actions>
            ${
              // BOTH buttons render together, or neither — never one. They share
              // the trigger's flex row with the strip, so one appearing or
              // vanishing resizes the strip by its own width plus the row gap
              // (~27px here). The strip absorbs all of it, `scrollLeft` ends up
              // past the new maximum, the browser re-clamps, and the chips lurch
              // sideways. Paging never changes WHETHER the strip overflows, only
              // where in it you are, so gating both on `overflowing` pins the row
              // width for the whole interaction.
              inlineChips && this._chipStrip.overflowing
                ? html`${this._renderScrollButton(-1, this._chipStrip.canScrollStart)}
                    ${this._renderScrollButton(1, this._chipStrip.canScrollEnd)}`
                : nothing
            }
            ${
              // The field body toggles (there is no inline input here — the
              // search box lives in the panel — so a click is never "I want to
              // type"), and the caret toggles too, stopping the click so the
              // trigger does not toggle it back.
              canClear
                ? html`<span
                    role="button"
                    tabindex="-1"
                    class=${this._cls('mono-dropdown-table-clear', 'clear')}
                    mono-dd-clear
                    aria-label="Clear"
                    @mousedown=${(e: MouseEvent) => e.preventDefault()}
                    @click=${(e: Event) => {
                      e.stopPropagation()
                      this._dd?.clear()
                      this.close()
                    }}
                    >${closeIcon()}</span
                  >`
                : nothing
            }
            ${
              // The caret is swapped out for the clear button while there is a
              // clearable value, open or closed — the same rule as `<mono-select>`
              // / `<mono-tag-input>`, so the three line up in a form. (Here the
              // body toggles either way, so nothing is lost while it is away.)
              //
              // Removed outright, inline chips included: the strip resizes by one
              // glyph at the swap, but the swap rides on the VALUE changing, which
              // re-lays the strip anyway — never on open/close or paging, the case
              // the scroll-button gate above guards. Parking the caret only bought
              // a blank gap after ✕ for as long as a value is set.
              //
              // `disabled` / `readonly` show NEITHER glyph — the field refuses to
              // open, so a caret would promise what it never delivers. The actions
              // span still renders, so the gutter stays put when the state toggles.
              !inert && !canClear
                ? html`<span
                    role="button"
                    tabindex="-1"
                    class=${this._cls('mono-dropdown-table-arrow', 'arrow')}
                    mono-dd-arrow
                    aria-label="Toggle"
                    aria-expanded=${this._isOpen ? 'true' : 'false'}
                    @mousedown=${(e: MouseEvent) => e.preventDefault()}
                    @click=${(e: Event) => {
                      e.stopPropagation()
                      this.toggle()
                    }}
                    >${this._caretIcon()}</span
                  >`
                : nothing
            }
          </span>
        </div>
      `
    }

    /**
     * Panel-only sizing from the `dropdown` object.
     *
     * `maxHeight` is published as the custom property `--_mono-dropdown-table-panel-max-h` rather than a direct
     * `max-height`: the popup controller also constrains the panel (via `--mono-popup-avail-h`),
     * and two writers on the same declaration would clobber each other across renders. The CSS
     * combines both with `min()`. Everything else is a plain declaration.
     *
     * `height` is an EXACT height here now. It used to be the cap, because this object had no
     * `maxHeight`; it does now, and the three popup components share one meaning.
     */
    private _panelStyle(): StyleInfo {
      const d = this.dropdown
      if (!d) return {}
      const s: StyleInfo = {}
      const w = toCssSize(d.width)
      const mw = toCssSize(d.minWidth)
      const xw = toCssSize(d.maxWidth)
      const h = toCssSize(d.height)
      const mh = toCssSize(d.minHeight)
      const xh = toCssSize(d.maxHeight)
      if (w) s.width = w
      if (mw) s['min-width'] = mw
      if (xw) s['max-width'] = xw
      if (h) s.height = h
      if (mh) s['min-height'] = mh
      if (xh) s['--_mono-dropdown-table-panel-max-h'] = xh
      return s
    }

    protected override render(): TemplateResult {
      const items = this._dd?.selectedItems() ?? []
      // The wrapper's `mono-*` attributes mirror the props one for one and are
      // what dropdown-table.css styles; a prop at its default emits NO attribute.
      // `mono-open` / `mono-more-open` / `mono-has-value` / `mono-side` are
      // STATES (the portal mirrors them onto the relocated panels). The classes
      // stay as inert hooks until 2.0.
      const state = this._validationState
      return html`
        <div
          class=${this._wrapperClasses}
          style=${styleMap(buildSizeStyle(this))}
          mono-dropdown-table
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
          mono-validation-state=${state === 'default' ? nothing : state}
          mono-side=${this._resolvedSide}
          ?mono-open=${this._isOpen}
          ?mono-more-open=${this._moreOpen}
          ?mono-disabled=${this.disabled}
          ?mono-readonly=${this.readonly}
          ?mono-required=${this.required}
          ?mono-clearable=${this.clearable}
          ?mono-multiple=${this._multi}
          ?mono-has-value=${this._hasValue}
        >
          ${this._renderLabel()}
          <div
            class="mono-dropdown-table-control${this._inlineChips ? ' is-inline' : ''}"
            mono-dd-control
            ?mono-inline=${this._inlineChips}
          >
            ${this._renderTrigger(items)} ${this._renderMore(items)}
          </div>
          ${this._renderMessage()}
          <div
            class="mono-dropdown-table-panel ${this._isOpen ? 'open' : ''}"
            mono-dd-panel
            role="dialog"
            tabindex="-1"
            style=${styleMap(this._panelStyle())}
            @click=${this._onPanelClick}
            @keydown=${this._onPanelKeydown}
            @keyup=${this._onPanelKeyup}
          >
            ${this._renderRegion('search', 'search')}
            ${this._renderRegion('body', 'body')}
            ${this._renderRegion('foot', 'footer')}
          </div>
        </div>
      `
    }
  }

  return MonoDropdownTableCoreClass as unknown as Constructor<MonoDropdownTableCoreInterface> & T
}
