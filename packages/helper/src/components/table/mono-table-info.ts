// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableInfoCore } from './mono-table-info-core.js'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-info` (default build, `@mono-lit/helper/ui/table`). Renders
 * into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). All logic lives in `MonoTableInfoCore`; the shadow build
 * (`@mono-lit/helper/ui/shadow/table`) shares the mixin. Both register the same tag,
 * so a document loads only one.
 */
@customElement('mono-table-info')
export class MonoTableInfo extends MonoTableInfoCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-info': MonoTableInfo
  }
}
