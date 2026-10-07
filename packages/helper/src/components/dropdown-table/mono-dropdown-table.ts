// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoDropdownTableCore } from './dropdown-table-core.js'
import { guardHostTextContent, placeSlotNode } from '../../composables/light-slots'

import dropdownTableCss from './dropdown-table.css?raw'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-dropdown-table` (default build, `@mono-lit/helper/ui/dropdown-table`).
 * A dropdown whose panel holds a **native `<table>`** for picking row(s), driven by
 * a {@link monoDataDropdown} controller bound with `:data-dropdown.prop`.
 *
 * Light-DOM slot strategy (mirrors `mono-dropdown`): the consumer's children are
 * captured by their `slot` attribute in `connectedCallback` (`search` / `footer` /
 * default → the table body), the template renders empty `[data-mono-slot]` targets,
 * and the captured nodes are re-appended in `updated()` — falling back to the popup
 * portal once the panel is relocated to `<body>`. The captured nodes are MOVED (not
 * cloned), so a Vue-authored `<table>` keeps its reactivity.
 *
 * @example
 * <mono-dropdown-table :data-dropdown.prop="dd" placeholder="Pick a department" clearable>
 *   <mono-table-search :data-grid.prop="dd.grid" slot="search" />
 *   <table mono-table>
 *     <thead>…mono-table-th…</thead>
 *     <tbody>
 *       <tr v-for="r in rows" :key="r.Id" :data-row-key="String(r.Id)">
 *         <td>{{ r.Code }}</td><td>{{ r.Nama }}</td>
 *       </tr>
 *     </tbody>
 *   </table>
 *   <mono-table-paging :data-grid.prop="dd.grid" slot="footer" />
 * </mono-dropdown-table>
 */
@customElement('mono-dropdown-table')
export class MonoDropdownTable extends MonoDropdownTableCore(LitElement) {
  static override styles = [unsafeCSS(dropdownTableCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _slotSearch: Node[] = []
  private _slotBody: Node[] = []
  private _slotFooter: Node[] = []

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so the captured content — and the consumer's Vue
    // anchors that travel with it — is re-placed within this insert rather than a
    // microtask later; otherwise a patch in that window hits a detached node and
    // crashes Vue. Later updates still run async and re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    // Place captured nodes BEFORE the core's updated() (which reflects selection).
    this._placeSlot('search', this._slotSearch)
    this._placeSlot('body', this._slotBody)
    this._placeSlot('footer', this._slotFooter)
    super.updated(changed)
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return
    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const taken = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) {
        // Drop stray whitespace text nodes; keep nothing unslotted-textual.
        continue
      }
      const slotName = node.getAttribute('slot')
      if (slotName === 'search') {
        node.removeAttribute('slot')
        this._slotSearch.push(node)
      } else if (slotName === 'footer') {
        node.removeAttribute('slot')
        this._slotFooter.push(node)
      } else {
        // default (the <table>) → body
        this._slotBody.push(node)
      }
      taken.add(node)
    }

    for (const node of taken) {
      if (node.parentNode === this) this.removeChild(node)
    }

    // Vue patches a lone interpolation with `host.textContent = next`, which in a
    // light build would wipe this element's whole render. Send those writes to the
    // body region instead.
    guardHostTextContent(
      this,
      new Map([
        ['search', this._slotSearch],
        ['body', this._slotBody],
        ['footer', this._slotFooter],
      ]),
      { fallback: 'body', onWrite: () => this.requestUpdate() },
    )
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return
    const sel = `[data-mono-slot="${name}"]`
    // The panel may be relocated into the body portal — fall back to it.
    const target =
      (this.querySelector(sel) as HTMLElement | null) ??
      ((this._popup.panelRoot as ParentNode | null)?.querySelector?.(sel) as HTMLElement | null)
    if (!target) return
    for (const node of nodes) {
      placeSlotNode(target, node)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-dropdown-table': MonoDropdownTable
  }
}
