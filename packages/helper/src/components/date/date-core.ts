// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  DateType,
  DateSize,
  DateColor,
  DateVariant,
  DateValidationState,
  DateMode,
  DateCssClass,
  DateChangeEventDetail,
} from './date-types.js'
import type { Instance } from 'flatpickr/dist/types/instance'
import type { Options as FlatpickrOptions } from 'flatpickr/dist/types/options'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { MonoFormControlCore } from '../form/form-control-core.js'

const numberStringConverter = {
  fromAttribute(value: string | null): number | undefined {
    if (value === null || value === '') return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  },
  toAttribute(value: number | undefined): string | null {
    return value === undefined || value === null ? null : String(value)
  },
}

let _uid = 0

/**
 * `MonoDateCore` — render-mode-agnostic logic for `mono-date` (props, hybrid
 * aliases, flatpickr instance lifecycle, validation/state, and the full
 * `render()`). SSR-safe: all DOM/`window` access (flatpickr init in
 * `firstUpdated`, the accent read in `_onReady`) is `isServer`-guarded, so the
 * server emits only the field markup and flatpickr is created on the client after
 * hydration. Each build supplies `createRenderRoot()` + `static styles`. Mirrors
 * `textarea-core`/`switch-core`.
 *
 * `mono-date` has no named slots — all content comes from props — so there is no
 * slot capture/scan machinery here. The calendar popup is owned by flatpickr
 * (appended to `<body>`, client-only, styled by the global bundle), so this needs
 * no `PopupPortalController`/`popup-stack`.
 */
