// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { live } from 'lit/directives/live.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  OtpType,
  OtpSize,
  OtpColor,
  OtpVariant,
  OtpGroups,
  OtpLabelPosition,
  OtpValidationPosition,
  OtpValidationState,
  OtpModelEventDetail,
  OtpCssClass,
} from './otp-types.js'
import {
  backspaceOtp,
  clampCaret,
  normaliseOtpValue,
  parseOtpGroups,
  removeOtpChar,
  resolveOtpLength,
  sanitizeOtpChar,
  spliceOtpValue,
  type OtpEdit,
} from './otp-utils.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { cssPart } from '../../composables/css-class'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { MonoFormControlCore } from '../form/form-control-core.js'
import { FieldTooltipController, type FieldTooltipValue } from '../../composables/field-tooltip'
import { FieldValidationController } from '../../composables/field-validation'

export type OtpSlotName = 'prefix' | 'suffix' | 'label' | 'helper'

/** Glyphs the builds draw: only the clear `×`. */
export type OtpIconName = 'close'

/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoOtpCoreInterface {
  cssClass: OtpCssClass
  cssClassName: string
  type: OtpType
  length: number | string
  groups?: OtpGroups
  separator: string
  mask: boolean
  size: OtpSize
  color: OtpColor
  variant: OtpVariant
  labelPosition: OtpLabelPosition
  validationPosition: OtpValidationPosition
  modelValue: string
  value: string
  name: string
  placeholder: string
  label: string
  helperText: string
  tooltip: FieldTooltipValue
  validationState: OtpValidationState
  validationMessage: string
  error: boolean
  errorMessage: string
  success: boolean
  successMessage: string
  autocomplete: string
  inputmode: string
  ariaLabelText?: string
  disabled: boolean
  readonly: boolean
  required: boolean
  clearable: boolean
  autofocus: boolean
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  /** True once every box holds a character. */
  readonly complete: boolean
  /** Focus a box — by default the first empty one (or the last when full). */
  focus(index?: number | FocusOptions): void
  blur(): void
  /** Empty every box (fires `input`, `change` and `clear`). */
  clear(): void

  protected readonly _tooltip: FieldTooltipController
  protected readonly _validation: FieldValidationController
  protected _hasPrefixSlotState: boolean
  protected _hasSuffixSlotState: boolean
  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected readonly _otpId: string
  protected readonly _messageId: string
  protected readonly _resolvedValidationState: OtpValidationState
  protected _cls(base: string, key: keyof OtpCssClass): string
  protected _renderLabel(): TemplateResult | typeof nothing
  protected _renderLabelText(): TemplateResult | string
  protected _renderHelperText(base: string): TemplateResult | typeof nothing
  protected _renderAffix(name: 'prefix' | 'suffix'): TemplateResult | typeof nothing
  protected renderIcon(name: OtpIconName): TemplateResult
}

/**
 * `MonoOtpCore` — all render-mode-agnostic logic for `mono-otp`: N single-character boxes that
 * behave as ONE field. The value is a contiguous prefix of the boxes (box i holds `value[i]`), so
 * focus can never land past the first empty box, Backspace / Delete shift the rest left, and a
 * paste or an SMS autofill overwrites from the focused box on (see `otp-utils.ts`).
 *
 * Same prop surface as mono-input (size / color / variant / label-position / validation-position
 * / tooltip / messages / states / sizing), wired to `controlMonoForm` through
 * `MonoFormControlCore`: `input` per edit (live rules), `change` when focus leaves the group
 * (change rules, marks touched), plus `complete` once every box is filled.
 *
 * Each build supplies `createRenderRoot()`, the slot strategy (the `_render*` hooks below) and
 * `renderIcon()` — light captures `slot="…"` children into `[data-mono-slot]` placeholders,
 * shadow uses native `<slot>`s.
 */
