// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { ref } from 'lit/directives/ref.js'

import type {
  ButtonDropdownClickEventDetail,
  ButtonDropdownCssClass,
  ButtonDropdownItem,
  ButtonDropdownProps,
} from './button-dropdown-types.js'
import type { ButtonProps } from './button-types.js'
import type { DropdownPlacement, DropdownSide, DropdownAlign, DropdownSource } from '../dropdown/dropdown-types.js'

import {
  booleanStringConverter,
  numberStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { rateLimitHasChanged } from '../../composables/rate-limit'
import { PopupPortalController } from '../../composables/popup-portal'
import { applyProps } from '../../composables/element-props'

/**
 * Would these two entry lists RENDER identically?
 *
 * Function-valued fields are skipped: a consumer rebuilds `onClick` on every render
 * so it closes over the current row, and those handlers are resolved at click time
 * rather than baked into the DOM, so they cannot make the output differ. Everything
 * else — label, icon, size, color, variant, disabled — is compared strictly, and any
 * non-primitive field (a fresh `cssClass` object, say) simply compares unequal and
 * falls back to a normal update. Conservative by construction: a false "same" would
 * show stale markup, a false "different" only costs the render we have today.
 */
function sameButtonItems(a?: ButtonDropdownItem[], b?: ButtonDropdownItem[]): boolean {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    const x = a[i] as Record<string, unknown> | undefined
    const y = b[i] as Record<string, unknown> | undefined
    if (x === y) continue
    if (!x || !y || typeof x !== 'object' || typeof y !== 'object') return false

    const keys = Object.keys(x)
    if (keys.length !== Object.keys(y).length) return false

    for (const key of keys) {
      const xv = x[key]
      const yv = y[key]
      if (typeof xv === 'function' && typeof yv === 'function') continue
      if (xv !== yv) return false
    }
  }

  return true
}

/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoButtonDropdownCoreInterface {
  buttons: ButtonDropdownItem[]
  min: number
  placement: DropdownPlacement
  offset: number
  color?: ButtonProps['color']
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  trigger?: ButtonProps & { label?: string; icon?: string }
  modelValue: boolean
  disabled: boolean
  closeOnSelect: boolean
  closeOnOutsideClick: boolean
  closeOnEscape: boolean
  cssClass: ButtonDropdownCssClass
  show(source?: DropdownSource): void
  hide(source?: DropdownSource): void
  toggle(source?: DropdownSource): void

  /** Whether the entries are currently behind the trigger rather than inline. */
  readonly collapsed: boolean

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  /** Tag of the button element to render — differs per build. */
  protected _buttonTag(): string
  /** Whether entry content may be a Lit template (shadow only — see the impl). */
  protected _declarativeItems(): boolean
  protected _cls(base: string, key: keyof ButtonDropdownCssClass): string
  protected renderRow(): TemplateResult
  /** The `⋮` trigger, or `nothing` while the entries are inline. */
  protected renderTrigger(): TemplateResult | typeof nothing
  /** The menu rows — rendered INSIDE the panel each build writes itself. */
  protected renderMenuList(): TemplateResult
  /**
   * The panel is deliberately NOT built here. `PopupPortalController` physically
   * moves it into a `<body>` portal, and a node inside a `${}` expression carries
   * a `ChildPart` range that breaks when its nodes are ejected ("this `ChildPart`
   * has no `parentNode`"). Each build writes the panel as a STATIC element in its
   * own template — the same arrangement `mono-dropdown` uses — and reads these.
   */
  protected readonly panelClass: string
  protected readonly panelHidden: boolean
  protected bindPanel: (el: Element | undefined) => void
  /** Ref for the inner root each build renders — where the styling attributes go. */
  protected bindRoot: (el: Element | undefined) => void
  protected _computeRootAttrs(): Record<string, string | null>
  protected _applyRootAttrs(root: HTMLElement | null | undefined): void
  /** The `mono-item-color` an entry gets inside the menu (null = the panel's ink). */
  protected _itemColorAttr(item: ButtonDropdownItem): string | null
}