export const MonoDateCore = <T extends Constructor<LitElement>>(superClass: T) => {
class MonoDateCoreClass extends MonoFormControlCore(superClass) {
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
      // flatpickr named options (multi-word camelCase only)
      'dateFormat',
      'altInput',
      'altFormat',
      'clickOpens',
      'defaultDate',
      'minDate',
      'maxDate',
      'enableSeconds',
      'hourIncrement',
      'minuteIncrement',
      'defaultHour',
      'defaultMinute',
      'weekNumbers',
      'monthSelectorType',
      'shorthandCurrentMonth',
      'ariaDateFormat',
      // sizing
      'minWidth',
      'maxWidth',
      'minHeight',
      'maxHeight',
    ])

    Object.defineProperty(this, 'css-class', {
      get: () => this.cssClass,
      set: (value: unknown) => this._setCssClass(value),
      configurable: true,
      enumerable: false,
    })
    Object.defineProperty(this, 'cssclass', {
      get: () => this.cssClass,
      set: (value: unknown) => this._setCssClass(value),
      configurable: true,
      enumerable: false,
    })
  }

  static get observedAttributes(): string[] {
    // @ts-ignore — `super` statics are untyped through the generic mixin base.
    const base: string[] = super.observedAttributes ?? []
    return [...base, 'modelvalue', 'css-class', 'cssclass']
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
    if (name === 'css-class' || name === 'cssclass') {
      this._setCssClass(newValue)
    }
  }

  /* ----------------------------- Props ----------------------------- */

  @property({ type: String })
  type: DateType = 'date'

  @property({ attribute: 'model-value', reflect: true })
  modelValue = ''

  @property({ type: String })
  size: DateSize = 'md'

  @property({ type: String })
  color: DateColor = 'primary'

  @property({ type: String })
  variant: DateVariant = 'outlined'

  @property({ type: String })
  label?: string

  @property({ type: String })
  placeholder?: string

  @property({ type: String, attribute: 'helper-text' })
  helperText?: string

  @property({ type: String, attribute: 'validation-state' })
  validationState?: DateValidationState

  @property({ type: String, attribute: 'validation-message' })
  validationMessage?: string

  @property({ converter: booleanStringConverter })
  error = false

  @property({ type: String, attribute: 'error-message' })
  errorMessage?: string

  @property({ converter: booleanStringConverter })
  success = false

  @property({ type: String, attribute: 'success-message' })
  successMessage?: string

  @property({ reflect: true, converter: booleanStringConverter })
  disabled = false

  @property({ reflect: true, converter: booleanStringConverter })
  readonly = false

  @property({ reflect: true, converter: booleanStringConverter })
  required = false

  @property({ converter: booleanStringConverter })
  clearable = false

  @property({ type: String, attribute: 'aria-label-text' })
  ariaLabelText?: string

  /* ----- flatpickr named options ----- */

  @property({ type: String, attribute: 'date-format' })
  dateFormat?: string

  @property({ attribute: 'alt-input', converter: booleanStringConverter })
  altInput?: boolean

  @property({ type: String, attribute: 'alt-format' })
  altFormat?: string

  @property({ converter: booleanStringConverter })
  typeable?: boolean

  /**
   * Normalized `typeable` flag. Frameworks (e.g. Vue) set a bare boolean
   * attribute as the *property* `''` — which bypasses `booleanStringConverter`
   * and is falsy. Treat presence (`''`/`true`/`'true'`) as enabled so typing
   * actually works.
   */
  protected get _typeable(): boolean {
    const v = this.typeable as unknown
    return v === true || v === '' || v === 'true'
  }

  @property({ attribute: 'click-opens', converter: booleanStringConverter })
  clickOpens?: boolean

  @property({ attribute: 'default-date' })
  defaultDate?: FlatpickrOptions['defaultDate']

  @property({ attribute: 'min-date' })
  minDate?: FlatpickrOptions['minDate']

  @property({ attribute: 'max-date' })
  maxDate?: FlatpickrOptions['maxDate']

  @property({ attribute: false })
  disable?: FlatpickrOptions['disable']

  @property({ attribute: false })
  enable?: FlatpickrOptions['enable']

  @property({ type: String })
  mode?: DateMode

  @property({ attribute: 'enable-seconds', converter: booleanStringConverter })
  enableSeconds?: boolean

  @property({ attribute: 'time-24hr', converter: booleanStringConverter })
  time24hr?: boolean

  @property({ attribute: 'hour-increment', converter: numberStringConverter })
  hourIncrement?: number

  @property({ attribute: 'minute-increment', converter: numberStringConverter })
  minuteIncrement?: number

  @property({ attribute: 'default-hour', converter: numberStringConverter })
  defaultHour?: number

  @property({ attribute: 'default-minute', converter: numberStringConverter })
  defaultMinute?: number

  @property({ converter: booleanStringConverter })
  inline?: boolean

  @property({ attribute: 'week-numbers', converter: booleanStringConverter })
  weekNumbers?: boolean

  @property({ attribute: 'month-selector-type' })
  monthSelectorType?: 'dropdown' | 'static'

  @property({ attribute: 'shorthand-current-month', converter: booleanStringConverter })
  shorthandCurrentMonth?: boolean

  @property({ type: String })
  position?: FlatpickrOptions['position']

  @property({ type: String, attribute: 'aria-date-format' })
  ariaDateFormat?: string

  @property({ attribute: false })
  locale?: FlatpickrOptions['locale']

  /** Escape hatch — any other flatpickr option, merged into the config. */
  @property({ attribute: false })
  options?: Partial<FlatpickrOptions>

  /* ----- sizing ----- */
  @property({ type: String }) width?: CssSizeValue
  @property({ type: String }) height?: CssSizeValue
  @property({ type: String, attribute: 'min-width' }) minWidth?: CssSizeValue
  @property({ type: String, attribute: 'max-width' }) maxWidth?: CssSizeValue
  @property({ type: String, attribute: 'min-height' }) minHeight?: CssSizeValue
  @property({ type: String, attribute: 'max-height' }) maxHeight?: CssSizeValue

  @property({ attribute: false })
  cssClass: DateCssClass = {}

  @property({ attribute: false })
  cssClassName = ''

  @state()
  protected _hasValue = false

  @query('.mono-date-native')
  protected _nativeEl?: HTMLInputElement

  private _fp: Instance | null = null
  /** Invalidates in-flight async builds (the dynamic `import('flatpickr')`). */
  private _buildToken = 0
  private _id = `mono-date-${++_uid}`

  /** Config keys whose change requires re-creating the flatpickr instance. */
  private static readonly _configKeys = [
    'type', 'options', 'mode', 'inline', 'locale',
    'dateFormat', 'altInput', 'altFormat', 'typeable', 'clickOpens',
    'defaultDate', 'minDate', 'maxDate', 'disable', 'enable', 'enableSeconds',
    'time24hr', 'hourIncrement', 'minuteIncrement', 'defaultHour',
    'defaultMinute', 'weekNumbers', 'monthSelectorType', 'shorthandCurrentMonth',
    'position', 'ariaDateFormat', 'disabled', 'readonly',
  ]

  /* ----------------------------- Lifecycle ----------------------------- */

  override willUpdate(changed: Map<string, unknown>): void {
    super.willUpdate?.(changed)
    // SSR (nuxt-ssr-lit) can set a boolean prop to a raw string (e.g. '');
    // coerce the render-affecting flags so render() sees real booleans and
    // hydration matches. (see project_shadow_boolean_prop_ssr)
    for (const key of ['error', 'success', 'disabled', 'readonly', 'required', 'clearable'] as const) {
      const v = this[key] as unknown
      if (typeof v !== 'boolean') {
        ;(this as unknown as Record<string, unknown>)[key] = this._toBoolean(v)
      }
    }
  }

  protected _toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim()
      return normalized === '' || normalized === 'true'
    }
    return Boolean(value)
  }

  protected override async firstUpdated(): Promise<void> {
    await this._ensurePicker()
  }

  /**
   * Build the picker if there isn't one — idempotent, and safe to call from every
   * update.
   *
   * Creation used to live only in `firstUpdated`, which Lit runs exactly once. After
   * a disconnect (`v-if`, `<KeepAlive>`, a Vue node move) `disconnectedCallback`
   * destroyed the instance and nothing ever rebuilt it, so the field rendered but had
   * no picker at all — every `open`/`close`/`toggle` was a silent `this._fp?.` no-op.
   * `chart-core` self-heals the same way.
   *
   * The `isConnected` re-check after the await matters just as much: without it, an
   * element disconnected *during* the dynamic import would construct a flatpickr on a
   * detached input that nothing would ever destroy — leaking its calendar DOM and the
   * four document/window listeners flatpickr binds.
   */
  private async _ensurePicker(): Promise<void> {
    if (isServer || this._fp || !this._nativeEl) return

    const token = ++this._buildToken
    const { default: flatpickr } = await import('flatpickr')
    if (token !== this._buildToken || !this.isConnected || !this._nativeEl || this._fp) return

    this._fp = flatpickr(this._nativeEl, this._buildConfig())
    this._hasValue = Boolean(this.modelValue)
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated?.(changed)
    // Re-create after a reconnect rather than bailing out forever.
    if (!this._fp) {
      void this._ensurePicker()
      return
    }

    if (MonoDateCoreClass._configKeys.some((k) => changed.has(k))) {
      this._rebuild()
      return
    }
    if (changed.has('modelValue')) {
      this._applyModelValue()
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    // Rebuild here, not only from `updated()`: a plain reattach schedules no update
    // at all, so `updated()` never runs and the field would come back with no picker.
    if (!isServer) void this._ensurePicker()
  }

  override disconnectedCallback(): void {
    // Invalidate any in-flight build so a pending import can't resurrect a picker
    // on a detached input after we've torn this one down.
    this._buildToken++
    this._fp?.destroy()
    this._fp = null
    super.disconnectedCallback()
  }

  /* ----------------------------- flatpickr glue ----------------------------- */

  private _buildConfig(): FlatpickrOptions {
    const typeDefaults: Partial<FlatpickrOptions> =
      this.type === 'time'
        ? { enableTime: true, noCalendar: true }
        : this.type === 'datetime'
          ? { enableTime: true }
          : {}

    const named: Record<string, unknown> = {}
    const str = (k: string, v: unknown) => {
      if (v !== undefined && v !== '') named[k] = v
    }
    const any = (k: string, v: unknown) => {
      if (v !== undefined) named[k] = v
    }

    str('dateFormat', this.dateFormat)
    any('altInput', this.altInput)
    str('altFormat', this.altFormat)
    any('allowInput', this._typeable)
    any('clickOpens', this.clickOpens)
    any('defaultDate', this.defaultDate)
    any('minDate', this.minDate)
    any('maxDate', this.maxDate)
    any('disable', this.disable)
    any('enable', this.enable)
    str('mode', this.mode)
    any('enableSeconds', this.enableSeconds)
    any('time_24hr', this.time24hr)
    any('hourIncrement', this.hourIncrement)
    any('minuteIncrement', this.minuteIncrement)
    any('defaultHour', this.defaultHour)
    any('defaultMinute', this.defaultMinute)
    any('inline', this.inline)
    any('weekNumbers', this.weekNumbers)
    str('monthSelectorType', this.monthSelectorType)
    any('shorthandCurrentMonth', this.shorthandCurrentMonth)
    str('position', this.position)
    str('ariaDateFormat', this.ariaDateFormat)
    any('locale', this.locale)

    const config: FlatpickrOptions = {
      ...typeDefaults,
      ...(this.options ?? {}),
      ...named,
      onReady: [(_d, _s, instance) => this._onReady(instance)],
      onChange: [(dates, dateStr, instance) => this._onChange(dates, dateStr, instance)],
      onOpen: [(dates, _s, instance) => this._emitOpenClose('open', dates, instance)],
      onClose: [(dates, _s, instance) => this._emitOpenClose('close', dates, instance)],
    } as FlatpickrOptions

    // modelValue is the source of truth for the initial selection.
    if (this.modelValue) config.defaultDate = this.modelValue
    // Disabled / readonly fields shouldn't open the picker.
    if (this.disabled || this.readonly) config.clickOpens = false

    return config
  }

  /**
   * Open / close the calendar. flatpickr owns the popup, so these just forward
   * to the instance — but they give `mono-date` the same `open()`/`close()`/
   * `toggle()` surface as `mono-select` and `mono-dropdown-table`, which lets
   * anything driving an editor generically (e.g. the data grid opening the
   * focused inline editor on `Enter`) treat all of them the same.
   */
  /** Whether the calendar is currently open. */
  public get isOpen(): boolean {
    return !!this._fp?.isOpen
  }

  public open(): void {
    if (this.disabled || this.readonly) return
    this._fp?.open()
  }

  public close(): void {
    this._fp?.close()
  }

  public toggle(): void {
    if (this._fp?.isOpen) this.close()
    else this.open()
  }

  private _rebuild(): void {
    if (!this._nativeEl) return
    const open = this._fp?.isOpen
    this._fp?.destroy()
    this._fp = null
    // Token + `isConnected`: overlapping rebuilds (or a disconnect mid-import) would
    // otherwise let a superseded build assign a live picker that nothing destroys.
    const token = ++this._buildToken
    // re-import is cached by the bundler; flatpickr was already loaded once.
    import('flatpickr').then(({ default: flatpickr }) => {
      if (token !== this._buildToken || !this.isConnected || !this._nativeEl) return
      this._fp = flatpickr(this._nativeEl, this._buildConfig())
      if (open) this._fp.open()
    })
  }

  private _applyModelValue(): void {
    // `false` = don't trigger onChange, so parent-driven updates can't loop.
    this._fp?.setDate(this.modelValue || '', false)
    this._hasValue = Boolean(this.modelValue)
  }

  /**
   * Tag the calendar so our CSS only targets our pickers, and copy the host's
   * resolved accent onto it (the calendar lives in <body> and can't inherit the
   * field's `--date-primary`, so it follows the `color` prop via `--cal-accent`).
   *
   * The accent variable is declared on the `.mono-date` element (the inner
   * wrapper), which in the shadow build lives inside the shadow root — reading
   * from the host (`this`) would return empty. Read from that wrapper instead;
   * in the light build `renderRoot === this` and `.mono-date` is the child, so
   * this resolves correctly for both.
   */
  private _onReady(instance: Instance): void {
    if (isServer) return
    const cal = instance.calendarContainer
    if (!cal) return
    cal.classList.add('mono-flatpickr')
    const scope =
      (this.renderRoot as ParentNode).querySelector?.('[mono-date]') ?? (this as unknown as Element)
    const cs = getComputedStyle(scope as Element)
    // The calendar's selected-day colour follows the `color` prop: `--primary` for
    // the default, the role token otherwise (date.css publishes it per colour).
    const accent = cs.getPropertyValue('--_mono-date-calendar-accent').trim()
    const accentFg = cs.getPropertyValue('--_mono-date-primary-foreground').trim()
    if (accent) cal.style.setProperty('--cal-accent', accent)
    if (accentFg) cal.style.setProperty('--cal-accent-foreground', accentFg)
  }

  /**
   * Live "type-to-pick" — as the user types into the field (requires
   * `typeable`), parse the text with flatpickr's own parser and navigate /
   * select the matching date the moment a complete value is entered.
   */
  private _onTyping = (event: Event): void => {
    if (!this._fp || !this._typeable || this.disabled || this.readonly) return
    // Multi-value typing is finalized by flatpickr on Enter/blur.
    if (this.mode === 'range' || this.mode === 'multiple') return

    const raw = (event.target as HTMLInputElement).value
    if (!raw.trim()) return

    const fmt = this._fp.config.dateFormat
    const parsed = this._fp.parseDate(raw, fmt)
    if (!parsed) return

    // Navigate the open calendar to follow what's being typed.
    this._fp.jumpToDate(parsed)

    // Only select once the text is a complete, exact date (round-trips through
    // the format). Because the formatted value equals what's typed, setting it
    // doesn't rewrite the field, so the caret doesn't jump. Programmatic setDate
    // doesn't fire `input`, so there's no loop.
    if (this._fp.formatDate(parsed, fmt) === raw) {
      this._fp.setDate(parsed, true)
    }
  }

  private _onChange(dates: Date[], dateStr: string, instance: Instance): void {
    this.modelValue = dateStr
    this._hasValue = Boolean(dateStr)

    const detail: DateChangeEventDetail = {
      value: dateStr,
      modelValue: dateStr,
      dates,
      instance,
    }

    // flatpickr runs its `onChange` hooks and THEN dispatches a native, bubbling
    // `change` (and `input`) on the field, synchronously. In the light build that
    // native change reaches the host on its own — so the plain `change` must be
    // THAT event, decorated, or a consumer's `@change` would fire twice per pick.
    // Catch it as it leaves the field; if it never comes (a path that skips it),
    // the microtask fallback reports without a source.
    const native = this._nativeEl
    let done = false
    const onNative = (event: Event): void => {
      done = true
      dispatchMonoEvent(this, 'change', detail, { sourceEvent: event })
    }
    native?.addEventListener('change', onNative, { once: true, capture: true })
    queueMicrotask(() => {
      if (done) return
      done = true
      native?.removeEventListener('change', onNative, { capture: true })
      dispatchMonoEvent(this, 'change', detail)
    })
  }

  private _emitOpenClose(kind: 'open' | 'close', dates: Date[], instance: Instance): void {
    dispatchMonoEvent(this, kind, { dates, instance })
  }

  private _clear(): void {
    this._fp?.clear()
    this.modelValue = ''
    this._hasValue = false

    const detail: DateChangeEventDetail = {
      value: '',
      modelValue: '',
      dates: [],
      instance: this._fp,
    }
    dispatchMonoEvent(this, 'change', detail)
  }

  /* ----------------------------- Render ----------------------------- */

  private _setCssClass(value: unknown): void {
    if (value == null) {
      this.cssClass = {}
      this.cssClassName = ''
      return
    }
    if (typeof value === 'object') {
      this.cssClass = value as DateCssClass
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
          this.cssClass = JSON.parse(trimmed) as DateCssClass
          return
        } catch {
          /* fall through */
        }
      }
      this.cssClassName = trimmed
    }
  }

  private _cls(base: string, key: keyof DateCssClass): string {
    const extra = this.cssClass?.[key]
    return extra ? `${base} ${extra}` : base
  }

  private get _resolvedState(): DateValidationState {
    if (this.error) return 'error'
    if (this.success) return 'success'
    return this.validationState ?? 'default'
  }

  private get _message(): string | undefined {
    if (this._resolvedState === 'error') {
      return this.errorMessage || this.validationMessage || undefined
    }
    if (this._resolvedState === 'success') {
      return this.successMessage || this.validationMessage || undefined
    }
    return this.helperText || undefined
  }

  private get _wrapperClasses(): string {
    return [
      'mono-date',
      this.size,
      this.color,
      this.variant,
      this.disabled ? 'disabled' : '',
      this.readonly ? 'readonly' : '',
      this.required ? 'required' : '',
      this._hasValue ? 'has-value' : '',
      this._resolvedState !== 'default' ? `is-${this._resolvedState}` : '',
      this.cssClassName || '',
      this.cssClass?.root || '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  private get _fieldClasses(): string {
    return [
      this._cls('mono-date-field', 'field'),
      this.size,
      this.color,
      this.variant,
      this._resolvedState !== 'default' ? `is-${this._resolvedState}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  private _icon(): TemplateResult {
    return this.renderIcon(this.type === 'time' ? 'clock' : 'calendar')
  }

  /**
   * Icon hook. Light build (default): the global `.mono-icon` / `i-mdi-*` UnoCSS
   * icon. Shadow overrides with inline SVG (UnoCSS mask rules can't reach a
   * shadow root — they'd render as a solid "black cube").
   */
  protected renderIcon(name: 'calendar' | 'clock' | 'close'): TemplateResult {
    const cls =
      name === 'calendar'
        ? 'i-mdi-calendar-outline'
        : name === 'clock'
          ? 'i-mdi-clock-outline'
          : 'i-mdi-close'
    return html`<span class=${`mono-icon ${cls}`} mono-icon aria-hidden="true"></span>`
  }

  /**
   * The wrapper renders unconditionally, like input / select / tag-input. The
   * wrapper is a grid child, so returning `nothing` when there is no message left
   * date's block exactly one row-gap shorter than its siblings' — visible as soon
   * as a labelled date sits beside a labelled input in the same row.
   */
  private _renderMessage(): TemplateResult {
    const msg = this._message
    return html`
      <div class=${this._cls('mono-date-message-wrap', 'messageWrap')} mono-message-wrap>
        ${msg
          ? html`<div
              class=${`${this._cls('mono-date-message', 'message')} ${this._resolvedState}`}
              mono-message=${this._resolvedState === 'default' ? 'helper' : this._resolvedState}
              role=${this._resolvedState === 'error' ? 'alert' : nothing}
            >${msg}</div>`
          : nothing}
      </div>
    `
  }

  protected override render(): TemplateResult {
    // The wrapper's `mono-*` attributes mirror the props one for one and are what
    // date.css styles (`[mono-date][mono-size="sm"]`); a prop at its default emits
    // NO attribute. The classes stay as inert hooks until 2.0.
    const state = this._resolvedState
    return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(buildSizeStyle(this))}
        mono-date
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
        mono-validation-state=${state === 'default' ? nothing : state}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
      >
        ${this.label
          ? html`<label class=${this._cls('mono-date-label', 'label')} mono-label for=${this._id}>
              ${this.label}${this.required
                ? html`<span class=${this._cls('mono-date-required', 'required')} mono-required-mark>*</span>`
                : nothing}
            </label>`
          : nothing}

        <div class=${this._fieldClasses} mono-field>
          <span class=${this._cls('mono-date-icon', 'icon')} mono-prefix aria-hidden="true">${this._icon()}</span>
          <input
            class=${this._cls('mono-date-native', 'native')}
            mono-native
            id=${this._id}
            type="text"
            placeholder=${ifDefined(this.placeholder)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly && !this._typeable}
            aria-label=${ifDefined(this.ariaLabelText || this.label || undefined)}
            @input=${this._onTyping}
          />
          ${this.clearable && this._hasValue && !this.disabled && !this.readonly
            ? html`<button
                type="button"
                class=${this._cls('mono-date-clear', 'clear')}
                mono-clear
                aria-label="Clear"
                @click=${this._clear}
              >
                ${this.renderIcon('close')}
              </button>`
            : nothing}
        </div>

        ${this._renderMessage()}
      </div>
    `
  }
}

  return MonoDateCoreClass as unknown as Constructor<MonoDateCoreInterface> & T
}

