// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  TextareaSize,
  TextareaColor,
  TextareaVariant,
  TextareaValidationState,
  TextareaCssClass,
  TextareaModelEventDetail,
} from './textarea-types.js'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { MonoFormControlCore } from '../form/form-control-core.js'

/** Named slots projected by `mono-textarea` (light: captured; shadow: native). */
export type TextareaSlotName = 'label' | 'helper'

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
 * `MonoTextareaCore` — render-mode-agnostic logic for `mono-textarea` (props,
 * hybrid aliases, value/model sync, validation, char counter, auto-resize, and
 * the full `render()`). SSR-safe: the only DOM/`window` access (`_syncAutoResize`)
 * is `isServer`-guarded. Each build supplies `createRenderRoot()` + `static styles`
 * and the slot strategy via the `_slotOutlet` hook (light: `data-mono-slot`
 * placeholders; shadow: native `<slot>`). Mirrors `switch-core`/`select-core`.
 */
export const MonoTextareaCore = <T extends Constructor<LitElement>>(superClass: T) => {
class MonoTextareaCoreClass extends MonoFormControlCore(superClass) {
  constructor(...args: any[]) {
    super(...args)

    defineHybridPropAliases(this, [
      'modelValue',
      'helperText',
      'validationState',
      'validationMessage',
      'errorMessage',
      'successMessage',
      'autoResize',
      'minRows',
      'maxRows',
      'minLength',
      'maxLength',
      'showCounter',
      'ariaLabelText',
      'cssClass',
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
    ])

    /**
     * Vue support:
     *
     * <mono-textarea :cssClass="{}" />
     * <mono-textarea :css-class="{}" />
     * <mono-textarea :cssclass="{}" />
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

    Object.defineProperty(this, 'maxlength', {
      get: () => this.maxLength,
      set: (value: unknown) => {
        this.maxLength = this._toOptionalNumber(value)
      },
      configurable: true,
      enumerable: false,
    })

    Object.defineProperty(this, 'minlength', {
      get: () => this.minLength,
      set: (value: unknown) => {
        this.minLength = this._toOptionalNumber(value)
      },
      configurable: true,
      enumerable: false,
    })
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
      'autoresize',
      'minrows',
      'maxrows',
      'minlength',
      'maxlength',
      'showcounter',
      'arialabeltext',
      'arialabel',
      'css-class',
      'cssclass',
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
      this.modelValue = newValue ?? ''
      return
    }

    if (name === 'helpertext') {
      this.helperText = newValue ?? ''
      return
    }

    if (name === 'validationstate') {
      this.validationState = (newValue ?? 'default') as TextareaValidationState
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

    if (name === 'autoresize') {
      this.autoResize = this._toBoolean(newValue)
      return
    }

    if (name === 'minrows') {
      this.minRows = this._toOptionalNumber(newValue)
      return
    }

    if (name === 'maxrows') {
      this.maxRows = this._toOptionalNumber(newValue)
      return
    }

    if (name === 'minlength') {
      this.minLength = this._toOptionalNumber(newValue)
      return
    }

    if (name === 'maxlength') {
      this.maxLength = this._toOptionalNumber(newValue)
      return
    }

    if (name === 'showcounter') {
      this.showCounter = this._toBoolean(newValue)
      return
    }

    if (name === 'arialabeltext' || name === 'arialabel') {
      this.ariaLabelText = newValue ?? undefined
      return
    }

    if (name === 'css-class' || name === 'cssclass') {
      this._setCssClass(newValue)
    }
  }

  @property({ type: String })
  size: TextareaSize = 'md'

  @property({ type: String })
  color: TextareaColor = 'primary'

  @property({ type: String })
  variant: TextareaVariant = 'outlined'

  @property({ type: String, attribute: 'model-value', reflect: true })
  modelValue = ''

  @property({ type: String })
  value = ''

  @property({ type: String })
  name = ''

  @property({ type: String })
  placeholder = ''

  @property({ type: String })
  label = ''

  @property({ type: String, attribute: 'helper-text' })
  helperText = ''

  @property({ type: String, attribute: 'validation-state' })
  validationState: TextareaValidationState = 'default'

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
  autofocus = false

  @property({
    attribute: 'auto-resize',
    reflect: true,
    converter: booleanStringConverter,
  })
  autoResize = false

  @property({
    attribute: 'show-counter',
    reflect: true,
    converter: booleanStringConverter,
  })
  showCounter = false

  @property({
    converter: numberStringConverter,
  })
  rows?: number

  @property({
    attribute: 'min-rows',
    converter: numberStringConverter,
  })
  minRows?: number

  @property({
    attribute: 'max-rows',
    converter: numberStringConverter,
  })
  maxRows?: number

  @property({
    attribute: 'min-length',
    converter: numberStringConverter,
  })
  minLength?: number

  @property({
    attribute: 'max-length',
    converter: numberStringConverter,
  })
  maxLength?: number

  @property({ attribute: false })
  cssClass: TextareaCssClass = {}

  /**
   * Plain HTML root class fallback:
   *
   * <mono-textarea css-class="premium-textarea"></mono-textarea>
   */
  @property({ attribute: false })
  cssClassName = ''

  @state()
  protected _hasLabelSlotState = false

  @state()
  protected _hasHelperSlotState = false

  @query('.mono-textarea-field')
  private _textareaEl?: HTMLTextAreaElement

  private readonly _textareaId = `mono-textarea-${Math.random().toString(36).slice(2)}`
  private readonly _messageId = `${this._textareaId}-message`

  override willUpdate(changed: Map<string, unknown>): void {
    // SSR (nuxt-ssr-lit) can set a boolean prop to a raw string (e.g. '');
    // coerce so render() sees real booleans and hydration matches.
    // (see project_shadow_boolean_prop_ssr)
    for (const key of [
      'disabled', 'readonly', 'required', 'autofocus', 'autoResize', 'showCounter',
    ] as const) {
      const v = this[key] as unknown
      if (typeof v !== 'boolean') {
        ;(this as unknown as Record<string, unknown>)[key] = this._toBoolean(v)
      }
    }

    if (changed.has('modelValue') && this.value !== this.modelValue) {
      this.value = this.modelValue ?? ''
    }

    if (changed.has('value') && this.modelValue !== this.value) {
      this.modelValue = String(this.value ?? '')
    }
  }

  private _autoResizeRo?: ResizeObserver
  private _lastAutoResizeWidth = -1

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    this._setupAutoResizeObserver()
    // The auto-resized height is derived from `scrollHeight` at the CURRENT width,
    // and a reconnect can land the element in a differently sized container. Nothing
    // else recomputes it — `updated()` only reacts to value/rows changes — so without
    // this a `v-if` toggle into a narrower column left the box at its old height with
    // the text clipped until the next keystroke.
    this._syncAutoResize()
  }

  override disconnectedCallback(): void {
    this._teardownAutoResizeObserver()
    super.disconnectedCallback()
  }

  override firstUpdated(): void {
    if (isServer) return

    if (this.autofocus) {
      this.focus()
    }

    this._syncAutoResize()
  }

  /**
   * Recompute the height when the element's WIDTH changes.
   *
   * The reconnect hook above only covers being moved; the same staleness happens on a
   * window resize, a sidebar opening, or any layout shift that renarrows the column.
   * Width is the real input to the height calculation, so watch it directly.
   */
  private _setupAutoResizeObserver(): void {
    if (isServer || this._autoResizeRo) return
    if (typeof ResizeObserver === 'undefined') return

    this._autoResizeRo = new ResizeObserver(() => {
      if (!this.autoResize) return
      const width = this.getBoundingClientRect().width
      // Width-gated on purpose: `_syncAutoResize()` writes a HEIGHT, which resizes
      // the observed box and would otherwise re-enter this callback forever.
      if (width === this._lastAutoResizeWidth) return
      this._lastAutoResizeWidth = width
      this._syncAutoResize()
    })
    this._autoResizeRo.observe(this)
  }

  private _teardownAutoResizeObserver(): void {
    this._autoResizeRo?.disconnect()
    this._autoResizeRo = undefined
    this._lastAutoResizeWidth = -1
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    if (isServer) return

    if (
      changed.has('value') ||
      changed.has('modelValue') ||
      changed.has('autoResize') ||
      changed.has('minRows') ||
      changed.has('maxRows')
    ) {
      this._syncAutoResize()
    }
  }

  private _setCssClass(value: unknown): void {
    if (value == null) {
      this.cssClass = {}
      this.cssClassName = ''
      return
    }

    if (typeof value === 'object') {
      this.cssClass = value as TextareaCssClass
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
       * <mono-textarea css-class='{"root":"...", "field":"..."}'></mono-textarea>
       */
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.cssClass = JSON.parse(trimmed) as TextareaCssClass
          return
        } catch {
          // fallback to root class
        }
      }

      this.cssClassName = trimmed
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

  private _cls(base: string, key: keyof TextareaCssClass): string {
    const extra = this.cssClass?.[key]
    return extra ? `${base} ${extra}` : base
  }

  private get _hasLabelSlot(): boolean {
    return this._hasLabelSlotState
  }

  private get _hasHelperSlot(): boolean {
    return this._hasHelperSlotState
  }

  private get _resolvedValidationState(): TextareaValidationState {
    if (this.validationState && this.validationState !== 'default') {
      return this.validationState
    }

    if (this.errorMessage) return 'invalid'
    if (this.successMessage) return 'valid'

    return 'default'
  }

 private get _wrapperClasses(): string {
  return [
    'mono-textarea',
    this.size,
    this.color,
    this.variant,
    this.disabled ? 'disabled' : '',
    this.readonly ? 'readonly' : '',
    this._resolvedValidationState !== 'default'
      ? `is-${this._resolvedValidationState}`
      : '',
    this.value ? 'has-value' : '',
    this.autoResize ? 'auto-resize' : '',
    this.cssClassName,
    this.cssClass?.root,
  ]
    .filter(Boolean)
    .join(' ')
}

 private get _fieldClasses(): string {
  return [
    this._cls('mono-textarea-field', 'field'),
    this.size,
    this.color,
    this.variant,
  ]
    .filter(Boolean)
    .join(' ')
}

  /** `near` at 85% of the cap, `over` past it — the attribute twin of the class. */
  protected get _counterState(): 'default' | 'near' | 'over' {
    const max = this.maxLength
    if (max === undefined) return 'default'
    const length = this.value.length
    if (length > max) return 'over'
    if (length >= Math.floor(max * 0.85)) return 'near'
    return 'default'
  }

  private get _counterClass(): string {
    const length = this.value.length
    const max = this.maxLength

    if (max !== undefined && length > max) {
      return `${this._cls('mono-textarea-counter', 'counter')} over`
    }

    if (max !== undefined && length >= Math.floor(max * 0.85)) {
      return `${this._cls('mono-textarea-counter', 'counter')} near`
    }

    return this._cls('mono-textarea-counter', 'counter')
  }

  private get _shouldShowFooter(): boolean {
    return Boolean(
      this.validationMessage ||
      this.errorMessage ||
      this.successMessage ||
      this.helperText ||
      this._hasHelperSlot ||
      this.showCounter,
    )
  }

  private _createModelDetail(args: {
    modelValue: string
    oldValue: string
    sourceEvent?: Event
  }): TextareaModelEventDetail {
    return {
      modelValue: args.modelValue,
      currentValue: args.modelValue,
      oldValue: args.oldValue,
      value: args.modelValue,
      name: this.name,
      sourceEvent: args.sourceEvent,
    }
  }

  private _emitInput(detail: TextareaModelEventDetail): void {
    // Plain `input` / `change`: the native events decorated on their way to the host.
    dispatchMonoEvent(this, 'input', detail)
  }

  private _emitChange(detail: TextareaModelEventDetail): void {
    dispatchMonoEvent(this, 'change', detail)
  }

  private _handleInput(event: Event): void {
    if (this.disabled || this.readonly) return

    const textarea = event.currentTarget as HTMLTextAreaElement
    const oldValue = this.modelValue
    const nextValue = textarea.value

    this.value = nextValue
    this.modelValue = nextValue

    const detail = this._createModelDetail({
      modelValue: nextValue,
      oldValue,
      sourceEvent: event,
    })

    this._emitInput(detail)
    this._syncAutoResize()
  }

  private _handleChange(event: Event): void {
    if (this.disabled || this.readonly) return

    const textarea = event.currentTarget as HTMLTextAreaElement
    const oldValue = this.modelValue
    const nextValue = textarea.value

    this.value = nextValue
    this.modelValue = nextValue

    const detail = this._createModelDetail({
      modelValue: nextValue,
      oldValue,
      sourceEvent: event,
    })

    this._emitChange(detail)
  }

  private _syncAutoResize(): void {
    if (isServer) return
    if (!this.autoResize || !this._textareaEl) return

    const textarea = this._textareaEl
    const computed = window.getComputedStyle(textarea)
    const lineHeight = Number.parseFloat(computed.lineHeight) || 20
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0

    const minRows = this.minRows ?? this.rows
    const maxRows = this.maxRows

    const minHeight =
      minRows !== undefined
        ? lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom
        : undefined

    const maxHeight =
      maxRows !== undefined
        ? lineHeight * maxRows + paddingTop + paddingBottom + borderTop + borderBottom
        : undefined

    textarea.style.height = 'auto'

    let nextHeight = textarea.scrollHeight

    if (minHeight !== undefined) {
      nextHeight = Math.max(nextHeight, minHeight)
    }

    if (maxHeight !== undefined) {
      nextHeight = Math.min(nextHeight, maxHeight)
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    } else {
      textarea.style.overflowY = 'hidden'
    }

    textarea.style.height = `${nextHeight}px`
  }

  private _renderLabel(): TemplateResult | typeof nothing {
    const hasContent = !!this.label || this._hasLabelSlotState
    if (!hasContent && !this._slotsAlwaysRender) return nothing

    return html`
      <label
        class=${this._cls('mono-textarea-label', 'label')}
        mono-label
        for=${this._textareaId}
        ?mono-empty=${!hasContent}
      >
        ${this._slotOutlet('label', this.label)}

        ${this.required
          ? html`
              <span class=${this._cls('mono-textarea-required', 'required')} mono-required-mark>
                *
              </span>
            `
          : nothing}
      </label>
    `
  }

  private _renderMessage(): TemplateResult | typeof nothing {
    if (this.validationMessage) {
      return html`
        <div
          class=${`${this._cls('mono-textarea-message', 'message')} ${this
            ._resolvedValidationState}`}
          mono-message=${this._resolvedValidationState}
        >
          ${this.validationMessage}
        </div>
      `
    }

    if (this.errorMessage) {
      return html`
        <div class=${`${this._cls('mono-textarea-message', 'message')} invalid`} mono-message="invalid">
          ${this.errorMessage}
        </div>
      `
    }

    if (this.successMessage) {
      return html`
        <div class=${`${this._cls('mono-textarea-message', 'message')} valid`} mono-message="valid">
          ${this.successMessage}
        </div>
      `
    }

    if (this.helperText || this._hasHelperSlot || this._slotsAlwaysRender) {
      return html`
        <div
          class=${`${this._cls('mono-textarea-message', 'message')} helper`}
          mono-message="helper"
          ?mono-empty=${!this.helperText && !this._hasHelperSlot}
        >
          ${this._slotOutlet('helper', this.helperText)}
        </div>
      `
    }

    return nothing
  }

  private _renderCounter(): TemplateResult | typeof nothing {
    if (!this.showCounter) return nothing

    const max = this.maxLength
    const length = this.value.length

    return html`
      <div
        class=${this._counterClass}
        mono-counter
        ?mono-near=${this._counterState === 'near'}
        ?mono-over=${this._counterState === 'over'}
      >
        ${max !== undefined ? `${length}/${max}` : length}
      </div>
    `
  }

  private _renderFooter(): TemplateResult | typeof nothing {
    if (!this._shouldShowFooter && !this._slotsAlwaysRender) return nothing

    return html`
      <div
        class=${this._cls('mono-textarea-footer', 'footer')}
        mono-footer
        ?mono-empty=${!this._shouldShowFooter}
      >
        <div class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>
          ${this._renderMessage()}
        </div>

        ${this._renderCounter()}
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
    const describedBy = this._shouldShowFooter ? this._messageId : undefined

    const ariaLabel =
      this.ariaLabelText ||
      this.label ||
      this.placeholder ||
      undefined

    return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-textarea
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
        mono-validation-state=${this._resolvedValidationState === 'default' ? nothing : this._resolvedValidationState}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-auto-resize=${this.autoResize}
      >
        ${this._renderLabel()}

        <textarea
          id=${this._textareaId}
          class=${this._fieldClasses}
          mono-native
          .value=${this.value}
          name=${ifDefined(this.name || undefined)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          rows=${ifDefined(this.rows)}
          minlength=${ifDefined(this.minLength)}
          maxlength=${ifDefined(this.maxLength)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-label=${ifDefined(ariaLabel)}
          aria-invalid=${this._resolvedValidationState === 'invalid'
            ? 'true'
            : 'false'}
          aria-describedby=${ifDefined(describedBy)}
          @input=${this._handleInput}
          @change=${this._handleChange}
        ></textarea>

        <div id=${this._messageId} mono-message-outlet>
          ${this._renderFooter()}
        </div>
      </div>
    `
  }

  public override focus(options?: FocusOptions): void {
    this._textareaEl?.focus(options)
  }

  public override blur(): void {
    this._textareaEl?.blur()
  }

  public select(): void {
    this._textareaEl?.select()
  }

  public setSelectionRange(start: number, end: number, direction?: 'forward' | 'backward' | 'none'): void {
    this._textareaEl?.setSelectionRange(start, end, direction)
  }

  // --- build hooks -----------------------------------------------------------

  /** Whether the slot regions render even when empty. Light: no. Shadow: yes —
   *  the native `<slot>`s must exist to project DSD content + be scanned
   *  (hidden via `[data-empty]` when empty). */
  protected get _slotsAlwaysRender(): boolean {
    return false
  }

  protected _hasSlot(name: TextareaSlotName): boolean {
    return name === 'label' ? this._hasLabelSlotState : this._hasHelperSlotState
  }

  protected _setSlotState(name: TextareaSlotName, has: boolean): void {
    if (name === 'label') this._hasLabelSlotState = has
    else this._hasHelperSlotState = has
  }

  /**
   * Slot outlet. Light build (default): a `data-mono-slot` placeholder the
   * captured light-DOM nodes are re-parented into when present, else the prop
   * `fallback`. Shadow build overrides this with a native `<slot name>`.
   */
  protected _slotOutlet(name: TextareaSlotName, fallback: unknown = nothing): TemplateResult {
    return this._hasSlot(name)
      ? html`<span data-mono-slot=${name}></span>`
      : html`${fallback}`
  }
}

  return MonoTextareaCoreClass as unknown as Constructor<MonoTextareaCoreInterface> & T
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoTextareaCoreInterface {
  size: TextareaSize
  color: TextareaColor
  variant: TextareaVariant
  modelValue: string
  value: string
  name: string
  placeholder: string
  label: string
  helperText: string
  validationState: TextareaValidationState
  validationMessage: string
  errorMessage: string
  successMessage: string
  ariaLabelText?: string
  disabled: boolean
  readonly: boolean
  required: boolean
  autofocus: boolean
  autoResize: boolean
  showCounter: boolean
  rows?: number
  minRows?: number
  maxRows?: number
  minLength?: number
  maxLength?: number
  cssClass: TextareaCssClass
  cssClassName: string
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  focus(): void
  blur(): void
  select(): void
  setSelectionRange(start: number, end: number, direction?: 'forward' | 'backward' | 'none'): void

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected get _slotsAlwaysRender(): boolean
  protected _setSlotState(name: TextareaSlotName, has: boolean): void
  protected _slotOutlet(name: TextareaSlotName, fallback?: unknown): TemplateResult
}