/**
 * `MonoButtonDropdownCore` — everything render-mode-agnostic for
 * `mono-button-dropdown`.
 *
 * The behaviour in one line: **while `buttons.length <= min` the entries render
 * as plain buttons; past that they ALL move into a dropdown and only the trigger
 * is left.** That all-or-nothing rule is deliberate (it mirrors the Vuetify
 * `ButtonMenu` this replaces) — a partial split would leave the row's width
 * jumping around as the action list changes.
 *
 * Two pieces are borrowed rather than rebuilt:
 * - **`PopupPortalController`** does the positioning, flipping and z-index
 *   stacking, exactly as `mono-dropdown` uses it, so this panel ranks correctly
 *   against modals and other popups.
 * - **Each entry is a real `<mono-button>`**, so every `ButtonProps` — `loading`,
 *   `throttle`, `handler`, `badge` — keeps working with nothing re-implemented.
 *   Props are pushed on with `applyProps` rather than a fixed attribute list, so
 *   a prop added to the button later flows through without touching this file.
 */
/**
 * The component's PUBLIC custom properties, handed to the popup portal so a
 * relocated panel keeps overrides an ancestor of the host set — a portaled panel
 * is a child of `<body>`, so it inherits none of them, and `getComputedStyle`
 * cannot enumerate custom properties for the portal to copy them blindly.
 *
 * Kept in step with button-dropdown.css by tests/button-dropdown-attributes.test.ts.
 */
const BUTTON_DROPDOWN_STYLE_VARS: readonly string[] = [
  '--mono-button-dropdown-bg', '--mono-button-dropdown-border',
  '--mono-button-dropdown-dark', '--mono-button-dropdown-danger',
  '--mono-button-dropdown-gap', '--mono-button-dropdown-info',
  '--mono-button-dropdown-item-base-color', '--mono-button-dropdown-item-base-hover-bg',
  '--mono-button-dropdown-item-base-hover-color', '--mono-button-dropdown-item-color',
  '--mono-button-dropdown-item-font-weight',
  '--mono-button-dropdown-item-hover', '--mono-button-dropdown-item-hover-bg',
  '--mono-button-dropdown-item-hover-color', '--mono-button-dropdown-item-radius',
  '--mono-button-dropdown-item-radius-lg', '--mono-button-dropdown-item-radius-xl',
  '--mono-button-dropdown-item-radius-xxl', '--mono-button-dropdown-light',
  '--mono-button-dropdown-list-gap', '--mono-button-dropdown-min-width',
  '--mono-button-dropdown-min-width-lg', '--mono-button-dropdown-min-width-md',
  '--mono-button-dropdown-min-width-sm', '--mono-button-dropdown-min-width-xl',
  '--mono-button-dropdown-min-width-xs', '--mono-button-dropdown-min-width-xxl',
  '--mono-button-dropdown-offset', '--mono-button-dropdown-offset-lg',
  '--mono-button-dropdown-offset-md', '--mono-button-dropdown-offset-sm',
  '--mono-button-dropdown-offset-xl', '--mono-button-dropdown-offset-xs',
  '--mono-button-dropdown-offset-xxl', '--mono-button-dropdown-padding',
  '--mono-button-dropdown-padding-lg', '--mono-button-dropdown-padding-md',
  '--mono-button-dropdown-padding-sm', '--mono-button-dropdown-padding-xl',
  '--mono-button-dropdown-padding-xs', '--mono-button-dropdown-padding-xxl',
  '--mono-button-dropdown-primary', '--mono-button-dropdown-purple',
  '--mono-button-dropdown-radius', '--mono-button-dropdown-radius-lg',
  '--mono-button-dropdown-radius-md', '--mono-button-dropdown-radius-sm',
  '--mono-button-dropdown-radius-xl', '--mono-button-dropdown-radius-xs',
  '--mono-button-dropdown-radius-xxl', '--mono-button-dropdown-ring-color',
  '--mono-button-dropdown-ring-width', '--mono-button-dropdown-secondary',
  '--mono-button-dropdown-shadow', '--mono-button-dropdown-success',
  '--mono-button-dropdown-surface', '--mono-button-dropdown-teal',
  '--mono-button-dropdown-text', '--mono-button-dropdown-warning',
] as const

