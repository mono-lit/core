// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import type {
  NavDensity,
  NavColor,
  NavVariant,
  NavCssClass,
} from './nav-types.js'

import {
  booleanStringConverter,
  type Constructor,
} from '../../composables/hybird-prop'
import {
  cssPart,
  applyCssClass,
  defineCssClassAliases,
} from '../../composables/css-class'

import { claimLayoutVar, releaseLayoutVar } from '../../composables/layout-var'

import { getNavHeight, generateNavRootClasses } from './nav-utils.js'
import {
  CUSTOM_COLOR_CLASS,
  customColorStyle,
  isThemeColorToken,
} from '../../composables/color.js'

/** Slot regions the nav chrome lays out. `default` is the unnamed center slot. */
export type NavSlotName = 'start' | 'default' | 'end' | 'extension'

/**
 * Public surface the core mixin adds. Declared so the mixin's type can be
 * exported and so the light/shadow wrappers (and the tag map) see the API.
 */
export declare class MonoNavCoreInterface {
  density: NavDensity
  color: NavColor
  variant: NavVariant
  sticky: boolean
  extension: boolean
  cssClass: NavCssClass
  cssClassName: string
  /** Resolved bar height in px, including the extension row when enabled. */
  getHeight(): number
  /** Per-region slot content hook — overridden by the light/shadow wrappers. */
  protected renderSlot(slotName: NavSlotName): TemplateResult
}

/**
 * `MonoNavCore` — every render-mode-agnostic concern for `mono-nav`:
 * reactive props, the `css-class`/`cssclass` hybrid aliases, attribute
 * observation, layout-var side effects, and the chrome `render()`.
 *
 * What it deliberately does NOT decide:
 *  - `createRenderRoot()` (light vs shadow) — set by each wrapper.
 *  - how styles apply (global sheet vs `static styles`) — set by each wrapper.
 *  - the slot strategy — `renderSlot()` is a hook each wrapper overrides
 *    (light: empty, nodes are captured/placed; shadow: native `<slot>`).
 */
