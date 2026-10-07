// @unocss-include

import { html, nothing, type TemplateResult } from 'lit'

import type { BreadcrumbCssClass, BreadcrumbItem } from './breadcrumb-types.js'
import { isIconifyClass } from './breadcrumb-utils.js'

export interface BreadcrumbRenderContext {
  cssClass: BreadcrumbCssClass
  separator: string
  hasSeparatorSlot: boolean
  disabled: boolean
  /**
   * Shadow build: render per-item icons through a native `<slot name="icon-<id>">`
   * (the element creates matching light-DOM `<span slot>` children styled by the
   * page's global UnoCSS — `i-…` classes can't paint inside a shadow root). The
   * light build leaves this falsy and uses `data-mono-slot` + inline `i-…` spans.
   */
  iconSlot?: boolean
  isCurrent(id: string): boolean
  getSlotIconNodes(id: string): Node[] | undefined
  onItemClick(item: BreadcrumbItem, index: number, event: Event): void
}

function clsFor(
  base: string,
  key: keyof BreadcrumbCssClass,
  cssClass: BreadcrumbCssClass,
): string {
  const extra = cssClass?.[key]
  return extra ? `${base} ${extra}` : base
}

export function renderBreadcrumbIcon(
  item: BreadcrumbItem,
  ctx: BreadcrumbRenderContext,
): TemplateResult | typeof nothing {
  const slotNodes = ctx.getSlotIconNodes(item.id)
  const hasSlot = !!(slotNodes && slotNodes.length)
  if (!hasSlot && !item.icon) return nothing

  // Shadow build: project a light-DOM icon via a native slot (a user-provided
  // `slot="icon-<id>"` child, or a synced `i-…` span created by the element),
  // since `i-…` utility classes can't resolve inside a shadow root.
  if (ctx.iconSlot && (hasSlot || isIconifyClass(item.icon))) {
    return html`
      <span
        class=${clsFor('mono-breadcrumb-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <slot name=${`icon-${item.id}`}></slot>
      </span>
    `
  }

  if (hasSlot) {
    return html`
      <span
        class=${clsFor('mono-breadcrumb-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span data-mono-slot=${`icon-${item.id}`}></span>
      </span>
    `
  }

  if (isIconifyClass(item.icon)) {
    return html`
      <span
        class=${clsFor('mono-breadcrumb-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span class=${`mono-breadcrumb-iconify ${item.icon}`} mono-glyph></span>
      </span>
    `
  }

  return html`
    <span
      class=${clsFor('mono-breadcrumb-icon', 'icon', ctx.cssClass)}
      mono-icon
      aria-hidden="true"
    >
      ${item.icon}
    </span>
  `
}

export function renderBreadcrumbBadge(
  item: BreadcrumbItem,
  ctx: BreadcrumbRenderContext,
): TemplateResult | typeof nothing {
  if (item.badge === undefined || item.badge === null || item.badge === '') {
    return nothing
  }

  const colorClass =
    item.badgeColor && item.badgeColor !== 'default' ? item.badgeColor : ''

  return html`
    <span
      class=${`${clsFor('mono-breadcrumb-badge', 'badge', ctx.cssClass)} ${colorClass}`.trim()}
      mono-badge=${colorClass}
    >
      ${item.badge}
    </span>
  `
}

