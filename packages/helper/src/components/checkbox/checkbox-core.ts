// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import type {
  CheckboxSize,
  CheckboxColor,
  CheckboxCssClass,
  CheckboxModelEventDetail,
} from './checkbox-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { MonoFormControlCore } from '../form/form-control-core.js'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoCheckboxCoreInterface {
  size: CheckboxSize
  color: CheckboxColor
  modelValue: boolean
  checked: boolean
  disabled: boolean
  indeterminate: boolean
  loading: boolean
  label: string
  /** Secondary line under the label. */
  sublabel: string
  /** The same as `sublabel`, kept for existing code. */
  description: string
  value: string
  name: string
  ariaLabelText?: string
  cssClass: CheckboxCssClass
  cssClassName: string
  focus(): void
  blur(): void

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected _hasIcon: boolean
  protected _hasIndeterminateIcon: boolean
  protected _hasLabelSlotState: boolean
  protected _hasDescriptionSlotState: boolean
  protected _toBoolean(value: unknown): boolean
  protected _cls(base: string, key: keyof CheckboxCssClass): string
  protected get _wrapperClasses(): string
  protected get _inputClasses(): string
  protected get _boxClasses(): string
  protected _hasLabelContent(): boolean
  protected _hasDescriptionContent(): boolean
  protected _handleChange(event: Event): void
  protected _renderCustomIcon(): TemplateResult | typeof nothing
  protected _renderLoadingIcon(): TemplateResult
  protected _renderLabelBlock(): TemplateResult | typeof nothing
}

/**
 * `MonoCheckboxCore` — all render-mode-agnostic logic for `mono-checkbox`:
 * reactive props (incl. SSR boolean coercion), hybrid aliases, camelCase
 * attribute fallbacks, the `modelValue`↔`checked` sync, class computation,
 * change interactivity (`mno-change`), `focus`/`blur`, AND the shared `render()`
 * skeleton (`<label><input><box></box><labelBlock></label>`). The slot-bearing
 * regions are two overridable hooks — `_renderCustomIcon()` / `_renderLabelBlock()`
 * — that default to the light build's `[data-mono-slot]` placeholders; the shadow
 * build overrides them with native `<slot>` (mirrors `mono-accordion`).
 *
 * SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`.
 */
