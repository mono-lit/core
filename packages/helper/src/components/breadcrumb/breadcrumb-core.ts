// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import type {
  BreadcrumbItem,
  BreadcrumbVariant,
  BreadcrumbSize,
  BreadcrumbColor,
  BreadcrumbCssClass,
  BreadcrumbClickEventDetail,
  BreadcrumbChangeEventDetail,
} from './breadcrumb-types.js'

import {
  arrayHasChanged,
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

import {
  breadcrumbRootAttrs,
  coerceItems,
  findItem,
  findItemIndex,
  resolveCurrentId,
  generateBreadcrumbRootClasses,
} from './breadcrumb-utils.js'

import {
  renderBreadcrumbList,
  type BreadcrumbRenderContext,
} from './breadcrumb-render.js'

/**
 * Minimal interface for descendant `<mono-breadcrumb-list>` instances. Avoids a
 * circular import — the real class is in `mono-breadcrumb-list.ts`.
 */
export interface MonoBreadcrumbListLike extends HTMLElement {
  requestUpdate(): void
  getBreadcrumbItems?(): BreadcrumbItem[]
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoBreadcrumbCoreInterface {
  items: BreadcrumbItem[]
  modelValue: BreadcrumbItem | null
  variant: BreadcrumbVariant
  size: BreadcrumbSize
  color: BreadcrumbColor
  separator: string
  truncate: boolean
  disabled: boolean
  ariaLabel: string | null
  cssClass: BreadcrumbCssClass
  cssClassName: string

  select(id: string): void
  focus(): void
  requestItemActivation(item: BreadcrumbItem, index: number, event?: Event): void
  isItemCurrent(id: string): boolean
  getSlotIconNodes(id: string): Node[] | undefined
  hasSeparatorSlot(): boolean
  getSeparatorString(): string
  _registerListChild(child: MonoBreadcrumbListLike): void
  _unregisterListChild(child: MonoBreadcrumbListLike): void

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected _slotIcons: Map<string, Node[]>
  protected _slotSeparator: Node[]
  protected _listChildren: Set<MonoBreadcrumbListLike>
  protected _cls(base: string, key: keyof BreadcrumbCssClass): string
  protected get _rootClasses(): string
  protected _isCurrent(id: string): boolean
  protected _setCssClass(value: unknown): void
  protected _setModelValueFromAttribute(value: string | null): void
  protected _handleItemActivation(item: BreadcrumbItem, index: number, event?: Event): void
  protected _notifyListChildren(changed: Map<string, unknown>): void
  protected _renderContext(): BreadcrumbRenderContext
  protected _itemsForRender(): BreadcrumbItem[]
  protected _renderBody(): TemplateResult
  protected _useIconSlots(): boolean
}

/**
 * `MonoBreadcrumbCore` — all render-mode-agnostic logic for `mono-breadcrumb`:
 * reactive props (incl. the SSR `items` string→array coercion), hybrid aliases,
 * camelCase attribute fallbacks, the child-list registry + state propagation,
 * item activation + events, and the `<nav>` chrome `render()`. The light build
 * keeps its `[data-mono-slot]` capture (`slot="body"`/`separator`/`icon-*`) and
 * overrides `_renderBody()`; the shadow build renders the whole list from `items`
 * in one shadow root and overrides `_useIconSlots()` (mirrors `mono-menu`).
 *
 * SSR-safe: no `document`/`window` access except `focus()` (guarded by isServer).
 */
export const MonoBreadcrumbCore = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class MonoBreadcrumbCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, ['modelValue', 'cssClass'])

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
      return [...base, 'modelvalue', 'model-value', 'css-class', 'cssclass']
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'modelvalue' || name === 'model-value') {
        this._setModelValueFromAttribute(newValue)
        return
      }

      if (name === 'css-class' || name === 'cssclass') {
        this._setCssClass(newValue)
      }
    }

    /**
     * `items` accepts an array (`.items=[...]` / Vue `:items.prop`) AND a JSON
     * string (`items='[...]'` attribute, or a string assigned to the PROPERTY,
     * which is what nuxt-ssr-lit does forwarding a Vue `:items="<json>"` binding
     * to the SSR renderer). The converter handles the attribute form; a string
     * assigned to the property is coerced in `willUpdate`.
     */
    @property({
      attribute: 'items',
      converter: {
        fromAttribute: (value: string | null): BreadcrumbItem[] => coerceItems(value),
        toAttribute: (): string | null => null,
      },
      hasChanged: arrayHasChanged,
    })
    items: BreadcrumbItem[] = []

    @property({ attribute: false })
    modelValue: BreadcrumbItem | null = null

    @property({ type: String })
    variant: BreadcrumbVariant = 'default'

    @property({ type: String })
    size: BreadcrumbSize = 'md'

    @property({ type: String })
    color: BreadcrumbColor = 'primary'

    @property({ type: String })
    separator = '›'

    @property({ reflect: true, converter: booleanStringConverter })
    truncate = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ attribute: 'aria-label' })
    override ariaLabel: string | null = 'Breadcrumb'

    @property({ attribute: false })
    cssClass: BreadcrumbCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    /** Per-item icon slots — `slot="icon-${id}"` captured by the light build. */
    @state()
    protected _slotIcons = new Map<string, Node[]>()

    /** Captured separator nodes — `slot="separator"` (light build). */
    protected _slotSeparator: Node[] = []

    /**
     * Descendant `<mono-breadcrumb-list>` elements that registered themselves
     * (light build). The parent pushes re-renders when its props change.
     */
    protected _listChildren = new Set<MonoBreadcrumbListLike>()

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards `:items="<json>"` / `:model-value="<json>"` as a
      // PROPERTY string — coerce before render so the renderer never sees a string.
      if (typeof this.items === 'string') {
        this.items = coerceItems(this.items)
      }
      if (typeof this.modelValue === 'string') {
        this._setModelValueFromAttribute(this.modelValue)
      }
      super.willUpdate(changed)
    }

    protected _setModelValueFromAttribute(value: string | null): void {
      if (value == null || value === '') {
        this.modelValue = null
        return
      }

      const trimmed = value.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          this.modelValue = JSON.parse(trimmed) as BreadcrumbItem
          return
        } catch {
          // fall through — treat as id
        }
      }

      const found = findItem(this.items, trimmed)
      this.modelValue = found ?? { id: trimmed }
    }

    protected _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }

      if (typeof value === 'object') {
        this.cssClass = value as BreadcrumbCssClass
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
            this.cssClass = JSON.parse(trimmed) as BreadcrumbCssClass
            return
          } catch {
            // fall through
          }
        }

        this.cssClassName = trimmed
      }
    }

    protected _cls(base: string, key: keyof BreadcrumbCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _rootClasses(): string {
      return generateBreadcrumbRootClasses({
        variant: this.variant,
        size: this.size,
        color: this.color,
        truncate: this.truncate,
        disabled: this.disabled,
        cssClassName: this.cssClassName,
        rootExtra: this.cssClass?.root,
      })
    }

    private _resolvedCurrentId(): string {
      return resolveCurrentId(this.items, this.modelValue)
    }

    protected _isCurrent(id: string): boolean {
      if (this._listChildren.size && !this.items.length) {
        if (this.modelValue?.id) return this.modelValue.id === id
        // Composed mode with nothing bound. The wrapper has no items of its own,
        // but it CAN see what its children carry — so resolve over those, and an
        // item's `current: true` (and the last-one-wins fallback) behaves exactly
        // as it does when `items` sits on the wrapper. Without this a composed
        // breadcrumb had no current segment at all.
        return resolveCurrentId(this._registeredItems(), null) === id
      }
      return this._resolvedCurrentId() === id
    }

    /** Every child list's items, in registration (DOM) order. */
    private _registeredItems(): BreadcrumbItem[] {
      const out: BreadcrumbItem[] = []
      for (const child of this._listChildren) {
        out.push(...(child.getBreadcrumbItems?.() ?? []))
      }
      return out
    }

    private _findRegisteredItem(id: string): BreadcrumbItem | null {
      for (const child of this._listChildren) {
        const items = child.getBreadcrumbItems?.() ?? []
        const found = findItem(items, id)
        if (found) return found
      }
      return null
    }

    private _findAnyItem(id: string): BreadcrumbItem | null {
      return findItem(this.items, id) ?? this._findRegisteredItem(id)
    }

    /** Programmatic select. Updates modelValue and emits `change`. */
    public select(id: string): void {
      const item = this._findAnyItem(id)
      if (!item) return
      this._handleItemActivation(item, findItemIndex(this.items, id))
    }

    public override focus(): void {
      if (isServer) return
      const first = this.renderRoot.querySelector(
        'a.mono-breadcrumb-action, button.mono-breadcrumb-action',
      ) as HTMLElement | null
      first?.focus()
    }

    /**
     * Public hooks consumed by descendant `<mono-breadcrumb-list>` instances
     * rendered inside `slot="body"` (light build).
     */
    public requestItemActivation(
      item: BreadcrumbItem,
      index: number,
      event?: Event,
    ): void {
      this._handleItemActivation(item, index, event)
    }

    public isItemCurrent(id: string): boolean {
      return this._isCurrent(id)
    }

    public getSlotIconNodes(id: string): Node[] | undefined {
      return this._slotIcons.get(id)
    }

    public hasSeparatorSlot(): boolean {
      return this._slotSeparator.length > 0
    }

    public getSeparatorString(): string {
      return this.separator
    }

    /** @internal called by `<mono-breadcrumb-list>` from its connectedCallback. */
    public _registerListChild(child: MonoBreadcrumbListLike): void {
      this._listChildren.add(child)
    }

    /** @internal called by `<mono-breadcrumb-list>` from its disconnectedCallback. */
    public _unregisterListChild(child: MonoBreadcrumbListLike): void {
      this._listChildren.delete(child)
    }

    protected _handleItemActivation(
      item: BreadcrumbItem,
      index: number,
      event?: Event,
    ): void {
      if (item.disabled || this.disabled) return

      // A real click on an item: the plain `click` is the native one, decorated.
      dispatchMonoEvent<BreadcrumbClickEventDetail>(this, 'click', {
        value: item.id,
        item,
        index,
        sourceEvent: event,
      })

      const oldValue = this.modelValue
      if (oldValue?.id === item.id) return

      this.modelValue = item

      const detail: BreadcrumbChangeEventDetail = {
        modelValue: item,
        currentValue: item,
        oldValue,
        sourceEvent: event,
      }
      dispatchMonoEvent(this, 'change', detail)
    }

    protected _notifyListChildren(changed: Map<string, unknown>): void {
      if (!this._listChildren.size) return
      const triggers = [
        'modelValue',
        'variant',
        'size',
        'color',
        'separator',
        'truncate',
        'disabled',
        'cssClass',
        'cssClassName',
      ]
      if (!triggers.some((k) => changed.has(k))) return
      for (const child of this._listChildren) {
        child.requestUpdate()
      }
    }

    /** Build the shared render context. */
    protected _renderContext(): BreadcrumbRenderContext {
      return {
        cssClass: this.cssClass,
        separator: this.separator,
        hasSeparatorSlot: this._slotSeparator.length > 0,
        iconSlot: this._useIconSlots(),
        disabled: this.disabled,
        isCurrent: (id) => this._isCurrent(id),
        getSlotIconNodes: (id) => this._slotIcons.get(id),
        onItemClick: (item, index, e) =>
          this._handleItemActivation(item, index, e),
      }
    }

    /**
     * Whether per-item icons render through a native `<slot>` (shadow build) vs
     * the light-DOM `data-mono-slot` + inline `i-…` span (light build).
     */
    protected _useIconSlots(): boolean {
      return false
    }

    /**
     * The items to render for THIS render pass. Defaults to the full `items`.
     * The shadow build overrides this to slice down to the server-rendered crumb
     * count during the hydration render, so the first client render matches the
     * SSR'd DOM exactly (avoids "shorter than expected iterable" + double render
     * when `items` arrives via `.prop`, which @lit-labs/ssr does not forward).
     */
    protected _itemsForRender(): BreadcrumbItem[] {
      return this.items
    }

    /** The list body. Light build overrides this to support `slot="body"`. */
    protected _renderBody(): TemplateResult {
      return html`
        <ol class=${this._cls('mono-breadcrumb-list', 'list')} mono-list>
          ${renderBreadcrumbList(this._itemsForRender(), this._renderContext())}
        </ol>
      `
    }

    protected override render(): TemplateResult {
      const attrs = breadcrumbRootAttrs(this)
      return html`
        <nav
          class=${this._rootClasses}
          aria-label=${this.ariaLabel ?? 'Breadcrumb'}
          mono-breadcrumb
          mono-size=${attrs.size ?? nothing}
          mono-color=${attrs.color ?? nothing}
          mono-variant=${attrs.variant ?? nothing}
          ?mono-truncate=${this.truncate}
          ?mono-disabled=${this.disabled}
        >
          ${this._renderBody()}
        </nav>
      `
    }
  }

  return MonoBreadcrumbCoreClass as unknown as Constructor<MonoBreadcrumbCoreInterface> &
    T
}