export function renderBreadcrumbItemRow(
  item: BreadcrumbItem,
  index: number,
  ctx: BreadcrumbRenderContext,
): TemplateResult {
  const current = ctx.isCurrent(item.id)
  const itemClasses = [
    clsFor('mono-breadcrumb-item', 'item', ctx.cssClass),
    current ? 'current' : '',
    current && ctx.cssClass?.itemCurrent ? ctx.cssClass.itemCurrent : '',
    item.disabled ? 'disabled' : '',
    item.disabled && ctx.cssClass?.itemDisabled
      ? ctx.cssClass.itemDisabled
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  const itemAttrs = { current, disabled: !!item.disabled }

  const inner = html`
    ${renderBreadcrumbIcon(item, ctx)}
    <span class=${clsFor('mono-breadcrumb-content', 'content', ctx.cssClass)} mono-content>
      <span class=${clsFor('mono-breadcrumb-title', 'title', ctx.cssClass)} mono-title>
        ${item.title ?? item.id}
      </span>
    </span>
    ${renderBreadcrumbBadge(item, ctx)}
  `

  if (current) {
    return html`
      <li
        class=${itemClasses}
        mono-item
        ?mono-current=${itemAttrs.current}
        ?mono-disabled=${itemAttrs.disabled}
        aria-current="page"
      >
        <span
          class=${clsFor('mono-breadcrumb-action', 'action', ctx.cssClass)}
          mono-action
          aria-disabled=${item.disabled ? 'true' : 'false'}
        >
          ${inner}
        </span>
      </li>
    `
  }

  if (item.href) {
    return html`
      <li class=${itemClasses} mono-item ?mono-disabled=${itemAttrs.disabled}>
        <a
          class=${clsFor('mono-breadcrumb-action', 'action', ctx.cssClass)}
          mono-action
          href=${item.href}
          aria-disabled=${item.disabled ? 'true' : 'false'}
          @click=${(e: Event) => ctx.onItemClick(item, index, e)}
        >
          ${inner}
        </a>
      </li>
    `
  }

  return html`
    <li class=${itemClasses} mono-item ?mono-disabled=${itemAttrs.disabled}>
      <button
        type="button"
        class=${clsFor('mono-breadcrumb-action', 'action', ctx.cssClass)}
        mono-action
        aria-disabled=${item.disabled ? 'true' : 'false'}
        ?disabled=${item.disabled || ctx.disabled}
        @click=${(e: Event) => ctx.onItemClick(item, index, e)}
      >
        ${inner}
      </button>
    </li>
  `
}

export function renderBreadcrumbSeparator(
  ctx: BreadcrumbRenderContext,
  index: number,
): TemplateResult {
  if (ctx.hasSeparatorSlot) {
    return html`
      <li
        class=${clsFor('mono-breadcrumb-sep', 'separator', ctx.cssClass)}
        mono-separator
        aria-hidden="true"
      >
        <span data-mono-slot=${`separator-${index}`}></span>
      </li>
    `
  }

  return html`
    <li
      class=${clsFor('mono-breadcrumb-sep', 'separator', ctx.cssClass)}
      mono-separator
      aria-hidden="true"
    >
      ${ctx.separator}
    </li>
  `
}

export function renderBreadcrumbList(
  items: BreadcrumbItem[],
  ctx: BreadcrumbRenderContext,
): TemplateResult[] {
  const out: TemplateResult[] = []

  items.forEach((item, index) => {
    if (index > 0) {
      out.push(renderBreadcrumbSeparator(ctx, index))
    }
    out.push(renderBreadcrumbItemRow(item, index, ctx))
  })

  return out
}

/**
 * Render items with a leading separator BEFORE each item — used when the child
 * `<mono-breadcrumb-list>` is composed inside a parent `<mono-breadcrumb>` and
 * we don't know whether this child is the first sibling. The very first
 * separator is hidden via CSS:
 *   `.mono-breadcrumb-list > mono-breadcrumb-list:first-child > .mono-breadcrumb-sep:first-child { display: none; }`
 */
export function renderBreadcrumbItemsLeadingSep(
  items: BreadcrumbItem[],
  ctx: BreadcrumbRenderContext,
  startIndex = 0,
): TemplateResult[] {
  const out: TemplateResult[] = []

  items.forEach((item, i) => {
    const index = startIndex + i
    out.push(renderBreadcrumbSeparator(ctx, index))
    out.push(renderBreadcrumbItemRow(item, index, ctx))
  })

  return out
}
