// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ref } from 'lit/directives/ref.js'

import { MonoButtonDropdownCore } from './button-dropdown-core.js'
import { adoptIconStyles, toShadowCss, withShadowUtilityStyles } from '../../composables/shadow-css'
// Registers `mono-shadow-button`, the tag this build's entries render as.
import './mono-button.shadow.js'

import buttonCss from './button.css?raw'
import buttonDropdownCss from './button-dropdown.css?raw'

/**
 * Shadow-DOM `mono-button-dropdown` — `@mono-lit/helper/ui/shadow/button-dropdown`,
 * registered as the DISTINCT tag `mono-shadow-button-dropdown` so it can coexist
 * with the light build in one document.
 *
 * Shares every behaviour with the light build through `MonoButtonDropdownCore`;
 * the only difference is `_buttonTag()`, which points the entries at
 * `mono-shadow-button` instead of `mono-button`.
 *
 * The panel is NOT portaled out of the shadow root — `PopupPortalController`
 * positions it in place for shadow builds — so it inherits these styles normally.
 */
@customElement('mono-shadow-button-dropdown')
export class MonoButtonDropdownShadow extends withShadowUtilityStyles(
  MonoButtonDropdownCore(LitElement),
) {
  static override styles = [
    // `button.css` is NOT host-rewritten: its `mono-button` rules style the
    // EMBEDDED buttons here, not this host. Only the dropdown's own sheet gets a
    // host, and via `hostDisplay` — its state classes live on the inner root.
    unsafeCSS(toShadowCss(buttonCss, {})),
    unsafeCSS(toShadowCss(buttonDropdownCss, { hostDisplay: 'inline-flex' })),
  ]

  protected override _buttonTag(): string {
    return 'mono-shadow-button'
  }

  /**
   * Shadow buttons project through a native `<slot>` — they never relocate their
   * children — so entry content can stay a Lit template here, which also keeps
   * this build SSR-safe (no `document.createElement` at render time).
   */
  protected override _declarativeItems(): boolean {
    return true
  }

  /**
   * `buttons[].icon` is DATA-driven, so the icon element is created inside this
   * shadow root — where the page's `i-mdi-*` utilities don't reach, leaving the
   * entries icon-less. `withShadowUtilityStyles` can't cover it: that path
   * deliberately excludes icon selectors so the two strategies don't collide.
   *
   * `adoptIconStyles` is the matching mechanism — one shared, LIVE constructable
   * sheet that keeps repopulating until it has captured real `.i-…` glyph rules,
   * so adopting early (before UnoCSS has loaded) still paints once it does.
   * Called from both hooks for exactly that reason.
   */
  protected override firstUpdated(changed: Map<string, unknown>): void {
    super.firstUpdated?.(changed)
    adoptIconStyles(this.renderRoot as ShadowRoot)
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated?.(changed)
    adoptIconStyles(this.renderRoot as ShadowRoot)
  }

  /** Panel written statically for the same reason as the light build. */
  protected override render(): TemplateResult {
    return html`<div class=${this._cls('mono-button-dropdown', 'root')} mono-button-dropdown ${ref(this.bindRoot)}>
      ${this.renderRow()}${this.renderTrigger()}
      <div
        class=${this.panelClass}
        mono-panel
        role="menu"
        aria-hidden=${this.modelValue ? 'false' : 'true'}
        ?hidden=${this.panelHidden}
        ${ref(this.bindPanel)}
      >
        ${this.renderMenuList()}
      </div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-shadow-button-dropdown': MonoButtonDropdownShadow
  }
}
