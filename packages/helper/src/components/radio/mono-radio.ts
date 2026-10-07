// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoRadioCore } from './radio-core.js'

import radioCss from './radio.css?raw'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-radio` (default build, `@mono-lit/helper/ui/radio`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`). The `slot="label"`/`slot="description"` children use the
 * light-DOM strategy: captured in `connectedCallback`, the template renders empty
 * `[data-mono-slot]` targets (via the core's default `_renderLabelBlock`), and the
 * captured nodes are re-placed in `updated()`. All render-mode-agnostic logic
 * lives in `MonoRadioCore`. The shadow build (`@mono-lit/helper/ui/shadow/radio`)
 * shares the mixin but uses native `<slot>`. Both register `mono-radio`, so a
 * document loads only one.
 */
@customElement('mono-radio')
export class MonoRadio extends MonoRadioCore(LitElement) {
  static override styles = [unsafeCSS(radioCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  @state()
  private _slotsCaptured = false

  private _slotLabel: Node[] = []
  private _slotDescription: Node[] = []

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
    super.updated?.(changed)
    this._placeSlot('label', this._slotLabel)
    this._placeSlot('description', this._slotDescription)
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

      // `sublabel` is the slot's name; `description` is still accepted
      if (slotName === 'sublabel' || slotName === 'description') {
        node.removeAttribute('slot')
        this._slotDescription.push(node)
        capturedSlotNodes.add(node)
      }
    }

    this._hasLabelSlotState = this._slotLabel.length > 0
    this._hasDescriptionSlotState = this._slotDescription.length > 0

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
    'mono-radio': MonoRadio
  }
}