export const MonoNavCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoNavCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      // Vue interop: <mono-nav :cssClass / :css-class / :cssclass="{}" />
      defineCssClassAliases(this, (value) => this._setCssClass(value))
    }

    static get observedAttributes(): string[] {
      // IMPORTANT: use `super.observedAttributes`, not `superClass....`. At
      // runtime this invokes Lit's getter with `this` bound to the CONCRETE
      // subclass, which triggers `finalize()` and builds the attribute→property
      // map (`_$Eu`). Reading `superClass.observedAttributes` instead would
      // finalize the base LitElement and leave the real class un-finalized —
      // breaking `attributeChangedCallback` (notably under @lit-labs/ssr).
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [...base, 'css-class', 'cssclass']
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'css-class' || name === 'cssclass') {
        this._setCssClass(newValue)
      }
    }

    @property({ type: String })
    density: NavDensity = 'comfortable'

    @property({ type: String })
    color: NavColor = 'surface'

    @property({ type: String })
    variant: NavVariant = 'elevated'

    @property({
      reflect: true,
      converter: booleanStringConverter,
    })
    sticky = true

    @property({
      reflect: true,
      converter: booleanStringConverter,
    })
    extension = false

    @property({ attribute: false })
    cssClass: NavCssClass = {}

    /**
     * Plain HTML root class fallback:
     *
     * <mono-nav css-class="premium-nav"></mono-nav>
     */
    @property({ attribute: false })
    cssClassName = ''

    override connectedCallback(): void {
      super.connectedCallback()
      this._writeLayoutVar()
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback()
      this._clearLayoutVar()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      if (changed.has('density') && this.isConnected) {
        this._writeLayoutVar()
      }
      // Chain, or mixins composed below this one lose their `willUpdate`.
      // @ts-ignore — the generic mixin base may not declare it, LitElement does.
      super.willUpdate?.(changed)
    }

    protected _setCssClass(value: unknown): void {
      applyCssClass(this, value)
    }

    protected _cls(base: string, key: keyof NavCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    protected get _rootClasses(): string {
      return generateNavRootClasses({
        density: this.density,
        color: this.color,
        variant: this.variant,
        sticky: this.sticky,
        extension: this.extension,
        cssClassName: this.cssClassName,
        rootExtra: this.cssClass?.root,
      })
    }

    /**
     * Resolved bar height in pixels. Includes the extension row when enabled.
     * Public so consumers can size their main content imperatively if they
     * prefer JS over the `--mono-nav-height` CSS variable.
     */
    public getHeight(): number {
      const base = getNavHeight(this.density)
      if (!this.extension) return base
      const ext =
        this.density === 'compact' ? 36 : this.density === 'default' ? 48 : 44
      return base + ext
    }

    /**
     * `--mono-nav-height` is a DOCUMENT-level property, so every mounted nav writes
     * the same one. Claiming it through the shared refcount means unmounting one nav
     * no longer blanks the height for a nav that is still on screen — which is what
     * a route transition that mounts the new nav before unmounting the old one does.
     * See `composables/layout-var.ts`; `mono-sidebar` had the identical bug.
     */
    protected _writeLayoutVar(): void {
      if (typeof document === 'undefined') return
      claimLayoutVar('--mono-nav-height', this, `${this.getHeight()}px`)
    }

    protected _clearLayoutVar(): void {
      if (typeof document === 'undefined') return
      releaseLayoutVar('--mono-nav-height', this)
    }

    /**
     * Per-region slot content. Overridden by each build:
     *  - light DOM: returns nothing — children are captured and appended into
     *    the `[data-mono-slot]` targets imperatively.
     *  - shadow DOM: returns a native `<slot>` (unnamed for `default`).
     */
    protected renderSlot(_slotName: NavSlotName): TemplateResult {
      return html``
    }

    /**

     * Carries a literal `color` (`#7c3aed`, `rgb(…)`) that no stylesheet can know about.
     * Empty for a palette slot, which resolves entirely through the `.mono-nav.<token>`
     * rules instead.
     *
     * Must land on the ROOT element, not the host: a class-based `-preset` declared on
     * the root beats an inherited one, so a host-level write would silently lose. If a
     * `_syncRootFromState`-style attribute re-assert is ever added here (sidebar has one),
     * it has to serialize from THIS getter or it will wipe the colour.
     */
    protected get _inlineRootStyle(): string {
      const raw = isThemeColorToken(this.color) || this.color === 'surface' ? '' : this.color
      return customColorStyle(raw, 'nav')
    }


    /**
     * The Basecoat styling attributes, mirroring the props one for one. A prop
     * at its DEFAULT emits nothing — `:not([mono-density])` is comfortable,
     * `:not([mono-color])` is surface, `:not([mono-variant])` is elevated —
     * so the rendered DOM is also the shortest hand-written markup that paints
     * the same (see nav.css).
     *
     * `sticky` is the exception: it defaults to TRUE, so it is the negative
     * that carries information and `mono-static` is what a non-sticky bar says.
     */
    protected get _densityAttr(): string | typeof nothing {
      return this.density === 'comfortable' ? nothing : this.density
    }

    /** A literal colour cannot be an attribute VALUE any more than it could be a
     *  class token, so it collapses to the same `custom` marker and the colour
     *  itself arrives inline (see `_inlineRootStyle`). */
    protected get _colorAttr(): string | typeof nothing {
      if (!this.color || this.color === 'surface') return nothing
      return isThemeColorToken(this.color) ? this.color : CUSTOM_COLOR_CLASS
    }

    protected get _variantAttr(): string | typeof nothing {
      return this.variant === 'elevated' ? nothing : this.variant
    }

    protected override render(): TemplateResult {
      return html`
        <header
          class=${this._rootClasses}
          style=${this._inlineRootStyle}
          role="banner"
          mono-nav
          mono-density=${this._densityAttr}
          mono-color=${this._colorAttr}
          mono-variant=${this._variantAttr}
          ?mono-static=${!this.sticky}
          ?mono-has-extension=${this.extension}
        >
          <div class=${this._cls('mono-nav-inner', 'inner')} mono-inner>
            <div class=${this._cls('mono-nav-start', 'start')} mono-start data-mono-slot="start">${this.renderSlot('start')}</div>
            <div class=${this._cls('mono-nav-center', 'center')} mono-center data-mono-slot="default">${this.renderSlot('default')}</div>
            <div class=${this._cls('mono-nav-end', 'end')} mono-end data-mono-slot="end">${this.renderSlot('end')}</div>
          </div>
          <div class=${this._cls('mono-nav-extension', 'extension')} mono-extension data-mono-slot="extension">${this.renderSlot('extension')}</div>
        </header>
      `
    }
  }

  return MonoNavCoreClass as unknown as Constructor<MonoNavCoreInterface> & T
}
