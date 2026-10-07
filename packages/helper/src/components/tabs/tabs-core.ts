// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js'

import type {
  TabsSize,
  TabsColor,
  TabsVariant,
  TabsOrientation,
  TabsCssClass,
  TabItem,
  TabsClickEventDetail,
} from './tabs-types.js'

import {
  arrayHasChanged,
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

/**
 * Coerce any `items` input to a `TabItem[]`. Accepts an array (pass-through), a
 * JSON string (`items='[...]'` attribute, OR a string assigned to the PROPERTY —
 * which is what nuxt-ssr-lit does forwarding a Vue `:items="<json>"` binding to
 * the SSR renderer), or anything else (→ `[]`).
 */
export function coerceTabItems(value: unknown): TabItem[] {
  if (Array.isArray(value)) return value as TabItem[]
  if (typeof value === 'string') {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as TabItem[]) : []
    } catch {
      return []
    }
  }
  return []
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoTabsCoreInterface {
  items: TabItem[]
  modelValue: string
  value: string
  size: TabsSize
  color: TabsColor
  variant: TabsVariant
  orientation: TabsOrientation
  disabled: boolean
  cssClass: TabsCssClass
  cssClassName: string

  select(id: string): void
  next(): void
  previous(): void
  focus(): void
  blur(): void

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected _setCssClass(value: unknown): void
  protected _cls(base: string, key: keyof TabsCssClass): string
  /** Ref for the root each build renders — where the styling attributes go. */
  protected bindRoot: (el: Element | undefined) => void
  protected _computeRootAttrs(): Record<string, string | null>
  protected _applyRootAttrs(root: HTMLElement | null | undefined): void
  protected get _wrapperClasses(): string
  protected _isActive(item: TabItem): boolean
  protected _tabClasses(item: TabItem): string
  protected _selectItem(item: TabItem, sourceEvent?: Event): void
  protected _handleClick(item: TabItem, event: Event): void
  protected _itemsForRender(): TabItem[]
  protected _useIconSlots(): boolean
  protected _iconHasContent(id: string): boolean
  protected _renderIcon(item: TabItem): TemplateResult | typeof nothing
  protected _renderBadge(item: TabItem): TemplateResult | typeof nothing
}

/**
 * `MonoTabsCore` — all render-mode-agnostic logic for `mono-tabs`: reactive props
 * (incl. the SSR `items` string→array coercion and `disabled` string→bool
 * coercion), hybrid aliases, camelCase attribute fallbacks, the `modelValue`↔
 * `value` sync, class computation, tab selection + `mno-click` events, keyboard
 * navigation, and the `role="tablist"` `render()`. Per-tab icons render through a
 * `_renderIcon()` hook: the light build uses `data-mono-slot` placeholders, the
 * shadow build native `<slot name="icon-<id>">` (mirrors `mono-breadcrumb`).
 *
 * SSR-safe: no `document`/`window` access; `focus`/`blur` query `this.renderRoot`
 * (the host in light, the shadow root in shadow) and only matter client-side.
 */