/** Public surface added by the core mixin. */
export declare class MonoDateCoreInterface {
  type: DateType
  modelValue: string
  size: DateSize
  color: DateColor
  variant: DateVariant
  label?: string
  placeholder?: string
  helperText?: string
  validationState?: DateValidationState
  validationMessage?: string
  error: boolean
  errorMessage?: string
  success: boolean
  successMessage?: string
  disabled: boolean
  readonly: boolean
  required: boolean
  clearable: boolean
  ariaLabelText?: string
  dateFormat?: string
  altInput?: boolean
  altFormat?: string
  typeable?: boolean
  clickOpens?: boolean
  defaultDate?: FlatpickrOptions['defaultDate']
  minDate?: FlatpickrOptions['minDate']
  maxDate?: FlatpickrOptions['maxDate']
  disable?: FlatpickrOptions['disable']
  enable?: FlatpickrOptions['enable']
  mode?: DateMode
  enableSeconds?: boolean
  time24hr?: boolean
  hourIncrement?: number
  minuteIncrement?: number
  defaultHour?: number
  defaultMinute?: number
  inline?: boolean
  weekNumbers?: boolean
  monthSelectorType?: 'dropdown' | 'static'
  shorthandCurrentMonth?: boolean
  position?: FlatpickrOptions['position']
  ariaDateFormat?: string
  locale?: FlatpickrOptions['locale']
  options?: Partial<FlatpickrOptions>
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  cssClass: DateCssClass
  cssClassName: string
  readonly isOpen: boolean
  open(): void
  close(): void
  toggle(): void

  // Shared-protected surface overridden by the shadow wrapper.
  protected renderIcon(name: 'calendar' | 'clock' | 'close'): TemplateResult
}
