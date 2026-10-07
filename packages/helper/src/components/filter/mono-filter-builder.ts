// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoFilterBuilderCore, type FilterIconName } from './filter-builder-core.js'

import filterCss from './filter.css?raw'

/**
 * Light-DOM `mono-filter-builder` (default build, `@mono-lit/helper/ui/filter`).
 * Icons use the global UnoCSS `.mono-icon i-mdi-*`.
 *
 * It renders `mono-input`'s classes for its selects/inputs, and those rules ship in
 * the same global `dist/ui/index.css` — so no extra stylesheet is needed here.
 */
@customElement('mono-filter-builder')
export class MonoFilterBuilder extends MonoFilterBuilderCore(LitElement) {
  static override styles = [unsafeCSS(filterCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  protected override renderIcon(name: FilterIconName): TemplateResult {
    if (name === 'trash') return html`<span class="mono-icon i-mdi-trash-can-outline"></span>`
    if (name === 'plus') return html`<span class="mono-icon i-mdi-plus"></span>`
    return html`<span class="mono-icon i-mdi-file-tree-outline"></span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-filter-builder': MonoFilterBuilder
  }
}
