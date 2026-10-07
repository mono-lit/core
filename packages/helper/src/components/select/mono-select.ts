// @unocss-include

import { LitElement, html, unsafeCSS, type TemplateResult } from 'lit'
import { customElement } from '../../composables/mono-element'

import { MonoSelectCore } from './select-core.js'

import selectCss from './select.css?raw'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-select` (default build, `@mono-lit/helper/ui/select`).
 *
 * `createRenderRoot()` returns `this`, so the component renders into light DOM
 * and inherits the page's global stylesheet (UnoCSS icons, theme variables).
 * Named slots (label/helper/prefix/suffix) are captured from the light-DOM
 * children in `connectedCallback` and re-parented into the rendered
 * `data-mono-slot` placeholders in `updated()`. All behavior is shared with the
 * shadow build (`@mono-lit/helper/ui/shadow/select`) via `MonoSelectCore`; both
 * register `mono-select`, so a document loads only one build.
 */
@customElement('mono-select')
export class MonoSelect extends MonoSelectCore(LitElement) {
  static override styles = [unsafeCSS(selectCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotsCaptured = false
  private _slotLabel: Node[] = []
  private _slotHelper: Node[] = []
  private _slotPrefix: Node[] = []
  private _slotSuffix: Node[] = []
  /**
   * The consumer's `slot="list"` wrapper — ONE element holding their own `v-for`.
   *
   * Held as a single node and never opened: mono places the wrapper and leaves its children alone.
   * Relocating them would break the consumer's next insert, since Vue positions a new row with
   * `insertBefore(node, anchor)` against the sibling that mono had moved away.
   */
  private _slotList: Element | null = null

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so a captured named-slot element (and any Vue anchor
    // beside it) is re-placed within this insert rather than a microtask later;
    // otherwise a patch in that window (e.g. a child's mounted() flipping a v-if)
    // hits a detached node and crashes Vue. Later updates re-place idempotently.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._onLateListSlot()
    this._placeSlot('label', this._slotLabel)
    this._placeSlot('helper', this._slotHelper)
    this._placeSlot('prefix', this._slotPrefix)
    this._placeSlot('suffix', this._slotSuffix)
    this._placeListSlot()
    // After placement, so the wrapper is where the chrome expects it — and before the browser
    // paints, so a row never flashes without its state.
    this._watchListChrome()
    this._syncListChrome()
  }

  /**
   * The captured wrapper, which is the truth for this build at every moment: parked out of the
   * host before the panel exists, and inside the panel after. The core's default (a light child of
   * the host) is the SHADOW build's answer and would find nothing here.
   */
  protected override get _listSlotWrapper(): HTMLElement | null {
    return this._slotList as HTMLElement | null
  }

  /** Light-DOM target for the list wrapper; the shadow build projects instead. */
  protected override renderListSlot(): TemplateResult {
    return html`<div class="mono-select-list-slot" mono-list-slot data-mono-slot="list" @click=${this._onListSlotClick}></div>`
  }

  /**
   * Move the wrapper into the panel, once it exists.
   *
   * The panel is relocated into a body portal while open, so the target is queried through the
   * core's portal-aware root rather than the host. Idempotent: once the wrapper is inside the
   * target it is left alone, which matters because re-appending it on every render would blow away
   * the consumer's scroll position and focus.
   */
  private _placeListSlot(): void {
    const wrapper = this._slotList
    if (!wrapper) return

    const target = this._listSlotTarget
    if (!target || wrapper.parentNode === target) return

    target.appendChild(wrapper)
  }

  /**
   * Adopt a wrapper that appeared after `connectedCallback` — see `LateSlotWatcher`.
   *
   * Two things have to happen and the order matters. It is PARKED first, out of the host, because
   * until it is placed it would otherwise paint in the host's own flow, under the field rather
   * than inside the panel — that is the bug this exists for. Only then is the flag flipped, which
   * schedules the render that creates the target `_placeListSlot` needs.
   *
   * Parking detached is safe for the subtree inside it: the consumer's `v-for` inserts against
   * anchors that are its OWN children, and those move with it.
   */
  protected override _onLateListSlot(): void {
    if (this._slotList) return

    const wrapper = this._lateListSlot.find()
    if (!wrapper) return

    this._slotList = wrapper
    if (wrapper.parentNode === this) this.removeChild(wrapper)
    this._hasListSlotState = true
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return

    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    const capturedSlotNodes = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) continue

      const slotName = node.getAttribute('slot')

      if (slotName === 'label') {
        node.removeAttribute('slot')
        this._slotLabel.push(node)
        capturedSlotNodes.add(node)
      }

      if (slotName === 'helper') {
        node.removeAttribute('slot')
        this._slotHelper.push(node)
        capturedSlotNodes.add(node)
      }

      if (slotName === 'prefix') {
        node.removeAttribute('slot')
        this._slotPrefix.push(node)
        capturedSlotNodes.add(node)
      }

      if (slotName === 'suffix') {
        node.removeAttribute('slot')
        this._slotSuffix.push(node)
        capturedSlotNodes.add(node)
      }

      // Only the FIRST wrapper counts — the contract is one block holding the loop, and a second
      // would have nowhere to go. The `slot` attribute is deliberately LEFT ON: it is inert in
      // light DOM, it keeps one authoring shape working across both builds, and it is what makes
      // the wrapper findable again if it is ever re-added.
      if (slotName === 'list' && !this._slotList) {
        this._slotList = node
        this._hasListSlotState = true
        capturedSlotNodes.add(node)
      }
    }

    this._hasLabelSlotState = this._slotLabel.length > 0
    this._hasHelperSlotState = this._slotHelper.length > 0
    this._hasPrefixSlotState = this._slotPrefix.length > 0
    this._hasSuffixSlotState = this._slotSuffix.length > 0

    for (const node of capturedSlotNodes) {
      if (node.parentNode === this) {
        this.removeChild(node)
      }
    }
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
    'mono-select': MonoSelect
  }
}
