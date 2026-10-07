// @unocss-include

import { isServer, LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoDropdownCore } from './dropdown-core.js'
import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'

import dropdownCss from './dropdown.css?raw'
import { flushSsrHydration } from '../../composables/hydration-flush'

/**
 * Shadow-DOM `mono-dropdown` (SSR build, `@mono-lit/helper/ui/shadow/dropdown`).
 *
 * Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
 * Declarative Shadow DOM. Slotting uses native `<slot>` (named `main` for the
 * activator, default for the panel body). Trigger listeners attach to the main
 * slot's assigned elements, re-synced on `slotchange`.
 *
 * Shares all logic with the light build via `MonoDropdownCore`. Both register
 * `mono-dropdown`, so a document loads only one build.
 */
@customElement('mono-shadow-dropdown')
export class MonoDropdownShadow extends withShadowUtilityStyles(MonoDropdownCore(LitElement)) {
  static override styles = [
    unsafeCSS(toShadowCss(dropdownCss, { hostDisplay: 'inline-block' })),
  ]

  protected override _activeMainNodes(): HTMLElement[] {
    const slot = this.renderRoot.querySelector('slot[name="main"]') as HTMLSlotElement | null
    if (!slot) return []
    return slot
      .assignedElements()
      .filter((n): n is HTMLElement => n instanceof HTMLElement)
  }

  /**
   * No-op: the shadow build carries state classes on an inner `.mono-dropdown`
   * root rendered in `render()` (see below), NOT the host. The host's `class` is
   * controlled by the framework (Vue), which would wipe host classes — including
   * `open` — on every re-render, so the panel could never stay open.
   */
  protected override _updateHostClasses(): void {
    // The CLASSES ride the inner root's template binding; the styling ATTRIBUTES
    // are applied here, to that same inner root, so both builds share one
    // `_computeRootAttrs()`. (Rendering them in the template would mean
    // repeating every default test as a separate binding.)
    this._applyRootAttrs(this.renderRoot?.querySelector('[mono-dropdown]') as HTMLElement | null)
  }

  private _onMainSlotChange = (): void => {
    this._syncTriggerListeners()
    this._positionPanel()
  }

  protected override render(): TemplateResult {
    return html`
      <div class=${this._computeHostClasses().join(' ')} mono-dropdown>
        <span class=${this._cls('mono-dropdown-main', 'main')} mono-activator>
          <slot name="main" @slotchange=${this._onMainSlotChange}></slot>
        </span>
        <div
          class=${this._cls('mono-dropdown-panel', 'panel')}
          mono-panel
          role="dialog"
          aria-hidden=${this.modelValue ? 'false' : 'true'}
        >
          <div class=${this._cls('mono-dropdown-body', 'body')} mono-body>
            <!-- accept both <… slot="body"> and unslotted body content (matches
                 the light build's capture, which treats both as body) -->
            <slot name="body"></slot>
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    // Under nuxt-ssr-lit the SSR'd element can stay `hasUpdated:false` with
    // updates disabled after the wrapper removes `defer-hydration` — its
    // handlers never bind and follow-up passes (slot scans, controller wiring)
    // never run. Flush the first client update; a no-op once already hydrated.
    flushSsrHydration(this)
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-dropdown']` augmentation is owned by the
// light build (mono-dropdown.ts); redeclaring it here would be a TS2717 conflict.
