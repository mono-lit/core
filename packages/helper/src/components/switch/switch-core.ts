// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import type {
  SwitchSize,
  SwitchColor,
  SwitchCssClass,
  SwitchModelEventDetail,
} from './switch-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { MonoFormControlCore } from '../form/form-control-core.js'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoSwitchCoreInterface {
  size: SwitchSize
  color: SwitchColor
  modelValue: boolean
  checked: boolean
  disabled: boolean
  loading: boolean
  label: string
  /** Secondary line under the label. */
  sublabel: string
  /** The same as `sublabel`, kept for existing code. */
  description: string
  value: string
  name: string
  ariaLabelText?: string
  cssClass: SwitchCssClass
  cssClassName: string
  focus(): void
  blur(): void

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected _hasLabelSlotState: boolean
  protected _hasDescriptionSlotState: boolean
  protected _toBoolean(value: unknown): boolean
  protected _setCssClass(value: unknown): void
  protected _cls(base: string, key: keyof SwitchCssClass): string
  protected get _wrapperClasses(): string
  protected get _trackClasses(): string
  protected get _thumbClasses(): string
  protected _hasLabelContent(): boolean
  protected _hasDescriptionContent(): boolean
  protected _handleChange(event: Event): void
  protected _renderLabelBlock(): TemplateResult | typeof nothing
}

/**
 * `MonoSwitchCore` — all render-mode-agnostic logic for `mono-switch`: reactive
 * props (incl. SSR boolean coercion), hybrid aliases, camelCase attribute
 * fallbacks, the `modelValue`↔`checked` sync, class computation, change
 * interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
 * skeleton (`<label><input role=switch><track><thumb></track><labelBlock></label>`).
 * The slot-bearing label/description region is an overridable hook
 * (`_renderLabelBlock()`) that defaults to the light build's `[data-mono-slot]`
 * placeholders; the shadow build overrides it with native `<slot>` (mirrors
 * `mono-checkbox`). SSR-safe: no `document`/`window`; `focus`/`blur` query
 * `this.renderRoot`.
 */
