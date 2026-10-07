// @unocss-include

import { LitElement } from 'lit'
import { property, state, query } from 'lit/decorators.js'

import type {
  CardSize,
  CardVariant,
  CardColor,
  CardRounded,
  CardMediaPosition,
  CardCssClass,
  CardClickEventDetail,
} from './card-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'

type CardRootElement = HTMLDivElement | HTMLAnchorElement

/** Slot regions the card lays out. `default` is the unnamed body region. */
export type CardSlotName =
  | 'media'
  | 'icon'
  | 'title'
  | 'subtitle'
  | 'header'
  | 'actions'
  | 'footer'
  | 'default'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoCardCoreInterface {
  size: CardSize
  variant: CardVariant
  color: CardColor
  rounded?: CardRounded
  mediaPosition: CardMediaPosition
  /** Header headline. `heading` is the old name, kept as an alias. */
  title: string
  /** Header secondary line. `subheading` is the old name, kept as an alias. */
  subtitle: string
  /** @deprecated alias of `title` */
  heading?: string
  /** @deprecated alias of `subtitle` */
  subheading?: string
  bordered: boolean
  hoverable: boolean
  clickable: boolean
  selected: boolean
  disabled: boolean
  loading: boolean
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  headerDivider: boolean
  footerDivider: boolean
  href?: string
  target?: string
  ariaLabelText?: string
  cssClass: CardCssClass
  focus(): void
  blur(): void
  click(): void

  // Shared-protected surface used by the light/shadow render()s.
  protected _hasMedia: boolean
  protected _hasIcon: boolean
  protected _hasTitle: boolean
  protected _hasSubtitle: boolean
  protected _hasHeaderSlot: boolean
  protected _hasActions: boolean
  protected _hasFooter: boolean
  protected _hasDefault: boolean
  protected _cardElement?: CardRootElement
  protected _cls(base: string, key: keyof CardCssClass): string
  protected _sizeStyle(): ReturnType<typeof buildSizeStyle>
  protected get _isInteractive(): boolean
  protected get _isDisabled(): boolean
  protected get _hasHeader(): boolean
  protected get _cardClasses(): string
  protected _handleClick(event: MouseEvent): void
  protected _handleKeyDown(event: KeyboardEvent): void
}

/**
 * `MonoCardCore` — all render-mode-agnostic logic for `mono-card`: reactive
 * props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
 * `@state`, class/getter computation, click/keyboard interactivity, and the
 * imperative `focus/blur/click`. No `render()` — the light build keeps its
 * `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
 * (each ships its own `render()`, mirroring `mono-input`).
 *
 * SSR-safe: no `document`/`window` access. `_cardElement` (`@query`) is lazy and
 * `focus/blur/click` + the `HTMLAnchorElement` check only run client-side.
 */
