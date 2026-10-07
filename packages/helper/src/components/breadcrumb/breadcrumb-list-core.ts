// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import type {
  BreadcrumbItem,
  BreadcrumbBadgeColor,
  BreadcrumbCssClass,
  BreadcrumbVariant,
  BreadcrumbSize,
  BreadcrumbColor,
} from './breadcrumb-types.js'
import { arrayHasChanged, type Constructor } from '../../composables/hybird-prop'
import {
  breadcrumbRootAttrs,
  coerceItems,
  generateBreadcrumbRootClasses,
} from './breadcrumb-utils.js'
import {
  renderBreadcrumbList,
  type BreadcrumbRenderContext,
} from './breadcrumb-render.js'

let autoBreadcrumbListId = 0

/** Public + shared-protected surface added by the list core mixin. */
export declare class MonoBreadcrumbListCoreInterface {
  items: BreadcrumbItem[]
  item?: BreadcrumbItem
  title: string
  href: string
  icon: string
  badge?: string | number
  badgeColor?: BreadcrumbBadgeColor
  current: boolean
  disabled: boolean
  variant: BreadcrumbVariant
  size: BreadcrumbSize
  color: BreadcrumbColor
  separator: string
  truncate: boolean

  getBreadcrumbItems(): BreadcrumbItem[]

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected readonly _autoId: string
  protected _hasDirectItemProps(): boolean
  protected _normalizeItem(item: Partial<BreadcrumbItem>): BreadcrumbItem
  protected _buildDirectItem(): BreadcrumbItem
  protected _getEffectiveItems(): BreadcrumbItem[]
  protected _itemsForRender(): BreadcrumbItem[]
  protected _useIconSlots(): boolean
  protected _standaloneContext(): BreadcrumbRenderContext
  protected _buildContext(): BreadcrumbRenderContext
  protected _standaloneRootClasses(): string
}

/**
 * `MonoBreadcrumbListCore` — render-mode-agnostic logic for the STANDALONE
 * `mono-breadcrumb-list`: reactive props (incl. the SSR `items` string→array
 * coercion), item resolution (`items` array / single `item` / direct single-row
 * props), the self-contained `<nav><ol>` render, and the `_useIconSlots()` /
 * `_itemsForRender()` hooks.
 *
 * The light build (`mono-breadcrumb-list.ts`) extends this and layers the
 * light-only CHILD composition (registering with a parent `<mono-breadcrumb>`
 * via `closest()` and rendering bare items). The shadow build
 * (`mono-breadcrumb-list.shadow.ts`) extends this for `@lit-labs/ssr`, rendering
 * standalone in one shadow root and overriding `_useIconSlots()`. Child mode is
 * a light-only feature (cross-element `closest()` can't work under SSR).
 *
 * SSR-safe: no `document`/`window` access.
 */
