// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import {
  MonoTableSortCore,
  type TableSortSlotName,
  type TableSortIconName,
} from './mono-table-sort-core.js'
import { captureLightSlots, type LightSlotBuckets, placeSlotNode } from '../../composables/light-slots'

import tableCss from './table.css?raw'

/**
 * Light-DOM `mono-table-sort` (default build, `@mono-lit/helper/ui/table`). A sort
 * control for a column header — place it inside a native `<th>`.
 *
 * Light-DOM Lit replaces the host's children on render, so the user's label
 * nodes are captured once in `connectedCallback` and re-appended into the
 * `[data-mono-slot="label"]` placeholder after each render (reusing the same
 * nodes instead of re-rendering the text, which would otherwise duplicate it).
 * The sort indicator is a single global UnoCSS icon that swaps with the direction
 * (neutral `i-fluent-arrow-sort-16-filled` → `i-ri-arrow-up-long-fill` /
 * `i-ri-arrow-down-long-fill`). All other logic lives in `MonoTableSortCore`; the
 * shadow build shares the mixin.
 *
 * @example
 * <th><mono-table-sort :data-grid.prop="table" field="Nama">Name</mono-table-sort></th>
 */
@customElement('mono-table-sort')
export class MonoTableSort extends MonoTableSortCore(LitElement) {
  static override styles = [unsafeCSS(tableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  /** The captured label nodes (the element's original light-DOM children). */
  private _buckets: LightSlotBuckets = new Map()
  private _slotsCaptured = false

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so the captured label (and any Vue anchors carried with
    // it) is re-placed within this insert rather than a microtask later; otherwise
    // a patch in that window hits a detached node and crashes Vue.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed) // core: reflects aria-sort onto the parent cell
    if (!this.caption) this._placeSlot('label', this._buckets.get('default') ?? [])
  }

  protected override renderSlot(_name: TableSortSlotName): TemplateResult {
    // Light DOM: the captured nodes are re-appended into the placeholder by
    // `_placeSlot` in `updated()`, so the slot itself renders empty.
    return html``
  }

  protected override renderIcon(_name: TableSortIconName): TemplateResult {
    // Single icon, glyph chosen by the active direction. The three class strings
    // must stay literal so UnoCSS scans them (they're also safelisted).
    const cls =
      this._current === 'asc'
        ? 'i-ri-arrow-up-long-fill'
        : this._current === 'desc'
          ? 'i-ri-arrow-down-long-fill'
          : 'i-fluent-arrow-sort-16-filled'
    return html`<span class="mono-table-sort-caret ${cls}" mono-sort-caret></span>`
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    // The whole content is the label. `captureLightSlots` carries the consumer's
    // Vue anchors (comments + zero-length Fragment text) into the bucket instead of
    // deleting them, and leaves formatting whitespace in the host.
    this._buckets = captureLightSlots(this, { names: [] })
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return
    const target = this.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return
    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-table-sort': MonoTableSort
  }
}
