// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import type {
  MenuItem,
  MenuDensity,
  MenuColor,
  MenuCssClass,
  MenuChangeEventDetail,
  MenuClickEventDetail,
  MenuToggleGroupEventDetail,
} from './menu-types.js'

import {
  arrayHasChanged,
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

import {
  menuRootAttrs,
  isItem,
  isGroup,
  findItem,
  findActivePath,
  collectDefaultOpenGroups,
  generateMenuRootClasses,
} from './menu-utils.js'
import { customColorStyle, isThemeColorToken } from '../../composables/color.js'

import { renderMenuList, type MenuRenderContext } from './menu-render.js'

/**
 * Minimal interface for descendant `<mono-menu-list>` instances. Avoids a
 * circular import — the real class is in `mono-menu-list.ts`.
 */
export interface MonoMenuListLike extends HTMLElement {
  requestUpdate(): void
  getMenuItems?(): MenuItem[]
}

/** Coerce any `items` input (array, JSON string, or other) to a MenuItem array. */
function coerceItems(value: unknown): MenuItem[] {
  if (Array.isArray(value)) return value as MenuItem[]
  if (typeof value === 'string') {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoMenuCoreInterface {
  items: MenuItem[]
  modelValue: string | string[]
  multiple: boolean
  density: MenuDensity
  color: MenuColor
  nav: boolean
  selectable: boolean
  disabled: boolean
  controlled: boolean
  cssClass: MenuCssClass
  cssClassName: string

  select(id: string): void
  deselect(id: string): void
  toggleGroup(id: string): void
  expandGroup(id: string): void
  collapseGroup(id: string): void
  getActivePath(): MenuItem[]
  requestItemActivation(item: MenuItem, event?: Event): void
  requestGroupToggle(group: MenuItem, event?: Event): void
  isItemSelected(id: string): boolean
  isGroupOpenPublic(id: string): boolean
  getSlotIconNodes(id: string): Node[] | undefined
  _registerListChild(child: MonoMenuListLike): void
  _unregisterListChild(child: MonoMenuListLike): void

  // Protected surface used by the light/shadow render() wrappers.
  protected _openGroups: Set<string>
  protected _slotIcons: Map<string, Node[]>
  protected _listChildren: Set<MonoMenuListLike>
  protected _seedDefaultOpenGroups(): void
  protected _setCssClass(value: unknown): void
  protected _cls(base: string, key: keyof MenuCssClass): string
  protected _rootClasses: string
  protected _isSelected(id: string): boolean
  protected _isGroupOpen(id: string): boolean
  protected _renderContext(): MenuRenderContext
  protected _renderBody(): TemplateResult
  protected _useIconSlots(): boolean
  protected _chevronSvg(): TemplateResult | undefined
  protected _handleItemActivation(item: MenuItem, event?: Event): void
  protected _handleGroupToggle(group: MenuItem, event?: Event): void
}

/**
 * `MonoMenuCore` — all render-mode-agnostic logic for `mono-menu`: reactive
 * props, hybrid aliases, css-class interop, selection + open-group state,
 * default-open seeding, the click/toggle/change events, the full public API, and
 * the chrome `render()` (which delegates the body to a `_renderBody()` hook).
 *
 * Leaves to each build: `createRenderRoot()`, the body strategy (light: slot
 * capture / declarative `slot="body"`; shadow: items-driven only), and
 * `_chevronSvg()` (light: undefined → UnoCSS icon span; shadow: inline SVG).
 */
export const MonoMenuCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoMenuCoreClass extends superClass {
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

    // `items` accepts BOTH an array (`.items = [...]` / Vue `:items.prop`) AND a
    // JSON string (`items='[...]'` attribute, or a string assigned to the
    // PROPERTY, which is what nuxt-ssr-lit does when forwarding a Vue
    // `:items="..."` binding to the SSR renderer). The attribute converter
    // parses the attribute form; a string assigned to the property is coerced in
    // `willUpdate`. NB: this is a Lit-GENERATED accessor (not a custom get/set) —
    // custom accessors lose Lit's pre-upgrade-property handling, so a framework
    // that sets `el.items` before the element upgrades would shadow the accessor
    // and break reactivity.
    @property({
      attribute: 'items',
      converter: {
        fromAttribute: (value: string | null): MenuItem[] => coerceItems(value),
        toAttribute: (): string | null => null,
      },
      hasChanged: arrayHasChanged,
    })
    items: MenuItem[] = []

    @property({ attribute: 'model-value', reflect: true })
    modelValue: string | string[] = ''

    @property({ reflect: true, converter: booleanStringConverter })
    multiple = false

    @property({ type: String })
    density: MenuDensity = 'comfortable'

    @property({ type: String })
    color: MenuColor = 'primary'

    @property({ reflect: true, converter: booleanStringConverter })
    nav = true

    @property({ reflect: true, converter: booleanStringConverter })
    selectable = true

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    controlled = false

    @property({ attribute: false })
    cssClass: MenuCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    @state()
    protected _openGroups = new Set<string>()

    /**
     * Group ids whose `defaultOpen` has already been honoured. Not `@state` — it
     * gates seeding only. Without it, a fresh `items` array (which is what an
     * inline Vue binding produces on every render) re-applied `defaultOpen` and
     * overrode the user's own collapse.
     */
    private _seededGroups = new Set<string>()

    /** Per-item icon slots — populated by the light build's slot capture. */
    protected _slotIcons = new Map<string, Node[]>()

    /** Declarative `<mono-menu-list>` children (light build registry). */
    protected _listChildren = new Set<MonoMenuListLike>()

    /** Ancestor `<mono-sidebar>` whose rail-collapsed state this menu mirrors. */
    private _railSidebar: Element | null = null
    private _railObserver: MutationObserver | null = null

    override connectedCallback(): void {
      super.connectedCallback()
      if (isServer) return
      this._setupRailSync()
    }

    override disconnectedCallback(): void {
      if (!isServer) this._teardownRailSync()
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      // A string can reach the `items` PROPERTY (nuxt-ssr-lit forwards the Vue
      // `:items="<json>"` binding as a property string) — coerce before render so
      // `renderMenuList` never iterates a string.
      if (typeof this.items === 'string') {
        this.items = coerceItems(this.items)
      }
      // @ts-ignore — base may not declare willUpdate, but LitElement does.
      super.willUpdate?.(changed)
      if (changed.has('items')) {
        this._seedDefaultOpenGroups()
      }
    }

    protected _seedDefaultOpenGroups(): void {
      const existing = new Set(this._openGroups)
      let changed = false

      for (const id of collectDefaultOpenGroups(this.items)) {
        // Seed each id ONCE. This runs whenever `items` changes identity, and a
        // consumer passing an inline `:items="[...]"` hands over a fresh array on
        // every parent render — so re-seeding forced a group the user had just
        // collapsed back open on the next unrelated re-render.
        if (this._seededGroups.has(id)) continue
        this._seededGroups.add(id)
        if (!existing.has(id)) {
          existing.add(id)
          changed = true
        }
      }

      if (!changed) return
      this._openGroups = existing
    }

    protected _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }

      if (typeof value === 'object') {
        this.cssClass = value as MenuCssClass
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
            this.cssClass = JSON.parse(trimmed) as MenuCssClass
            return
          } catch {
            // fall through
          }
        }

        this.cssClassName = trimmed
      }
    }

    protected _cls(base: string, key: keyof MenuCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _rootClasses(): string {
      return generateMenuRootClasses({
        density: this.density,
        color: this.color,
        nav: this.nav,
        selectable: this.selectable,
        disabled: this.disabled,
        cssClassName: this.cssClassName,
        rootExtra: this.cssClass?.root,
      })
    }

    protected _isSelected(id: string): boolean {
      if (this.multiple) {
        return Array.isArray(this.modelValue) && this.modelValue.includes(id)
      }
      return !this.multiple && this.modelValue === id
    }

    protected _isGroupOpen(id: string): boolean {
      return this._openGroups.has(id)
    }

    /** A group is "active" when the currently-selected item is a descendant. */
    protected _isGroupActive(group: MenuItem): boolean {
      const selected = this.multiple
        ? Array.isArray(this.modelValue)
          ? this.modelValue
          : []
        : [this.modelValue as string]
      const ids = new Set(selected.filter(Boolean))
      if (!ids.size) return false
      const contains = (node: MenuItem): boolean =>
        !!node.items?.some((child) => ids.has(child.id) || contains(child))
      return contains(group)
    }

    private _findRegisteredItem(id: string): MenuItem | null {
      for (const child of this._listChildren) {
        const items = child.getMenuItems?.() ?? []
        const found = findItem(items, id)
        if (found) return found
      }
      return null
    }

    private _findAnyItem(id: string): MenuItem | null {
      return findItem(this.items, id) ?? this._findRegisteredItem(id)
    }

    private _getRegisteredActivePath(id: string): MenuItem[] {
      for (const child of this._listChildren) {
        const items = child.getMenuItems?.() ?? []
        const path = findActivePath(items, id)
        if (path.length) return path
      }
      return []
    }

    public select(id: string): void {
      const item = this._findAnyItem(id)
      if (!item || !isItem(item)) return
      this._handleItemActivation(item)
    }

    public deselect(id: string): void {
      if (!this.multiple) {
        if (this.modelValue === id) {
          const oldValue = this.modelValue
          this.modelValue = ''
          this._emitChange(id, this._findAnyItem(id) ?? { id }, false, oldValue)
        }
        return
      }
      if (Array.isArray(this.modelValue) && this.modelValue.includes(id)) {
        const oldValue = [...this.modelValue]
        this.modelValue = this.modelValue.filter((v) => v !== id)
        this._emitChange(id, this._findAnyItem(id) ?? { id }, false, oldValue)
      }
    }

    public toggleGroup(id: string): void {
      const item = this._findAnyItem(id)
      if (!item || !isGroup(item)) return
      this._handleGroupToggle(item)
    }

    public expandGroup(id: string): void {
      if (this._openGroups.has(id)) return
      const next = new Set(this._openGroups)
      next.add(id)
      this._openGroups = next
    }

    public collapseGroup(id: string): void {
      if (!this._openGroups.has(id)) return
      const next = new Set(this._openGroups)
      next.delete(id)
      this._openGroups = next
    }

    public override focus(): void {
      const first = this.querySelector(
        '.mono-menu-action, .mono-menu-group-header',
      ) as HTMLElement | null
      first?.focus()
    }

    public getActivePath(): MenuItem[] {
      const id = !this.multiple
        ? (this.modelValue as string)
        : Array.isArray(this.modelValue) && this.modelValue.length
          ? this.modelValue[this.modelValue.length - 1]
          : ''
      if (!id) return []
      const ownPath = findActivePath(this.items, id)
      if (ownPath.length) return ownPath
      return this._getRegisteredActivePath(id)
    }

    public requestItemActivation(item: MenuItem, event?: Event): void {
      this._handleItemActivation(item, event)
    }

    public requestGroupToggle(group: MenuItem, event?: Event): void {
      this._handleGroupToggle(group, event)
    }

    public isItemSelected(id: string): boolean {
      return this._isSelected(id)
    }

    public isGroupOpenPublic(id: string): boolean {
      return this._isGroupOpen(id)
    }

    public getSlotIconNodes(id: string): Node[] | undefined {
      return this._slotIcons.get(id)
    }

    /** @internal called by `<mono-menu-list>` from its connectedCallback. */
    public _registerListChild(child: MonoMenuListLike): void {
      this._listChildren.add(child)
    }

    /** @internal called by `<mono-menu-list>` from its disconnectedCallback. */
    public _unregisterListChild(child: MonoMenuListLike): void {
      this._listChildren.delete(child)
    }

    // ─────── RAIL-COLLAPSE SYNC ───────
    // A `<mono-sidebar>` collapses its rail to icons via descendant selectors +
    // inherited `--mono-menu-*` custom properties on its `.mono-sidebar-body`.
    // Neither reaches a slotted *light* `<mono-menu>` across the sidebar's shadow
    // boundary. So instead we mirror the sidebar's `data-rail-collapsed` host
    // attribute (which IS light-DOM-reachable) and apply the SAME collapse vars
    // inline on our own host — they then inherit normally into our render root
    // (light: `this`; shadow: the shadow root), reusing menu.css's `var()` rules.

    /** Walk up across slot + shadow boundaries to the host `<mono-sidebar>`, if any. */
    private _findAncestorSidebar(): Element | null {
      let node: Node | null = this.assignedSlot ?? this.parentNode
      while (node) {
        if (
          node instanceof Element &&
          (node.localName === 'mono-sidebar' ||
            node.localName === 'mono-shadow-sidebar')
        )
          return node
        const el = node as Element & { assignedSlot?: HTMLSlotElement | null }
        node =
          el.assignedSlot ??
          (node instanceof ShadowRoot ? node.host : node.parentNode)
      }
      return null
    }

    private _setupRailSync(retries = 30): void {
      if (this._railObserver) this._teardownRailSync()
      const sidebar = this._findAncestorSidebar()
      if (!sidebar) {
        // Under SSR hydration the ancestor `<mono-sidebar>` may not be upgraded
        // (or even attached) yet when this menu connects — `defer-hydration`
        // makes the order nondeterministic. Bailing permanently here leaves the
        // menu with a stale collapsed=false snapshot and no observer, so retry
        // for a few frames before giving up.
        if (retries <= 0 || isServer) return
        // rAF alone is not enough — it never fires in a hidden/occluded tab.
        // Both handles are stored so `_teardownRailSync` can cancel them: a
        // disconnected menu was otherwise kept alive by a pending 32ms timer, and
        // a reconnect could leave two retry chains racing each other.
        let fired = false
        const retry = (): void => {
          if (fired) return
          fired = true
          this._railRetryRaf = null
          this._railRetryTimer = null
          if (this.isConnected) this._setupRailSync(retries - 1)
        }
        this._cancelRailRetry()
        if (typeof requestAnimationFrame !== 'undefined') {
          this._railRetryRaf = requestAnimationFrame(retry)
        }
        this._railRetryTimer = setTimeout(retry, 32) as unknown as number
        return
      }
      this._railSidebar = sidebar
      this._applyRailCollapsed(sidebar.hasAttribute('data-rail-collapsed'))
      this._railObserver = new MutationObserver(() => {
        this._applyRailCollapsed(sidebar.hasAttribute('data-rail-collapsed'))
      })
      this._railObserver.observe(sidebar, {
        attributes: true,
        attributeFilter: ['data-rail-collapsed'],
      })
    }

    /** Pending rail-sync retry handles (see `_setupRailSync`). */
    private _railRetryRaf: number | null = null
    private _railRetryTimer: number | null = null

    private _cancelRailRetry(): void {
      if (this._railRetryRaf !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this._railRetryRaf)
      }
      if (this._railRetryTimer !== null) clearTimeout(this._railRetryTimer)
      this._railRetryRaf = null
      this._railRetryTimer = null
    }

    private _teardownRailSync(): void {
      this._cancelRailRetry()
      this._railObserver?.disconnect()
      this._railObserver = null
      this._railSidebar = null
    }

    /** The seven collapse vars mirror `sidebar.css` `.mono-sidebar.effective-rail .mono-sidebar-body`. */
    private static readonly _RAIL_COLLAPSE_VARS: ReadonlyArray<[string, string]> = [
      ['--mono-menu-label-display', 'none'],
      ['--mono-menu-row-display', 'flex'],
      ['--mono-menu-row-justify', 'center'],
      ['--mono-menu-action-width', 'auto'],
      ['--mono-menu-action-justify', 'center'],
      ['--mono-menu-action-gap', '0'],
      ['--mono-menu-group-children-display', 'none'],
    ]

    private _applyRailCollapsed(collapsed: boolean): void {
      this.toggleAttribute('rail-collapsed', collapsed)
      const vars = MonoMenuCoreClass._RAIL_COLLAPSE_VARS
      if (collapsed) {
        for (const [name, value] of vars) this.style.setProperty(name, value)
      } else {
        for (const [name] of vars) this.style.removeProperty(name)
      }
    }

    protected _handleItemActivation(item: MenuItem, event?: Event): void {
      if (item.disabled || this.disabled) return

      // A real click on an item: the plain `click` is the native one, decorated
      // with `detail.item` on its way to the host.
      dispatchMonoEvent<MenuClickEventDetail>(this, 'click', {
        value: item.id,
        item,
        sourceEvent: event,
      })

      if (this.controlled) return
      if (!this.selectable) return

      if (this.multiple) {
        const oldArr = Array.isArray(this.modelValue) ? [...this.modelValue] : []
        let nextArr: string[]
        let selected: boolean

        if (oldArr.includes(item.id)) {
          nextArr = oldArr.filter((v) => v !== item.id)
          selected = false
        } else {
          nextArr = [...oldArr, item.id]
          selected = true
        }

        this.modelValue = nextArr
        this._emitChange(item.id, item, selected, oldArr, event)
        return
      }

      const oldValue = this.modelValue as string
      if (oldValue === item.id) return

      this.modelValue = item.id
      this._emitChange(item.id, item, true, oldValue, event)
    }

    private _emitChange(
      value: string,
      item: MenuItem,
      selected: boolean,
      oldValue: string | string[],
      event?: Event,
    ): void {
      const detail: MenuChangeEventDetail = {
        modelValue: this.modelValue,
        oldValue,
        value,
        item,
        selected,
        sourceEvent: event,
      }
      dispatchMonoEvent(this, 'change', detail)
    }

    protected _handleGroupToggle(group: MenuItem, event?: Event): void {
      if (group.disabled || this.disabled) return
      const oldOpen = this._openGroups.has(group.id)
      const next = new Set(this._openGroups)

      if (oldOpen) next.delete(group.id)
      else next.add(group.id)

      this._openGroups = next

      const detail: MenuToggleGroupEventDetail = {
        groupId: group.id,
        open: !oldOpen,
        oldOpen,
        group,
        sourceEvent: event,
      }
      dispatchMonoEvent(this, 'toggle-group', detail)
    }

    /** Inline chevron — light: undefined (UnoCSS span); shadow: inline SVG. */
    protected _chevronSvg(): TemplateResult | undefined {
      return undefined
    }

    /** Whether to project icons via native `<slot>` — light: false; shadow: true. */
    protected _useIconSlots(): boolean {
      return false
    }

    protected _renderContext(): MenuRenderContext {
      return {
        multiple: this.multiple,
        selectable: this.selectable,
        disabled: this.disabled,
        cssClass: this.cssClass,
        chevronSvg: this._chevronSvg(),
        iconSlot: this._useIconSlots(),
        isSelected: (id) => this._isSelected(id),
        isGroupOpen: (id) => this._isGroupOpen(id),
        isGroupActive: (group) => this._isGroupActive(group),
        getSlotIconNodes: (id) => this._slotIcons.get(id),
        onItemClick: (item, e) => this._handleItemActivation(item, e),
        onGroupToggle: (group, e) => this._handleGroupToggle(group, e),
      }
    }

    /** Default body — items-driven. Light overrides to add the slot="body" path. */
    protected _renderBody(): TemplateResult {
      return html`
        <ul
          class=${this._cls('mono-menu-list', 'list')}
          mono-list
          role=${this.selectable ? 'listbox' : 'menu'}
        >
          ${renderMenuList(this.items, this._renderContext())}
        </ul>
      `
    }

    /**

     * Carries a literal `color` (`#7c3aed`, `rgb(…)`) that no stylesheet can know about.
     * Empty for a palette slot, which resolves entirely through the `.mono-menu.<token>`
     * rules instead.
     *
     * Must land on the ROOT element, not the host: a class-based `-preset` declared on
     * the root beats an inherited one, so a host-level write would silently lose. If a
     * `_syncRootFromState`-style attribute re-assert is ever added here (sidebar has one),
     * it has to serialize from THIS getter or it will wipe the colour.
     */
    protected get _inlineRootStyle(): string {
      const raw = isThemeColorToken(this.color) || this.color === 'surface' ? '' : this.color
      return customColorStyle(raw, 'menu')
    }


    protected override render(): TemplateResult {
      const attrs = menuRootAttrs(this)
      return html`
        <nav
          class=${this._rootClasses}
          style=${this._inlineRootStyle}
          role="navigation"
          mono-menu
          mono-density=${attrs.density ?? nothing}
          mono-color=${attrs.color ?? nothing}
          ?mono-plain=${!this.nav}
          ?mono-disabled=${this.disabled}
        >
          ${this._renderBody()}
        </nav>
      `
    }
  }

  return MonoMenuCoreClass as unknown as Constructor<MonoMenuCoreInterface> & T
}
