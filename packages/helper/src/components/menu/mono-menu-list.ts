// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import type {
  MenuItem,
  MenuBadgeColor,
  MenuCssClass,
  MonoMenuListType,
} from './menu-types.js'
import { isGroup, collectDefaultOpenGroups } from './menu-utils.js'
import { arrayHasChanged } from '../../composables/hybird-prop'
import {
  renderMenuList,
  renderMenuGroupsOnly,
  renderMenuGroup,
  renderMenuItemRow,
  renderMenuDivider,
  renderMenuSubheader,
  type MenuRenderContext,
} from './menu-render.js'
import type { MonoMenu } from './mono-menu.js'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

let autoMenuListId = 0

@customElement('mono-menu-list')
export class MonoMenuList extends LitElement {
  protected override createRenderRoot(): HTMLElement {
    return this
  }

  /**
   * For normal list mode:
   *   <mono-menu-list :items.prop="items" />
   *
   * For direct single-row mode (one row built from element props):
   *   <mono-menu-list type="group" title="Sales" :items.prop="children" />
   *
   * For declarative composition (any depth, any HTML inside):
   *   <mono-menu-list type="group" title="Group">
   *     <mono-menu-list type="children" title="Item A"></mono-menu-list>
   *     <mono-menu-list type="group" title="Subgroup">…</mono-menu-list>
   *   </mono-menu-list>
   *
   * In single-row mode, this `items` array becomes the built item's `children`.
   */
  @property({ attribute: false, hasChanged: arrayHasChanged })
  items: MenuItem[] = []

  /** New behavior: render exactly one menu row from a full object. */
  @property({ attribute: false })
  item?: MenuItem

  /** Render mode / declarative MenuItem.type — see header doc. */
  @property({ type: String })
  type: MonoMenuListType = 'children'

  /** Direct single-row props. Legacy alias for `type` in declarative mode. */
  @property({ attribute: 'item-type' })
  itemType?: MenuItem['type']

  @property({ type: String })
  override title = ''

  @property({ type: String })
  subtitle = ''

  @property({ type: String })
  icon = ''

  @property({ attribute: 'append-icon' })
  appendIcon = ''

  @property()
  badge?: string | number

  @property({ attribute: 'badge-color' })
  badgeColor?: MenuBadgeColor

  @property({ type: String })
  href = ''

  @property({ type: Boolean })
  disabled = false

  @property({ attribute: 'default-open', type: Boolean })
  defaultOpen = false

  private _parent: MonoMenu | null = null
  private _parentList: MonoMenuList | null = null
  private _rootList: MonoMenuList | null = null
  private _nestedChildren = new Set<MonoMenuList>()

  /** Captured DOM children, re-placed into [data-mono-slot="body"] after render. */
  private _capturedChildren: Node[] = []

  /** Idempotency guard — initial capture must run once per element lifetime,
   *  not again on reconnect (otherwise Lit's marker comments get hijacked). */
  private _childrenCaptured = false

  /** Standalone group-open state — only honored on the root-most list. */
  private _standaloneOpen = new Set<string>()

  private _childObserver: MutationObserver | null = null

  private readonly _autoId = `mono-menu-list-item-${++autoMenuListId}`

  override connectedCallback(): void {
    super.connectedCallback()

    this._parent = this.closest('mono-menu') as MonoMenu | null
    this._parentList =
      (this.parentElement?.closest('mono-menu-list') ?? null) as MonoMenuList | null
    this._rootList = this._findRootList()

    if (this._parent) {
      this._parent._registerListChild(this)
    }
    if (this._parentList) {
      this._parentList._registerNestedChild(this)
    }

    this._captureInitialChildren()
    this._setupChildObserver()

    this._seedDefaultOpenIntoParent()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()

    if (this._parent) {
      this._parent._unregisterListChild(this)
      this._parent = null
    }
    if (this._parentList) {
      this._parentList._unregisterNestedChild(this)
      this._parentList = null
    }
    this._rootList = null

    if (this._childObserver) {
      this._childObserver.disconnect()
      this._childObserver = null
    }

    // Release captured nodes the CONSUMER has adopted elsewhere, and nothing else.
    //
    // `isConnected` is the wrong test here and used to break nesting outright.
    // `_captureInitialChildren` detaches every child on purpose (`removeChild`),
    // so a pending node is disconnected BY DESIGN right up until
    // `_placeBodySlot` re-attaches it. And a row is re-parented constantly in
    // this design: each level detaches its children, renders, then appends them
    // into its own body slot, which fires disconnectedCallback on every one of
    // them. So the old filter ran while the set was legitimately full of
    // detached nodes and threw them all away — the row reconnected, skipped
    // recapture (`_childrenCaptured` is already true) and rendered an empty
    // body. Depth 3 lost its rows entirely; under Vue, which re-parents more,
    // even depth 1 did.
    //
    // What actually needs releasing is a node some other parent has taken over.
    // A node with no parent is ours and still owed a placement; a node inside us
    // is already placed.
    this._capturedChildren = this._capturedChildren.filter(
      (node) => !node.parentNode || this.contains(node),
    )
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    const itemInputsChanged = [
      'items',
      'item',
      'itemType',
      'type',
      'title',
      'subtitle',
      'icon',
      'appendIcon',
      'badge',
      'badgeColor',
      'href',
      'disabled',
      'defaultOpen',
    ].some((key) => changed.has(key))

    if (itemInputsChanged && this._parent) {
      this._seedDefaultOpenIntoParent()
    }
  }

