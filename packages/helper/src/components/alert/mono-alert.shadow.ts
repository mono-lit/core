// @unocss-include

import { isServer, LitElement, html, nothing, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoAlertCore, type AlertSlotName } from './alert-core.js'
import { adoptIconStyles, toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'
import { isIconifyClass, mdiGlyph } from '../../composables/icon'

import alertCss from './alert.css?raw'

/**
 * Shadow-DOM alert (the opt-in SSR build, `@mono-lit/helper/ui/shadow/alert`).
 *
 * Registered as `<mono-shadow-alert>` — a distinct tag from the light build's
 * `<mono-alert>` — so both can load side by side. Every region is rendered up
 * front with its prop as the native slot fallback, and the empty ones are marked
 * `[mono-empty]` (alert.css hides them). The body is `slot="body"` AND the
 * unnamed default slot; when either has content it replaces the icon, title and
 * subtitle, exactly as in the light build.
 */
@customElement('mono-shadow-alert')
export class MonoAlertShadow extends withShadowUtilityStyles(MonoAlertCore(LitElement)) {
  static {
    // Slot presence can only be measured after the first render creates the
    // <slot>s, and hydration corrects the default-hidden regions in a follow-up
    // update — the exception this dev warning describes.
    ;(this as typeof LitElement).disableWarning?.('change-in-update')
  }

  static override styles = [unsafeCSS(toShadowCss(alertCss, { host: 'mono-alert' }))]

  override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated(changed)
    this._scanSlots()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    // An iconify class that is not bundled as inline SVG is painted by the page's
    // icon CSS, adopted into this root.
    if (changed.has('icon') && isIconifyClass(this.icon) && !mdiGlyph(this.icon)) {
      adoptIconStyles(this.shadowRoot)
    }
  }

  private _slot(name: string): HTMLSlotElement | null {
    const selector = name === 'default' ? 'slot:not([name])' : `slot[name="${name}"]`
    return this.renderRoot.querySelector(selector) as HTMLSlotElement | null
  }

  /**
   * Whether something is ASSIGNED to a slot. Not `flatten: true`: for an empty
   * slot that returns the FALLBACK (the prop text), which would count as content.
   */
  private _assigned(slot: HTMLSlotElement | null): boolean {
    return (
      !!slot &&
      slot
        .assignedNodes()
        .some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? '').trim())
    )
  }

  private _scanSlots = (): void => {
    const set = (name: AlertSlotName, has: boolean) => {
      if (name === 'icon' && this._hasIconSlot !== has) this._hasIconSlot = has
      else if (name === 'title' && this._hasTitleSlot !== has) this._hasTitleSlot = has
      else if (name === 'subtitle' && this._hasSubtitleSlot !== has) this._hasSubtitleSlot = has
      else if (name === 'body' && this._hasBodySlot !== has) this._hasBodySlot = has
    }
    set('icon', this._assigned(this._slot('icon')))
    set('title', this._assigned(this._slot('title')))
    set('subtitle', this._assigned(this._slot('subtitle')))
    set('body', this._assigned(this._slot('body')) || this._assigned(this._slot('default')))
  }

  /** Iconify classes are drawn as inline SVG — page utility CSS cannot reach here. */
  protected override _renderIconGlyph(): TemplateResult | typeof nothing {
    if (!this.icon) return nothing
    if (!isIconifyClass(this.icon)) return html`${this.icon}`
    const glyph = mdiGlyph(this.icon)
    if (glyph) return html`<span class="mono-alert-iconify" mono-glyph>${glyph}</span>`
    // not bundled: the page's icon rule, adopted in `updated()`
    return html`<span class=${`mono-alert-iconify ${this.icon}`} mono-glyph></span>`
  }

  protected override _renderMain(): unknown {
    return html`<span
        class=${this._cls('mono-alert-icon', 'icon')}
        mono-icon
        aria-hidden="true"
        ?mono-empty=${!this._showsIcon}
        ><slot name="icon" @slotchange=${this._scanSlots}>${this._renderIconGlyph()}</slot></span
      ><div
        class=${this._cls('mono-alert-title', 'title')}
        mono-title
        ?mono-empty=${!this._showsTitle}
      ><slot name="title" @slotchange=${this._scanSlots}>${this.title || nothing}</slot></div
      ><div
        class=${this._cls('mono-alert-subtitle', 'subtitle')}
        mono-subtitle
        ?mono-empty=${!this._showsSubtitle}
      ><slot name="subtitle" @slotchange=${this._scanSlots}>${this.subtitle || nothing}</slot></div
      ><div
        class=${this._cls('mono-alert-body', 'body')}
        mono-body
        ?mono-empty=${!isServer && !this._hasBodySlot}
      ><slot name="body" @slotchange=${this._scanSlots}></slot><slot
          @slotchange=${this._scanSlots}
        ></slot></div>`
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit an SSR'd element can stay un-hydrated; flush the first
    // client update (a no-op once already hydrated).
    flushSsrHydration(this)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-shadow-alert': MonoAlertShadow
  }
}