export const MonoTabsCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTabsCoreClass extends superClass {
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

    /**
     * Accepts an array (`.items` / Vue `:items.prop`) AND a JSON string
     * (`items='[...]'` attribute, or a string assigned to the PROPERTY by
     * nuxt-ssr-lit). The converter handles the attribute form; a string assigned
     * to the property is coerced in `willUpdate`.
     */
    @property({
      attribute: 'items',
      converter: {
        fromAttribute: (value: string | null): TabItem[] => coerceTabItems(value),
        toAttribute: (): string | null => null,
      },
      hasChanged: arrayHasChanged,
    })
    items: TabItem[] = []

    @property({ type: String, attribute: 'model-value', reflect: true })
    modelValue = ''

    @property({ type: String })
    value = ''

    @property({ type: String })
    size: TabsSize = 'md'

    @property({ type: String })
    color: TabsColor = 'primary'

    @property({ type: String })
    variant: TabsVariant = 'underline'

    /**
     * Which way the strip runs. Upstream keys its vertical rules on the
     * tablist's own `aria-orientation`, which is also what a screen reader
     * reads and what the arrow keys should follow — so the prop writes that
     * attribute rather than a `mono-` twin of it.
     */
    @property({ type: String })
    orientation: TabsOrientation = 'horizontal'

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ attribute: false })
    cssClass: TabsCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards `:items="<json>"` as a PROPERTY string, and bare
      // boolean attributes (`<mono-tabs disabled>`) as `""` — coerce both before
      // render so the server and client renders match.
      if (typeof this.items === 'string') {
        this.items = coerceTabItems(this.items)
      }
      if (typeof (this.disabled as unknown) === 'string') {
        const normalized = (this.disabled as unknown as string).toLowerCase().trim()
        this.disabled = normalized === '' || normalized === 'true'
      }

      if (changed.has('modelValue') && this.value !== this.modelValue) {
        this.value = this.modelValue
      }
      if (changed.has('value') && this.modelValue !== this.value) {
        this.modelValue = this.value
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
        this.cssClass = value as TabsCssClass
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
            this.cssClass = JSON.parse(trimmed) as TabsCssClass
            return
          } catch {
            // fall through to root class
          }
        }

        this.cssClassName = trimmed
      }
    }

    protected _cls(base: string, key: keyof TabsCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    /**
     * The prop mirrors, each omitted at its default so `:not([mono-size])` means
     * "md" for hand-written markup exactly as it does for the element.
     *
     * `aria-orientation` is ALWAYS written, and is not a `mono-` attribute:
     * upstream styles the vertical strip from the ARIA state, and a tablist is
     * supposed to carry it either way.
     */
    protected _computeRootAttrs(): Record<string, string | null> {
      return {
        'mono-size': this.size === 'md' ? null : this.size,
        'mono-color': this.color === 'primary' ? null : this.color,
        'mono-variant': this.variant === 'underline' ? null : this.variant,
        'mono-disabled': this.disabled ? '' : null,
        'aria-orientation': this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      }
    }

    /**
     * The root each build renders. It carries the styling ATTRIBUTES (the classes
     * ride the template binding), written here rather than bound one by one so
     * both builds share one definition.
     */
    protected _rootEl: HTMLElement | null = null

    protected bindRoot = (el: Element | undefined): void => {
      this._rootEl = (el as HTMLElement) ?? null
      this._applyRootAttrs(this._rootEl)
    }

    protected _applyRootAttrs(root: HTMLElement | null | undefined): void {
      if (!root) return
      if (!root.hasAttribute('mono-tabs')) root.setAttribute('mono-tabs', '')
      for (const [name, value] of Object.entries(this._computeRootAttrs())) {
        if (value === null) root.removeAttribute(name)
        else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
      }
    }

    protected override updated(changed: Map<string, unknown>): void {
      // @ts-ignore — super may not declare updated through the generic base.
      super.updated?.(changed)
      this._applyRootAttrs(this._rootEl)
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-tabs',
        this.size,
        this.color,
        // Prefixed so the variant class can't collide with a Tailwind/UnoCSS
        // utility (e.g. bare `underline` → `text-decoration: underline`).
        `variant-${this.variant}`,
        this.disabled ? 'disabled' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected _isActive(item: TabItem): boolean {
      return item.id === this.modelValue
    }

    protected _tabClasses(item: TabItem): string {
      const active = this._isActive(item)
      return [
        this._cls('mono-tabs-tab', 'tab'),
        active ? 'on' : '',
        active && this.cssClass?.tabActive ? this.cssClass.tabActive : '',
        item.disabled ? 'disabled' : '',
        item.disabled && this.cssClass?.tabDisabled ? this.cssClass.tabDisabled : '',
      ]
        .filter(Boolean)
        .join(' ')
    }

    private _emitClick(detail: TabsClickEventDetail): void {
      // A selection change, not a click (keyboard and `select()` land here too):
      // its plain name is `change`. `mno-click` is kept.
      dispatchMonoEvent(this, 'click', detail, { alias: 'change' })
    }

    protected _selectItem(item: TabItem, sourceEvent?: Event): void {
      if (this.disabled || item.disabled) return
      if (this.modelValue === item.id) return

      const oldValue = this.modelValue
      this.modelValue = item.id
      this.value = item.id

      this._emitClick({
        modelValue: item.id,
        currentValue: item.id,
        oldValue,
        value: item.id,
        item,
        sourceEvent,
      })
    }

    protected _handleClick(item: TabItem, event: Event): void {
      this._selectItem(item, event)
    }

    public select(id: string): void {
      const item = this.items.find((entry) => entry.id === id)
      if (item) this._selectItem(item)
    }

    public next(): void {
      this._step(1)
    }

    public previous(): void {
      this._step(-1)
    }

    private _step(delta: number): void {
      if (this.disabled || !this.items.length) return

      const enabled = this.items.filter((item) => !item.disabled)
      if (!enabled.length) return

      const currentIndex = enabled.findIndex((item) => item.id === this.modelValue)

      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + delta + enabled.length) % enabled.length

      this._selectItem(enabled[nextIndex])
    }

    public override focus(): void {
      const root = this.renderRoot as ParentNode
      const tab = root.querySelector('.mono-tabs-tab.on') as HTMLButtonElement | null
      const fallback = root.querySelector('.mono-tabs-tab') as HTMLButtonElement | null
      ;(tab ?? fallback)?.focus()
    }

    public override blur(): void {
      const root = this.renderRoot as ParentNode
      const focused = root.querySelector('.mono-tabs-tab:focus') as HTMLButtonElement | null
      focused?.blur()
    }

    /** The items to render for THIS pass. Shadow overrides for the hydration gate. */
    protected _itemsForRender(): TabItem[] {
      return this.items
    }

    /** Whether per-tab icons render through a native `<slot>` (shadow) vs `data-mono-slot` (light). */
    protected _useIconSlots(): boolean {
      return false
    }

    /** Whether tab `id` has a slotted icon. Light reads its capture map; shadow its scanned set. */
    protected _iconHasContent(_id: string): boolean {
      return false
    }

    protected _renderIcon(item: TabItem): TemplateResult | typeof nothing {
      if (this._useIconSlots()) {
        // Shadow: always render the slot (DSD projects the icon); hide when empty.
        return html`
          <span
            class=${this._cls('mono-tabs-tab-icon', 'icon')}
            mono-icon
            aria-hidden="true"
            ?mono-empty=${!this._iconHasContent(item.id)}
          >
            <slot name=${`icon-${item.id}`}></slot>
          </span>
        `
      }

      // Light: only render the icon wrapper when a slotted icon was captured.
      if (!this._iconHasContent(item.id)) return nothing

      return html`
        <span class=${this._cls('mono-tabs-tab-icon', 'icon')} mono-icon aria-hidden="true">
          <span data-mono-slot=${`icon-${item.id}`}></span>
        </span>
      `
    }

    protected _renderBadge(item: TabItem): TemplateResult | typeof nothing {
      if (item.badge === undefined || item.badge === null || item.badge === '') {
        return nothing
      }

      return html`
        <span class=${this._cls('mono-tabs-tab-badge', 'badge')} mono-badge>
          ${item.badge}
        </span>
      `
    }

    protected override render(): TemplateResult {
      return html`
        <div class=${this._wrapperClasses} mono-tabs role="tablist" ${ref(this.bindRoot)}>
          ${this._itemsForRender().map(
            (item) => html`
              <button
                type="button"
                class=${this._tabClasses(item)}
                mono-tab
                role="tab"
                aria-selected=${this._isActive(item) ? 'true' : 'false'}
                ?disabled=${this.disabled || item.disabled}
                data-tab-id=${item.id}
                @click=${(event: Event) => this._handleClick(item, event)}
              >
                ${this._renderIcon(item)}
                <span class=${this._cls('mono-tabs-tab-label', 'label')} mono-label>
                  ${item.label}
                </span>
                ${this._renderBadge(item)}
              </button>
            `,
          )}
        </div>
      `
    }
  }

  return MonoTabsCoreClass as unknown as Constructor<MonoTabsCoreInterface> & T
}
