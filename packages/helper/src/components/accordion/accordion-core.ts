// @unocss-include

import { LitElement } from 'lit'
import { property, state, query } from 'lit/decorators.js'

import type {
  AccordionSize,
  AccordionColor,
  AccordionCssClass,
  AccordionClickEventDetail,
} from './accordion-types.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

/**
 * Slot regions the accordion lays out. `default` is the unnamed body region.
 * `title` / `subtitle` are canonical; `label` / `description` are their old
 * names, still accepted (the canonical name wins when both are given).
 * `header` replaces the title + subtitle text as a whole.
 */
export type AccordionSlotName =
  | 'title'
  | 'subtitle'
  | 'label'
  | 'description'
  | 'header'
  | 'icon'
  | 'actions'
  | 'default'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoAccordionCoreInterface {
  size: AccordionSize
  color: AccordionColor
  /** Header headline. `label` is the old name, kept as an alias. */
  title: string
  /** Header secondary line. `description` is the old name, kept as an alias. */
  subtitle: string
  /** @deprecated alias of `title` */
  label: string
  /** @deprecated alias of `subtitle` */
  description: string
  modelValue: boolean
  disabled: boolean
  cssClass: AccordionCssClass
  cssClassName: string
  toggle(): void
  expand(): void
  collapse(): void
  focus(): void
  blur(): void

  // Shared-protected surface used by the light/shadow render()s.
  protected _hasTitleSlotState: boolean
  protected _hasSubtitleSlotState: boolean
  protected _hasHeaderSlotState: boolean
  protected _hasIconSlotState: boolean
  protected _hasActionsSlotState: boolean
  protected _hasBodySlotState: boolean
  protected _headEl?: HTMLButtonElement
  protected _cls(base: string, key: keyof AccordionCssClass): string
  protected get _wrapperClasses(): string
  /** Ref for the root each build renders — where the styling attributes go. */
  protected bindRoot: (el: Element | undefined) => void
  protected _computeRootAttrs(): Record<string, string | null>
  protected _applyRootAttrs(root: HTMLElement | null | undefined): void
  protected get _hasTitleContent(): boolean
  protected get _hasSubtitleContent(): boolean
  protected get _hasIconContent(): boolean
  protected _setCssClass(value: unknown): void
  protected _handleClick(event: Event): void
}

/**
 * `MonoAccordionCore` — all render-mode-agnostic logic for `mono-accordion`:
 * reactive props, hybrid aliases, the camelCase attribute fallbacks, slot-presence
 * `@state`, class/getter computation, click/toggle interactivity, and the
 * imperative `focus/blur`. No `render()` — the light build keeps its
 * `[data-mono-slot]` capture strategy and the shadow build uses native `<slot>`
 * (each ships its own `render()`, mirroring `mono-card`).
 *
 * SSR-safe: no `document`/`window` access. `_headEl` (`@query`) is lazy and
 * `focus/blur` only run client-side.
 */