export const MonoBreadcrumbListCore = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class MonoBreadcrumbListCoreClass extends superClass {
    /**
     * For normal list mode:
     *   <mono-breadcrumb-list :items.prop="items" />
     *
     * Accepts an array (`.items` / Vue `:items.prop`) AND a JSON string
     * (`items='[...]'` attribute, or a string assigned to the PROPERTY — which is
     * what nuxt-ssr-lit does forwarding a Vue `:items="<json>"` binding to the SSR
     * renderer). The converter handles the attribute form; a string assigned to
     * the property is coerced in `willUpdate`.
     */
    @property({
      attribute: 'items',
      converter: {
        fromAttribute: (value: string | null): BreadcrumbItem[] =>
          coerceItems(value),
        toAttribute: (): string | null => null,
      },
      hasChanged: arrayHasChanged,
    })
    items: BreadcrumbItem[] = []

    /** Render one full item object. */
    @property({ attribute: false })
    item?: BreadcrumbItem

    /** Direct single-row props (typical with `v-for`). */
    @property({ type: String })
    override title = ''

    @property({ type: String })
    href = ''

    @property({ type: String })
    icon = ''

    @property()
    badge?: string | number

    @property({ attribute: 'badge-color' })
    badgeColor?: BreadcrumbBadgeColor

    @property({ type: Boolean, reflect: true })
    current = false

    @property({ type: Boolean, reflect: true })
    disabled = false

    /** Standalone styling — only used when there is no parent `<mono-breadcrumb>`. */
    @property({ type: String })
    variant: BreadcrumbVariant = 'default'

    @property({ type: String })
    size: BreadcrumbSize = 'md'

    @property({ type: String })
    color: BreadcrumbColor = 'primary'

    @property({ type: String })
    separator = '›'

    @property({ type: Boolean })
    truncate = false

    protected readonly _autoId = `mono-breadcrumb-list-item-${++autoBreadcrumbListId}`

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards `:items="<json>"` as a PROPERTY string — coerce
      // before render so the renderer never sees a string.
      if (typeof this.items === 'string') {
        this.items = coerceItems(this.items)
      }
      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    public getBreadcrumbItems(): BreadcrumbItem[] {
      return this._getEffectiveItems()
    }

    protected _hasDirectItemProps(): boolean {
      return !!(
        this.id ||
        this.title ||
        this.href ||
        this.icon ||
        this.badge !== undefined ||
        this.current ||
        this.disabled
      )
    }

    protected _normalizeItem(item: Partial<BreadcrumbItem>): BreadcrumbItem {
      const title = item.title ?? ''

      const fallbackId =
        this.id ||
        item.id ||
        item.href ||
        title.toLowerCase().trim().replace(/\s+/g, '-') ||
        this._autoId

      const normalized: BreadcrumbItem = {
        id: String(item.id ?? fallbackId),
      }

      if (item.title !== undefined) normalized.title = item.title
      if (item.icon !== undefined) normalized.icon = item.icon
      if (item.badge !== undefined) normalized.badge = item.badge
      if (item.badgeColor !== undefined) normalized.badgeColor = item.badgeColor
      if (item.href !== undefined) normalized.href = item.href
      if (item.current !== undefined) normalized.current = item.current
      if (item.disabled !== undefined) normalized.disabled = item.disabled

      return normalized
    }

    protected _buildDirectItem(): BreadcrumbItem {
      return this._normalizeItem({
        id: this.id || undefined,
        title: this.title || undefined,
        href: this.href || undefined,
        icon: this.icon || undefined,
        badge: this.badge,
        badgeColor: this.badgeColor,
        current: this.current,
        disabled: this.disabled,
      })
    }

    protected _getEffectiveItems(): BreadcrumbItem[] {
      if (this.item) {
        return [this._normalizeItem(this.item)]
      }

      if (this._hasDirectItemProps()) {
        return [this._buildDirectItem()]
      }

      if (Array.isArray(this.items) && this.items.length) {
        return this.items
      }

      return []
    }

    /**
     * The items to render for THIS render pass. Defaults to the effective items.
     * The shadow build overrides this to cap the hydration render at the
     * server-rendered count.
     */
    protected _itemsForRender(): BreadcrumbItem[] {
      return this._getEffectiveItems()
    }

    /**
     * Whether per-item icons render through a native `<slot>` (shadow build) vs
     * the light-DOM inline `i-…` span (light build).
     */
    protected _useIconSlots(): boolean {
      return false
    }

    protected _standaloneContext(): BreadcrumbRenderContext {
      const emptyCss: BreadcrumbCssClass = {}

      return {
        cssClass: emptyCss,
        separator: this.separator,
        hasSeparatorSlot: false,
        disabled: this.disabled,
        iconSlot: this._useIconSlots(),
        isCurrent: (id) => {
          const items = this._getEffectiveItems()
          for (const it of items) {
            if (it.current && it.id === id) return true
          }
          if (items.length && items.every((it) => !it.current)) {
            return items[items.length - 1].id === id
          }
          return false
        },
        getSlotIconNodes: () => undefined,
        onItemClick: () => {},
      }
    }

    /** Light build overrides this to return a parent-aware context. */
    protected _buildContext(): BreadcrumbRenderContext {
      return this._standaloneContext()
    }

    protected _standaloneRootClasses(): string {
      return generateBreadcrumbRootClasses({
        variant: this.variant,
        size: this.size,
        color: this.color,
        truncate: this.truncate,
        disabled: this.disabled,
      })
    }

    protected override render(): TemplateResult {
      const ctx = this._buildContext()
      const listClass = ctx.cssClass?.list
        ? `mono-breadcrumb-list ${ctx.cssClass.list}`
        : 'mono-breadcrumb-list'

      const attrs = breadcrumbRootAttrs(this)
      return html`
        <nav
          class=${this._standaloneRootClasses()}
          aria-label="Breadcrumb"
          mono-breadcrumb
          mono-size=${attrs.size ?? nothing}
          mono-color=${attrs.color ?? nothing}
          mono-variant=${attrs.variant ?? nothing}
          ?mono-truncate=${this.truncate}
          ?mono-disabled=${this.disabled}
        >
          <ol class=${listClass} mono-list>
            ${renderBreadcrumbList(this._itemsForRender(), ctx)}
          </ol>
        </nav>
      `
    }
  }

  return MonoBreadcrumbListCoreClass as unknown as Constructor<MonoBreadcrumbListCoreInterface> &
    T
}
