// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoTableSearchCore, type TableSearchIconName } from './mono-table-search-core.js'

import tableCss from './table.css?raw'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildren } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-table-search` (default build, `@mono-lit/helper/ui/table`).
 * The icons use the global UnoCSS `.mono-icon i-mdi-*`. All other logic lives in
 * `MonoTableSearchCore`; the shadow build shares the mixin.
 *
 * The element renders `mono-input`'s classes, whose rules ship in the same global
 * `dist/ui/index.css` — so no extra stylesheet is needed for the light build.
 */
@customElement('mono-table-search')
export class MonoTableSearch extends MonoTableSearchCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  /**
   * Light-DOM slot capture (mirrors `mono-dropdown-table`): a real `<slot>` can't
   * project when the render root IS the host, so the `slot="filter-builder"`
   * child is captured here, lifted out of the host, and re-appended into the
   * `[data-mono-slot]` placeholder the core renders. The node is MOVED (not
   * cloned), so a Vue-authored `<mono-filter-builder>` keeps its reactivity.
   */
  private _slotsCaptured = false
  private _filterSlots: Element[] = []

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureFilterSlot()
    // Render synchronously so the captured node is re-placed inside this insert
    // rather than a microtask later — avoids a detached-node race with Vue.
    if (this.isConnected) this.performUpdate()
  }

  private _captureFilterSlot(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true
    const captured: Element[] = []
    for (const node of monoHostChildren(this)) {
      if (node.getAttribute('slot') === 'filter-builder') {
        node.removeAttribute('slot')
        captured.push(node)
      }
    }
    for (const node of captured) {
      if (node.parentNode === this) this.removeChild(node)
    }
    this._filterSlots = captured
    this._setFilterSlotted(captured.length > 0)
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    const sel = '[data-mono-slot="filter-builder"]'
    // Once the panel is portaled to <body>, the placeholder leaves `this` — fall
    // back to the popup's panel root (mirrors `mono-dropdown-table._placeSlot`).
    const target =
      (this.querySelector(sel) as HTMLElement | null) ??
      ((this._filterPanelRoot() as ParentNode | null)?.querySelector?.(sel) as
        | HTMLElement
        | null) ??
      null
    if (target) {
      for (const node of this._filterSlots) {
        placeSlotNode(target, node)
      }
    }
  }

  protected override renderIcon(name: TableSearchIconName): TemplateResult {
    if (name === 'close') return html`<span class="mono-icon i-mdi-close" aria-hidden="true"></span>`
    if (name === 'chevron')
      return html`<span class="mono-icon i-mdi-chevron-down" aria-hidden="true"></span>`
    return html`<span class="mono-icon i-mdi-magnify"></span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-search': MonoTableSearch
  }
}