export const MonoAccordionCore = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class MonoAccordionCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, ['modelValue', 'cssClass'])
      // The old header names forward to `title` / `subtitle` — one storage, so
      // whichever is written last wins.
      defineHybridPropAlias(this, 'label', 'title')
      defineHybridPropAlias(this, 'description', 'subtitle')

      this.title = ''
      this.subtitle = ''

      /**
       * Vue support:
       *
       * <mono-accordion :cssClass="{}" />
       * <mono-accordion :css-class="{}" />
       * <mono-accordion :cssclass="{}" />
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
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'modelvalue',
        'css-class',
        'cssclass',
        // the old header names, as attributes (their properties are aliases)
        'label',
        'description',
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

      if (name === 'css-class' || name === 'cssclass') {
        this._setCssClass(newValue)
        return
      }

      if (name === 'label') {
        this.title = newValue ?? ''
        return
      }

      if (name === 'description') {
        this.subtitle = newValue ?? ''
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

    @property({ type: String })
    size: AccordionSize = 'md'

    @property({ type: String })
    color: AccordionColor = 'primary'

    /**
     * Header headline. A `title` ATTRIBUTE on the host is also the browser's
     * native tooltip; the rendered root carries `title=""`, which stops it from
     * reaching anything inside the accordion.
     */
    @property({ type: String })
    override title!: string

    /** Secondary line under the title. */
    @property({ type: String })
    subtitle!: string

    /** @deprecated alias of `title` — an instance accessor (see constructor). */
    declare label: string

    /** @deprecated alias of `subtitle`. */
    declare description: string

    @property({
      attribute: 'model-value',
      reflect: true,
      converter: booleanStringConverter,
    })
    modelValue = false

    @property({
      reflect: true,
      converter: booleanStringConverter,
    })
    disabled = false

    @property({ attribute: false })
    cssClass: AccordionCssClass = {}

    /**
     * Plain HTML root class fallback:
     *
     * <mono-accordion css-class="premium-accordion"></mono-accordion>
     */
    @property({ attribute: false })
    cssClassName = ''

    /** `slot="title"` (or its old name `slot="label"`) has content. */
    @state()
    protected _hasTitleSlotState = false

    /** `slot="subtitle"` (or its old name `slot="description"`) has content. */
    @state()
    protected _hasSubtitleSlotState = false

    /** `slot="header"` — replaces the icon and the title + subtitle text (actions and chevron stay). */
    @state()
    protected _hasHeaderSlotState = false

    @state()
    protected _hasIconSlotState = false

    @state()
    protected _hasActionsSlotState = false

    @state()
    protected _hasBodySlotState = false

    @query('.mono-accordion-head')
    protected _headEl?: HTMLButtonElement

    protected _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }

      if (typeof value === 'object') {
        this.cssClass = value as AccordionCssClass
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
            this.cssClass = JSON.parse(trimmed) as AccordionCssClass
            return
          } catch {
            // fall through to root class
          }
        }

        this.cssClassName = trimmed
      }
    }

    protected _cls(base: string, key: keyof AccordionCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    /**
     * The root each build renders — the `.mono-accordion` div. It carries the
     * styling ATTRIBUTES (the classes ride the template binding), which are
     * applied here rather than bound one by one so both builds share one
     * definition and every default stays a single `null` in the map below.
     */
    protected _rootEl: HTMLElement | null = null

    protected bindRoot = (el: Element | undefined): void => {
      this._rootEl = (el as HTMLElement) ?? null
      this._applyRootAttrs(this._rootEl)
    }

    /**
     * The prop mirrors, each omitted at its default so `:not([mono-size])` means
     * "md" for hand-written markup exactly as it does for the element.
     */
    protected _computeRootAttrs(): Record<string, string | null> {
      return {
        'mono-size': this.size === 'md' ? null : this.size,
        'mono-color': this.color === 'primary' ? null : this.color,
        'mono-open': this.modelValue ? '' : null,
        'mono-disabled': this.disabled ? '' : null,
        'mono-grouped': this._inGroup() ? '' : null,
      }
    }

    /**
     * Is this item inside an accordion group?
     *
     * The CSS can see that for hand-written markup — `[mono-accordion-group] >
     * [mono-accordion]` — but not for the ELEMENT: the light build puts the
     * custom-element host between the group and the root, and the shadow build
     * puts a boundary there, and a selector crosses neither. So the element
     * detects its own group and writes it as an attribute, which is the one thing
     * that reaches the root in both builds.
     *
     * Only MEMBERSHIP, never position: "am I the last one?" would be answered
     * from however many siblings existed at this render, and appending a fourth
     * item does not re-render the third. The divider is the group's business and
     * rides its own `:last-child` (see accordion.css).
     *
     * `closest()` on the HOST, not the root: the group is the consumer's wrapper
     * around `<mono-accordion>`, so the host is what sits inside it.
     */
    protected _inGroup(): boolean {
      // No `isServer` guard: `updated()` never runs on the server anyway, and the
      // attribute is imperative, so it takes no part in hydration — while lit's
      // `isServer` is TRUE under jsdom, where this must still work.
      if (typeof this.closest !== 'function') return false
      return Boolean(this.closest('[mono-accordion-group], .mono-accordion-group'))
    }

    protected _applyRootAttrs(root: HTMLElement | null | undefined): void {
      if (!root) return
      if (!root.hasAttribute('mono-accordion')) root.setAttribute('mono-accordion', '')
      for (const [name, value] of Object.entries(this._computeRootAttrs())) {
        if (value === null) root.removeAttribute(name)
        else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
      }
    }

    protected override updated(changed: Map<string, unknown>): void {
      // @ts-ignore — super may not declare updated through the generic base.
      super.updated?.(changed)
      // `modelValue` and `disabled` both move after a render, and the root is a
      // static template node, so its attributes are written here.
      this._applyRootAttrs(this._rootEl)
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-accordion',
        this.size,
        this.color,
        this.modelValue ? 'open' : '',
        this.disabled ? 'disabled' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected get _hasTitleContent(): boolean {
      return Boolean(this.title) || this._hasTitleSlotState
    }

    protected get _hasSubtitleContent(): boolean {
      return Boolean(this.subtitle) || this._hasSubtitleSlotState
    }

    protected get _hasIconContent(): boolean {
      return this._hasIconSlotState
    }

    /**
     * The open state changed. `mno-click` is the historical name; the plain
     * event is `toggle`, and the transition also fires `open` / `close`
     * (+ `mno-open` / `mno-close`) — the same trio modal and drawer emit.
     */
    private _emitClick(detail: AccordionClickEventDetail): void {
      dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })
      dispatchMonoEvent(this, detail.modelValue ? 'open' : 'close', detail)
    }

    protected _setOpen(next: boolean, sourceEvent?: Event): void {
      if (this.disabled) return
      if (this.modelValue === next) return

      const oldValue = this.modelValue
      this.modelValue = next

      this._emitClick({
        modelValue: next,
        currentValue: next,
        oldValue,
        value: next,
        sourceEvent,
      })
    }

    protected _handleClick(event: Event): void {
      if (this.disabled) return
      this._setOpen(!this.modelValue, event)
    }

    public toggle(): void {
      this._setOpen(!this.modelValue)
    }

    public expand(): void {
      this._setOpen(true)
    }

    public collapse(): void {
      this._setOpen(false)
    }

    public override focus(): void {
      this._headEl?.focus()
    }

    public override blur(): void {
      this._headEl?.blur()
    }
  }

  return MonoAccordionCoreClass as unknown as Constructor<MonoAccordionCoreInterface> &
    T
}