export const MonoSwitchCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoSwitchCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, ['modelValue', 'ariaLabelText', 'cssClass'])
      // `description` is the other name of `sublabel` — one storage, so both
      // names read and write the same text.
      defineHybridPropAlias(this, 'description', 'sublabel')

      // Vue interop: <mono-switch :cssClass|:css-class|:cssclass="...">
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
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'modelvalue',
        'arialabeltext',
        'arialabel',
        // `description` — the other name of `sublabel`
        'description',
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
        this.modelValue = this._toBoolean(newValue)
        return
      }

      if (name === 'arialabeltext' || name === 'arialabel') {
        this.ariaLabelText = newValue ?? undefined
        return
      }

      if (name === 'description') {
        this.sublabel = newValue ?? ''
        return
      }

      if (name === 'css-class' || name === 'cssclass') {
        this._setCssClass(newValue)
      }
    }

    @property({ type: String })
    size: SwitchSize = 'md'

    @property({ type: String })
    color: SwitchColor = 'primary'

    @property({ attribute: 'model-value', reflect: true, converter: booleanStringConverter })
    modelValue = false

    @property({ reflect: true, converter: booleanStringConverter })
    checked = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    loading = false

    @property({ type: String })
    label = ''

    /** Secondary line under the label (`slot="sublabel"` replaces it). */
    @property({ type: String })
    sublabel = ''

    /** The same as `sublabel` — an instance accessor (see constructor). */
    declare description: string

    @property({ type: String })
    value = ''

    @property({ type: String })
    name = ''

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ attribute: false })
    cssClass: SwitchCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    @state()
    protected _hasLabelSlotState = false

    @state()
    protected _hasDescriptionSlotState = false

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards bare boolean attributes as the PROPERTY string `""`
      // (these use `booleanStringConverter`, not `type:Boolean`). Coerce so the
      // server and client renders match. See project_shadow_boolean_prop_ssr.
      for (const key of ['modelValue', 'checked', 'disabled', 'loading'] as const) {
        if (typeof (this as any)[key] === 'string') {
          ;(this as any)[key] = this._toBoolean((this as any)[key])
        }
      }

      if (changed.has('modelValue') && this.checked !== this.modelValue) {
        this.checked = this.modelValue
      }
      if (changed.has('checked') && this.modelValue !== this.checked) {
        this.modelValue = this.checked
      }

      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    protected _toBoolean(value: unknown): boolean {
      if (typeof value === 'boolean') return value

      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim()
        return normalized === '' || normalized === 'true'
      }

      return Boolean(value)
    }

    protected _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }

      if (typeof value === 'object') {
        this.cssClass = value as SwitchCssClass
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
            this.cssClass = JSON.parse(trimmed) as SwitchCssClass
            return
          } catch {
            // fallback to root class below
          }
        }

        this.cssClassName = trimmed
      }
    }

    protected _cls(base: string, key: keyof SwitchCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-switch',
        this.size,
        this.color,
        this.disabled ? 'disabled' : '',
        this.loading ? 'loading' : '',
        this.checked ? 'mono-switch-checked' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected get _inputClasses(): string {
      return this._cls('mono-switch-input', 'input')
    }

    protected get _trackClasses(): string {
      return [this._cls('mono-switch-track', 'track'), this.size]
        .filter(Boolean)
        .join(' ')
    }

    protected get _thumbClasses(): string {
      return [this._cls('mono-switch-thumb', 'thumb'), this.size]
        .filter(Boolean)
        .join(' ')
    }

    protected _hasLabelContent(): boolean {
      return Boolean(this.label) || this._hasLabelSlotState
    }

    protected _hasDescriptionContent(): boolean {
      return Boolean(this.sublabel) || this._hasDescriptionSlotState
    }

    private _createModelDetail(args: {
      modelValue: boolean
      oldValue: boolean
      sourceEvent?: Event
    }): SwitchModelEventDetail {
      return {
        modelValue: args.modelValue,
        currentValue: args.modelValue,
        oldValue: args.oldValue,
        checked: args.modelValue,
        value: this.value,
        name: this.name,
        sourceEvent: args.sourceEvent,
      }
    }

    private _emitChange(detail: SwitchModelEventDetail): void {
      // Plain `change`: the native change decorated (light) / synthesized (shadow).
      dispatchMonoEvent(this, 'change', detail)
    }

    protected _handleChange(event: Event): void {
      if (this.disabled || this.loading) return

      const input = event.currentTarget as HTMLInputElement
      const oldValue = this.modelValue
      const nextValue = input.checked

      this.checked = nextValue
      this.modelValue = nextValue

      const detail = this._createModelDetail({
        modelValue: nextValue,
        oldValue,
        sourceEvent: event,
      })

      this._emitChange(detail)
    }

    /** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
    protected _renderLabelBlock(): TemplateResult | typeof nothing {
      if (!this._hasLabelContent() && !this._hasDescriptionContent()) {
        return nothing
      }

      return html`
        <span class=${this._cls('mono-switch-label', 'label')} mono-label>
          ${this._hasLabelContent()
            ? html`
                <span class=${this._cls('mono-switch-label-text', 'labelText')} mono-label-text>
                  ${this._hasLabelSlotState
                    ? html`<span data-mono-slot="label"></span>`
                    : this.label}
                </span>
              `
            : nothing}

          ${this._hasDescriptionContent()
            ? html`
                <span class=${this._cls('mono-switch-label-description', 'description')} mono-description>
                  ${this._hasDescriptionSlotState
                    ? html`<span data-mono-slot="description"></span>`
                    : this.sublabel}
                </span>
              `
            : nothing}
        </span>
      `
    }

    protected override render(): TemplateResult {
      const ariaLabel =
        this.ariaLabelText ||
        this.label ||
        (this._hasLabelSlotState ? 'Switch' : undefined)

      return html`
        <label
          class=${this._wrapperClasses}
          mono-switch
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          ?mono-checked=${this.checked}
          ?mono-disabled=${this.disabled}
          ?mono-loading=${this.loading}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="checkbox"
            role="switch"
            .checked=${this.checked}
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            ?disabled=${this.disabled || this.loading}
            aria-checked=${String(this.checked)}
            aria-label=${ifDefined(ariaLabel)}
            @change=${this._handleChange}
          />

          <span class=${this._trackClasses} mono-track aria-hidden="true">
            <span class=${this._thumbClasses} mono-thumb></span>
          </span>

          ${this._renderLabelBlock()}
        </label>
      `
    }

    public override focus(options?: FocusOptions): void {
      const input = (this.renderRoot as ParentNode).querySelector(
        '.mono-switch-input',
      ) as HTMLInputElement | null
      input?.focus(options)
    }

    public override blur(): void {
      const input = (this.renderRoot as ParentNode).querySelector(
        '.mono-switch-input',
      ) as HTMLInputElement | null
      input?.blur()
    }
  }

  return MonoSwitchCoreClass as unknown as Constructor<MonoSwitchCoreInterface> & T
}
