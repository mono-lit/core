// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import type {
  RadioSize,
  RadioColor,
  RadioValue,
  RadioModelEventDetail,
  RadioCssClass,
} from './radio-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { MonoFormControlCore } from '../form/form-control-core.js'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoRadioCoreInterface {
  size: RadioSize
  color: RadioColor
  value: RadioValue
  modelValue: RadioValue
  disabled: boolean
  label: string
  /** Secondary line under the label. */
  sublabel: string
  /** The same as `sublabel`, kept for existing code. */
  description: string
  ariaLabelText?: string
  cssClass: RadioCssClass
  cssClassName: string
  focus(): void
  blur(): void

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected _hasLabelSlotState: boolean
  protected _hasDescriptionSlotState: boolean
  protected _setCssClass(value: unknown): void
  protected _toRadioValue(value: unknown): RadioValue
  protected _cls(base: string, key: keyof RadioCssClass): string
  protected get _checked(): boolean
  protected get _wrapperClasses(): string
  protected _hasLabelContent(): boolean
  protected _hasDescriptionContent(): boolean
  protected _handleChange(event: Event): void
  protected _renderLabelBlock(): TemplateResult | typeof nothing
}

/**
 * `MonoRadioCore` — all render-mode-agnostic logic for `mono-radio`: reactive
 * props (incl. SSR `disabled` coercion), hybrid aliases (incl. the
 * `ariaLabel`/`aria-label`/`arialabel` → `ariaLabelText` getters), camelCase
 * attribute fallbacks, class computation, the `mno-change` interactivity, and the
 * shared `<label><input><circle><dot></circle><labelBlock></label>` `render()`
 * (the radio dot is pure CSS — no icons). Only the label/description region is a
 * hook (`_renderLabelBlock`) — the light build uses `data-mono-slot`, the shadow
 * build native `<slot>` (mirrors `mono-checkbox`).
 *
 * SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
 */