export const MonoOtpCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoOtpCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'labelPosition',
        'validationPosition',
        'modelValue',
        'helperText',
        'validationState',
        'validationMessage',
        'errorMessage',
        'successMessage',
        'ariaLabelText',
        'cssClass',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ])

      for (const alias of ['ariaLabel', 'aria-label', 'arialabel']) {
        Object.defineProperty(this, alias, {
          get: () => this.ariaLabelText,
          set: (value: unknown) => {
            this.ariaLabelText = value == null ? undefined : String(value)
          },
          configurable: true,
          enumerable: false,
        })
      }
      // `maxlength` reads naturally on a code field — it is `length`.
      defineHybridPropAlias(this, 'maxlength', 'length')
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
        'arialabeltext',
        'arialabel',
        'maxlength',
        'css-class',
        'cssclass',
      ]
    }

    override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
      super.attributeChangedCallback(name, oldValue, newValue)
      if (oldValue === newValue) return
      switch (name) {
        case 'css-class':
        case 'cssclass':
          this.cssClassName = newValue ?? ''
          return
        case 'modelvalue':
          this.modelValue = newValue ?? ''
          return
        case 'helpertext':
          this.helperText = newValue ?? ''
          return
        case 'validationstate':
          this.validationState = (newValue ?? 'default') as OtpValidationState
          return
        case 'validationmessage':
          this.validationMessage = newValue ?? ''
          return
        case 'errormessage':
          this.errorMessage = newValue ?? ''
          return
        case 'successmessage':
          this.successMessage = newValue ?? ''
          return
        case 'arialabeltext':
        case 'arialabel':
          this.ariaLabelText = newValue ?? undefined
          return
        case 'maxlength':
          if (newValue != null) this.length = newValue
          return
      }
    }

    // ── props ───────────────────────────────────────────────────────────

    @property({ attribute: false })
    cssClass: OtpCssClass = {}

    @property({ type: String, attribute: 'css-class' })
    cssClassName = ''

    /** Which characters a box accepts: `numeric` (default), `alphanumeric` (uppercased), `text`. */
    @property({ type: String })
    type: OtpType = 'numeric'

    /** Number of boxes. */
    @property()
    length: number | string = 6

    /** Group sizes — `3`, `[3, 3]` or `"3,3"`; a separator is drawn between groups. */
    @property()
    groups?: OtpGroups

    /** Text between groups; `''` leaves only the gap. */
    @property({ type: String })
    separator = '-'

    /** Hide the characters like a password. */
    @property({ reflect: true, converter: booleanStringConverter })
    mask = false

    @property({ type: String })
    size: OtpSize = 'md'

    @property({ type: String })
    color: OtpColor = 'primary'

    @property({ type: String })
    variant: OtpVariant = 'outlined'

    /** `top` (default), `left`, `right`. `notched` renders as `top` — there is no single box to notch. */
    @property({ type: String, attribute: 'label-position' })
    labelPosition: OtpLabelPosition = 'top'

    @property({ type: String, attribute: 'validation-position' })
    validationPosition: OtpValidationPosition = 'bottom'

    @property({ attribute: 'model-value' })
    modelValue: string = ''

    @property({ type: String })
    value = ''

    @property({ type: String })
    name = ''

    /** A placeholder character for every empty box — or one per box when it is `length` long. */
    @property({ type: String })
    placeholder = ''

    @property({ type: String })
    label = ''

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    @property()
    tooltip: FieldTooltipValue = null

    protected readonly _tooltip = new FieldTooltipController(this, () => this.tooltip)

    protected readonly _validation = new FieldValidationController(
      this,
      () => ({ position: this.validationPosition, ...(this._validationNotice ?? { state: undefined, text: undefined }) }),
      () => (this.renderRoot as ParentNode | undefined)?.querySelector?.('[mono-otp] > [mono-field]'),
    )

    @property({ type: String, attribute: 'validation-state' })
    validationState: OtpValidationState = 'default'

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

    /** On the first box; `one-time-code` lets the phone offer the code from an SMS. */
    @property({ type: String })
    autocomplete = 'one-time-code'

    @property({ type: String })
    inputmode = ''

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    readonly = false

    @property({ reflect: true, converter: booleanStringConverter })
    required = false

    @property({ reflect: true, converter: booleanStringConverter })
    clearable = false

    @property({ reflect: true, converter: booleanStringConverter })
    autofocus = false

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

    // ── state ───────────────────────────────────────────────────────────

    /** The cleaned code the boxes show. */
    @state()
    protected _code = ''

    /** The box with focus, `-1` when none. */
    @state()
    protected _focusIndex = -1

    @state()
    protected _hasPrefixSlotState = false

    @state()
    protected _hasSuffixSlotState = false

    @state()
    protected _hasLabelSlotState = false

    @state()
    protected _hasHelperSlotState = false

    /** The code when focus entered the group — `change` fires on leave if it differs. */
    protected _committed: string | null = null

    protected readonly _otpId = `mono-otp-${Math.random().toString(36).slice(2)}`
    protected readonly _messageId = `${this._otpId}-message`

    get complete(): boolean {
      return Array.from(this._code).length === this._length
    }

    protected get _length(): number {
      return resolveOtpLength(this.length)
    }

    protected get _filled(): number {
      return Array.from(this._code).length
    }

    // ── value resolution ────────────────────────────────────────────────

    protected override willUpdate(changed: Map<string, unknown>): void {
      // `value` is the other name of the model — written alone, it leads.
      if (changed.has('value') && !changed.has('modelValue') && String(this.value ?? '') !== this._code) {
        this.modelValue = String(this.value ?? '')
      }
      if (changed.has('modelValue') || changed.has('length') || changed.has('type')) {
        this._code = normaliseOtpValue(this.modelValue, this._length, this.type)
        if (this.value !== this._code) this.value = this._code
      }
      super.willUpdate?.(changed)
    }

    override firstUpdated(changed: Map<string, unknown>): void {
      super.firstUpdated?.(changed)
      if (this.autofocus) this.focus()
    }

    // ── editing ─────────────────────────────────────────────────────────

    protected _cellEl(i: number): HTMLInputElement | null {
      return (this.renderRoot as ParentNode | undefined)?.querySelector?.(`[mono-otp-cell][data-index="${i}"]`) ?? null
    }

    protected _indexOf(event: Event): number {
      return Number((event.currentTarget as HTMLElement).dataset.index ?? 0)
    }

    protected get _editable(): boolean {
      return !this.disabled && !this.readonly
    }

    protected _focusCell(i: number): void {
      const el = this._cellEl(i)
      if (!el) return
      el.focus()
      // Selected, so the next keystroke REPLACES the box rather than appending to it.
      el.select?.()
    }

    protected _detail(oldValue: string, index: number, sourceEvent?: Event): OtpModelEventDetail {
      return {
        modelValue: this._code,
        currentValue: this._code,
        oldValue,
        value: this._code,
        complete: this.complete,
        index,
        name: this.name,
        sourceEvent,
      }
    }

    /** Commit an edit: write the model, fire `input` (+ `complete`), then move the caret. */
    protected _apply(edit: OtpEdit, index: number, event?: Event): void {
      const old = this._code
      if (edit.value !== old) {
        this._code = edit.value
        this.value = edit.value
        this.modelValue = edit.value
        dispatchMonoEvent(this, 'input', this._detail(old, index, event))
        if (this.complete) dispatchMonoEvent(this, 'complete', this._detail(old, index))
      }
      this._focusCell(edit.caret)
      // The boxes re-render with the new characters; re-select once they have.
      void this.updateComplete.then(() => {
        const el = this._cellEl(edit.caret)
        if (el && this._focusIndex === edit.caret) el.select?.()
      })
    }

    protected _onCellInput = (event: Event): void => {
      const el = event.currentTarget as HTMLInputElement
      const i = this._indexOf(event)
      const old = Array.from(this._code)[i] ?? ''
      const raw = el.value
      if (!this._editable) {
        el.value = old
        event.stopPropagation()
        return
      }

      // An emptied box (a mobile backspace arrives as input, not keydown).
      if (raw === '') {
        el.value = old
        const edit = removeOtpChar(this._code, i, this._length)
        if (edit.value === this._code) event.stopPropagation()
        this._apply(edit, i, event)
        return
      }

      // A typed character lands beside the one already there when the box was not selected.
      let text = raw
      if (old && Array.from(raw).length === 2 && raw.includes(old)) text = raw.startsWith(old) ? raw.slice(old.length) : raw.slice(0, raw.length - old.length)

      const edit = spliceOtpValue(this._code, i, text, this._length, this.type)
      // The DOM box goes back to the model; the render below writes the accepted character.
      el.value = Array.from(edit.value)[i] ?? ''
      // A rejected character must not leak out as a bare native `input`.
      if (edit.value === this._code) event.stopPropagation()
      this._apply(edit, i, event)
    }

    protected _onCellKeydown = (event: KeyboardEvent): void => {
      const i = this._indexOf(event)
      const n = this._length
      const last = clampCaret(n, this._filled, n)
      switch (event.key) {
        case 'Backspace':
          event.preventDefault()
          if (this._editable) this._apply(backspaceOtp(this._code, i, n), i, event)
          return
        case 'Delete':
          event.preventDefault()
          if (this._editable) this._apply(removeOtpChar(this._code, i, n), i, event)
          return
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          this._focusCell(Math.max(0, i - 1))
          return
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          this._focusCell(Math.min(last, i + 1))
          return
        case 'Home':
          event.preventDefault()
          this._focusCell(0)
          return
        case 'End':
          event.preventDefault()
          this._focusCell(last)
          return
      }
      // Typing the character the box already holds fires no `input` — still move on.
      if (this._editable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const edit = spliceOtpValue(this._code, i, event.key, n, this.type)
        if (edit.value === this._code && i < this._filled && sanitizeOtpChar(event.key, this.type)) {
          event.preventDefault()
          this._focusCell(edit.caret)
        }
      }
    }

    protected _onCellPaste = (event: ClipboardEvent): void => {
      event.preventDefault()
      if (!this._editable) return
      const text = event.clipboardData?.getData('text') ?? ''
      this._apply(spliceOtpValue(this._code, this._indexOf(event), text, this._length, this.type), this._indexOf(event), event)
    }

    protected _onCellFocus = (event: FocusEvent): void => {
      const i = this._indexOf(event)
      // Focus never lands past the first empty box — the code has no holes.
      const allowed = clampCaret(i, this._filled, this._length)
      if (allowed !== i) {
        this._focusCell(allowed)
        return
      }
      this._focusIndex = i
      ;(event.currentTarget as HTMLInputElement).select?.()
    }

    protected _onCellClick = (event: MouseEvent): void => {
      ;(event.currentTarget as HTMLInputElement).select?.()
    }

    protected _onFieldFocusIn = (): void => {
      if (this._committed === null) this._committed = this._code
    }

    protected _onFieldFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget as Node | null
      if (next && (this.renderRoot as Node).contains(next)) return
      this._focusIndex = -1
      const before = this._committed
      this._committed = null
      if (before !== null && before !== this._code) {
        dispatchMonoEvent(this, 'change', this._detail(before, -1, event))
      }
    }

    /** The cells' native `change` (one per box) is noise — the group's own `change` replaces it. */
    protected _swallow = (event: Event): void => {
      event.stopPropagation()
    }

    public clear(): void {
      if (!this._code) return
      const old = this._code
      this._code = ''
      this.value = ''
      this.modelValue = ''
      const detail = this._detail(old, -1)
      dispatchMonoEvent(this, 'input', detail)
      dispatchMonoEvent(this, 'change', detail)
      dispatchMonoEvent(this, 'clear', detail)
      // The clear is its own commit; the blur that may follow must not fire `change` again.
      if (this._committed !== null) this._committed = ''
    }

    protected _onClear = (): void => {
      if (!this._editable) return
      this.clear()
      this._focusCell(0)
    }

    public override focus(index?: number | FocusOptions): void {
      const i = typeof index === 'number' ? index : clampCaret(this._length, this._filled, this._length)
      this._focusCell(clampCaret(i, this._filled, this._length))
    }

    public override blur(): void {
      const el = this._cellEl(this._focusIndex)
      el?.blur()
    }

    // ── classes / state ─────────────────────────────────────────────────

    protected get _resolvedValidationState(): OtpValidationState {
      if (this.validationState && this.validationState !== 'default') return this.validationState
      if (this.error || this.errorMessage) return 'invalid'
      if (this.success || this.successMessage) return 'valid'
      return 'default'
    }

    protected get _validationNotice(): { state: string; text: string } | null {
      if (this.validationMessage) return { state: this._resolvedValidationState, text: this.validationMessage }
      if (this.errorMessage) return { state: 'invalid', text: this.errorMessage }
      if (this.successMessage) return { state: 'valid', text: this.successMessage }
      return null
    }

    protected _cls(base: string, key: keyof OtpCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    protected get _hasLabel(): boolean {
      return !!(this.label || this._hasLabelSlotState)
    }

    protected get _describedBy(): string | undefined {
      return this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlotState
        ? this._messageId
        : undefined
    }

    protected get _inputMode(): string {
      return this.inputmode || (this.type === 'numeric' ? 'numeric' : 'text')
    }

    protected _placeholderAt(i: number): string | undefined {
      const chars = Array.from(this.placeholder ?? '')
      if (!chars.length) return undefined
      return chars.length === this._length ? chars[i] : chars[0]
    }

    protected _cellLabel(i: number): string {
      const base = this.ariaLabelText || this.label
      const what = this.type === 'numeric' ? 'Digit' : 'Character'
      const own = `${what} ${i + 1} of ${this._length}`
      return base ? `${base} – ${own}` : own
    }

    // ── render ──────────────────────────────────────────────────────────

    /** Label text — light: placeholder for the captured slot; shadow overrides with `<slot>`. */
    protected _renderLabelText(): TemplateResult | string {
      return this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label
    }

    protected _renderLabel(): TemplateResult | typeof nothing {
      if (!this._hasLabel) return nothing
      return html`
        <label class=${this._cls('mono-otp-label', 'label')} mono-label id=${`${this._otpId}-label`} for=${`${this._otpId}-0`}>
          ${this._renderLabelText()}
          ${this.required ? html`<span class=${this._cls('mono-otp-required', 'required')} mono-required-mark>*</span>` : nothing}
          ${this._tooltip.render()}
        </label>
      `
    }

    protected _renderHelperText(base: string): TemplateResult | typeof nothing {
      if (!this.helperText && !this._hasHelperSlotState) return nothing
      return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlotState ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`
    }

    protected _renderMessage(): TemplateResult | typeof nothing {
      const base = this._cls('mono-otp-message', 'message')
      if (this._validation.moved) {
        const notice = this._validationNotice!
        return html`${this._renderHelperText(base)}<div
          class=${`${base} ${notice.state}`}
          mono-message=${notice.state}
          mono-sr-only
          role=${notice.state === 'invalid' ? 'alert' : nothing}
        >${notice.text}</div>`
      }
      if (this.validationMessage) {
        const s = this._resolvedValidationState
        return html`<div class=${`${base} ${s}`} mono-message=${s} role=${s === 'invalid' ? 'alert' : nothing}>${this.validationMessage}</div>`
      }
      if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`
      if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`
      return this._renderHelperText(base)
    }

    /** Prefix / suffix inside the row — light: captured-slot placeholder; shadow overrides with `<slot>`. */
    protected _renderAffix(name: 'prefix' | 'suffix'): TemplateResult | typeof nothing {
      const has = name === 'prefix' ? this._hasPrefixSlotState : this._hasSuffixSlotState
      if (!has) return nothing
      return html`<span class=${this._cls(`mono-otp-${name}`, name)} mono-otp-affix=${name}><span data-mono-slot=${name}></span></span>`
    }

    protected _renderCell(i: number, chars: string[], invalid: boolean): TemplateResult {
      return html`<input
        id=${`${this._otpId}-${i}`}
        class=${this._cls('mono-otp-cell', 'cell')}
        mono-otp-cell
        data-index=${i}
        type=${this.mask ? 'password' : 'text'}
        .value=${live(chars[i] ?? '')}
        inputmode=${this._inputMode}
        pattern=${ifDefined(this.type === 'numeric' ? '[0-9]*' : undefined)}
        autocomplete=${i === 0 ? this.autocomplete || 'one-time-code' : 'off'}
        autocapitalize=${this.type === 'alphanumeric' ? 'characters' : 'off'}
        autocorrect="off"
        spellcheck="false"
        placeholder=${ifDefined(this._placeholderAt(i))}
        ?disabled=${this.disabled}
        ?readonly=${this.readonly}
        ?mono-filled=${i < chars.length}
        ?mono-active=${i === this._focusIndex}
        aria-label=${this._cellLabel(i)}
        aria-invalid=${invalid ? 'true' : 'false'}
        aria-describedby=${ifDefined(this._describedBy)}
        @input=${this._onCellInput}
        @change=${this._swallow}
        @keydown=${this._onCellKeydown}
        @paste=${this._onCellPaste}
        @focus=${this._onCellFocus}
        @click=${this._onCellClick}
      />`
    }

    protected _renderCells(): TemplateResult {
      const n = this._length
      const chars = Array.from(this._code)
      const breaks = new Set(parseOtpGroups(this.groups, n))
      const invalid = this._resolvedValidationState === 'invalid'
      const groups: number[][] = [[]]
      for (let i = 0; i < n; i++) {
        if (breaks.has(i)) groups.push([])
        groups[groups.length - 1].push(i)
      }
      return html`${groups.map(
        (group, g) => html`${g > 0
          ? html`<span class=${this._cls('mono-otp-separator', 'separator')} mono-otp-separator aria-hidden="true">${this.separator}</span>`
          : nothing}<div class=${this._cls('mono-otp-group', 'group')} mono-otp-group>${group.map((i) => this._renderCell(i, chars, invalid))}</div>`,
      )}`
    }

    protected _renderClear(): TemplateResult | typeof nothing {
      if (!(this.clearable && this._code && this._editable)) return nothing
      return html`<button type="button" class=${this._cls('mono-otp-clear', 'clear')} mono-clear aria-label="Clear code" @click=${this._onClear}>
        ${this.renderIcon('close')}
      </button>`
    }

    /** Icon hook — light: UnoCSS `i-mdi-*`; shadow: inline SVG. */
    protected renderIcon(_name: OtpIconName): TemplateResult {
      return html``
    }

    protected override render(): TemplateResult {
      const state = this._resolvedValidationState
      // `notched` has no single box to cut the label into, so it reads as `top`.
      const lp = this.labelPosition === 'left' || this.labelPosition === 'right' ? this.labelPosition : nothing
      return html`<div
        class=${['mono-otp', this.size, this.color, this.variant, this.disabled ? 'disabled' : '', this.cssClassName, this.cssClass?.root]
          .filter(Boolean)
          .join(' ')}
        style=${styleMap(buildSizeStyle(this))}
        mono-otp
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
        mono-label-position=${lp}
        mono-validation-position=${this.validationPosition === 'bottom' ? nothing : this.validationPosition}
        mono-validation-state=${state === 'default' ? nothing : state}
        mono-type=${this.type === 'numeric' ? nothing : this.type}
        ?mono-mask=${this.mask}
        ?mono-complete=${this.complete}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >
        ${this._renderLabel()}
        <div
          class=${this._cls('mono-otp-field', 'field')}
          mono-field
          role="group"
          aria-labelledby=${ifDefined(!this.ariaLabelText && this._hasLabel ? `${this._otpId}-label` : undefined)}
          aria-label=${ifDefined(this.ariaLabelText || (!this._hasLabel ? 'One-time code' : undefined))}
          aria-required=${ifDefined(this.required ? 'true' : undefined)}
          @focusin=${this._onFieldFocusIn}
          @focusout=${this._onFieldFocusOut}
        >
          ${this._renderAffix('prefix')}
          ${this._renderCells()}
          ${this._validation.renderIcon()}
          ${this._renderClear()}
          ${this._renderAffix('suffix')}
        </div>
        ${this.name ? html`<input type="hidden" mono-otp-hidden name=${this.name} .value=${this._code} ?disabled=${this.disabled} />` : nothing}
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>${this._renderMessage()}</div>
        ${this._validation.renderFloat()}
      </div>`
    }
  }

  return MonoOtpCoreClass as unknown as Constructor<MonoOtpCoreInterface> & T
}
