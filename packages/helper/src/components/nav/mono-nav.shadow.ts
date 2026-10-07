// @unocss-include

import { LitElement, isServer, unsafeCSS, html, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoNavCore, type NavSlotName } from './nav-core.js'

import { toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
import { flushSsrHydration } from '../../composables/hydration-flush'

import navCss from './nav.css?raw'

/**
 * Shadow-DOM `mono-nav` (the opt-in SSR build, `@mono-lit/helper/ui/shadow/nav`).
 *
 * Renders into a real shadow root (no `createRenderRoot` override), so:
 *  - `@lit-labs/ssr` can serialize it to Declarative Shadow DOM on the server,
 *  - styles are scoped via `static styles` (the `:host`-adapted nav sheet),
 *  - slotting uses native `<slot>` instead of the light build's capture hack.
 *
 * Shares ALL behavior with the light build via `MonoNavCore`. Both register the
 * SAME `mono-nav` tag, so a given document must load only one of the two builds
 * (see plan/2026-06-23-shadow-dom-ssr-mixin-spike.md).
 */
@customElement('mono-shadow-nav')
export class MonoNavShadow extends withShadowUtilityStyles(MonoNavCore(LitElement)) {
  static override styles = [unsafeCSS(toShadowCss(navCss, { host: 'mono-nav' }))]

  override connectedCallback(): void {
    super.connectedCallback()
    if (isServer) return
    flushSsrHydration(this)
  }

  protected override renderSlot(slotName: NavSlotName): TemplateResult {
    // `default` is the unnamed center slot; the rest are named.
    return slotName === 'default'
      ? html`<slot></slot>`
      : html`<slot name=${slotName}></slot>`
  }
}

// NOTE: the `HTMLElementTagNameMap['mono-nav']` augmentation is intentionally
// owned by the light build (mono-nav.ts) only. Redeclaring it here with a
// different class type would be a TS2717 conflict, since the dts build compiles
// the whole src tree. The public surfaces are identical (both via MonoNavCore).
