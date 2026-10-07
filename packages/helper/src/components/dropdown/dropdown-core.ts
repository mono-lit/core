// @unocss-include

import { LitElement, isServer } from 'lit'
import { property, state } from 'lit/decorators.js'

import type {
  DropdownPlacement,
  DropdownTrigger,
  DropdownSize,
  DropdownColor,
  DropdownSource,
  DropdownSide,
  DropdownAlign,
  DropdownCssClass,
  DropdownClickEventDetail,
} from './dropdown-types.js'

import {
  booleanStringConverter,
  numberStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import {
  cssPart,
  applyCssClass,
  defineCssClassAliases,
} from '../../composables/css-class'
import { dispatchMonoEvent } from '../../composables/mono-event'
import {
  PopupPortalController,
  computePopupPlacement,
  applyPopupPlacement,
} from '../../composables/popup-portal'

// `isServer` from lit is TRUE in lit's node build (used on the server via the
// externalized lit) and FALSE in the browser build. It is reliable even though
// @lit-labs/ssr's DOM shim defines global `window`/`document` during SSR (which
// makes a `typeof document/window` check wrongly report "browser" on the server).

/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoDropdownCoreInterface {
  placement: DropdownPlacement
  trigger: DropdownTrigger
  size: DropdownSize
  color: DropdownColor
  modelValue: boolean
  disabled: boolean
  flip: boolean
  shift: boolean
  offset: number
  closeOnOutsideClick: boolean
  closeOnEscape: boolean
  cssClass: DropdownCssClass
  cssClassName: string
  show(source?: DropdownSource): void
  hide(source?: DropdownSource): void
  toggle(source?: DropdownSource): void

  // Protected surface used / overridden by the light/shadow render() wrappers.
  protected _cls(base: string, key: keyof DropdownCssClass): string
  protected _computeHostClasses(): string[]
  protected _computeRootAttrs(): Record<string, string | null>
  protected _applyRootAttrs(root: HTMLElement | null | undefined): void
  protected _updateHostClasses(): void
  protected _activeMainNodes(): HTMLElement[]
  protected _syncTriggerListeners(): void
  protected _positionPanel(): void
  protected _popup: PopupPortalController
}

/**
 * `MonoDropdownCore` — all render-mode-agnostic logic for `mono-dropdown`:
 * reactive props, hybrid aliases, host-class management, open/close state +
 * events, trigger listeners, outside-click/escape, and `position: fixed` panel
 * positioning (with containing-block compensation).
 *
 * SSR-safe: every `document`/`window`/layout-measuring path is guarded by
 * `isServer` (lit) so `@lit-labs/ssr` can render it on the server.
 *
 * Leaves to each build: `createRenderRoot()`, the slot strategy + `render()`,
 * and `_activeMainNodes()` (light: captured nodes; shadow: main slot's
 * assigned elements). Panel/queries use `this.renderRoot`, which is `this` for
 * the light build and the shadow root for the shadow build.
 */
/**
 * The dropdown's PUBLIC custom properties, handed to the popup portal so a
 * relocated panel keeps overrides an ancestor of the host set — a portaled panel
 * is a child of `<body>`, so it inherits none of them, and `getComputedStyle`
 * cannot enumerate custom properties for the portal to copy them blindly.
 *
 * Kept in step with dropdown.css by tests/dropdown-attributes.test.ts.
 */
const DROPDOWN_STYLE_VARS: readonly string[] = [
  '--mono-dropdown-accent', '--mono-dropdown-bg', '--mono-dropdown-border',
  '--mono-dropdown-danger', '--mono-dropdown-font', '--mono-dropdown-font-lg',
  '--mono-dropdown-font-md', '--mono-dropdown-font-sm', '--mono-dropdown-font-xl',
  '--mono-dropdown-font-xs', '--mono-dropdown-font-xxl', '--mono-dropdown-gap',
  '--mono-dropdown-gap-lg', '--mono-dropdown-gap-md', '--mono-dropdown-gap-sm',
  '--mono-dropdown-gap-xl', '--mono-dropdown-gap-xs', '--mono-dropdown-gap-xxl',
  '--mono-dropdown-info', '--mono-dropdown-line-height', '--mono-dropdown-max-width',
  '--mono-dropdown-max-width-lg', '--mono-dropdown-max-width-md',
  '--mono-dropdown-max-width-sm', '--mono-dropdown-max-width-xl',
  '--mono-dropdown-max-width-xs', '--mono-dropdown-max-width-xxl', '--mono-dropdown-min-width',
  '--mono-dropdown-min-width-lg', '--mono-dropdown-min-width-md',
  '--mono-dropdown-min-width-sm', '--mono-dropdown-min-width-xl',
  '--mono-dropdown-min-width-xs', '--mono-dropdown-min-width-xxl', '--mono-dropdown-offset',
  '--mono-dropdown-offset-lg', '--mono-dropdown-offset-md', '--mono-dropdown-offset-sm',
  '--mono-dropdown-offset-xl', '--mono-dropdown-offset-xs', '--mono-dropdown-offset-xxl',
  '--mono-dropdown-pad-x', '--mono-dropdown-pad-x-lg', '--mono-dropdown-pad-x-md',
  '--mono-dropdown-pad-x-sm', '--mono-dropdown-pad-x-xl', '--mono-dropdown-pad-x-xs',
  '--mono-dropdown-pad-x-xxl', '--mono-dropdown-pad-y', '--mono-dropdown-pad-y-lg',
  '--mono-dropdown-pad-y-md', '--mono-dropdown-pad-y-sm', '--mono-dropdown-pad-y-xl',
  '--mono-dropdown-pad-y-xs', '--mono-dropdown-pad-y-xxl', '--mono-dropdown-primary',
  '--mono-dropdown-radius', '--mono-dropdown-radius-lg', '--mono-dropdown-radius-md',
  '--mono-dropdown-radius-sm', '--mono-dropdown-radius-xl', '--mono-dropdown-radius-xs',
  '--mono-dropdown-radius-xxl', '--mono-dropdown-ring-base', '--mono-dropdown-ring-color',
  '--mono-dropdown-ring-width', '--mono-dropdown-secondary', '--mono-dropdown-shadow',
  '--mono-dropdown-success', '--mono-dropdown-surface', '--mono-dropdown-text',
  '--mono-dropdown-warning', '--mono-dropdown-teal', '--mono-dropdown-purple', '--mono-dropdown-neutral',
  '--mono-dropdown-dark',
] as const

export const MonoDropdownCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoDropdownCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'modelValue',
        'closeOnOutsideClick',
        'closeOnEscape',
      ])
      // Vue interop: <mono-dropdown :cssClass / :css-class / :cssclass="{}" />
      defineCssClassAliases(this, (value) => this._setCssClass(value))
    }

    /**
     * Relocates the panel into a body portal while open (light DOM only) so the
     * shared popup-stack z-index ranks it against every other popup, and owns
     * this dropdown's popup-stack membership. The shadow build keeps its panel in
     * the shadow root and positions it through `_positionPanel`.
     */
    protected _popup = new PopupPortalController(this, {
      getPanel: () =>
        this.renderRoot.querySelector('.mono-dropdown-panel') as HTMLElement | null,
      getAnchor: () => this._firstMainElement(),
      getStyleScope: () => this,
      isOpen: () => this.modelValue,
      side: () => this._sideFromPlacement(this.placement),
      align: () => this._alignFromPlacement(this.placement),
      offset: () => this.offset,
      styleVars: () => DROPDOWN_STYLE_VARS,
      flip: () => this.flip,
      shift: () => this.shift,
      onSideResolved: (side) => {
        if (this._resolvedSide !== side) {
          this._resolvedSide = side
          this._updateHostClasses()
        }
      },
    })

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'modelvalue',
        'closeonoutsideclick',
        'closeonescape',
        'css-class',
        'cssclass',
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
      } else if (name === 'closeonoutsideclick') {
        this.closeOnOutsideClick = this._toBoolean(newValue)
      } else if (name === 'closeonescape') {
        this.closeOnEscape = this._toBoolean(newValue)
      } else if (name === 'css-class' || name === 'cssclass') {
        this._setCssClass(newValue)
      }
    }

    @property({ type: String })
    placement: DropdownPlacement = 'bottom-start'

    @property({ type: String })
    trigger: DropdownTrigger = 'click'

    @property({ type: String })
    size: DropdownSize = 'md'

    @property({ type: String })
    color: DropdownColor = 'primary'

    @property({ attribute: 'model-value', reflect: true, converter: booleanStringConverter })
    modelValue = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ converter: booleanStringConverter })
    flip = true

    @property({ converter: booleanStringConverter })
    shift = true

    @property({ converter: numberStringConverter })
    /**
     * Basecoat's `mt-1` — 4px, the same value dropdown.css uses for
     * `--mono-dropdown-offset` at md. The two MUST agree: the element positions
     * the panel from here, hand-written markup from the custom property, and a
     * mismatch shows up as the panel sitting at a different distance in the two
     * (measured: 8px vs 4px before this).
     */
    offset = 4

    @property({ attribute: 'close-on-outside-click', converter: booleanStringConverter })
    closeOnOutsideClick = true

    @property({ attribute: 'close-on-escape', converter: booleanStringConverter })
    closeOnEscape = true

    @property({ attribute: false })
    cssClass: DropdownCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    @state()
    protected _resolvedSide: DropdownSide = 'bottom'

    private _triggerListenersAttached = false
    private _attachedTriggerNodes: HTMLElement[] = []
    private _appliedHostClasses = new Set<string>()
    /** Whether the viewport listeners are attached — see `_bindViewport`. */
    private _viewportBound = false
    /** Pending reposition frame, so a scroll burst costs one layout, not one per event. */
    private _viewportFrame = 0

    override connectedCallback(): void {
      super.connectedCallback()
      this._resolvedSide = this._sideFromPlacement(this.placement)
      this._updateHostClasses()
      if (isServer) return
      document.addEventListener('click', this._handleDocumentClick, true)
      document.addEventListener('keydown', this._handleDocumentKeydown)
      // The viewport listeners are NOT bound here for a CLOSED dropdown — see
      // `_bindViewport`; `updated()` owns them from open to close. This line covers
      // the one case `updated()` cannot: reattaching an already-open dropdown
      // schedules no Lit update, so nothing else would rebind it.
      if (this.modelValue) this._bindViewport()
    }

    override disconnectedCallback(): void {
      if (!isServer) {
        document.removeEventListener('click', this._handleDocumentClick, true)
        document.removeEventListener('keydown', this._handleDocumentKeydown)
      }
      this._unbindViewport()
      this._detachTriggerListeners()
      super.disconnectedCallback()
    }

    protected override updated(changed: Map<string, unknown>): void {
      super.updated(changed)
      this._updateHostClasses()
      this._syncTriggerListeners()

      // Open-gated on both counts. A closed panel has nothing to position — and
      // `_positionPanel` is a read-after-write forced layout, so running it on every
      // update of every dropdown on the page was pure cost. Same reasoning binds the
      // viewport listeners here rather than at connect (see `_bindViewport`); reading
      // `modelValue` rather than `changed.has(...)` also covers the prop-driven path,
      // where `_setOpen` never runs.
      if (this.modelValue) {
        this._bindViewport()
        // Light DOM: the portal controller positions the relocated panel — but its
        // `hostUpdated` runs BEFORE `updated()` (Lit calls controllers first). On
        // the first render of an initially-open dropdown the light build has not
        // re-placed the captured activator yet (the subclass does that in its
        // `updated()`, before calling `super`), so the controller saw a DETACHED
        // anchor. Reposition now that the activator is in place; a no-op for the
        // shadow build, which never portals. Shadow DOM: position in place.
        this._popup.reposition()
        this._positionPanel()
      } else {
        this._unbindViewport()
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

    protected _setCssClass(value: unknown): void {
      applyCssClass(this, value)
    }

    protected _cls(base: string, key: keyof DropdownCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    protected _sideFromPlacement(p: DropdownPlacement): DropdownSide {
      if (p.startsWith('top')) return 'top'
      if (p.startsWith('left')) return 'left'
      if (p.startsWith('right')) return 'right'
      return 'bottom'
    }

    private _alignFromPlacement(p: DropdownPlacement): DropdownAlign {
      if (p.endsWith('-start')) return 'start'
      if (p.endsWith('-end')) return 'end'
      return 'center'
    }

    /**
     * The Basecoat styling attributes for the ROOT, mirroring the props one for
     * one. `side` and `align` are the RESOLVED pair (upstream splits placement
     * that way, and flip/shift can move the side at runtime) while
     * `mono-placement` keeps the prop itself visible for a consumer's own CSS.
     * A value at its default emits nothing, so `:not([mono-size])` is md.
     */
    protected _computeRootAttrs(): Record<string, string | null> {
      const align = this._alignFromPlacement(this.placement)
      // While OPEN the resolved side is the truth (flip may have moved it);
      // while closed it is stale, so the placement itself is.
      const side = this.modelValue ? this._resolvedSide : this._sideFromPlacement(this.placement)
      return {
        'mono-size': this.size === 'md' ? null : this.size,
        'mono-color': this.color === 'primary' ? null : this.color,
        'mono-placement': this.placement === 'bottom-start' ? null : this.placement,
        'mono-side': side === 'bottom' ? null : side,
        'mono-align': align === 'start' ? null : align,
        'mono-trigger': this.trigger === 'click' ? null : this.trigger,
        'mono-open': this.modelValue ? '' : null,
        'mono-disabled': this.disabled ? '' : null,
        // Once mounted, the element measures and writes inline top/left, so the
        // static placement rules stand aside. Hand-written markup never carries
        // this attribute and keeps them.
        'mono-fixed': '',
      }
    }

    /** Write {@link _computeRootAttrs} onto whichever element carries the root. */
    protected _applyRootAttrs(root: HTMLElement | null | undefined): void {
      if (!root) return
      if (!root.hasAttribute('mono-dropdown')) root.setAttribute('mono-dropdown', '')
      for (const [name, value] of Object.entries(this._computeRootAttrs())) {
        if (value === null) root.removeAttribute(name)
        else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
      }
    }

    protected _computeHostClasses(): string[] {
      return [
        'mono-dropdown',
        this.size,
        this.color,
        this.placement,
        `is-${this._resolvedSide}`,
        'is-fixed',
        this.modelValue ? 'open' : null,
        this.disabled ? 'disabled' : null,
        this.cssClassName || null,
        this.cssClass?.root || null,
      ].filter((c): c is string => Boolean(c))
    }

    /**
     * Apply the computed state classes. The LIGHT build renders into `this`, so
     * the classes go on the host element (imperatively). The SHADOW build
     * overrides this to a no-op and instead renders the classes onto an inner
     * `.mono-dropdown` root in `render()` — the host's `class` is controlled by
     * the framework (Vue) and would otherwise wipe imperatively-added classes
     * (e.g. `open`) on every re-render.
     */
    protected _updateHostClasses(): void {
      // Browser-only: these classes are applied imperatively to the HOST element.
      // Doing it during SSR serializes them into the host's class attribute, but
      // the framework's client vnode only knows the author-written class →
      // hydration class mismatch. The dynamic classes only affect the panel when
      // open (the server renders it closed), so apply them after hydration.
      if (isServer) return
      this._applyRootAttrs(this)
      const next = new Set(this._computeHostClasses())
      for (const cls of this._appliedHostClasses) {
        if (!next.has(cls)) this.classList.remove(cls)
      }
      for (const cls of next) {
        if (!this._appliedHostClasses.has(cls)) this.classList.add(cls)
      }
      this._appliedHostClasses = next
    }

    protected _setOpen(next: boolean, source: DropdownSource, sourceEvent?: Event): void {
      if (this.disabled && next) return
      if (this.modelValue === next) return

      const oldValue = this.modelValue
      this.modelValue = next

      const detail: DropdownClickEventDetail = {
        modelValue: next,
        currentValue: next,
        oldValue,
        value: next,
        source,
        sourceEvent,
        resolvedSide: this._resolvedSide,
      }

      // An open-state change, not a click: its plain name is `toggle` (the
      // trigger's real click bubbles to the host on its own, undecorated).
      dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })
      dispatchMonoEvent(this, next ? 'open' : 'close', detail)
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

    public override focus(): void {
      this._firstMainElement()?.focus()
    }
    public override blur(): void {
      this._firstMainElement()?.blur()
    }

    protected _firstMainElement(): HTMLElement | null {
      for (const node of this._activeMainNodes()) return node
      return null
    }

    /**
     * The activator element(s) projected into the `main` slot. Overridden per
     * build (light: captured nodes; shadow: main slot's assignedElements).
     */
    protected _activeMainNodes(): HTMLElement[] {
      return []
    }

    private _handleTriggerClick = (event: Event): void => {
      if (this.disabled || this.trigger !== 'click') return
      event.stopPropagation()
      this._setOpen(!this.modelValue, 'trigger', event)
    }
    private _handleTriggerHoverIn = (event: Event): void => {
      if (this.disabled || this.trigger !== 'hover' || this.modelValue) return
      this._setOpen(true, 'hover', event)
    }
    private _handleTriggerHoverOut = (event: Event): void => {
      if (this.disabled || this.trigger !== 'hover' || !this.modelValue) return
      this._setOpen(false, 'hover', event)
    }
    private _handleTriggerKeydown = (event: KeyboardEvent): void => {
      if (this.disabled || this.trigger !== 'click') return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this._setOpen(!this.modelValue, 'trigger', event)
      }
    }

    protected _syncTriggerListeners(): void {
      if (isServer) return
      const next = this._activeMainNodes()
      const same =
        next.length === this._attachedTriggerNodes.length &&
        next.every((n, i) => n === this._attachedTriggerNodes[i])
      if (same && this._triggerListenersAttached) return

      this._detachTriggerListeners()
      for (const node of next) {
        node.addEventListener('click', this._handleTriggerClick)
        node.addEventListener('keydown', this._handleTriggerKeydown)
        node.addEventListener('mouseenter', this._handleTriggerHoverIn)
        node.addEventListener('mouseleave', this._handleTriggerHoverOut)
      }
      this._attachedTriggerNodes = next
      this._triggerListenersAttached = next.length > 0
    }

    private _detachTriggerListeners(): void {
      for (const node of this._attachedTriggerNodes) {
        node.removeEventListener('click', this._handleTriggerClick)
        node.removeEventListener('keydown', this._handleTriggerKeydown)
        node.removeEventListener('mouseenter', this._handleTriggerHoverIn)
        node.removeEventListener('mouseleave', this._handleTriggerHoverOut)
      }
      this._attachedTriggerNodes = []
      this._triggerListenersAttached = false
    }

    private _handleDocumentClick = (event: MouseEvent): void => {
      if (!this.modelValue || !this.closeOnOutsideClick) return
      const path = event.composedPath()
      // The panel may be relocated into a body portal — clicks inside it must
      // not count as "outside".
      if (path.includes(this) || this._popup.containsInPath(path)) return
      this._setOpen(false, 'outside', event)
    }
    private _handleDocumentKeydown = (event: KeyboardEvent): void => {
      if (!this.modelValue || !this.closeOnEscape || event.key !== 'Escape') return
      // An Escape inside a popup opened from THIS panel (a select's list, a
      // header filter) is that popup's to handle; the panel it came from stays.
      if (this._popup.ownsNestedInPath(event.composedPath())) return
      event.preventDefault()
      this._setOpen(false, 'escape', event)
    }
    /**
     * Listen for viewport movement — but ONLY while this dropdown is open.
     *
     * These used to be bound in `connectedCallback`, so every dropdown on the page
     * held a capture-phase `scroll` listener on `window` whether or not it was open,
     * and each one ran a forced layout per scroll event. A non-passive capture
     * listener on `window` also disqualifies the whole page's scrolling from running
     * off the compositor thread; nothing here calls `preventDefault`, so `passive`.
     */
    private _bindViewport(): void {
      if (isServer || this._viewportBound) return
      window.addEventListener('scroll', this._handleViewportChange, { capture: true, passive: true })
      window.addEventListener('resize', this._handleViewportChange, { passive: true })
      this._viewportBound = true
    }

    private _unbindViewport(): void {
      if (isServer) return
      if (this._viewportFrame) {
        cancelAnimationFrame(this._viewportFrame)
        this._viewportFrame = 0
      }
      if (!this._viewportBound) return
      window.removeEventListener('scroll', this._handleViewportChange, true)
      window.removeEventListener('resize', this._handleViewportChange)
      this._viewportBound = false
    }

    /** Coalesced to one frame — `_positionPanel` forces a synchronous layout. */
    private _handleViewportChange = (): void => {
      if (!this.modelValue || this._viewportFrame) return
      this._viewportFrame = requestAnimationFrame(() => {
        this._viewportFrame = 0
        if (this.modelValue) this._positionPanel()
      })
    }

    /**
     * Place the panel against its trigger.
     *
     * SHADOW build in practice: the light build's panel is relocated into a body
     * portal and `PopupPortalController` positions it there (from its
     * `hostUpdated`, and again from `updated()` once the activator is placed). Both
     * paths therefore run the SAME shared math — main-axis flip, cross-axis align
     * flip, shift, and painted-extent measurement. This method used to carry its
     * own copy of that algorithm, which is precisely how it came to be missing
     * all of the above; `dropdown-table-core` already delegates the same way.
     */
    protected _positionPanel(): void {
      if (isServer) return

      const panel = this.renderRoot.querySelector(
        '.mono-dropdown-panel',
      ) as HTMLElement | null
      if (!panel) return

      const main = this._firstMainElement()
      if (!main) {
        panel.style.top = ''
        panel.style.left = ''
        panel.style.right = ''
        panel.style.bottom = ''
        return
      }

      const placement = computePopupPlacement(main, panel, {
        side: this._sideFromPlacement(this.placement),
        align: this._alignFromPlacement(this.placement),
        offset: this.offset,
        flip: this.flip,
        shift: this.shift,
      })
      applyPopupPlacement(panel, placement)

      if (this._resolvedSide !== placement.side) {
        this._resolvedSide = placement.side
        this._updateHostClasses()
      }
    }
  }

  return MonoDropdownCoreClass as unknown as Constructor<MonoDropdownCoreInterface> & T
}