  protected override updated(_changed: Map<PropertyKey, unknown>): void {
    this._captureExternalSiblings()
    this._placeBodySlot()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public registration / state hooks (consumed by descendants and parents)
  // ─────────────────────────────────────────────────────────────────────────

  public getMenuItems(): MenuItem[] {
    return this._getEffectiveItems()
  }

  /** @internal called by a nested `<mono-menu-list>` from its connectedCallback. */
  public _registerNestedChild(child: MonoMenuList): void {
    this._nestedChildren.add(child)
  }

  /** @internal */
  public _unregisterNestedChild(child: MonoMenuList): void {
    this._nestedChildren.delete(child)
  }

  /** Standalone (no `<mono-menu>`) group-open queries — root-most list owns the set. */
  public isGroupOpenStandalone(id: string): boolean {
    return this._standaloneOpen.has(id)
  }

  /** Seed a default-open id into the standalone state set. */
  public seedStandaloneOpen(id: string): void {
    this._standaloneOpen.add(id)
  }

  public toggleGroupStandalone(id: string): void {
    if (this._standaloneOpen.has(id)) {
      this._standaloneOpen.delete(id)
    } else {
      this._standaloneOpen.add(id)
    }
    this.requestUpdate()
    for (const child of this._nestedChildren) child.requestUpdate()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: discovery / capture / re-placement
  // ─────────────────────────────────────────────────────────────────────────

  private _findRootList(): MonoMenuList | null {
    if (!this._parentList) return null
    let cur: MonoMenuList = this._parentList
    while (cur._parentList) cur = cur._parentList
    return cur
  }

  private _captureInitialChildren(): void {
    if (this._childrenCaptured) return
    this._childrenCaptured = true
    for (const node of monoHostChildNodes(this)) {
      this._capturedChildren.push(node)
      if (node.parentNode === this) this.removeChild(node)
    }
  }

  /**
   * Capture external Element children that landed on the host AFTER Lit's
   * most recent render — typically because a framework (Vue/React) inserted
   * nodes via `v-for`, `v-if`, etc. We deliberately skip non-Element nodes
   * (text / comment) because Lit places its own marker comments around the
   * rendered region and stealing those breaks the part graph.
   */
  private _captureExternalSiblings(): boolean {
    const root = this.firstElementChild
    let captured = false
    for (const node of monoHostChildNodes(this)) {
      if (node === root) continue
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      // Dedupe: this runs from `updated()` on every render, so a node the consumer
      // puts back would be pushed again and again — the array had no removal path
      // at all and simply grew, replaying an ever-longer list on each placement.
      if (!this._capturedChildren.includes(node)) this._capturedChildren.push(node)
      if (node.parentNode === this) this.removeChild(node)
      captured = true
    }
    return captured
  }

  private _setupChildObserver(): void {
    if (this._childObserver) return
    this._childObserver = new MutationObserver(() => {
      const root = this.firstElementChild
      for (const node of monoHostChildNodes(this)) {
        if (node === root) continue
        if (node.nodeType !== Node.ELEMENT_NODE) continue
        this.requestUpdate()
        return
      }
    })
    this._childObserver.observe(this, { childList: true, subtree: false })
  }

  private _placeBodySlot(): void {
    if (!this._capturedChildren.length) return
    const target = this.querySelector('[data-mono-slot="body"]')
    if (!target) return
    for (const node of this._capturedChildren) {
      placeSlotNode(target, node)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal: item synthesis
  // ─────────────────────────────────────────────────────────────────────────

  private _hasCapturedChildren(): boolean {
    return this._capturedChildren.length > 0
  }

  private _hasDirectItemProps(): boolean {
    return !!(
      this.id ||
      this.title ||
      this.subtitle ||
      this.icon ||
      this.appendIcon ||
      this.badge !== undefined ||
      this.href ||
      this.itemType ||
      // `type` only counts as a direct prop when it's specifically declarative
      (this.type && this.type !== 'children') ||
      this.defaultOpen ||
      this.disabled
    )
  }

  /**
   * Declarative mode: `type` describes MenuItem.type and the body is composed
   * from captured DOM children instead of `items`.
   *
   * The order of the checks is the contract. Captured children win outright —
   * they ARE the body. An explicit `items` array comes next, and specifically
   * BEATS direct props: the previous order returned `true` as soon as any direct
   * prop was set, so `<mono-menu-list type="group" title="Sales" :items.prop="kids">`
   * — the single-row form documented in the class header and in `MenuListProps` —
   * landed in declarative mode. `_buildDeclarativeItem()` drops `items` on
   * purpose, so that row rendered an empty `[data-mono-slot="body"]` nothing was
   * ever placed into, and `_buildDirectItem()` (the one branch that does carry
   * `items`) was unreachable.
   *
   * It doubles as a safety net for the element form: a group whose DOM children
   * never made it into `_capturedChildren` now falls back to its `items` array
   * rather than rendering a chevron over an empty body.
   */
  private _isDeclarativeMode(): boolean {
    if (this.item) return false
    if (this._hasCapturedChildren()) return true
    if (this.items.length) return false
    return this._hasDirectItemProps()
  }

  private _typeAsMenuItemType(): MenuItem['type'] | undefined {
    if (this.itemType) return this.itemType
    switch (this.type) {
      case 'item':
      case 'children':
        return 'item'
      case 'group':
        return 'group'
      case 'divider':
        return 'divider'
      case 'subheader':
        return 'subheader'
      default:
        return undefined
    }
  }

  private _normalizeItem(item: Partial<MenuItem>): MenuItem {
    const title = item.title ?? ''
    const fallbackId =
      this.id ||
      item.id ||
      item.href ||
      title.toLowerCase().trim().replace(/\s+/g, '-') ||
      this._autoId

    const normalized: MenuItem = {
      id: String(item.id ?? fallbackId),
    }

    if (item.type !== undefined) normalized.type = item.type
    if (item.title !== undefined) normalized.title = item.title
    if (item.subtitle !== undefined) normalized.subtitle = item.subtitle
    if (item.icon !== undefined) normalized.icon = item.icon
    if (item.appendIcon !== undefined) normalized.appendIcon = item.appendIcon
    if (item.badge !== undefined) normalized.badge = item.badge
    if (item.badgeColor !== undefined) normalized.badgeColor = item.badgeColor
    if (item.href !== undefined) normalized.href = item.href
    if (item.disabled !== undefined) normalized.disabled = item.disabled
    if (item.items !== undefined) normalized.items = item.items
    if (item.defaultOpen !== undefined) normalized.defaultOpen = item.defaultOpen

    return normalized
  }

  private _buildDirectItem(): MenuItem {
    return this._normalizeItem({
      id: this.id || undefined,
      type: this._typeAsMenuItemType(),
      title: this.title || undefined,
      subtitle: this.subtitle || undefined,
      icon: this.icon || undefined,
      appendIcon: this.appendIcon || undefined,
      badge: this.badge,
      badgeColor: this.badgeColor,
      href: this.href || undefined,
      disabled: this.disabled,
      items: this.items.length ? this.items : undefined,
      defaultOpen: this.defaultOpen,
    })
  }

  private _buildDeclarativeItem(): MenuItem {
    return this._normalizeItem({
      id: this.id || undefined,
      type: this._typeAsMenuItemType(),
      title: this.title || undefined,
      subtitle: this.subtitle || undefined,
      icon: this.icon || undefined,
      appendIcon: this.appendIcon || undefined,
      badge: this.badge,
      badgeColor: this.badgeColor,
      href: this.href || undefined,
      disabled: this.disabled,
      defaultOpen: this.defaultOpen,
      // `items` deliberately omitted: body is composed from captured DOM children
      // (placed into <ul data-mono-slot="body"> after render).
    })
  }

  private _getEffectiveItems(): MenuItem[] {
    if (this.item) {
      const normalized = this._normalizeItem(this.item)
      if (this.items.length) normalized.items = this.items
      return [normalized]
    }

    if (this._isDeclarativeMode()) {
      return [this._buildDeclarativeItem()]
    }

    if (this._hasDirectItemProps()) {
      return [this._buildDirectItem()]
    }

    if (Array.isArray(this.items) && this.items.length) {
      return this.items
    }

    return []
  }

  private _seedDefaultOpenIntoParent(): void {
    if (!this._parent) return
    for (const id of collectDefaultOpenGroups(this._getEffectiveItems())) {
      this._parent.expandGroup(id)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * A group is "active" while any descendant row is the selected one.
   * `renderMenuGroup` puts `.mono-menu-group.active` on such a header and
   * menu.css already styles it — the class simply never appeared, because
   * nothing supplied this callback.
   */
  private _hasSelectedDescendant(
    group: MenuItem,
    isSelected: (id: string) => boolean,
  ): boolean {
    return (group.items ?? []).some(
      (child) => isSelected(child.id) || this._hasSelectedDescendant(child, isSelected),
    )
  }

  private _buildContext(declarative: boolean): MenuRenderContext {
    const parent = this._parent

    if (parent) {
      return {
        multiple: parent.multiple,
        selectable: parent.selectable,
        disabled: parent.disabled,
        cssClass: parent.cssClass ?? {},
        bodySlot: declarative,
        isSelected: (id) => parent.isItemSelected(id),
        isGroupActive: (group) =>
          this._hasSelectedDescendant(group, (id) => parent.isItemSelected(id)),
        isGroupOpen: (id) => parent.isGroupOpenPublic(id),
        getSlotIconNodes: (id) => parent.getSlotIconNodes(id),
        onItemClick: (item, e) => parent.requestItemActivation(item, e),
        onGroupToggle: (group, e) => parent.requestGroupToggle(group, e),
      }
    }

    const stateOwner = this._rootList ?? this
    const emptyCss: MenuCssClass = {}

    return {
      multiple: false,
      selectable: true,
      disabled: false,
      cssClass: emptyCss,
      bodySlot: declarative,
      isSelected: () => false,
      // A standalone list has no selection for a group to be an ancestor of.
      isGroupActive: () => false,
      isGroupOpen: (id) => stateOwner.isGroupOpenStandalone(id),
      getSlotIconNodes: () => undefined,
      onItemClick: () => {},
      onGroupToggle: (group) => {
        stateOwner.toggleGroupStandalone(group.id)
      },
    }
  }

  private _renderSingleRow(
    item: MenuItem,
    ctx: MenuRenderContext,
  ): TemplateResult | typeof nothing {
    if (item.type === 'divider') return renderMenuDivider(item, ctx)
    if (item.type === 'subheader') return renderMenuSubheader(item, ctx)
    if (item.type === 'group') return renderMenuGroup(item, ctx)
    return renderMenuItemRow(item, ctx)
  }

  private _seedDefaultOpenIntoStandalone(item: MenuItem): void {
    if (this._parent) return
    if (!isGroup(item) || !item.defaultOpen) return
    const owner = this._rootList ?? this
    owner.seedStandaloneOpen(item.id)
  }

  protected override render(): TemplateResult {
    // Declarative mode — synthesise one row from props, body comes from captured slot.
    if (this._isDeclarativeMode()) {
      const ctx = this._buildContext(true)
      const item = this._buildDeclarativeItem()
      this._seedDefaultOpenIntoStandalone(item)

      const row = this._renderSingleRow(item, ctx)

      // Nested element renders just the row — `display: contents` makes it flow
      // into the parent's <ul>.
      if (this._parentList) {
        return html`${row}`
      }

      // Top-level wraps in <ul class="mono-menu-list">.
      const listClass = ctx.cssClass?.list
        ? `mono-menu-list ${ctx.cssClass.list}`
        : 'mono-menu-list'
      return html`<ul class=${listClass} mono-list>${row}</ul>`
    }

    // Items-array mode (legacy renderer-mode meaning of `type`).
    const ctx = this._buildContext(false)
    const effectiveItems = this._getEffectiveItems()
    const listClass = ctx.cssClass?.list
      ? `mono-menu-list ${ctx.cssClass.list}`
      : 'mono-menu-list'

    if (this.type === 'group') {
      const groupItems = effectiveItems.filter((it) => isGroup(it))
      if (!this._parent) {
        for (const group of groupItems) {
          if (group.defaultOpen) {
            const owner = this._rootList ?? this
            owner.seedStandaloneOpen(group.id)
          }
        }
      }
      return html`<ul class=${listClass} mono-list>${renderMenuGroupsOnly(groupItems, ctx)}</ul>`
    }

    if (!this._parent) {
      const owner = this._rootList ?? this
      for (const id of collectDefaultOpenGroups(effectiveItems)) {
        owner.seedStandaloneOpen(id)
      }
    }

    return html`<ul class=${listClass} mono-list>${renderMenuList(effectiveItems, ctx)}</ul>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-menu-list': MonoMenuList
  }
}
