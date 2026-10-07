// @unocss-include

import { html, nothing, type TemplateResult } from 'lit'

import type { MenuCssClass, MenuItem } from './menu-types.js'
import {
  isDivider,
  isGroup,
  isIconifyClass,
  isSubheader,
  getMenuAlias,
} from './menu-utils.js'

export interface MenuRenderContext {
  multiple: boolean
  selectable: boolean
  disabled: boolean
  cssClass: MenuCssClass
  isSelected(id: string): boolean
  isGroupOpen(id: string): boolean
  getSlotIconNodes(id: string): Node[] | undefined
  onItemClick(item: MenuItem, event: Event): void
  onGroupToggle(group: MenuItem, event: Event): void

  /**
   * When `true`, group/item bodies are rendered as an empty
   * `<ul class="mono-menu-list" data-mono-slot="body">` placeholder instead of
   * recursing into `item.items`. The host element re-attaches captured DOM
   * children into that slot in `updated()`, allowing arbitrary declarative
   * nesting. Defaults to `false` (the existing items-array behaviour).
   */
  bodySlot?: boolean

  /**
   * Inline chevron markup for the group expand/collapse affordance. The light
   * build leaves this undefined → the UnoCSS `.mono-icon i-mdi-chevron-right`
   * span is rendered (resolved by global CSS). The shadow build passes an inline
   * SVG here, because that utility class can't resolve inside a shadow root.
   */
  chevronSvg?: TemplateResult

  /**
   * Mark a group as the ancestor of the currently-selected item, so it gets the
   * `active` accent on its header (`.mono-menu-group.active`). Optional — when
   * absent, groups never get the ancestor-active class (legacy behaviour).
   */
  isGroupActive?(group: MenuItem): boolean

  /**
   * Render iconify-class icons (`i-mdi-…`) as a native `<slot name="icon-<id>">`
   * instead of a `<span class="i-…">`. The shadow build sets this and supplies
   * matching LIGHT-DOM `<span slot="icon-<id>">` children, so the page's global
   * UnoCSS styles them (utility classes can't resolve inside a shadow root).
   * Default (light build) keeps the inline class span.
   */
  iconSlot?: boolean
}

function clsFor(
  base: string,
  key: keyof MenuCssClass,
  cssClass: MenuCssClass,
): string {
  const extra = cssClass?.[key]
  return extra ? `${base} ${extra}` : base
}

