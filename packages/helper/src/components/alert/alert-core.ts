// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import type {
  AlertColor,
  AlertCssClass,
  AlertSize,
  AlertVariant,
} from './alert-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { closeIcon } from '../../composables/field-icons'
import { isIconifyClass } from '../../composables/icon'

/** Regions the alert lays out. `body` also takes the unslotted children. */
export type AlertSlotName = 'icon' | 'title' | 'subtitle' | 'body'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoAlertCoreInterface {
  /** The headline. */
  title: string
  /** The line under the title. */
  subtitle: string
  /** Leading icon — an iconify class or plain text. */
  icon: string
  color: AlertColor
  variant: AlertVariant
  size: AlertSize
  /** Show the ✕ that hides the alert. */
  clearable: boolean
  /** Same as `clearable`. */
  closeable: boolean
  clearLabel: string
  cssClass: AlertCssClass

  protected _hasIconSlot: boolean
  protected _hasTitleSlot: boolean
  protected _hasSubtitleSlot: boolean
  protected _hasBodySlot: boolean
  protected _cls(base: string, key: keyof AlertCssClass): string
  protected get _showsIcon(): boolean
  protected get _showsTitle(): boolean
  protected get _showsSubtitle(): boolean
  protected _renderIconGlyph(): TemplateResult | typeof nothing
  protected _renderMain(): unknown
}

/**
 * `MonoAlertCore` — everything both builds share: props (with the `closeable`
 * alias), the ✕ that hides the alert, and the root template. The regions are
 * one overridable hook, `_renderMain()`: the light build fills `[data-mono-slot]`
 * placeholders, the shadow build uses native `<slot>`s.
 *
 * The alert emits NO events of its own. `@click` on it is the browser's click;
 * the ✕ only hides the element (the native `hidden` attribute), and stops its
 * own click so a listener on the alert does not fire for it.
 *
 * SSR-safe: no `document`/`window` access.
 */
export const MonoAlertCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoAlertCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, ['clearLabel', 'cssClass'])
      // `closeable` is the other name of `clearable` — one storage.
      defineHybridPropAlias(this, 'closeable', 'clearable')

      this.title = ''
      this.subtitle = ''
      this.icon = ''
      this.color = 'neutral'
      this.variant = 'outline'
      this.size = 'md'
      this.clearable = false
      this.clearLabel = 'Close'
      this.cssClass = {}
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [...base, 'closeable', 'clearlabel', 'cssclass']
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)
      if (oldValue === newValue) return

      if (name === 'closeable') {
        this.clearable = booleanStringConverter.fromAttribute!(newValue) as boolean
        return
      }
      if (name === 'clearlabel') this.clearLabel = newValue ?? 'Close'
    }

    /**
     * The headline. A `title` ATTRIBUTE on the host is also the browser's native
     * tooltip; the rendered root carries `title=""`, which stops it reaching
     * anything inside the alert.
     */
    @property({ type: String })
    override title!: string

    @property({ type: String })
    subtitle!: string

    @property({ type: String })
    icon!: string

    @property({ type: String })
    color!: AlertColor

    @property({ type: String })
    variant!: AlertVariant

    @property({ type: String })
    size!: AlertSize

    @property({ reflect: true, converter: booleanStringConverter })
    clearable!: boolean

    /** Same as `clearable` — an instance accessor (see constructor). */
    declare closeable: boolean

    @property({ type: String, attribute: 'clear-label' })
    clearLabel!: string

    @property({ attribute: false })
    cssClass!: AlertCssClass

    @state()
    protected _hasIconSlot = false

    @state()
    protected _hasTitleSlot = false

    @state()
    protected _hasSubtitleSlot = false

    /** `slot="body"` or unslotted children — they replace icon, title and subtitle. */
    @state()
    protected _hasBodySlot = false

    protected _cls(base: string, key: keyof AlertCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _showsIcon(): boolean {
      return !this._hasBodySlot && (this._hasIconSlot || Boolean(this.icon))
    }

    protected get _showsTitle(): boolean {
      return !this._hasBodySlot && (this._hasTitleSlot || Boolean(this.title))
    }

    protected get _showsSubtitle(): boolean {
      return !this._hasBodySlot && (this._hasSubtitleSlot || Boolean(this.subtitle))
    }

    /**
     * The `icon` prop: an iconify class becomes an empty masked span, anything
     * else is text. The shadow build overrides this with inline SVG (a page
     * utility class cannot reach inside a shadow root).
     */
    protected _renderIconGlyph(): TemplateResult | typeof nothing {
      if (!this.icon) return nothing
      if (isIconifyClass(this.icon)) {
        return html`<span class=${`mono-alert-iconify ${this.icon}`} mono-glyph></span>`
      }
      return html`${this.icon}`
    }

    /** The regions — each build renders its own slot strategy here. */
    protected _renderMain(): unknown {
      return nothing
    }

    private _clear = (event: Event): void => {
      // The ✕ is the alert's own affordance, not a click ON the alert.
      event.stopPropagation()
      this.hidden = true
    }

    protected _renderClear(): TemplateResult | typeof nothing {
      if (!this.clearable) return nothing
      return html`<button
        type="button"
        class=${this._cls('mono-alert-clear', 'clear')}
        mono-clear
        aria-label=${this.clearLabel}
        @click=${this._clear}
      >${closeIcon()}</button>`
    }

    protected override render(): TemplateResult {
      return html`<div
        class=${this._cls('mono-alert', 'root')}
        mono-alert
        mono-size=${this.size && this.size !== 'md' ? this.size : nothing}
        mono-variant=${this.variant && this.variant !== 'outline' ? this.variant : nothing}
        mono-color=${this.color && this.color !== 'neutral' ? this.color : nothing}
        ?mono-clearable=${this.clearable}
        role="alert"
        title=""
      >${this._renderMain()}${this._renderClear()}</div>`
    }
  }

  return MonoAlertCoreClass as unknown as Constructor<MonoAlertCoreInterface> & T
}