export const MonoButtonDropdownCore = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class MonoButtonDropdownCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'modelValue',
        'closeOnSelect',
        'closeOnOutsideClick',
        'closeOnEscape',
        'cssClass',
        'cssClassName',
      ])
    }

    /**
     * Positions + stacks the panel. `getStyleScope` points at the host so the
     * portal mirrors its classes and the panel keeps this component's CSS vars
     * once it has been relocated out of the render root.
     */
    /**
     * Held by ref rather than queried. The portal MOVES the panel out of the
     * render root when it opens, so `renderRoot.querySelector` would find it
     * only while closed — a ref keeps working wherever the node ends up.
     */
    protected _panelEl: HTMLElement | null = null
    protected _triggerEl: HTMLElement | null = null

    protected _popup = new PopupPortalController(this, {
      getPanel: () => this._panelEl,
      getAnchor: () => this._triggerEl,
      /**
       * The INNER wrapper, not the host — it's what carries
       * `.mono-button-dropdown`, and therefore the `--_mono-button-dropdown-*`
       * variables every panel rule reads. The portal mirrors this element's class
       * onto itself, so the relocated panel keeps inheriting them; pointing at the
       * host (which has no class) left the panel transparent and border-less,
       * since each value resolved to an undefined var.
       */
      getStyleScope: () =>
        this.renderRoot?.querySelector?.('.mono-button-dropdown') as HTMLElement | null,
      isOpen: () => this.modelValue,
      side: () => this._side(),
      align: () => this._align(),
      offset: () => this.offset,
      styleVars: () => BUTTON_DROPDOWN_STYLE_VARS,
      flip: () => true,
      shift: () => true,
      onSideResolved: (side) => {
        // `mono-side` is what the static placement CSS keys on, so it has to
        // follow a flip — the panel that opened upwards must stop carrying the
        // downward offset.
        if (this._resolvedSide !== side) this._resolvedSide = side as DropdownSide
      },
    })

    private _buttons: ButtonDropdownItem[] = []

    /**
     * Entries for this dropdown.
     *
     * `noAccessor` because assignment does two things, only one of which is an
     * update. Building a fresh array on every render is the NORMAL shape whenever an
     * entry's `onClick` closes over the current row — and with one dropdown per table
     * row that means an unrelated re-render (a filter panel opening, say) hands N
     * dropdowns a brand-new array and re-renders all of them. Measured on a 2000-row
     * table: 737ms of blocked main thread per toggle, against 60ms when the array
     * identity happened to be stable. Nothing about the RENDER differed.
     *
     * So: compare by content and skip the update when it is equivalent. Handlers are
     * excluded from that comparison deliberately — they are rebuilt every render by
     * design and are resolved at CLICK time from `_itemParts`, never captured in the
     * listener closure (see `_itemElement`). That is also why `_retargetItemParts()`
     * has to run on EVERY assignment including a skipped one: `_itemParts` is
     * normally refreshed during render, so without it a suppressed update would
     * leave the cached entries pointing at the previous array's closures and a click
     * would fire the wrong row's handler.
     */
    @property({ attribute: false, noAccessor: true })
    get buttons(): ButtonDropdownItem[] {
      return this._buttons
    }

    set buttons(next: ButtonDropdownItem[]) {
      const previous = this._buttons
      this._buttons = next ?? []
      this._retargetItemParts()
      if (!sameButtonItems(previous, this._buttons)) {
        this.requestUpdate('buttons', previous)
      }
    }

    /**
     * Point the cached entry elements at the CURRENT array without rendering, so a
     * click resolves this render's `item`/`index` even when the update was skipped.
     */
    private _retargetItemParts(): void {
      // Optional-chained: the setter can fire before the class fields below are
      // initialised (a framework assigning the prop during upgrade).
      if (!this._itemParts?.size) return
      for (const [key, state] of this._itemParts) {
        const index = Number(key.slice(2))
        const item = this._buttons[index]
        if (item) this._itemParts.set(key, { ...state, item, index })
      }
    }

    @property({ converter: numberStringConverter })
    min = 1

    @property({ type: String })
    placement: DropdownPlacement = 'bottom-end'

    @property({ converter: numberStringConverter })
    offset = 4

    /**
     * Colors the `⋮` TRIGGER only. Entries never take a button color of their
     * own inside the menu — a row of differently-coloured, differently-variant
     * buttons reads as noise rather than a list — so an entry's `color` is used
     * to tint its ICON instead. Outside the menu (inline, when the list is short
     * enough) entries render with their real button styling.
     */
    @property({ type: String })
    color?: ButtonProps['color']

    /** Visual style of the `⋮` trigger — same values `<mono-button>` takes. */
    @property({ type: String })
    variant?: ButtonProps['variant']

    /** Size of the `⋮` trigger. */
    @property({ type: String })
    size?: ButtonProps['size']

    /**
     * Corner radius of the `⋮` trigger — the same scale `<mono-button>` takes.
     *
     * Entries carry their own `rounded` through `ButtonProps` like every other
     * button prop; this one is the shorthand for the trigger, alongside `color` /
     * `variant` / `size`.
     */
    @property({ type: String })
    rounded?: ButtonProps['rounded']

    /**
     * The remaining identity hole on this element. `buttons` above is guarded
     * because a consumer must rebuild it every render; `trigger` sits on the same
     * per-row element, so a `:trigger.prop` bound to anything non-literal would
     * re-render every row's dropdown for a config that did not move.
     *
     * `rateLimitHasChanged` is a fully generic shallow-object compare (null-safe,
     * unions both key sets) — the name is historical, it is not throttle-specific.
     * A shallow compare is right here: every key of `ButtonProps` is a primitive.
     */
    @property({ attribute: false, hasChanged: rateLimitHasChanged })
    trigger?: ButtonProps & { label?: string; icon?: string }

    @property({ attribute: 'model-value', reflect: true, converter: booleanStringConverter })
    modelValue = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ attribute: 'close-on-select', converter: booleanStringConverter })
    closeOnSelect = true

    @property({ attribute: 'close-on-outside-click', converter: booleanStringConverter })
    closeOnOutsideClick = true

    @property({ attribute: 'close-on-escape', converter: booleanStringConverter })
    closeOnEscape = true

    @property({ attribute: false })
    cssClass: ButtonDropdownCssClass = {}

    @state()
    protected _resolvedSide: DropdownSide = 'bottom'

    /* ------------------------------ lifecycle ------------------------------ */

    override connectedCallback(): void {
      super.connectedCallback()
      if (isServer) return
      document.addEventListener('click', this._onDocumentClick, true)
      document.addEventListener('keydown', this._onDocumentKeydown)
    }

    override disconnectedCallback(): void {
      if (!isServer) {
        document.removeEventListener('click', this._onDocumentClick, true)
        document.removeEventListener('keydown', this._onDocumentKeydown)
      }
      super.disconnectedCallback()
    }

    /* -------------------------------- state -------------------------------- */

    /** Entries are behind the trigger once there are more of them than `min`. */
    public get collapsed(): boolean {
      return (this.buttons?.length ?? 0) > Math.max(0, this.min ?? 1)
    }

    public show(source: DropdownSource = 'manual'): void {
      this._setOpen(true, source)
    }
    public hide(source: DropdownSource = 'manual'): void {
      this._setOpen(false, source)
    }
    public toggle(source: DropdownSource = 'manual'): void {
      this._setOpen(!this.modelValue, source)
    }

    protected _setOpen(next: boolean, source: DropdownSource, sourceEvent?: Event): void {
      if (this.disabled && next) return
      if (this.modelValue === next) return
      this.modelValue = next

      const detail: ButtonDropdownClickEventDetail = {
        modelValue: next,
        collapsed: this.collapsed,
        source,
        sourceEvent,
      }
      dispatchMonoEvent(this, next ? 'open' : 'close', detail)
    }

    private _onDocumentClick = (event: MouseEvent): void => {
      if (!this.modelValue || !this.closeOnOutsideClick) return
      const path = event.composedPath()
      // The panel is portaled to <body>, so a click inside it is NOT outside.
      if (path.includes(this) || this._popup.containsInPath(path)) return
      this._setOpen(false, 'outside', event)
    }

    private _onDocumentKeydown = (event: KeyboardEvent): void => {
      if (!this.modelValue) return
      if (event.key === 'Escape' && this.closeOnEscape) {
        this._setOpen(false, 'escape', event)
        this._focusTrigger()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const rows = this._menuButtons()
        if (!rows.length) return
        event.preventDefault()
        const active = rows.findIndex((b) => b === document.activeElement || b.contains(document.activeElement))
        const step = event.key === 'ArrowDown' ? 1 : -1
        const next = (active + step + rows.length) % rows.length
        rows[next]?.focus?.()
      }
    }

    /** The rendered entry buttons inside the open panel, in order. */
    private _menuButtons(): HTMLElement[] {
      return this._panelEl
        ? Array.from(this._panelEl.querySelectorAll<HTMLElement>('[data-mono-bd-item]'))
        : []
    }

    private _focusTrigger(): void {
      ;(this._triggerEl as (HTMLElement & { focus?: () => void }) | null)?.focus?.()
    }

    /* ------------------------------- geometry ------------------------------ */

    protected _side(): DropdownSide {
      return (this.placement?.split('-')[0] as DropdownSide) ?? 'bottom'
    }

    protected _align(): DropdownAlign {
      const part = this.placement?.split('-')[1]
      return part === 'start' || part === 'end' ? (part as DropdownAlign) : 'center'
    }

    /* ------------------------------ rendering ------------------------------ */

    /** Light renders `mono-button`; the shadow build overrides with its own tag. */
    protected _buttonTag(): string {
      return 'mono-button'
    }

    /**
     * Whether entry content can be written as a Lit template.
     *
     * **It can't for the light build.** A light `<mono-button>` CAPTURES its
     * children in `connectedCallback` and relocates them into its own
     * `[data-mono-slot]` targets — including nodes our template rendered into it.
     * That ejects this element's part markers, and the next render dies with
     * "this `ChildPart` has no `parentNode`". So the light build hands Lit a
     * fully-built element instead (see `_itemElement`), leaving Lit no parts
     * inside the button to lose.
     *
     * The shadow build has no such problem: it projects through a native
     * `<slot>`, moves nothing, and stays SSR-safe.
     */
    protected _declarativeItems(): boolean {
      return false
    }

    /**
     * Elements built once per entry and reused across renders.
     *
     * Reuse is keyed on CONTENT, never on the `buttons` array's identity. Handing
     * over a freshly-built array on every render is the normal shape whenever each
     * entry's `onClick` has to close over the current row, and this cache used to
     * be cleared wholesale on that — reconstructing one `<mono-button>` custom
     * element per entry, per render. With one dropdown per table row that is
     * O(rows) element constructions on every unrelated re-render: measured 70ms at
     * 300 rows (and growing linearly) versus 12ms when the identity happened to be
     * stable. Now an equivalent array costs nothing.
     */
    private _itemEls = new Map<string, HTMLElement>()

    /**
     * What each cached element was built from, plus the entry it currently stands
     * for.
     *
     * `item`/`index` are read at CLICK time rather than captured in the listener
     * closure, so re-assigning `buttons` retargets the existing element instead of
     * forcing a rebuild — the handler can never point at a stale row. `label` and
     * `icon` are the rebuild trigger: the light `mono-button` captures its slot
     * children on connect and moves them into its own render, so they cannot be
     * safely mutated afterwards.
     */
    private _itemParts = new Map<
      string,
      { label?: string; icon?: string; item: ButtonDropdownItem; index: number }
    >()

    override updated(changed: Map<string, unknown>): void {
      // @ts-ignore — super may not declare updated through the generic base.
      super.updated?.(changed)
      // `_resolvedSide` and `modelValue` both move after a render, and the root
      // is a static template node, so its attributes are written here rather
      // than bound one by one.
      this._applyRootAttrs(this._rootEl)
    }

    override willUpdate(changed: Map<string, unknown>): void {
      // Keys are index-based, so a SHORTER list is the only structural hazard —
      // drop the entries past the end rather than clearing everything.
      if (changed.has('buttons')) this._pruneItemCache()
      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    /** Forget cached entries whose index no longer exists in `buttons`. */
    private _pruneItemCache(): void {
      const len = this.buttons?.length ?? 0
      for (const key of [...this._itemEls.keys()]) {
        const index = Number(key.slice(2))
        if (!Number.isFinite(index) || index >= len) {
          this._itemEls.delete(key)
          this._itemParts.delete(key)
        }
      }
    }

    /** Build (or update) the real element for one entry. */
    protected _itemElement(
      item: ButtonDropdownItem,
      index: number,
      inMenu: boolean,
      opts: { cls: string; onClick: (e: MouseEvent) => void },
    ): HTMLElement {
      const key = `${inMenu ? 'm' : 'r'}:${index}`
      let el = this._itemEls.get(key)
      const prev = this._itemParts.get(key)

      // Label and icon live in children the button has already captured and moved
      // into its own render, so they can't be patched in place — a change to either
      // rebuilds just this one entry. Everything else, a brand-new `onClick`
      // closure included, is refreshed below without touching the DOM.
      if (el && prev && (prev.label !== item.label || prev.icon !== item.icon)) {
        this._itemEls.delete(key)
        el = undefined
      }

      if (!el) {
        el = document.createElement(this._buttonTag())
        el.setAttribute('data-mono-bd-item', '')
        // Children go on BEFORE the element is connected, so the button's own
        // capture sees them and routes them to the right slot.
        if (item.icon) {
          const icon = document.createElement('span')
          icon.setAttribute('slot', 'icon')
          icon.className = `mono-icon ${item.icon}`
          el.appendChild(icon)
        }
        if (item.label) el.appendChild(document.createTextNode(item.label))
        // Resolves the entry at CLICK time instead of closing over this render's
        // `item`/`index` — that is what lets the element outlive a re-assigned
        // `buttons` array without ever firing the wrong row's handler.
        el.addEventListener('click', ((event: MouseEvent) => {
          const state = this._itemParts.get(key)
          if (state) this._onItemClick(state.item, state.index, event)
        }) as EventListener)
        // The embedded button emits its OWN bubbling `mno-click`; stop it at the
        // boundary so it can't be mistaken for this element's.
        el.addEventListener('mno-click', (e) => e.stopPropagation())
        el.addEventListener('mnoClick', (e) => e.stopPropagation())
        this._itemEls.set(key, el)
      }

      this._itemParts.set(key, { label: item.label, icon: item.icon, item, index })
      el.className = opts.cls
      this._applyItem(el, item)
      return el
    }

    protected _cls(base: string, key: keyof ButtonDropdownCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    /**
     * Push an entry's props onto its rendered `<mono-button>`.
     *
     * Done imperatively via a Lit ref callback rather than as template
     * attributes: object/function props (`handler`, `cssClass`, `throttle`) can't
     * cross as attributes, and going through `applyProps` means any prop the
     * button gains later works here with no change.
     */
    protected _applyItem(el: Element | undefined, item: ButtonDropdownItem): void {
      if (!el) return
      const { label: _l, icon: _i, onClick: _c, className: _n, ...rest } = item
      applyProps(el, rest as Record<string, unknown>)
      if (this.disabled) (el as any).disabled = true
    }

    protected _onItemClick(item: ButtonDropdownItem, index: number, event: MouseEvent): void {
      if (item.disabled || this.disabled) return

      item.onClick?.(event)
      dispatchMonoEvent(this, 'click', {
        item,
        index,
        modelValue: this.modelValue,
        collapsed: this.collapsed,
        source: 'trigger',
        sourceEvent: event,
      } satisfies ButtonDropdownClickEventDetail)

      if (this.collapsed && this.closeOnSelect) this._setOpen(false, 'manual', event)
    }

    /** One entry, as a real button element carrying its own props. */
    protected renderItem(item: ButtonDropdownItem, index: number, inMenu: boolean): TemplateResult {
      const tag = this._buttonTag()
      const cls = [
        inMenu ? 'mono-button-dropdown-item-btn' : 'mono-button-dropdown-row-btn',
        // In the menu an entry's `color` tints its ICON, not the button. The
        // class carries it because the two builds can't share one CSS hook: in
        // light the icon ends up inside the button's `.mono-button.<color>`
        // wrapper, but in shadow it stays in THIS tree and never has that
        // ancestor. A class we own works in both.
        inMenu && item.color ? `mono-bd-c-${item.color}` : '',
        item.className ?? '',
      ]
        .filter(Boolean)
        .join(' ')

      // `unsafeStatic` is avoided on purpose — the tag is one of two known values,
      // so a plain branch keeps the templates static and cacheable.
      const content = html`
        ${item.icon ? html`<span slot="icon" class="mono-icon ${item.icon}"></span>` : nothing}
        ${item.label ?? nothing}
      `

      const onClick = (e: MouseEvent) => this._onItemClick(item, index, e)

      // Light build: hand Lit a finished element (see `_declarativeItems`).
      if (!this._declarativeItems()) {
        return this._itemElement(item, index, inMenu, { cls, onClick }) as unknown as TemplateResult
      }

      const bind = (el: Element | undefined) => this._applyItem(el, item)
      // An embedded `<mono-button>` dispatches its OWN bubbling+composed
      // `mno-click`. Left alone it escapes this host and reaches a consumer
      // listening for OUR `mno-click`, carrying the button's detail shape instead
      // of `{ item, index }` — indistinguishable noise. Stop it at the boundary;
      // this element re-emits its own.
      const stop = (e: Event) => e.stopPropagation()

      return tag === 'mono-button'
        ? html`<mono-button
            class=${cls}
            data-mono-bd-item
            ${ref(bind)}
            @click=${onClick}
            @mno-click=${stop}
            @mnoClick=${stop}
            >${content}</mono-button
          >`
        : html`<mono-shadow-button
            class=${cls}
            data-mono-bd-item
            ${ref(bind)}
            @click=${onClick}
            @mno-click=${stop}
            @mnoClick=${stop}
            >${content}</mono-shadow-button
          >`
    }

    /** The inline row — every entry as a plain button, no dropdown involved. */
    protected renderRow(): TemplateResult {
      return html`
        <div class=${this._cls('mono-button-dropdown-row', 'row')} mono-row ?hidden=${this.collapsed}>
          ${this.collapsed
            ? nothing
            : repeat(
                this.buttons ?? [],
                (_item, i) => i,
                (item, i) => this.renderItem(item, i, false),
              )}
        </div>
      `
    }

    /** Class + state for the panel, which each build writes into its own template. */
    protected get panelClass(): string {
      return this._cls('mono-button-dropdown-panel', 'panel')
    }
    protected get panelHidden(): boolean {
      return !this.collapsed || !this.modelValue
    }
    protected bindPanel = (el: Element | undefined): void => {
      this._panelEl = (el as HTMLElement) ?? null
    }

    /**
     * The inner root — `.mono-button-dropdown` in both builds. It carries the
     * styling ATTRIBUTES (the classes ride the template binding), and it is also
     * the element the portal mirrors onto itself, so everything written here
     * travels with a relocated panel.
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
      const align = this._align()
      // While OPEN the resolved side is the truth (flip may have moved it);
      // while closed it is stale, so the placement itself is.
      const side = this.modelValue ? this._resolvedSide : this._side()
      return {
        'mono-size': !this.size || this.size === 'md' ? null : this.size,
        'mono-color': !this.color || this.color === 'primary' ? null : this.color,
        'mono-variant': !this.variant || this.variant === 'solid' ? null : this.variant,
        'mono-rounded': this.rounded ?? null,
        'mono-placement': this.placement === 'bottom-end' ? null : this.placement,
        'mono-side': side === 'bottom' ? null : side,
        'mono-align': align === 'end' ? null : align,
        'mono-open': this.modelValue ? '' : null,
        'mono-collapsed': this.collapsed ? '' : null,
        'mono-disabled': this.disabled ? '' : null,
        // "I position the panel myself" — inline top/left after measuring, so the
        // static placement rules stand aside. Hand-written markup never sets it,
        // and NEITHER DOES THE SHADOW BUILD: `PopupPortalController.reposition()`
        // only runs where it can portal (renderRoot === host), so a shadow panel
        // gets no inline offsets and has to keep the CSS placement. Claiming
        // `mono-fixed` there left it `position: fixed` with no insets — laid out
        // at its static position, thousands of pixels down the page.
        'mono-fixed': this._positionsPanel() ? '' : null,
      }
    }

    /** Does this build measure and place the panel itself? (light only — see above.) */
    protected _positionsPanel(): boolean {
      return !isServer && (this.renderRoot as unknown) === this
    }

    protected _applyRootAttrs(root: HTMLElement | null | undefined): void {
      if (!root) return
      if (!root.hasAttribute('mono-button-dropdown')) root.setAttribute('mono-button-dropdown', '')
      for (const [name, value] of Object.entries(this._computeRootAttrs())) {
        if (value === null) root.removeAttribute(name)
        else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
      }
    }

    /**
     * An entry's `color` inside the menu.
     *
     * It is NOT a button colour in there (see button-dropdown.css): the row takes
     * the role as its INK and a 10%/20% wash of it on hover, the way Basecoat
     * treats `[data-variant='destructive']`. `primary` is written out rather
     * than dropped as a default, because the panel's own ink is the popover
     * foreground, not the primary role.
     */
    protected _itemColorAttr(item: ButtonDropdownItem): string | null {
      return item.color ?? null
    }

    /** The menu rows. Lives INSIDE the panel, so these parts travel with it. */
    protected renderMenuList(): TemplateResult {
      return html`
        <ul class=${this._cls('mono-button-dropdown-list', 'list')} mono-list>
          ${this.collapsed
            ? repeat(
                this.buttons ?? [],
                (_item, i) => i,
                (item, i) => html`
                  <li
                    class=${this._cls('mono-button-dropdown-item', 'item')}
                    mono-item
                    mono-item-color=${this._itemColorAttr(item) ?? nothing}
                    role="none"
                  >
                    ${this.renderItem(item, i, true)}
                  </li>
                `,
              )
            : nothing}
        </ul>
      `
    }

    /** The `⋮` trigger. `nothing` while the entries are inline. */
    protected renderTrigger(): TemplateResult | typeof nothing {
      if (!this.collapsed) return nothing
      return this._renderTriggerButton()
    }

    private _renderTriggerButton(): TemplateResult {
      // `color` is the component-level knob for the trigger; an explicit
      // `trigger.color` still wins, so the shorthand never blocks the long form.
      const t: ButtonProps & { label?: string; icon?: string } = {
        ...(this.color ? { color: this.color } : {}),
        ...(this.variant ? { variant: this.variant } : {}),
        ...(this.size ? { size: this.size } : {}),
        ...(this.rounded ? { rounded: this.rounded } : {}),
        ...(this.trigger ?? {}),
      }
      const tag = this._buttonTag()
      const triggerCls = this._cls('mono-button-dropdown-trigger', 'trigger')
      const bindTrigger = (el: Element | undefined) => {
        this._triggerEl = (el as HTMLElement) ?? null
        if (!el) return
        const { label: _l, icon: _i, ...rest } = t
        applyProps(el, rest as Record<string, unknown>)
        if (this.disabled) (el as any).disabled = true
      }
      const stop = (e: Event) => e.stopPropagation()
      const onTrigger = (e: MouseEvent) => {
        e.stopPropagation()
        this.toggle('trigger')
      }
      // Same capture hazard as the entries — build it as a real element.
      if (!this._declarativeItems()) {
        let el = this._itemEls.get('trigger')
        if (!el) {
          el = document.createElement(tag)
          el.setAttribute('mono-trigger', '')
          const icon = document.createElement('span')
          icon.setAttribute('slot', 'icon')
          icon.className = `mono-icon ${t.icon ?? 'i-mdi-dots-vertical'}`
          el.appendChild(icon)
          if (t.label) el.appendChild(document.createTextNode(t.label))
          if (!t.label) el.setAttribute('icon-only', 'true')
          el.addEventListener('click', onTrigger as EventListener)
          el.addEventListener('mno-click', stop)
          el.addEventListener('mnoClick', stop)
          this._itemEls.set('trigger', el)
        }
        el.className = triggerCls
        bindTrigger(el)
        return el as unknown as TemplateResult
      }

      const triggerContent = html`
        <span slot="icon" class="mono-icon ${t.icon ?? 'i-mdi-dots-vertical'}"></span>
        ${t.label ?? nothing}
      `

      const triggerEl =
        tag === 'mono-button'
          ? html`<mono-button
              class=${triggerCls}
              mono-trigger
              icon-only=${t.label ? nothing : 'true'}
              ${ref(bindTrigger)}
              @click=${onTrigger}
              @mno-click=${stop}
              @mnoClick=${stop}
              >${triggerContent}</mono-button
            >`
          : html`<mono-shadow-button
              class=${triggerCls}
              mono-trigger
              icon-only=${t.label ? nothing : 'true'}
              ${ref(bindTrigger)}
              @click=${onTrigger}
              @mno-click=${stop}
              @mnoClick=${stop}
              >${triggerContent}</mono-shadow-button
            >`

      return triggerEl
    }
  }

  return MonoButtonDropdownCoreClass as unknown as Constructor<MonoButtonDropdownCoreInterface> &
    T
}