export const MonoCardCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoCardCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, [
        'mediaPosition',
        'headerDivider',
        'footerDivider',
        'ariaLabelText',
        'cssClass',
        // Sizing props (camelCase only — width/height are single words, no alias).
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ])
      // The old header names forward to `title` / `subtitle` — one storage, so
      // whichever is written last wins.
      defineHybridPropAlias(this, 'heading', 'title')
      defineHybridPropAlias(this, 'subheading', 'subtitle')

      this.size = 'md'
      this.variant = 'elevated'
      this.color = 'neutral'
      this.mediaPosition = 'top'

      this.title = ''
      this.subtitle = ''

      this.bordered = false
      this.hoverable = false
      this.clickable = false
      this.selected = false
      this.disabled = false
      this.loading = false

      this.headerDivider = true
      this.footerDivider = true

      this.href = undefined
      this.target = undefined
      this.ariaLabelText = undefined

      this.cssClass = {}
    }

    /**
     * Static camelCase HTML fallback.
     *
     * Browser converts:
     * mediaPosition -> mediaposition
     * headerDivider -> headerdivider
     * footerDivider -> footerdivider
     * ariaLabelText -> arialabeltext
     */
    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'mediaposition',
        'headerdivider',
        'footerdivider',
        'arialabeltext',
        'arialabel',
        // the old header names, as attributes (their properties are aliases)
        'heading',
        'subheading',
      ]
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'mediaposition') {
        this.mediaPosition = (newValue ?? 'top') as CardMediaPosition
        return
      }

      if (name === 'headerdivider') {
        this.headerDivider = this._toBoolean(newValue)
        return
      }

      if (name === 'footerdivider') {
        this.footerDivider = this._toBoolean(newValue)
        return
      }

      if (name === 'arialabeltext' || name === 'arialabel') {
        this.ariaLabelText = newValue ?? undefined
        return
      }

      if (name === 'heading') {
        this.title = newValue ?? ''
        return
      }

      if (name === 'subheading') {
        this.subtitle = newValue ?? ''
      }
    }

    @property({ type: String })
    size!: CardSize

    @property({ type: String })
    variant!: CardVariant

    @property({ type: String })
    color!: CardColor

    @property({ type: String })
    rounded?: CardRounded

    @property({ type: String, attribute: 'media-position' })
    mediaPosition!: CardMediaPosition

    /**
     * Header headline. A `title` ATTRIBUTE on the host is also the browser's
     * native tooltip; the rendered root carries `title=""`, which stops it from
     * reaching anything inside the card.
     */
    @property({ type: String })
    override title!: string

    @property({ type: String })
    subtitle!: string

    /** @deprecated alias of `title` — an instance accessor (see constructor). */
    declare heading?: string

    /** @deprecated alias of `subtitle`. */
    declare subheading?: string

    @property({ reflect: true, converter: booleanStringConverter })
    bordered!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    hoverable!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    clickable!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    selected!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    disabled!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    loading!: boolean

    /**
     * Explicit sizing. Each accepts a CSS length string (`"320px"`, `"80%"`) or a
     * number (interpreted as px). Use `width="100%"` for a full-width card.
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

    @property({ attribute: 'header-divider', reflect: true, converter: booleanStringConverter })
    headerDivider!: boolean

    @property({ attribute: 'footer-divider', reflect: true, converter: booleanStringConverter })
    footerDivider!: boolean

    @property({ type: String })
    href?: string

    @property({ type: String })
    target?: string

    @property({ type: String, attribute: 'aria-label-text' })
    ariaLabelText?: string

    @property({ attribute: false })
    cssClass!: CardCssClass

    @state()
    protected _hasMedia = false

    @state()
    protected _hasIcon = false

    @state()
    protected _hasTitle = false

    @state()
    protected _hasSubtitle = false

    /** `slot="header"` — replaces the icon and the title + subtitle block. */
    @state()
    protected _hasHeaderSlot = false

    @state()
    protected _hasActions = false

    @state()
    protected _hasFooter = false

    @state()
    protected _hasDefault = false

    @query('.mono-card')
    protected _cardElement?: CardRootElement

    protected _cls(base: string, key: keyof CardCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    /** Inline sizing applied to the card root. */
    protected _sizeStyle() {
      return buildSizeStyle(this)
    }

    protected _toBoolean(value: unknown): boolean {
      if (typeof value === 'boolean') return value

      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim()
        return normalized === '' || normalized === 'true'
      }

      return Boolean(value)
    }

    protected get _isInteractive(): boolean {
      return Boolean(this.href) || this.clickable
    }

    protected get _isDisabled(): boolean {
      return this.disabled || this.loading
    }

    protected get _hasHeader(): boolean {
      return Boolean(
        this._hasIcon ||
        this._hasTitle ||
        this._hasSubtitle ||
        this._hasHeaderSlot ||
        this.title ||
        this.subtitle,
      )
    }

    protected get _cardClasses(): string {
      const classes: string[] = ['mono-card']

      classes.push(this.size)
      classes.push(this.variant)
      classes.push(this.color)
      // Unset leaves the soft corner the resolver already falls back to.
      if (this.rounded) classes.push(`rounded-${this.rounded}`)

      if (this.bordered) classes.push('bordered')
      if (this.hoverable) classes.push('hoverable')
      if (this.clickable || this.href) classes.push('clickable')
      if (this.selected) classes.push('selected')
      if (this.disabled) classes.push('disabled')
      if (this.loading) classes.push('loading')
      if (!this.headerDivider) classes.push('no-header-divider')
      if (!this.footerDivider) classes.push('no-footer-divider')
      if (this._hasMedia) classes.push(`media-${this.mediaPosition}`)
      if (this.cssClass?.root) classes.push(this.cssClass.root)

      return classes.join(' ')
    }

    private _emitClick(originalEvent: MouseEvent | KeyboardEvent): void {
      const detail: CardClickEventDetail = { originalEvent }
      // The plain `click` is the native click itself, decorated — never a second one.
      dispatchMonoEvent(this, 'click', detail, { sourceEvent: originalEvent })
    }

    protected _handleClick(event: MouseEvent): void {
      if (this._isDisabled) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (!this._isInteractive) return

      this._emitClick(event)
    }

    protected _handleKeyDown(event: KeyboardEvent): void {
      if (this._isDisabled || !this._isInteractive) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()

        // Route the keyboard activation through a real click, as a native
        // `<button>` does on Enter: the card then emits ONE `click` (native,
        // decorated) rather than a keyboard-only event no `@click` would see.
        if (this._cardElement) {
          this._cardElement.click()
          return
        }

        this._emitClick(event)
      }
    }

    public override focus(): void {
      this._cardElement?.focus()
    }

    public override blur(): void {
      this._cardElement?.blur()
    }

    public override click(): void {
      this._cardElement?.click()
    }
  }

  return MonoCardCoreClass as unknown as Constructor<MonoCardCoreInterface> & T
}
