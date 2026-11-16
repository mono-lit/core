// @unocss-include

import { LitElement, isServer } from 'lit'
import { customElement } from '../../composables/mono-element'
import { MonoSliderCore } from './slider-core.js'

import sliderCss from './slider.css?raw'
import { placeSlotNode, unwatchHostChildren, watchHostChildren } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-slider` (default build, `@mono-lit/helper/ui/slider`).
 *
 * Renders into the host (styled by the global `dist/ui/index.css`). `slot="label"` /
 * `slot="helper"` children are captured on connect and re-placed into `[data-mono-slot]`
 * placeholders after each render — the same strategy as mono-input. Everything else lives in
 * `MonoSliderCore`; the shadow build (`mono-shadow-slider`) shares it with native `<slot>`s.
 */
@customElement('mono-slider')
export class MonoSlider extends MonoSliderCore(LitElement) {

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  private _slotLabel: Node[] = []
  private _slotHelper: Node[] = []
  /** Re-capture on children appended after connect — one shared observer, see `watchHostChildren`. */
  private readonly _onHostChildren = (): void => this._captureSlots()

  /** Capture `slot="label|helper"` children. Safe to re-run: captured nodes lose `slot` and leave the host. */
  private _captureSlots(): void {
    const captured = new Set<Node>()
    for (const node of monoHostChildNodes(this)) {
      if (!(node instanceof Element)) continue
      const name = node.getAttribute('slot')
      if (name === 'label') this._slotLabel.push(node)
      else if (name === 'helper') this._slotHelper.push(node)
      else continue
      node.removeAttribute('slot')
      captured.add(node)
    }
    if (captured.size) {
      this._hasLabelSlotState = this._slotLabel.length > 0
      this._hasHelperSlotState = this._slotHelper.length > 0
      for (const node of captured) if (node.parentNode === this) this.removeChild(node)
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (!isServer) watchHostChildren(this, this._onHostChildren)
    this._captureSlots()
    // Render synchronously so captured slot nodes are re-placed within this insert (see mono-input).
    if (this.isConnected) this.performUpdate()
  }

  override disconnectedCallback(): void {
    unwatchHostChildren(this, this._onHostChildren)
    super.disconnectedCallback()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)
    this._placeSlot('label', this._slotLabel)
    this._placeSlot('helper', this._slotHelper)
  }

  private _placeSlot(name: string, nodes: Node[]): void {
    if (!nodes.length) return
    const target = this.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) return
    for (const node of nodes) placeSlotNode(target, node)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mono-slider': MonoSlider
  }
}