export const MonoCheckboxCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoCheckboxCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, ['modelValue', 'ariaLabelText', 'cssClass'])
      // `description` is the other name of `sublabel` — one storage, so both
      // names read and write the same text.
      defineHybridPropAlias(this, 'description', 'sublabel')
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [...base, 'modelvalue', 'arialabeltext', 'description', 'css-class', 'cssclass']
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

      if (name === 'arialabeltext') {
        this.ariaLabelText = newValue ?? undefined
        return
      }

      if (name === 'description') {
        this.sublabel = newValue ?? ''
        return
      }

      if (name === 'css-class' || name === 'cssclass') {
        this.cssClassName = newValue ?? ''
      }
    }

    @property({ type: String })
    size: CheckboxSize = 'md'

    @property({ type: String })
    color: CheckboxColor = 'primary'

    @property({ attribute: 'model-value', reflect: true, converter: booleanStringConverter })
    modelValue = false

    @property({ reflect: true, converter: booleanStringConverter })
    checked = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    indeterminate = false

    /**
     * Show a spinner IN the box and refuse interaction — the state
     * `mono-table-checkbox` shows while its select-all drains the server. The box
     * opts out of its own tick/dash while it runs, so the spinner is the only glyph.
     */
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
    cssClass: CheckboxCssClass = {}

    @property({ type: String, attribute: 'css-class' })
    cssClassName = ''

    @state()
    protected _hasIcon = false

    @state()
    protected _hasIndeterminateIcon = false

    @state()
    protected _hasLabelSlotState = false

    @state()
    protected _hasDescriptionSlotState = false

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards bare boolean attributes as the PROPERTY string `""`
      // (these use `booleanStringConverter`, not `type:Boolean`). Coerce so the
      // server and client renders match. See project_shadow_boolean_prop_ssr.
      for (const key of ['modelValue', 'checked', 'disabled', 'indeterminate'] as const) {
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

    protected _cls(base: string, key: keyof CheckboxCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-checkbox',
        // The root needs the size too, not just the box: gap, label and description
        // scale per step and they live out here. Radio has always done this.
        this.size,
        this.color,
        this.disabled ? 'disabled' : '',
        this.checked ? 'mono-checkbox-checked' : '',
        this.indeterminate ? 'mono-checkbox-indeterminate' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected get _inputClasses(): string {
      return this._cls('mono-checkbox-input', 'input')
    }

    protected get _boxClasses(): string {
      return [
        this._cls('mono-checkbox-box', 'box'),
        this.size,
        this._hasIcon || this.loading ? 'has-custom-icon' : '',
        this._hasIndeterminateIcon || this.loading ? 'has-custom-indeterminate-icon' : '',
      ]
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
    }): CheckboxModelEventDetail {
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

    private _emitChange(detail: CheckboxModelEventDetail): void {
      // Plain `change`: the native change decorated in the light build (it
      // bubbles), synthesized in the shadow build (it is not composed).
      dispatchMonoEvent(this, 'change', detail)
    }

    protected _handleChange(event: Event): void {
      if (this.disabled) return

      const input = event.currentTarget as HTMLInputElement
      const oldValue = this.modelValue
      const nextValue = input.checked

      if (this.indeterminate) {
        this.indeterminate = false
      }

      this.checked = nextValue
      this.modelValue = nextValue

      const detail = this._createModelDetail({
        modelValue: nextValue,
        oldValue,
        sourceEvent: event,
      })

      this._emitChange(detail)
    }

    /**
     * The `loading` spinner, shown in place of the tick/dash. Light uses the global
     * icon utility class; the shadow build overrides this with inline SVG, which
     * page-level CSS cannot reach.
     */
    protected _renderLoadingIcon(): TemplateResult {
      return html`<span class="mono-icon i-mdi-loading mono-checkbox-spinner" mono-spinner aria-hidden="true"></span>`
    }

    /** Light-DOM custom icon (data-mono-slot). Shadow build overrides with `<slot>`. */
    protected _renderCustomIcon(): TemplateResult | typeof nothing {
      // The size class travels with the icon exactly as it does with the box. Without
      // it `.mono-checkbox-icon.<size>` (80% of the box's inner area) never matches
      // and the base `width: 100%` wins, so a slotted icon rendered a quarter larger
      // than the same markup written by hand — and than the shadow build, which sizes
      // its icon slot instead of the wrapper.
      if (this.indeterminate && this._hasIndeterminateIcon) {
        return html`
          <span
            class=${[
              this._cls('mono-checkbox-indeterminate-icon', 'indeterminateIcon'),
              this.size,
            ]
              .filter(Boolean)
              .join(' ')}
            mono-indeterminate-icon
            data-mono-slot="indeterminate-icon"
          ></span>
        `
      }

      if (this.checked && this._hasIcon) {
        return html`
          <span
            class=${[this._cls('mono-checkbox-icon', 'icon'), this.size]
              .filter(Boolean)
              .join(' ')}
            mono-icon
            data-mono-slot="icon"
          ></span>
        `
      }

      return nothing
    }

    /** Light-DOM label block (data-mono-slot). Shadow build overrides with `<slot>`. */
    protected _renderLabelBlock(): TemplateResult | typeof nothing {
      if (!this._hasLabelContent() && !this._hasDescriptionContent()) {
        return nothing
      }

      return html`
        <span class=${this._cls('mono-checkbox-label', 'label')} mono-label>
          ${this._hasLabelContent()
            ? html`
                <span class=${this._cls('mono-checkbox-label-text', 'labelText')} mono-label-text>
                  ${this._hasLabelSlotState
                    ? html`<span data-mono-slot="label"></span>`
                    : this.label}
                </span>
              `
            : nothing}

          ${this._hasDescriptionContent()
            ? html`
                <span class=${this._cls('mono-checkbox-label-description', 'description')} mono-description>
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
        (this._hasLabelSlotState ? 'Checkbox' : undefined)

      // The root's `mono-*` attributes mirror the props one for one and are what
      // checkbox.css styles (`[mono-checkbox][mono-size="sm"]`); a prop at its
      // default emits NO attribute. `mono-checked` / `mono-indeterminate` /
      // `mono-loading` are the states. The classes stay as inert hooks until 2.0.
      return html`
        <label
          class=${this._wrapperClasses}
          mono-checkbox
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          ?mono-checked=${this.checked}
          ?mono-indeterminate=${this.indeterminate}
          ?mono-disabled=${this.disabled}
          ?mono-loading=${this.loading}
        >
          <input
            class=${this._inputClasses}
            mono-input
            type="checkbox"
            .checked=${this.checked}
            .indeterminate=${this.indeterminate}
            .value=${this.value}
            name=${ifDefined(this.name || undefined)}
            ?disabled=${this.disabled || this.loading}
            aria-checked=${this.indeterminate ? 'mixed' : String(this.checked)}
            aria-label=${ifDefined(ariaLabel)}
            aria-busy=${this.loading ? 'true' : 'false'}
            @change=${this._handleChange}
          />

          <span
            class=${this._boxClasses}
            mono-box
            ?mono-custom-icon=${this._hasIcon || this.loading}
            ?mono-custom-indeterminate-icon=${this._hasIndeterminateIcon || this.loading}
            aria-hidden="true"
          >
            ${this.loading ? this._renderLoadingIcon() : this._renderCustomIcon()}
          </span>

          ${this._renderLabelBlock()}
        </label>
      `
    }

    public override focus(options?: FocusOptions): void {
      const input = (this.renderRoot as ParentNode).querySelector(
        '.mono-checkbox-input',
      ) as HTMLInputElement | null
      input?.focus(options)
    }

    public override blur(): void {
      const input = (this.renderRoot as ParentNode).querySelector(
        '.mono-checkbox-input',
      ) as HTMLInputElement | null
      input?.blur()
    }
  }

  return MonoCheckboxCoreClass as unknown as Constructor<MonoCheckboxCoreInterface> & T
}
