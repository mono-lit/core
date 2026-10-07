// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'
import { ref } from 'lit/directives/ref.js'

import { MonoButtonDropdownCore } from './button-dropdown-core.js'
// Registers the element each entry renders as. Importing it here means whichever
// entry the consumer loads, the embedded button is always defined.
import './mono-button.js'

import buttonCss from './button.css?raw'
import buttonDropdownCss from './button-dropdown.css?raw'

/**
 * Light-DOM `mono-button-dropdown` (default build,
 * `@mono-lit/helper/ui/button-dropdown`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). Unlike most components here it takes no slots: the whole
 * surface is the `buttons` array, so there is nothing to capture and none of the
 * light-DOM slot machinery is needed.
 *
 * All render-mode-agnostic logic lives in `MonoButtonDropdownCore`; the shadow
 * build shares it and only swaps the embedded button's tag.
 */
@customElement('mono-button-dropdown')
export class MonoButtonDropdown extends MonoButtonDropdownCore(LitElement) {
  // `button.css` too: the entries are `<mono-button>`s, and the row/menu rules
  // here reach into their classes to square off and left-align menu rows.
  static override styles = [unsafeCSS(buttonCss), unsafeCSS(buttonDropdownCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  /**
   * The panel is a STATIC element here, not something a helper returns.
   *
   * `PopupPortalController` moves it into a `<body>` portal on open and never
   * moves it back. A node produced inside a `${}` expression sits in a
   * `ChildPart` range, and ejecting it from that range breaks Lit on the next
   * render ("this `ChildPart` has no `parentNode`"). As a fixed template node it
   * has no range to leave — which is exactly why `mono-dropdown` is shaped this
   * way too.
   */
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
    'mono-button-dropdown': MonoButtonDropdown
  }
}
