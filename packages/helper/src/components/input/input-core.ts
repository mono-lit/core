// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  InputType,
  InputSize,
  InputColor,
  InputVariant,
  InputLabelPosition,
  InputValidationPosition,
  InputValidationState,
  InputModelEventDetail,
  InputModelValue,
  InputFileErrorEventDetail,
  InputCssClass,
} from './input-types.js'
import {
  applyFormat,
  caretAfterFormat,
  normaliseValue,
  parseFormat,
  resolveFormat,
  significantFor,
  stripFormat,
} from './input-format.js'
import type { InputFormat, InputFormatDescriptor, InputFormatOn } from './input-format.js'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { cssPart } from '../../composables/css-class'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { MonoFormControlCore } from '../form/form-control-core.js'
import { FieldTooltipController, type FieldTooltipValue } from '../../composables/field-tooltip'
import { FieldValidationController } from '../../composables/field-validation'

export const numberStringConverter = {
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
 * `modelValue` reflects to `model-value`, but only while it is TEXT — a `type="file"` value is a
 * `File` / `File[]`, which would otherwise land in the DOM as `"[object File]"`.
 */
const modelValueConverter = {
  fromAttribute(value: string | null): string {
    return value ?? ''
  },
  toAttribute(value: InputModelValue): string | null {
    return typeof value === 'string' ? value : null
  },
}

export type InputSlotName = 'prefix' | 'suffix' | 'label' | 'helper'

/** Glyphs the builds draw: the clear `×`, and the `type="file"` upload cloud. */
export type InputIconName = 'close' | 'upload'

/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoInputCoreInterface {
  cssClass: InputCssClass
  cssClassName: string
  type: InputType
  size: InputSize
  color: InputColor
  variant: InputVariant
  modelValue: InputModelValue
  accept: string
  multiple: boolean
  maxFileSize?: number
  showValue: boolean
  formatDisplay?: InputFormat
  formatValue?: InputFormat
  formatOn: InputFormatOn
  formatLocale?: string
  value: string
  name: string
  placeholder: string
  label: string
  helperText: string
  tooltip: FieldTooltipValue
  protected readonly _tooltip: FieldTooltipController
  protected readonly _validation: FieldValidationController
  protected get _validationNotice(): { state: string; text: string } | null
  protected _renderMovedMessage(): TemplateResult
  validationState: InputValidationState
  validationMessage: string
  error: boolean
  errorMessage: string
  success: boolean
  successMessage: string
  pattern: string
  autocomplete: string
  inputmode: string
  ariaLabelText?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  step?: number
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
  focus(): void
  blur(): void
  select(): void

  // Protected surface used by the light/shadow render() wrappers.
  protected _hasPrefixSlotState: boolean
  protected _hasSuffixSlotState: boolean
  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected readonly _hasPrefixSlot: boolean
  protected readonly _hasSuffixSlot: boolean
  protected readonly _hasLabelSlot: boolean
  protected readonly _hasHelperSlot: boolean
  protected readonly _inputId: string
  protected readonly _messageId: string
  protected readonly _resolvedValidationState: InputValidationState
  protected readonly _wrapperClasses: string
  protected readonly _fieldClasses: string
  protected readonly _isFile: boolean
  protected readonly _isRange: boolean
  protected _cls(base: string, key: keyof InputCssClass): string
  protected _sizeStyle(): ReturnType<typeof buildSizeStyle>
  protected _renderWrapper(inner: TemplateResult): TemplateResult
  protected _renderNative(): TemplateResult
  protected _renderClear(): TemplateResult | typeof nothing
  protected _renderFileIcon(): TemplateResult | typeof nothing
  protected _renderRangeValue(where: 'label' | 'field'): TemplateResult | typeof nothing
  protected renderIcon(name: InputIconName): TemplateResult
}

/**
 * `MonoInputCore` — all render-mode-agnostic logic for `mono-input`: reactive
 * props, hybrid prop aliases (camelCase ↔ kebab ↔ lowercase), attribute
 * observation, value/model two-way sync, events, validation/class computation,
 * sizing, and imperative focus/blur/select.
 *
 * It deliberately leaves out:
 *  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
 *  - the slot strategy + `render()` — light uses a capture/`data-mono-slot`
 *    hack; shadow uses native `<slot>` with slotchange-driven presence. The
 *    shared `_hasXxxSlotState` `@state` fields back both strategies and feed the
 *    class getters.
 */
export const MonoInputCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoInputCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'labelPosition',
        'validationPosition',
        'modelValue',
        'formatDisplay',
        'formatValue',
        'formatOn',
        'formatLocale',
        'helperText',
        'validationState',
        'validationMessage',
        'errorMessage',
        'successMessage',
        'ariaLabelText',
        'minLength',
        'maxLength',
        'maxFileSize',
        'showValue',
        'cssClass',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ])

      // Shorter aria aliases: ariaLabel / aria-label / arialabel → ariaLabelText
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

      // Native-style lowercase aliases: maxlength / minlength
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
      // `super.observedAttributes` (not the captured base) so Lit finalize() runs
      // on the concrete subclass and builds its attribute→property map.
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
        'minlength',
        'maxlength',
        'maxfilesize',
        'showvalue',
        'css-class',
        'cssclass',
        'formatdisplay',
        'format-display',
        'formatvalue',
        'format-value',
        'formaton',
        'formatlocale',
      ]
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)
      if (oldValue === newValue) return

      switch (name) {
        case 'css-class':
        case 'cssclass':
          this.cssClassName = newValue ?? ''
          return
        case 'formatdisplay':
        case 'format-display':
          this._setFormatFromAttribute('formatDisplay', newValue)
          return
        case 'formatvalue':
        case 'format-value':
          this._setFormatFromAttribute('formatValue', newValue)
          return
        case 'formaton':
          this.formatOn = (newValue ?? 'input') as InputFormatOn
          return
        case 'formatlocale':
          this.formatLocale = newValue ?? undefined
          return
        case 'modelvalue':
          this.modelValue = newValue ?? ''
          return
        case 'helpertext':
          this.helperText = newValue ?? ''
          return
        case 'validationstate':
          this.validationState = (newValue ?? 'default') as InputValidationState
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
        case 'minlength':
          this.minLength = this._toOptionalNumber(newValue)
          return
        case 'maxlength':
          this.maxLength = this._toOptionalNumber(newValue)
          return
        case 'maxfilesize':
          this.maxFileSize = this._toOptionalNumber(newValue)
          return
        case 'showvalue':
          this.showValue = newValue === null ? true : booleanStringConverter.fromAttribute(newValue)
          return
      }
    }

    @property({ attribute: false })
    cssClass: InputCssClass = {}

    @property({ type: String, attribute: 'css-class' })
    cssClassName = ''

    @property({ type: String })
    type: InputType = 'text'

    @property({ type: String })
    size: InputSize = 'md'

    @property({ type: String })
    color: InputColor = 'primary'

    @property({ type: String })
    variant: InputVariant = 'outlined'

    /** Where the label sits — see form/label-position.css. */
    @property({ type: String, attribute: 'label-position' })
    labelPosition: InputLabelPosition = 'top'

    /** Where the validation message shows — see composables/field-validation.ts. */
    @property({ type: String, attribute: 'validation-position' })
    validationPosition: InputValidationPosition = 'bottom'

    /** The text — or, for `type="file"`, the picked `File` / `File[]` (see {@link InputModelValue}). */
    @property({ attribute: 'model-value', reflect: true, converter: modelValueConverter })
    modelValue: InputModelValue = ''

    /** What the field shows. For `type="file"` it is the picked file name(s), never the files. */
    @property({ type: String })
    value = ''

    /** `type="file"` — the native `accept` filter, e.g. `"image/*,.pdf"`. */
    @property({ type: String })
    accept = ''

    /** `type="file"` — pick several files; `modelValue` becomes `File[]`. */
    @property({ reflect: true, converter: booleanStringConverter })
    multiple = false

    /** `type="file"` — files above this many bytes are rejected with an `error` event. */
    @property({ attribute: 'max-file-size', converter: numberStringConverter })
    maxFileSize?: number

    /**
     * `type="range"` — show the value beside the slider. On by default: the EJI ONE guide never
     * shows a slider without its number. Drawn through `format-display`.
     */
    @property({
      attribute: 'show-value',
      converter: {
        // An ABSENT attribute is the default (on); only an explicit `"false"` turns it off.
        fromAttribute: (v: string | null) => (v === null ? true : booleanStringConverter.fromAttribute(v)),
      },
    })
    showValue = true

    /**
     * How the field is DISPLAYED — a pattern string, or a function returning the finished text.
     *
     * It never touches the value: what the consumer reads is `format-value`'s business, so a field
     * can show `10.000.000` while reporting `10000000`.
     *
     * Pattern (see `input-format.ts` for the grammar): `#,##0.##` for numbers, `{}@gmail.com` for a
     * text template. A pattern the parser does not understand leaves the field unformatted rather
     * than blanking it.
     *
     * `format-display="#,##0.##"` from markup; `:format-display.prop="(ctx) => …"` for the function
     * form, which cannot cross an attribute.
     *
     * NOTE a numeric format needs `type="text"` (plus `inputmode="numeric"`). A native number input
     * rejects any value that is not a bare number, so assigning `"10.000.000"` to it silently
     * blanks the field.
     */
    @property({ attribute: false })
    formatDisplay?: InputFormat

    /**
     * How the VALUE is shaped — same two forms as {@link formatDisplay}.
     *
     * A number pattern NORMALISES rather than decorates: `modelValue` becomes `"10000000.25"`, so
     * `Number()` works and a store doing arithmetic never has to know a format was involved. A
     * template assembles the whole string, because there the decoration IS the value — an email
     * without its domain is not an email.
     */
    @property({ attribute: false })
    formatValue?: InputFormat

    /**
     * When the display reformats: `'input'` (default) rewrites as you type, `'blur'` waits for the
     * commit.
     *
     * `'blur'` is the escape hatch for fields where live rewriting fights the typist — the decimal
     * separator is the usual case, since it can be typed freely when nothing reformats underneath.
     */
    @property({ attribute: 'format-on' })
    formatOn: InputFormatOn = 'input'

    /**
     * Which locale a numeric pattern is drawn with. `#,##0.##` is a SHAPE — grouping on, up to two
     * decimals — and the locale decides whether that prints `10,000.25` or `10.000,25`.
     *
     * Unset uses the runtime default, which is rarely what a business app wants.
     */
    @property({ attribute: 'format-locale' })
    formatLocale?: string

    @property({ type: String })
    name = ''

    @property({ type: String })
    placeholder = ''

    @property({ type: String })
    label = ''

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    /**
     * Extra explanation behind an info icon at the end of the label: plain text
     * (`tooltip="…"`) or full `mono-tooltip` options (`.tooltip=${{ content, placement }}`).
     * Needs the optional `@floating-ui/dom` + `@floating-ui/core` peers — without
     * them no icon renders. Shown only beside a label.
     */
    @property()
    tooltip: FieldTooltipValue = null

    protected readonly _tooltip = new FieldTooltipController(this, () => this.tooltip)

    /** `validation-position="icon" | "float"` — the icon in the box and the floating message. */
    protected readonly _validation = new FieldValidationController(
      this,
      () => ({ position: this.validationPosition, ...(this._validationNotice ?? { state: undefined, text: undefined }) }),
      () => (this.renderRoot as ParentNode | undefined)?.querySelector?.('[mono-input] > [mono-field]'),
    )

    /** The validation message and its state — the same precedence the message row uses. */
    protected get _validationNotice(): { state: string; text: string } | null {
      if (this.validationMessage) return { state: this._resolvedValidationState, text: this.validationMessage }
      if (this.errorMessage) return { state: 'invalid', text: this.errorMessage }
      if (this.successMessage) return { state: 'valid', text: this.successMessage }
      return null
    }

    /** The message that moved to the icon / float bubble, kept for assistive tech only. */
    protected _renderMovedMessage(): TemplateResult {
      const notice = this._validationNotice!
      return html`<div
        class=${`${this._cls('mono-input-message', 'message')} ${notice.state}`}
        mono-message=${notice.state}
        mono-sr-only
        role=${notice.state === 'invalid' ? 'alert' : nothing}
      >${notice.text}</div>`
    }

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
    pattern = ''

    @property({ type: String })
    autocomplete = ''

    @property({ type: String })
    inputmode = ''

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ attribute: 'min-length', converter: numberStringConverter })
    minLength?: number

    @property({ attribute: 'max-length', converter: numberStringConverter })
    maxLength?: number

    @property({ type: Number })
    min?: number

    @property({ type: Number })
    max?: number

    @property({ type: Number })
    step?: number

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

    @query('.mono-input-native')
    protected _inputEl!: HTMLInputElement

    /** `type="file"` — the hidden native picker behind the read-only name field. */
    @query('[mono-file-input]')
    protected _fileEl?: HTMLInputElement

    /**
     * What the native input SHOWS. Kept separate from `value` / `modelValue`, which carry the
     * VALUE — that separation is what lets the existing `willUpdate` mirror keep those two in
     * step without ever fighting the formatted text.
     */
    @state()
    protected _display = ''

    /** True while the user is typing in this field — see `_syncDisplayFromValue`. */
    @state()
    protected _focused = false

    /**
     * Set while one of the handlers below is writing, so the outside-value sync in `willUpdate`
     * can tell "the user typed this" from "someone assigned it".
     *
     * `_focused` alone is not enough: it depends on a real focus event, which a programmatic
     * write (or a test) never fires — and without this, `format-on="blur"` reformatted on every
     * keystroke anyway, because the sync could not tell where the change came from.
     */
    protected _internalWrite = false

    @state()
    protected _hasPrefixSlotState = false

    @state()
    protected _hasSuffixSlotState = false

    @state()
    protected _hasLabelSlotState = false

    @state()
    protected _hasHelperSlotState = false

    protected readonly _inputId = `mono-input-${Math.random().toString(36).slice(2)}`
    protected readonly _messageId = `${this._inputId}-message`

    override willUpdate(changed: Map<string, unknown>): void {
      // `type="file"`: the value is File(s), the field shows their names. One direction only —
      // `value` is display text there, so writing it never produces a file.
      if (this._isFile) {
        if (changed.has('modelValue') || changed.has('type')) {
          const files = this._fileList()
          const names = this._fileNames(files)
          this.value = names
          this._display = names
          // Emptied from outside (a form reset, a v-model cleared): drop the native selection
          // too, or re-picking the same file would fire no `change`.
          if (!files.length && this._fileEl) this._fileEl.value = ''
        }
        this._internalWrite = false
        return
      }

      if (changed.has('modelValue') && this.value !== this.modelValue) {
        this.value = typeof this.modelValue === 'string' ? this.modelValue : ''
      }
      if (changed.has('value') && this.modelValue !== this.value) {
        this.modelValue = String(this.value ?? '')
      }

      // The value can change without a keystroke: a `modelValue` binding, or the form writing
      // back through `_syncFromForm` (which is event-free, so no handler above runs). Re-derive
      // the display for those — but NOT while the field has focus, or a form notify arriving
      // mid-word would rewrite the text under the caret.
      const external = !this._internalWrite && !this._focused
      if (external && (changed.has('value') || changed.has('modelValue') || changed.has('formatDisplay'))) {
        this._syncDisplayFromValue()
      }

      this._internalWrite = false
    }

    override firstUpdated(): void {
      if (this.autofocus) this.focus()
    }

    protected _toOptionalNumber(value: unknown): number | undefined {
      if (value === undefined || value === null || value === '') return undefined
      if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
      if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : undefined
      }
      return undefined
    }

    protected get _hasPrefixSlot(): boolean {
      return this._hasPrefixSlotState
    }
    protected get _hasSuffixSlot(): boolean {
      return this._hasSuffixSlotState
    }
    protected get _hasLabelSlot(): boolean {
      return this._hasLabelSlotState
    }
    protected get _hasHelperSlot(): boolean {
      return this._hasHelperSlotState
    }

    protected get _resolvedValidationState(): InputValidationState {
      if (this.validationState && this.validationState !== 'default') {
        return this.validationState
      }
      if (this.error || this.errorMessage) return 'invalid'
      if (this.success || this.successMessage) return 'valid'
      return 'default'
    }

    protected _cls(base: string, key: keyof InputCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-input',
        this.size,
        this.color,
        this.variant,
        this.disabled ? 'disabled' : '',
        this.readonly ? 'readonly' : '',
        this._resolvedValidationState !== 'default' ? `is-${this._resolvedValidationState}` : '',
        this._hasPrefixSlot ? 'has-prefix' : '',
        this._hasSuffixSlot || this.clearable || this._isFile ? 'has-suffix' : '',
        this.value ? 'has-value' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected get _fieldClasses(): string {
      return [
        this._cls('mono-input-field', 'field'),
        this.size,
        this.color,
        this.variant,
        this.disabled ? 'disabled' : '',
        this.readonly ? 'readonly' : '',
        this._resolvedValidationState !== 'default' ? `is-${this._resolvedValidationState}` : '',
        this._hasPrefixSlot ? 'has-prefix' : '',
        this._hasSuffixSlot || this.clearable || this._isFile ? 'has-suffix' : '',
        this.value ? 'has-value' : '',
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected get _isFile(): boolean {
      return this.type === 'file'
    }

    protected get _isRange(): boolean {
      return this.type === 'range'
    }

    /** `min` / `max` / `step` as the native range resolves them (0 / 100 / 1 when unset). */
    protected _rangeBounds(): { min: number; max: number; step: number } {
      const min = this._toOptionalNumber(this.min) ?? 0
      const rawMax = this._toOptionalNumber(this.max) ?? 100
      const max = rawMax < min ? min : rawMax
      const step = this._toOptionalNumber(this.step)
      return { min, max, step: step && step > 0 ? step : 1 }
    }

    /**
     * The value the slider is actually AT, as a string. An empty value is not a position — the
     * native range parks itself at the midpoint — so the readout and the fill follow the native
     * rule rather than reading `''` as 0. The model is not rewritten: nothing was chosen yet.
     */
    protected get _rangeValue(): string {
      const { min, max, step } = this._rangeBounds()
      const typed = this._toOptionalNumber(this.value)
      const target = typed ?? min + (max - min) / 2
      const snapped = min + Math.round((target - min) / step) * step
      const clamped = Math.min(max, Math.max(min, snapped))
      // Strip float noise (0.1 + 0.2) without losing a fractional step.
      return String(Number(clamped.toFixed(10)))
    }

    /** How far along the track the value sits, 0–100 — drives the fill. */
    protected get _rangeProgress(): number {
      const { min, max } = this._rangeBounds()
      if (max === min) return 0
      return ((Number(this._rangeValue) - min) / (max - min)) * 100
    }

    /** The readout text: the value drawn through `format-display`. */
    protected get _rangeText(): string {
      return this._formatDisplay(this._rangeValue, { pad: true })
    }

    /**
     * A native range ignores `readonly`, so a readonly slider would still move. Put the thumb
     * back where the value says and report that the event was handled.
     */
    protected _revertReadonlyRange(event: Event): boolean {
      if (!this._isRange || !this.readonly || this.disabled) return false
      ;(event.currentTarget as HTMLInputElement).value = this._rangeValue
      // The native event would still bubble to the host with a value that never happened.
      event.stopPropagation()
      return true
    }

    /** `modelValue` as an array of files, whatever shape it arrived in (File, File[], null, ''). */
    protected _fileList(): File[] {
      const isFile = (v: unknown): v is File =>
        !!v && typeof v === 'object' && typeof (v as File).name === 'string'
      const v = this.modelValue
      if (Array.isArray(v)) return v.filter(isFile)
      return isFile(v) ? [v] : []
    }

    protected _fileNames(files: File[]): string {
      return files.map((f) => f.name).join(', ')
    }

    protected _openFilePicker(): void {
      if (this.disabled || this.readonly) return
      this._fileEl?.click()
    }

    protected _handleFileKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      this._openFilePicker()
    }

    /** Files above `maxFileSize` are dropped, each one reported through `error`. */
    protected _acceptFiles(files: File[], sourceEvent: Event): File[] {
      const limit = this.maxFileSize
      if (!limit || limit <= 0) return files
      return files.filter((file) => {
        if (file.size <= limit) return true
        const detail: InputFileErrorEventDetail = {
          message: `File "${file.name}" exceeds the maximum size limit.`,
          reason: 'max-file-size',
          file,
          maxFileSize: limit,
          sourceEvent,
        }
        // Plain `error` goes out non-bubbling (mono-event's rule), like mono-file-upload's.
        dispatchMonoEvent(this, 'error', detail)
        return false
      })
    }

    /**
     * The picker's native `input` fires BEFORE its `change`, i.e. before the value below is
     * written — left to bubble, a host `@input` (and a bound form) would read the OLD value. Our
     * own `input` is emitted from the change handler instead.
     */
    protected _swallowNativeInput(event: Event): void {
      event.stopPropagation()
    }

    protected _handleFileChange(event: Event): void {
      // The native `change` is left to bubble: `dispatchMonoEvent` decorates it with the detail.
      if (this.disabled || this.readonly) return
      const input = event.currentTarget as HTMLInputElement
      const files = this._acceptFiles(Array.from(input.files ?? []), event)
      if (!files.length) {
        // Everything was rejected: keep the previous pick, and let the same file be re-picked.
        input.value = ''
        return
      }

      this._internalWrite = true
      const oldValue = this.modelValue
      const nextValue: InputModelValue = this.multiple ? files : files[0]
      this.modelValue = nextValue
      this.value = this._display = this._fileNames(files)

      const detail = this._createModelDetail({ modelValue: nextValue, oldValue, sourceEvent: event })
      this._emitInput(detail)
      this._emitChange(detail)
    }

    protected _createModelDetail(args: {
      modelValue: InputModelValue
      oldValue: InputModelValue
      sourceEvent?: Event
    }): InputModelEventDetail {
      return {
        ...(this._isFile ? { files: this._fileList() } : {}),
        modelValue: args.modelValue,
        currentValue: args.modelValue,
        oldValue: args.oldValue,
        value: args.modelValue,
        // What the field is SHOWING, which after a `format-display` is no longer the value. The
        // form reads `modelValue` (form-control-core's `_valueOf`), so this is purely for a
        // consumer that wants the text as well.
        displayValue: this._display,
        name: this.name,
        sourceEvent: args.sourceEvent,
      }
    }

    protected _emitInput(detail: InputModelEventDetail): void {
      dispatchMonoEvent(this, 'input', detail)
    }
    protected _emitChange(detail: InputModelEventDetail): void {
      dispatchMonoEvent(this, 'change', detail)
    }
    protected _emitClear(detail: InputModelEventDetail): void {
      dispatchMonoEvent(this, 'clear', detail)
    }

    /**
     * Take a format from an ATTRIBUTE.
     *
     * Both format props are `attribute: false`, because a function cannot cross an attribute —
     * so Lit ignores the markup form entirely and this is what puts it back. Two guards, both
     * borrowed from `mono-select`'s `displayValue`, which has exactly this shape:
     *
     * - a function already set through `.prop` is never overwritten by an attribute;
     * - Vue stringifies non-primitive props when it also mirrors them as attributes, so a value
     *   that merely LOOKS like a serialized function is skipped — otherwise the real function,
     *   arriving a tick later, would be clobbered by its own `String()` form.
     */
    protected _setFormatFromAttribute(key: 'formatDisplay' | 'formatValue', next: string | null): void {
      if (typeof this[key] === 'function') return
      const value = next ?? ''
      if (this._looksLikeSerializedFunction(value)) return
      this[key] = value
    }

    protected _looksLikeSerializedFunction(value: string): boolean {
      const trimmed = value.trim()
      if (!trimmed) return false
      return /^(?:asyncs+)?(?:function|([^)]*)s*=>|[A-Za-z_$][w$]*s*=>)/.test(trimmed)
    }

    /** Is either format prop set? Everything below short-circuits when not. */
    protected get _hasFormat(): boolean {
      return !!(this.formatDisplay || this.formatValue)
    }

    /** The display pattern parsed once per read — used for stripping and for caret significance. */
    protected get _displayDescriptor(): InputFormatDescriptor | null {
      const format = this.formatDisplay ?? this.formatValue
      return typeof format === 'string' && format ? parseFormat(format) : null
    }

    /**
     * The text in the field, reduced to what the user actually typed.
     *
     * A function format has no inverse, so there is nothing to strip — the typed text IS the raw
     * value, and a caller using a function owns both directions.
     */
    protected _rawFromDisplay(text: string): string {
      return stripFormat(text, this._displayDescriptor, this.formatLocale)
    }

    /** Re-render the display from the current value. Skipped while focused — see the call site. */
    protected _syncDisplayFromValue(): void {
      const raw = this._rawFromDisplay(String(this.value ?? ''))
      this._display = this._formatDisplay(raw, { pad: true })
    }

    protected _formatDisplay(raw: string, opts: { pad?: boolean } = {}): string {
      if (!this.formatDisplay) return raw

      if (typeof this.formatDisplay === 'function') {
        return String(
          this.formatDisplay({ value: raw, type: this.type, locale: this.formatLocale }) ?? '',
        )
      }

      const descriptor = parseFormat(this.formatDisplay)
      // An unparseable pattern leaves the field alone rather than blanking it mid-keystroke.
      if (!descriptor) return raw
      return applyFormat(raw, descriptor, this.formatLocale, opts)
    }

    protected _formatValue(raw: string): string {
      if (!this.formatValue) return raw

      if (typeof this.formatValue === 'function') {
        return String(
          this.formatValue({ value: raw, type: this.type, locale: this.formatLocale }) ?? '',
        )
      }

      const descriptor = parseFormat(this.formatValue)
      if (!descriptor) return raw
      return normaliseValue(raw, descriptor)
    }

    /**
     * Hold a formatted numeric value inside `min` / `max`.
     *
     * Those two are otherwise INERT on this component. They are forwarded to the native input, and
     * the platform only honours them on `number`, `range` and the date types — while a numeric
     * format REQUIRES `type="text"`, because a native number input blanks itself the moment a
     * grouping separator appears. So `max="100"` on a formatted field did exactly nothing, which
     * is the opposite of what it reads like. This is what gives it meaning.
     *
     * Only the number-pattern path clamps. Everywhere else `min` / `max` keep their native
     * meaning and are simply passed through, so a plain `type="text"` field is untouched —
     * clamping arbitrary text against a number would be nonsense.
     *
     * `max` applies WHILE TYPING; `min` only on commit. The asymmetry is deliberate: a lower
     * bound is crossed on the way to almost every legal value — with `min="10"`, clamping live
     * would rewrite the first `1` to `10` and `15` could never be typed — whereas an upper bound
     * is only ever crossed by overshooting, which is precisely when it should cut.
     *
     * A part-typed value is left alone. `''` and a lone `-` return early, and a trailing decimal
     * point parses to the integer before it, so `"2."` under `max="100"` keeps its point instead
     * of having it deleted from under the caret.
     *
     * Values arriving from OUTSIDE — a `modelValue` binding, a form write-back — are deliberately
     * not clamped: this bounds what a person types, and silently rewriting data handed to the
     * field would hide a mismatch rather than surface it.
     */
    protected _clampRaw(raw: string, opts: { commit?: boolean } = {}): string {
      if (this._displayDescriptor?.kind !== 'number') return raw
      if (!raw || raw === '-') return raw

      const n = Number(raw)
      if (!Number.isFinite(n)) return raw

      const max = this._toOptionalNumber(this.max)
      if (max != null && n > max) return String(max)

      const min = this._toOptionalNumber(this.min)
      if (opts.commit && min != null && n < min) return String(min)

      return raw
    }

    /**
     * Rewrite the field and put the caret back where the user left it.
     *
     * Written IMPERATIVELY rather than through `this._display` alone, and that is the whole trick:
     * lit commits `.value` in a microtask AFTER this handler returns, and the browser parks the
     * caret at the end of any value it is handed. Writing here — synchronously, inside the input
     * event — means the caret can be restored in the same breath, and setting `_display` to the
     * same string afterwards leaves lit's committed value already matching, so it never writes
     * again and never gets the chance to move it.
     */
    protected _applyDisplay(input: HTMLInputElement, next: string, caretBefore: number | null): void {
      const prev = input.value
      if (prev === next) {
        this._display = next
        return
      }

      input.value = next
      this._display = next

      if (caretBefore == null) return
      const significant = significantFor(this._displayDescriptor, this.formatLocale)
      const caret = caretAfterFormat(next, caretBefore, prev, significant)
      try {
        input.setSelectionRange(caret, caret)
      } catch {
        // `setSelectionRange` throws on input types that have no text selection (number, date…).
        // A numeric format needs `type="text"` anyway; losing the caret is better than throwing.
      }
    }

    protected _handleInput(event: Event): void {
      if (this._revertReadonlyRange(event)) return
      if (this.disabled || this.readonly) return
      this._internalWrite = true
      const input = event.currentTarget as HTMLInputElement
      const oldValue = this.modelValue

      // A range's native value is always a bare number — `format-display` only shapes its readout.
      if (!this._hasFormat || this._isRange) {
        const nextValue = input.value
        this.value = nextValue
        this.modelValue = nextValue
        this._display = nextValue
        this._emitInput(this._createModelDetail({ modelValue: nextValue, oldValue, sourceEvent: event }))
        return
      }

      const caret = input.selectionStart
      // `max` only while typing — see `_clampRaw`. When it bites, the display below is rebuilt
      // from the CLAMPED value, so the overshooting text never survives the keystroke.
      const raw = this._clampRaw(this._rawFromDisplay(input.value))
      const nextValue = this._formatValue(raw)

      // `pad: false` — the `0` placeholders of a pattern are only honoured on commit. Padding while
      // typing would write the zeros for you, and the caret would land behind them.
      if (this.formatOn === 'input') {
        this._applyDisplay(input, this._formatDisplay(raw), caret)
      } else {
        this._display = input.value
      }

      this.value = nextValue
      this.modelValue = nextValue
      this._emitInput(this._createModelDetail({ modelValue: nextValue, oldValue, sourceEvent: event }))
    }

    protected _handleChange(event: Event): void {
      if (this._revertReadonlyRange(event)) return
      if (this.disabled || this.readonly) return
      this._internalWrite = true
      const input = event.currentTarget as HTMLInputElement
      const oldValue = this.modelValue

      if (!this._hasFormat || this._isRange) {
        const nextValue = input.value
        this.value = nextValue
        this.modelValue = nextValue
        this._display = nextValue
        this._emitChange(this._createModelDetail({ modelValue: nextValue, oldValue, sourceEvent: event }))
        return
      }

      // Commit: this is where `pad` applies, so `#,##0.00` finally shows its zeros, and where
      // `min` finally applies — a lower bound cannot be enforced mid-word.
      const raw = this._clampRaw(this._rawFromDisplay(input.value), { commit: true })
      const nextValue = this._formatValue(raw)
      this._applyDisplay(input, this._formatDisplay(raw, { pad: true }), null)

      this.value = nextValue
      this.modelValue = nextValue
      this._emitChange(this._createModelDetail({ modelValue: nextValue, oldValue, sourceEvent: event }))
    }

    protected _handleFocus(): void {
      this._focused = true
    }

    protected _handleBlur(): void {
      this._focused = false
      if (this._hasFormat) this._syncDisplayFromValue()
    }

    protected _handleClear(): void {
      if (this.disabled || this.readonly) return
      this._internalWrite = true
      const oldValue = this.modelValue

      if (this._isFile) {
        const empty: InputModelValue = this.multiple ? [] : null
        this.modelValue = empty
        this.value = this._display = ''
        if (this._fileEl) this._fileEl.value = ''
        this._inputEl?.focus()
        const detail = this._createModelDetail({ modelValue: empty, oldValue })
        this._emitInput(detail)
        this._emitChange(detail)
        this._emitClear(detail)
        return
      }

      const nextValue = ''
      this.value = nextValue
      this.modelValue = nextValue
      this._display = nextValue
      if (this._inputEl) {
        this._inputEl.value = nextValue
        this._inputEl.focus()
      }
      const detail = this._createModelDetail({ modelValue: nextValue, oldValue })
      this._emitInput(detail)
      this._emitClear(detail)
    }

    /** Inline sizing applied to the root wrapper. */
    protected _sizeStyle() {
      return buildSizeStyle(this)
    }

    /**
     * The root wrapper, shared by both builds. Its `mono-*` attributes mirror the
     * props one for one and are what input.css styles (`[mono-input][mono-size="sm"]`);
     * a prop at its default emits NO attribute, so the DOM reads exactly like the
     * hand-written CSS-tab markup. The classes stay as inert hooks until 2.0.
     */
    protected _renderWrapper(inner: TemplateResult): TemplateResult {
      const state = this._resolvedValidationState
      return html`<div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-input
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
        mono-label-position=${this.labelPosition === 'top' ? nothing : this.labelPosition}
        mono-validation-position=${this.validationPosition === 'bottom' ? nothing : this.validationPosition}
        mono-validation-state=${state === 'default' ? nothing : state}
        mono-type=${this._isFile || this._isRange ? this.type : nothing}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >${inner}</div>`
    }

    /** Computed aria-label fallback chain (shared by both builds' render()). */
    protected get _ariaLabel(): string | undefined {
      return this.ariaLabelText || this.label || this.placeholder || undefined
    }

    /** id referenced by aria-describedby when a message is shown. */
    protected get _describedBy(): string | undefined {
      return this.validationMessage ||
        this.errorMessage ||
        this.successMessage ||
        this.helperText ||
        this._hasHelperSlot
        ? this._messageId
        : undefined
    }

    /**
     * `type="file"`: a hidden native picker, and in front of it a read-only text input showing
     * the picked name(s). The text input keeps `mono-native` + `.mono-input-native`, so focus,
     * the label's `for`, sizing and the focus ring all behave exactly as on a text field.
     */
    protected _renderFileNative(): TemplateResult {
      return html`
        <input
          type="file"
          mono-file-input
          hidden
          tabindex="-1"
          accept=${ifDefined(this.accept || undefined)}
          ?multiple=${this.multiple}
          name=${ifDefined(this.name || undefined)}
          ?disabled=${this.disabled}
          @input=${this._swallowNativeInput}
          @change=${this._handleFileChange}
        />
        <input
          id=${this._inputId}
          class=${`${this._cls('mono-input-native', 'native')} ${this.size}`}
          mono-native
          mono-file
          type="text"
          readonly
          .value=${this._display}
          placeholder=${ifDefined(this.placeholder || undefined)}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${ifDefined(this._ariaLabel)}
          aria-invalid=${this._resolvedValidationState === 'invalid' ? 'true' : 'false'}
          aria-describedby=${ifDefined(this._describedBy)}
          aria-haspopup="dialog"
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          @click=${this._openFilePicker}
          @keydown=${this._handleFileKeydown}
        />
      `
    }

    /** `type="file"` — the upload glyph at the end of the field; clicking it opens the picker too. */
    protected _renderFileIcon(): TemplateResult | typeof nothing {
      if (!this._isFile) return nothing
      return html`
        <span
          class=${this._cls('mono-input-suffix', 'fileIcon')}
          mono-suffix
          mono-file-icon
          aria-hidden="true"
          @click=${this._openFilePicker}
        >${this.renderIcon('upload')}</span>
      `
    }

    /**
     * `type="range"`: Basecoat's slider. The fill is a gradient stop on the track, so the element
     * writes the position as `--mono-input-range-value` (Basecoat's `--slider-value`) — hand-written
     * markup sets the same property itself.
     */
    protected _renderRangeNative(): TemplateResult {
      const { min, max, step } = this._rangeBounds()
      const text = this._rangeText
      return html`
        <input
          id=${this._inputId}
          class=${`${this._cls('mono-input-native', 'native')} ${this.size}`}
          mono-native
          mono-range
          type="range"
          min=${min}
          max=${max}
          step=${ifDefined(this.step == null ? undefined : step)}
          .value=${this._rangeValue}
          name=${ifDefined(this.name || undefined)}
          style=${`--mono-input-range-value: ${this._rangeProgress}%`}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${ifDefined(this._ariaLabel)}
          aria-valuetext=${ifDefined(text !== this._rangeValue ? text : undefined)}
          aria-readonly=${ifDefined(this.readonly ? 'true' : undefined)}
          aria-invalid=${this._resolvedValidationState === 'invalid' ? 'true' : 'false'}
          aria-describedby=${ifDefined(this._describedBy)}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />
      `
    }

    /**
     * `type="range"` — the value readout. It sits at the end of the LABEL row when there is a
     * label (the EJI ONE layout), and after the slider when there is not; each build calls this
     * from both places and exactly one of them renders. `aria-hidden`: the slider already
     * announces its value (`aria-valuetext` carries the formatted text).
     */
    protected _renderRangeValue(where: 'label' | 'field'): TemplateResult | typeof nothing {
      if (!this._isRange || !this.showValue) return nothing
      const inLabel = !!(this.label || this._hasLabelSlot)
      if ((where === 'label') !== inLabel) return nothing
      return html`<span class=${this._cls('mono-input-range-value', 'rangeValue')} mono-range-value aria-hidden="true">${this._rangeText}</span>`
    }

    /** The native <input>, shared by both builds' render(). */
    protected _renderNative(): TemplateResult {
      if (this._isFile) return this._renderFileNative()
      if (this._isRange) return this._renderRangeNative()
      return html`
        <input
          id=${this._inputId}
          class=${`${this._cls('mono-input-native', 'native')} ${this.size}`}
          mono-native
          type=${this.type}
          .value=${this._display}
          name=${ifDefined(this.name || undefined)}
          placeholder=${ifDefined(this.placeholder || undefined)}
          pattern=${ifDefined(this.pattern || undefined)}
          autocomplete=${ifDefined(this.autocomplete || undefined)}
          inputmode=${ifDefined(this.inputmode || undefined)}
          minlength=${ifDefined(this.minLength)}
          maxlength=${ifDefined(this.maxLength)}
          min=${ifDefined(this.min)}
          max=${ifDefined(this.max)}
          step=${ifDefined(this.step)}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required}
          aria-label=${ifDefined(this._ariaLabel)}
          aria-invalid=${this._resolvedValidationState === 'invalid' ? 'true' : 'false'}
          aria-describedby=${ifDefined(this._describedBy)}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />
      `
    }

    /** The clear button (uses the build-specific icon). */
    protected _renderClear(): TemplateResult | typeof nothing {
      // A slider always has a position, so there is nothing to clear.
      if (this._isRange || !(this.clearable && this.value && !this.disabled && !this.readonly)) {
        return nothing
      }
      return html`
        <button
          type="button"
          class=${this._cls('mono-input-clear', 'clear')}
          mono-clear
          aria-label="Clear input"
          @click=${this._handleClear}
        >
          ${this.renderIcon('close')}
        </button>
      `
    }

    /**
     * Icon hook — overridden per build. Light: global `.mono-icon`/`i-mdi-*`
     * UnoCSS icon. Shadow: inline SVG (global icon CSS can't reach a shadow root).
     */
    protected renderIcon(_name: InputIconName): TemplateResult {
      return html``
    }

    public override focus(options?: FocusOptions): void {
      this._inputEl?.focus(options)
    }

    public override blur(): void {
      this._inputEl?.blur()
    }

    public select(): void {
      this._inputEl?.select()
    }
  }

  return MonoInputCoreClass as unknown as Constructor<MonoInputCoreInterface> & T
}
