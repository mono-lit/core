// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'

import type {
  SidebarMode,
  SidebarLocation,
  SidebarDensity,
  SidebarColor,
  SidebarVariant,
  SidebarSource,
  SidebarCssClass,
  SidebarClickEventDetail,
} from './sidebar-types.js'

import {
  booleanStringConverter,
  numberStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { cssPart, applyCssClass, defineCssClassAliases } from '../../composables/css-class'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { claimLayoutVar, releaseLayoutVar } from '../../composables/layout-var'
import { setExternalScrollLock } from '../../composables/popup-stack'
import { customColorStyle, isThemeColorToken } from '../../composables/color.js'

import {
  sidebarRootAttrs,
  SIDEBAR_AUTO_BREAKPOINT,
  resolveMode,
  generateSidebarRootClasses,
} from './sidebar-utils.js'

// The `--mono-sidebar-<side>-width` document vars are refcounted in
// `composables/layout-var.ts` — `mono-nav` hit the identical bug with
// `--mono-nav-height`, so the ownership logic lives in one place.

/** Slot regions the sidebar lays out. `body` is the default (unnamed) region. */
export type SidebarSlotName = 'header' | 'body' | 'footer'

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoSidebarCoreInterface {
  modelValue: boolean
  mode: SidebarMode
  location: SidebarLocation
  density: SidebarDensity
  color: SidebarColor
  variant: SidebarVariant
  width: number
  railWidth: number
  expandOnHover: boolean
  rail: boolean | null
  contained: boolean
  persistent: boolean
  closeOnEscape: boolean
  closeOnScrim: boolean
  lockScroll: boolean
  showScrim: boolean
  cssClass: SidebarCssClass
  cssClassName: string
  open(source?: SidebarSource, sourceEvent?: Event): void
  hide(source?: SidebarSource, sourceEvent?: Event): void
  close(source?: SidebarSource, sourceEvent?: Event): void
  toggle(source?: SidebarSource, sourceEvent?: Event): void
  expandRail(): void
  collapseRail(): void

  // Protected surface used by the light/shadow render() wrappers.
  protected _setCssClass(value: unknown): void
  protected _cls(base: string, key: keyof SidebarCssClass): string
  protected renderSlot(name: SidebarSlotName): TemplateResult
  protected renderIcon(name: 'chevron'): TemplateResult
}

/**
 * `MonoSidebarCore` — all render-mode-agnostic logic for `mono-sidebar`:
 * reactive props, hybrid aliases, mode resolution (auto→permanent/temporary via
 * the breakpoint), layout-var side effects, scroll-lock/escape side effects,
 * open/close state + events, and the chrome `render()`.
 *
 * SSR-safe: every `document`/`window` path is guarded by `isServer` (lit) — NOT
 * `typeof document/window`, which is unreliable under @lit-labs/ssr (it defines
 * both on the server).
 *
 * Leaves to each build: `createRenderRoot()`, the slot strategy, `renderSlot()`
 * (light: empty + capture into `[data-mono-slot]`; shadow: native `<slot>`), and
 * `renderIcon()` (light: `.mono-icon` UnoCSS icon; shadow: inline SVG).
 */
export const MonoSidebarCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoSidebarCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'modelValue',
        'railWidth',
        'expandOnHover',
        'closeOnEscape',
        'closeOnScrim',
        'lockScroll',
        'showScrim',
      ])
      // Vue interop: <mono-sidebar :cssClass / :css-class / :cssclass="{}" />
      defineCssClassAliases(this, (value) => this._setCssClass(value))
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
        this.modelValue = booleanStringConverter.fromAttribute(newValue)
      } else if (name === 'css-class' || name === 'cssclass') {
        this._setCssClass(newValue)
      }
    }

    @property({ attribute: 'model-value', reflect: true, converter: booleanStringConverter })
    modelValue = false

    @property({ type: String })
    mode: SidebarMode = 'auto'

    @property({ type: String })
    location: SidebarLocation = 'left'

    @property({ type: String })
    density: SidebarDensity = 'comfortable'

    @property({ type: String })
    color: SidebarColor = 'surface'

    @property({ type: String })
    variant: SidebarVariant = 'elevated'

    @property({ converter: numberStringConverter })
    width = 264

    @property({ attribute: 'rail-width', converter: numberStringConverter })
    railWidth = 64

    @property({ attribute: 'expand-on-hover', converter: booleanStringConverter })
    expandOnHover = false

    @property({
      attribute: 'rail',
      converter: {
        fromAttribute(value: string | null): boolean | null {
          if (value === null) return null
          const normalized = value.toLowerCase().trim()
          return normalized === '' || normalized === 'true'
        },
        toAttribute(): string | null {
          return null
        },
      },
    })
    rail: boolean | null = null

    @property({ reflect: true, converter: booleanStringConverter })
    contained = false

    @property({ reflect: true, converter: booleanStringConverter })
    persistent = false

    @property({ attribute: 'close-on-escape', converter: booleanStringConverter })
    closeOnEscape = true

    @property({ attribute: 'close-on-scrim', converter: booleanStringConverter })
    closeOnScrim = true

    @property({ attribute: 'lock-scroll', converter: booleanStringConverter })
    lockScroll = true

    @property({ attribute: 'show-scrim', converter: booleanStringConverter })
    showScrim = true

    @property({ attribute: false })
    cssClass: SidebarCssClass = {}

    @property({ attribute: false })
    cssClassName = ''

    @state()
    protected _resolvedMode: Exclude<SidebarMode, 'auto'> = 'permanent'

    private _escapeListener: ((event: KeyboardEvent) => void) | null = null
    private _autoMql: MediaQueryList | null = null
    private _autoMqlListener: ((event: MediaQueryListEvent) => void) | null = null
    private _railHovered = false
    private _railPointerEnter: (() => void) | null = null
    private _railPointerLeave: (() => void) | null = null

    override connectedCallback(): void {
      super.connectedCallback()
      this._recomputeResolvedMode()
      this._recomputeRailCollapsedAttr()
      if (isServer) return
      this._setupAutoModeListener()
      this._setupRailHoverListeners()
      this._writeLayoutVar()
      if (this._resolvedMode === 'temporary' && this.modelValue) {
        this._applyOpenSideEffects()
      }
    }

    override disconnectedCallback(): void {
      if (!isServer) {
        this._releaseSideEffects()
        this._teardownAutoModeListener()
        this._teardownRailHoverListeners()
        this._clearLayoutVar()
      }
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      if (changed.has('rail') && this.rail !== null && this.modelValue !== this.rail) {
        this.modelValue = this.rail
      }

      if (changed.has('mode')) {
        this._recomputeResolvedMode()
      }

      if (
        changed.has('mode') ||
        // `mode="auto"` flips `_resolvedMode` from the MQL listener without
        // `mode` itself ever changing — watch the resolved value too.
        changed.has('_resolvedMode') ||
        changed.has('modelValue') ||
        changed.has('rail') ||
        changed.has('expandOnHover')
      ) {
        this._recomputeRailCollapsedAttr()
      }

      if (isServer) return

      if (changed.has('modelValue') || changed.has('mode')) {
        if (this._resolvedMode === 'temporary' && this.modelValue) {
          this._applyOpenSideEffects()
        } else {
          this._releaseSideEffects()
        }
      }

      if (
        changed.has('mode') ||
        changed.has('width') ||
        changed.has('railWidth') ||
        changed.has('location') ||
        changed.has('modelValue') ||
        changed.has('contained')
      ) {
        this._writeLayoutVar()
      }
    }

    /**
     * `connectedCallback` computes `_resolvedMode` / `data-rail-collapsed` /
     * the layout var against SERVER assumptions (no `matchMedia`, no
     * `localStorage` → always "desktop, rail, collapsed"). Under SSR the host's
     * viewport-derived props only settle after Vue mounts, and nothing else
     * re-runs these if no prop happens to change afterwards. Re-run them once
     * after the first real client render so the viewport wins.
     */
    protected firstUpdated(changed: Map<string, unknown>): void {
      // @ts-ignore — the base mixin may not declare firstUpdated; LitElement does.
      super.firstUpdated?.(changed)
      if (isServer) return
      this._recomputeResolvedMode()
      this._recomputeRailCollapsedAttr()
      this._writeLayoutVar()
      this._syncRootFromState()
    }

    protected updated(changed: Map<string, unknown>): void {
      // @ts-ignore — the base mixin may not declare updated; LitElement does.
      super.updated?.(changed)
      if (isServer) return
      this._syncRootFromState()
    }

    /**
     * Re-assert the root element's class / style / aria-hidden from live state.
     *
     * `@lit-labs/ssr-client`'s hydration records the values it is handed as
     * ALREADY COMMITTED without writing them to the DOM — it assumes the server
     * markup already matches. Under nuxt-ssr-lit that assumption is routinely
     * false: the server has no viewport (no `matchMedia`, no `localStorage`) so
     * it always emits desktop assumptions, and Vue has since set the real
     * mobile props. Lit then sees "no change" and never commits, freezing the
     * rail visible on a phone while `mode` already reads `temporary`.
     *
     * These three attributes carry every viewport-derived decision, so writing
     * them imperatively after each update keeps the DOM honest. Idempotent —
     * a no-op whenever lit's own bindings are working.
     */
    private _syncRootFromState(): void {
      const root = this.renderRoot?.querySelector?.('[mono-sidebar], .mono-sidebar') as HTMLElement | null
      if (!root) return
      const classes = this._rootClasses
      if (root.getAttribute('class') !== classes) root.setAttribute('class', classes)
      const style = this._inlineRootStyle
      if (root.getAttribute('style') !== style) root.setAttribute('style', style)
      const aria = this._rootAriaHidden
      if (root.getAttribute('aria-hidden') !== aria) root.setAttribute('aria-hidden', aria)
      // sidebar.css keys on the `mono-*` STATE attributes, not the classes, so the
      // same hydration gap froze them too (`mono-effective` stayed the server's
      // desktop value on a phone). Re-assert them from the same source `render` uses.
      const attrs = sidebarRootAttrs({
        mode: this.mode,
        resolvedMode: this._resolvedMode,
        location: this.location,
        density: this.density,
        color: this.color,
        variant: this.variant,
      })
      const wanted: Record<string, string | null> = {
        'mono-effective': attrs.effective,
        'mono-mode': attrs.mode ?? null,
        'mono-location': attrs.location ?? null,
        'mono-density': attrs.density ?? null,
        'mono-color': attrs.color ?? null,
        'mono-variant': attrs.variant ?? null,
        'mono-open': this.modelValue ? '' : null,
        'mono-expand-on-hover': this.expandOnHover ? '' : null,
        'mono-contained': this.contained ? '' : null,
        'mono-persistent': this.persistent ? '' : null,
        'mono-no-scrim': this.showScrim ? null : '',
      }
      for (const [name, value] of Object.entries(wanted)) {
        if (value === null) {
          if (root.hasAttribute(name)) root.removeAttribute(name)
        } else if (root.getAttribute(name) !== value) root.setAttribute(name, value)
      }
    }

    private _setupAutoModeListener(): void {
      if (typeof window === 'undefined' || !window.matchMedia) return
      this._autoMql = window.matchMedia(`(max-width: ${SIDEBAR_AUTO_BREAKPOINT - 1}px)`)
      this._autoMqlListener = () => {
        if (this.mode === 'auto') {
          this._recomputeResolvedMode()
          this._writeLayoutVar()
          this.requestUpdate()
        }
      }
      this._autoMql.addEventListener('change', this._autoMqlListener)
    }

    private _teardownAutoModeListener(): void {
      if (this._autoMql && this._autoMqlListener) {
        this._autoMql.removeEventListener('change', this._autoMqlListener)
      }
      this._autoMql = null
      this._autoMqlListener = null
    }

    private _recomputeResolvedMode(): void {
      this._resolvedMode = resolveMode(this.mode)
    }

    /**
     * Publish the rail-collapsed state as a host attribute (`data-rail-collapsed`).
     * Cross-shadow CSS (descendant selectors + inherited custom properties on the
     * shadow `.mono-sidebar-body`) cannot reach a slotted *light* `<mono-menu>`, so
     * the menu mirrors this attribute and collapses itself. Collapsed = rail mode,
     * not toggled-open, and not hover-expanded. Pure attribute toggle → SSR-safe.
     */
    private _recomputeRailCollapsedAttr(): void {
      const collapsed =
        this._resolvedMode === 'rail' &&
        !this.modelValue &&
        !(this.expandOnHover && this._railHovered)
      // setAttribute/removeAttribute (not toggleAttribute) — guaranteed on the
      // lit-ssr DOM shim, so this is safe to run during SSR too.
      if (collapsed) this.setAttribute('data-rail-collapsed', '')
      else this.removeAttribute('data-rail-collapsed')
    }

    private _setupRailHoverListeners(): void {
      if (this._railPointerEnter) return
      this._railPointerEnter = () => {
        // Only `expandOnHover` grants the hover-expanded state, but ALWAYS
        // recompute: the panel can be widened by a stale `.expand-on-hover`
        // class (pure CSS, `sidebar.css`) while the live prop is already
        // false, and bailing here would strand the labels hidden.
        if (this.expandOnHover) this._railHovered = true
        this._recomputeRailCollapsedAttr()
      }
      this._railPointerLeave = () => {
        this._railHovered = false
        this._recomputeRailCollapsedAttr()
      }
      this.addEventListener('pointerenter', this._railPointerEnter)
      this.addEventListener('pointerleave', this._railPointerLeave)
    }

    private _teardownRailHoverListeners(): void {
      if (this._railPointerEnter) {
        this.removeEventListener('pointerenter', this._railPointerEnter)
      }
      if (this._railPointerLeave) {
        this.removeEventListener('pointerleave', this._railPointerLeave)
      }
      this._railPointerEnter = null
      this._railPointerLeave = null
      this._railHovered = false
    }

    /** The var this instance last wrote — `location` can change while mounted. */
    private _writtenVar: string | null = null

    private _writeLayoutVar(): void {
      if (isServer) return
      // A sidebar that became `contained` while mounted no longer pushes the page —
      // give up any claim it already holds instead of silently keeping it forever.
      if (this.contained) {
        if (this._writtenVar) releaseLayoutVar(this._writtenVar, this)
        this._writtenVar = null
        return
      }

      const widthVarLeft = '--mono-sidebar-left-width'
      const widthVarRight = '--mono-sidebar-right-width'
      const myVar = this.location === 'right' ? widthVarRight : widthVarLeft

      // Moved sides while mounted — give the old side's var back first.
      if (this._writtenVar && this._writtenVar !== myVar) {
        releaseLayoutVar(this._writtenVar, this)
      }

      let pushPx = 0
      if (this._resolvedMode === 'permanent') {
        pushPx = this.width
      } else if (this._resolvedMode === 'rail') {
        pushPx = this.modelValue ? this.width : this.railWidth
      } else {
        pushPx = 0
      }

      this._writtenVar = myVar
      claimLayoutVar(myVar, this, `${pushPx}px`)
    }

    private _clearLayoutVar(): void {
      if (isServer) return
      // Deliberately NOT gated on `contained`: release whatever this instance
      // actually claimed. A sidebar that was pushing the page and then flipped to
      // `contained` would otherwise skip its own release and strand the var.
      if (this._writtenVar) releaseLayoutVar(this._writtenVar, this)
      this._writtenVar = null
    }

    protected _setCssClass(value: unknown): void {
      applyCssClass(this, value)
    }

    protected _cls(base: string, key: keyof SidebarCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    protected get _rootClasses(): string {
      return generateSidebarRootClasses({
        mode: this.mode,
        resolvedMode: this._resolvedMode,
        location: this.location,
        density: this.density,
        color: this.color,
        variant: this.variant,
        open: this.modelValue,
        expandOnHover: this.expandOnHover,
        contained: this.contained,
        persistent: this.persistent,
        showScrim: this.showScrim,
        cssClassName: this.cssClassName,
        rootExtra: this.cssClass?.root,
      })
    }

    private _applyOpenSideEffects(): void {
      if (isServer || this.contained) return

      // ONE shared lock, not a second private one. This used to save and restore
      // `document.body.style.overflow` on its own, unaware of `popup-stack`, and the two
      // interleaved destructively: sidebar opens (saves ''), modal opens (saves the
      // sidebar's 'hidden'), sidebar closes (restores ''), modal closes (restores that
      // stale 'hidden') — and the page stays locked with nothing open. The stack now also
      // holds the root's overflow and the scrollbar gutter, which a body-only restore
      // could not put back at all. (`document.body` may be null while the parser is
      // still inside <head>; the shared lock carries that guard.)
      setExternalScrollLock(this, this.lockScroll)

      if (this.closeOnEscape && !this._escapeListener) {
        const listener = (event: KeyboardEvent) => {
          if (
            event.key === 'Escape' &&
            this.modelValue &&
            !this.persistent &&
            this._resolvedMode === 'temporary'
          ) {
            this.hide('escape', event)
          }
        }
        this._escapeListener = listener
        document.addEventListener('keydown', listener)
      }
    }

    private _releaseSideEffects(): void {
      if (isServer) return

      setExternalScrollLock(this, false)

      if (this._escapeListener) {
        document.removeEventListener('keydown', this._escapeListener)
        this._escapeListener = null
      }
    }

    private _emitChange(detail: SidebarClickEventDetail): void {
      // `mno-change` is the v-model-style state-change event. We deliberately do
      // NOT emit a generic `mno-click` here — that name is used by <mono-menu>
      // (per-item click, different detail shape) and bubbles, which would close
      // the sidebar on every menu-item click.
      dispatchMonoEvent(this, 'change', detail)
      if (detail.value && !detail.oldValue) {
        dispatchMonoEvent(this, 'open', detail)
      } else if (!detail.value && detail.oldValue) {
        dispatchMonoEvent(this, 'close', detail)
      }
    }

    public open(source: SidebarSource = 'manual', sourceEvent?: Event): void {
      if (this.modelValue) return
      const oldValue = this.modelValue
      this.modelValue = true
      this._emitChange({
        modelValue: true,
        currentValue: true,
        oldValue,
        value: true,
        source,
        sourceEvent,
      })
    }

    public hide(source: SidebarSource = 'manual', sourceEvent?: Event): void {
      if (!this.modelValue) return
      const oldValue = this.modelValue
      this.modelValue = false
      this._emitChange({
        modelValue: false,
        currentValue: false,
        oldValue,
        value: false,
        source,
        sourceEvent,
      })
    }

    public close(source: SidebarSource = 'manual', sourceEvent?: Event): void {
      this.hide(source, sourceEvent)
    }

    public toggle(source: SidebarSource = 'manual', sourceEvent?: Event): void {
      if (this.modelValue) this.hide(source, sourceEvent)
      else this.open(source, sourceEvent)
    }

    public expandRail(): void {
      if (this._resolvedMode !== 'rail') return
      this.open('rail-toggle')
    }

    public collapseRail(): void {
      if (this._resolvedMode !== 'rail') return
      this.hide('rail-toggle')
    }

    protected _handleScrimClick(event: Event): void {
      if (!this.closeOnScrim || this.persistent) return
      if (this._resolvedMode !== 'temporary') return
      this.hide('scrim', event)
    }

    protected _handleRailToggle(event: Event): void {
      if (this._resolvedMode !== 'rail') return
      this.toggle('rail-toggle', event)
    }

    /** Per-region slot content — overridden per build. */
    protected renderSlot(_name: SidebarSlotName): TemplateResult {
      return html``
    }

    /** Internal icon — light: UnoCSS `.mono-icon`; shadow: inline SVG. */
    protected renderIcon(_name: 'chevron'): TemplateResult {
      return html``
    }

    /**
     * The root's inline style. This getter is the ONLY safe place to put an inline
     * custom property on the root: `_syncRootFromState()` re-asserts the whole `style`
     * attribute after every update, so anything written out-of-band is wiped.
     *
     * `customColorStyle` returns '' unless `color` is a literal rather than a palette
     * slot; on the root it outranks the class-based `.mono-sidebar.<token>` presets,
     * which is exactly the precedence we want (flavor < prop).
     */
    protected get _inlineRootStyle(): string {
      return (
        `--mono-sidebar-width: ${this.width}px; --mono-sidebar-rail-width: ${this.railWidth}px;` +
        customColorStyle(isThemeColorToken(this.color) || this.color === 'surface' ? '' : this.color, 'sidebar')
      )
    }

    protected get _rootAriaHidden(): string {
      return this._resolvedMode === 'temporary' && !this.modelValue ? 'true' : 'false'
    }

    protected override render(): TemplateResult {
      const inlineStyle = this._inlineRootStyle
      const showDefaultRailToggle = this._resolvedMode === 'rail' && this.rail === null

      const attrs = sidebarRootAttrs({
        mode: this.mode,
        resolvedMode: this._resolvedMode,
        location: this.location,
        density: this.density,
        color: this.color,
        variant: this.variant,
      })

      return html`
        <div
          class=${this._rootClasses}
          style=${inlineStyle}
          role="navigation"
          aria-hidden=${this._resolvedMode === 'temporary' && !this.modelValue ? 'true' : 'false'}
          mono-sidebar
          mono-effective=${attrs.effective}
          mono-mode=${attrs.mode ?? nothing}
          mono-location=${attrs.location ?? nothing}
          mono-density=${attrs.density ?? nothing}
          mono-color=${attrs.color ?? nothing}
          mono-variant=${attrs.variant ?? nothing}
          ?mono-open=${this.modelValue}
          ?mono-expand-on-hover=${this.expandOnHover}
          ?mono-contained=${this.contained}
          ?mono-persistent=${this.persistent}
          ?mono-no-scrim=${!this.showScrim}
        >
          <div class=${this._cls('mono-sidebar-scrim', 'scrim')} mono-scrim @click=${this._handleScrimClick}></div>

          <aside class=${this._cls('mono-sidebar-panel', 'panel')} mono-panel>
            <div class="mono-sidebar-topbar" mono-topbar>
              <div class=${this._cls('mono-sidebar-header', 'header')} mono-header data-mono-slot="header">
                ${this.renderSlot('header')}
              </div>
              ${showDefaultRailToggle
                ? html`
                    <div class=${this._cls('mono-sidebar-rail', 'rail')} mono-rail>
                      <button
                        type="button"
                        class=${this._cls('mono-sidebar-rail-toggle', 'railToggle')}
                        mono-rail-toggle
                        aria-label=${this.modelValue ? 'Collapse sidebar' : 'Expand sidebar'}
                        @click=${this._handleRailToggle}
                      >
                        ${this.renderIcon('chevron')}
                      </button>
                    </div>
                  `
                : nothing}
            </div>
            <div class=${this._cls('mono-sidebar-body', 'body')} mono-body data-mono-slot="body">
              ${this.renderSlot('body')}
            </div>
            <div class=${this._cls('mono-sidebar-footer', 'footer')} mono-footer data-mono-slot="footer">
              ${this.renderSlot('footer')}
            </div>
          </aside>
        </div>
      `
    }
  }

  return MonoSidebarCoreClass as unknown as Constructor<MonoSidebarCoreInterface> & T
}