export const MonoRadioCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoRadioCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, ['modelValue', 'ariaLabelText', 'cssClass'])
      // `description` is the other name of `sublabel` — one storage, so both
      // names read and write the same text.
      defineHybridPropAlias(this, 'description', 'sublabel')

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

      // `ariaLabel` / `aria-label` / `arialabel` all map to `ariaLabelText`.
      for (const name of ['ariaLabel', 'aria-label', 'arialabel']) {
        Object.defineProperty(this, name, {
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
      return [...base, 'modelvalue', 'arialabeltext', 'description', 'arialabel', 'css-class', 'cssclass']
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'modelvalue') {
        this.modelValue = this._toRadioValue(newValue)
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
    size: RadioSize = 'md'

    @property({ type: String })
    color: RadioColor = 'primary'

    @property({ type: String })
    value: RadioValue = ''

    @property({ type: String, attribute: 'model-value', reflect: true })
    modelValue: RadioValue = ''

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ type: String })
    label = ''

    /** Secondary line under the label (`slot="sublabel"` replaces it). */
    @property({ type: String })
    sublabel = ''

    /** The same as `sublabel` — an instance accessor (see constructor). */
    declare description: string

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ attribute: false })
    cssClass: RadioCssClass = {}

    @property({ type: String, attribute: false })
    cssClassName = ''

    @state()
    protected _hasLabelSlotState = false

    @state()
    protected _hasDescriptionSlotState = false

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards a bare boolean attribute as the PROPERTY string `""`
      // (booleanStringConverter, not type:Boolean). Coerce so server/client match.
      if (typeof (this.disabled as unknown) === 'string') {
        const normalized = (this.disabled as unknown as string).toLowerCase().trim()
        this.disabled = normalized === '' || normalized === 'true'
      }
      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    protected _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }
      if (typeof value === 'object') {
        this.cssClass = value as RadioCssClass
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
            this.cssClass = JSON.parse(trimmed) as RadioCssClass
            return
          } catch {
            // fall through to root class
          }
        }
        this.cssClassName = trimmed
      }
    }

    protected _toRadioValue(value: unknown): RadioValue {
      if (value === undefined || value === null) return ''
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return value
      return String(value)
    }

    protected _cls(base: string, key: keyof RadioCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _checked(): boolean {
      return this.modelValue === this.value
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-radio',
        this.size,
        this.color,
        this.disabled ? 'disabled' : '',
        this._checked ? 'mono-radio-checked' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected get _inputClasses(): string {
      return this._cls('mono-radio-input', 'input')
    }

    protected get _circleClasses(): string {
      return [this._cls('mono-radio-circle', 'circle'), this.size].filter(Boolean).join(' ')
    }

    protected get _dotClasses(): string {
      return [this._cls('mono-radio-dot', 'dot'), this.size].filter(Boolean).join(' ')
    }

    protected _hasLabelContent(): boolean {
      return Boolean(this.label) || this._hasLabelSlotState
    }

    protected _hasDescriptionContent(): boolean {
      return Boolean(this.sublabel) || this._hasDescriptionSlotState
    }

    private _createModelDetail(args: {
      modelValue: RadioValue
      oldValue: RadioValue
      sourceEvent?: Event
    }): RadioModelEventDetail {
      return {
        modelValue: args.modelValue,
        currentValue: args.modelValue,
        oldValue: args.oldValue,
        value: this.value,
        checked: args.modelValue === this.value,
        sourceEvent: args.sourceEvent,
      }
    }

    private _emitChange(detail: RadioModelEventDetail): void {
      // Plain `change`: the native change decorated (light) / synthesized (shadow).
      dispatchMonoEvent(this, 'change', detail)
    }

    protected _handleChange(event: Event): void {
      if (this.disabled) return

      const input = event.currentTarget as HTMLInputElement
      if (!input.checked) return

      const oldValue = this.modelValue
      const nextValue = this.value

      this.modelValue = nextValue

      const detail = this._createModelDetail({ modelValue: nextValue, oldValue, sourceEvent: event })
      this._emitChange(detail)
    }

    /** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
    protected _renderLabelBlock(): TemplateResult | typeof nothing {
      if (!this._hasLabelContent() && !this._hasDescriptionContent()) {
        return nothing
      }

      return html`
        <span class=${this._cls('mono-radio-label', 'label')} mono-label>
          ${this._hasLabelContent()
            ? html`
                <span class=${this._cls('mono-radio-label-text', 'labelText')} mono-label-text>
                  ${this._hasLabelSlotState
                    ? html`<span data-mono-slot="label"></span>`
                    : this.label}
                </span>
              `
            : nothing}

          ${this._hasDescriptionContent()
            ? html`
                <span class=${this._cls('mono-radio-label-description', 'description')} mono-description>
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
        (this._hasLabelSlotState ? 'Radio option' : undefined)

      return html`
        <label
          class=${this._wrapperClasses}
          mono-radio
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          ?mono-checked=${this._checked}
          ?mono-disabled=${this.disabled}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="radio"
            .checked=${this._checked}
            .value=${String(this.value ?? '')}
            ?disabled=${this.disabled}
            aria-checked=${String(this._checked)}
            aria-label=${ifDefined(ariaLabel)}
            @change=${this._handleChange}
          />

          <span class=${this._circleClasses} mono-circle aria-hidden="true">
            <span class=${this._dotClasses} mono-dot></span>
          </span>

          ${this._renderLabelBlock()}
        </label>
      `
    }

    public override focus(options?: FocusOptions): void {
      const input = (this.renderRoot as ParentNode).querySelector(
        '.mono-radio-input',
      ) as HTMLInputElement | null
      input?.focus(options)
    }

    public override blur(): void {
      const input = (this.renderRoot as ParentNode).querySelector(
        '.mono-radio-input',
      ) as HTMLInputElement | null
      input?.blur()
    }
  }

  return MonoRadioCoreClass as unknown as Constructor<MonoRadioCoreInterface> & T
}