export function renderMenuIcon(
  item: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult | typeof nothing {
  const slotNodes = ctx.getSlotIconNodes(item.id)
  const hasSlot = !!(slotNodes && slotNodes.length)

  if (hasSlot) {
    return html`
      <span
        class=${clsFor('mono-menu-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span data-mono-slot=${`icon-${item.id}`}></span>
      </span>
    `
  }

  // Shadow build: project a light-DOM icon span (styled by global UnoCSS) via a
  // native slot, since `i-…` utility classes can't resolve inside a shadow root.
  if (ctx.iconSlot && item.icon && isIconifyClass(item.icon)) {
    return html`
      <span
        class=${clsFor('mono-menu-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <slot name=${`icon-${item.id}`}></slot>
      </span>
    `
  }

  if (item.icon && isIconifyClass(item.icon)) {
    return html`
      <span
        class=${clsFor('mono-menu-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        <span class=${`mono-menu-iconify ${item.icon}`} mono-glyph></span>
      </span>
    `
  }

  if (item.icon) {
    return html`
      <span
        class=${clsFor('mono-menu-icon', 'icon', ctx.cssClass)}
        mono-icon
        aria-hidden="true"
      >
        ${item.icon}
      </span>
    `
  }

  // Fallback: render an alias avatar (e.g. "D" for "Dashboard", "PB" for
  // "Post Budget"). Important in rail-mode sidebars where labels are hidden
  // and an iconless row would otherwise leave the row visually empty.
  const alias = getMenuAlias(item.title || item.id)
  if (alias) {
    return html`
      <span
        class=${`${clsFor('mono-menu-icon', 'icon', ctx.cssClass)} alias`}
        mono-icon
        mono-alias
        aria-hidden="true"
        data-mono-alias=${alias}
      >
        ${alias}
      </span>
    `
  }

  return nothing
}

export function renderMenuBadge(
  item: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult | typeof nothing {
  if (item.badge === undefined || item.badge === null || item.badge === '') {
    return nothing
  }

  const colorClass =
    item.badgeColor && item.badgeColor !== 'default' ? item.badgeColor : ''
  return html`
    <span
      class=${`${clsFor('mono-menu-badge', 'badge', ctx.cssClass)} ${colorClass}`.trim()}
      mono-badge=${colorClass}
    >
      ${item.badge}
    </span>
  `
}

export function renderMenuAppend(
  item: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult | typeof nothing {
  if (item.badge !== undefined && item.badge !== null && item.badge !== '') {
    return renderMenuBadge(item, ctx)
  }
  if (!item.appendIcon) return nothing
  return html`
    <span
      class=${clsFor('mono-menu-append', 'appendIcon', ctx.cssClass)}
      mono-append
      aria-hidden="true"
    >
      ${item.appendIcon}
    </span>
  `
}

export function renderMenuItemRow(
  item: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult {
  const active = ctx.isSelected(item.id)
  const itemClasses = [
    clsFor('mono-menu-item', 'item', ctx.cssClass),
    active ? 'active' : '',
    active && ctx.cssClass?.itemActive ? ctx.cssClass.itemActive : '',
    item.disabled ? 'disabled' : '',
    item.disabled && ctx.cssClass?.itemDisabled ? ctx.cssClass.itemDisabled : '',
  ]
    .filter(Boolean)
    .join(' ')

  const tag = item.href ? 'a' : 'button'
  const actionInner = html`
    ${renderMenuIcon(item, ctx)}
    <span class=${clsFor('mono-menu-content', 'content', ctx.cssClass)} mono-content>
      <span class=${clsFor('mono-menu-title', 'title', ctx.cssClass)} mono-title>
        ${item.title ?? item.id}
      </span>
      ${item.subtitle
        ? html`<span
            class=${clsFor('mono-menu-subtitle', 'subtitle', ctx.cssClass)}
            mono-subtitle
            >${item.subtitle}</span
          >`
        : nothing}
    </span>
    ${renderMenuAppend(item, ctx)}
  `

  return html`
    <li class=${itemClasses} mono-item ?mono-active=${active} ?mono-disabled=${!!item.disabled}>
      ${tag === 'a'
        ? html`
            <a
              class=${clsFor('mono-menu-action', 'action', ctx.cssClass)}
              mono-action
              href=${item.href!}
              role=${ctx.selectable ? 'option' : 'link'}
              aria-current=${active ? 'page' : 'false'}
              aria-disabled=${item.disabled ? 'true' : 'false'}
              @click=${(e: Event) => ctx.onItemClick(item, e)}
            >
              ${actionInner}
            </a>
          `
        : html`
            <button
              type="button"
              class=${clsFor('mono-menu-action', 'action', ctx.cssClass)}
              mono-action
              role=${ctx.selectable ? 'option' : 'menuitem'}
              aria-selected=${ctx.selectable
                ? active
                  ? 'true'
                  : 'false'
                : nothing}
              aria-disabled=${item.disabled ? 'true' : 'false'}
              ?disabled=${item.disabled || ctx.disabled}
              @click=${(e: Event) => ctx.onItemClick(item, e)}
            >
              ${actionInner}
            </button>
          `}
      ${ctx.bodySlot && !isGroup(item)
        ? html`<ul
            class=${clsFor('mono-menu-list', 'list', ctx.cssClass)}
            mono-list
            data-mono-slot="body"
          ></ul>`
        : item.items?.length && !isGroup(item)
          ? html`<ul class=${clsFor('mono-menu-list', 'list', ctx.cssClass)} mono-list>
              ${renderMenuList(item.items, ctx)}
            </ul>`
          : nothing}
    </li>
  `
}

export function renderMenuGroup(
  group: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult {
  const open = ctx.isGroupOpen(group.id)
  const ancestorActive = ctx.isGroupActive?.(group) ?? false
  const groupClasses = [
    clsFor('mono-menu-group', 'group', ctx.cssClass),
    ancestorActive ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return html`
    <li
      class=${groupClasses}
      mono-item
      mono-group
      ?mono-open=${open}
      ?mono-active=${ancestorActive}
      ?mono-disabled=${!!group.disabled}
      data-open=${open ? 'true' : 'false'}
    >
      <button
        type="button"
        class=${clsFor('mono-menu-group-header', 'groupHeader', ctx.cssClass)}
        mono-group-header
        aria-expanded=${open ? 'true' : 'false'}
        ?disabled=${group.disabled || ctx.disabled}
        @click=${(e: Event) => ctx.onGroupToggle(group, e)}
      >
        ${renderMenuIcon(group, ctx)}
        <span class=${clsFor('mono-menu-content', 'content', ctx.cssClass)} mono-content>
          <span class=${clsFor('mono-menu-title', 'title', ctx.cssClass)} mono-title>
            ${group.title ?? group.id}
          </span>
          ${group.subtitle
            ? html`<span
                class=${clsFor(
                  'mono-menu-subtitle',
                  'subtitle',
                  ctx.cssClass,
                )}
                mono-subtitle
                >${group.subtitle}</span
              >`
            : nothing}
        </span>
        <span
          class=${clsFor(
            'mono-menu-chevron',
            'groupChevron',
            ctx.cssClass,
          )}
          mono-chevron
          aria-hidden="true"
        >
          ${ctx.chevronSvg ??
          html`<span class="mono-icon i-mdi-chevron-right" aria-hidden="true"></span>`}
        </span>
      </button>
      ${ctx.bodySlot
        ? html`<ul
            class=${clsFor('mono-menu-list', 'groupBody', ctx.cssClass)}
            mono-list
            mono-group-body
            data-mono-slot="body"
          ></ul>`
        : group.items?.length
          ? html`<ul
              class=${clsFor('mono-menu-list', 'groupBody', ctx.cssClass)}
              mono-list
              mono-group-body
            >
              ${renderMenuList(group.items, ctx)}
            </ul>`
          : nothing}
    </li>
  `
}

export function renderMenuDivider(
  item: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult {
  return html`<li
    class=${clsFor('mono-menu-divider', 'divider', ctx.cssClass)}
    mono-divider
    role="separator"
    data-id=${item.id}
  ></li>`
}

export function renderMenuSubheader(
  item: MenuItem,
  ctx: MenuRenderContext,
): TemplateResult {
  return html`<li
    class=${clsFor('mono-menu-subheader', 'subheader', ctx.cssClass)}
    mono-subheader
    data-id=${item.id}
  >
    ${item.title ?? ''}
  </li>`
}

export function renderMenuList(
  list: MenuItem[],
  ctx: MenuRenderContext,
): TemplateResult[] {
  return list.map((item) => {
    if (isDivider(item)) return renderMenuDivider(item, ctx)
    if (isSubheader(item)) return renderMenuSubheader(item, ctx)
    if (isGroup(item)) return renderMenuGroup(item, ctx)
    return renderMenuItemRow(item, ctx)
  })
}

/**
 * Render only the group rows from `list` — non-group items are skipped.
 * Used by `<mono-menu-list type="group">`.
 */
export function renderMenuGroupsOnly(
  list: MenuItem[],
  ctx: MenuRenderContext,
): TemplateResult[] {
  const out: TemplateResult[] = []
  for (const item of list) {
    if (isGroup(item)) out.push(renderMenuGroup(item, ctx))
  }
  return out
}
