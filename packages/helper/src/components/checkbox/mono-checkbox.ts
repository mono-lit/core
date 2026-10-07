// @unocss-include

import { LitElement, unsafeCSS } from 'lit'
import { state } from 'lit/decorators.js'
import { customElement } from '../../composables/mono-element'

import { MonoCheckboxCore } from './checkbox-core.js'

import checkboxCss from './checkbox.css?raw'
import { placeSlotNode } from '../../composables/light-slots'
import { monoHostChildNodes } from '../../composables/mono-skeleton'

/**
 * Light-DOM `mono-checkbox` (default build, `@mono-lit/helper/ui/checkbox`).
 *
 * Renders into the host (`createRenderRoot`→`this`, styled by the global
 * `dist/ui/index.css`) with the light-DOM slot strategy: `slot="icon|
 * indeterminate-icon|label|description"` children are captured in
 * `connectedCallback`, the template renders empty `[data-mono-slot]` targets
 * (via the core's default `_renderCustomIcon`/`_renderLabelBlock`), and the
 * captured nodes are re-placed in `updated()`. All render-mode-agnostic logic
 * lives in `MonoCheckboxCore`. The shadow build (`@mono-lit/helper/ui/shadow/checkbox`)
 * shares the mixin but uses native `<slot>`. Both register `mono-checkbox`, so a
 * document loads only one.
 */
@customElement('mono-checkbox')
export class MonoCheckbox extends MonoCheckboxCore(LitElement) {
  static override styles = [unsafeCSS(checkboxCss)]

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  @state()
  private _slotsCaptured = false

  private _slotIcon: Node[] = []
  private _slotIndeterminateIcon: Node[] = []
  private _slotLabel: Node[] = []
  private _slotDescription: Node[] = []

  override connectedCallback(): void {
    super.connectedCallback()
    this._captureSlots()

    // Render synchronously so a captured named slot (and any Vue anchor beside it)
    // is re-placed within this insert rather than a microtask later; otherwise a
    // patch in that window hits a detached node and crashes Vue.
    if (this.isConnected) this.performUpdate()
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed)

    this._placeSlot('icon', this._slotIcon)
    this._placeSlot('indeterminate-icon', this._slotIndeterminateIcon)
    this._placeSlot('label', this._slotLabel)
    this._placeSlot('description', this._slotDescription)
  }

  private _captureSlots(): void {
    if (this._slotsCaptured) return

    this._slotsCaptured = true

    const captured = monoHostChildNodes(this)
    // Only the named slots we actually bucket may be detached. Removing *every*
    // captured child (the old behaviour) deleted the consumer's Vue anchors
    // (`<!--v-if-->`, zero-length Fragment text) for good — Vue's next patch then
    // walked a null anchor. Anything unslotted stays where the consumer put it.
    const capturedSlotNodes = new Set<Node>()

    for (const node of captured) {
      if (!(node instanceof Element)) continue

      const slotName = node.getAttribute('slot')

      if (slotName === 'icon') {
        node.removeAttribute('slot')
        this._slotIcon.push(node)
        capturedSlotNodes.add(node)
      }

      if (slotName === 'indeterminate-icon') {
        node.removeAttribute('slot')
        this._slotIndeterminateIcon.push(node)
        capturedSlotNodes.add(node)
      }

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

    this._hasIcon = this._slotIcon.length > 0
    this._hasIndeterminateIcon = this._slotIndeterminateIcon.length > 0
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
    'mono-checkbox': MonoCheckbox
  }
}
